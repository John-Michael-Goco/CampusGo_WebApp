<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\PointTransaction;
use App\Models\StoreItem;
use App\Models\UserInventory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class StoreController extends Controller
{
    /**
     * List redeemable store items with user's points and per-item availability/can_afford.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $pointsBalance = (int) ($user->points_balance ?? 0);

        $items = StoreItem::query()
            ->where('is_visible', true)
            ->orderBy('name')
            ->get()
            ->map(function (StoreItem $item) use ($pointsBalance) {
                $cost = (int) $item->cost_points;
                $available = $item->isAvailableNow();
                return [
                    'id' => $item->id,
                    'name' => $item->name,
                    'description' => $item->description,
                    'cost_points' => $cost,
                    'stock' => (int) $item->stock,
                    'start_date' => $item->start_date?->toDateTimeString(),
                    'end_date' => $item->end_date?->toDateTimeString(),
                    'is_available' => $available,
                    'can_afford' => $cost <= $pointsBalance,
                    'image_url' => null,
                ];
            });

        return response()->json([
            'points_balance' => $pointsBalance,
            'items' => $items->values()->all(),
        ]);
    }

    /**
     * Redeem a store item. Deducts points, records transaction, adds to inventory, decrements stock. Logs the redemption.
     */
    public function redeem(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'store_item_id' => ['required', 'integer', 'exists:store_items,id'],
            'quantity' => ['nullable', 'integer', 'min:1'],
        ]);

        $quantity = (int) ($validated['quantity'] ?? 1);
        $user = $request->user();
        $storeItem = StoreItem::findOrFail($validated['store_item_id']);

        if (! $storeItem->is_visible) {
            throw ValidationException::withMessages([
                'store_item_id' => ['This item is not available.'],
            ]);
        }

        if (! $storeItem->isAvailableNow()) {
            throw ValidationException::withMessages([
                'store_item_id' => ['This item is not available for redemption yet or the period has ended.'],
            ]);
        }

        $totalCost = $storeItem->cost_points * $quantity;

        if ($storeItem->stock < $quantity) {
            throw ValidationException::withMessages([
                'quantity' => ['Not enough stock.'],
            ]);
        }

        if (($user->points_balance ?? 0) < $totalCost) {
            throw ValidationException::withMessages([
                'store_item_id' => ['Not enough points.'],
            ]);
        }

        DB::transaction(function () use ($user, $storeItem, $quantity, $totalCost): void {
            PointTransaction::create([
                'user_id' => $user->id,
                'amount' => -$totalCost,
                'transaction_type' => PointTransaction::TYPE_STORE_REDEEM,
                'reference_id' => $storeItem->id,
            ]);

            $user->decrement('points_balance', $totalCost);

            UserInventory::create([
                'user_id' => $user->id,
                'item_id' => $storeItem->id,
                'quantity' => $quantity,
            ]);

            $storeItem->decrement('stock', $quantity);
        });

        ActivityLog::log(
            $user->id,
            ActivityLog::ACTION_STORE_REDEEM,
            sprintf('%s x%d (item id %s)', $storeItem->name, $quantity, $storeItem->id)
        );

        return response()->json([
            'message' => 'Redeemed successfully.',
            'points_balance' => (int) $user->fresh()->points_balance,
            'redeemed' => [
                'store_item_id' => $storeItem->id,
                'name' => $storeItem->name,
                'quantity' => $quantity,
                'cost_points' => $totalCost,
            ],
        ]);
    }
}
