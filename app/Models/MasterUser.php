<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;

class MasterUser extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'school_id',
        'first_name',
        'last_name',
        'role',
        'course',
        'year_level',
        'section',
        'is_active',
        'is_registered',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'is_registered' => 'boolean',
        ];
    }

    /**
     * Get the user account linked to this master record (if registered).
     */
    public function user(): HasOne
    {
        return $this->hasOne(User::class, 'master_user_id');
    }
}
