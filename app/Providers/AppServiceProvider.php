<?php

namespace App\Providers;

use App\Listeners\LogAuthActivity;
use App\Models\MasterUser;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;
use Illuminate\Auth\Events\Registered;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Route::bind('student_masterlist', fn (string $value) => MasterUser::where('role', 'student')->findOrFail($value));
        Route::bind('professor_masterlist', fn (string $value) => MasterUser::where('role', 'professor')->findOrFail($value));
        $this->registerAuthActivityListeners();
        $this->configureDefaults();
    }

    /**
     * Register activity log listeners for web auth (Fortify) events.
     */
    protected function registerAuthActivityListeners(): void
    {
        $listener = new LogAuthActivity;

        Event::listen(Login::class, [$listener, 'handleLogin']);
        Event::listen(Logout::class, [$listener, 'handleLogout']);
        Event::listen(Registered::class, [$listener, 'handleRegistered']);
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
