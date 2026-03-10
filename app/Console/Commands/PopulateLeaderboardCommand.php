<?php

namespace App\Console\Commands;

use App\Models\Leaderboard;
use App\Services\LeaderboardService;
use Illuminate\Console\Command;

class PopulateLeaderboardCommand extends Command
{
    protected $signature = 'leaderboard:populate';

    protected $description = 'Compute and fill the leaderboard table for today, week, month, semester, and overall.';

    public function handle(LeaderboardService $leaderboardService): int
    {
        foreach (LeaderboardService::PERIODS as $period) {
            $periodKey = $leaderboardService->getPeriodKey($period);
            if ($periodKey === null) {
                $this->warn("Skipping period [{$period}] (no current semester or invalid).");
                continue;
            }

            $entries = $leaderboardService->getEntriesComputed($period);

            Leaderboard::query()
                ->where('period_type', $period)
                ->where('period_key', $periodKey)
                ->delete();

            foreach ($entries as $entry) {
                Leaderboard::create([
                    'period_type' => $period,
                    'period_key' => $periodKey,
                    'user_id' => $entry['user_id'],
                    'total_points' => $entry['value'],
                    'rank' => $entry['rank'],
                ]);
            }

            $this->info("Filled [{$period}] (key: {$periodKey}) with " . count($entries) . ' entries.');
        }

        return self::SUCCESS;
    }
}
