<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class QuestStage extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'quest_id',
        'stage_number',
        'location_hint',
        'max_survivors',
        'minimum_participants',
        'stage_deadline',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'max_survivors' => 'int',
            'minimum_participants' => 'int',
            'stage_deadline' => 'datetime',
        ];
    }

    public function quest(): BelongsTo
    {
        return $this->belongsTo(Quest::class);
    }

    public function questions(): HasMany
    {
        return $this->hasMany(QuestQuestion::class, 'stage_id');
    }
}
