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

        $this->processElimMCDeadlines($now);

        return self::SUCCESS;
    }

    /**
     * For elimination + multiple choice quests, process stages whose deadline has passed.
     * Run ranking for participants who submitted but haven't been ranked yet,
     * and eliminate those who didn't submit before the deadline.
     */
    private function processElimMCDeadlines(CarbonImmutable $now): void
    {
        $stages = QuestStage::whereNotNull('stage_deadline')
            ->where('stage_deadline', '<=', $now)
            ->whereHas('quest', function ($q) {
                $q->where('is_elimination', true)
                    ->where('question_type', 'multiple_choice')
                    ->whereIn('status', ['ongoing', 'completed']);
            })
            ->with('quest.stages.questions.choices')
            ->get();

        $processed = 0;

        foreach ($stages as $stage) {
            $hasAwaiting = QuestParticipant::where('quest_id', $stage->quest_id)
                ->where('current_stage', $stage->stage_number)
                ->where('status', 'awaiting_ranking')
                ->exists();

            $hasActive = QuestParticipant::where('quest_id', $stage->quest_id)
                ->where('current_stage', $stage->stage_number)
                ->where('status', 'active')
                ->exists();

            if (!$hasAwaiting && !$hasActive) {
                continue;
            }

            $quest = $stage->quest;
            $allStages = $quest->stages->sortBy('stage_number')->values();

            // Eliminate participants who are still "active" (never submitted)
            QuestParticipant::where('quest_id', $quest->id)
                ->where('current_stage', $stage->stage_number)
                ->where('status', 'active')
                ->update(['status' => 'eliminated']);

            // Run ranking for awaiting participants
            if ($hasAwaiting) {
                app(QuestParticipationController::class)->runEliminationRanking($stage, $quest, $allStages);
            }

            $processed++;
        }

        if ($processed > 0) {
            $this->info("Processed {$processed} elimination stage deadline(s).");
        }
    }
}
