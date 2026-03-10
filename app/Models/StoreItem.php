<?php

namespace App\Models;

use DateTimeInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StoreItem extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'name',
        'description',
        'cost_points',
        'stock',
        'start_date',
        'end_date',
        'is_visible',
    ];

    protected function casts(): array
    {
        return [
            'cost_points' => 'integer',
            'stock' => 'integer',
            'is_visible' => 'boolean',
            'start_date' => 'datetime',
            'end_date' => 'datetime',
        ];
    }

    protected function serializeDate(DateTimeInterface $date): string
    {
        return $date->format('Y-m-d\TH:i:s');
    }

    /**
     * Whether the item is within its start/end date range and thus redeemable.
     */
    public function isAvailableNow(): bool
    {
        $now = now();
        if ($this->start_date !== null && $now->lt($this->start_date)) {
            return false;
        }
        if ($this->end_date !== null && $now->gt($this->end_date)) {
            return false;
        }
        return true;
    }

    /**
     * Get inventory entries for this store item.
     */
    public function userInventoryEntries(): HasMany
    {
        return $this->hasMany(UserInventory::class, 'item_id');
    }
}
