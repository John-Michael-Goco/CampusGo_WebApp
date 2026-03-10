<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PointTransaction extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'amount',
        'transaction_type',
        'reference_id',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'integer',
            'created_at' => 'datetime',
        ];
    }

    public const TYPE_QUEST_REWARD = 'quest_reward';
    public const TYPE_BUY_IN = 'buy_in';
    public const TYPE_STORE_REDEEM = 'store_redeem';
    public const TYPE_BUY_IN_REFUND = 'buy_in_refund';
    public const TYPE_TRANSFER_IN = 'transfer_in';
    public const TYPE_TRANSFER_OUT = 'transfer_out';

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
