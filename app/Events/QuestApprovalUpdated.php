<?php

namespace App\Events;

use App\Models\Quest;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

class QuestApprovalUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets;

    public int $id;
    public string $title;
    public string $approval_status;
    private int $creatorId;

    public function __construct(Quest $quest)
    {
        $this->id = $quest->id;
        $this->title = $quest->title;
        $this->approval_status = $quest->approval_status;
        $this->creatorId = (int) $quest->created_by;
    }

    /**
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [new PrivateChannel('App.Models.User.' . $this->creatorId)];
    }

    public function broadcastAs(): string
    {
        return 'QuestApprovalUpdated';
    }
}
