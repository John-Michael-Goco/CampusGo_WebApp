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
     * When question_type changes, sync all stages' questions to match (multiple_choice vs qr_scan).
     * So switching to QR scan removes MCQ questions and adds one QR question per stage, and vice versa.
     */
    public function updated(Quest $quest): void
    {
        if (!$quest->wasChanged('question_type')) {
            return;
        }

        $quest->load('stages.questions.choices');
        $type = $quest->question_type ?? 'multiple_choice';

        foreach ($quest->stages as $stage) {
            foreach ($stage->questions as $question) {
                $question->choices()->delete();
            }
            $stage->questions()->delete();

            if ($type === 'qr_scan') {
                $stage->questions()->create([
                    'question_text' => 'QR Scan',
                    'question_type' => 'qr_scan',
                ]);
            } else {
                $stage->questions()->create([
                    'question_text' => 'Question 1',
                    'question_type' => 'multiple_choice',
                ]);
            }
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
