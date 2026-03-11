<?php

use App\Http\Controllers\AchievementController;
use App\Http\Controllers\DashboardController;
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
use App\Http\Controllers\Simulation\QuestParticipationController;
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
    $inventory = [];
    if ($user) {
        $inventory = $user->inventory()->with(['storeItem', 'quest' => fn ($q) => $q->select('id', 'reward_custom_prize')])
            ->orderByDesc('acquired_at')
            ->get()
            ->map(function ($entry) {
                $arr = $entry->toArray();
                if ($entry->item_id === null) {
                    $description = null;
                    if ($entry->relationLoaded('quest') && $entry->quest) {
                        $description = $entry->quest->reward_custom_prize ?? $entry->custom_prize_description;
                    } else {
                        $description = $entry->custom_prize_description;
                    }
                    $arr['custom_prize_description'] = $description !== null && trim((string) $description) !== ''
                        ? trim((string) $description)
                        : 'Quest reward';
                }
                unset($arr['quest']);
                return $arr;
            })
            ->values()
            ->all();
    }

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
Route::patch('simulation/profile', [SimulationUserDetailsController::class, 'update'])
    ->middleware('auth')
    ->name('simulation.profile.update');
Route::post('simulation/achievements/simulate-level-up', [AchievementSimulationController::class, 'simulateLevelUp'])
    ->middleware('auth');
Route::post('simulation/achievements/simulate-quest-win', [AchievementSimulationController::class, 'simulateQuestWin'])
    ->middleware('auth');
Route::post('simulation/achievements/simulate-quest-participation', [AchievementSimulationController::class, 'simulateQuestParticipation'])
    ->middleware('auth');

Route::get('simulation/quests', [QuestParticipationController::class, 'index'])
    ->middleware('auth')
    ->name('simulation.quests');
Route::post('simulation/quests/join', [QuestParticipationController::class, 'join'])
    ->middleware('auth')
    ->name('simulation.quests.join');
Route::get('simulation/quests/{participant}/play', [QuestParticipationController::class, 'play'])
    ->middleware('auth')
    ->name('simulation.quests.play');
Route::post('simulation/quests/{participant}/submit', [QuestParticipationController::class, 'submit'])
    ->middleware('auth')
    ->name('simulation.quests.submit');


Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');

    // Semesters (Academic management) — store/update/destroy admin only
    Route::get('semesters', [SemesterController::class, 'index'])->name('semesters.index');
    Route::get('semesters/{semester}', [SemesterController::class, 'show'])->name('semesters.show');
    Route::post('semesters', [SemesterController::class, 'store'])->middleware('admin')->name('semesters.store');
    Route::put('semesters/{semester}', [SemesterController::class, 'update'])->middleware('admin')->name('semesters.update');
    Route::delete('semesters/{semester}', [SemesterController::class, 'destroy'])->middleware('admin')->name('semesters.destroy');

    // Masterlist — store/update/destroy admin only
    Route::get('masterlist/students', [StudentController::class, 'index'])->name('masterlist.students');
    Route::post('masterlist/students', [StudentController::class, 'store'])->middleware('admin')->name('masterlist.students.store');
    Route::put('masterlist/students/{student_masterlist}', [StudentController::class, 'update'])->middleware('admin')->name('masterlist.students.update');
    Route::delete('masterlist/students/{student_masterlist}', [StudentController::class, 'destroy'])->middleware('admin')->name('masterlist.students.destroy');

    Route::get('masterlist/professors', [ProfessorController::class, 'index'])->name('masterlist.professors');
    Route::post('masterlist/professors', [ProfessorController::class, 'store'])->middleware('admin')->name('masterlist.professors.store');
    Route::put('masterlist/professors/{professor_masterlist}', [ProfessorController::class, 'update'])->middleware('admin')->name('masterlist.professors.update');
    Route::delete('masterlist/professors/{professor_masterlist}', [ProfessorController::class, 'destroy'])->middleware('admin')->name('masterlist.professors.destroy');

    // Users — store/update/destroy admin only (gamemaster view only)
    Route::get('users', [UserController::class, 'index'])->name('users.index');
    Route::get('users/{user}', [UserController::class, 'show'])->name('users.show');
    Route::post('users', [UserController::class, 'store'])->middleware('admin')->name('users.store');
    Route::put('users/{user}', [UserController::class, 'update'])->middleware('admin')->name('users.update');
    Route::delete('users/{user}', [UserController::class, 'destroy'])->middleware('admin')->name('users.destroy');

    // Logs & Point Transactions
    Route::get('logs', [LogController::class, 'index'])->name('logs.index');
    Route::get('transactions', [PointTransactionController::class, 'index'])->name('transactions.index');

    // Leaderboards
    Route::get('leaderboards', [LeaderboardController::class, 'index'])->name('leaderboards.index');

    // Quests — professor: create (custom/event), Created Quests, cancel own pending; admin: full + Approval
    Route::get('quests/active', [QuestController::class, 'active'])->name('quests.active');
    Route::get('quests/approval', [QuestController::class, 'pending'])->middleware('admin')->name('quests.approval');
    Route::get('quests/created', [QuestController::class, 'createdByMe'])->name('quests.created');
    Route::get('quests/history', [QuestController::class, 'history'])->name('quests.history');
    Route::get('quests/create', [QuestController::class, 'create'])->name('quests.create');
    Route::get('quests/create/stages', [QuestController::class, 'stages'])->name('quests.create.stages');
    Route::post('quests', [QuestController::class, 'store'])->name('quests.store');
    Route::put('quests/{quest}/approve', [QuestController::class, 'approve'])->middleware('admin')->name('quests.approve');
    Route::get('quests/{quest}', [QuestController::class, 'show'])->name('quests.show');
    Route::get('quests/{quest}/edit', [QuestController::class, 'edit'])->middleware('admin')->name('quests.edit');
    Route::get('quests/{quest}/edit/stages', [QuestController::class, 'editStages'])->middleware('admin')->name('quests.edit.stages');
    Route::put('quests/{quest}', [QuestController::class, 'update'])->middleware('admin')->name('quests.update');
    Route::delete('quests/{quest}', [QuestController::class, 'destroy'])->name('quests.destroy');
    Route::get('quests/sections', [QuestController::class, 'sections'])->name('quests.sections');

    // Store & Achievements — store/update/destroy admin only (gamemaster view only)
    Route::get('store', [StoreItemController::class, 'index'])->name('store.index');
    Route::post('store', [StoreItemController::class, 'store'])->middleware('admin')->name('store.store');
    Route::put('store/{storeItem}', [StoreItemController::class, 'update'])->middleware('admin')->name('store.update');
    Route::delete('store/{storeItem}', [StoreItemController::class, 'destroy'])->middleware('admin')->name('store.destroy');
    Route::get('achievements', [AchievementController::class, 'index'])->name('achievements.index');
    Route::post('achievements', [AchievementController::class, 'store'])->middleware('admin')->name('achievements.store');
    Route::put('achievements/{achievement}', [AchievementController::class, 'update'])->middleware('admin')->name('achievements.update');
    Route::delete('achievements/{achievement}', [AchievementController::class, 'destroy'])->middleware('admin')->name('achievements.destroy');
});

require __DIR__.'/settings.php';
