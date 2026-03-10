<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Submission extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'participant_id',
        'question_id',
        'answer',
        'is_correct',
        'submitted_at',
    ];

    protected function casts(): array
    {
        return [
            'is_correct' => 'bool',
            'submitted_at' => 'datetime',
        ];
    }

    public function participant(): BelongsTo
    {
        return $this->belongsTo(QuestParticipant::class, 'participant_id');
    }

    public function question(): BelongsTo
    {
        return $this->belongsTo(QuestQuestion::class, 'question_id');
    }
}
