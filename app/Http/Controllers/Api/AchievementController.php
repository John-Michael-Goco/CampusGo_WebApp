<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Achievement;
use App\Models\User;
use App\Models\UserAchievement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AchievementController extends Controller
{
    /**
     * List all achievement definitions. When authenticated, include earned state and earned_at per achievement.
     */
    public function index(Request $request): JsonResponse
    {
        $achievements = Achievement::query()
            ->orderBy('requirement_type')
            ->orderBy('requirement_value')
            ->get();

        $user = $request->user();
        $earnedMap = [];
        if ($user instanceof User) {
            $earned = UserAchievement::where('user_id', $user->id)
                ->get()
                ->keyBy('achievement_id');
            foreach ($earned as $ua) {
                $earnedMap[$ua->achievement_id] = [
                    'earned' => true,
                    'earned_at' => $ua->earned_at?->toDateTimeString(),
                ];
            }
        }

        $items = $achievements->map(function (Achievement $a) use ($earnedMap) {
            $row = [
                'id' => $a->id,
                'name' => $a->name,
                'description' => $a->description,
                'requirement_type' => $a->requirement_type,
                'requirement_value' => (int) $a->requirement_value,
                'image_url' => null,
            ];
            if (isset($earnedMap[$a->id])) {
                $row['earned'] = true;
                $row['earned_at'] = $earnedMap[$a->id]['earned_at'];
            } else {
                $row['earned'] = false;
                $row['earned_at'] = null;
            }
            return $row;
        });

        return response()->json(['achievements' => $items->values()->all()]);
    }

    /**
     * List achievements the authenticated user has earned (for profile "My achievements" or AR after unlock).
     */
    public function userAchievements(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user instanceof User) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $list = UserAchievement::where('user_id', $user->id)
            ->with('achievement')
            ->orderByDesc('earned_at')
            ->get()
            ->map(function (UserAchievement $ua) {
                $a = $ua->achievement;
                return [
                    'user_achievement_id' => $ua->id,
                    'achievement_id' => $ua->achievement_id,
                    'name' => $a?->name,
                    'description' => $a?->description,
                    'requirement_type' => $a?->requirement_type,
                    'requirement_value' => $a ? (int) $a->requirement_value : null,
                    'earned_at' => $ua->earned_at?->toDateTimeString(),
                ];
            })
            ->values()
            ->all();

        return response()->json(['achievements' => $list]);
    }
}
