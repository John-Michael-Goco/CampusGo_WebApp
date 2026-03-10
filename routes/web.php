<?php

use App\Http\Controllers\AchievementController;
use App\Http\Controllers\LeaderboardController;
use App\Http\Controllers\QuestController;
use App\Http\Controllers\LogController;
use App\Http\Controllers\PointTransactionController;
use App\Http\Controllers\Masterlist\ProfessorController;
use App\Http\Controllers\Masterlist\StudentController;
use App\Http\Controllers\SemesterController;
use App\Http\Controllers\Simulation\AchievementSimulationController;
use App\Http\Controllers\Simulation\InventoryUseController;
use App\Http\Controllers\Simulation\LeaderboardController as SimulationLeaderboardController;
use App\Http\Controllers\Simulation\PointTransactionsController as SimulationPointTransactionsController;
use App\Http\Controllers\Simulation\PointsTransferController;
use App\Http\Controllers\Simulation\StudentLoginController;
use App\Http\Controllers\Simulation\StoreRedeemController;
use App\Http\Controllers\Simulation\UserDetailsController as SimulationUserDetailsController;
use App\Http\Controllers\StoreItemController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/login')->name('home');

// Temporary: mobile simulation (remove when simulation is done)
Route::inertia('simulation/student-register', 'simulation/student-register')->name('simulation.student-register');
Route::get('simulation/login', [StudentLoginController::class, 'show'])->name('simulation.login');
Route::post('simulation/login', [StudentLoginController::class, 'store']);
Route::get('simulation/store', function () {
    $storeItems = \App\Models\StoreItem::where('is_visible', true)
        ->orderBy('name')
        ->get();

    /** @var \App\Models\User|null $user */
    $user = Auth::user();
    $inventory = $user
        ? $user->inventory()->with('storeItem')->orderByDesc('acquired_at')->get()
        : [];

    return \Inertia\Inertia::render('simulation/store', [
        'storeItems' => $storeItems,
        'pointsBalance' => $user?->points_balance ?? 0,
        'inventory' => $inventory,
        'canTransferPoints' => $user?->role === 'student',
    ]);
})->middleware('auth')->name('simulation.store');

Route::post('simulation/store/redeem', [StoreRedeemController::class, 'store'])
    ->middleware('auth')
    ->name('simulation.store.redeem');

Route::post('simulation/inventory/use', [InventoryUseController::class, 'store'])
    ->middleware('auth')
    ->name('simulation.inventory.use');

Route::get('simulation/students/search', [PointsTransferController::class, 'searchStudents'])
    ->middleware('auth')
    ->name('simulation.students.search');
Route::post('simulation/points/transfer', [PointsTransferController::class, 'transfer'])
    ->middleware('auth')
    ->name('simulation.points.transfer');

Route::get('simulation/achievements', [AchievementSimulationController::class, 'index'])
    ->middleware('auth')
    ->name('simulation.achievements');
Route::get('simulation/leaderboard', [SimulationLeaderboardController::class, 'index'])
    ->middleware('auth')
    ->name('simulation.leaderboard');
Route::get('simulation/transactions', [SimulationPointTransactionsController::class, 'index'])
    ->middleware('auth')
    ->name('simulation.transactions');
Route::get('simulation/profile', [SimulationUserDetailsController::class, 'index'])
    ->middleware('auth')
    ->name('simulation.profile');
Route::post('simulation/achievements/simulate-level-up', [AchievementSimulationController::class, 'simulateLevelUp'])
    ->middleware('auth');
Route::post('simulation/achievements/simulate-quest-win', [AchievementSimulationController::class, 'simulateQuestWin'])
    ->middleware('auth');
Route::post('simulation/achievements/simulate-quest-participation', [AchievementSimulationController::class, 'simulateQuestParticipation'])
    ->middleware('auth');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');

    // Semesters (Academic management)
    Route::get('semesters', [SemesterController::class, 'index'])->name('semesters.index');
    Route::get('semesters/{semester}', [SemesterController::class, 'show'])->name('semesters.show');
    Route::post('semesters', [SemesterController::class, 'store'])->name('semesters.store');
    Route::put('semesters/{semester}', [SemesterController::class, 'update'])->name('semesters.update');
    Route::delete('semesters/{semester}', [SemesterController::class, 'destroy'])->name('semesters.destroy');

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
    Route::put('users/{user}', [UserController::class, 'update'])->name('users.update');
    Route::delete('users/{user}', [UserController::class, 'destroy'])->name('users.destroy');

    // Logs & Point Transactions
    Route::get('logs', [LogController::class, 'index'])->name('logs.index');
    Route::get('transactions', [PointTransactionController::class, 'index'])->name('transactions.index');

    // Leaderboards
    Route::get('leaderboards', [LeaderboardController::class, 'index'])->name('leaderboards.index');

    // Quests
    Route::get('quests/active', [QuestController::class, 'active'])->name('quests.active');
    Route::get('quests/create', [QuestController::class, 'create'])->name('quests.create');
    Route::get('quests/create/stages', [QuestController::class, 'stages'])->name('quests.create.stages');
    Route::post('quests', [QuestController::class, 'store'])->name('quests.store');
    Route::get('quests/{quest}/edit', [QuestController::class, 'edit'])->name('quests.edit');
    Route::get('quests/{quest}/edit/stages', [QuestController::class, 'editStages'])->name('quests.edit.stages');
    Route::put('quests/{quest}', [QuestController::class, 'update'])->name('quests.update');
    Route::delete('quests/{quest}', [QuestController::class, 'destroy'])->name('quests.destroy');
    Route::get('quests/sections', [QuestController::class, 'sections'])->name('quests.sections');

    // Store & Achievements
    Route::get('store', [StoreItemController::class, 'index'])->name('store.index');
    Route::post('store', [StoreItemController::class, 'store'])->name('store.store');
    Route::put('store/{storeItem}', [StoreItemController::class, 'update'])->name('store.update');
    Route::delete('store/{storeItem}', [StoreItemController::class, 'destroy'])->name('store.destroy');
    Route::get('achievements', [AchievementController::class, 'index'])->name('achievements.index');
    Route::post('achievements', [AchievementController::class, 'store'])->name('achievements.store');
    Route::put('achievements/{achievement}', [AchievementController::class, 'update'])->name('achievements.update');
    Route::delete('achievements/{achievement}', [AchievementController::class, 'destroy'])->name('achievements.destroy');
});

require __DIR__.'/settings.php';
