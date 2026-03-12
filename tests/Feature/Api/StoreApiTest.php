<?php

use App\Models\StoreItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create(['role' => 'student', 'points_balance' => 100]);
    $this->token = $this->user->createToken('test')->plainTextToken;
});

test('api store list returns 401 without token', function () {
    $response = $this->getJson('/api/store');
    $response->assertUnauthorized();
});

test('api store list returns 200 with items and points_balance', function () {
    StoreItem::create([
        'name' => 'Test Item',
        'description' => 'A test item',
        'cost_points' => 50,
        'stock' => 10,
        'is_visible' => true,
    ]);

    $response = $this->withHeader('Authorization', 'Bearer ' . $this->token)->getJson('/api/store');
    $response->assertOk()
        ->assertJsonPath('points_balance', 100)
        ->assertJsonCount(1, 'items')
        ->assertJsonPath('items.0.name', 'Test Item')
        ->assertJsonPath('items.0.can_afford', true);
});

test('api store redeem returns 422 without store_item_id', function () {
    $response = $this->withHeader('Authorization', 'Bearer ' . $this->token)
        ->postJson('/api/store/redeem', []);
    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['store_item_id']);
});

test('api store redeem returns 200 and deducts points when successful', function () {
    $item = StoreItem::create([
        'name' => 'Redeem Item',
        'description' => 'Desc',
        'cost_points' => 20,
        'stock' => 5,
        'is_visible' => true,
    ]);

    $response = $this->withHeader('Authorization', 'Bearer ' . $this->token)
        ->postJson('/api/store/redeem', ['store_item_id' => $item->id]);
    $response->assertOk()
        ->assertJsonPath('message', 'Redeemed successfully.')
        ->assertJsonPath('redeemed.store_item_id', $item->id)
        ->assertJsonPath('redeemed.quantity', 1);
    expect($this->user->fresh()->points_balance)->toBe(80);
});
