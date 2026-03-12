<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\MasterUser;
use App\Models\PointTransaction;
use App\Models\Quest;
use App\Models\QuestParticipant;
use App\Models\User;
use App\Models\QuestQuestionChoice;
use App\Models\Submission;
use App\Models\Semester;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class QuestController extends Controller
{
    /**
     * Show quests for approval (admin only). Filter by approval status via dropdown.
     */
    public function pending(Request $request): Response
    {
        $search = (string) $request->query('search', '');
        $status = (string) $request->query('status', 'pending');

        $query = Quest::query()
            ->with(['creator:id,name'])
            ->orderByDesc('created_at');

        if (in_array($status, ['pending', 'approved', 'rejected'], true)) {
            $query->where('approval_status', $status);
        }

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', '%' . $search . '%')
                    ->orWhere('description', 'like', '%' . $search . '%');
            });
        }

        $quests = $query->paginate(15)->withQueryString();

        return Inertia::render('quests/approval', [
            'quests' => $quests,
            'filters' => ['search' => $search, 'status' => $status],
        ]);
    }

    /**
     * Show quests created by the current user (gamemaster: "Created Quests" / professor "Approval"). Filter by approval status via dropdown.
     */
    public function createdByMe(Request $request): Response
    {
        $search = (string) $request->query('search', '');
        $status = (string) $request->query('status', 'pending');

        $query = Quest::query()
            ->where('created_by', $request->user()->id)
            ->orderByDesc('created_at');

        if (in_array($status, ['pending', 'approved', 'rejected'], true)) {
            $query->where('approval_status', $status);
        }

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', '%' . $search . '%')
                    ->orWhere('description', 'like', '%' . $search . '%');
            });
        }

        $quests = $query->paginate(15)->withQueryString();

        return Inertia::render('quests/created', [
            'quests' => $quests,
            'filters' => ['search' => $search, 'status' => $status],
        ]);
    }

    /**
     * Show quest history: completed or cancelled quests. Admin and professor see all; use "Created by me" filter to restrict.
     */
    public function history(Request $request): Response
    {
        $search = (string) $request->query('search', '');
        $questType = (string) $request->query('quest_type', '');
        $createdByMe = $request->query('created_by_me') === '1';
        $user = $request->user();

        $query = Quest::query()
            ->with(['creator:id,name'])
            ->whereIn('status', ['completed', 'cancelled'])
            ->orderByDesc('updated_at');

        if ($createdByMe) {
            $query->where('created_by', $user->id);
        }

        if ($questType !== '' && in_array($questType, ['daily', 'event', 'custom', 'enrollment'], true)) {
            $query->where('quest_type', $questType);
        }

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', '%' . $search . '%')
                    ->orWhere('description', 'like', '%' . $search . '%');
            });
        }

        $quests = $query->paginate(15)->withQueryString();

        return Inertia::render('quests/history', [
            'quests' => $quests,
            'filters' => ['search' => $search, 'quest_type' => $questType, 'created_by_me' => $createdByMe],
        ]);
    }

    /**
     * Show active quests (approved & ongoing/upcoming).
     */
    public function active(Request $request): Response
    {
        $filters = [
            'search' => (string) $request->query('search', ''),
            'quest_type' => (string) $request->query('quest_type', ''),
            'created_by_me' => $request->query('created_by_me') === '1',
            'sort_by' => (string) $request->query('sort_by', 'start_date'),
            'sort_dir' => (string) $request->query('sort_dir', 'desc'),
        ];

        $sortBy = in_array($filters['sort_by'], ['title', 'quest_type', 'status', 'start_date', 'end_date'], true)
            ? $filters['sort_by']
            : 'start_date';
        $sortDir = $filters['sort_dir'] === 'asc' ? 'asc' : 'desc';

        $query = Quest::query()
            ->with(['creator:id,name'])
            ->where('approval_status', 'approved')
            ->whereIn('status', ['upcoming', 'ongoing']);

        if ($filters['created_by_me']) {
            $query->where('created_by', $request->user()->id);
        }

        if ($filters['search'] !== '') {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($filters['quest_type'] !== '') {
            $query->where('quest_type', $filters['quest_type']);
        }

        $quests = $query
            ->orderBy($sortBy, $sortDir)
            ->orderBy('title')
            ->paginate(10)
            ->withQueryString([
                'search' => $filters['search'] ?: null,
                'quest_type' => $filters['quest_type'] ?: null,
                'created_by_me' => $filters['created_by_me'] ? '1' : null,
                'sort_by' => $sortBy,
                'sort_dir' => $sortDir,
            ]);

        return Inertia::render('quests/active', [
            'quests' => $quests,
            'filters' => $filters,
        ]);
    }

    /**
     * Show the create-quest form.
     */
    public function create(Request $request): Response
    {
        $questData = null;
        if ($request->has('questData')) {
            $questData = json_decode((string) $request->query('questData', '{}'), true);
        }

        return Inertia::render('quests/actions/form', [
            'questData' => $questData,
            'enrollmentSemester' => $this->getAvailableEnrollmentSemester(),
        ]);
    }

    /**
     * Show the quest stages form (step 2).
     */
    public function stages(Request $request): Response
    {
        $questData = json_decode((string) $request->query('questData', '{}'), true) ?: [];

        return Inertia::render('quests/actions/stages', [
            'questData' => $questData,
        ]);
    }

    /**
     * Store a new quest with stages, questions, choices, and target groups.
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate(
            $this->questValidationRules($request, null),
            $this->questValidationMessages(),
        );

        $isElimination = (bool) $request->input('quest.is_elimination', false);
        $stageDeadlineError = $this->validateStageDeadlinesOrder($request->input('stages', []), $isElimination);
        if ($stageDeadlineError !== null) {
            return back()->withErrors(['stages' => $stageDeadlineError]);
        }
        if (!$isElimination) {
            $rangeError = $this->validateNonElimStageDeadlinesInRange(
                $request->input('stages', []),
                $request->input('quest.start_date'),
                $request->input('quest.end_date'),
            );
            if ($rangeError !== null) {
                return back()->withErrors(['stages' => $rangeError]);
            }
        }

        $stageStartError = $this->validateStageStartBeforeEnd(
            $request->input('stages', []),
            $request->input('quest.start_date'),
            $request->input('quest.end_date'),
        );
        if ($stageStartError !== null) {
            return back()->withErrors(['stages' => $stageStartError]);
        }

        $passingScoreError = $this->validatePassingScoreAchievable(
            $request->input('stages', []),
            (bool) $request->input('quest.is_elimination', false),
            $request->input('quest.question_type', 'multiple_choice'),
        );
        if ($passingScoreError !== null) {
            return back()->withErrors(['stages' => $passingScoreError]);
        }

        $correctAnswerError = $this->validateChoicesHaveCorrectAnswer(
            $request->input('stages', []),
            $request->input('quest.question_type', 'multiple_choice'),
        );
        if ($correctAnswerError !== null) {
            return back()->withErrors(['stages' => $correctAnswerError]);
        }

        $user = $request->user();
        $isAdmin = $user->role === 'admin';
        $questInput = $request->input('quest');

        if ($user->role === 'professor' && ! in_array($questInput['quest_type'] ?? '', ['custom', 'event'], true)) {
            return back()->withErrors(['quest.quest_type' => 'Professors can only create Custom or Event quests.']);
        }

        if ($questInput['quest_type'] === 'enrollment' && $questInput['question_type'] !== 'qr_scan') {
            return back()->withErrors(['quest.question_type' => 'Enrollment quests must use QR scan only.']);
        }

        $semesterId = null;
        if ($questInput['quest_type'] === 'enrollment') {
            $semester = $this->getAvailableEnrollmentSemester();
            if (!$semester) {
                return back()->withErrors(['quest.quest_type' => 'No available semester for an enrollment quest.']);
            }
            $semesterId = $semester['id'];
        }

        $questQuestionType = $questInput['question_type'];

        return DB::transaction(function () use ($questInput, $request, $user, $isAdmin, $semesterId, $questQuestionType) {
            $quest = Quest::create([
                'title' => $questInput['title'],
                'description' => $questInput['description'] ?? null,
                'quest_type' => $questInput['quest_type'],
                'question_type' => $questInput['question_type'],
                'is_elimination' => (bool) ($questInput['is_elimination'] ?? false),
                'buy_in_points' => (int) ($questInput['buy_in_points'] ?? 0),
                'reward_points' => (int) ($questInput['reward_points'] ?? 0),
                'reward_custom_prize' => $questInput['reward_custom_prize'] ?? null,
                'max_participants' => $questInput['max_participants'] ? (int) $questInput['max_participants'] : 0,
                'created_by' => $user->id,
                'approval_status' => $isAdmin ? 'approved' : 'pending',
                'creation_payment_status' => ($isAdmin || $user->role === 'professor') ? 'paid' : 'pending',
                'creation_cost_points' => ($isAdmin || $user->role === 'professor') ? 0 : 0,
                'start_date' => $questInput['start_date'] ?: null,
                'end_date' => $questInput['end_date'] ?: null,
                'semester_id' => $semesterId,
            ]);

            $target = $questInput['target'] ?? null;
            if ($target && ($target['target_type'] ?? 'everyone') === 'specific') {
                $quest->targetGroups()->create([
                    'course' => $target['course'] ?: null,
                    'year_level' => $target['year_level'] ? (int) $target['year_level'] : null,
                    'section' => $target['section'] ?: null,
                ]);
            }

            $stagesInput = $request->input('stages', []);
            $lastStageIdx = count($stagesInput) - 1;
            foreach ($stagesInput as $idx => $stageInput) {
                $isLastStage = $idx === $lastStageIdx;
                $stageDeadline = $isLastStage ? ($questInput['end_date'] ?? $stageInput['stage_deadline'] ?? null) : ($stageInput['stage_deadline'] ?: null);
                $stage = $quest->stages()->create([
                    'stage_number' => $idx + 1,
                    'location_hint' => $stageInput['location_hint'],
                    'max_survivors' => $stageInput['max_survivors'] ? (int) $stageInput['max_survivors'] : 0,
                    'passing_score' => $stageInput['passing_score'] ? (int) $stageInput['passing_score'] : null,
                    'minimum_participants' => $stageInput['minimum_participants'] ? (int) $stageInput['minimum_participants'] : 1,
                    'stage_deadline' => $stageDeadline,
                    'stage_start' => $stageInput['stage_start'] ?? null,
                    'status' => 'locked',
                ]);

                if ($questQuestionType === 'multiple_choice') {
                    foreach ($stageInput['questions'] ?? [] as $qInput) {
                        $question = $stage->questions()->create([
                            'question_text' => $qInput['question_text'] ?? '',
                            'question_type' => 'multiple_choice',
                        ]);

                        $sortOrder = 0;
                        foreach ($qInput['choices'] ?? [] as $choiceInput) {
                            $choiceText = trim((string) ($choiceInput['choice_text'] ?? ''));
                            if ($choiceText === '') {
                                continue;
                            }
                            QuestQuestionChoice::create([
                                'quest_question_id' => $question->id,
                                'choice_text' => $choiceText,
                                'sort_order' => $sortOrder++,
                                'is_correct' => (bool) ($choiceInput['is_correct'] ?? false),
                            ]);
                        }
                    }
                } else {
                    $stage->questions()->create([
                        'question_text' => 'QR Scan',
                        'question_type' => 'qr_scan',
                    ]);
                }
            }

            ActivityLog::log($user->id, ActivityLog::ACTION_QUEST_CREATED, $quest->title);

            return redirect()->route('quests.active')->with('success', 'Quest created successfully.');
        });
    }

    /**
     * Show a single quest (read-only view).
     */
    public function show(Request $request, Quest $quest): Response
    {
        $quest->load('targetGroups', 'stages.questions.choices', 'creator:id,name', 'participants.user:id,name,email,profile_image');

        $target = $quest->targetGroups->first();
        $targetDisplay = $target && ($target->course || $target->year_level || $target->section)
            ? trim(implode(' ', array_filter([
                $target->course,
                $target->year_level ? 'Yr ' . $target->year_level : null,
                $target->section,
            ])))
            : 'Everyone';

        $stages = $quest->stages->sortBy('stage_number')->values()->map(function ($stage) {
            $questions = $stage->questions->map(function ($question) {
                $choices = $question->choices->sortBy('sort_order')->values()->map(fn ($c) => [
                    'choice_text' => $c->choice_text,
                    'is_correct' => $c->is_correct,
                ])->all();
                return [
                    'id' => $question->id,
                    'question_text' => $question->question_text,
                    'question_type' => $question->question_type,
                    'choices' => $choices,
                ];
            })->all();
            return [
                'id' => $stage->id,
                'stage_number' => $stage->stage_number,
                'location_hint' => $stage->location_hint,
                'max_survivors' => $stage->max_survivors,
                'passing_score' => $stage->passing_score,
                'minimum_participants' => $stage->minimum_participants,
                'stage_deadline' => $stage->stage_deadline?->format('Y-m-d H:i'),
                'questions' => $questions,
            ];
        })->all();

        $isMultipleChoice = ($quest->question_type ?? '') === 'multiple_choice';
        if ($isMultipleChoice) {
            $quest->load('participants.submissions');
        }

        $participants = $quest->participants->map(function ($p) use ($isMultipleChoice) {
            $user = $p->user;
            $payload = [
                'id' => $p->id,
                'current_stage' => $p->current_stage,
                'status' => $p->status,
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email ?? null,
                    'avatar' => $user->avatar,
                ] : null,
            ];
            if ($isMultipleChoice && $p->relationLoaded('submissions')) {
                $payload['submissions'] = $p->submissions->map(fn ($s) => [
                    'question_id' => $s->question_id,
                    'is_correct' => $s->is_correct,
                ])->values()->all();
            }
            return $payload;
        })->values()->all();

        $from = $request->query('from');
        $createdStatus = $request->query('created_status');
        $approvalStatusFilter = $request->query('approval_status_filter');
        $activeSearch = $request->query('active_search');
        $activeQuestType = $request->query('active_quest_type');
        $activeCreatedByMe = $request->query('active_created_by_me');
        $activeSortBy = $request->query('active_sort_by');
        $activeSortDir = $request->query('active_sort_dir');
        $historySearch = $request->query('history_search');
        $historyQuestType = $request->query('history_quest_type');
        $historyCreatedByMe = $request->query('history_created_by_me');

        return Inertia::render('quests/show', [
            'quest' => [
                'id' => $quest->id,
                'title' => $quest->title,
                'description' => $quest->description,
                'quest_type' => $quest->quest_type,
                'question_type' => $quest->question_type,
                'is_elimination' => $quest->is_elimination,
                'reward_points' => $quest->reward_points,
                'reward_custom_prize' => $quest->reward_custom_prize,
                'max_participants' => $quest->max_participants,
                'start_date' => $quest->start_date?->format('Y-m-d H:i'),
                'end_date' => $quest->end_date?->format('Y-m-d H:i'),
                'status' => $quest->status,
                'approval_status' => $quest->approval_status,
                'creator' => $quest->creator ? ['id' => $quest->creator->id, 'name' => $quest->creator->name] : null,
                'target_display' => $targetDisplay,
                'stages' => $stages,
                'participants' => $participants,
            ],
            'from' => $from,
            'created_status' => $createdStatus,
            'approval_status_filter' => $approvalStatusFilter,
            'active_search' => $activeSearch,
            'active_quest_type' => $activeQuestType,
            'active_created_by_me' => $activeCreatedByMe,
            'active_sort_by' => $activeSortBy,
            'active_sort_dir' => $activeSortDir,
            'history_search' => $historySearch,
            'history_quest_type' => $historyQuestType,
            'history_created_by_me' => $historyCreatedByMe,
        ]);
    }

    /**
     * Show a print-friendly page with all stage QR codes (2 per page).
     * Admin: any quest. Professor: only quests they created that are approved (not pending/rejected).
     */
    public function printQr(Request $request, Quest $quest): Response
    {
        $user = $request->user();
        if ($user->role === 'admin') {
            // allow
        } elseif ($user->role === 'professor' && (int) $quest->created_by === (int) $user->id) {
            // allow professor to print QR for any quest they created (active, history, etc.)
        } else {
            abort(403, 'You do not have permission to print QR codes for this quest.');
        }

        $quest->load('stages');

        $stages = $quest->stages->sortBy('stage_number')->values()->map(fn ($stage) => [
            'id' => $stage->id,
            'stage_number' => $stage->stage_number,
        ])->all();

        $from = $request->query('from');
        $list = $request->query('list');
        $createdStatus = $request->query('created_status');
        $approvalStatusFilter = $request->query('approval_status_filter');
        $activeSearch = $request->query('active_search');
        $activeQuestType = $request->query('active_quest_type');
        $activeCreatedByMe = $request->query('active_created_by_me');
        $activeSortBy = $request->query('active_sort_by');
        $activeSortDir = $request->query('active_sort_dir');
        $historySearch = $request->query('history_search');
        $historyQuestType = $request->query('history_quest_type');
        $historyCreatedByMe = $request->query('history_created_by_me');

        return Inertia::render('quests/print-qr', [
            'quest' => [
                'id' => $quest->id,
                'title' => $quest->title,
            ],
            'stages' => $stages,
            'from' => $from,
            'list' => $list,
            'created_status' => $createdStatus,
            'approval_status_filter' => $approvalStatusFilter,
            'active_search' => $activeSearch,
            'active_quest_type' => $activeQuestType,
            'active_created_by_me' => $activeCreatedByMe,
            'active_sort_by' => $activeSortBy,
            'active_sort_dir' => $activeSortDir,
            'history_search' => $historySearch,
            'history_quest_type' => $historyQuestType,
            'history_created_by_me' => $historyCreatedByMe,
        ]);
    }

    /**
     * Show the edit-quest form (step 1).
     */
    public function edit(Request $request, Quest $quest): Response
    {
        $quest->load('targetGroups', 'stages.questions.choices');

        $target = $quest->targetGroups->first();
        $questData = [
            'target' => $target ? [
                'target_type' => 'specific',
                'course' => $target->course ?? '',
                'year_level' => $target->year_level ? (string) $target->year_level : '',
                'section' => $target->section ?? '',
            ] : [
                'target_type' => 'everyone',
                'course' => '',
                'year_level' => '',
                'section' => '',
            ],
            'title' => $quest->title,
            'description' => $quest->description ?? '',
            'quest_type' => $quest->quest_type,
            'question_type' => $quest->question_type ?? 'multiple_choice',
            'num_stages' => $quest->stages->count() ?: 1,
            'is_elimination' => $quest->is_elimination,
            'buy_in_points' => $quest->buy_in_points ?: '',
            'reward_points' => $quest->reward_points ?: '',
            'reward_custom_prize' => $quest->reward_custom_prize ?? '',
            'max_participants' => $quest->max_participants ?: '',
            'start_date' => $quest->start_date ? $quest->start_date->format('Y-m-d\TH:i') : '',
            'end_date' => $quest->end_date ? $quest->end_date->format('Y-m-d\TH:i') : '',
            'creation_cost_points' => $quest->creation_cost_points ?? '',
        ];

        if ($request->has('questData')) {
            $questData = json_decode((string) $request->query('questData', '{}'), true) ?: $questData;
        }

        return Inertia::render('quests/actions/form', [
            'questId' => $quest->id,
            'questData' => $questData,
            'enrollmentSemester' => $this->getAvailableEnrollmentSemester($quest->id),
        ]);
    }

    /**
     * Show the edit stages form (step 2).
     */
    public function editStages(Request $request, Quest $quest): Response
    {
        $quest->load('stages.questions.choices');

        $questData = json_decode((string) $request->query('questData', '{}'), true) ?: [];

        $stagesData = $quest->stages->sortBy('stage_number')->values()->map(function ($stage) {
            return [
                'stage_number' => $stage->stage_number,
                'location_hint' => $stage->location_hint,
                'max_survivors' => $stage->max_survivors ?: '',
                'passing_score' => $stage->passing_score ?: '',
                'minimum_participants' => $stage->minimum_participants ?: '',
                'stage_deadline' => $stage->stage_deadline ? $stage->stage_deadline->format('Y-m-d\TH:i') : '',
                'stage_start' => $stage->stage_start ? $stage->stage_start->format('Y-m-d\TH:i') : '',
                'question_type' => $stage->questions->first()?->question_type ?? 'multiple_choice',
                'questions' => $stage->questions->map(function ($question) {
                    return [
                        'question_text' => $question->question_text,
                        'question_type' => $question->question_type,
                        'choices' => $question->choices->sortBy('sort_order')->values()->map(function ($choice) {
                            return [
                                'choice_text' => $choice->choice_text,
                                'is_correct' => $choice->is_correct,
                            ];
                        })->all(),
                    ];
                })->all(),
            ];
        })->all();

        return Inertia::render('quests/actions/stages', [
            'questId' => $quest->id,
            'questData' => $questData,
            'existingStages' => $stagesData,
        ]);
    }

    /**
     * Update an existing quest with stages, questions, choices, and target groups.
     */
    public function update(Request $request, Quest $quest): RedirectResponse
    {
        $request->validate(
            $this->questValidationRules($request, $quest),
            $this->questValidationMessages(),
        );

        $isElimination = (bool) $request->input('quest.is_elimination', false);
        $stageDeadlineError = $this->validateStageDeadlinesOrder($request->input('stages', []), $isElimination);
        if ($stageDeadlineError !== null) {
            return back()->withErrors(['stages' => $stageDeadlineError]);
        }
        if (!$isElimination) {
            $rangeError = $this->validateNonElimStageDeadlinesInRange(
                $request->input('stages', []),
                $request->input('quest.start_date'),
                $request->input('quest.end_date'),
            );
            if ($rangeError !== null) {
                return back()->withErrors(['stages' => $rangeError]);
            }
        }

        $stageStartError = $this->validateStageStartBeforeEnd(
            $request->input('stages', []),
            $request->input('quest.start_date'),
            $request->input('quest.end_date'),
        );
        if ($stageStartError !== null) {
            return back()->withErrors(['stages' => $stageStartError]);
        }

        $passingScoreError = $this->validatePassingScoreAchievable(
            $request->input('stages', []),
            $isElimination,
            $request->input('quest.question_type', 'multiple_choice'),
        );
        if ($passingScoreError !== null) {
            return back()->withErrors(['stages' => $passingScoreError]);
        }

        $correctAnswerError = $this->validateChoicesHaveCorrectAnswer(
            $request->input('stages', []),
            $request->input('quest.question_type', 'multiple_choice'),
        );
        if ($correctAnswerError !== null) {
            return back()->withErrors(['stages' => $correctAnswerError]);
        }

        $questInput = $request->input('quest');

        if ($request->user()->role === 'professor' && ! in_array($questInput['quest_type'] ?? '', ['custom', 'event'], true)) {
            return back()->withErrors(['quest.quest_type' => 'Professors can only create Custom or Event quests.']);
        }

        if ($questInput['quest_type'] === 'enrollment' && $questInput['question_type'] !== 'qr_scan') {
            return back()->withErrors(['quest.question_type' => 'Enrollment quests must use QR scan only.']);
        }

        $semesterId = null;
        if ($questInput['quest_type'] === 'enrollment') {
            $semester = $this->getAvailableEnrollmentSemester($quest->id);
            if (!$semester) {
                return back()->withErrors(['quest.quest_type' => 'No available semester for an enrollment quest.']);
            }
            $semesterId = $semester['id'];
        }

        $questQuestionType = $questInput['question_type'];

        return DB::transaction(function () use ($quest, $questInput, $request, $semesterId, $questQuestionType) {
            $quest->update([
                'title' => $questInput['title'],
                'description' => $questInput['description'] ?? null,
                'quest_type' => $questInput['quest_type'],
                'question_type' => $questQuestionType,
                'is_elimination' => (bool) ($questInput['is_elimination'] ?? false),
                'buy_in_points' => (int) ($questInput['buy_in_points'] ?? 0),
                'reward_points' => (int) ($questInput['reward_points'] ?? 0),
                'reward_custom_prize' => $questInput['reward_custom_prize'] ?? null,
                'max_participants' => $questInput['max_participants'] ? (int) $questInput['max_participants'] : 0,
                'start_date' => $questInput['start_date'] ?: null,
                'end_date' => $questInput['end_date'] ?: null,
                'semester_id' => $semesterId,
            ]);

            $quest->targetGroups()->delete();
            $target = $questInput['target'] ?? null;
            if ($target && ($target['target_type'] ?? 'everyone') === 'specific') {
                $quest->targetGroups()->create([
                    'course' => $target['course'] ?: null,
                    'year_level' => $target['year_level'] ? (int) $target['year_level'] : null,
                    'section' => $target['section'] ?: null,
                ]);
            }

            $quest->stages()->each(function ($stage) {
                $stage->questions()->each(function ($question) {
                    $question->choices()->delete();
                });
                $stage->questions()->delete();
            });
            $quest->stages()->delete();

            $stagesInput = $request->input('stages', []);
            $lastStageIdx = count($stagesInput) - 1;
            foreach ($stagesInput as $idx => $stageInput) {
                $isLastStage = $idx === $lastStageIdx;
                $stageDeadline = $isLastStage ? ($questInput['end_date'] ?? $stageInput['stage_deadline'] ?? null) : ($stageInput['stage_deadline'] ?: null);
                $stage = $quest->stages()->create([
                    'stage_number' => $idx + 1,
                    'location_hint' => $stageInput['location_hint'],
                    'max_survivors' => $stageInput['max_survivors'] ? (int) $stageInput['max_survivors'] : 0,
                    'passing_score' => $stageInput['passing_score'] ? (int) $stageInput['passing_score'] : null,
                    'minimum_participants' => $stageInput['minimum_participants'] ? (int) $stageInput['minimum_participants'] : 1,
                    'stage_deadline' => $stageDeadline,
                    'stage_start' => $stageInput['stage_start'] ?? null,
                    'status' => 'locked',
                ]);

                if ($questQuestionType === 'multiple_choice') {
                    foreach ($stageInput['questions'] ?? [] as $qInput) {
                        $question = $stage->questions()->create([
                            'question_text' => $qInput['question_text'] ?? '',
                            'question_type' => 'multiple_choice',
                        ]);

                        $sortOrder = 0;
                        foreach ($qInput['choices'] ?? [] as $choiceInput) {
                            $choiceText = trim((string) ($choiceInput['choice_text'] ?? ''));
                            if ($choiceText === '') {
                                continue;
                            }
                            QuestQuestionChoice::create([
                                'quest_question_id' => $question->id,
                                'choice_text' => $choiceText,
                                'sort_order' => $sortOrder++,
                                'is_correct' => (bool) ($choiceInput['is_correct'] ?? false),
                            ]);
                        }
                    }
                } else {
                    $stage->questions()->create([
                        'question_text' => 'QR Scan',
                        'question_type' => 'qr_scan',
                    ]);
                }
            }

            ActivityLog::log($request->user()->id, ActivityLog::ACTION_QUEST_UPDATED, $quest->title);

            return redirect()->route('quests.active')->with('success', 'Quest updated successfully.');
        });
    }

    /**
     * Soft-delete a quest. Admin: any quest. Professor: only own pending quests (cancel).
     */
    public function destroy(Request $request, Quest $quest): RedirectResponse
    {
        $user = $request->user();
        if ($user->role === 'admin') {
            // Admin can delete any quest.
        } elseif ($user->role === 'professor' && (int) $quest->created_by === (int) $user->id && $quest->approval_status === 'pending') {
            // Professor can only cancel/delete their own pending quests.
        } else {
            abort(403, 'You can only cancel your own quests that are still pending approval.');
        }

        $title = $quest->title;
        $buyInPoints = (int) $quest->buy_in_points;

        if ($buyInPoints > 0) {
            $participants = QuestParticipant::where('quest_id', $quest->id)->with('user')->get();
            foreach ($participants as $participant) {
                $participantUser = $participant->user;
                if ($participantUser) {
                    PointTransaction::create([
                        'user_id' => $participantUser->id,
                        'amount' => $buyInPoints,
                        'transaction_type' => PointTransaction::TYPE_BUY_IN_REFUND,
                        'reference_id' => $quest->id,
                    ]);
                    $participantUser->increment('points_balance', $buyInPoints);
                }
            }
        }

        $quest->delete();

        ActivityLog::log($user->id, ActivityLog::ACTION_QUEST_DELETED, $title);

        $referer = $request->header('Referer', '');
        if (str_contains($referer, 'from=history')) {
            return redirect()->route('quests.history')->with('success', 'Quest deleted.');
        }

        return back()->with('success', 'Quest deleted.');
    }

    /**
     * Update quest approval status. Admin and gamemaster can approve or reject pending quests.
     */
    public function approve(Request $request, Quest $quest): RedirectResponse
    {
        $validated = $request->validate([
            'approval_status' => ['required', 'string', 'in:approved,rejected'],
            'creation_payment_status' => ['nullable', 'string', 'in:paid,pending'],
        ]);

        $creator = User::find($quest->created_by);
        $isCreatorProfessor = $creator && $creator->role === 'professor';

        $updates = [
            'approval_status' => $validated['approval_status'],
            'creation_payment_status' => $request->user()->role === 'admin' && isset($validated['creation_payment_status'])
                ? $validated['creation_payment_status']
                : ($isCreatorProfessor ? 'paid' : $quest->creation_payment_status),
        ];
        if ($isCreatorProfessor) {
            $updates['creation_cost_points'] = 0;
        }
        if ($validated['approval_status'] === 'rejected') {
            $updates['status'] = 'cancelled';
        }
        $quest->update($updates);

        $action = $validated['approval_status'] === 'approved' ? 'approved' : 'rejected';
        ActivityLog::log($request->user()->id, ActivityLog::ACTION_QUEST_UPDATED, sprintf('%s – %s', $quest->title, $action));

        $referer = $request->header('Referer', '');
        if (str_contains($referer, 'from=approval')) {
            return redirect()->route('quests.approval')->with('success', 'Quest ' . $action . '.');
        }

        return back()->with('success', 'Quest ' . $action . '.');
    }

    /**
     * Find a semester (current or upcoming) that has no enrollment quest yet.
     * Excludes the given quest ID so editing doesn't block itself.
     */
    private function getAvailableEnrollmentSemester(?int $excludeQuestId = null): ?array
    {
        $today = now()->toDateString();

        $takenSemesterIds = Quest::query()
            ->where('quest_type', 'enrollment')
            ->whereNotNull('semester_id')
            ->when($excludeQuestId, fn ($q) => $q->where('id', '!=', $excludeQuestId))
            ->pluck('semester_id');

        $semester = Semester::query()
            ->where('end_date', '>=', $today)
            ->whereNotIn('id', $takenSemesterIds)
            ->orderByRaw("CASE WHEN start_date <= ? AND end_date >= ? THEN 0 ELSE 1 END", [$today, $today])
            ->orderBy('start_date')
            ->first();

        if (!$semester) {
            return null;
        }

        return [
            'id' => $semester->id,
            'name' => $semester->name,
            'start_date' => $semester->start_date->format('Y-m-d'),
            'end_date' => $semester->end_date->format('Y-m-d'),
        ];
    }

    /**
     * Return distinct sections for a given course + year_level
     * from the master_users table.
     */
    public function sections(Request $request): JsonResponse
    {
        $request->validate([
            'course' => 'required|string',
            'year_level' => 'required|integer|min:1',
        ]);

        $sections = MasterUser::query()
            ->where('course', $request->query('course'))
            ->where('year_level', $request->query('year_level'))
            ->whereNotNull('section')
            ->where('section', '!=', '')
            ->distinct()
            ->orderBy('section')
            ->pluck('section');

        return response()->json($sections);
    }

    private function questValidationRules(Request $request, ?Quest $quest = null): array
    {
        $isElimination = (bool) $request->input('quest.is_elimination', false);
        $questionType = $request->input('quest.question_type', 'multiple_choice');
        $isCreate = $quest === null;

        $startDateRules = ['required', 'date'];
        if ($isCreate) {
            $startDateRules[] = function (string $attribute, mixed $value, \Closure $fail): void {
                if (strtotime($value) < time()) {
                    $fail('Start date must be today or in the future.');
                }
            };
        }

        $rules = [
            'quest.title'          => 'required|string|max:255',
            'quest.description'    => 'nullable|string|max:1000',
            'quest.quest_type'     => 'required|in:daily,event,custom,enrollment',
            'quest.question_type'  => 'required|in:multiple_choice,qr_scan',
            'quest.reward_points'  => 'required|integer|min:1|max:150',
            'quest.start_date'     => $startDateRules,
            'quest.end_date'       => [
                'required',
                'date',
                'after_or_equal:quest.start_date',
                function (string $attribute, mixed $value, \Closure $fail) use ($request): void {
                    $start = $request->input('quest.start_date');
                    if ($start && strtotime($value) - strtotime($start) < 3600) {
                        $fail('The quest end date must be at least 1 hour after the start date.');
                    }
                },
            ],
            'quest.buy_in_points'  => 'nullable|integer|min:0|max:100',
            'quest.max_participants'    => $isElimination ? 'required|integer|min:1' : 'nullable|integer|min:1',
            'quest.reward_custom_prize' => 'nullable|string|max:255',
            'stages'               => 'required|array|min:' . ($isElimination ? 2 : 1),
            'stages.*.location_hint' => 'required|string|max:255',
        ];

        if ($isElimination) {
            $rules['stages.*.max_survivors']        = 'required|integer|min:1';
            $rules['stages.*.minimum_participants']  = 'required|integer|min:1';
            $rules['stages.*.stage_deadline']        = 'required|date';
        }

        if ($questionType === 'multiple_choice') {
            $rules['stages.*.questions']                      = 'required|array|min:1';
            $rules['stages.*.questions.*.question_text']      = 'required|string|max:1000';
            $rules['stages.*.questions.*.choices']            = 'required|array|min:2';
            $rules['stages.*.questions.*.choices.*.choice_text'] = 'required|string|max:255';
        }

        if (!$isElimination && $questionType === 'multiple_choice') {
            $rules['stages.*.passing_score'] = 'nullable|integer|min:1';
        }

        if (!$isElimination) {
            $rules['stages.*.stage_deadline'] = 'nullable|date';
        }

        return $rules;
    }

    /**
     * Validate that each stage's deadline is on or after the previous stage's deadline (elimination only).
     * Returns an error message string or null if valid.
     */
    private function validateStageDeadlinesOrder(array $stages, bool $isElimination): ?string
    {
        if (!$isElimination || count($stages) < 2) {
            return null;
        }

        $prevDeadline = null;
        foreach ($stages as $idx => $stage) {
            $deadlineStr = $stage['stage_deadline'] ?? null;
            if ($deadlineStr === null || $deadlineStr === '') {
                continue;
            }
            if ($prevDeadline !== null) {
                $prevTime = strtotime($prevDeadline);
                $currTime = strtotime($deadlineStr);
                if ($prevTime !== false && $currTime !== false && $currTime < $prevTime) {
                    $pos = $idx + 1;
                    return "Stage {$pos} deadline must be on or after the previous stage's deadline.";
                }
            }
            $prevDeadline = $deadlineStr;
        }

        return null;
    }

    /**
     * Validate that non-elimination stage end dates (when set) are within quest start and end.
     * Returns an error message string or null if valid.
     */
    private function validateNonElimStageDeadlinesInRange(array $stages, ?string $questStart, ?string $questEnd): ?string
    {
        $startTs = $questStart ? strtotime($questStart) : false;
        $endTs = $questEnd ? strtotime($questEnd) : false;
        if ($startTs === false || $endTs === false) {
            return null;
        }
        foreach ($stages as $idx => $stage) {
            $deadlineStr = $stage['stage_deadline'] ?? null;
            if ($deadlineStr === null || $deadlineStr === '') {
                continue;
            }
            $ts = strtotime($deadlineStr);
            if ($ts === false) {
                continue;
            }
            if ($ts < $startTs) {
                $pos = $idx + 1;
                return "Stage {$pos} end date must be on or after the quest start date.";
            }
            if ($ts > $endTs) {
                $pos = $idx + 1;
                return "Stage {$pos} end date must be on or before the quest end date.";
            }
        }
        return null;
    }

    /**
     * Validate that stage start (stage 2+) is on or after previous stage end, before own stage end, and within quest range.
     */
    private function validateStageStartBeforeEnd(array $stages, ?string $questStart, ?string $questEnd): ?string
    {
        $startTs = $questStart ? strtotime($questStart) : false;
        $endTs = $questEnd ? strtotime($questEnd) : false;
        $lastIdx = count($stages) - 1;
        foreach ($stages as $idx => $stage) {
            if ($idx === 0) {
                continue;
            }
            $stageStartStr = $stage['stage_start'] ?? null;
            if ($stageStartStr === null || $stageStartStr === '') {
                continue;
            }
            $stageStartTs = strtotime($stageStartStr);
            if ($stageStartTs === false) {
                continue;
            }
            if ($startTs !== false && $stageStartTs < $startTs) {
                $pos = $idx + 1;
                return "Stage {$pos} start date must be on or after the quest start date.";
            }
            $prevStage = $stages[$idx - 1];
            $prevStageEndStr = $prevStage['stage_deadline'] ?? $questEnd;
            if ($prevStageEndStr !== null && $prevStageEndStr !== '') {
                $prevEndTs = strtotime($prevStageEndStr);
                if ($prevEndTs !== false && $stageStartTs < $prevEndTs) {
                    $pos = $idx + 1;
                    return "Stage {$pos} start date must be on or after the previous stage end date.";
                }
            }
            if ($endTs !== false && $stageStartTs > $endTs) {
                $pos = $idx + 1;
                return "Stage {$pos} start date must be on or before the quest end date.";
            }
            $deadlineStr = ($idx === $lastIdx) ? $questEnd : ($stage['stage_deadline'] ?? null);
            if ($deadlineStr !== null && $deadlineStr !== '') {
                $deadlineTs = strtotime($deadlineStr);
                if ($deadlineTs !== false && $stageStartTs >= $deadlineTs) {
                    $pos = $idx + 1;
                    return "Stage {$pos} start date must be before the stage end date.";
                }
            }
        }
        return null;
    }

    /**
     * Validate that passing score (non-elimination + multiple choice) does not exceed the number of questions.
     */
    private function validatePassingScoreAchievable(array $stages, bool $isElimination, string $questionType): ?string
    {
        if ($isElimination || $questionType !== 'multiple_choice') {
            return null;
        }
        foreach ($stages as $idx => $stage) {
            $passingScore = isset($stage['passing_score']) && $stage['passing_score'] !== '' && $stage['passing_score'] !== null
                ? (int) $stage['passing_score']
                : null;
            if ($passingScore === null) {
                continue;
            }
            $questions = $stage['questions'] ?? [];
            $questionCount = is_array($questions) ? count($questions) : 0;
            if ($questionCount > 0 && $passingScore > $questionCount) {
                $pos = $idx + 1;

                return "Stage {$pos}: Passing score cannot exceed the number of questions ({$questionCount}).";
            }
        }

        return null;
    }

    /**
     * Validate that each multiple-choice question has at least 2 choices and at least one correct answer.
     */
    private function validateChoicesHaveCorrectAnswer(array $stages, string $questionType): ?string
    {
        if ($questionType !== 'multiple_choice') {
            return null;
        }
        foreach ($stages as $stageIdx => $stage) {
            $questions = $stage['questions'] ?? [];
            foreach ($questions as $qIdx => $question) {
                $choices = $question['choices'] ?? [];
                $filledChoices = array_filter($choices, function ($c) {
                    $text = $c['choice_text'] ?? '';
                    return is_string($text) && trim($text) !== '';
                });
                if (count($filledChoices) < 2) {
                    $stagePos = $stageIdx + 1;
                    $qPos = $qIdx + 1;
                    return "Stage {$stagePos}, Question {$qPos}: At least 2 choices are required.";
                }
                $hasCorrect = false;
                foreach ($choices as $c) {
                    if (!empty($c['is_correct'])) {
                        $hasCorrect = true;
                        break;
                    }
                }
                if (!$hasCorrect) {
                    $stagePos = $stageIdx + 1;
                    $qPos = $qIdx + 1;
                    return "Stage {$stagePos}, Question {$qPos}: At least one choice must be marked as correct.";
                }
            }
        }
        return null;
    }

    private function questValidationMessages(): array
    {
        return [
            'quest.title.required'       => 'Quest title is required.',
            'quest.quest_type.required'  => 'Quest type is required.',
            'quest.question_type.required' => 'Question type is required.',
            'quest.reward_points.required' => 'Reward points are required.',
            'quest.reward_points.min'    => 'Reward points must be at least 1.',
            'quest.reward_points.max'    => 'Reward points cannot exceed 150.',
            'quest.start_date.required'  => 'Start date is required.',
            'quest.start_date.after_or_equal' => 'Start date must be today or in the future.',
            'quest.end_date.required'    => 'End date is required.',
            'quest.end_date.after_or_equal' => 'End date must be on or after the start date.',
            'quest.max_participants.required' => 'Max participants is required for elimination quests.',
            'stages.required' => 'At least one stage is required.',
            'stages.min' => 'Elimination quests must have at least 2 stages.',
            'stages.*.location_hint.required' => 'Location hint is required for stage :position.',
            'stages.*.max_survivors.required' => 'Max survivors is required for elimination stage :position.',
            'stages.*.minimum_participants.required' => 'Minimum participants is required for elimination stage :position.',
            'stages.*.stage_deadline.required' => 'Deadline is required for elimination stage :position.',
            'stages.*.questions.required' => 'At least one question is required for stage :position.',
            'stages.*.questions.min'     => 'At least one question is required for stage :position.',
            'stages.*.questions.*.question_text.required' => 'Question text cannot be empty.',
            'stages.*.questions.*.choices.required' => 'Choices are required for each question.',
            'stages.*.questions.*.choices.min' => 'At least 2 choices are required per question.',
            'stages.*.questions.*.choices.*.choice_text.required' => 'Choice text cannot be empty.',
        ];
    }
}


