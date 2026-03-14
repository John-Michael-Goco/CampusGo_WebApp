<?php

use App\Http\Controllers\Api\AchievementController as ApiAchievementController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\FcmTokenController;
use App\Http\Controllers\Api\InventoryController as ApiInventoryController;
use App\Http\Controllers\Api\LeaderboardController as ApiLeaderboardController;
use App\Http\Controllers\Api\ParticipantController as ApiParticipantController;
use App\Http\Controllers\Api\PointsTransferController as ApiPointsTransferController;
use App\Http\Controllers\Api\QuestController as ApiQuestController;
use App\Http\Controllers\Api\StoreController as ApiStoreController;
use App\Http\Controllers\Api\UserHistoryController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Prefix: /api
|
*/

Route::get('/health', fn () => ['ok' => true]);

Route::post('/auth/signin', [AuthController::class, 'signin']);
Route::post('/auth/signup', [AuthController::class, 'signup']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'user']);
    Route::put('/user/password', [AuthController::class, 'updatePassword']);
    Route::post('/user/profile', [AuthController::class, 'updateProfile']);
    Route::put('/user/fcm-token', [FcmTokenController::class, 'update']);
    Route::delete('/user/fcm-token', [FcmTokenController::class, 'destroy']);
    Route::get('/user/transactions', [UserHistoryController::class, 'transactions']);
    Route::get('/user/activity', [UserHistoryController::class, 'activity']);
    Route::post('/auth/signout', [AuthController::class, 'signout']);

    // Points transfer (only students can search and transfer)
    Route::get('/students/search', [ApiPointsTransferController::class, 'search']);
    Route::post('/points/transfer', [ApiPointsTransferController::class, 'transfer']);

    // Quests: list (1.2), resolve (1.3), detail (1.4), taken quests with preview, join (2.1)
    Route::get('/quests', [ApiQuestController::class, 'index']);
    Route::post('/quests/join', [ApiQuestController::class, 'join']);
    Route::get('/quests/resolve', [ApiQuestController::class, 'resolve']);
    Route::get('/quests/participating', [ApiQuestController::class, 'participating']);
    Route::get('/quests/history', [ApiQuestController::class, 'history']);
    Route::get('/quests/{quest}', [ApiQuestController::class, 'show']);

    // Play state (step 2.2), status (step 3.1 poll), submit (step 2.3), quit (step 2.4)
    Route::get('/participants/{participant}/play', [ApiParticipantController::class, 'play']);
    Route::get('/participants/{participant}/status', [ApiParticipantController::class, 'status']);
    Route::post('/participants/{participant}/submit', [ApiParticipantController::class, 'submit']);
    Route::post('/participants/{participant}/quit', [ApiParticipantController::class, 'quit']);

    // Leaderboard (same data as web; table filled by leaderboard:populate)
    Route::get('/leaderboard', [ApiLeaderboardController::class, 'index']);

    // Store (step 1.6): list items, redeem (with activity log)
    Route::get('/store', [ApiStoreController::class, 'index']);
    Route::post('/store/redeem', [ApiStoreController::class, 'redeem']);

    // Achievements (step 1.7, 1.8): list all with earned state, list user's earned
    Route::get('/achievements', [ApiAchievementController::class, 'index']);
    Route::get('/user/achievements', [ApiAchievementController::class, 'userAchievements']);

    // Inventory (step 1.9, 2.6): list, use item (with log), history of items used
    Route::get('/user/inventory', [ApiInventoryController::class, 'index']);
    Route::get('/user/inventory/history', [ApiInventoryController::class, 'history']);
    Route::post('/user/inventory/use', [ApiInventoryController::class, 'use']);
    Route::post('/user/inventory/{inventory}/use', [ApiInventoryController::class, 'useById']);
});
