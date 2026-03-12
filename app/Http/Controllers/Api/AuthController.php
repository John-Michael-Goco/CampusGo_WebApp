<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\MasterUser;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * User profile payload for mobile API (step 1.5): profile screen and AR (e.g. level-up).
     * No password or internal-only fields.
     * When role is student and linked to a master record, includes student data (student_number, course, year_level, section).
     */
    private function userToArray(User $user): array
    {
        $payload = [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'points_balance' => (int) ($user->points_balance ?? 0),
            'level' => (int) ($user->level ?? 1),
            'total_xp_earned' => (int) ($user->total_xp_earned ?? 0),
            'total_completed_quests' => (int) ($user->total_completed_quests ?? 0),
            'profile_image' => $user->avatar, // full URL for display (null if not set); DB stores path in profile_image
        ];

        if ($user->role === 'student') {
            $master = $user->masterUser;
            if ($master !== null) {
                $payload['student'] = [
                    'student_number' => $master->school_id,
                    'first_name' => $master->first_name,
                    'last_name' => $master->last_name,
                    'course' => $master->course,
                    'year_level' => (int) $master->year_level,
                    'section' => $master->section,
                ];
            }
        }

        return $payload;
    }

    public function signin(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $token = $user->createToken($request->input('device_name', 'api'))->plainTextToken;

        ActivityLog::log($user->id, ActivityLog::ACTION_AUTH_SIGNIN, 'Signed in via API');

        return response()->json([
            'token' => $token,
            'token_type' => 'Bearer',
            'user' => $this->userToArray($user),
        ]);
    }

    public function signup(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'student_number' => 'required|string',
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'course' => 'required|string|max:255',
            'year_level' => 'required|integer|min:1|max:10',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
        ]);

        $student = MasterUser::where('role', 'student')
            ->where('school_id', $validated['student_number'])
            ->first();

        if (! $student) {
            throw ValidationException::withMessages([
                'student_number' => ['Student number not found in masterlist.'],
            ]);
        }

        if ($student->is_registered) {
            throw ValidationException::withMessages([
                'student_number' => ['This student number is already registered.'],
            ]);
        }

        if (strcasecmp(trim($student->first_name), trim($validated['first_name'])) !== 0
            || strcasecmp(trim($student->last_name), trim($validated['last_name'])) !== 0
            || strcasecmp(trim($student->course ?? ''), trim($validated['course'])) !== 0
            || (int) $student->year_level !== (int) $validated['year_level']) {
            throw ValidationException::withMessages([
                'student_number' => ['Student details do not match the masterlist.'],
            ]);
        }

        $user = User::create([
            'master_user_id' => $student->id,
            'name' => trim($validated['last_name'] . ', ' . $validated['first_name']),
            'email' => $validated['email'],
            'password' => $validated['password'],
            'role' => 'student',
        ]);

        $student->update(['is_registered' => true]);

        ActivityLog::log($user->id, ActivityLog::ACTION_AUTH_SIGNUP, sprintf('Registered via API (%s)', $user->email));

        $token = $user->createToken($request->input('device_name', 'api'))->plainTextToken;

        return response()->json([
            'token' => $token,
            'token_type' => 'Bearer',
            'user' => $this->userToArray($user),
        ]);
    }

    public function signout(Request $request): JsonResponse
    {
        $user = $request->user();

        ActivityLog::log($user->id, ActivityLog::ACTION_AUTH_SIGNOUT, 'Signed out via API');

        $user->currentAccessToken()->delete();

        return response()->json(['message' => 'Signed out successfully.']);
    }

    public function user(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user instanceof User) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        return response()->json($this->userToArray($user));
    }

    /**
     * Change the authenticated user's password.
     */
    public function updatePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => ['required', 'string', 'current_password'],
            'password' => ['required', 'string', Password::default(), 'confirmed'],
        ]);

        $user = $request->user();
        $user->update(['password' => $request->password]);

        ActivityLog::log($user->id, ActivityLog::ACTION_PASSWORD_CHANGED);

        return response()->json(['message' => 'Password updated successfully.']);
    }

    /**
     * Update the authenticated user's profile picture (upload new image or remove).
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $request->validate([
            'profile_image' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif,webp', 'max:2048'],
            'remove_profile_image' => ['nullable', 'boolean'],
        ]);

        $user = $request->user();
        if (! $user instanceof User) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $changed = false;

        if (! empty($request->boolean('remove_profile_image')) && $user->profile_image) {
            Storage::disk('public')->delete($user->profile_image);
            $user->profile_image = null;
            $user->save();
            $changed = true;
        }

        if ($request->hasFile('profile_image')) {
            if ($user->profile_image) {
                Storage::disk('public')->delete($user->profile_image);
            }
            $path = $request->file('profile_image')->store('profile-images', 'public');
            $user->profile_image = $path;
            $user->save();
            $changed = true;
        }

        if ($changed) {
            ActivityLog::log($user->id, ActivityLog::ACTION_PROFILE_UPDATED, 'profile_image via API');
        }

        return response()->json([
            'message' => $changed ? 'Profile updated successfully.' : 'No changes made.',
            'user' => $this->userToArray($user->fresh()),
        ]);
    }
}
