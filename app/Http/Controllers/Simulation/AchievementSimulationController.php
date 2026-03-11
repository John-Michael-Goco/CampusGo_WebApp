<?php

namespace App\Http\Controllers\Simulation;

use App\Http\Controllers\Controller;
use App\Models\Achievement;
use App\Models\ActivityLog;
use App\Models\QuestParticipant;
use App\Models\User;
use App\Models\UserAchievement;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class AchievementSimulationController extends Controller
{
    /**
     * Show the simulation achievements page with user stats and achievements.
     */
    public function index(Request $request): Response
    {
        $user = Auth::user();
        if (! $user instanceof User) {
            abort(403);
        }
        $user->load(['userAchievements.achievement']);

        $earnedIds = $user->userAchievements->pluck('achievement_id')->toArray();
        $allAchievements = Achievement::orderBy('requirement_type')->orderBy('requirement_value')->get();

        $stats = [
            'level' => (int) $user->level,
            'total_completed_quests' => (int) $user->total_completed_quests,
            'quests_won' => (int) ($user->quests_won ?? 0),
        ];

        $earned = $user->userAchievements->map(fn ($ua) => [
            'id' => $ua->id,
            'earned_at' => $ua->earned_at?->toIso8601String(),
            'achievement' => $ua->achievement ? [
                'id' => $ua->achievement->id,
                'name' => $ua->achievement->name,
                'description' => $ua->achievement->description,
                'requirement_type' => $ua->achievement->requirement_type,
                'requirement_value' => $ua->achievement->requirement_value,
            ] : null,
        ])->values()->all();

        return Inertia::render('simulation/achievements', [
            'stats' => $stats,
            'earnedAchievements' => $earned,
            'allAchievements' => $allAchievements,
            'earnedIds' => $earnedIds,
            'unlockedAchievement' => $request->session()->get('unlocked_achievement'),
        ]);
    }

    /**
     * Simulate level up; check and award any newly unlocked achievement. Redirects back with flash.
     */
    public function simulateLevelUp(Request $request): RedirectResponse
    {
        $user = Auth::user();
        if (! $user instanceof User) {
            abort(403);
        }
        $user->increment('level');
        $user->refresh();
        $unlocked = $this->checkAndAwardAchievements($user);
        return $this->redirectWithUnlocked($unlocked);
    }

    /**
     * Simulate winning a quest; check and award any newly unlocked achievement.
     */
    public function simulateQuestWin(Request $request): RedirectResponse
    {
        $user = Auth::user();
        if (! $user instanceof User) {
            abort(403);
        }
        $user->increment('quests_won');
        $user->refresh();
        $unlocked = $this->checkAndAwardAchievements($user);
        return $this->redirectWithUnlocked($unlocked);
    }

    /**
     * Simulate quest participation (complete a quest); check and award any newly unlocked achievement.
     */
    public function simulateQuestParticipation(Request $request): RedirectResponse
    {
        $user = Auth::user();
        if (! $user instanceof User) {
            abort(403);
        }
        $user->increment('total_completed_quests');
        $user->refresh();
        $unlocked = $this->checkAndAwardAchievements($user);
        return $this->redirectWithUnlocked($unlocked);
    }

    /**
     * Check all achievements user doesn't have; award first one that is now satisfied. Returns that achievement or null.
     */
    private function checkAndAwardAchievements(User $user): ?Achievement
    {
        $earnedIds = UserAchievement::where('user_id', $user->id)->pluck('achievement_id')->toArray();
        $candidates = Achievement::whereNotIn('id', $earnedIds)->orderBy('id')->get();

        foreach ($candidates as $achievement) {
            $met = false;
            switch ($achievement->requirement_type) {
                case 'quest_count':
                    $met = $user->total_completed_quests >= $achievement->requirement_value;
                    break;
                case 'level':
                    $met = $user->level >= $achievement->requirement_value;
                    break;
                case 'quest_win':
                    $met = ($user->quests_won ?? 0) >= $achievement->requirement_value;
                    break;
                case 'complete_quest':
                    $met = QuestParticipant::where('user_id', $user->id)
                        ->where('quest_id', $achievement->requirement_value)
                        ->where('status', 'winner')
                        ->exists();
                    break;
            }
            if ($met) {
                $userAchievement = UserAchievement::firstOrCreate(
                    [
                        'user_id' => $user->id,
                        'achievement_id' => $achievement->id,
                    ],
                    ['earned_at' => now()]
                );
                if ($userAchievement->wasRecentlyCreated) {
                    ActivityLog::log(
                        $user->id,
                        ActivityLog::ACTION_ACHIEVEMENT_EARNED,
                        sprintf('%s (id %s)', $achievement->name, $achievement->id)
                    );
                }
                return $achievement;
            }
        }
        return null;
    }

    private function redirectWithUnlocked(?Achievement $unlocked): RedirectResponse
    {
        $payload = null;
        if ($unlocked) {
            $payload = [
                'id' => $unlocked->id,
                'name' => $unlocked->name,
                'description' => $unlocked->description,
                'requirement_type' => $unlocked->requirement_type,
                'requirement_value' => $unlocked->requirement_value,
            ];
        }
        return redirect()
            ->route('simulation.achievements')
            ->with('unlocked_achievement', $payload);
    }
}
