<?php

use App\Models\Achievement;
use App\Models\User;
use App\Models\UserAchievement;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create(['role' => 'student']);
    $this->token = $this->user->createToken('test')->plainTextToken;
});

test('api achievements list returns 401 without token', function () {
    $response = $this->getJson('/api/achievements');
    $response->assertUnauthorized();
});

test('api achievements list returns 200 with achievements and earned state when authenticated', function () {
    Achievement::create([
        'name' => 'First Quest',
        'description' => 'Complete one quest',
        'requirement_type' => Achievement::REQUIREMENT_TYPE_COMPLETE_QUEST,
        'requirement_value' => 1,
    ]);

    $response = $this->withHeader('Authorization', 'Bearer ' . $this->token)->getJson('/api/achievements');
    $response->assertOk()
        ->assertJsonStructure(['achievements'])
        ->assertJsonCount(1, 'achievements')
        ->assertJsonPath('achievements.0.earned', false);
});

test('api user achievements returns 401 without token', function () {
    $response = $this->getJson('/api/user/achievements');
    $response->assertUnauthorized();
});

test('api user achievements returns 200 with empty list when none earned', function () {
    $response = $this->withHeader('Authorization', 'Bearer ' . $this->token)->getJson('/api/user/achievements');
    $response->assertOk()
        ->assertJsonPath('achievements', []);
});

test('api user achievements returns 200 with earned achievements', function () {
    $achievement = Achievement::create([
        'name' => 'Earned One',
        'description' => 'Earned',
        'requirement_type' => Achievement::REQUIREMENT_TYPE_LEVEL,
        'requirement_value' => 1,
    ]);
    UserAchievement::create([
        'user_id' => $this->user->id,
        'achievement_id' => $achievement->id,
        'earned_at' => now(),
    ]);

    $response = $this->withHeader('Authorization', 'Bearer ' . $this->token)->getJson('/api/user/achievements');
    $response->assertOk()
        ->assertJsonCount(1, 'achievements')
        ->assertJsonPath('achievements.0.name', 'Earned One');
});
