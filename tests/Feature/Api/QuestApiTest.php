<?php

use App\Models\Quest;
use App\Models\QuestStage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create(['role' => 'student']);
    $this->token = $this->user->createToken('test')->plainTextToken;
});

test('api quests list returns 401 without token', function () {
    $response = $this->getJson('/api/quests');
    $response->assertUnauthorized();
});

test('api quests list returns 200 with empty quests when none available', function () {
    $response = $this->withHeader('Authorization', 'Bearer ' . $this->token)->getJson('/api/quests');
    $response->assertOk()
        ->assertJsonPath('quests', []);
});

test('api quests list returns approved upcoming quests without target groups', function () {
    $quest = Quest::create([
        'title' => 'Test Quest',
        'description' => 'Description',
        'quest_type' => 'event',
        'status' => 'upcoming',
        'approval_status' => 'approved',
        'question_type' => 'multiple_choice',
        'is_elimination' => false,
        'reward_points' => 10,
        'buy_in_points' => 0,
        'max_participants' => 0,
        'current_participants' => 0,
        'created_by' => $this->user->id,
        'start_date' => now()->addDay(),
        'end_date' => now()->addDays(2),
    ]);
    QuestStage::create([
        'quest_id' => $quest->id,
        'stage_number' => 1,
        'location_hint' => 'Stage 1',
        'max_survivors' => 0,
    ]);

    $response = $this->withHeader('Authorization', 'Bearer ' . $this->token)->getJson('/api/quests');
    $response->assertOk()
        ->assertJsonCount(1, 'quests')
        ->assertJsonPath('quests.0.id', $quest->id)
        ->assertJsonPath('quests.0.title', 'Test Quest');
});

test('api quests resolve returns 400 without qr or ids', function () {
    $response = $this->withHeader('Authorization', 'Bearer ' . $this->token)->getJson('/api/quests/resolve');
    $response->assertStatus(400)
        ->assertJsonFragment(['message' => 'Provide either qr (full URL) or both quest_id and stage_id.']);
});

test('api quests resolve returns 400 for invalid qr payload', function () {
    $response = $this->withHeader('Authorization', 'Bearer ' . $this->token)->getJson('/api/quests/resolve?qr=' . urlencode('https://example.com/invalid'));
    $response->assertStatus(400)
        ->assertJsonFragment(['message' => 'Invalid QR payload. Expected URL path like /quests/{id}/stages/{id}.']);
});

test('api quests resolve returns 404 for non-existent quest', function () {
    $response = $this->withHeader('Authorization', 'Bearer ' . $this->token)->getJson('/api/quests/resolve?quest_id=99999&stage_id=1');
    $response->assertNotFound();
});

test('api quests resolve returns 200 with can_join when not joined', function () {
    $quest = Quest::create([
        'title' => 'Resolve Quest',
        'description' => 'Desc',
        'quest_type' => 'event',
        'status' => 'upcoming',
        'approval_status' => 'approved',
        'question_type' => 'multiple_choice',
        'is_elimination' => false,
        'reward_points' => 5,
        'buy_in_points' => 0,
        'max_participants' => 0,
        'current_participants' => 0,
        'created_by' => $this->user->id,
        'start_date' => now()->addDay(),
        'end_date' => now()->addDays(2),
    ]);
    $stage = QuestStage::create([
        'quest_id' => $quest->id,
        'stage_number' => 1,
        'location_hint' => 'Here',
        'max_survivors' => 0,
    ]);

    $response = $this->withHeader('Authorization', 'Bearer ' . $this->token)->getJson('/api/quests/resolve?qr=' . urlencode("https://app.test/quests/{$quest->id}/stages/{$stage->id}"));
    $response->assertOk()
        ->assertJsonPath('quest_id', $quest->id)
        ->assertJsonPath('stage_id', $stage->id)
        ->assertJsonPath('can_join', true)
        ->assertJsonPath('can_play', true);
});

test('api quests show returns 404 for non-existent quest', function () {
    $response = $this->withHeader('Authorization', 'Bearer ' . $this->token)->getJson('/api/quests/99999');
    $response->assertNotFound();
});

test('api quests show returns 200 with quest and stage', function () {
    $quest = Quest::create([
        'title' => 'Show Quest',
        'description' => 'Desc',
        'quest_type' => 'event',
        'status' => 'upcoming',
        'approval_status' => 'approved',
        'question_type' => 'multiple_choice',
        'is_elimination' => false,
        'reward_points' => 5,
        'buy_in_points' => 0,
        'max_participants' => 0,
        'current_participants' => 0,
        'created_by' => $this->user->id,
        'start_date' => now()->addDay(),
        'end_date' => now()->addDays(2),
    ]);
    QuestStage::create([
        'quest_id' => $quest->id,
        'stage_number' => 1,
        'location_hint' => 'Location',
        'max_survivors' => 0,
    ]);

    $response = $this->withHeader('Authorization', 'Bearer ' . $this->token)->getJson('/api/quests/' . $quest->id);
    $response->assertOk()
        ->assertJsonPath('quest.id', $quest->id)
        ->assertJsonPath('quest.title', 'Show Quest')
        ->assertJsonPath('stage.stage_number', 1)
        ->assertJsonPath('stage.location_hint', 'Location');
});

test('api quests participating returns 200 with empty list when none', function () {
    $response = $this->withHeader('Authorization', 'Bearer ' . $this->token)->getJson('/api/quests/participating');
    $response->assertOk()
        ->assertJsonPath('participations', []);
});

test('api quests join returns 401 without token', function () {
    $response = $this->postJson('/api/quests/join', ['quest_id' => 1]);
    $response->assertUnauthorized();
});

test('api quests join returns 422 without quest_id', function () {
    $response = $this->withHeader('Authorization', 'Bearer ' . $this->token)->postJson('/api/quests/join', []);
    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['quest_id']);
});

test('api quests join returns 404 for non-existent quest', function () {
    $response = $this->withHeader('Authorization', 'Bearer ' . $this->token)->postJson('/api/quests/join', ['quest_id' => 99999]);
    $response->assertNotFound();
});

test('api quests join returns 201 and participant when allowed', function () {
    $quest = Quest::create([
        'title' => 'Join Quest',
        'description' => 'Desc',
        'quest_type' => 'event',
        'status' => 'upcoming',
        'approval_status' => 'approved',
        'question_type' => 'multiple_choice',
        'is_elimination' => false,
        'reward_points' => 5,
        'buy_in_points' => 0,
        'max_participants' => 10,
        'current_participants' => 0,
        'created_by' => $this->user->id,
        'start_date' => now()->addDay(),
        'end_date' => now()->addDays(2),
    ]);
    $stage = QuestStage::create([
        'quest_id' => $quest->id,
        'stage_number' => 1,
        'location_hint' => 'Start',
        'max_survivors' => 0,
    ]);

    $response = $this->withHeader('Authorization', 'Bearer ' . $this->token)->postJson('/api/quests/join', [
        'quest_id' => $quest->id,
        'stage_id' => $stage->id,
    ]);
    $response->assertStatus(201)
        ->assertJsonStructure(['participant_id', 'quest_id', 'current_stage', 'status', 'quest', 'stage'])
        ->assertJsonPath('quest_id', $quest->id)
        ->assertJsonPath('current_stage', 1)
        ->assertJsonPath('status', 'active');
});
