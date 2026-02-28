<?php

use App\Models\User;
use Laravel\Sanctum\PersonalAccessToken;

test('api health returns ok', function () {
    /** @var \Illuminate\Foundation\Testing\TestCase $this */
    $response = $this->getJson('/api/health');

    $response->assertOk()
        ->assertJson(['ok' => true]);
});

test('api signin requires email and password', function () {
    /** @var \Illuminate\Foundation\Testing\TestCase $this */
    $response = $this->postJson('/api/auth/signin', []);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['email', 'password']);
});

test('api signin rejects invalid credentials', function () {
    /** @var \Illuminate\Foundation\Testing\TestCase $this */
    $response = $this->postJson('/api/auth/signin', [
        'email' => 'nonexistent@example.com',
        'password' => 'wrong',
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['email']);
});

test('api signin returns token and user with valid credentials', function () {
    /** @var \Illuminate\Foundation\Testing\TestCase $this */
    User::factory()->create([
        'email' => 'apiuser@test.com',
        'password' => 'secret123',
    ]);

    $response = $this->postJson('/api/auth/signin', [
        'email' => 'apiuser@test.com',
        'password' => 'secret123',
    ]);

    $response->assertOk()
        ->assertJsonStructure(['token', 'token_type', 'user'])
        ->assertJson(['token_type' => 'Bearer'])
        ->assertJsonPath('user.email', 'apiuser@test.com');

    expect($response->json('token'))->not->toBeEmpty();
});

test('api user returns 401 without token', function () {
    /** @var \Illuminate\Foundation\Testing\TestCase $this */
    $response = $this->getJson('/api/user');

    $response->assertUnauthorized();
});

test('api user returns authenticated user with valid token', function () {
    /** @var \Illuminate\Foundation\Testing\TestCase $this */
    $user = User::factory()->create();
    $token = $user->createToken('test')->plainTextToken;

    $response = $this->withHeader('Authorization', 'Bearer ' . $token)->getJson('/api/user');

    $response->assertOk()
        ->assertJsonPath('id', $user->id)
        ->assertJsonPath('email', $user->email);
});

test('api signout revokes token', function () {
    /** @var \Illuminate\Foundation\Testing\TestCase $this */
    $user = User::factory()->create();
    $accessToken = $user->createToken('test');
    $plainToken = $accessToken->plainTextToken;

    $response = $this->withHeader('Authorization', 'Bearer ' . $plainToken)
        ->postJson('/api/auth/signout');

    $response->assertOk()
        ->assertJson(['message' => 'Signed out successfully.']);

    // Token should be deleted from database
    $tokenId = $accessToken->accessToken->id;
    expect(PersonalAccessToken::find($tokenId))->toBeNull();
});
