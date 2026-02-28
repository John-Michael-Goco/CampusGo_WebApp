<?php

use App\Http\Controllers\LogController;
use App\Http\Controllers\Masterlist\ProfessorController;
use App\Http\Controllers\Masterlist\StudentController;
use App\Http\Controllers\UserController;
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
    Route::get('users', [UserController::class, 'index'])->name('users.index');
    Route::post('users', [UserController::class, 'store'])->name('users.store');

    // Quests
    Route::inertia('quests/active', 'quests/active')->name('quests.active');
    Route::inertia('quests/history', 'quests/history')->name('quests.history');
    Route::inertia('quests/approval', 'quests/approval')->name('quests.approval');

    // Logs
    Route::get('logs', [LogController::class, 'index'])->name('logs.index');
});

require __DIR__.'/settings.php';
