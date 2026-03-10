<?php

namespace App\Models;

use App\Observers\QuestObserver;
use DateTimeInterface;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[ObservedBy(QuestObserver::class)]
class Quest extends Model
{
    use HasFactory;
    use SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'title',
        'description',
        'quest_type',
        'status',
        'is_elimination',
        'buy_in_points',
        'reward_points',
        'reward_custom_prize',
        'max_participants',
        'current_participants',
        'created_by',
        'approval_status',
        'creation_payment_status',
        'creation_cost_points',
        'start_date',
        'end_date',
        'semester_id',
    ];

    /**
     * The attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_elimination' => 'bool',
            'buy_in_points' => 'int',
            'reward_points' => 'int',
            'max_participants' => 'int',
            'current_participants' => 'int',
            'start_date' => 'datetime',
            'end_date' => 'datetime',
        ];
    }

    protected function serializeDate(DateTimeInterface $date): string
    {
        return $date->format('Y-m-d\TH:i:s');
    }

    public function semester(): BelongsTo
    {
        return $this->belongsTo(Semester::class);
    }

    public function stages(): HasMany
    {
        return $this->hasMany(QuestStage::class);
    }

    public function targetGroups(): HasMany
    {
        return $this->hasMany(QuestTargetGroup::class);
    }
}

