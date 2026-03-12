<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\User;
use App\Models\UserInventory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class InventoryController extends Controller
{
    /**
     * List the authenticated user's inventory (store redeems and quest custom prizes).
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user instanceof User) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $entries = UserInventory::where('user_id', $user->id)
            ->with(['storeItem', 'quest' => fn ($q) => $q->select('id', 'title', 'reward_custom_prize')])
            ->orderByDesc('acquired_at')
            ->get()
            ->map(function (UserInventory $entry) {
                $itemName = $entry->storeItem?->name ?? null;
                $itemDescription = $entry->storeItem?->description ?? null;
                $customDescription = null;
                if ($entry->item_id === null) {
                    $customDescription = $entry->quest?->reward_custom_prize ?? $entry->custom_prize_description;
                    if ($customDescription === null || trim((string) $customDescription) === '') {
                        $customDescription = 'Quest reward';
                    } else {
                        $customDescription = trim((string) $customDescription);
                    }
                }
                return [
                    'id' => $entry->id,
                    'item_id' => $entry->item_id,
                    'quantity' => (int) $entry->quantity,
                    'acquired_at' => $entry->acquired_at?->toDateTimeString(),
                    'source_quest_id' => $entry->source_quest_id,
                    'store_item' => $entry->storeItem ? [
                        'id' => $entry->storeItem->id,
                        'name' => $entry->storeItem->name,
                        'description' => $entry->storeItem->description,
                    ] : null,
                    'custom_prize_description' => $customDescription,
                ];
            })
            ->values()
            ->all();

        return response()->json(['inventory' => $entries]);
    }

    /**
     * Use one unit of an item from the user's inventory. Logs the use (item_used) for history.
     */
    public function use(Request $request): JsonResponse
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

        $user = $request->user();
        if (! $user instanceof User) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        if (! empty($validated['inventory_id'])) {
            $entry = UserInventory::where('user_id', $user->id)
                ->where('id', $validated['inventory_id'])
                ->where('quantity', '>', 0)
                ->with('storeItem')
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

        $remaining = $entry->quantity <= 1 ? 0 : $entry->quantity - 1;
        if ($entry->quantity <= 1) {
            $entry->delete();
        } else {
            $entry->decrement('quantity');
        }

        ActivityLog::log($user->id, ActivityLog::ACTION_ITEM_USED, $itemName);

        return response()->json([
            'message' => 'Item used.',
            'item_name' => $itemName,
            'remaining_quantity' => $remaining,
        ]);
    }

    /**
     * Use one unit of an inventory entry by id (step 2.6 alternative). Same as use() with inventory_id in body.
     */
    public function useById(Request $request, int $inventoryId): JsonResponse
    {
        $request->merge(['inventory_id' => $inventoryId]);
        return $this->use($request);
    }

    /**
     * History of items used by the authenticated user (from activity log).
     */
    public function history(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user instanceof User) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $perPage = max(1, min(50, (int) $request->input('per_page', 20)));
        $logs = ActivityLog::where('user_id', $user->id)
            ->where('action', 'like', 'item_used:%')
            ->orderByDesc('timestamp')
            ->paginate($perPage);

        $items = $logs->getCollection()->map(function (ActivityLog $log) {
            return [
                'item_name' => ActivityLog::getActionDetail($log->action) ?? 'Item',
                'used_at' => $log->timestamp?->toDateTimeString(),
            ];
        })->values()->all();

        return response()->json([
            'history' => $items,
            'pagination' => [
                'current_page' => $logs->currentPage(),
                'per_page' => $logs->perPage(),
                'total' => $logs->total(),
                'last_page' => $logs->lastPage(),
            ],
        ]);
    }
}
