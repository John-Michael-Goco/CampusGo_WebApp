<?php

namespace App\Observers;

use App\Models\Quest;
use App\Models\QuestParticipant;

class QuestParticipantObserver
{
    /**
     * When a participant's status changes to eliminated, decrement the quest's current_participants
     * so the counter reflects "still in the running" (quit and eliminated both reduce the count).
     */
    public function updated(QuestParticipant $participant): void
    {
        if ($participant->wasChanged('status') && $participant->status === 'eliminated') {
            Quest::where('id', $participant->quest_id)
                ->where('current_participants', '>', 0)
                ->decrement('current_participants');
        }
    }
}
