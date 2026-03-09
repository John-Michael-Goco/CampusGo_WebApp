<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LogController extends Controller
{
    /**
     * Display the activity logs with search, date range, user filter, and sorting.
     */
    public function index(Request $request): Response
    {
        $sortDir = $request->query('sort_dir', 'desc');
        if (! in_array($sortDir, ['asc', 'desc'], true)) {
            $sortDir = 'desc';
        }

        $userId = $request->query('user_id');
        if ($userId !== null && $userId !== '') {
            $userId = (int) $userId;
        } else {
            $userId = null;
        }

        $logs = ActivityLog::query()
            ->with('user:id,name,email')
            ->filterSearch($request->query('search'))
            ->filterDateFrom($request->query('date_from'))
            ->filterDateTo($request->query('date_to'))
            ->filterByUser($userId)
            ->orderByTimestamp($sortDir)
            ->paginate(15)
            ->withQueryString();

        $activityLogUserIds = ActivityLog::query()
            ->select('user_id')
            ->distinct()
            ->pluck('user_id');
        $activityLogUsers = User::query()
            ->whereIn('id', $activityLogUserIds)
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn ($u) => ['id' => $u->id, 'name' => $u->name]);

        return Inertia::render('logs/index', [
            'logs' => $logs,
            'activityLogUsers' => $activityLogUsers,
            'filters' => [
                'search' => $request->query('search', ''),
                'date_from' => $request->query('date_from', ''),
                'date_to' => $request->query('date_to', ''),
                'user_id' => $userId !== null ? (string) $userId : '',
                'sort_dir' => $sortDir,
            ],
        ]);
    }
}
