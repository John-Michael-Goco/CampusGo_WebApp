<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create(['role' => 'student']);
    $this->token = $this->user->createToken('test')->plainTextToken;
});

test('api leaderboard returns 401 without token', function () {
    $response = $this->getJson('/api/leaderboard');
    $response->assertUnauthorized();
});

test('api leaderboard returns 200 with entries and period', function () {
    $response = $this->withHeader('Authorization', 'Bearer ' . $this->token)->getJson('/api/leaderboard');
    $response->assertOk()
        ->assertJsonStructure(['entries', 'period', 'periods', 'value_label']);
});

test('api leaderboard accepts period query param', function () {
    $response = $this->withHeader('Authorization', 'Bearer ' . $this->token)
        ->getJson('/api/leaderboard?period=overall');
    $response->assertOk()
        ->assertJsonPath('period', 'overall');
});
