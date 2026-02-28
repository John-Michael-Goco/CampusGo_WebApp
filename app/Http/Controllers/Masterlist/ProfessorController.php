<?php

namespace App\Http\Controllers\Masterlist;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\ProfessorMasterlist;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProfessorController extends Controller
{
    private const TITLES = ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.'];

    /**
     * Display the professors masterlist with search, sort, and title filter.
     */
    public function index(Request $request): Response
    {
        $query = ProfessorMasterlist::query();

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('employee_id', 'like', "%{$search}%")
                    ->orWhere('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%");
            });
        }

        if ($title = $request->query('title')) {
            if (in_array($title, self::TITLES, true)) {
                $query->where('title', $title);
            }
        }

        $sortBy = $request->query('sort_by', 'employee_id');
        $sortDir = $request->query('sort_dir', 'asc');
        if (! in_array($sortBy, ['employee_id', 'last_name'], true)) {
            $sortBy = 'employee_id';
        }
        if (! in_array($sortDir, ['asc', 'desc'], true)) {
            $sortDir = 'asc';
        }
        $query->orderBy($sortBy, $sortDir);

        $professors = $query->select([
            'id', 'employee_id', 'title', 'first_name', 'last_name',
            'department', 'is_registered',
        ])->paginate(15)->withQueryString();

        return Inertia::render('masterlist/professors', [
            'professors' => $professors,
            'filters' => [
                'search' => $request->query('search', ''),
                'title' => $request->query('title', ''),
                'sort_by' => $sortBy,
                'sort_dir' => $sortDir,
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'employee_id' => ['required', 'string', 'max:255', 'unique:professors_masterlist,employee_id'],
            'title' => ['required', 'string', 'in:Mr.,Mrs.,Ms.,Dr.,Prof.'],
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
        ]);

        $professor = ProfessorMasterlist::create([
            ...$validated,
            'department' => 'SSITE',
            'is_registered' => false,
        ]);

        ActivityLog::log(
            $request->user()->id,
            'professor_created',
            sprintf('Created professor: %s %s, %s (%s)', $professor->title, $professor->last_name, $professor->first_name, $professor->employee_id),
            $professor->id
        );

        return redirect()
            ->route('masterlist.professors', $request->only(['search', 'title', 'sort_by', 'sort_dir']))
            ->with('status', 'Professor created successfully.');
    }

    public function update(Request $request, ProfessorMasterlist $professor_masterlist): RedirectResponse
    {
        $validated = $request->validate([
            'employee_id' => ['required', 'string', 'max:255', 'unique:professors_masterlist,employee_id,' . $professor_masterlist->id],
            'title' => ['required', 'string', 'in:Mr.,Mrs.,Ms.,Dr.,Prof.'],
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
        ]);

        $professor_masterlist->update([...$validated, 'department' => 'SSITE']);

        return redirect()
            ->route('masterlist.professors', $request->only(['search', 'title', 'sort_by', 'sort_dir']))
            ->with('status', 'Professor updated successfully.');
    }

    public function destroy(ProfessorMasterlist $professor_masterlist): RedirectResponse
    {
        $professor_masterlist->delete();

        return redirect()->back()->with('status', 'Professor deleted successfully.');
    }
}
