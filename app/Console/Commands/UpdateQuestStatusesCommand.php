<?php

namespace App\Console\Commands;

use App\Http\Controllers\Simulation\QuestParticipationController;
use App\Models\Quest;
use App\Models\QuestParticipant;
use App\Models\QuestStage;
use Carbon\CarbonImmutable;
use Illuminate\Console\Command;

class UpdateQuestStatusesCommand extends Command
{
    protected $signature = 'quests:update-statuses';

    protected $description = 'Transition quest statuses based on start/end dates and handle stage deadlines.';

    public function handle(): int
    {
        $now = CarbonImmutable::now();

        $toOngoing = Quest::query()
            ->where('status', 'upcoming')
            ->where('approval_status', 'approved')
            ->whereNotNull('start_date')
            ->where('start_date', '<=', $now)
            ->where(fn ($q) => $q->whereNull('end_date')->orWhere('end_date', '>', $now))
            ->update(['status' => 'ongoing']);

        $toCompleted = Quest::query()
            ->whereIn('status', ['upcoming', 'ongoing'])
            ->whereNotNull('end_date')
            ->where('end_date', '<=', $now)
            ->update(['status' => 'completed']);

        $this->info("Transitioned {$toOngoing} quest(s) to ongoing, {$toCompleted} quest(s) to completed.");

        $this->processEliminationDeadlines($now);

        return self::SUCCESS;
    }

    /**
     * For elimination quests (MC and QR), process stages whose deadline has passed.
     * Option B: If fewer than minimum_participants submitted by the deadline, mark stage as failed and cancel the quest.
     * Otherwise run ranking (MC by score then time, QR by time only) and eliminate those who didn't submit.
     */
    private function processEliminationDeadlines(CarbonImmutable $now): void
    {
        $stages = QuestStage::whereNotNull('stage_deadline')
            ->where('stage_deadline', '<=', $now)
            ->whereHas('quest', function ($q) {
                $q->where('is_elimination', true)
                    ->whereIn('question_type', ['multiple_choice', 'qr_scan'])
                    ->whereIn('status', ['ongoing', 'completed']);
            })
            ->with('quest.stages.questions')
            ->get();

        $processed = 0;

        foreach ($stages as $stage) {
            $submittedCount = QuestParticipant::where('quest_id', $stage->quest_id)
                ->where('current_stage', $stage->stage_number)
                ->where('status', 'awaiting_ranking')
                ->count();

            $hasActive = QuestParticipant::where('quest_id', $stage->quest_id)
                ->where('current_stage', $stage->stage_number)
                ->where('status', 'active')
                ->exists();

            $hasAwaiting = $submittedCount > 0;

            if (!$hasAwaiting && !$hasActive) {
                continue;
            }

            $quest = $stage->quest;
            $minParticipants = (int) $stage->minimum_participants;

            // Option B: minimum_participants = minimum who must have submitted by deadline
            if ($submittedCount < $minParticipants) {
                $stage->update(['status' => 'failed']);
                $quest->update(['status' => 'cancelled']);
                $eliminatedCount = QuestParticipant::where('quest_id', $quest->id)
                    ->where('current_stage', $stage->stage_number)
                    ->whereIn('status', ['active', 'awaiting_ranking'])
                    ->count();
                QuestParticipant::where('quest_id', $quest->id)
                    ->where('current_stage', $stage->stage_number)
                    ->whereIn('status', ['active', 'awaiting_ranking'])
                    ->update(['status' => 'eliminated']);
                if ($eliminatedCount > 0) {
                    Quest::where('id', $quest->id)->where('current_participants', '>=', $eliminatedCount)->decrement('current_participants', $eliminatedCount);
                }
                $processed++;
                continue;
            }

            $allStages = $quest->stages->sortBy('stage_number')->values();

            // Eliminate participants who are still "active" (never submitted)
            $activeEliminatedCount = QuestParticipant::where('quest_id', $quest->id)
                ->where('current_stage', $stage->stage_number)
                ->where('status', 'active')
                ->count();
            QuestParticipant::where('quest_id', $quest->id)
                ->where('current_stage', $stage->stage_number)
                ->where('status', 'active')
                ->update(['status' => 'eliminated']);
            if ($activeEliminatedCount > 0) {
                Quest::where('id', $quest->id)->where('current_participants', '>=', $activeEliminatedCount)->decrement('current_participants', $activeEliminatedCount);
            }

            $controller = app(QuestParticipationController::class);
            if ($quest->question_type === 'multiple_choice') {
                $quest->load('stages.questions.choices');
                $controller->runEliminationRanking($stage, $quest, $allStages);
            } else {
                $controller->runEliminationRankingQR($stage, $quest, $allStages);
            }

            $processed++;
        }

        if ($processed > 0) {
            $this->info("Processed {$processed} elimination stage deadline(s).");
        }
    }
}
