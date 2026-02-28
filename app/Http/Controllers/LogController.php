<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LogController extends Controller
{
    /**
     * Display the activity logs with search, date range, and sorting.
     */
    public function index(Request $request): Response
    {
        $query = ActivityLog::query()
            ->with('user:id,name');

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('activity_logs.action', 'like', "%{$search}%")
                    ->orWhere('activity_logs.description', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($uq) use ($search) {
                        $uq->where('name', 'like', "%{$search}%");
                    });
            });
        }

        if ($dateFrom = $request->query('date_from')) {
            $query->whereDate('activity_logs.created_at', '>=', $dateFrom);
        }
        if ($dateTo = $request->query('date_to')) {
            $query->whereDate('activity_logs.created_at', '<=', $dateTo);
        }

        $sortDir = $request->query('sort_dir', 'desc');
        if (! in_array($sortDir, ['asc', 'desc'], true)) {
            $sortDir = 'desc';
        }
        $query->orderBy('activity_logs.created_at', $sortDir);

        $logs = $query->paginate(15)->withQueryString();

        return Inertia::render('logs/index', [
            'logs' => $logs,
            'filters' => [
                'search' => $request->query('search', ''),
                'date_from' => $request->query('date_from', ''),
                'date_to' => $request->query('date_to', ''),
                'sort_dir' => $sortDir,
            ],
        ]);
    }
}
