<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Simulation\QuestParticipationController as SimulationQuestParticipationController;
use App\Models\Achievement;
use App\Models\ActivityLog;
use App\Models\Quest;
use App\Models\QuestParticipant;
use App\Models\User;
use App\Models\UserAchievement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class ParticipantController extends Controller
{
    /**
     * Get play state for a participant (step 2.2). Returns everything the app needs to render
     * the current step: stage info, questions if MCQ, status, next-step hints, can_quit.
     */
    public function play(Request $request, int $participantId): JsonResponse
    {
        $user = $request->user();
        if (!$user instanceof User) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $participant = QuestParticipant::where('id', $participantId)
            ->where('user_id', $user->id)
            ->with(['quest.stages' => fn ($q) => $q->orderBy('stage_number'), 'quest.stages.questions.choices', 'submissions'])
            ->first();

        if (!$participant) {
            return response()->json(['message' => 'Participation not found.'], 404);
        }

        $simulation = app(SimulationQuestParticipationController::class);
        $simulation->tryRunEliminationRankingIfReady($participant);
        $participant->refresh();
        $participant->load(['quest.stages' => fn ($q) => $q->orderBy('stage_number'), 'quest.stages.questions.choices', 'submissions']);

        return response()->json($this->buildPlayStatePayload($participant));
    }

    /**
     * Lightweight participant status (step 3.1). For polling "waiting for results" after elimination submit.
     * Returns only status, current_stage, and outcome so the app can poll without the full play-state payload.
     */
    public function status(Request $request, int $participantId): JsonResponse
    {
        $user = $request->user();
        if (!$user instanceof User) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $participant = QuestParticipant::where('id', $participantId)
            ->where('user_id', $user->id)
            ->first();

        if (!$participant) {
            return response()->json(['message' => 'Participation not found.'], 404);
        }

        $simulation = app(SimulationQuestParticipationController::class);
        $simulation->tryRunEliminationRankingIfReady($participant);
        $participant->refresh();

        $payload = [
            'participant_id' => $participant->id,
            'status' => $participant->status,
            'current_stage' => $participant->current_stage,
            'awaiting_ranking' => $participant->status === 'awaiting_ranking',
        ];

        if ($participant->status === 'awaiting_ranking') {
            $payload['outcome'] = null;
        } elseif (in_array($participant->status, ['active'], true)) {
            $payload['outcome'] = 'advanced';
        } elseif (in_array($participant->status, ['winner'], true)) {
            $payload['outcome'] = 'completed';
        } elseif ($participant->status === 'eliminated') {
            $payload['outcome'] = 'eliminated';
        } else {
            $payload['outcome'] = $participant->status;
        }

        return response()->json($payload);
    }

    /**
     * Submit answer(s) for MCQ or stage completion for QR (step 2.3).
     * Body: either "answers" ([{ question_id, choice_id } or { question_id, answer }]) or "stage_completed": true for QR.
     * Returns same shape as play state plus outcome, message, passed, failed, awaiting_ranking, rewards when completed.
     */
    public function submit(Request $request, int $participantId): JsonResponse
    {
        $idempotencyKey = $request->header('Idempotency-Key');
        if ($idempotencyKey !== null && $idempotencyKey !== '') {
            $cached = Cache::get('idempotency:submit:' . $idempotencyKey);
            if ($cached !== null && is_array($cached)) {
                return response()->json($cached['body'], $cached['status'] ?? 200);
            }
        }

        $user = $request->user();
        if (!$user instanceof User) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $participant = QuestParticipant::where('id', $participantId)
            ->where('user_id', $user->id)
            ->with(['quest.stages' => fn ($q) => $q->orderBy('stage_number'), 'quest.stages.questions.choices', 'submissions'])
            ->first();

        if (!$participant) {
            return response()->json(['message' => 'Participation not found.'], 404);
        }

        if ($participant->status !== 'active') {
            return response()->json(['message' => 'You are no longer active in this quest.'], 403);
        }

        $quest = $participant->quest;
        $stages = $quest->stages;
        $currentStage = $stages->firstWhere('stage_number', $participant->current_stage);
        if (!$currentStage) {
            return response()->json(['message' => 'Current stage not found.'], 400);
        }

        // No stage_start = stage is always unlocked (open automatically)
        $stageNotYetOpen = $currentStage->stage_start && now()->lt($currentStage->stage_start);
        if ($stageNotYetOpen) {
            return response()->json(['message' => 'This stage is not open yet.'], 403);
        }

        // Block submit if quest already has a winner (QR elimination last-stage: first to scan wins)
        $questHasWinner = QuestParticipant::where('quest_id', $quest->id)
            ->where('status', 'winner')
            ->exists();
        if ($questHasWinner && $participant->status !== 'winner') {
            $participant->update(['status' => 'eliminated']);
            $participant->refresh();
            return response()->json([
                'outcome' => 'eliminated',
                'message' => 'This quest already has a winner.',
                'passed' => false,
                'failed' => true,
                'rewards' => null,
            ]);
        }

        $stageQuestionIds = $currentStage->questions->pluck('id')->toArray();
        $alreadySubmittedIds = $participant->submissions->pluck('question_id')->toArray();

        $answers = [];
        $isStageCompletedRequest = $request->boolean('stage_completed');
        if ($isStageCompletedRequest) {
            if (($quest->question_type ?? 'multiple_choice') !== 'qr_scan') {
                return response()->json(['message' => 'stage_completed is only for QR scan quests.'], 400);
            }
            $allStageAlreadySubmitted = $stageQuestionIds !== [] && array_diff($stageQuestionIds, $alreadySubmittedIds) === [];
            if ($allStageAlreadySubmitted) {
                return $this->returnIdempotentSubmitResponse($participant, $idempotencyKey);
            }
            foreach ($currentStage->questions as $q) {
                $answers[] = ['question_id' => $q->id, 'answer' => 'scanned'];
            }
        } else {
            $raw = $request->input('answers', $request->only(['question_id', 'choice_id']));
            if (!is_array($raw)) {
                return response()->json(['message' => 'Send answers array or stage_completed for QR.'], 400);
            }
            $list = isset($raw['question_id']) ? [$raw] : $raw;
            $seen = [];
            $hadValidQuestion = false;
            foreach ($list as $a) {
                $qid = isset($a['question_id']) ? (int) $a['question_id'] : null;
                if ($qid === null) {
                    continue;
                }
                if (isset($seen[$qid])) {
                    return response()->json(['message' => 'Duplicate question_id in request.'], 400);
                }
                $seen[$qid] = true;
                if (!in_array($qid, $stageQuestionIds)) {
                    return response()->json(['message' => 'Invalid question_id for this stage.'], 400);
                }
                $hadValidQuestion = true;
                if (in_array($qid, $alreadySubmittedIds)) {
                    continue;
                }
                $answer = $a['choice_id'] ?? $a['answer'] ?? '';
                if (isset($a['choice_id'])) {
                    $answer = (string) $a['choice_id'];
                }
                $answers[] = ['question_id' => $qid, 'answer' => $answer];
            }
            if (!$hadValidQuestion) {
                return response()->json(['message' => 'At least one answer or stage_completed required.'], 400);
            }
            if ($answers === [] && $hadValidQuestion) {
                return $this->returnIdempotentSubmitResponse($participant, $idempotencyKey);
            }
        }

        // Submit handler: processSubmit records each answer, then:
        // - Counts how many of the current stage's questions this participant has answered.
        // - If all questions answered → evaluates score against passing_score.
        // - If passed and last stage → sets status = "winner", awards points to user, returns outcome "completed" and rewards (points_earned = quest reward_points).
        // - If passed and more stages → increments current_stage, returns outcome "advanced".
        // - If failed → sets status = "eliminated", returns outcome "eliminated".
        $simulation = app(SimulationQuestParticipationController::class);
        $result = $simulation->processSubmit($participant, $answers);

        ActivityLog::log($user->id, ActivityLog::ACTION_QUEST_STAGE_SUBMITTED, $quest->title . ' (stage ' . $participant->current_stage . ')');

        $participant->refresh();
        $participant->load(['quest.stages' => fn ($q) => $q->orderBy('stage_number'), 'quest.stages.questions.choices', 'submissions']);

        $payload = $this->buildSubmitResponsePayload($participant, $result);
        $response = response()->json($payload);

        if ($idempotencyKey !== null && $idempotencyKey !== '') {
            Cache::put('idempotency:submit:' . $idempotencyKey, ['body' => $payload, 'status' => 200], now()->addHours(24));
        }

        return $response;
    }

    /**
     * Return 200 with current play state when submit is a duplicate (step 3.4 idempotency); optionally cache for Idempotency-Key.
     */
    private function returnIdempotentSubmitResponse(QuestParticipant $participant, ?string $idempotencyKey): JsonResponse
    {
        $participant->load(['quest.stages' => fn ($q) => $q->orderBy('stage_number'), 'quest.stages.questions.choices', 'submissions']);
        $payload = $this->buildPlayStatePayload($participant);
        $payload['outcome'] = $participant->status === 'winner' ? 'completed' : ($participant->status === 'eliminated' ? 'eliminated' : ($participant->status === 'awaiting_ranking' ? 'awaiting_ranking' : 'advanced'));
        $payload['message'] = 'Submission already recorded; no changes applied.';
        $payload['passed'] = in_array($participant->status, ['active', 'winner'], true);
        $payload['failed'] = $participant->status === 'eliminated';
        $payload['awaiting_ranking'] = $participant->status === 'awaiting_ranking';
        $payload['idempotent_replay'] = true;
        if (in_array($participant->status, ['winner'], true)) {
            $payload['rewards'] = $this->buildRewardsPayload($participant);
        } else {
            $payload['rewards'] = null;
        }
        $response = response()->json($payload);
        if ($idempotencyKey !== null && $idempotencyKey !== '') {
            Cache::put('idempotency:submit:' . $idempotencyKey, ['body' => $payload, 'status' => 200], now()->addHours(24));
        }
        return $response;
    }

    /**
     * Build the JSON payload returned after a successful submit (real or idempotent).
     * For single-stage quests (total_stages <= 1), when the user passed we always send outcome "completed" and rewards.
     */
    private function buildSubmitResponsePayload(QuestParticipant $participant, array $result): array
    {
        $payload = $this->buildPlayStatePayload($participant);
        $payload['outcome'] = $result['outcome'];
        $payload['message'] = $result['message'] ?? 'Submission recorded.';
        $payload['passed'] = in_array($result['outcome'], ['advanced', 'completed'], true);
        $payload['failed'] = $result['outcome'] === 'eliminated';
        $payload['awaiting_ranking'] = $result['outcome'] === 'awaiting_ranking';
        if (isset($result['correct'])) {
            $payload['correct_count'] = $result['correct'];
            $payload['total_count'] = $result['total'];
        }

        $totalStages = (int) ($payload['total_stages'] ?? 0);
        $singleStageQuestPassed = $totalStages <= 1 && $payload['passed'];

        if ($singleStageQuestPassed) {
            $payload['outcome'] = 'completed';
            $payload['quest_completed'] = true;
            $payload['eliminated'] = false;
            $payload['rewards'] = $this->buildRewardsPayload($participant);
        } elseif ($participant->status === 'winner' || $participant->status === 'completed') {
            $payload['rewards'] = $this->buildRewardsPayload($participant);
        } else {
            $payload['rewards'] = null;
        }
        return $payload;
    }

    /**
     * Build rich rewards payload for completed/winner participant (step 3.2): level_up, achievements, custom_prize, points_earned.
     */
    private function buildRewardsPayload(QuestParticipant $participant): ?array
    {
        $quest = $participant->quest;
        if (!$quest) {
            return null;
        }
        $user = $participant->user ?? User::find($participant->user_id);
        if (!$user) {
            return [
                'points_earned' => (int) $quest->reward_points,
                'custom_prize' => $quest->reward_custom_prize,
                'level_up' => false,
                'previous_level' => null,
                'new_level' => null,
                'achievements' => [],
            ];
        }
        $user->refresh();
        $pointsEarned = (int) $quest->reward_points;
        $previousLevel = (int) floor(((int) $user->total_xp_earned - $pointsEarned) / 100);
        $newLevel = (int) $user->level;
        $levelUp = $newLevel > $previousLevel;

        $questAchievementIds = Achievement::where('requirement_type', Achievement::REQUIREMENT_TYPE_COMPLETE_QUEST)
            ->where('requirement_value', $quest->id)
            ->pluck('id');
        $earned = $questAchievementIds->isEmpty() ? collect() : UserAchievement::where('user_id', $user->id)
            ->whereIn('achievement_id', $questAchievementIds)
            ->with('achievement')
            ->get();
        $achievements = $earned->map(function (UserAchievement $ua) {
            $a = $ua->achievement;
            return [
                'id' => $a->id,
                'name' => $a->name,
                'description' => $a->description ?? null,
                'image_url' => null,
            ];
        })->values()->all();

        return [
            'points_earned' => $pointsEarned,
            'custom_prize' => $quest->reward_custom_prize,
            'level_up' => $levelUp,
            'previous_level' => $levelUp ? $previousLevel : null,
            'new_level' => $newLevel,
            'achievements' => $achievements,
        ];
    }

    /**
     * Quit the quest (step 2.4). Only allowed when active or awaiting_ranking.
     * Blocked if quitting would leave the quest below the current stage's minimum_participants.
     */
    public function quit(Request $request, int $participantId): JsonResponse
    {
        $user = $request->user();
        if (!$user instanceof User) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $participant = QuestParticipant::where('id', $participantId)
            ->where('user_id', $user->id)
            ->with('quest.stages')
            ->first();

        if (!$participant) {
            return response()->json(['message' => 'Participation not found.'], 404);
        }

        if (!in_array($participant->status, ['active', 'awaiting_ranking'], true)) {
            return response()->json(['message' => 'You can only quit while the quest is in progress.'], 403);
        }

        $quest = $participant->quest;
        $stages = $quest->stages->sortBy('stage_number')->values();
        $currentStage = $stages->firstWhere('stage_number', $participant->current_stage);
        $minParticipants = $currentStage ? (int) $currentStage->minimum_participants : 0;
        // Participant count: quests.current_participants (incremented on join, decremented on quit only).
        $currentParticipants = (int) $quest->current_participants;
        $isDaily = ($quest->quest_type ?? '') === 'daily';

        // Daily quests: always allow quit (user can take the quest again). Others: block if below minimum.
        if (!$isDaily && $currentParticipants - 1 < $minParticipants) {
            return response()->json(['message' => 'Quitting would leave the quest below the minimum participants for this stage.'], 403);
        }

        DB::transaction(function () use ($participant, $quest) {
            $participant->update(['status' => 'quit']);
            Quest::where('id', $quest->id)->where('current_participants', '>', 0)->decrement('current_participants');
        });

        ActivityLog::log($user->id, ActivityLog::ACTION_QUEST_QUIT, $quest->title);

        return response()->json(['ok' => true, 'message' => 'You have left the quest.']);
    }

    /**
     * Build play-state payload for a participant (used by play() and submit() response).
     * Always includes total_stages (int) so the app can tell single-stage from multi-stage (e.g. show rewards vs "You advanced").
     */
    private function buildPlayStatePayload(QuestParticipant $participant): array
    {
        $quest = $participant->quest;
        if (!$quest) {
            $quest = Quest::find($participant->quest_id);
        }
        $stages = $quest ? $quest->stages : collect();
        $totalStages = $quest ? (int) ($stages->isNotEmpty() ? $stages->count() : $quest->stages()->count()) : 0;
        $currentStageNumber = $participant->current_stage;
        $currentStage = $stages->firstWhere('stage_number', $currentStageNumber);

        $minParticipants = $currentStage ? (int) $currentStage->minimum_participants : 0;
        $currentParticipants = $quest ? (int) $quest->current_participants : 0;
        $isDaily = $quest && ($quest->quest_type ?? '') === 'daily';
        $canQuit = in_array($participant->status, ['active', 'awaiting_ranking'], true)
            && ($isDaily || $currentParticipants - 1 >= $minParticipants);
        $quitGuardReason = (!$canQuit && in_array($participant->status, ['active', 'awaiting_ranking'], true))
            ? 'Quitting would leave the quest below the minimum participants for this stage.'
            : null;

        $payload = [
            'participant_id' => $participant->id,
            'quest_id' => $participant->quest_id,
            'current_stage' => $participant->current_stage,
            'status' => $participant->status,
            'can_quit' => $canQuit,
            'quit_guard_reason' => $quitGuardReason,
            'total_stages' => $totalStages,
            'question_type' => $quest ? ($quest->question_type ?? 'multiple_choice') : 'multiple_choice',
            'is_elimination' => $quest ? (bool) $quest->is_elimination : false,
        ];

        if ($participant->status === 'awaiting_ranking') {
            $payload['awaiting_ranking'] = true;
            $payload['message'] = $payload['message'] ?? 'Waiting for results. You will advance or be eliminated based on your score.';
        }

        if (in_array($participant->status, ['completed', 'eliminated', 'winner'], true)) {
            $payload['quest_completed'] = in_array($participant->status, ['completed', 'winner'], true);
            $payload['eliminated'] = $participant->status === 'eliminated';
            $payload['outcome'] = $participant->status === 'winner' ? 'completed' : ($participant->status === 'eliminated' ? 'eliminated' : 'completed');
            $payload['rewards'] = in_array($participant->status, ['completed', 'winner'], true)
                ? $this->buildRewardsPayload($participant)
                : null;
        }

        $stageLocked = false;
        $nextStageOpensAt = null;
        $nextStageNumber = null;

        if ($currentStage) {
            // No stage_start = stage is always unlocked (open automatically)
            $stageNotYetOpen = $currentStage->stage_start && now()->lt($currentStage->stage_start);
            if ($stageNotYetOpen) {
                $stageLocked = true;
                $nextStageOpensAt = $currentStage->stage_start->toDateTimeString();
                $nextStageNumber = $currentStage->stage_number;
            }
        }

        $payload['stage_locked'] = $stageLocked;
        if ($stageLocked) {
            $payload['next_stage_opens_at'] = $nextStageOpensAt;
            $payload['next_stage_number'] = $nextStageNumber;
        }

        $stagePayload = null;
        if ($currentStage && !$stageLocked) {
            $stagePayload = [
                'id' => $currentStage->id,
                'stage_number' => $currentStage->stage_number,
                'location_hint' => $currentStage->location_hint,
                'stage_deadline' => $currentStage->stage_deadline?->toDateTimeString(),
                'stage_start' => $currentStage->stage_start?->toDateTimeString(),
                'question_type' => $quest->question_type ?? 'multiple_choice',
                'passing_score' => (int) ($currentStage->passing_score ?? 0),
            ];

            $questionType = $quest->question_type ?? 'multiple_choice';
            if ($questionType === 'multiple_choice' && $currentStage->relationLoaded('questions')) {
                $answeredQuestionIds = $participant->submissions->pluck('question_id')->toArray();
                $stagePayload['questions'] = $currentStage->questions->map(function ($q) use ($answeredQuestionIds) {
                    return [
                        'id' => $q->id,
                        'question_text' => $q->question_text,
                        'question_type' => $q->question_type ?? 'multiple_choice',
                        'already_answered' => in_array($q->id, $answeredQuestionIds),
                        'choices' => $q->choices->sortBy('sort_order')->values()->map(fn ($c) => [
                            'id' => $c->id,
                            'choice_text' => $c->choice_text,
                        ])->all(),
                    ];
                })->values()->all();
            } else {
                $stagePayload['questions'] = [];
            }
        }
        $payload['stage'] = $stagePayload;

        if (!$stageLocked && $currentStage && in_array($participant->status, ['active', 'awaiting_ranking'], true)) {
            $nextStage = $stages->firstWhere('stage_number', $currentStageNumber + 1);
            if ($nextStage) {
                $payload['next_stage_location_hint'] = $nextStage->location_hint;
                $payload['next_stage_number'] = $nextStage->stage_number;
                $payload['next_stage_starts_at'] = $nextStage->stage_start?->toDateTimeString();
            }
        }

        return $payload;
    }
}
