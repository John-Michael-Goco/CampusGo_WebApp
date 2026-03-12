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

        $isElimination = (bool) $quest->is_elimination;
        $questionType = $quest->question_type ?? 'multiple_choice';

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

            $allStageQuestionsAnswered = Submission::where('participant_id', $participant->id)
                ->whereIn('question_id', $stageQuestionIds)
                ->count() >= count($stageQuestionIds);

            if (!$allStageQuestionsAnswered) {
                return ['outcome' => 'partial', 'correct' => $correctCount, 'total' => $totalCount];
            }

            $nextStageNumber = $participant->current_stage + 1;
            $isLastStage = !$stages->contains('stage_number', $nextStageNumber);

            if ($isElimination && $questionType === 'multiple_choice') {
                return $this->handleElimMC($participant, $currentStage, $quest, $stages, $user, $correctCount, $totalCount);
            }

            if ($isElimination && $questionType === 'qr_scan') {
                return $this->handleElimQR($participant, $currentStage, $quest, $stages, $user, $isLastStage, $nextStageNumber);
            }

            if (!$isElimination && $questionType === 'multiple_choice') {
                return $this->handleNonElimMC($participant, $currentStage, $quest, $user, $correctCount, $totalCount, $isLastStage, $nextStageNumber);
            }

            // Non-elimination + QR scan: always advance
            return $this->handleNonElimQR($participant, $quest, $user, $isLastStage, $nextStageNumber, $totalCount);
        });

        ActivityLog::log($user->id, ActivityLog::ACTION_QUEST_STAGE_SUBMITTED, $quest->title . ' (stage ' . $participant->current_stage . ')');

        return back()->with('status', $results['message']);
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

        if ($awaitingCount >= $activeCount || $deadlinePassed) {
            $this->runEliminationRanking($currentStage, $quest, $stages);
            $participant->refresh();

            return $this->buildRankingResult($participant, $correctCount, $totalCount, $quest, $user);
        }

        return [
            'outcome' => 'awaiting_ranking',
            'message' => "Submitted! You got {$correctCount}/{$totalCount} correct. Waiting for other participants...",
        ];
    }

    /**
     * Run the ranking algorithm for an elimination + MC stage.
     */
    public function runEliminationRanking($currentStage, Quest $quest, $stages): void
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

        foreach ($ranked as $idx => $entry) {
            $p = $entry['participant'];
            if ($idx < $maxSurvivors) {
                if ($isLastStage) {
                    $p->update(['status' => 'winner']);
                    $this->awardWinner($p, $quest);
                } else {
                    $p->update(['status' => 'active', 'current_stage' => $nextStageNumber]);
                }
            } else {
                $p->update(['status' => 'eliminated']);
            }
        }

        // Eliminate anyone still "active" who didn't submit (missed deadline)
        QuestParticipant::where('quest_id', $quest->id)
            ->where('current_stage', $currentStage->stage_number)
            ->where('status', 'active')
            ->update(['status' => 'eliminated']);
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
            ];
        }

        if ($participant->status === 'eliminated') {
            return [
                'outcome' => 'eliminated',
                'message' => "Eliminated! You got {$correctCount}/{$totalCount} correct.",
            ];
        }

        $nextStage = $participant->current_stage;
        return [
            'outcome' => 'advanced',
            'message' => "Stage passed! {$correctCount}/{$totalCount} correct. Moving to stage {$nextStage}.",
        ];
    }

    /**
     * Mode B: Elimination + QR Scan
     * Wait for all participants on the stage to submit (or deadline). Then rank by submission time only;
     * top max_survivors advance (earliest submitter wins).
     */
    private function handleElimQR(QuestParticipant $participant, $currentStage, Quest $quest, $stages, $user, bool $isLastStage, int $nextStageNumber): array
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

        if ($awaitingCount >= $activeCount || $deadlinePassed) {
            $this->runEliminationRankingQR($currentStage, $quest, $stages);
            $participant->refresh();

            return $this->buildRankingResultQR($participant, $quest, $user);
        }

        return [
            'outcome' => 'awaiting_ranking',
            'message' => 'Stage submitted! Waiting for other participants to finish or the stage deadline.',
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

        foreach ($ranked as $idx => $entry) {
            $p = $entry['participant'];
            if ($idx < $maxSurvivors) {
                if ($isLastStage) {
                    $p->update(['status' => 'winner']);
                    $this->awardWinner($p, $quest);
                } else {
                    $p->update(['status' => 'active', 'current_stage' => $nextStageNumber]);
                }
            } else {
                $p->update(['status' => 'eliminated']);
            }
        }

        QuestParticipant::where('quest_id', $quest->id)
            ->where('current_stage', $currentStage->stage_number)
            ->where('status', 'active')
            ->update(['status' => 'eliminated']);
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
            ];
        }

        if ($participant->status === 'eliminated') {
            return [
                'outcome' => 'eliminated',
                'message' => 'Eliminated! You did not rank in the top this stage.',
            ];
        }

        $nextStage = $participant->current_stage;
        return [
            'outcome' => 'advanced',
            'message' => "Stage passed! Moving to stage {$nextStage}.",
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
     * Advance only when the stage end date (or quest end date) has passed.
     */
    private function handleNonElimMC(QuestParticipant $participant, $currentStage, Quest $quest, $user, int $correctCount, int $totalCount, bool $isLastStage, int $nextStageNumber): array
    {
        $passingScore = $currentStage->passing_score ?? 0;

        if ($correctCount >= $passingScore) {
            $stageEnd = $currentStage->stage_deadline ?? $quest->end_date;
            if ($stageEnd && now()->lt($stageEnd)) {
                return [
                    'outcome' => 'stage_not_ended',
                    'message' => 'Your answers are correct, but this stage has not ended yet. You can advance after ' . $stageEnd->format('M j, Y g:i A') . '.',
                ];
            }
            if ($isLastStage) {
                $participant->update(['status' => 'winner']);
                $this->awardWinner($participant, $quest);
                return [
                    'outcome' => 'completed',
                    'message' => "Quest completed! You got {$correctCount}/{$totalCount} correct (needed {$passingScore}). You earned {$quest->reward_points} points!"
                        . ($quest->quest_type === 'enrollment' ? ' You are now enrolled for this semester.' : ''),
                ];
            }
            $participant->update(['current_stage' => $nextStageNumber]);
            return [
                'outcome' => 'advanced',
                'message' => "Stage passed! {$correctCount}/{$totalCount} correct (needed {$passingScore}). Moving to stage {$nextStageNumber}.",
            ];
        }

        $participant->update(['status' => 'eliminated']);
        return [
            'outcome' => 'eliminated',
            'message' => "Failed! You got {$correctCount}/{$totalCount} correct but needed {$passingScore}.",
        ];
    }

    /**
     * Mode D: Non-Elimination + QR Scan
     * Advance only when the stage end date (or quest end date) has passed. If last stage → winner.
     */
    private function handleNonElimQR(QuestParticipant $participant, Quest $quest, $user, bool $isLastStage, int $nextStageNumber, int $totalCount): array
    {
        $currentStage = $quest->stages->sortBy('stage_number')->firstWhere('stage_number', $participant->current_stage);
        $stageEnd = $currentStage?->stage_deadline ?? $quest->end_date;
        if ($stageEnd && now()->lt($stageEnd)) {
            return [
                'outcome' => 'stage_not_ended',
                'message' => 'Stage submitted, but this stage has not ended yet. You can advance after ' . $stageEnd->format('M j, Y g:i A') . '.',
            ];
        }
        if ($isLastStage) {
            $participant->update(['status' => 'winner']);
            $this->awardWinner($participant, $quest);
            return [
                'outcome' => 'completed',
                'message' => "Quest completed! You earned {$quest->reward_points} points!"
                    . ($quest->quest_type === 'enrollment' ? ' You are now enrolled for this semester.' : ''),
            ];
        }

        $participant->update(['current_stage' => $nextStageNumber]);
        return [
            'outcome' => 'advanced',
            'message' => "Stage passed! Moving to stage {$nextStageNumber}.",
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
