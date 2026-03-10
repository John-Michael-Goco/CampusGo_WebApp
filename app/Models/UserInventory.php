<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserInventory extends Model
{
    public $timestamps = false;

    protected $table = 'user_inventory';

    protected $fillable = [
        'user_id',
        'item_id',
        'quantity',
        'acquired_at',
        'custom_prize_description',
        'source_quest_id',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'acquired_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function storeItem(): BelongsTo
    {
        return $this->belongsTo(StoreItem::class, 'item_id');
    }
}
