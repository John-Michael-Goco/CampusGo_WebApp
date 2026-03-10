<?php

namespace App\Http\Controllers\Simulation;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\PointTransaction;
use App\Models\StoreItem;
use App\Models\UserInventory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class StoreRedeemController extends Controller
{
    /**
     * Redeem (purchase) a store item. Deducts points, records transaction, adds to user inventory, decrements stock.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'store_item_id' => ['required', 'integer', 'exists:store_items,id'],
            'quantity' => ['required', 'integer', 'min:1'],
        ]);

        $user = Auth::user();
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

        $quantity = (int) $validated['quantity'];
        $totalCost = $storeItem->cost_points * $quantity;

        if ($storeItem->stock < $quantity) {
            throw ValidationException::withMessages([
                'quantity' => ['Not enough stock.'],
            ]);
        }

        if ($user->points_balance < $totalCost) {
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

        return redirect()
            ->route('simulation.store')
            ->with('status', 'Redeemed successfully.');
    }
}
