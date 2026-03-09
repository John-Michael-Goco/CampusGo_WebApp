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
        'timestamp',
    ];

    /** Action keys for consistent logging and display */
    public const ACTION_STUDENT_CREATED = 'student_created';
    public const ACTION_STUDENT_UPDATED = 'student_updated';
    public const ACTION_STUDENT_DELETED = 'student_deleted';
    public const ACTION_PROFESSOR_CREATED = 'professor_created';
    public const ACTION_PROFESSOR_UPDATED = 'professor_updated';
    public const ACTION_PROFESSOR_DELETED = 'professor_deleted';
    public const ACTION_GAMEMASTER_CREATED = 'gamemaster_created';
    public const ACTION_ACHIEVEMENT_CREATED = 'achievement_created';
    public const ACTION_ACHIEVEMENT_UPDATED = 'achievement_updated';
    public const ACTION_ACHIEVEMENT_DELETED = 'achievement_deleted';
    public const ACTION_STORE_ITEM_CREATED = 'store_item_created';
    public const ACTION_STORE_ITEM_UPDATED = 'store_item_updated';
    public const ACTION_STORE_ITEM_DELETED = 'store_item_deleted';
    public const ACTION_AUTH_SIGNIN = 'auth_signin';
    public const ACTION_AUTH_SIGNOUT = 'auth_signout';
    public const ACTION_AUTH_SIGNUP = 'auth_signup';

    protected function casts(): array
    {
        return [
            'timestamp' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Log an activity. Stored as "action_key" or "action_key: detail" when detail is provided.
     */
    public static function log(int $userId, string $action, ?string $detail = null): self
    {
        $stored = $detail !== null && $detail !== ''
            ? $action . ': ' . $detail
            : $action;

        return self::create([
            'user_id' => $userId,
            'action' => $stored,
            'timestamp' => now(),
        ]);
    }

    /**
     * Get the action key (prefix before first colon) from a stored action string.
     */
    public static function getActionKey(string $storedAction): string
    {
        $pos = strpos($storedAction, ':');
        return $pos !== false ? trim(substr($storedAction, 0, $pos)) : trim($storedAction);
    }

    /**
     * Get the detail (suffix after first colon) from a stored action string.
     */
    public static function getActionDetail(string $storedAction): ?string
    {
        $pos = strpos($storedAction, ':');
        if ($pos === false) {
            return null;
        }
        $detail = trim(substr($storedAction, $pos + 1));
        return $detail === '' ? null : $detail;
    }

    public function scopeFilterSearch($query, ?string $search): void
    {
        if ($search === null || $search === '') {
            return;
        }
        $query->where(function ($q) use ($search) {
            $q->where('activity_logs.action', 'like', '%' . $search . '%')
                ->orWhereHas('user', function ($uq) use ($search) {
                    $uq->where('name', 'like', '%' . $search . '%')
                        ->orWhere('email', 'like', '%' . $search . '%');
                });
        });
    }

    public function scopeFilterDateFrom($query, ?string $date): void
    {
        if ($date !== null && $date !== '') {
            $query->whereDate('activity_logs.timestamp', '>=', $date);
        }
    }

    public function scopeFilterDateTo($query, ?string $date): void
    {
        if ($date !== null && $date !== '') {
            $query->whereDate('activity_logs.timestamp', '<=', $date);
        }
    }

    public function scopeOrderByTimestamp($query, string $dir = 'desc'): void
    {
        $query->orderBy('activity_logs.timestamp', $dir === 'asc' ? 'asc' : 'desc');
    }
}
