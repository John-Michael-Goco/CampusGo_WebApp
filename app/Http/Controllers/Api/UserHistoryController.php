<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\PointTransaction;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserHistoryController extends Controller
{
    private const TRANSACTION_TYPE_LABELS = [
        PointTransaction::TYPE_QUEST_REWARD => 'Quest reward',
        PointTransaction::TYPE_BUY_IN => 'Buy in',
        PointTransaction::TYPE_STORE_REDEEM => 'Store redeem',
        PointTransaction::TYPE_BUY_IN_REFUND => 'Buy in refund',
        PointTransaction::TYPE_TRANSFER_IN => 'Transfer in',
        PointTransaction::TYPE_TRANSFER_OUT => 'Transfer out',
    ];

    /** Human-readable labels for activity log action keys (for "My activity" screen). */
    private const ACTION_DISPLAY_LABELS = [
        ActivityLog::ACTION_QUEST_JOINED => 'Joined quest',
        ActivityLog::ACTION_QUEST_QUIT => 'Left quest',
        ActivityLog::ACTION_QUEST_STAGE_SUBMITTED => 'Submitted stage',
        ActivityLog::ACTION_STORE_REDEEM => 'Redeemed item',
        ActivityLog::ACTION_ITEM_USED => 'Used item',
        ActivityLog::ACTION_ACHIEVEMENT_EARNED => 'Earned achievement',
        ActivityLog::ACTION_AUTH_SIGNIN => 'Signed in',
        ActivityLog::ACTION_AUTH_SIGNOUT => 'Signed out',
        ActivityLog::ACTION_AUTH_SIGNUP => 'Signed up',
        ActivityLog::ACTION_PASSWORD_CHANGED => 'Changed password',
        ActivityLog::ACTION_PROFILE_UPDATED => 'Updated profile',
        ActivityLog::ACTION_POINTS_TRANSFER_OUT => 'Sent points',
        ActivityLog::ACTION_POINTS_TRANSFER_IN => 'Received points',
    ];

    /**
     * User points transaction history. Paginated.
     */
    public function transactions(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user instanceof User) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $perPage = max(1, min(50, (int) $request->input('per_page', 20)));
        $query = PointTransaction::where('user_id', $user->id);

        if ($request->filled('type')) {
            $query->where('transaction_type', $request->input('type'));
        }
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->input('date_from'));
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->input('date_to'));
        }

        $transactions = $query->orderByDesc('created_at')->paginate($perPage);

        $items = $transactions->getCollection()->map(function (PointTransaction $tx) {
            return [
                'id' => $tx->id,
                'amount' => (int) $tx->amount,
                'transaction_type' => $tx->transaction_type,
                'type_label' => self::TRANSACTION_TYPE_LABELS[$tx->transaction_type] ?? $tx->transaction_type,
                'reference_id' => $tx->reference_id,
                'created_at' => $tx->created_at?->toDateTimeString(),
            ];
        })->values()->all();

        return response()->json([
            'transactions' => $items,
            'points_balance' => (int) ($user->points_balance ?? 0),
            'pagination' => [
                'current_page' => $transactions->currentPage(),
                'per_page' => $transactions->perPage(),
                'total' => $transactions->total(),
                'last_page' => $transactions->lastPage(),
            ],
        ]);
    }

    /**
     * User activity log. Paginated, with action_key, detail, and display_label.
     */
    public function activity(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user instanceof User) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $perPage = max(1, min(50, (int) $request->input('per_page', 20)));
        $query = ActivityLog::where('user_id', $user->id);

        if ($request->filled('action')) {
            $query->where('action', 'like', $request->input('action') . '%');
        }
        if ($request->filled('date_from')) {
            $query->whereDate('timestamp', '>=', $request->input('date_from'));
        }
        if ($request->filled('date_to')) {
            $query->whereDate('timestamp', '<=', $request->input('date_to'));
        }

        $logs = $query->orderByDesc('timestamp')->paginate($perPage);

        $items = $logs->getCollection()->map(function (ActivityLog $log) {
            $actionKey = ActivityLog::getActionKey($log->action);
            $detail = ActivityLog::getActionDetail($log->action);
            return [
                'id' => $log->id,
                'action_key' => $actionKey,
                'detail' => $detail,
                'display_label' => self::ACTION_DISPLAY_LABELS[$actionKey] ?? $actionKey,
                'timestamp' => $log->timestamp?->toDateTimeString(),
            ];
        })->values()->all();

        return response()->json([
            'activity' => $items,
            'pagination' => [
                'current_page' => $logs->currentPage(),
                'per_page' => $logs->perPage(),
                'total' => $logs->total(),
                'last_page' => $logs->lastPage(),
            ],
        ]);
    }
}
