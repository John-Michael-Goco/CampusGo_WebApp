<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Enrollment;
use App\Models\PointTransaction;
use App\Models\Quest;
use App\Models\QuestParticipant;
use App\Models\QuestStage;
use App\Models\Semester;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class QuestController extends Controller
{
    /**
     * List quests the authenticated user can join (approved, upcoming/ongoing,
     * not already joined, target-group and enrollment rules applied).
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $joinedQuestIds = QuestParticipant::where('user_id', $user->id)->pluck('quest_id');

        $currentSemester = Semester::current();
        $enrolledInCurrentSemester = $currentSemester !== null && Enrollment::where('user_id', $user->id)
            ->where('is_enrolled', true)
            ->where('semester', $currentSemester->name)
            ->exists();

        $enrolledSemesters = Enrollment::where('user_id', $user->id)
            ->where('is_enrolled', true)
            ->pluck('semester');

        $master = $user->masterUser;

        $quests = Quest::query()
            ->where('approval_status', 'approved')
            ->whereIn('status', ['upcoming', 'ongoing'])
            ->where(function ($q) use ($master) {
                $q->doesntHave('targetGroups');
                if ($master !== null) {
                    $q->orWhereHas('targetGroups', function ($tgQ) use ($master) {
                        $tgQ->where(function ($t) use ($master) {
                            $t->where(function ($tq) use ($master) {
                                $tq->whereNull('course')->orWhere('course', $master->course ?? '');
                            })
                                ->where(function ($tq) use ($master) {
                                    $tq->whereNull('year_level')->orWhere('year_level', $master->year_level);
                                })
                                ->where(function ($tq) use ($master) {
                                    $tq->whereNull('section')->orWhere('section', $master->section ?? '');
                                });
                        });
                    });
                }
            })
            ->whereNotIn('id', $joinedQuestIds)
            ->when(!$enrolledInCurrentSemester, function ($q) use ($currentSemester) {
                $q->where('quest_type', 'enrollment');
                if ($currentSemester !== null) {
                    $q->where('semester_id', $currentSemester->id);
                } else {
                    $q->whereRaw('1 = 0');
                }
            })
            ->when($enrolledInCurrentSemester, function ($q) use ($enrolledSemesters) {
                $q->where(function ($sub) use ($enrolledSemesters) {
                    $sub->where('quest_type', '!=', 'enrollment')
                        ->orWhereHas('semester', function ($semQ) use ($enrolledSemesters) {
                            $semQ->whereNotIn('name', $enrolledSemesters);
                        });
                });
            })
            ->with(['stages' => fn ($q) => $q->orderBy('stage_number')->limit(1)])
            ->withCount('stages')
            ->orderByDesc('start_date')
            ->get()
            ->map(function (Quest $q) {
                $firstStage = $q->stages->first();
                return [
                    'id' => $q->id,
                    'title' => $q->title,
                    'description' => $q->description,
                    'quest_type' => $q->quest_type,
                    'question_type' => $q->question_type ?? 'multiple_choice',
                    'is_elimination' => (bool) $q->is_elimination,
                    'reward_points' => (int) $q->reward_points,
                    'reward_custom_prize' => $q->reward_custom_prize,
                    'buy_in_points' => (int) ($q->buy_in_points ?? 0),
                    'max_participants' => (int) ($q->max_participants ?? 0),
                    'current_participants' => (int) ($q->current_participants ?? 0),
                    'stages_count' => (int) $q->stages_count,
                    'status' => $q->status,
                    'start_date' => $q->start_date?->toDateTimeString(),
                    'end_date' => $q->end_date?->toDateTimeString(),
                    'first_stage_id' => $firstStage?->id,
                    'first_stage_location_hint' => $q->status === 'upcoming' ? null : $firstStage?->location_hint,
                ];
            });

        return response()->json(['quests' => $quests->values()->all()]);
    }

    /**
     * List quests the user is participating in (taken quests).
     * For active/awaiting_ranking: preview is next location (if stage unlocked) or date when stage opens (if locked).
     */
    public function participating(Request $request): JsonResponse
    {
        $user = $request->user();

        $participations = QuestParticipant::where('user_id', $user->id)
            ->whereHas('quest')
            ->with(['quest.stages' => fn ($q) => $q->orderBy('stage_number')])
            ->orderByDesc('joined_at')
            ->get()
            ->map(function (QuestParticipant $p) {
                $quest = $p->quest;
                $stages = $quest ? $quest->stages : collect();
                $payload = [
                    'participant_id' => $p->id,
                    'quest_id' => $p->quest_id,
                    'quest_title' => $quest?->title ?? 'Unknown',
                    'current_stage' => $p->current_stage,
                    'status' => $p->status,
                    'total_stages' => $stages->count(),
                ];
                if (!in_array($p->status, ['active', 'awaiting_ranking'], true)) {
                    return $payload;
                }
                $currentStage = $stages->firstWhere('stage_number', $p->current_stage);
                if (!$currentStage) {
                    return $payload;
                }
                $stageLocked = $currentStage->stage_start && now()->lt($currentStage->stage_start);
                if ($stageLocked) {
                    $payload['preview'] = [
                        'next_stage_opens_at' => $currentStage->stage_start->toDateTimeString(),
                        'next_stage_number' => $currentStage->stage_number,
                    ];
                } else {
                    $payload['preview'] = [
                        'next_location_hint' => $currentStage->location_hint,
                        'next_stage_number' => $currentStage->stage_number,
                    ];
                }
                return $payload;
            });

        return response()->json(['participations' => $participations->values()->all()]);
    }

    /**
     * Get quest and one stage detail (read-only). For app "show": name, description, stage location only.
     * Stage is first stage, or participant's current stage when user is in this quest. No questions by default.
     * Use ?include_questions=1 when loading for AR after QR scan (returns questions + choices, no correct-answer flag).
     */
    public function show(Request $request, Quest $quest): JsonResponse
    {
        $stageParam = $request->input('stage');
        $stageNumber = $stageParam !== null && $stageParam !== '' ? (int) $stageParam : null;

        if ($stageNumber === null) {
            $participant = QuestParticipant::where('quest_id', $quest->id)
                ->where('user_id', $request->user()->id)
                ->first();
            $stageNumber = $participant ? $participant->current_stage : 1;
        }

        $withQuestions = filter_var($request->input('include_questions'), FILTER_VALIDATE_BOOLEAN);
        $stage = QuestStage::where('quest_id', $quest->id)
            ->where('stage_number', $stageNumber)
            ->when($withQuestions, fn ($q) => $q->with(['questions' => fn ($qq) => $qq->orderBy('id'), 'questions.choices' => fn ($qq) => $qq->orderBy('sort_order')]))
            ->first();

        if (!$stage) {
            return response()->json(['message' => 'Stage not found.'], 404);
        }

        $stagePayload = [
            'id' => $stage->id,
            'stage_number' => $stage->stage_number,
            'location_hint' => $stage->location_hint,
            'stage_deadline' => $stage->stage_deadline?->toDateTimeString(),
            'stage_start' => $stage->stage_start?->toDateTimeString(),
            'passing_score' => (int) ($stage->passing_score ?? 0),
        ];

        if ($withQuestions) {
            $stagePayload['questions'] = $stage->questions->map(function ($q) {
                $choiceList = $q->choices->map(fn ($c) => [
                    'id' => $c->id,
                    'choice_text' => $c->choice_text,
                    'sort_order' => $c->sort_order,
                ])->values()->all();
                return [
                    'id' => $q->id,
                    'question_text' => $q->question_text,
                    'question_type' => $q->question_type ?? 'multiple_choice',
                    'choices' => $choiceList,
                ];
            })->values()->all();
        }

        $payload = [
            'quest' => [
                'id' => $quest->id,
                'title' => $quest->title,
                'description' => $quest->description,
                'question_type' => $quest->question_type ?? 'multiple_choice',
                'is_elimination' => (bool) $quest->is_elimination,
                'reward_points' => (int) $quest->reward_points,
                'reward_custom_prize' => $quest->reward_custom_prize,
                'buy_in_points' => (int) ($quest->buy_in_points ?? 0),
                'status' => $quest->status,
                'start_date' => $quest->start_date?->toDateTimeString(),
                'end_date' => $quest->end_date?->toDateTimeString(),
            ],
            'stage' => $stagePayload,
        ];

        return response()->json($payload);
    }

    /**
     * Join a quest (step 2.1). User scans stage-1 QR; creates QuestParticipant, applies target-group and max-participants checks.
     * POST body: quest_id (required), stage_id (optional but validated as first stage if provided).
     */
    public function join(Request $request): JsonResponse
    {
        $request->validate([
            'quest_id' => 'required|integer',
            'stage_id' => 'nullable|integer',
        ]);

        $user = $request->user();
        if (!$user instanceof User) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $quest = Quest::with(['stages' => fn ($q) => $q->orderBy('stage_number'), 'targetGroups'])->find($request->input('quest_id'));
        if (!$quest) {
            return response()->json(['message' => 'Quest not found.'], 404);
        }

        $currentSemester = Semester::current();
        $enrolledInCurrentSemester = $currentSemester !== null && Enrollment::where('user_id', $user->id)
            ->where('is_enrolled', true)
            ->where('semester', $currentSemester->name)
            ->exists();
        if (!$enrolledInCurrentSemester && $quest->quest_type !== 'enrollment') {
            return response()->json(['message' => 'You must be enrolled in the current semester before you can join other quests. Complete an enrollment quest first.'], 403);
        }

        $alreadyJoined = QuestParticipant::where('quest_id', $quest->id)->where('user_id', $user->id)->exists();
        if ($alreadyJoined) {
            return response()->json(['message' => 'You have already joined this quest.'], 409);
        }

        if (!$this->userIsInTargetParticipants($quest, $user)) {
            return response()->json(['message' => 'You are not in the target participants for this quest.'], 403);
        }

        if ($quest->approval_status !== 'approved') {
            return response()->json(['message' => 'This quest is not approved yet.'], 403);
        }

        if (!in_array($quest->status, ['upcoming', 'ongoing'], true)) {
            return response()->json(['message' => 'This quest is not available for joining.'], 403);
        }

        $firstStage = $quest->stages->first();
        if (!$firstStage) {
            return response()->json(['message' => 'Quest has no stages.'], 400);
        }
        $stageIdInput = $request->input('stage_id');
        if ($stageIdInput !== null && $stageIdInput !== '' && (int) $stageIdInput !== $firstStage->id) {
            return response()->json(['message' => 'Invalid stage. Scan the first stage QR to join.'], 403);
        }

        if ($quest->buy_in_points > 0 && ($user->points_balance ?? 0) < $quest->buy_in_points) {
            return response()->json(['message' => 'Not enough points to join (need ' . $quest->buy_in_points . ').'], 403);
        }

        $participant = DB::transaction(function () use ($quest, $user) {
            $affected = Quest::where('id', $quest->id)
                ->where(function ($q) {
                    $q->where('max_participants', 0)
                        ->orWhereColumn('current_participants', '<', 'max_participants');
                })
                ->increment('current_participants');

            if ($affected === 0) {
                return null;
            }

            $participant = QuestParticipant::create([
                'quest_id' => $quest->id,
                'user_id' => $user->id,
                'current_stage' => 1,
                'status' => 'active',
            ]);

            if ($quest->buy_in_points > 0) {
                $user->decrement('points_balance', $quest->buy_in_points);
                PointTransaction::create([
                    'user_id' => $user->id,
                    'amount' => -$quest->buy_in_points,
                    'transaction_type' => PointTransaction::TYPE_BUY_IN,
                    'reference_id' => $quest->id,
                ]);
            }

            ActivityLog::log($user->id, ActivityLog::ACTION_QUEST_JOINED, $quest->title);

            return $participant;
        });

        if (!$participant) {
            return response()->json(['message' => 'This quest is full.'], 403);
        }

        $firstStage = $quest->stages->first();
        return response()->json([
            'participant_id' => $participant->id,
            'quest_id' => $quest->id,
            'current_stage' => 1,
            'status' => 'active',
            'quest' => [
                'id' => $quest->id,
                'title' => $quest->title,
                'question_type' => $quest->question_type ?? 'multiple_choice',
                'is_elimination' => (bool) $quest->is_elimination,
            ],
            'stage' => $firstStage ? [
                'id' => $firstStage->id,
                'stage_number' => 1,
                'location_hint' => $firstStage->location_hint,
            ] : null,
        ], 201);
    }

    /**
     * Resolve quest and stage from QR payload (URL or quest_id + stage_id).
     * Returns minimal quest/stage info and flags can_join / can_play for the authenticated user.
     */
    public function resolve(Request $request): JsonResponse
    {
        $questId = null;
        $stageId = null;

        if ($request->filled('qr')) {
            $path = parse_url($request->input('qr'), PHP_URL_PATH) ?: '';
            if (!preg_match('#/quests/(\d+)/stages/(\d+)#', $path, $m)) {
                return response()->json([
                    'message' => 'Invalid QR payload. Expected URL path like /quests/{id}/stages/{id}.',
                ], 400);
            }
            $questId = (int) $m[1];
            $stageId = (int) $m[2];
        } elseif ($request->filled('quest_id') && $request->filled('stage_id')) {
            $questId = (int) $request->input('quest_id');
            $stageId = (int) $request->input('stage_id');
        } else {
            return response()->json([
                'message' => 'Provide either qr (full URL) or both quest_id and stage_id.',
            ], 400);
        }

        $quest = Quest::with(['stages' => fn ($q) => $q->orderBy('stage_number'), 'targetGroups'])->find($questId);
        if (!$quest) {
            return response()->json(['message' => 'Quest not found.'], 404);
        }

        $stage = QuestStage::where('id', $stageId)->where('quest_id', $quest->id)->first();
        if (!$stage) {
            return response()->json(['message' => 'Stage not found or does not belong to this quest.'], 404);
        }

        $user = $request->user();
        $canJoin = false;
        $canPlay = false;
        $reason = null;

        if ($stage->stage_number === 1) {
            $participant = QuestParticipant::where('quest_id', $quest->id)->where('user_id', $user->id)->first();
            if ($participant) {
                $canPlay = in_array($participant->status, ['active', 'awaiting_ranking'], true) && $participant->current_stage === 1;
            } else {
                $currentSemester = Semester::current();
                $enrolledInCurrentSemester = $currentSemester !== null && Enrollment::where('user_id', $user->id)
                    ->where('is_enrolled', true)
                    ->where('semester', $currentSemester->name)
                    ->exists();
                if ($quest->quest_type !== 'enrollment' && !$enrolledInCurrentSemester) {
                    $canJoin = false;
                    $reason = 'You must be enrolled in the current semester before you can join other quests. Complete an enrollment quest first.';
                } else {
                    $canJoin = $this->userCanJoinQuest($quest, $user);
                    if (!$canJoin) {
                        if (!$this->userIsInTargetParticipants($quest, $user)) {
                            $reason = 'You are not in the target participants for this quest.';
                        } elseif ($quest->approval_status !== 'approved') {
                            $reason = 'This quest is not approved yet.';
                        } elseif (!in_array($quest->status, ['upcoming', 'ongoing'], true)) {
                            $reason = 'This quest is not available for joining (status: ' . $quest->status . ').';
                        } elseif ($quest->buy_in_points > 0 && ($user->points_balance ?? 0) < $quest->buy_in_points) {
                            $reason = 'Not enough points to join (need ' . $quest->buy_in_points . ').';
                        } elseif ($quest->max_participants > 0 && ($quest->current_participants ?? 0) >= $quest->max_participants) {
                            $reason = 'This quest is full.';
                        } else {
                            $reason = 'You cannot join this quest at this time.';
                        }
                    } else {
                        $canPlay = true;
                    }
                }
            }
        } else {
            $participant = QuestParticipant::where('quest_id', $quest->id)->where('user_id', $user->id)->first();
            if (!$participant) {
                $reason = 'You are not a participant in this quest. Join by scanning the first stage QR.';
            } elseif (!in_array($participant->status, ['active', 'awaiting_ranking'], true)) {
                $reason = 'You are no longer active in this quest.';
            } elseif ($participant->current_stage !== $stage->stage_number) {
                $reason = 'This is not your current stage. Your current stage is ' . $participant->current_stage . '.';
            } else {
                $stageNotYetOpen = $stage->stage_start && now()->lt($stage->stage_start);
                if ($stageNotYetOpen) {
                    $reason = 'This stage opens at ' . $stage->stage_start->toDateTimeString() . '.';
                } else {
                    $canPlay = true;
                }
            }
        }

        $payload = [
            'quest_id' => $quest->id,
            'quest_title' => $quest->title,
            'stage_id' => $stage->id,
            'stage_number' => $stage->stage_number,
            'location_hint' => $stage->location_hint,
            'can_join' => $canJoin,
            'can_play' => $canPlay,
            'question_type' => $quest->question_type ?? 'multiple_choice',
            'is_elimination' => (bool) $quest->is_elimination,
        ];
        if ($reason !== null) {
            $payload['reason'] = $reason;
        }
        if ($stage->stage_deadline) {
            $payload['stage_deadline'] = $stage->stage_deadline->toDateTimeString();
        }
        if ($stage->stage_start) {
            $payload['stage_start'] = $stage->stage_start->toDateTimeString();
        }

        return response()->json($payload);
    }

    private function userCanJoinQuest(Quest $quest, User $user): bool
    {
        if ($quest->quest_type !== 'enrollment') {
            $currentSemester = Semester::current();
            $enrolledInCurrentSemester = $currentSemester !== null && Enrollment::where('user_id', $user->id)
                ->where('is_enrolled', true)
                ->where('semester', $currentSemester->name)
                ->exists();
            if (!$enrolledInCurrentSemester) {
                return false;
            }
        }
        if (!$this->userIsInTargetParticipants($quest, $user)) {
            return false;
        }
        if ($quest->approval_status !== 'approved') {
            return false;
        }
        if (!in_array($quest->status, ['upcoming', 'ongoing'], true)) {
            return false;
        }
        if (QuestParticipant::where('quest_id', $quest->id)->where('user_id', $user->id)->exists()) {
            return false;
        }
        if ($quest->max_participants > 0 && ($quest->current_participants ?? 0) >= $quest->max_participants) {
            return false;
        }
        if ($quest->buy_in_points > 0 && ($user->points_balance ?? 0) < $quest->buy_in_points) {
            return false;
        }
        return true;
    }

    private function userIsInTargetParticipants(Quest $quest, User $user): bool
    {
        $quest->loadMissing('targetGroups');
        if ($quest->targetGroups->isEmpty()) {
            return true;
        }
        $master = $user->masterUser;
        if ($master === null) {
            return false;
        }
        foreach ($quest->targetGroups as $tg) {
            $courseOk = $tg->course === null || $tg->course === ($master->course ?? '');
            $yearOk = $tg->year_level === null || (string) $tg->year_level === (string) ($master->year_level ?? '');
            $sectionOk = $tg->section === null || $tg->section === ($master->section ?? '');
            if ($courseOk && $yearOk && $sectionOk) {
                return true;
            }
        }
        return false;
    }
}
