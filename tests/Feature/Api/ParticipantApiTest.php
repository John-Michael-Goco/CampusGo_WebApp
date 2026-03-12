<?php

use App\Models\Quest;
use App\Models\QuestParticipant;
use App\Models\QuestStage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create(['role' => 'student']);
    $this->token = $this->user->createToken('test')->plainTextToken;
});

test('api participants play returns 401 without token', function () {
    $response = $this->getJson('/api/participants/1/play');
    $response->assertUnauthorized();
});

test('api participants play returns 404 for non-existent participant', function () {
    $response = $this->withHeader('Authorization', 'Bearer ' . $this->token)
        ->getJson('/api/participants/99999/play');
    $response->assertNotFound();
});

test('api participants play returns 404 when participant belongs to another user', function () {
    $otherUser = User::factory()->create(['role' => 'student']);
    $quest = Quest::create([
        'title' => 'Other Quest',
        'description' => 'Desc',
        'quest_type' => 'event',
        'status' => 'upcoming',
        'approval_status' => 'approved',
        'question_type' => 'multiple_choice',
        'is_elimination' => false,
        'reward_points' => 5,
        'buy_in_points' => 0,
        'max_participants' => 10,
        'current_participants' => 1,
        'created_by' => $otherUser->id,
        'start_date' => now()->addDay(),
        'end_date' => now()->addDays(2),
    ]);
    QuestStage::create([
        'quest_id' => $quest->id,
        'stage_number' => 1,
        'location_hint' => 'Here',
        'max_survivors' => 0,
    ]);
    $participant = QuestParticipant::create([
        'quest_id' => $quest->id,
        'user_id' => $otherUser->id,
        'current_stage' => 1,
        'status' => 'active',
        'joined_at' => now(),
    ]);

    $response = $this->withHeader('Authorization', 'Bearer ' . $this->token)
        ->getJson('/api/participants/' . $participant->id . '/play');
    $response->assertNotFound();
});

