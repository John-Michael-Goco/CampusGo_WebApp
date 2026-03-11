<?php

namespace App\Http\Controllers\Masterlist;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\MasterUser;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProfessorController extends Controller
{
    /**
     * Display the professors masterlist with search and sort.
     */
    public function index(Request $request): Response
    {
        $query = MasterUser::query()->where('role', 'professor');

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('school_id', 'like', "%{$search}%")
                    ->orWhere('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%");
            });
        }

        $sortBy = $request->query('sort_by', 'school_id');
        if ($sortBy === 'employee_id') {
            $sortBy = 'school_id';
        }
        $sortDir = $request->query('sort_dir', 'asc');
        if (! in_array($sortBy, ['school_id', 'last_name'], true)) {
            $sortBy = 'school_id';
        }
        if (! in_array($sortDir, ['asc', 'desc'], true)) {
            $sortDir = 'asc';
        }
        $query->orderBy($sortBy, $sortDir);

        $professors = $query->select(['id', 'school_id', 'first_name', 'last_name', 'is_registered'])
            ->paginate(15)
            ->withQueryString();

        $professors->getCollection()->transform(function ($row) {
            $row->employee_id = $row->school_id;
            return $row;
        });

        return Inertia::render('masterlist/professors', [
            'professors' => $professors,
            'filters' => [
                'search' => $request->query('search', ''),
                'sort_by' => $request->query('sort_by', 'employee_id'),
                'sort_dir' => $sortDir,
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'employee_id' => ['required', 'string', 'max:255', 'unique:master_users,school_id'],
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
        ]);

        $professor = MasterUser::create([
            'school_id' => $validated['employee_id'],
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'role' => 'professor',
            'is_registered' => false,
        ]);

        ActivityLog::log(
            $request->user()->id,
            ActivityLog::ACTION_PROFESSOR_CREATED,
            sprintf('%s %s (%s)', $professor->first_name, $professor->last_name, $professor->school_id)
        );

        return redirect()
            ->route('masterlist.professors', $request->only(['search', 'sort_by', 'sort_dir']))
            ->with('status', 'Professor created successfully.');
    }

    public function update(Request $request, MasterUser $professor_masterlist): RedirectResponse
    {
        if ($professor_masterlist->role !== 'professor') {
            abort(404);
        }

        $validated = $request->validate([
            'employee_id' => ['required', 'string', 'max:255', 'unique:master_users,school_id,' . $professor_masterlist->id],
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
        ]);

        $professor_masterlist->update([
            'school_id' => $validated['employee_id'],
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
        ]);

        ActivityLog::log(
            $request->user()->id,
            ActivityLog::ACTION_PROFESSOR_UPDATED,
            $professor_masterlist->school_id . ' – ' . $professor_masterlist->first_name . ' ' . $professor_masterlist->last_name,
        );

        return redirect()
            ->route('masterlist.professors', $request->only(['search', 'sort_by', 'sort_dir']))
            ->with('status', 'Professor updated successfully.');
    }

    public function destroy(Request $request, MasterUser $professor_masterlist): RedirectResponse
    {
        if ($professor_masterlist->role !== 'professor') {
            abort(404);
        }
        $detail = $professor_masterlist->school_id . ' – ' . $professor_masterlist->first_name . ' ' . $professor_masterlist->last_name;
        $professor_masterlist->delete();

        ActivityLog::log(
            $request->user()->id,
            ActivityLog::ACTION_PROFESSOR_DELETED,
            $detail,
        );

        return redirect()->back()->with('status', 'Professor deleted successfully.');
    }
}
