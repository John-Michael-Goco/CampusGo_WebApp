<?php

use App\Models\StoreItem;
use App\Models\User;
use App\Models\UserInventory;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create(['role' => 'student']);
    $this->token = $this->user->createToken('test')->plainTextToken;
});

test('api user inventory returns 401 without token', function () {
    $response = $this->getJson('/api/user/inventory');
    $response->assertUnauthorized();
});

test('api user inventory returns 200 with empty list when none', function () {
    $response = $this->withHeader('Authorization', 'Bearer ' . $this->token)->getJson('/api/user/inventory');
    $response->assertOk()
        ->assertJsonPath('inventory', []);
});

test('api user inventory returns 200 with entries', function () {
    $item = StoreItem::create([
        'name' => 'Inventory Item',
        'description' => 'Desc',
        'cost_points' => 10,
        'stock' => 5,
        'is_visible' => true,
    ]);
    UserInventory::create([
        'user_id' => $this->user->id,
        'item_id' => $item->id,
        'quantity' => 2,
        'acquired_at' => now(),
    ]);

    $response = $this->withHeader('Authorization', 'Bearer ' . $this->token)->getJson('/api/user/inventory');
    $response->assertOk()
        ->assertJsonCount(1, 'inventory')
        ->assertJsonPath('inventory.0.quantity', 2)
        ->assertJsonPath('inventory.0.store_item.name', 'Inventory Item');
});

test('api user inventory use returns 422 when neither store_item_id nor inventory_id provided', function () {
    $response = $this->withHeader('Authorization', 'Bearer ' . $this->token)
        ->postJson('/api/user/inventory/use', []);
    $response->assertUnprocessable();
});

test('api user inventory use returns 200 and decrements quantity', function () {
    $item = StoreItem::create([
        'name' => 'Use Item',
        'description' => 'Desc',
        'cost_points' => 10,
        'stock' => 5,
        'is_visible' => true,
    ]);
    $entry = UserInventory::create([
        'user_id' => $this->user->id,
        'item_id' => $item->id,
        'quantity' => 2,
        'acquired_at' => now(),
    ]);

    $response = $this->withHeader('Authorization', 'Bearer ' . $this->token)
        ->postJson('/api/user/inventory/use', ['inventory_id' => $entry->id]);
    $response->assertOk()
        ->assertJsonPath('message', 'Item used.')
        ->assertJsonPath('remaining_quantity', 1);
});

test('api user inventory history returns 200 with pagination', function () {
    $response = $this->withHeader('Authorization', 'Bearer ' . $this->token)->getJson('/api/user/inventory/history');
    $response->assertOk()
        ->assertJsonStructure(['history', 'pagination']);
});
