<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ActivityLog extends Model
{
    protected $table = 'activity_logs';

    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'action',
        'description',
        'reference_id',
    ];

    protected function casts(): array
    {
        return [
            'reference_id' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public static function log(int $userId, string $action, ?string $description = null, ?int $referenceId = null): self
    {
        return self::create([
            'user_id' => $userId,
            'action' => $action,
            'description' => $description,
            'reference_id' => $referenceId,
        ]);
    }
}
