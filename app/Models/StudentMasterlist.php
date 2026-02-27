<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentMasterlist extends Model
{
    protected $table = 'students_masterlist';

    public $timestamps = false;

    protected $fillable = [
        'student_number',
        'first_name',
        'last_name',
        'course',
        'year_level',
        'is_registered',
    ];

    protected function casts(): array
    {
        return [
            'is_registered' => 'boolean',
        ];
    }
}
