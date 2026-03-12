<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create(['role' => 'student']);
    $this->token = $this->user->createToken('test')->plainTextToken;
});

test('api user transactions returns 401 without token', function () {
    $response = $this->getJson('/api/user/transactions');
    $response->assertUnauthorized();
});

test('api user transactions returns 200 with transactions and points_balance', function () {
    $response = $this->withHeader('Authorization', 'Bearer ' . $this->token)->getJson('/api/user/transactions');
    $response->assertOk()
        ->assertJsonStructure(['transactions', 'points_balance', 'pagination']);
});

test('api user activity returns 401 without token', function () {
    $response = $this->getJson('/api/user/activity');
    $response->assertUnauthorized();
});

test('api user activity returns 200 with activity and pagination', function () {
    $response = $this->withHeader('Authorization', 'Bearer ' . $this->token)->getJson('/api/user/activity');
    $response->assertOk()
        ->assertJsonStructure(['activity', 'pagination']);
});
