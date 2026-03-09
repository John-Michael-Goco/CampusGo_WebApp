<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Achievement extends Model
{
    public $timestamps = false;

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
