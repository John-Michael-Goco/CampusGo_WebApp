<?php

use Illuminate\Support\Facades\Route;

Route::redirect('/', '/login')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');

    // Masterlist
    Route::inertia('masterlist/students', 'masterlist/students')->name('masterlist.students');
    Route::inertia('masterlist/professors', 'masterlist/professors')->name('masterlist.professors');

    // Users
    Route::inertia('users', 'users/index')->name('users.index');

    // Quests
    Route::inertia('quests/active', 'quests/active')->name('quests.active');
    Route::inertia('quests/history', 'quests/history')->name('quests.history');

    // Logs
    Route::inertia('logs', 'logs/index')->name('logs.index');
});

require __DIR__.'/settings.php';
