<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileDeleteRequest;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use App\Models\ActivityLog;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    private const PROFILE_IMAGE_DIR = 'profile-images';

    /**
     * Show the user's profile settings page.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('settings/profile', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $user = $request->user();
        $data = $request->validated();

        $changedFields = [];

        if (! empty($data['remove_profile_image']) && $user->profile_image) {
            Storage::disk('public')->delete($user->profile_image);
            $user->profile_image = null;
            $changedFields[] = 'profile_image_removed';
        }

        if (isset($data['profile_image']) && $data['profile_image']) {
            if ($user->profile_image) {
                Storage::disk('public')->delete($user->profile_image);
            }
            $path = $data['profile_image']->store(self::PROFILE_IMAGE_DIR, 'public');
            $user->profile_image = $path;
            $changedFields[] = 'profile_image';
        }

        unset($data['profile_image'], $data['remove_profile_image']);

        // Track which basic fields were changed
        $user->fill($data);
        foreach (['name', 'email'] as $field) {
            if ($user->isDirty($field)) {
                $changedFields[] = $field;
            }
        }

        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        $user->save();

        if ($changedFields !== []) {
            $detail = 'fields: ' . implode(', ', array_unique($changedFields));
            ActivityLog::log($user->id, ActivityLog::ACTION_PROFILE_UPDATED, $detail);
        }

        return back();
    }

    /**
     * Delete the user's profile.
     */
    public function destroy(ProfileDeleteRequest $request): RedirectResponse
    {
        $user = $request->user();

        ActivityLog::log($user->id, ActivityLog::ACTION_USER_DELETED, sprintf('Self-deleted account (%s)', $user->email));

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
