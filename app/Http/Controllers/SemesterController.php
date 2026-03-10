<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Semester;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class SemesterController extends Controller
{
    /**
     * Display the semesters list with search and sort.
     */
    public function index(Request $request): Response
    {
        $query = Semester::query();

        if ($search = $request->query('search')) {
            $query->where('name', 'like', '%' . $search . '%');
        }

        $sortBy = $request->query('sort_by', 'name');
        $sortDir = $request->query('sort_dir', 'asc');
        if (! in_array($sortBy, ['name', 'start_date', 'end_date'], true)) {
            $sortBy = 'name';
        }
        if (! in_array($sortDir, ['asc', 'desc'], true)) {
            $sortDir = 'asc';
        }
        $query->orderBy($sortBy, $sortDir);

        $semesters = $query->paginate(15)->withQueryString();

        $current = Semester::current();
        $semesters->getCollection()->transform(function ($s) use ($current) {
            $s->is_current = $current !== null && $current->id === $s->id;
            return $s;
        });

        return Inertia::render('semesters/index', [
            'semesters' => $semesters,
            'filters' => [
                'search' => $request->query('search', ''),
                'sort_by' => $sortBy,
                'sort_dir' => $sortDir,
            ],
        ]);
    }

    public function show(Semester $semester): Response
    {
        $current = Semester::current();
        $semester->is_current = $current !== null && $current->id === $semester->id;

        $enrolledStudents = $semester->enrollments()
            ->where('is_enrolled', true)
            ->with(['user:id,name,email,master_user_id', 'user.masterUser:id,school_id,first_name,last_name,course,year_level,section'])
            ->get()
            ->map(function ($enrollment) {
                $user = $enrollment->user;
                $master = $user?->masterUser;
                return [
                    'id' => $user?->id,
                    'name' => $user?->name ?? $user?->email ?? '—',
                    'email' => $user?->email ?? '—',
                    'student_number' => $master?->school_id ?? '—',
                    'course' => $master?->course ?? '—',
                    'year_level' => $master?->year_level ?? '—',
                    'section' => $master?->section ?? '—',
                ];
            })
            ->values()
            ->all();

        return Inertia::render('semesters/show', [
            'semester' => $semester,
            'enrolledStudents' => $enrolledStudents,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:semesters,name'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
        ]);

        if (Semester::hasOverlappingRange($validated['start_date'], $validated['end_date'])) {
            throw ValidationException::withMessages([
                'start_date' => ['This date range overlaps with an existing semester.'],
                'end_date' => ['This date range overlaps with an existing semester.'],
            ]);
        }

        $semester = Semester::create([
            'name' => $validated['name'],
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
        ]);

        ActivityLog::log(
            $request->user()->id,
            'semester_created',
            $semester->name
        );

        return redirect()
            ->route('semesters.index', $request->only(['search', 'sort_by', 'sort_dir']))
            ->with('status', 'Semester created successfully.');
    }

    public function update(Request $request, Semester $semester): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:semesters,name,' . $semester->id],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
        ]);

        if (Semester::hasOverlappingRange($validated['start_date'], $validated['end_date'], $semester->id)) {
            throw ValidationException::withMessages([
                'start_date' => ['This date range overlaps with an existing semester.'],
                'end_date' => ['This date range overlaps with an existing semester.'],
            ]);
        }

        $semester->update([
            'name' => $validated['name'],
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
        ]);

        ActivityLog::log(
            $request->user()->id,
            'semester_updated',
            $semester->name
        );

        return redirect()
            ->route('semesters.index', $request->only(['search', 'sort_by', 'sort_dir']))
            ->with('status', 'Semester updated successfully.');
    }

    public function destroy(Request $request, Semester $semester): RedirectResponse
    {
        $name = $semester->name;
        $semester->delete();

        ActivityLog::log(
            $request->user()->id,
            'semester_deleted',
            $name
        );

        return redirect()
            ->route('semesters.index', $request->only(['search', 'sort_by', 'sort_dir']))
            ->with('status', 'Semester deleted successfully.');
    }
}
