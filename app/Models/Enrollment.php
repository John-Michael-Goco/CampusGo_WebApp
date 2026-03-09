<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Enrollment extends Model
{
    public $timestamps = false;

    protected $fillable = ['user_id', 'semester', 'is_enrolled'];

    protected function casts(): array
    {
        return ['is_enrolled' => 'boolean'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
