<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Semester extends Model
{
    public $timestamps = false;

    protected $fillable = ['name', 'start_date', 'end_date'];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
            'is_current' => 'boolean',
        ];
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class, 'semester', 'name');
    }

    /**
     * Check if any semester has a date range overlapping [startDate, endDate].
     * Pass $excludeId when updating to exclude that semester from the check.
     */
    public static function hasOverlappingRange(string $startDate, string $endDate, ?int $excludeId = null): bool
    {
        $query = self::query()
            ->where('start_date', '<=', $endDate)
            ->where('end_date', '>=', $startDate);

        if ($excludeId !== null) {
            $query->where('id', '!=', $excludeId);
        }

        return $query->exists();
    }

    /**
     * The current semester is the one where today's date falls within [start_date, end_date].
     */
    public static function current(): ?self
    {
        $today = now()->toDateString();

        return self::query()
            ->whereDate('start_date', '<=', $today)
            ->whereDate('end_date', '>=', $today)
            ->first();
    }
}
