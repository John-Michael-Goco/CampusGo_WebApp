<?php

namespace App\Console\Commands;

use App\Models\Quest;
use Carbon\CarbonImmutable;
use Illuminate\Console\Command;

class UpdateQuestStatusesCommand extends Command
{
    protected $signature = 'quests:update-statuses';

    protected $description = 'Transition quest statuses based on start/end dates.';

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

        return self::SUCCESS;
    }
}
