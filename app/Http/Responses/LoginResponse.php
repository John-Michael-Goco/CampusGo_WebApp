<?php

namespace App\Http\Responses;

use Illuminate\Support\Facades\Auth;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;
use Symfony\Component\HttpFoundation\Response;

class LoginResponse implements LoginResponseContract
{
    /**
     * Students must use the simulation student login; block them from the main web login.
     */
    public function toResponse($request): Response
    {
        $user = Auth::user();

        if ($user && $user->role === 'student') {
            Auth::logout();

            return redirect()
                ->route('login')
                ->withErrors(['email' => 'Students must use the student login.']);
        }

        return redirect()->intended(config('fortify.home'));
    }
}
