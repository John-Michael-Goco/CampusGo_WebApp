<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

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
        'is_limited',
        'is_visible',
    ];

    protected function casts(): array
    {
        return [
            'cost_points' => 'integer',
            'stock' => 'integer',
            'is_limited' => 'boolean',
            'is_visible' => 'boolean',
            'start_date' => 'datetime',
            'end_date' => 'datetime',
        ];
    }
}
