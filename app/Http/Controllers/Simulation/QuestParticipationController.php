<?php

namespace App\Http\Controllers\Simulation;

use App\Http\Controllers\Controller;
use App\Models\Achievement;
use App\Models\ActivityLog;
use App\Models\Enrollment;
use App\Models\PointTransaction;
use App\Models\Quest;
use App\Models\QuestParticipant;
use App\Models\Semester;
use App\Models\User;
use App\Models\UserAchievement;
use App\Models\UserInventory;
use App\Models\Submission;
use App\Services\FcmService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class QuestParticipationController extends Controller
{
    /**
     * Show the quest participation simulation page.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        $myParticipations = QuestParticipant::where('user_id', $user->id)
            ->whereHas('quest')
            ->with('quest')
            ->orderByDesc('joined_at')
            ->get()
            ->map(fn (QuestParticipant $p) => [
                'id' => $p->id,
                'quest_id' => $p->quest_id,
                'quest_title' => $p->quest?->title ?? 'Unknown',
                'quest_type' => $p->quest?->quest_type ?? 'custom',
                'question_type' => $p->quest?->question_type ?? 'multiple_choice',
                'quest_status' => $p->quest?->status ?? 'unknown',
                'current_stage' => $p->current_stage,
                'status' => $p->status,
                'joined_at' => $p->joined_at?->toDateTimeString(),
                'total_stages' => $p->quest?->stages()->count() ?? 0,
            ]);

        $joinedQuestIds = QuestParticipant::where('user_id', $user->id)->pluck('quest_id');

        $enrolledSemesters = Enrollment::where('user_id', $user->id)
            ->where('is_enrolled', true)
            ->pluck('semester');

        $master = $user->masterUser;

        $availableQuests = Quest::query()
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
            ->when($enrolledSemesters->isNotEmpty(), function ($q) use ($enrolledSemesters) {
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
                    'is_elimination' => $q->is_elimination,
                    'reward_points' => $q->reward_points,
                    'reward_custom_prize' => $q->reward_custom_prize,
                    'buy_in_points' => $q->buy_in_points,
                    'max_participants' => $q->max_participants,
                    'current_participants' => $q->current_participants,
                    'stages_count' => $q->stages_count,
                    'status' => $q->status,
                    'start_date' => $q->start_date?->toDateTimeString(),
                    'end_date' => $q->end_date?->toDateTimeString(),
                    'first_stage_id' => $firstStage?->id,
                    'first_stage_location_hint' => $firstStage?->location_hint,
                ];
            });

        return Inertia::render('simulation/quest-participation', [
            'participations' => $myParticipations,
            'availableQuests' => $availableQuests,
            'pointsBalance' => $user->points_balance ?? 0,
        ]);
    }

    /**
     * Join a quest by its ID.
     */
    public function join(Request $request): RedirectResponse
    {
        $request->validate([
            'quest_id' => 'required|integer',
            'stage_id' => 'required|integer',
        ]);

        $user = $request->user();
        $quest = Quest::with(['stages' => fn ($q) => $q->orderBy('stage_number'), 'targetGroups'])->find($request->input('quest_id'));

        if (!$quest) {
            return back()->withErrors(['quest_id' => 'Quest not found.']);
        }

        if (!$this->userIsInTargetParticipants($quest, $user)) {
            return back()->withErrors(['quest_id' => 'You are not in the target participants for this quest.']);
        }

        if ($quest->approval_status !== 'approved') {
            return back()->withErrors(['quest_id' => 'This quest is not approved yet.']);
        }

        if (!in_array($quest->status, ['upcoming', 'ongoing'], true)) {
            return back()->withErrors(['quest_id' => 'This quest is not available for joining (status: ' . $quest->status . ').']);
        }

        $firstStage = $quest->stages->first();
        if (!$firstStage || (int) $request->input('stage_id') !== $firstStage->id) {
            return back()->withErrors(['stage_id' => 'Invalid stage ID. Go to the location and scan the correct QR code.']);
        }

        $alreadyJoined = QuestParticipant::where('quest_id', $quest->id)
            ->where('user_id', $user->id)
            ->exists();

        if ($alreadyJoined) {
            return back()->withErrors(['quest_id' => 'You have already joined this quest.']);
        }

        if ($quest->buy_in_points > 0 && ($user->points_balance ?? 0) < $quest->buy_in_points) {
            return back()->withErrors(['quest_id' => 'Not enough points. You need ' . $quest->buy_in_points . ' pts to join.']);
        }

        $joined = DB::transaction(function () use ($quest, $user) {
            // Atomic increment: only add a slot when under the limit (prevents concurrent joins from exceeding max_participants)
            $affected = Quest::where('id', $quest->id)
                ->where(function ($q) {
                    $q->where('max_participants', 0)
                        ->orWhereColumn('current_participants', '<', 'max_participants');
                })
                ->increment('current_participants');

            if ($affected === 0) {
                return false;
            }

            QuestParticipant::create([
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

            return true;
        });

        if (!$joined) {
            return back()->withErrors(['quest_id' => 'This quest is full.']);
        }

        return back()->with('status', 'Successfully joined "' . $quest->title . '"!');
    }

    /**
     * Show a quest's current stage for answering.
     */
    public function play(Request $request, int $participantId): Response|RedirectResponse
    {
        $user = $request->user();

        $participant = QuestParticipant::where('id', $participantId)
            ->where('user_id', $user->id)
            ->with('quest.stages.questions.choices', 'submissions')
            ->first();

        if (!$participant) {
            return redirect()->route('simulation.quests')->withErrors(['error' => 'Participation not found.']);
        }

        $this->tryRunEliminationRankingIfReady($participant);
        $participant->refresh();
        $participant->load(['quest.stages' => fn ($q) => $q->orderBy('stage_number'), 'quest.stages.questions.choices', 'submissions']);

        $quest = $participant->quest;
        $stages = $quest->stages->sortBy('stage_number')->values();
        $currentStageNumber = $participant->current_stage;
        $currentStage = $stages->firstWhere('stage_number', $currentStageNumber);

        $answeredQuestionIds = $participant->submissions->pluck('question_id')->toArray();

        $stageData = null;
        $stageLocked = false;
        $nextStageOpensAt = null;
        $nextStageNumber = null;

        if ($currentStage) {
            // No stage_start = stage is always unlocked (open automatically)
            $stageNotYetOpen = $currentStage->stage_start && now()->lt($currentStage->stage_start);
            if ($stageNotYetOpen) {
                $stageLocked = true;
                $nextStageOpensAt = $currentStage->stage_start->toDateTimeString();
                $nextStageNumber = $currentStage->stage_number;
            } else {
                $stageData = [
                    'id' => $currentStage->id,
                    'stage_number' => $currentStage->stage_number,
                    'location_hint' => $currentStage->location_hint,
                    'max_survivors' => $currentStage->max_survivors,
                    'stage_deadline' => $currentStage->stage_deadline?->toDateTimeString(),
                    'questions' => $currentStage->questions->map(fn ($q) => [
                        'id' => $q->id,
                        'question_text' => $q->question_text,
                        'question_type' => $q->question_type,
                        'already_answered' => in_array($q->id, $answeredQuestionIds),
                        'choices' => $q->choices->sortBy('sort_order')->values()->map(fn ($c) => [
                            'id' => $c->id,
                            'choice_text' => $c->choice_text,
                        ])->all(),
                    ])->all(),
                ];
            }
        }

        $submissionsData = $participant->submissions->map(fn ($s) => [
            'id' => $s->id,
            'question_id' => $s->question_id,
            'answer' => $s->answer,
            'is_correct' => $s->is_correct,
            'submitted_at' => $s->submitted_at?->toDateTimeString(),
        ])->all();

        $minParticipants = $currentStage ? (int) $currentStage->minimum_participants : 0;
        $currentParticipants = (int) $quest->current_participants;
        $canQuit = in_array($participant->status, ['active', 'awaiting_ranking'], true)
            && ($currentParticipants - 1 >= $minParticipants);
        $quitGuardReason = (!$canQuit && in_array($participant->status, ['active', 'awaiting_ranking'], true))
            ? 'Quitting would leave the quest below the minimum participants for this stage.'
            : null;

        return Inertia::render('simulation/quest-play', [
            'participant' => [
                'id' => $participant->id,
                'quest_id' => $quest->id,
                'quest_title' => $quest->title,
                'quest_description' => $quest->description,
                'quest_type' => $quest->quest_type,
                'question_type' => $quest->question_type ?? 'multiple_choice',
                'quest_reward_points' => $quest->reward_points,
                'quest_reward_custom_prize' => $quest->reward_custom_prize,
                'is_elimination' => $quest->is_elimination,
                'current_stage' => $participant->current_stage,
                'status' => $participant->status,
                'total_stages' => $stages->count(),
                'can_quit' => $canQuit,
                'quit_guard_reason' => $quitGuardReason,
            ],
            'stage' => $stageData ? array_merge($stageData, [
                'passing_score' => $currentStage->passing_score,
            ]) : null,
            'submissions' => $submissionsData,
            'stage_locked' => $stageLocked,
            'next_stage_opens_at' => $nextStageOpensAt,
            'next_stage_number' => $nextStageNumber,
        ]);
    }

    /**
     * Quit the quest. Only allowed when participant is active or awaiting_ranking.
     * Blocked if quitting would leave the quest below the current stage's minimum_participants.
     */
    public function quit(Request $request, int $participantId): RedirectResponse
    {
        $user = $request->user();

        $participant = QuestParticipant::where('id', $participantId)
            ->where('user_id', $user->id)
            ->with('quest.stages')
            ->first();

        if (!$participant) {
            return redirect()->route('simulation.quests')->withErrors(['error' => 'Participation not found.']);
        }

        if (!in_array($participant->status, ['active', 'awaiting_ranking'], true)) {
            return back()->withErrors(['error' => 'You can only quit while the quest is in progress.']);
        }

        $quest = $participant->quest;
        $stages = $quest->stages->sortBy('stage_number')->values();
        $currentStage = $stages->firstWhere('stage_number', $participant->current_stage);
        $minParticipants = $currentStage ? (int) $currentStage->minimum_participants : 0;
        $currentParticipants = (int) $quest->current_participants;

        if ($currentParticipants - 1 < $minParticipants) {
            return back()->withErrors(['error' => 'Quitting would leave the quest below the minimum participants for this stage.']);
        }

        DB::transaction(function () use ($participant, $quest) {
            $participant->update(['status' => 'quit']);
            Quest::where('id', $quest->id)->where('current_participants', '>', 0)->decrement('current_participants');
        });

        ActivityLog::log($user->id, ActivityLog::ACTION_QUEST_QUIT, $quest->title);

        return redirect()->route('simulation.quests')->with('status', 'You have left the quest.');
    }

    /**
     * Submit answers for the current stage.
     * Branches into 4 modes based on elimination + question_type.
     */
    public function submit(Request $request, int $participantId): RedirectResponse
    {
        $request->validate([
            'answers' => 'required|array|min:1',
            'answers.*.question_id' => 'required|integer',
            'answers.*.answer' => 'nullable|string',
        ]);

        $user = $request->user();

        $participant = QuestParticipant::where('id', $participantId)
            ->where('user_id', $user->id)
            ->with('quest.stages.questions.choices')
            ->first();

        if (!$participant) {
            return back()->withErrors(['error' => 'Participation not found.']);
        }

        if ($participant->status !== 'active') {
            return back()->withErrors(['error' => 'You are no longer active in this quest (status: ' . $participant->status . ').']);
        }

        $quest = $participant->quest;
        $stages = $quest->stages->sortBy('stage_number')->values();
        $currentStage = $stages->firstWhere('stage_number', $participant->current_stage);

        if (!$currentStage) {
            return back()->withErrors(['error' => 'Current stage not found.']);
        }

        $stageQuestionIds = $currentStage->questions->pluck('id')->toArray();
        $answers = $request->input('answers');

        $results = $this->processSubmit($participant, $answers);

        ActivityLog::log($user->id, ActivityLog::ACTION_QUEST_STAGE_SUBMITTED, $quest->title . ' (stage ' . $participant->current_stage . ')');

        return back()->with('status', $results['message']);
    }

    /**
     * Process submit (transaction + handlers). Used by Simulation submit and API submit.
     * Participant must be loaded with quest.stages.questions.choices.
     * Returns ['outcome' => ..., 'message' => ..., 'correct' => ..., 'total' => ...].
     */
    public function processSubmit(QuestParticipant $participant, array $answers): array
    {
        $quest = $participant->quest;
        $stages = $quest->stages->sortBy('stage_number')->values();
        $currentStage = $stages->firstWhere('stage_number', $participant->current_stage);
        if (!$currentStage) {
            return ['outcome' => 'error', 'message' => 'Current stage not found.'];
        }
        $stageQuestionIds = $currentStage->questions->pluck('id')->toArray();
        $isElimination = (bool) $quest->is_elimination;
        $questionType = $quest->question_type ?? 'multiple_choice';
        $user = $participant->user ?? User::find($participant->user_id);

        $results = DB::transaction(function () use ($participant, $currentStage, $stageQuestionIds, $answers, $quest, $stages, $user, $isElimination, $questionType) {
            $correctCount = 0;
            $totalCount = 0;

            foreach ($answers as $answerData) {
                $questionId = (int) $answerData['question_id'];
                $answerText = $answerData['answer'] ?? '';

                if (!in_array($questionId, $stageQuestionIds)) {
                    continue;
                }

                $alreadySubmitted = Submission::where('participant_id', $participant->id)
                    ->where('question_id', $questionId)
                    ->exists();

                if ($alreadySubmitted) {
                    continue;
                }

                $question = $currentStage->questions->firstWhere('id', $questionId);
                if (!$question) {
                    continue;
                }

                $isCorrect = false;
                if ($question->question_type === 'multiple_choice') {
                    $correctChoice = $question->choices->firstWhere('is_correct', true);
                    $isCorrect = $correctChoice && (string) $correctChoice->id === $answerText;
                } elseif ($question->question_type === 'qr_scan') {
                    $isCorrect = $answerText !== '';
                }

                Submission::create([
                    'participant_id' => $participant->id,
                    'question_id' => $questionId,
                    'answer' => $answerText,
                    'is_correct' => $isCorrect,
                ]);

                $totalCount++;
                if ($isCorrect) {
                    $correctCount++;
                }
            }

            // After recording each answer: count total submitted answers for this participant's current stage (cumulative, including previous submits).
            // Run completion logic only when all stage questions are now answered.
            $requiredQuestionCount = count(array_unique($stageQuestionIds));
            if ($requiredQuestionCount === 0) {
                return ['outcome' => 'partial', 'correct' => $correctCount, 'total' => $totalCount];
            }
            $submittedQuestionCount = Submission::where('participant_id', $participant->id)
                ->whereIn('question_id', $stageQuestionIds)
                ->pluck('question_id')
                ->unique()
                ->count();
            $allStageQuestionsAnswered = $submittedQuestionCount >= $requiredQuestionCount;

            if (!$allStageQuestionsAnswered) {
                return ['outcome' => 'partial', 'correct' => $correctCount, 'total' => $totalCount];
            }

            // Use stage totals from all submissions for pass/fail and ranking (not just this request's batch)
            $stageSubmissions = Submission::where('participant_id', $participant->id)
                ->whereIn('question_id', $stageQuestionIds)
                ->get();
            $stageCorrectCount = $stageSubmissions->where('is_correct', true)->count();
            $stageTotalCount = $stageSubmissions->count();

            $nextStageNumber = $participant->current_stage + 1;
            $isLastStage = !$stages->contains('stage_number', $nextStageNumber);

            if ($isElimination && $questionType === 'multiple_choice') {
                return $this->handleElimMC($participant, $currentStage, $quest, $stages, $user, $stageCorrectCount, $stageTotalCount);
            }

            if ($isElimination && $questionType === 'qr_scan') {
                return $this->handleElimQR($participant, $currentStage, $quest, $stages, $user, $isLastStage, $nextStageNumber);
            }

            if (!$isElimination && $questionType === 'multiple_choice') {
                return $this->handleNonElimMC($participant, $currentStage, $quest, $user, $stageCorrectCount, $stageTotalCount, $isLastStage, $nextStageNumber);
            }

            // Non-elimination + QR scan: always advance
            return $this->handleNonElimQR($participant, $quest, $user, $isLastStage, $nextStageNumber, $stageTotalCount);
        });

        return $results;
    }

    /**
     * Mode A: Elimination + Multiple Choice
     * Rank by score (desc), tiebreak by last submission time (asc).
     * Top max_survivors advance. Triggers when all active participants have submitted OR deadline passed.
     */
    private function handleElimMC(QuestParticipant $participant, $currentStage, Quest $quest, $stages, $user, int $correctCount, int $totalCount): array
    {
        $participant->update(['status' => 'awaiting_ranking']);

        $activeCount = QuestParticipant::where('quest_id', $quest->id)
            ->where('current_stage', $currentStage->stage_number)
            ->whereIn('status', ['active', 'awaiting_ranking'])
            ->count();

        $awaitingCount = QuestParticipant::where('quest_id', $quest->id)
            ->where('current_stage', $currentStage->stage_number)
            ->where('status', 'awaiting_ranking')
            ->count();

        $deadlinePassed = $currentStage->stage_deadline && now()->gte($currentStage->stage_deadline);

        // Never run ranking in submit — always return awaiting_ranking. Ranking runs when they poll play/status or when the scheduler runs.
        return [
            'outcome' => 'awaiting_ranking',
            'message' => "Submitted! You got {$correctCount}/{$totalCount} correct. Waiting for other participants or the stage deadline...",
            'correct' => $correctCount,
            'total' => $totalCount,
        ];
    }

    /**
     * Run the ranking algorithm for an elimination + MC stage.
     * Only participants with score >= passing_score are eligible to advance; among them, top max_survivors advance.
     * Participants with score < passing_score are always eliminated.
     */
    public function runEliminationRanking($currentStage, Quest $quest, $stages): void
    {
        $stageQuestionIds = $currentStage->questions->pluck('id')->toArray();
        $maxSurvivors = $currentStage->max_survivors ?: PHP_INT_MAX;
        $passingScore = (int) ($currentStage->passing_score ?? 0);
        $nextStageNumber = $currentStage->stage_number + 1;
        $isLastStage = !$stages->contains('stage_number', $nextStageNumber);

        $awaitingParticipants = QuestParticipant::where('quest_id', $quest->id)
            ->where('current_stage', $currentStage->stage_number)
            ->where('status', 'awaiting_ranking')
            ->get();

        $ranked = $awaitingParticipants->map(function ($p) use ($stageQuestionIds) {
            $submissions = Submission::where('participant_id', $p->id)
                ->whereIn('question_id', $stageQuestionIds)
                ->get();

            $score = $submissions->where('is_correct', true)->count();
            $lastSubmission = $submissions->max('submitted_at');

            return [
                'participant' => $p,
                'score' => $score,
                'last_submitted_at' => $lastSubmission,
            ];
        })
        ->sort(function ($a, $b) {
            if ($a['score'] !== $b['score']) {
                return $b['score'] <=> $a['score'];
            }
            $t1 = $a['last_submitted_at'] instanceof \DateTimeInterface
                ? $a['last_submitted_at']->getTimestamp()
                : strtotime((string) $a['last_submitted_at']);
            $t2 = $b['last_submitted_at'] instanceof \DateTimeInterface
                ? $b['last_submitted_at']->getTimestamp()
                : strtotime((string) $b['last_submitted_at']);
            return $t1 <=> $t2;
        })
        ->values();

        // Only participants with score >= passing_score are eligible to advance; rest are eliminated
        $eligible = $ranked->filter(fn ($entry) => $entry['score'] >= $passingScore)->values();
        $eliminatedByScore = $ranked->filter(fn ($entry) => $entry['score'] < $passingScore);
        $totalQuestions = count($stageQuestionIds);
        $questTitle = $quest->title ?? 'Quest';

        foreach ($eliminatedByScore as $entry) {
            $p = $entry['participant'];
            $p->update(['status' => 'eliminated']);
            $fcm = app(FcmService::class);
            $fcm->sendRankingResolved(
                $p->id,
                $quest->id,
                $questTitle,
                'eliminated',
                "Eliminated! You got {$entry['score']}/{$totalQuestions} correct."
            );
        }

        foreach ($eligible as $idx => $entry) {
            $p = $entry['participant'];
            if ($idx < $maxSurvivors) {
                if ($isLastStage) {
                    $p->update(['status' => 'winner']);
                    $this->awardWinner($p, $quest);
                    $fcm = app(FcmService::class);
                    $fcm->sendRankingResolved(
                        $p->id,
                        $quest->id,
                        $questTitle,
                        'completed',
                        "Quest completed! You got {$entry['score']}/{$totalQuestions} correct. You earned {$quest->reward_points} points!"
                    );
                } else {
                    $p->update(['status' => 'active', 'current_stage' => $nextStageNumber]);
                    $fcm = app(FcmService::class);
                    $fcm->sendRankingResolved(
                        $p->id,
                        $quest->id,
                        $questTitle,
                        'advanced',
                        "You advanced to Stage {$nextStageNumber}!"
                    );
                }
            } else {
                $p->update(['status' => 'eliminated']);
                $fcm = app(FcmService::class);
                $fcm->sendRankingResolved(
                    $p->id,
                    $quest->id,
                    $questTitle,
                    'eliminated',
                    "Eliminated! You got {$entry['score']}/{$totalQuestions} correct."
                );
            }
        }

        // Eliminate anyone still "active" who didn't submit (missed deadline)
        $activeEliminatedCount = QuestParticipant::where('quest_id', $quest->id)
            ->where('current_stage', $currentStage->stage_number)
            ->where('status', 'active')
            ->count();
        QuestParticipant::where('quest_id', $quest->id)
            ->where('current_stage', $currentStage->stage_number)
            ->where('status', 'active')
            ->update(['status' => 'eliminated']);
        if ($activeEliminatedCount > 0) {
            Quest::where('id', $quest->id)->where('current_participants', '>=', $activeEliminatedCount)->decrement('current_participants', $activeEliminatedCount);
        }
    }

    /**
     * Build result message after ranking completes.
     */
    private function buildRankingResult(QuestParticipant $participant, int $correctCount, int $totalCount, Quest $quest, $user): array
    {
        if ($participant->status === 'winner') {
            return [
                'outcome' => 'completed',
                'message' => "Quest completed! You got {$correctCount}/{$totalCount} correct. You earned {$quest->reward_points} points!"
                    . ($quest->quest_type === 'enrollment' ? ' You are now enrolled for this semester.' : ''),
                'correct' => $correctCount,
                'total' => $totalCount,
            ];
        }

        if ($participant->status === 'eliminated') {
            return [
                'outcome' => 'eliminated',
                'message' => "Eliminated! You got {$correctCount}/{$totalCount} correct.",
                'correct' => $correctCount,
                'total' => $totalCount,
            ];
        }

        $nextStage = $participant->current_stage;
        return [
            'outcome' => 'advanced',
            'message' => "Stage passed! {$correctCount}/{$totalCount} correct. Moving to stage {$nextStage}.",
            'correct' => $correctCount,
            'total' => $totalCount,
        ];
    }

    /**
     * Mode B: Elimination + QR Scan
     *
     * All stages (including last): set awaiting_ranking and wait for all participants or deadline,
     * then rank by submission time; top max_survivors advance (or win on last stage). Ranking runs on poll/scheduler.
     */
    private function handleElimQR(QuestParticipant $participant, $currentStage, Quest $quest, $stages, $user, bool $isLastStage, int $nextStageNumber): array
    {
        // Never run ranking in submit — always return awaiting_ranking. Ranking runs when they poll play/status or when the scheduler runs.
        return [
            'outcome' => 'awaiting_ranking',
            'message' => $isLastStage
                ? 'Stage submitted! Waiting for other participants or the stage deadline. Then the top finisher(s) will win.'
                : 'Stage submitted! Waiting for other participants to finish or the stage deadline.',
            'correct' => 1,
            'total' => 1,
        ];
    }

    /**
     * Run the ranking algorithm for an elimination + QR stage.
     * Rank by submission time only (earliest = best); top max_survivors advance.
     */
    public function runEliminationRankingQR($currentStage, Quest $quest, $stages): void
    {
        $stageQuestionIds = $currentStage->questions->pluck('id')->toArray();
        $maxSurvivors = $currentStage->max_survivors ?: PHP_INT_MAX;
        $nextStageNumber = $currentStage->stage_number + 1;
        $isLastStage = !$stages->contains('stage_number', $nextStageNumber);

        $awaitingParticipants = QuestParticipant::where('quest_id', $quest->id)
            ->where('current_stage', $currentStage->stage_number)
            ->where('status', 'awaiting_ranking')
            ->get();

        $ranked = $awaitingParticipants->map(function ($p) use ($stageQuestionIds) {
            $lastSubmission = Submission::where('participant_id', $p->id)
                ->whereIn('question_id', $stageQuestionIds)
                ->max('submitted_at');

            return [
                'participant' => $p,
                'last_submitted_at' => $lastSubmission,
            ];
        })
        ->sort(function ($a, $b) {
            $t1 = $a['last_submitted_at'] instanceof \DateTimeInterface
                ? $a['last_submitted_at']->getTimestamp()
                : strtotime((string) $a['last_submitted_at']);
            $t2 = $b['last_submitted_at'] instanceof \DateTimeInterface
                ? $b['last_submitted_at']->getTimestamp()
                : strtotime((string) $b['last_submitted_at']);
            return $t1 <=> $t2;
        })
        ->values();

        $questTitle = $quest->title ?? 'Quest';

        foreach ($ranked as $idx => $entry) {
            $p = $entry['participant'];
            if ($idx < $maxSurvivors) {
                if ($isLastStage) {
                    $p->update(['status' => 'winner']);
                    $this->awardWinner($p, $quest);
                    $fcm = app(FcmService::class);
                    $fcm->sendRankingResolved(
                        $p->id,
                        $quest->id,
                        $questTitle,
                        'completed',
                        'Quest completed! You earned ' . ($quest->reward_points ?? 0) . ' points!'
                    );
                } else {
                    $p->update(['status' => 'active', 'current_stage' => $nextStageNumber]);
                    $fcm = app(FcmService::class);
                    $fcm->sendRankingResolved(
                        $p->id,
                        $quest->id,
                        $questTitle,
                        'advanced',
                        "You advanced to Stage {$nextStageNumber}!"
                    );
                }
            } else {
                $p->update(['status' => 'eliminated']);
                $fcm = app(FcmService::class);
                $fcm->sendRankingResolved(
                    $p->id,
                    $quest->id,
                    $questTitle,
                    'eliminated',
                    'You were eliminated.'
                );
            }
        }

        $activeEliminatedCount = QuestParticipant::where('quest_id', $quest->id)
            ->where('current_stage', $currentStage->stage_number)
            ->where('status', 'active')
            ->count();
        QuestParticipant::where('quest_id', $quest->id)
            ->where('current_stage', $currentStage->stage_number)
            ->where('status', 'active')
            ->update(['status' => 'eliminated']);
        if ($activeEliminatedCount > 0) {
            Quest::where('id', $quest->id)->where('current_participants', '>=', $activeEliminatedCount)->decrement('current_participants', $activeEliminatedCount);
        }
    }

    /**
     * If the participant is awaiting_ranking and ranking is ready (all submitted or deadline passed),
     * run elimination ranking so the next play/status response returns the resolved outcome.
     * Called from play() and status() so polling sees "Waiting for results" then gets advanced/eliminated.
     */
    public function tryRunEliminationRankingIfReady(QuestParticipant $participant): void
    {
        if ($participant->status !== 'awaiting_ranking') {
            return;
        }

        $participant->load(['quest' => fn ($q) => $q->with(['stages' => fn ($sq) => $sq->orderBy('stage_number')])]);
        $quest = $participant->quest;
        if (!$quest || !$quest->is_elimination) {
            return;
        }

        $stages = $quest->stages;
        $currentStage = $stages->firstWhere('stage_number', $participant->current_stage);
        if (!$currentStage) {
            return;
        }

        $activeCount = QuestParticipant::where('quest_id', $quest->id)
            ->where('current_stage', $currentStage->stage_number)
            ->whereIn('status', ['active', 'awaiting_ranking'])
            ->count();

        $awaitingCount = QuestParticipant::where('quest_id', $quest->id)
            ->where('current_stage', $currentStage->stage_number)
            ->where('status', 'awaiting_ranking')
            ->count();

        $deadlinePassed = $currentStage->stage_deadline && now()->gte($currentStage->stage_deadline);

        if ($awaitingCount < $activeCount && !$deadlinePassed) {
            return;
        }

        $allStages = $quest->stages->sortBy('stage_number')->values();
        if ($quest->question_type === 'qr_scan') {
            $this->runEliminationRankingQR($currentStage, $quest, $allStages);
        } else {
            $quest->load('stages.questions.choices');
            $this->runEliminationRanking($currentStage, $quest, $allStages);
        }
    }

    /**
     * Build result message after QR elimination ranking completes.
     */
    private function buildRankingResultQR(QuestParticipant $participant, Quest $quest, $user): array
    {
        if ($participant->status === 'winner') {
            return [
                'outcome' => 'completed',
                'message' => "Quest completed! You earned {$quest->reward_points} points!"
                    . ($quest->quest_type === 'enrollment' ? ' You are now enrolled for this semester.' : ''),
                'correct' => 1,
                'total' => 1,
            ];
        }

        if ($participant->status === 'eliminated') {
            return [
                'outcome' => 'eliminated',
                'message' => 'Eliminated! You did not rank in the top this stage.',
                'correct' => 0,
                'total' => 1,
            ];
        }

        $nextStage = $participant->current_stage;
        return [
            'outcome' => 'advanced',
            'message' => "Stage passed! Moving to stage {$nextStage}.",
            'correct' => 1,
            'total' => 1,
        ];
    }

    /**
     * Count how many participants have already advanced past a given stage.
     */
    private function countCompletedForStage(int $questId, $stage): int
    {
        return QuestParticipant::where('quest_id', $questId)
            ->where(function ($q) use ($stage) {
                $q->where('current_stage', '>', $stage->stage_number)
                    ->orWhere(function ($inner) use ($stage) {
                        $inner->where('status', 'winner')
                            ->where('current_stage', $stage->stage_number);
                    });
            })
            ->count();
    }

    /**
     * Mode C: Non-Elimination + Multiple Choice
     * Pass if score >= passing_score, else fail.
     * Advance immediately when the user passes (no waiting for stage deadline).
     */
    private function handleNonElimMC(QuestParticipant $participant, $currentStage, Quest $quest, $user, int $correctCount, int $totalCount, bool $isLastStage, int $nextStageNumber): array
    {
        $passingScore = (int) ($currentStage->passing_score ?? 0);

        if ($correctCount >= $passingScore) {
            if ($isLastStage) {
                // Stage passed + last stage: set outcome "completed", status to "winner", populate rewards, award points to user.
                $participant->update(['status' => 'winner']);
                $participant->refresh();
                $this->awardWinner($participant, $quest);
                return [
                    'outcome' => 'completed',
                    'message' => "Quest completed! You got {$correctCount}/{$totalCount} correct (needed {$passingScore}). You earned {$quest->reward_points} points!"
                        . ($quest->quest_type === 'enrollment' ? ' You are now enrolled for this semester.' : ''),
                    'correct' => $correctCount,
                    'total' => $totalCount,
                ];
            }
            // Stage passed + more stages: set outcome "advanced", increment current_stage in DB; play payload will have next_stage_location_hint / next_stage_starts_at.
            $participant->update(['current_stage' => $nextStageNumber]);
            $participant->refresh();
            return [
                'outcome' => 'advanced',
                'message' => "Stage passed! {$correctCount}/{$totalCount} correct (needed {$passingScore}). Moving to stage {$nextStageNumber}.",
                'correct' => $correctCount,
                'total' => $totalCount,
            ];
        }

        $participant->update(['status' => 'eliminated']);
        $participant->refresh();
        return [
            'outcome' => 'eliminated',
            'message' => "Failed! You got {$correctCount}/{$totalCount} correct but needed {$passingScore}.",
            'correct' => $correctCount,
            'total' => $totalCount,
        ];
    }

    /**
     * Mode D: Non-Elimination + QR Scan
     * Advance immediately when user completes the QR scan. If last stage → winner.
     */
    private function handleNonElimQR(QuestParticipant $participant, Quest $quest, $user, bool $isLastStage, int $nextStageNumber, int $totalCount): array
    {
        if ($isLastStage) {
            $participant->update(['status' => 'winner']);
            $participant->refresh();
            $this->awardWinner($participant, $quest);
            return [
                'outcome' => 'completed',
                'message' => "Quest completed! You earned {$quest->reward_points} points!"
                    . ($quest->quest_type === 'enrollment' ? ' You are now enrolled for this semester.' : ''),
                'correct' => 1,
                'total' => 1,
            ];
        }

        $participant->update(['current_stage' => $nextStageNumber]);
        $participant->refresh();
        return [
            'outcome' => 'advanced',
            'message' => "Stage passed! Moving to stage {$nextStageNumber}.",
            'correct' => 1,
            'total' => 1,
        ];
    }

    /**
     * Award winner: increment stats, XP, level, and handle enrollment.
     */
    private function awardWinner(QuestParticipant $participant, Quest $quest): void
    {
        $user = $participant->user ?? \App\Models\User::find($participant->user_id);
        if (!$user) {
            return;
        }

        $user->increment('total_completed_quests');
        $user->increment('quests_won');

        if ($quest->reward_points > 0) {
            $user->increment('points_balance', $quest->reward_points);
            $user->increment('total_xp_earned', $quest->reward_points);

            PointTransaction::create([
                'user_id' => $user->id,
                'amount' => $quest->reward_points,
                'transaction_type' => PointTransaction::TYPE_QUEST_REWARD,
                'reference_id' => $quest->id,
            ]);
        }

        if ($quest->reward_custom_prize) {
            UserInventory::create([
                'user_id' => $user->id,
                'item_id' => null,
                'quantity' => 1,
                'custom_prize_description' => $quest->reward_custom_prize,
                'source_quest_id' => $quest->id,
            ]);
        }

        $user->refresh();
        $newLevel = (int) floor(($user->total_xp_earned ?? 0) / 100);
        if ($newLevel !== (int) $user->level) {
            $user->update(['level' => $newLevel]);
        }

        if ($quest->quest_type === 'enrollment' && $quest->semester_id) {
            $semester = Semester::find($quest->semester_id);
            if ($semester) {
                Enrollment::firstOrCreate(
                    ['user_id' => $user->id, 'semester' => $semester->name],
                    ['is_enrolled' => true],
                );
            }
        }

        // Award "complete specific quest" achievements for this quest
        $questAchievements = Achievement::where('requirement_type', Achievement::REQUIREMENT_TYPE_COMPLETE_QUEST)
            ->where('requirement_value', $quest->id)
            ->get();
        foreach ($questAchievements as $achievement) {
            $exists = UserAchievement::where('user_id', $user->id)->where('achievement_id', $achievement->id)->exists();
            if (! $exists) {
                UserAchievement::create([
                    'user_id' => $user->id,
                    'achievement_id' => $achievement->id,
                    'earned_at' => now(),
                ]);
                ActivityLog::log(
                    $user->id,
                    ActivityLog::ACTION_ACHIEVEMENT_EARNED,
                    sprintf('%s (id %s)', $achievement->name, $achievement->id)
                );
            }
        }
    }

    /**
     * Check whether the user is in the quest's target participants.
     * If the quest has no target groups, any user is eligible.
     * If the quest has target groups, the user must match at least one (via master record course/year_level/section).
     * Nullable target group fields mean "any"; user must match all non-null fields of at least one group.
     */
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
