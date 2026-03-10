<?php

namespace App\Http\Controllers\Simulation;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class StudentLoginController extends Controller
{
    /**
     * Show the student login form (simulation mobile).
     */
    public function show(Request $request): Response|RedirectResponse
    {
        if (Auth::check() && Auth::user()->role === 'student') {
            return redirect()->route('simulation.store');
        }

        return Inertia::render('simulation/student-login', [
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Authenticate the student and redirect to the simulation store.
     */
    public function store(Request $request): RedirectResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        if (! Auth::attempt($credentials, (bool) $request->boolean('remember'))) {
            return back()->withErrors(['email' => 'The provided credentials are incorrect.']);
        }

        $user = Auth::user();

        if ($user->role !== 'student') {
            Auth::logout();

            return back()->withErrors(['email' => 'Only students can log in here. Use the main login for staff.']);
        }

        $request->session()->regenerate();

        return redirect()->intended(route('simulation.store'));
    }
}
