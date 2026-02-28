<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\ProfessorMasterlist;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    private const ROLES = ['student', 'professor', 'admin'];

    /**
     * Display the users list with search, role filter, and sorting.
     */
    public function index(Request $request): Response
    {
        $query = User::query()
            ->select([
                'id', 'name', 'email', 'role',
                'gm_quest_credit', 'total_points',
            ])
            ->whereKeyNot($request->user()->id);

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($role = $request->query('role')) {
            if (in_array($role, self::ROLES, true)) {
                $query->where('role', $role);
            }
        }

        $sortBy = $request->query('sort_by', 'name');
        $sortDir = $request->query('sort_dir', 'asc');
        if (! in_array($sortBy, ['name', 'role'], true)) {
            $sortBy = 'name';
        }
        if (! in_array($sortDir, ['asc', 'desc'], true)) {
            $sortDir = 'asc';
        }
        $query->orderBy($sortBy, $sortDir);

        $users = $query->paginate(15)->withQueryString();

        $registeredProfessorIds = User::query()
            ->whereNotNull('master_professor_id')
            ->pluck('master_professor_id');

        $availableProfessors = ProfessorMasterlist::query()
            ->whereNotIn('id', $registeredProfessorIds)
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get(['id', 'employee_id', 'title', 'first_name', 'last_name']);

        return Inertia::render('users/index', [
            'users' => $users,
            'available_professors' => $availableProfessors,
            'filters' => [
                'search' => $request->query('search', ''),
                'role' => $request->query('role', ''),
                'sort_by' => $sortBy,
                'sort_dir' => $sortDir,
            ],
        ]);
    }

    /**
     * Store a new gamemaster (admin) user for a professor.
     */
    public function store(Request $request): RedirectResponse
    {
        $registeredProfessorIds = User::query()
            ->whereNotNull('master_professor_id')
            ->pluck('master_professor_id');

        $validated = $request->validate([
            'professor_id' => [
                'required',
                'integer',
                'exists:professors_masterlist,id',
                function ($attribute, $value, $fail) use ($registeredProfessorIds) {
                    if ($registeredProfessorIds->contains($value)) {
                        $fail('This professor already has a user account.');
                    }
                },
            ],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'confirmed', Password::default()],
        ]);

        $professor = ProfessorMasterlist::findOrFail($validated['professor_id']);
        $name = $professor->title . ' ' . $professor->last_name . ', ' . $professor->first_name;

        $user = User::create([
            'name' => $name,
            'email' => $validated['email'],
            'password' => $validated['password'],
            'role' => 'admin',
            'master_professor_id' => $professor->id,
        ]);

        $professor->update(['is_registered' => true]);

        ActivityLog::log(
            $request->user()->id,
            'gamemaster_created',
            sprintf('Created gamemaster: %s (%s)', $user->name, $user->email),
            $user->id
        );

        return redirect()
            ->route('users.index', $request->only(['search', 'role', 'sort_by', 'sort_dir']))
            ->with('status', 'Gamemaster created successfully.');
    }
}
