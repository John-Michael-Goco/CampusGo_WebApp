<?php

namespace App\Http\Controllers\Masterlist;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Enrollment;
use App\Models\MasterUser;
use App\Models\Semester;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class StudentController extends Controller
{
    /**
     * Display the students masterlist with search, sort, and course filter.
     */
    public function index(Request $request): Response
    {
        $query = MasterUser::query()->where('role', 'student');

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('school_id', 'like', "%{$search}%")
                    ->orWhere('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%");
            });
        }

        if ($course = $request->query('course')) {
            $query->where('course', $course);
        }

        if ($request->has('year_level') && $request->query('year_level') !== '') {
            $yearLevel = (int) $request->query('year_level');
            if ($yearLevel >= 1 && $yearLevel <= 4) {
                $query->where('year_level', $yearLevel);
            }
        }

        if ($section = $request->query('section')) {
            $query->where('section', $section);
        }

        $sortBy = $request->query('sort_by', 'school_id');
        if ($sortBy === 'student_number') {
            $sortBy = 'school_id';
        }
        $sortDir = $request->query('sort_dir', 'asc');
        if (! in_array($sortBy, ['school_id', 'last_name', 'section'], true)) {
            $sortBy = 'school_id';
        }
        if (! in_array($sortDir, ['asc', 'desc'], true)) {
            $sortDir = 'asc';
        }
        $query->orderBy($sortBy, $sortDir);

        $students = $query->select(['id', 'school_id', 'first_name', 'last_name', 'course', 'year_level', 'section', 'is_registered'])
            ->paginate(15)
            ->withQueryString();

        $currentSemester = Semester::current();
        $enrolledUserIds = collect();
        if ($currentSemester) {
            $enrolledUserIds = Enrollment::query()
                ->where('semester', $currentSemester->name)
                ->where('is_enrolled', true)
                ->pluck('user_id')
                ->flip();
        }
        $studentIds = $students->getCollection()->pluck('id');
        $userIdsByMasterId = User::query()
            ->whereIn('master_user_id', $studentIds)
            ->pluck('id', 'master_user_id');

        $students->getCollection()->transform(function ($row) use ($currentSemester, $enrolledUserIds, $userIdsByMasterId) {
            $row->student_number = $row->school_id;
            $userId = $userIdsByMasterId[$row->id] ?? null;
            $row->is_enrolled = $currentSemester !== null && $userId !== null && $enrolledUserIds->has($userId);
            return $row;
        });

        $courses = MasterUser::query()
            ->where('role', 'student')
            ->select('course')
            ->distinct()
            ->orderBy('course')
            ->pluck('course');

        $sections = MasterUser::query()
            ->where('role', 'student')
            ->whereNotNull('section')
            ->where('section', '!=', '')
            ->select('section')
            ->distinct()
            ->orderBy('section')
            ->pluck('section');

        return Inertia::render('masterlist/students', [
            'students' => $students,
            'courses' => $courses,
            'sections' => $sections,
            'filters' => [
                'search' => $request->query('search', ''),
                'course' => $request->query('course', ''),
                'year_level' => $request->query('year_level', ''),
                'section' => $request->query('section', ''),
                'sort_by' => $sortBy === 'school_id' ? 'student_number' : $sortBy,
                'sort_dir' => $sortDir,
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'student_number' => ['required', 'string', 'max:255', 'unique:master_users,school_id'],
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'course' => ['required', 'string', 'in:BSIT,BSCS,BSCPe,BSCE,ACT'],
            'year_level' => [
                'required',
                'integer',
                'min:1',
                Rule::when($request->input('course') === 'ACT', 'max:2', 'max:4'),
            ],
            'section' => ['required', 'string', 'max:255'],
        ]);

        $student = MasterUser::create([
            'school_id' => $validated['student_number'],
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'course' => $validated['course'],
            'year_level' => $validated['year_level'],
            'section' => $validated['section'],
            'role' => 'student',
            'is_registered' => false,
        ]);

        ActivityLog::log(
            $request->user()->id,
            sprintf('student_created: %s %s (%s)', $student->first_name, $student->last_name, $student->school_id)
        );

        return redirect()->route('masterlist.students', $request->only(['search', 'course', 'year_level', 'section', 'sort_by', 'sort_dir']))
            ->with('status', 'Student created successfully.');
    }

    public function update(Request $request, MasterUser $student_masterlist): RedirectResponse
    {
        if ($student_masterlist->role !== 'student') {
            abort(404);
        }

        $validated = $request->validate([
            'student_number' => ['required', 'string', 'max:255', 'unique:master_users,school_id,' . $student_masterlist->id],
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'course' => ['required', 'string', 'in:BSIT,BSCS,BSCPe,BSCE,ACT'],
            'year_level' => [
                'required',
                'integer',
                'min:1',
                Rule::when($request->input('course') === 'ACT', 'max:2', 'max:4'),
            ],
            'section' => ['required', 'string', 'max:255'],
        ]);

        $student_masterlist->update([
            'school_id' => $validated['student_number'],
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'course' => $validated['course'],
            'year_level' => $validated['year_level'],
            'section' => $validated['section'],
        ]);

        return redirect()->route('masterlist.students', $request->only(['search', 'course', 'year_level', 'section', 'sort_by', 'sort_dir']))
            ->with('status', 'Student updated successfully.');
    }

    public function destroy(MasterUser $student_masterlist): RedirectResponse
    {
        if ($student_masterlist->role !== 'student') {
            abort(404);
        }
        $student_masterlist->delete();

        return redirect()->back()
            ->with('status', 'Student deleted successfully.');
    }
}
