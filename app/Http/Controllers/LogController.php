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
        $sortDir = $request->query('sort_dir', 'desc');
        if (! in_array($sortDir, ['asc', 'desc'], true)) {
            $sortDir = 'desc';
        }

        $logs = ActivityLog::query()
            ->with('user:id,name,email')
            ->filterSearch($request->query('search'))
            ->filterDateFrom($request->query('date_from'))
            ->filterDateTo($request->query('date_to'))
            ->orderByTimestamp($sortDir)
            ->paginate(15)
            ->withQueryString();

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
