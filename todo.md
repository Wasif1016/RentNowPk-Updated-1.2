## Done

- Unread count / badges — nav + sidebar, per-thread + total. Per-user read cursor in `chat_thread_participant_read_state`. [src/lib/db/chat-unread.ts](src/lib/db/chat-unread.ts), [src/lib/db/chat-unread-cached.ts](src/lib/db/chat-unread-cached.ts), [src/lib/actions/chat-read.ts](src/lib/actions/chat-read.ts).

## Not built yet (common "chat app" features)

| Area | Notes |
| --- | --- |
| Read receipts | `seen_at` exists on messages but there's no "mark as read" flow or UI tick marks. |
| Voice messages | Explicitly in architecture §4.1 (WhatsApp-style audio); not implemented. Needs storage (e.g. Supabase Storage), upload UI, playback, limits. |
| Attachments / images in chat | §4.1 file/image upload; schema has room for future metadata; not in current chat UI. |
| Typing indicator | §4.1 "Typing…"; would use Realtime Presence or a lightweight channel. |
| Push / in-app notifications | §4.2 / §5; not wired to new messages in app. |
| Sound on new message | §4.2 |
| Emoji reactions | §4.1 |
| Edit / soft-delete UX | `deleted_at` / `edited_at` exist in DB; no edit/delete in UI. |
| Thread search / filters | §4.1 "search", "booking status pills" on thread list. |
| Date separators / message grouping | §4.1 polish items. |
| Admin read-only + admin messaging | §4.1 admin access to threads. |
| Contact-info blocking | §4.3 regex before confirm; `blocked_by_contact_rule` field exists but blocking isn't implemented. |
| Location sharing in chat | §4.4 (after confirm). |
| "Send offer" from chat | §3.6 (different vehicle/dates/price). |
