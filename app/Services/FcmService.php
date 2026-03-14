<?php

namespace App\Services;

use App\Models\FcmToken;
use Firebase\JWT\JWT;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FcmService
{
    private ?string $accessToken = null;

    private ?array $credentials = null;

    /**
     * Get OAuth2 access token using service account credentials (JWT bearer grant).
     */
    public function getAccessToken(): ?string
    {
        if ($this->accessToken !== null) {
            return $this->accessToken;
        }

        $credentials = $this->getCredentials();
        if ($credentials === null) {
            return null;
        }

        $now = time();
        $payload = [
            'iss' => $credentials['client_email'],
            'sub' => $credentials['client_email'],
            'aud' => 'https://oauth2.googleapis.com/token',
            'iat' => $now,
            'exp' => $now + 3600,
            'scope' => 'https://www.googleapis.com/auth/firebase.messaging',
        ];

        try {
            $jwt = JWT::encode($payload, $credentials['private_key'], 'RS256');
        } catch (\Throwable $e) {
            Log::warning('FCM: Failed to encode JWT', ['error' => $e->getMessage()]);

            return null;
        }

        $response = Http::asForm()->post('https://oauth2.googleapis.com/token', [
            'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            'assertion' => $jwt,
        ]);

        if (! $response->successful()) {
            Log::warning('FCM: Failed to get access token', ['body' => $response->body()]);

            return null;
        }

        $this->accessToken = $response->json('access_token');

        return $this->accessToken;
    }

    /**
     * Send a data + notification message to a single FCM token.
     * All data values must be strings (FCM requirement).
     *
     * @param  array<string, string>  $data
     * @return bool True if sent successfully; false otherwise (invalid token will be removed if tokenId given)
     */
    public function send(string $token, array $data, ?string $title = null, ?string $body = null, ?int $tokenId = null): bool
    {
        $accessToken = $this->getAccessToken();
        if ($accessToken === null) {
            return false;
        }

        $projectId = config('fcm.project_id') ?? $this->getCredentials()['project_id'] ?? null;
        if ($projectId === null) {
            Log::warning('FCM: No project_id in config or credentials');

            return false;
        }

        $message = [
            'token' => $token,
            'data' => $data,
        ];
        if ($title !== null || $body !== null) {
            $message['notification'] = array_filter([
                'title' => $title,
                'body' => $body,
            ]);
        }

        $response = Http::withToken($accessToken)
            ->post("https://fcm.googleapis.com/v1/projects/{$projectId}/messages:send", [
                'message' => $message,
            ]);

        if ($response->successful()) {
            return true;
        }

        $error = $response->json('error');
        $code = is_array($error)
            ? ($error['details'][0]['errorCode'] ?? $error['status'] ?? $error['code'] ?? null)
            : null;
        $messageText = is_array($error) ? ($error['message'] ?? $response->body()) : $response->body();

        $isInvalidToken = $tokenId !== null && in_array($code, ['UNREGISTERED', 'INVALID_ARGUMENT', 'NOT_FOUND'], true);
        if ($isInvalidToken) {
            FcmToken::where('id', $tokenId)->delete();
            Log::info('FCM: Removed invalid/expired token', ['token_id' => $tokenId, 'code' => $code]);
        } else {
            Log::warning('FCM: Send failed', ['code' => $code, 'message' => $messageText]);
        }

        return false;
    }

    /**
     * Send ranking_resolved notification to the user who owns the participant.
     */
    public function sendRankingResolved(int $participantId, int $questId, string $questTitle, string $outcome, string $message): void
    {
        $participant = \App\Models\QuestParticipant::with('user.fcmTokens')->find($participantId);
        if ($participant === null || $participant->user === null) {
            return;
        }

        $data = [
            'type' => 'ranking_resolved',
            'participant_id' => (string) $participantId,
            'quest_id' => (string) $questId,
            'quest_title' => $questTitle,
            'outcome' => $outcome,
            'message' => $message,
        ];

        $title = 'Quest Update';
        $body = $message;

        foreach ($participant->user->fcmTokens as $fcmToken) {
            $this->send($fcmToken->fcm_token, $data, $title, $body, $fcmToken->id);
        }
    }

    /**
     * Send stage_unlocked notification to the given user's devices.
     */
    public function sendStageUnlocked(\App\Models\User $user, int $participantId, int $questId, string $questTitle, int $stageNumber, string $locationHint): void
    {
        $data = [
            'type' => 'stage_unlocked',
            'participant_id' => (string) $participantId,
            'quest_id' => (string) $questId,
            'quest_title' => $questTitle,
            'stage_number' => (string) $stageNumber,
            'location_hint' => $locationHint,
        ];

        $title = 'Stage Unlocked';
        $body = "Stage {$stageNumber} is now open for {$questTitle}!";

        $user->load('fcmTokens');
        foreach ($user->fcmTokens as $fcmToken) {
            $this->send($fcmToken->fcm_token, $data, $title, $body, $fcmToken->id);
        }
    }

    /**
     * Send new_store_items to all users with FCM tokens (or batch in chunks).
     */
    public function sendNewStoreItem(int $itemId, string $itemName): void
    {
        $data = [
            'type' => 'new_store_items',
            'item_id' => (string) $itemId,
            'item_name' => $itemName,
        ];

        $title = 'New in Store';
        $body = "{$itemName} is now available in the store!";

        FcmToken::query()->chunk(500, function ($tokens) use ($data, $title, $body) {
            foreach ($tokens as $fcmToken) {
                $this->send($fcmToken->fcm_token, $data, $title, $body, $fcmToken->id);
            }
        });
    }

    /**
     * Send new_quest to target users (all enrolled or by target groups).
     */
    public function sendNewQuest(\App\Models\Quest $quest): void
    {
        $userIds = $this->resolveQuestTargetUserIds($quest);
        if ($userIds === []) {
            return;
        }

        $data = [
            'type' => 'new_quest',
            'quest_id' => (string) $quest->id,
            'quest_title' => $quest->title,
            'quest_type' => $quest->quest_type ?? 'event',
            'status' => $quest->status ?? 'upcoming',
        ];

        $title = 'New Quest Available';
        $body = "{$quest->title} is now available! Scan a QR to join.";

        FcmToken::whereIn('user_id', $userIds)->chunk(500, function ($tokens) use ($data, $title, $body) {
            foreach ($tokens as $fcmToken) {
                $this->send($fcmToken->fcm_token, $data, $title, $body, $fcmToken->id);
            }
        });
    }

    /**
     * Send quest_started to target users.
     */
    public function sendQuestStarted(\App\Models\Quest $quest): void
    {
        $userIds = $this->resolveQuestTargetUserIds($quest);
        if ($userIds === []) {
            return;
        }

        $data = [
            'type' => 'quest_started',
            'quest_id' => (string) $quest->id,
            'quest_title' => $quest->title,
        ];

        $title = 'Quest Started';
        $body = "{$quest->title} has started! Go scan the first QR.";

        FcmToken::whereIn('user_id', $userIds)->chunk(500, function ($tokens) use ($data, $title, $body) {
            foreach ($tokens as $fcmToken) {
                $this->send($fcmToken->fcm_token, $data, $title, $body, $fcmToken->id);
            }
        });
    }

    /**
     * Resolve user IDs to notify for a quest: no target groups = all enrolled (with tokens);
     * with target groups = users matching course/year/section from master_users, enrolled in current semester.
     */
    public function resolveQuestTargetUserIds(\App\Models\Quest $quest): array
    {
        $targetGroups = $quest->targetGroups()->get();
        if ($targetGroups->isEmpty()) {
            return FcmToken::query()->distinct()->pluck('user_id')->all();
        }

        $currentSemester = \App\Models\Semester::current();
        if ($currentSemester === null) {
            return [];
        }
        $semesterName = $currentSemester->name;

        $enrolledUserIds = \App\Models\Enrollment::where('semester', $semesterName)
            ->where('is_enrolled', true)
            ->pluck('user_id')
            ->all();

        if ($enrolledUserIds === []) {
            return [];
        }

        $userIds = [];
        foreach ($targetGroups as $tg) {
            $query = \App\Models\User::query()
                ->whereIn('id', $enrolledUserIds)
                ->whereHas('masterUser', function ($q) use ($tg) {
                    if ($tg->course !== null && $tg->course !== '') {
                        $q->where('course', $tg->course);
                    }
                    if ($tg->year_level !== null) {
                        $q->where('year_level', $tg->year_level);
                    }
                    if ($tg->section !== null && $tg->section !== '') {
                        $q->where('section', $tg->section);
                    }
                });
            $userIds = array_merge($userIds, $query->pluck('id')->all());
        }

        return array_values(array_unique($userIds));
    }

    private function getCredentials(): ?array
    {
        if ($this->credentials !== null) {
            return $this->credentials;
        }

        $path = config('fcm.credentials');
        if ($path === null || $path === '' || ! is_file($path)) {
            Log::warning('FCM: Credentials file not found', ['path' => $path]);

            return null;
        }

        $json = file_get_contents($path);
        if ($json === false) {
            return null;
        }

        $this->credentials = json_decode($json, true);
        if (! is_array($this->credentials) || empty($this->credentials['client_email']) || empty($this->credentials['private_key'])) {
            Log::warning('FCM: Invalid credentials JSON');

            return null;
        }

        return $this->credentials;
    }
}
