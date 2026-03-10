<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class QuestQuestion extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'stage_id',
        'question_text',
        'question_type',
    ];

    public function stage(): BelongsTo
    {
        return $this->belongsTo(QuestStage::class, 'stage_id');
    }

    public function choices(): HasMany
    {
        return $this->hasMany(QuestQuestionChoice::class);
    }
}
