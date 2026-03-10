<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuestQuestionChoice extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'quest_question_id',
        'choice_text',
        'sort_order',
        'is_correct',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'int',
            'is_correct' => 'bool',
        ];
    }

    public function question(): BelongsTo
    {
        return $this->belongsTo(QuestQuestion::class, 'quest_question_id');
    }
}