test('api participants play returns 200 with play state for own participant', function () {
    $quest = Quest::create([
        'title' => 'Play Quest',
        'description' => 'Desc',
        'quest_type' => 'event',
        'status' => 'upcoming',
        'approval_status' => 'approved',
        'question_type' => 'qr_scan',
        'is_elimination' => false,
        'reward_points' => 5,
        'buy_in_points' => 0,
        'max_participants' => 10,
        'current_participants' => 1,
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
    $participant = QuestParticipant::create([
        'quest_id' => $quest->id,
        'user_id' => $this->user->id,
        'current_stage' => 1,
        'status' => 'active',
        'joined_at' => now(),
    ]);

    $response = $this->withHeader('Authorization', 'Bearer ' . $this->token)
        ->getJson('/api/participants/' . $participant->id . '/play');
    $response->assertOk()
        ->assertJsonPath('participant_id', $participant->id)
        ->assertJsonPath('status', 'active')
        ->assertJsonPath('current_stage', 1)
        ->assertJsonStructure(['stage', 'can_quit']);
});

test('api participants status returns 401 without token', function () {
    $response = $this->getJson('/api/participants/1/status');
    $response->assertUnauthorized();
});

test('api participants status returns 404 for non-existent participant', function () {
    $response = $this->withHeader('Authorization', 'Bearer ' . $this->token)
        ->getJson('/api/participants/99999/status');
    $response->assertNotFound();
});

test('api participants status returns 200 with status and outcome', function () {
    $quest = Quest::create([
        'title' => 'Status Quest',
        'description' => 'Desc',
        'quest_type' => 'event',
        'status' => 'upcoming',
        'approval_status' => 'approved',
        'question_type' => 'qr_scan',
        'is_elimination' => false,
        'reward_points' => 5,
        'buy_in_points' => 0,
        'max_participants' => 10,
        'current_participants' => 1,
        'created_by' => $this->user->id,
        'start_date' => now()->addDay(),
        'end_date' => now()->addDays(2),
    ]);
    QuestStage::create([
        'quest_id' => $quest->id,
        'stage_number' => 1,
        'location_hint' => 'Here',
        'max_survivors' => 0,
    ]);
    $participant = QuestParticipant::create([
        'quest_id' => $quest->id,
        'user_id' => $this->user->id,
        'current_stage' => 1,
        'status' => 'active',
        'joined_at' => now(),
    ]);

    $response = $this->withHeader('Authorization', 'Bearer ' . $this->token)
        ->getJson('/api/participants/' . $participant->id . '/status');
    $response->assertOk()
        ->assertJsonPath('participant_id', $participant->id)
        ->assertJsonPath('status', 'active')
        ->assertJsonPath('awaiting_ranking', false)
        ->assertJsonPath('outcome', 'advanced');
});

test('api participants submit returns 401 without token', function () {
    $response = $this->postJson('/api/participants/1/submit', []);
    $response->assertUnauthorized();
});

test('api participants submit returns 404 for non-existent participant', function () {
    $response = $this->withHeader('Authorization', 'Bearer ' . $this->token)
        ->postJson('/api/participants/99999/submit', ['stage_completed' => true]);
    $response->assertNotFound();
});

test('api participants submit returns 400 when no answers or stage_completed', function () {
    $quest = Quest::create([
        'title' => 'Submit Quest',
        'description' => 'Desc',
        'quest_type' => 'event',
        'status' => 'upcoming',
        'approval_status' => 'approved',
        'question_type' => 'qr_scan',
        'is_elimination' => false,
        'reward_points' => 5,
        'buy_in_points' => 0,
        'max_participants' => 10,
        'current_participants' => 1,
        'created_by' => $this->user->id,
        'start_date' => now()->addDay(),
        'end_date' => now()->addDays(2),
    ]);
    QuestStage::create([
        'quest_id' => $quest->id,
        'stage_number' => 1,
        'location_hint' => 'Here',
        'max_survivors' => 0,
    ]);
    $participant = QuestParticipant::create([
        'quest_id' => $quest->id,
        'user_id' => $this->user->id,
        'current_stage' => 1,
        'status' => 'active',
        'joined_at' => now(),
    ]);

    $response = $this->withHeader('Authorization', 'Bearer ' . $this->token)
        ->postJson('/api/participants/' . $participant->id . '/submit', []);
    $response->assertStatus(400);
});

test('api participants submit accepts stage_completed for QR quest', function () {
    $quest = Quest::create([
        'title' => 'QR Submit Quest',
        'description' => 'Desc',
        'quest_type' => 'event',
        'status' => 'upcoming',
        'approval_status' => 'approved',
        'question_type' => 'qr_scan',
        'is_elimination' => false,
        'reward_points' => 5,
        'buy_in_points' => 0,
        'max_participants' => 10,
        'current_participants' => 1,
        'created_by' => $this->user->id,
        'start_date' => now()->addDay(),
        'end_date' => now()->addDays(2),
    ]);
    QuestStage::create([
        'quest_id' => $quest->id,
        'stage_number' => 1,
        'location_hint' => 'Here',
        'max_survivors' => 0,
    ]);
    $participant = QuestParticipant::create([
        'quest_id' => $quest->id,
        'user_id' => $this->user->id,
        'current_stage' => 1,
        'status' => 'active',
        'joined_at' => now(),
    ]);

    $response = $this->withHeader('Authorization', 'Bearer ' . $this->token)
        ->postJson('/api/participants/' . $participant->id . '/submit', ['stage_completed' => true]);
    $response->assertOk()
        ->assertJsonStructure(['outcome', 'message', 'passed', 'status']);
});

test('api participants quit returns 401 without token', function () {
    $response = $this->postJson('/api/participants/1/quit');
    $response->assertUnauthorized();
});

test('api participants quit returns 404 for non-existent participant', function () {
    $response = $this->withHeader('Authorization', 'Bearer ' . $this->token)
        ->postJson('/api/participants/99999/quit');
    $response->assertNotFound();
});

test('api participants quit returns 200 when active and allowed', function () {
    $quest = Quest::create([
        'title' => 'Quit Quest',
        'description' => 'Desc',
        'quest_type' => 'event',
        'status' => 'upcoming',
        'approval_status' => 'approved',
        'question_type' => 'qr_scan',
        'is_elimination' => false,
        'reward_points' => 5,
        'buy_in_points' => 0,
        'max_participants' => 10,
        'current_participants' => 1,
        'created_by' => $this->user->id,
        'start_date' => now()->addDay(),
        'end_date' => now()->addDays(2),
    ]);
    QuestStage::create([
        'quest_id' => $quest->id,
        'stage_number' => 1,
        'location_hint' => 'Here',
        'max_survivors' => 0,
        'minimum_participants' => 0,
    ]);
    $participant = QuestParticipant::create([
        'quest_id' => $quest->id,
        'user_id' => $this->user->id,
        'current_stage' => 1,
        'status' => 'active',
        'joined_at' => now(),
    ]);

    $response = $this->withHeader('Authorization', 'Bearer ' . $this->token)
        ->postJson('/api/participants/' . $participant->id . '/quit');
    $response->assertOk()
        ->assertJsonPath('ok', true)
        ->assertJsonPath('message', 'You have left the quest.');
});
