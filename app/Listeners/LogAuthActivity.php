<?php

namespace App\Listeners;

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;
use Illuminate\Auth\Events\Registered;

class LogAuthActivity
{
    /**
     * Log web login. Skip when guard is sanctum (API already logs).
     */
    public function handleLogin(Login $event): void
    {
        if ($event->guard !== 'web') {
            return;
        }

        $user = $event->user;
        if ($user instanceof User) {
            ActivityLog::log($user->id, ActivityLog::ACTION_AUTH_SIGNIN, 'Signed in via web');
        }
    }

    /**
     * Log web logout. Skip when guard is sanctum (API already logs).
     */
    public function handleLogout(Logout $event): void
    {
        if ($event->guard !== 'web') {
            return;
        }

        $user = $event->user;
        if ($user instanceof User) {
            ActivityLog::log($user->id, ActivityLog::ACTION_AUTH_SIGNOUT, 'Signed out via web');
        }
    }

    /**
     * Log web registration (Fortify). API registration is logged in Api\AuthController.
     */
    public function handleRegistered(Registered $event): void
    {
        $user = $event->user;
        if ($user instanceof User) {
            ActivityLog::log($user->id, ActivityLog::ACTION_AUTH_SIGNUP, sprintf('Registered via web (%s)', $user->email));
        }
    }
}
