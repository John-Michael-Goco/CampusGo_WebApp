<?php

namespace App\Http\Controllers;

use App\Models\Achievement;
use App\Models\ActivityLog;
use App\Models\Quest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AchievementController extends Controller
{
    private const REQUIREMENT_TYPES = ['quest_count', 'level', 'quest_win', 'complete_quest'];

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

        $quests = Quest::orderBy('title')->get(['id', 'title']);

        return Inertia::render('store&achievements/achievements', [
            'achievements' => $achievements,
            'quests' => $quests,
            'filters' => [
                'search' => $request->query('search', ''),
                'sort_by' => $sortBy,
                'sort_dir' => $sortDir,
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $rules = [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'requirement_type' => ['required', 'string', 'in:quest_count,level,quest_win,complete_quest'],
            'requirement_value' => ['required', 'integer', 'min:0'],
        ];
        if ($request->input('requirement_type') === 'complete_quest') {
            $rules['requirement_value'] = ['required', 'integer', 'min:1', 'exists:quests,id'];
        }
        $validated = $request->validate($rules);

        $achievement = Achievement::create($validated);

        ActivityLog::log(
            $request->user()->id,
            ActivityLog::ACTION_ACHIEVEMENT_CREATED,
            sprintf('%s (id %s)', $achievement->name, $achievement->id)
        );

        return redirect()
            ->route('achievements.index', $request->only(['search', 'sort_by', 'sort_dir']))
            ->with('status', 'Achievement created successfully.');
    }

    public function update(Request $request, Achievement $achievement): RedirectResponse
    {
        $rules = [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'requirement_type' => ['required', 'string', 'in:quest_count,level,quest_win,complete_quest'],
            'requirement_value' => ['required', 'integer', 'min:0'],
        ];
        if ($request->input('requirement_type') === 'complete_quest') {
            $rules['requirement_value'] = ['required', 'integer', 'min:1', 'exists:quests,id'];
        }
        $validated = $request->validate($rules);

        $achievement->update($validated);

        ActivityLog::log(
            $request->user()->id,
            ActivityLog::ACTION_ACHIEVEMENT_UPDATED,
            sprintf('%s (id %s)', $achievement->name, $achievement->id)
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
            ActivityLog::ACTION_ACHIEVEMENT_DELETED,
            sprintf('%s (id %s)', $name, $id)
        );

        return redirect()
            ->route('achievements.index', $request->only(['search', 'sort_by', 'sort_dir']))
            ->with('status', 'Achievement deleted successfully.');
    }
}
