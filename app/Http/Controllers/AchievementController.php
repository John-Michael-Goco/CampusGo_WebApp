<?php

namespace App\Http\Controllers;

use App\Models\Achievement;
use App\Models\ActivityLog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AchievementController extends Controller
{
    private const REQUIREMENT_TYPES = ['quest_count', 'level', 'event_win'];

    /**
     * Display the achievements list with search.
     */
    public function index(Request $request): Response
    {
        $query = Achievement::query();

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('requirement_type', 'like', "%{$search}%");
            });
        }

        $sortBy = $request->query('sort_by', 'name');
        $sortDir = $request->query('sort_dir', 'asc');
        if (! in_array($sortBy, ['name', 'requirement_type', 'requirement_value'], true)) {
            $sortBy = 'name';
        }
        if (! in_array($sortDir, ['asc', 'desc'], true)) {
            $sortDir = 'asc';
        }
        $query->orderBy($sortBy, $sortDir);

        $achievements = $query->paginate(15)->withQueryString();

        return Inertia::render('store&achievements/achievements', [
            'achievements' => $achievements,
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
            'requirement_type' => ['required', 'string', 'in:quest_count,level,event_win'],
            'requirement_value' => ['required', 'integer', 'min:0'],
        ]);

        $achievement = Achievement::create($validated);

        ActivityLog::log(
            $request->user()->id,
            sprintf('achievement_created: %s (id %s)', $achievement->name, $achievement->id)
        );

        return redirect()
            ->route('achievements.index', $request->only(['search', 'sort_by', 'sort_dir']))
            ->with('status', 'Achievement created successfully.');
    }

    public function update(Request $request, Achievement $achievement): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'requirement_type' => ['required', 'string', 'in:quest_count,level,event_win'],
            'requirement_value' => ['required', 'integer', 'min:0'],
        ]);

        $achievement->update($validated);

        ActivityLog::log(
            $request->user()->id,
            sprintf('achievement_updated: %s (id %s)', $achievement->name, $achievement->id)
        );

        return redirect()
            ->route('achievements.index', $request->only(['search', 'sort_by', 'sort_dir']))
            ->with('status', 'Achievement updated successfully.');
    }

    public function destroy(Request $request, Achievement $achievement): RedirectResponse
    {
        $name = $achievement->name;
        $id = $achievement->id;
        $achievement->delete();

        ActivityLog::log(
            $request->user()->id,
            sprintf('achievement_deleted: %s (id %s)', $name, $id)
        );

        return redirect()
            ->route('achievements.index', $request->only(['search', 'sort_by', 'sort_dir']))
            ->with('status', 'Achievement deleted successfully.');
    }
}
