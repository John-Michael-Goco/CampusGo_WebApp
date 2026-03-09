<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'master_user_id',
        'name',
        'email',
        'password',
        'role',
        'points_balance',
        'level',
        'total_completed_quests',
        'total_xp_earned',
    ];

    /**
     * Get the master record (student or professor) when this user is linked to one.
     */
    public function masterUser(): BelongsTo
    {
        return $this->belongsTo(MasterUser::class, 'master_user_id');
    }

    /**
     * Display name: stored name (admins), or from master record, or email.
     */
    public function getNameAttribute(?string $value): string
    {
        if ($value !== null && $value !== '') {
            return $value;
        }
        $master = $this->masterUser;
        if ($master !== null) {
            return trim($master->first_name . ' ' . $master->last_name);
        }
        return $this->email ?? '';
    }

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Get the activity logs for the user (as the actor who performed the action).
     */
    public function activityLogs(): HasMany
    {
        return $this->hasMany(ActivityLog::class, 'user_id');
    }

    /**
     * Get the user's enrollments (per semester).
     */
    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class);
    }
}
