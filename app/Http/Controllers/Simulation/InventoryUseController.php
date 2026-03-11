<?php

namespace App\Http\Controllers\Simulation;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\UserInventory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class InventoryUseController extends Controller
{
    /**
     * Use one unit of an item from the user's inventory. Decrements quantity; removes row if 0.
     * Accepts either store_item_id (store items) or inventory_id (custom prize entries).
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'store_item_id' => ['nullable', 'integer', 'exists:store_items,id'],
            'inventory_id' => ['nullable', 'integer', 'exists:user_inventory,id'],
        ]);

        if (empty($validated['store_item_id']) && empty($validated['inventory_id'])) {
            throw ValidationException::withMessages([
                'store_item_id' => ['Provide either store_item_id or inventory_id.'],
            ]);
        }

        $user = Auth::user();

        if (! empty($validated['inventory_id'])) {
            $entry = UserInventory::where('user_id', $user->id)
                ->where('id', $validated['inventory_id'])
                ->where('quantity', '>', 0)
                ->first();
        } else {
            $itemId = (int) $validated['store_item_id'];
            $entry = UserInventory::where('user_id', $user->id)
                ->where('item_id', $itemId)
                ->where('quantity', '>', 0)
                ->with('storeItem')
                ->orderByDesc('acquired_at')
                ->first();
        }

        if (! $entry) {
            throw ValidationException::withMessages([
                'store_item_id' => ['You do not have any of this item.'],
            ]);
        }

        $itemName = $entry->storeItem?->name
            ?? $entry->custom_prize_description
            ?? ($entry->item_id !== null ? "Item #{$entry->item_id}" : 'Custom prize');

        if ($entry->quantity <= 1) {
            $entry->delete();
        } else {
            $entry->decrement('quantity');
        }

        ActivityLog::log($user->id, ActivityLog::ACTION_ITEM_USED, $itemName);

        return redirect()
            ->route('simulation.store')
            ->with('status', 'Item used.');
    }
}
