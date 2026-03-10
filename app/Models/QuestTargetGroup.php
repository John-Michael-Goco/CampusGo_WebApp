<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuestTargetGroup extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'quest_id',
        'course',
        'year_level',
        'section',
    ];

    protected function casts(): array
    {
        return [
            'year_level' => 'int',
        ];
    }

    public function quest(): BelongsTo
    {
        return $this->belongsTo(Quest::class);
    }
}
