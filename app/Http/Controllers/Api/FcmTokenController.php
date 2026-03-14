<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FcmToken;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FcmTokenController extends Controller
{
    /**
     * PUT /api/user/fcm-token — Register or update FCM device token (after login / on token refresh).
     */
    public function update(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user instanceof User) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $validated = $request->validate([
            'fcm_token' => ['required', 'string', 'max:500'],
            'device_id' => ['nullable', 'string', 'max:255'],
        ]);

        $fcmToken = trim($validated['fcm_token']);
        if ($fcmToken === '') {
            return response()->json(['message' => 'The fcm token field is required.'], 422);
        }

        $deviceId = isset($validated['device_id']) ? trim($validated['device_id']) : null;

        // If same fcm_token already exists (any user), update user_id to current user (device can only belong to one user).
        $existing = FcmToken::where('fcm_token', $fcmToken)->first();
        if ($existing !== null) {
            $existing->update([
                'user_id' => $user->id,
                'device_id' => $deviceId,
                'updated_at' => now(),
            ]);
            return response()->json(['message' => 'Token registered.']);
        }

        // If same device_id exists for this user, replace the token.
        if ($deviceId !== null && $deviceId !== '') {
            $byDevice = FcmToken::where('user_id', $user->id)->where('device_id', $deviceId)->first();
            if ($byDevice !== null) {
                $byDevice->update([
                    'fcm_token' => $fcmToken,
                    'updated_at' => now(),
                ]);
                return response()->json(['message' => 'Token registered.']);
            }
        }

        // New token for this user.
        FcmToken::create([
            'user_id' => $user->id,
            'fcm_token' => $fcmToken,
            'device_id' => $deviceId,
        ]);

        return response()->json(['message' => 'Token registered.']);
    }

    /**
     * DELETE /api/user/fcm-token — Remove FCM token on logout.
     */
    public function destroy(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user instanceof User) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $validated = $request->validate([
            'fcm_token' => ['required', 'string', 'max:500'],
        ]);

        $fcmToken = trim($validated['fcm_token']);
        FcmToken::where('user_id', $user->id)->where('fcm_token', $fcmToken)->delete();

        return response()->json(['message' => 'Token removed.']);
    }
}
