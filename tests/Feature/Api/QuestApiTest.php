<?php

use App\Models\Enrollment;
use App\Models\Quest;
use App\Models\QuestStage;
use App\Models\Semester;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function (): void {
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

test('api quests list returns approved upcoming quests without target groups when user is enrolled in current semester', function () {
    $currentSemester = Semester::create([
        'name' => '1st Sem 2025',
        'start_date' => now()->subDays(30),
        'end_date' => now()->addDays(60),
    ]);
    Enrollment::create([
        'user_id' => $this->user->id,
        'semester' => $currentSemester->name,
        'is_enrolled' => true,
    ]);

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

test('api quests list returns only enrollment quests when user is not enrolled in current semester', function () {
    $currentSemester = Semester::create([
        'name' => '1st Sem 2025',
        'start_date' => now()->subDays(30),
        'end_date' => now()->addDays(60),
    ]);

    $enrollmentQuest = Quest::create([
        'title' => 'Enrollment Quest',
        'description' => 'Enroll for semester',
        'quest_type' => 'enrollment',
        'semester_id' => $currentSemester->id,
        'status' => 'upcoming',
        'approval_status' => 'approved',
        'question_type' => 'qr_scan',
        'is_elimination' => false,
        'reward_points' => 0,
        'buy_in_points' => 0,
        'max_participants' => 0,
        'current_participants' => 0,
        'created_by' => $this->user->id,
        'start_date' => now()->addDay(),
        'end_date' => now()->addDays(2),
    ]);
    QuestStage::create([
        'quest_id' => $enrollmentQuest->id,
        'stage_number' => 1,
        'location_hint' => 'Office',
        'max_survivors' => 0,
    ]);

    $eventQuest = Quest::create([
        'title' => 'Event Quest',
        'description' => 'Event',
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
        'quest_id' => $eventQuest->id,
        'stage_number' => 1,
        'location_hint' => 'Stage 1',
        'max_survivors' => 0,
    ]);

    $response = $this->withHeader('Authorization', 'Bearer ' . $this->token)->getJson('/api/quests');
    $response->assertOk()
        ->assertJsonCount(1, 'quests')
        ->assertJsonPath('quests.0.id', $enrollmentQuest->id)
        ->assertJsonPath('quests.0.title', 'Enrollment Quest');
});

test('api quests list when not enrolled shows only current semester enrollment quest not other semesters', function () {
    $pastSemester = Semester::create([
        'name' => 'Past Sem 2024',
        'start_date' => now()->subDays(120),
        'end_date' => now()->subDays(30),
    ]);
    $currentSemester = Semester::create([
        'name' => '1st Sem 2025',
        'start_date' => now()->subDays(10),
        'end_date' => now()->addDays(60),
    ]);

    $pastEnrollmentQuest = Quest::create([
        'title' => 'Past Semester Enrollment',
        'description' => 'Enroll past',
        'quest_type' => 'enrollment',
        'semester_id' => $pastSemester->id,
        'status' => 'upcoming',
        'approval_status' => 'approved',
        'question_type' => 'qr_scan',
        'is_elimination' => false,
        'reward_points' => 0,
        'buy_in_points' => 0,
        'max_participants' => 0,
        'current_participants' => 0,
        'created_by' => $this->user->id,
        'start_date' => now()->addDay(),
        'end_date' => now()->addDays(2),
    ]);
    QuestStage::create([
        'quest_id' => $pastEnrollmentQuest->id,
        'stage_number' => 1,
        'location_hint' => 'Office',
        'max_survivors' => 0,
    ]);

    $currentEnrollmentQuest = Quest::create([
        'title' => 'Current Semester Enrollment',
        'description' => 'Enroll current',
        'quest_type' => 'enrollment',
        'semester_id' => $currentSemester->id,
        'status' => 'upcoming',
        'approval_status' => 'approved',
        'question_type' => 'qr_scan',
        'is_elimination' => false,
        'reward_points' => 0,
        'buy_in_points' => 0,
        'max_participants' => 0,
        'current_participants' => 0,
        'created_by' => $this->user->id,
        'start_date' => now()->addDay(),
        'end_date' => now()->addDays(2),
    ]);
    QuestStage::create([
        'quest_id' => $currentEnrollmentQuest->id,
        'stage_number' => 1,
        'location_hint' => 'Office',
        'max_survivors' => 0,
    ]);

    $response = $this->withHeader('Authorization', 'Bearer ' . $this->token)->getJson('/api/quests');
    $response->assertOk()
        ->assertJsonCount(1, 'quests')
        ->assertJsonPath('quests.0.id', $currentEnrollmentQuest->id)
        ->assertJsonPath('quests.0.title', 'Current Semester Enrollment');
});

test('api quests list returns only enrollment quests when user is enrolled in past semester but not current', function () {
    Semester::create([
        'name' => 'Past Sem 2024',
        'start_date' => now()->subDays(120),
        'end_date' => now()->subDays(30),
    ]);
    $currentSemester = Semester::create([
        'name' => '1st Sem 2025',
        'start_date' => now()->subDays(10),
        'end_date' => now()->addDays(60),
    ]);
    Enrollment::create([
        'user_id' => $this->user->id,
        'semester' => 'Past Sem 2024',
        'is_enrolled' => true,
    ]);

    $enrollmentQuest = Quest::create([
        'title' => 'Enrollment Quest',
        'description' => 'Enroll',
        'quest_type' => 'enrollment',
        'semester_id' => $currentSemester->id,
        'status' => 'upcoming',
        'approval_status' => 'approved',
        'question_type' => 'qr_scan',
        'is_elimination' => false,
        'reward_points' => 0,
        'buy_in_points' => 0,
        'max_participants' => 0,
        'current_participants' => 0,
        'created_by' => $this->user->id,
        'start_date' => now()->addDay(),
        'end_date' => now()->addDays(2),
    ]);
    QuestStage::create([
        'quest_id' => $enrollmentQuest->id,
        'stage_number' => 1,
        'location_hint' => 'Office',
        'max_survivors' => 0,
    ]);

    $eventQuest = Quest::create([
        'title' => 'Event Quest',
        'description' => 'Event',
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
        'quest_id' => $eventQuest->id,
        'stage_number' => 1,
        'location_hint' => 'Stage 1',
        'max_survivors' => 0,
    ]);

    $response = $this->withHeader('Authorization', 'Bearer ' . $this->token)->getJson('/api/quests');
    $response->assertOk()
        ->assertJsonCount(1, 'quests')
        ->assertJsonPath('quests.0.id', $enrollmentQuest->id);
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

test('api quests resolve returns 200 with can_join when not joined and user is enrolled in current semester', function () {
    $currentSemester = Semester::create([
        'name' => '1st Sem 2025',
        'start_date' => now()->subDays(30),
        'end_date' => now()->addDays(60),
    ]);
    Enrollment::create([
        'user_id' => $this->user->id,
        'semester' => $currentSemester->name,
        'is_enrolled' => true,
    ]);

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

test('api quests resolve returns can_join false and reason when user not enrolled in current semester and scans non-enrollment quest', function () {
    Semester::create([
        'name' => '1st Sem 2025',
        'start_date' => now()->subDays(30),
        'end_date' => now()->addDays(60),
    ]);

    $quest = Quest::create([
        'title' => 'Event Quest',
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
        ->assertJsonPath('can_join', false)
        ->assertJsonPath('can_play', false)
        ->assertJsonPath('reason', 'You must be enrolled in the current semester before you can join other quests. Complete an enrollment quest first.');
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

test('api quests join returns 201 and participant when allowed and user is enrolled in current semester', function () {
    $currentSemester = Semester::create([
        'name' => '1st Sem 2025',
        'start_date' => now()->subDays(30),
        'end_date' => now()->addDays(60),
    ]);
    Enrollment::create([
        'user_id' => $this->user->id,
        'semester' => $currentSemester->name,
        'is_enrolled' => true,
    ]);

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

test('api quests join returns 403 when user is not enrolled in current semester and quest is not enrollment', function () {
    Semester::create([
        'name' => '1st Sem 2025',
        'start_date' => now()->subDays(30),
        'end_date' => now()->addDays(60),
    ]);

    $quest = Quest::create([
        'title' => 'Event Quest',
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
    QuestStage::create([
        'quest_id' => $quest->id,
        'stage_number' => 1,
        'location_hint' => 'Start',
        'max_survivors' => 0,
    ]);

    $response = $this->withHeader('Authorization', 'Bearer ' . $this->token)->postJson('/api/quests/join', [
        'quest_id' => $quest->id,
    ]);
    $response->assertStatus(403)
        ->assertJsonFragment(['message' => 'You must be enrolled in the current semester before you can join other quests. Complete an enrollment quest first.']);
});
