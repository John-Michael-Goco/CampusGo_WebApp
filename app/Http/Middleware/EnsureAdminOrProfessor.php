<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdminOrProfessor
{
    /**
     * Restrict route to admin or professor. Students receive 403.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if (! $user || ! in_array($user->role, ['admin', 'professor'], true)) {
            abort(403, 'This area is only available to administrators and professors.');
        }

        return $next($request);
    }
}
