<?php

namespace App\Http\Controllers;

use App\Models\PointTransaction;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PointTransactionController extends Controller
{
    /**
     * Display point transactions with search, user filter, and date range.
     */
    public function index(Request $request): Response
    {
        $search = $request->query('search', '');
        $userId = $request->query('user_id');
        if ($userId !== null && $userId !== '') {
            $userId = (int) $userId;
        } else {
            $userId = null;
        }
        $dateFrom = $request->query('date_from', '');
        $dateTo = $request->query('date_to', '');
        $sortDir = $request->query('sort_dir', 'desc');
        if (! in_array($sortDir, ['asc', 'desc'], true)) {
            $sortDir = 'desc';
        }

        $query = PointTransaction::query()
            ->with('user:id,name,email')
            ->orderBy('created_at', $sortDir);

        if ($search !== '') {
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%')
                    ->orWhere('email', 'like', '%' . $search . '%');
            });
        }

        if ($userId !== null) {
            $query->where('user_id', $userId);
        }

        if ($dateFrom !== '') {
            $query->whereDate('created_at', '>=', $dateFrom);
        }

        if ($dateTo !== '') {
            $query->whereDate('created_at', '<=', $dateTo);
        }

        $transactions = $query->paginate(15)->withQueryString();

        $filterUserIds = PointTransaction::query()
            ->select('user_id')
            ->distinct()
            ->pluck('user_id');
        $filterUsers = User::query()
            ->whereIn('id', $filterUserIds)
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn ($u) => ['id' => $u->id, 'name' => $u->name]);

        return Inertia::render('point-transactions/index', [
            'transactions' => $transactions,
            'filterUsers' => $filterUsers,
            'filters' => [
                'search' => $search,
                'user_id' => $userId !== null ? (string) $userId : '',
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
                'sort_dir' => $sortDir,
            ],
        ]);
    }
}
