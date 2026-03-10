<?php

namespace App\Http\Controllers\Simulation;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UserDetailsController extends Controller
{
    /**
     * Show the current user's details (simulation screen, display only).
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $user->load('masterUser:id,school_id,first_name,last_name,course,year_level,section');

        $master = $user->masterUser;

        return Inertia::render('simulation/user-details', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'points_balance' => (int) $user->points_balance,
                'level' => (int) $user->level,
                'total_completed_quests' => (int) $user->total_completed_quests,
                'quests_won' => (int) $user->quests_won,
                'total_xp_earned' => (int) $user->total_xp_earned,
                'school_id' => $master?->school_id,
                'first_name' => $master?->first_name,
                'last_name' => $master?->last_name,
                'course' => $master?->course,
                'year_level' => $master?->year_level,
                'section' => $master?->section,
            ],
        ]);
    }
}
