<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\StoreItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StoreItemController extends Controller
{
    /**
     * Display the store items list with search and sort.
     */
    public function index(Request $request): Response
    {
        $query = StoreItem::query();

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $sortBy = $request->query('sort_by', 'name');
        $sortDir = $request->query('sort_dir', 'asc');
        if (! in_array($sortBy, ['name', 'cost_points', 'stock', 'is_visible'], true)) {
            $sortBy = 'name';
        }
        if (! in_array($sortDir, ['asc', 'desc'], true)) {
            $sortDir = 'asc';
        }
        $query->orderBy($sortBy, $sortDir);

        $storeItems = $query->paginate(15)->withQueryString();

        return Inertia::render('store&achievements/store', [
            'storeItems' => $storeItems,
            'filters' => [
                'search' => $request->query('search', ''),
                'sort_by' => $sortBy,
                'sort_dir' => $sortDir,
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'cost_points' => ['required', 'integer', 'min:0'],
            'stock' => ['required', 'integer', 'min:0'],
            'start_date' => ['nullable', 'string'],
            'end_date' => ['nullable', 'string'],
            'is_visible' => ['boolean'],
        ]);

        $startDate = ! empty($validated['start_date'])
            ? \Carbon\Carbon::parse($validated['start_date'])->toDateTimeString()
            : null;
        $endDate = ! empty($validated['end_date'])
            ? \Carbon\Carbon::parse($validated['end_date'])->toDateTimeString()
            : null;

        $storeItem = StoreItem::create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'cost_points' => (int) $validated['cost_points'],
            'stock' => (int) $validated['stock'],
            'start_date' => $startDate,
            'end_date' => $endDate,
            'is_visible' => (bool) ($validated['is_visible'] ?? true),
        ]);

        ActivityLog::log(
            $request->user()->id,
            ActivityLog::ACTION_STORE_ITEM_CREATED,
            sprintf('%s (id %s)', $storeItem->name, $storeItem->id)
        );

        return redirect()
            ->route('store.index', $request->only(['search', 'sort_by', 'sort_dir']))
            ->with('status', 'Store item created successfully.');
    }

    public function update(Request $request, StoreItem $storeItem): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'cost_points' => ['required', 'integer', 'min:0'],
            'stock' => ['required', 'integer', 'min:0'],
            'start_date' => ['nullable', 'string'],
            'end_date' => ['nullable', 'string'],
            'is_visible' => ['boolean'],
        ]);

        $startDate = ! empty($validated['start_date'])
            ? \Carbon\Carbon::parse($validated['start_date'])->toDateTimeString()
            : null;
        $endDate = ! empty($validated['end_date'])
            ? \Carbon\Carbon::parse($validated['end_date'])->toDateTimeString()
            : null;

        $storeItem->update([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'cost_points' => (int) $validated['cost_points'],
            'stock' => (int) $validated['stock'],
            'start_date' => $startDate,
            'end_date' => $endDate,
            'is_visible' => (bool) ($validated['is_visible'] ?? true),
        ]);

        ActivityLog::log(
            $request->user()->id,
            ActivityLog::ACTION_STORE_ITEM_UPDATED,
            sprintf('%s (id %s)', $storeItem->name, $storeItem->id)
        );

        return redirect()
            ->route('store.index', $request->only(['search', 'sort_by', 'sort_dir']))
            ->with('status', 'Store item updated successfully.');
    }

    public function destroy(Request $request, StoreItem $storeItem): RedirectResponse
    {
        $name = $storeItem->name;
        $id = $storeItem->id;
        $storeItem->delete();

        ActivityLog::log(
            $request->user()->id,
            ActivityLog::ACTION_STORE_ITEM_DELETED,
            sprintf('%s (id %s)', $name, $id)
        );

        return redirect()
            ->route('store.index', $request->only(['search', 'sort_by', 'sort_dir']))
            ->with('status', 'Store item deleted successfully.');
    }
}
