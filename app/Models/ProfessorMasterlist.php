<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProfessorMasterlist extends Model
{
    protected $table = 'professors_masterlist';

    public $timestamps = false;

    protected $fillable = [
        'employee_id',
        'title',
        'first_name',
        'last_name',
        'department',
        'is_registered',
    ];

    protected function casts(): array
    {
        return [
            'is_registered' => 'boolean',
        ];
    }
}
