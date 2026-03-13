<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\PointTransaction;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PointsTransferController extends Controller
{
    private const MIN_TRANSFER = 10;
    private const MAX_TRANSFER = 100;

    /**
     * Search for a student by school_id (student number). Returns student details for transfer.
     * Only students can search. Used so the sender can pick a recipient.
     */
    public function search(Request $request): JsonResponse
    {
        $request->validate([
            'student_id' => ['required', 'string', 'max:255'],
        ]);

        $currentUser = $request->user();
        if ($currentUser->role !== 'student') {
            return response()->json(['message' => 'Only students can transfer points.'], 403);
        }

        $studentId = trim($request->input('student_id'));
        $user = User::where('role', 'student')
            ->where('id', '!=', $currentUser->id)
            ->whereHas('masterUser', fn ($q) => $q->where('school_id', $studentId))
            ->with('masterUser')
            ->first();

        if (!$user) {
            return response()->json(['message' => 'Student not found.'], 404);
        }

        $master = $user->masterUser;
        return response()->json([
            'student' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'school_id' => $master?->school_id,
                'first_name' => $master?->first_name,
                'last_name' => $master?->last_name,
                'course' => $master?->course,
                'year_level' => $master?->year_level,
                'section' => $master?->section,
                'points_balance' => $user->points_balance,
            ],
        ]);
    }

    /**
     * Transfer points to another student. Min 10, max 100. Only students can send.
     */
    public function transfer(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'to_user_id' => ['required', 'integer', 'exists:users,id'],
            'amount' => ['required', 'integer', 'min:' . self::MIN_TRANSFER, 'max:' . self::MAX_TRANSFER],
        ]);

        $sender = $request->user();
        if ($sender->role !== 'student') {
            throw ValidationException::withMessages([
                'amount' => ['Only students can transfer points.'],
            ]);
        }

        $receiver = User::findOrFail($validated['to_user_id']);
        if ($receiver->role !== 'student') {
            throw ValidationException::withMessages([
                'to_user_id' => ['You can only transfer to another student.'],
            ]);
        }

        if ($sender->id === $receiver->id) {
            throw ValidationException::withMessages([
                'to_user_id' => ['You cannot transfer to yourself.'],
            ]);
        }

        $amount = (int) $validated['amount'];
        if ($sender->points_balance < $amount) {
            throw ValidationException::withMessages([
                'amount' => ['Not enough points.'],
            ]);
        }

        DB::transaction(function () use ($sender, $receiver, $amount): void {
            PointTransaction::create([
                'user_id' => $sender->id,
                'amount' => -$amount,
                'transaction_type' => PointTransaction::TYPE_TRANSFER_OUT,
                'reference_id' => $receiver->id,
            ]);
            PointTransaction::create([
                'user_id' => $receiver->id,
                'amount' => $amount,
                'transaction_type' => PointTransaction::TYPE_TRANSFER_IN,
                'reference_id' => $sender->id,
            ]);
            $sender->decrement('points_balance', $amount);
            $receiver->increment('points_balance', $amount);
        });

        ActivityLog::log(
            $sender->id,
            ActivityLog::ACTION_POINTS_TRANSFER_OUT,
            sprintf('%d pts to %s', $amount, $receiver->name)
        );
        ActivityLog::log(
            $receiver->id,
            ActivityLog::ACTION_POINTS_TRANSFER_IN,
            sprintf('%d pts from %s', $amount, $sender->name)
        );

        $sender->refresh();

        return response()->json([
            'message' => 'Points transferred successfully.',
            'points_balance' => $sender->points_balance,
            'transferred' => [
                'to_user_id' => $receiver->id,
                'to_name' => $receiver->name,
                'amount' => $amount,
            ],
        ]);
    }
}
