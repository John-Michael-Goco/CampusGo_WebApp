<?php

namespace App\Http\Controllers\Masterlist;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\StudentMasterlist;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StudentController extends Controller
{
    /**
     * Display the students masterlist with search, sort, and course filter.
     */
    public function index(Request $request): Response
    {
        $query = StudentMasterlist::query();

        // Search: student number, first name, last name
        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('student_number', 'like', "%{$search}%")
                    ->orWhere('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%");
            });
        }

        // Filter by course (dropdown)
        if ($course = $request->query('course')) {
            $query->where('course', $course);
        }

        // Filter by year level (dropdown)
        if ($request->has('year_level') && $request->query('year_level') !== '') {
            $yearLevel = (int) $request->query('year_level');
            if ($yearLevel >= 1 && $yearLevel <= 4) {
                $query->where('year_level', $yearLevel);
            }
        }

        // Sort: student_number or last_name, direction asc/desc
        $sortBy = $request->query('sort_by', 'student_number');
        $sortDir = $request->query('sort_dir', 'asc');
        if (! in_array($sortBy, ['student_number', 'last_name'], true)) {
            $sortBy = 'student_number';
        }
        if (! in_array($sortDir, ['asc', 'desc'], true)) {
            $sortDir = 'asc';
        }
        $query->orderBy($sortBy, $sortDir);

        $students = $query->select(['id', 'student_number', 'first_name', 'last_name', 'course', 'year_level', 'is_registered'])
            ->paginate(15)
            ->withQueryString();

        $courses = StudentMasterlist::query()
            ->select('course')
            ->distinct()
            ->orderBy('course')
            ->pluck('course');

        return Inertia::render('masterlist/students', [
            'students' => $students,
            'courses' => $courses,
            'filters' => [
                'search' => $request->query('search', ''),
                'course' => $request->query('course', ''),
                'year_level' => $request->query('year_level', ''),
                'sort_by' => $sortBy,
                'sort_dir' => $sortDir,
            ],
        ]);
    }

    /**
     * Store a newly created student.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'student_number' => ['required', 'string', 'max:255', 'unique:students_masterlist,student_number'],
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'course' => ['required', 'string', 'in:BSIT,BSCS,BSCPe,BSCE,ACT'],
            'year_level' => ['required', 'integer', 'min:1', 'max:4'],
        ]);

        $student = StudentMasterlist::create([...$validated, 'is_registered' => false]);

        ActivityLog::log(
            $request->user()->id,
            'student_created',
            sprintf('Created student: %s %s (%s)', $student->first_name, $student->last_name, $student->student_number),
            $student->id
        );

        return redirect()->route('masterlist.students', $request->only(['search', 'course', 'year_level', 'sort_by', 'sort_dir']))
            ->with('status', 'Student created successfully.');
    }

    /**
     * Update the specified student.
     */
    public function update(Request $request, StudentMasterlist $student_masterlist): RedirectResponse
    {
        $validated = $request->validate([
            'student_number' => ['required', 'string', 'max:255', 'unique:students_masterlist,student_number,' . $student_masterlist->id],
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'course' => ['required', 'string', 'in:BSIT,BSCS,BSCPe,BSCE,ACT'],
            'year_level' => ['required', 'integer', 'min:1', 'max:4'],
        ]);

        $student_masterlist->update($validated);

        return redirect()->route('masterlist.students', $request->only(['search', 'course', 'year_level', 'sort_by', 'sort_dir']))
            ->with('status', 'Student updated successfully.');
    }

    /**
     * Remove the specified student.
     */
    public function destroy(StudentMasterlist $student_masterlist): RedirectResponse
    {
        $student_masterlist->delete();

        return redirect()->back()
            ->with('status', 'Student deleted successfully.');
    }
}
