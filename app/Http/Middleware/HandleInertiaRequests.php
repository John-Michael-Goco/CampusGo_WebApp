<?php

namespace App\Http\Middleware;

use App\Models\Quest;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $isAdmin = $user && $user->role === 'admin';
        $isStudent = $user && $user->role === 'student';

        $auth = [
            'user' => $user,
            'isAdmin' => $isAdmin,
            'isStudent' => $isStudent,
            'canManageUsers' => $isAdmin,
            'canManageQuests' => $isAdmin,
            'canApproveQuests' => $user && in_array($user->role, ['admin', 'professor'], true),
            'canManageStore' => $isAdmin,
            'canManageAchievements' => $isAdmin,
            'canManageSemesters' => $isAdmin,
            'canManageMasterlist' => $isAdmin,
            'canSeeQuestHistory' => $user && in_array($user->role, ['admin', 'professor'], true),
        ];

        if ($isAdmin) {
            $auth['pendingApprovalCount'] = Quest::query()->where('approval_status', 'pending')->count();
        }

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => $auth,
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'flash' => [
                'status' => fn () => $request->session()->get('status'),
            ],
        ];
    }
}
