<?php

namespace App\Events;

use App\Models\Quest;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

class QuestSubmittedForApproval implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets;

    public int $id;
    public string $title;
    public string $quest_type;
    public ?string $created_at;
    /** @var array{id: int, name: string}|null */
    public ?array $creator;

    public function __construct(Quest $quest)
    {
        $this->id = $quest->id;
        $this->title = $quest->title;
        $this->quest_type = $quest->quest_type;
        $this->created_at = $quest->created_at?->format('Y-m-d\TH:i:s');
        $this->creator = $quest->creator ? ['id' => $quest->creator->id, 'name' => $quest->creator->name] : null;
    }

    /**
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [new PrivateChannel('admin.quests')];
    }

    public function broadcastAs(): string
    {
        return 'QuestSubmittedForApproval';
    }
}
