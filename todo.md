| Area                               | Notes                                                                                                                                        |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Voice messages                     | Explicitly in architecture §4.1 (WhatsApp-style audio); not implemented. Needs storage (e.g. Supabase Storage), upload UI, playback, limits. |
| Attachments / images in chat       | §4.1 file/image upload; schema has room for future metadata; not in current chat UI.                                                         |
| Typing indicator                   | §4.1 "Typing…"; would use Realtime Presence or a lightweight channel.                                                                        |
| Push / in-app notifications        | §4.2 / §5; not wired to new messages in app.                                                                                                 |
| Sound on new message               | §4.2                                                                                                                                         |
| Emoji reactions                    | §4.1                                                                                                                                         |
| Contact-info blocking              | §4.3 regex before confirm; `blocked_by_contact_rule` field exists but blocking isn't implemented.                                            |
| Location sharing in chat           | §4.4 (after confirm).                                                                                                                        |
