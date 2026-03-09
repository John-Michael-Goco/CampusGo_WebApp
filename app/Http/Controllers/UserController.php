<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\MasterUser;
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
                'points_balance', 'level',
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
        if (! in_array($sortBy, ['name', 'role', 'points_balance', 'level'], true)) {
            $sortBy = 'name';
        }
        if (! in_array($sortDir, ['asc', 'desc'], true)) {
            $sortDir = 'asc';
        }
        $query->orderBy($sortBy, $sortDir);

        $users = $query->paginate(15)->withQueryString();

        $availableProfessors = MasterUser::query()
            ->where('role', 'professor')
            ->where('is_registered', false)
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get(['id', 'school_id', 'first_name', 'last_name']);

        $availableProfessors->transform(function ($row) {
            $row->employee_id = $row->school_id;
            return $row;
        });

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
     * Store a new user account for a professor (gamemaster).
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'professor_id' => [
                'required',
                'integer',
                'exists:master_users,id',
                function (string $attribute, int $value, \Closure $fail) {
                    $master = MasterUser::find($value);
                    if ($master && $master->is_registered) {
                        $fail('This professor already has a user account.');
                    }
                },
            ],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'confirmed', Password::default()],
        ]);

        $professor = MasterUser::where('role', 'professor')->findOrFail($validated['professor_id']);
        $name = trim($professor->first_name . ' ' . $professor->last_name);

        $user = User::create([
            'master_user_id' => $professor->id,
            'name' => $name,
            'email' => $validated['email'],
            'password' => $validated['password'],
            'role' => 'professor',
        ]);

        $professor->update(['is_registered' => true]);

        ActivityLog::log(
            $request->user()->id,
            ActivityLog::ACTION_GAMEMASTER_CREATED,
            sprintf('%s (%s)', $user->name, $user->email)
        );

        return redirect()
            ->route('users.index', $request->only(['search', 'role', 'sort_by', 'sort_dir']))
            ->with('status', 'Gamemaster created successfully.');
    }
}
