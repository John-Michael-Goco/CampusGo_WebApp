import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

Pusher.logToConsole = true;

window.Echo = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: import.meta.env.VITE_REVERB_PORT ?? 80,
    wssPort: import.meta.env.VITE_REVERB_PORT ?? 443,
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
    enabledTransports: ['ws', 'wss'],
    authorizer: (channel: { name: string }) => ({
        authorize: (socketId: string, callback: (error: unknown, data: unknown) => void) => {
            const token = decodeURIComponent(
                document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? ''
            );
            fetch('/broadcasting/auth', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-XSRF-TOKEN': token,
                },
                body: JSON.stringify({ socket_id: socketId, channel_name: channel.name }),
            })
                .then((res) => {
                    if (!res.ok) {
                        console.error('[Echo] Auth failed:', res.status, res.statusText);
                        return res.text().then((t) => { throw new Error(`Auth ${res.status}: ${t}`); });
                    }
                    return res.json();
                })
                .then((data) => callback(null, data))
                .catch((err) => {
                    console.error('[Echo] Auth error:', err);
                    callback(err, null);
                });
        },
    }),
});
