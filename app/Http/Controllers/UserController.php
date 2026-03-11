<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\MasterUser;
use App\Models\Quest;
use App\Models\QuestParticipant;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    private const ROLES = ['student', 'professor', 'admin'];

    private const DEFAULT_ADMIN_EMAIL = 'admin@email.com';

    /**
     * Display a single user (view page). For admin viewing professor/admin: includes role change and quests created.
     */
    public function show(Request $request, User $user): Response
    {
        $viewer = $request->user();
        $user->load('masterUser:id,school_id,first_name,last_name,course,year_level,section,is_active');

        $master = $user->masterUser;
        $schoolId = $master?->school_id;
        $firstName = $master?->first_name;
        $lastName = $master?->last_name;
        if ($firstName === null && $lastName === null && $user->name) {
            $parts = explode(' ', trim($user->name), 2);
            $firstName = $parts[0] ?? '';
            $lastName = $parts[1] ?? '';
        }

        $isAdmin = $viewer->role === 'admin';
        $isProfessorOrAdmin = in_array($user->role, ['admin', 'professor'], true);
        $isMainAdmin = strtolower($user->email) === self::DEFAULT_ADMIN_EMAIL;
        $canChangeRole = $isAdmin
            && $user->id !== $viewer->id
            && $isProfessorOrAdmin
            && ! $isMainAdmin;

        $questsCreated = [];
        if ($isAdmin && $isProfessorOrAdmin) {
            $questsCreated = Quest::query()
                ->where('created_by', $user->id)
                ->orderByDesc('created_at')
                ->get(['id', 'title', 'quest_type', 'approval_status', 'status', 'created_at'])
                ->map(fn (Quest $q) => [
                    'id' => $q->id,
                    'title' => $q->title,
                    'quest_type' => $q->quest_type,
                    'approval_status' => $q->approval_status,
                    'status' => $q->status,
                    'created_at' => $q->created_at?->toIso8601String(),
                ])
                ->values()
                ->all();
        }

        $questsParticipated = [];
        if ($user->role === 'student') {
            $questsParticipated = QuestParticipant::query()
                ->where('user_id', $user->id)
                ->whereHas('quest')
                ->with('quest:id,title,status')
                ->orderByDesc('joined_at')
                ->get()
                ->map(fn (QuestParticipant $p) => [
                    'id' => $p->id,
                    'quest_id' => $p->quest_id,
                    'quest_title' => $p->quest?->title ?? 'Unknown quest',
                    'quest_status' => $p->quest?->status ?? null,
                    'participant_status' => $p->status,
                    'current_stage' => $p->current_stage,
                    'joined_at' => $p->joined_at?->toIso8601String(),
                ])
                ->values()
                ->all();
        }

        $userPayload = [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'school_id' => $schoolId,
            'first_name' => $firstName,
            'last_name' => $lastName,
            'avatar' => $user->avatar,
        ];

        if ($user->role === 'student' && $master) {
            $userPayload['course'] = $master->course;
            $userPayload['year_level'] = $master->year_level;
            $userPayload['section'] = $master->section;
            $userPayload['is_enrolled'] = $master->is_active;
        }

        $userPayload['points_balance'] = $user->points_balance;
        $userPayload['level'] = $user->level;
        $userPayload['total_completed_quests'] = $user->total_completed_quests;

        return Inertia::render('users/show', [
            'user' => $userPayload,
            'can_change_role' => $canChangeRole,
            'quests_created' => $questsCreated,
            'quests_participated' => $questsParticipated,
        ]);
    }

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
     * Store a new user account for a professor (as Admin or Gamemaster).
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
            'role' => ['required', 'string', 'in:admin,professor'],
        ]);

        $professor = MasterUser::where('role', 'professor')->findOrFail($validated['professor_id']);
        $name = trim($professor->first_name . ' ' . $professor->last_name);
        $role = $validated['role'];

        $user = User::create([
            'master_user_id' => $professor->id,
            'name' => $name,
            'email' => $validated['email'],
            'password' => $validated['password'],
            'role' => $role,
        ]);

        $professor->update(['is_registered' => true]);

        ActivityLog::log(
            $request->user()->id,
            ActivityLog::ACTION_GAMEMASTER_CREATED,
            sprintf('%s (%s) as %s', $user->name, $user->email, $role === 'admin' ? 'Admin' : 'Gamemaster')
        );

        $statusLabel = $role === 'admin' ? 'Admin' : 'Gamemaster';
        return redirect()
            ->route('users.index', $request->only(['search', 'role', 'sort_by', 'sort_dir']))
            ->with('status', "{$statusLabel} created successfully.");
    }

    /**
     * Update a user (e.g. change role: professor <-> admin). Only for professor/admin users.
     */
    public function update(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'role' => ['required', 'string', 'in:admin,professor'],
        ]);

        if ($user->id === $request->user()->id) {
            return redirect()
                ->back()
                ->withErrors(['role' => 'You cannot change your own role.']);
        }

        if (! in_array($user->role, ['admin', 'professor'], true)) {
            return redirect()
                ->back()
                ->withErrors(['role' => 'Only admin and professor roles can be changed.']);
        }

        if (strtolower($user->email) === self::DEFAULT_ADMIN_EMAIL) {
            return redirect()
                ->back()
                ->withErrors(['role' => 'The default admin role cannot be changed.']);
        }

        $user->update(['role' => $validated['role']]);

        ActivityLog::log(
            $request->user()->id,
            ActivityLog::ACTION_GAMEMASTER_UPDATED,
            sprintf('%s (%s) → %s', $user->name, $user->email, $validated['role'])
        );

        return redirect()
            ->back()
            ->with('status', 'User role updated.');
    }

    /**
     * Delete a user. Cannot delete self or the default admin. If user was linked to a professor, mark master as not registered.
     */
    public function destroy(Request $request, User $user): RedirectResponse
    {
        if ($user->id === $request->user()->id) {
            return redirect()
                ->route('users.index')
                ->withErrors(['user' => 'You cannot delete your own account.']);
        }

        if (strtolower($user->email) === self::DEFAULT_ADMIN_EMAIL) {
            return redirect()
                ->route('users.index')
                ->withErrors(['user' => 'The default admin account cannot be deleted.']);
        }

        $name = $user->name;
        $email = $user->email;
        $masterUserId = $user->master_user_id;

        $user->delete();

        if ($masterUserId) {
            MasterUser::where('id', $masterUserId)->update(['is_registered' => false]);
        }

        ActivityLog::log(
            $request->user()->id,
            ActivityLog::ACTION_USER_DELETED,
            sprintf('%s (%s)', $name, $email)
        );

        return redirect()
            ->route('users.index', $request->only(['search', 'role', 'sort_by', 'sort_dir']))
            ->with('status', 'User deleted.');
    }
}
