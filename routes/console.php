<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('leaderboard:populate')->hourly();
// Quest status (upcoming→ongoing→completed) and FCM: quest_started + quest_ended. Run scheduler every minute: * * * * * php artisan schedule:run
Schedule::command('quests:update-statuses')->everyMinute();
Schedule::command('fcm:check-stage-unlocks')->everyMinute();
