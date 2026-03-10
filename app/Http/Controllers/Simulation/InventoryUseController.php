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
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'store_item_id' => ['required', 'integer', 'exists:store_items,id'],
        ]);

        $user = Auth::user();
        $itemId = (int) $validated['store_item_id'];

        $entry = UserInventory::where('user_id', $user->id)
            ->where('item_id', $itemId)
            ->where('quantity', '>', 0)
            ->with('storeItem')
            ->orderByDesc('acquired_at')
            ->first();

        if (! $entry) {
            throw ValidationException::withMessages([
                'store_item_id' => ['You do not have any of this item.'],
            ]);
        }

        $itemName = $entry->storeItem?->name ?? "Item #{$itemId}";

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
