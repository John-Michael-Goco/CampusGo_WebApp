<?php

namespace App\Http\Controllers\Simulation;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class UserDetailsController extends Controller
{
    private const PROFILE_IMAGE_DIR = 'profile-images';

    /**
     * Update the current user's profile image (simulation).
     */
    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'profile_image' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif,webp', 'max:2048'],
            'remove_profile_image' => ['nullable', 'boolean'],
        ]);

        $user = $request->user();

        if (! empty($validated['remove_profile_image']) && $user->profile_image) {
            Storage::disk('public')->delete($user->profile_image);
            $user->profile_image = null;
        }

        if (isset($validated['profile_image']) && $validated['profile_image']) {
            if ($user->profile_image) {
                Storage::disk('public')->delete($user->profile_image);
            }
            $path = $validated['profile_image']->store(self::PROFILE_IMAGE_DIR, 'public');
            $user->profile_image = $path;
        }

        $user->save();

        return back();
    }
    /**
     * Show the current user's details (simulation screen, display only).
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $user->load('masterUser:id,school_id,first_name,last_name,course,year_level,section');

        $master = $user->masterUser;

        return Inertia::render('simulation/user-details', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'avatar' => $user->avatar,
                'points_balance' => (int) $user->points_balance,
                'level' => (int) $user->level,
                'total_completed_quests' => (int) $user->total_completed_quests,
                'quests_won' => (int) $user->quests_won,
                'total_xp_earned' => (int) $user->total_xp_earned,
                'school_id' => $master?->school_id,
                'first_name' => $master?->first_name,
                'last_name' => $master?->last_name,
                'course' => $master?->course,
                'year_level' => $master?->year_level,
                'section' => $master?->section,
            ],
        ]);
    }
}
