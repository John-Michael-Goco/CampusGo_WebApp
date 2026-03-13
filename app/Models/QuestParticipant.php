<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class QuestParticipant extends Model
{
    public const CREATED_AT = null;

    protected $fillable = [
        'quest_id',
        'user_id',
        'current_stage',
        'status',
        'joined_at',
    ];

    protected function casts(): array
    {
        return [
            'current_stage' => 'int',
            'joined_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function quest(): BelongsTo
    {
        return $this->belongsTo(Quest::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(Submission::class, 'participant_id');
    }
}
