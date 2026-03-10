<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\LeaderboardController as ApiLeaderboardController;
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
    Route::post('/auth/signout', [AuthController::class, 'signout']);

    // Leaderboard (same data as web; table filled by leaderboard:populate)
    Route::get('/leaderboard', [ApiLeaderboardController::class, 'index']);
});
