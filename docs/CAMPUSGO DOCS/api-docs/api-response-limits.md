# API response limits — avoid JSON truncation

If the mobile app shows **"End of input"** or a JSON parse error at `$.quests` (or similar), the response body is being **truncated**. Ensure the full JSON is sent by configuring the following.

## PHP (`php.ini`)

- **`output_buffering`** — Use `Off` or a size large enough for your largest API response (e.g. `4M`). If the buffer is too small, output can be cut.
- **`max_execution_time`** — Set high enough for slow queries (e.g. `60` or `120`). If the script times out mid-response, the client receives incomplete output.
- Avoid **`ob_flush()`** or early **`exit`** / **`die`** before the response is fully sent in API controllers.

## Web server / proxy

- **nginx** — `client_max_body_size` applies to *request* body; for *response* truncation, ensure **`proxy_buffer_size`** and **`proxy_busy_buffers_size`** (and related proxy buffers) are large enough for the full JSON, or disable buffering for API if appropriate.
- **Apache** — `LimitRequestBody` is for requests; ensure no response size limit or output filters that could truncate.
- **Reverse proxy** — Increase buffer sizes so the full response from PHP is stored and sent to the client.

## Reduce payload size (backend)

To keep responses under limits, the backend already:

- **GET /api/quests** — **Pagination**: use `page` and `per_page` (default 15, max 50). Each response returns only one page of quests, which keeps the JSON small and avoids truncation. `description` is omitted from the list; use **GET /api/quests/{id}** for full details (including `description` and `achievement`).
