<?php

namespace App\Http\Responses;

use Illuminate\Support\Facades\Auth;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;
use Symfony\Component\HttpFoundation\Response;

class LoginResponse implements LoginResponseContract
{
    /**
     * Web login is only available for admin and gamemaster (professor).
     * Students must use the simulation student login.
     */
    public function toResponse($request): Response
    {
        $user = Auth::user();

        $allowedRoles = ['admin', 'professor'];
        if ($user && ! in_array($user->role, $allowedRoles, true)) {
            Auth::logout();

            return redirect()
                ->route('login')
                ->withErrors(['email' => 'Web login is only available for admin and gamemaster. Students must use the student application.']);
        }

        return redirect()->intended(config('fortify.home'));
    }
}
