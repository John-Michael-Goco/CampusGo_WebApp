<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Leaderboard extends Model
{
    public $timestamps = false;

    protected $table = 'leaderboard';

    protected $fillable = [
        'period_type',
        'period_key',
        'user_id',
        'total_points',
        'rank',
    ];

    protected function casts(): array
    {
        return [
            'total_points' => 'integer',
            'rank' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
