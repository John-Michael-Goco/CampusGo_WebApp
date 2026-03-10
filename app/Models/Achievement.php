<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Achievement extends Model
{
    public $timestamps = false;

    /** Allowed requirement_type values: quest_count, level, quest_win */
    public const REQUIREMENT_TYPE_QUEST_COUNT = 'quest_count';
    public const REQUIREMENT_TYPE_LEVEL = 'level';
    public const REQUIREMENT_TYPE_QUEST_WIN = 'quest_win';

    protected $fillable = [
        'name',
        'description',
        'requirement_type',
        'requirement_value',
    ];

    protected function casts(): array
    {
        return [
            'requirement_value' => 'integer',
        ];
    }

    public function userAchievements(): HasMany
    {
        return $this->hasMany(UserAchievement::class);
    }
}
