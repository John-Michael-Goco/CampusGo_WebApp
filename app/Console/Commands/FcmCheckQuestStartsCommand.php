<?php

namespace App\Console\Commands;

use App\Models\Quest;
use App\Services\FcmService;
use Carbon\CarbonImmutable;
use Illuminate\Console\Command;

class FcmCheckQuestStartsCommand extends Command
{
    protected $signature = 'fcm:check-quest-starts';

    protected $description = 'Find quests whose start_date just passed (upcoming -> ongoing) and send push to target users.';

    public function handle(): int
    {
        $now = CarbonImmutable::now();
        $oneMinuteAgo = $now->subMinute();

        $quests = Quest::query()
            ->where('status', 'upcoming')
            ->where('approval_status', 'approved')
            ->whereNotNull('start_date')
            ->where('start_date', '>', $oneMinuteAgo)
            ->where('start_date', '<=', $now)
            ->get();

        $fcm = app(FcmService::class);

        foreach ($quests as $quest) {
            $quest->update(['status' => 'ongoing']);
            $fcm->sendQuestStarted($quest);
        }

        if ($quests->isNotEmpty()) {
            $this->info('Transitioned ' . $quests->count() . ' quest(s) to ongoing and sent quest_started notifications.');
        }

        return self::SUCCESS;
    }
}
