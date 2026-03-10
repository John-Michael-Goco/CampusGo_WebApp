<?php

namespace App\Observers;

use App\Models\Quest;
use Carbon\CarbonImmutable;

class QuestObserver
{
    /**
     * When approval_status changes to "approved", set the quest status
     * based on its start/end dates.
     */
    public function updating(Quest $quest): void
    {
        if ($quest->isDirty('approval_status') && $quest->approval_status === 'approved') {
            $quest->status = $this->resolveStatus($quest);
        }
    }

    /**
     * On creation, if the quest is already approved, resolve its status.
     */
    public function creating(Quest $quest): void
    {
        if ($quest->approval_status === 'approved') {
            $quest->status = $this->resolveStatus($quest);
        }
    }

    private function resolveStatus(Quest $quest): string
    {
        $now = CarbonImmutable::now();

        if ($quest->end_date && $quest->end_date->lte($now)) {
            return 'completed';
        }

        if ($quest->start_date && $quest->start_date->lte($now)) {
            return 'ongoing';
        }

        return 'upcoming';
    }
}
