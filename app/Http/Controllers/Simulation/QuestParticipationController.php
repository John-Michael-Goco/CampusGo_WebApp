<?php

namespace App\Http\Controllers\Simulation;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Enrollment;
use App\Models\PointTransaction;
use App\Models\Quest;
use App\Models\QuestParticipant;
use App\Models\Semester;
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

        $availableQuests = Quest::query()
            ->where('approval_status', 'approved')
            ->whereIn('status', ['upcoming', 'ongoing'])
            ->doesntHave('targetGroups')
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
        $quest = Quest::with(['stages' => fn ($q) => $q->orderBy('stage_number')])->find($request->input('quest_id'));

        if (!$quest) {
            return back()->withErrors(['quest_id' => 'Quest not found.']);
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

        if ($quest->max_participants > 0 && $quest->current_participants >= $quest->max_participants) {
            return back()->withErrors(['quest_id' => 'This quest is full.']);
        }

        if ($quest->buy_in_points > 0 && ($user->points_balance ?? 0) < $quest->buy_in_points) {
            return back()->withErrors(['quest_id' => 'Not enough points. You need ' . $quest->buy_in_points . ' pts to join.']);
        }

        DB::transaction(function () use ($quest, $user) {
            QuestParticipant::create([
                'quest_id' => $quest->id,
                'user_id' => $user->id,
                'current_stage' => 1,
                'status' => 'active',
            ]);

            $quest->increment('current_participants');

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
        });

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
        if ($currentStage) {
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

        $submissionsData = $participant->submissions->map(fn ($s) => [
            'id' => $s->id,
            'question_id' => $s->question_id,
            'answer' => $s->answer,
            'is_correct' => $s->is_correct,
            'submitted_at' => $s->submitted_at?->toDateTimeString(),
        ])->all();

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
            ],
            'stage' => $stageData ? array_merge($stageData, [
                'passing_score' => $currentStage->passing_score,
            ]) : null,
            'submissions' => $submissionsData,
        ]);
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
        ->sortByDesc('score')
        ->sortBy('last_submitted_at')
        ->sortByDesc('score')
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
     * First max_survivors to complete all scans advance.
     */
    private function handleElimQR(QuestParticipant $participant, $currentStage, Quest $quest, $stages, $user, bool $isLastStage, int $nextStageNumber): array
    {
        $maxSurvivors = $currentStage->max_survivors ?: PHP_INT_MAX;

        $completedBefore = $this->countCompletedForStage($quest->id, $currentStage);

        if ($completedBefore < $maxSurvivors) {
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

        $participant->update(['status' => 'eliminated']);
        return [
            'outcome' => 'eliminated',
            'message' => 'Eliminated! You did not scan fast enough.',
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
     */
    private function handleNonElimMC(QuestParticipant $participant, $currentStage, Quest $quest, $user, int $correctCount, int $totalCount, bool $isLastStage, int $nextStageNumber): array
    {
        $passingScore = $currentStage->passing_score ?? 0;

        if ($correctCount >= $passingScore) {
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
     * Always advance. If last stage → winner.
     */
    private function handleNonElimQR(QuestParticipant $participant, Quest $quest, $user, bool $isLastStage, int $nextStageNumber, int $totalCount): array
    {
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
    }
}
