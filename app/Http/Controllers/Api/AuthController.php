<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\StudentMasterlist;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
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

        ActivityLog::log(
            $user->id,
            'auth_signin',
            'Signed in via API'
        );

        return response()->json([
            'token' => $token,
            'token_type' => 'Bearer',
            'user' => $user,
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

        $student = StudentMasterlist::where('student_number', $validated['student_number'])->first();

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
            || strcasecmp(trim($student->course), trim($validated['course'])) !== 0
            || (int) $student->year_level !== (int) $validated['year_level']) {
            throw ValidationException::withMessages([
                'student_number' => ['Student details do not match the masterlist.'],
            ]);
        }

        $user = User::create([
            'name' => $validated['last_name'] . ', ' . $validated['first_name'],
            'email' => $validated['email'],
            'password' => $validated['password'],
            'role' => 'student',
            'master_student_id' => $student->id,
        ]);

        $student->update(['is_registered' => true]);

        ActivityLog::log(
            $user->id,
            'auth_signup',
            sprintf('Registered via API (%s)', $user->email)
        );

        $token = $user->createToken($request->input('device_name', 'api'))->plainTextToken;

        return response()->json([
            'token' => $token,
            'token_type' => 'Bearer',
            'user' => $user,
        ]);
    }

    public function signout(Request $request): JsonResponse
    {
        $user = $request->user();

        ActivityLog::log(
            $user->id,
            'auth_signout',
            'Signed out via API'
        );

        $user->currentAccessToken()->delete();

        return response()->json(['message' => 'Signed out successfully.']);
    }

    public function user(Request $request): JsonResponse
    {
        return response()->json($request->user());
    }
}
