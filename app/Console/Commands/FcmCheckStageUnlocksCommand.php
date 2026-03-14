<?php

namespace App\Console\Commands;

use App\Models\QuestParticipant;
use App\Models\QuestStage;
use App\Services\FcmService;
use Carbon\CarbonImmutable;
use Illuminate\Console\Command;

class FcmCheckStageUnlocksCommand extends Command
{
    protected $signature = 'fcm:check-stage-unlocks';

    protected $description = 'Find stages whose stage_start just passed and send push to affected participants.';

    public function handle(): int
    {
        $now = CarbonImmutable::now();
        $oneMinuteAgo = $now->subMinute();

        // Stages that unlocked in the last minute (stage_start between oneMinuteAgo and now)
        $stages = QuestStage::query()
            ->whereNotNull('stage_start')
            ->where('stage_start', '>', $oneMinuteAgo)
            ->where('stage_start', '<=', $now)
            ->with('quest')
            ->get();

        $fcm = app(FcmService::class);
        $sent = 0;

        foreach ($stages as $stage) {
            $quest = $stage->quest;
            if ($quest === null) {
                continue;
            }

            // Active participants whose current_stage matches the newly unlocked stage (they were waiting for it to open)
            $participants = QuestParticipant::query()
                ->where('quest_id', $stage->quest_id)
                ->where('current_stage', $stage->stage_number)
                ->where('status', 'active')
                ->with('user')
                ->get();

            // Notify them that this stage is now open
            foreach ($participants as $participant) {
                if ($participant->user_id === null) {
                    continue;
                }
                $user = $participant->user;
                if ($user === null) {
                    continue;
                }
                $fcm->sendStageUnlocked(
                    $user,
                    $participant->id,
                    $quest->id,
                    $quest->title ?? 'Quest',
                    $stage->stage_number,
                    $stage->location_hint ?? ''
                );
                $sent++;
            }
        }

        if ($sent > 0) {
            $this->info("Sent {$sent} stage-unlocked notification(s).");
        }

        return self::SUCCESS;
    }
}
