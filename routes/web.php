<?php

use App\Http\Controllers\Masterlist\ProfessorController;
use App\Http\Controllers\Masterlist\StudentController;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/login')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');

    // Masterlist
    Route::get('masterlist/students', [StudentController::class, 'index'])->name('masterlist.students');
    Route::post('masterlist/students', [StudentController::class, 'store'])->name('masterlist.students.store');
    Route::put('masterlist/students/{student_masterlist}', [StudentController::class, 'update'])->name('masterlist.students.update');
    Route::delete('masterlist/students/{student_masterlist}', [StudentController::class, 'destroy'])->name('masterlist.students.destroy');

    Route::get('masterlist/professors', [ProfessorController::class, 'index'])->name('masterlist.professors');
    Route::post('masterlist/professors', [ProfessorController::class, 'store'])->name('masterlist.professors.store');
    Route::put('masterlist/professors/{professor_masterlist}', [ProfessorController::class, 'update'])->name('masterlist.professors.update');
    Route::delete('masterlist/professors/{professor_masterlist}', [ProfessorController::class, 'destroy'])->name('masterlist.professors.destroy');

    // Users
    Route::inertia('users', 'users/index')->name('users.index');

    // Quests
    Route::inertia('quests/active', 'quests/active')->name('quests.active');
    Route::inertia('quests/history', 'quests/history')->name('quests.history');

    // Logs
    Route::inertia('logs', 'logs/index')->name('logs.index');
});

require __DIR__.'/settings.php';
