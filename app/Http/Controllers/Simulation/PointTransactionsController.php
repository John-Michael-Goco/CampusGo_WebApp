<?php

namespace App\Http\Controllers\Simulation;

use App\Http\Controllers\Controller;
use App\Models\PointTransaction;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PointTransactionsController extends Controller
{
    private const TYPE_LABELS = [
        PointTransaction::TYPE_QUEST_REWARD => 'Quest reward',
        PointTransaction::TYPE_BUY_IN => 'Buy in',
        PointTransaction::TYPE_STORE_REDEEM => 'Store redeem',
        PointTransaction::TYPE_BUY_IN_REFUND => 'Buy in refund',
        PointTransaction::TYPE_TRANSFER_IN => 'Transfer in',
        PointTransaction::TYPE_TRANSFER_OUT => 'Transfer out',
    ];

    /**
     * Show the current user's point transactions (simulation screen).
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $transactions = PointTransaction::query()
            ->where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->limit(100)
            ->get()
            ->map(function (PointTransaction $tx) {
                return [
                    'id' => $tx->id,
                    'amount' => $tx->amount,
                    'transaction_type' => $tx->transaction_type,
                    'type_label' => self::TYPE_LABELS[$tx->transaction_type] ?? $tx->transaction_type,
                    'created_at' => $tx->created_at?->toIso8601String(),
                ];
            });

        return Inertia::render('simulation/transactions', [
            'transactions' => $transactions,
        ]);
    }
}
