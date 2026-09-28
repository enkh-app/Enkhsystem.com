# Native voice transcription contract (not deployed)

The native app enables server transcription only when `EXPO_PUBLIC_ENKH_VOICE_API_ENABLED=true` is set for an EAS build. Until the backend is ready, leave this unset; the existing device recognizer stays active.

`POST /api/voice/transcribe` at the configured ENKH Chat API base:

- Authenticate the same bearer access token and client identity as `/api/chat/turns`. Never send a speech provider or n8n credential to the app.
- Accept `multipart/form-data` with `audio` (iOS/Android AAC `.m4a`, up to 10 MB) and `language=mn-MN`.
- Respond with JSON `{ "text": "recognized Mongolian speech" }`; return non-2xx for errors. Keep `text` nonempty and at most 12,000 characters. Transcription fills the composer; the person checks it and presses Send.
- Validate MIME type and actual audio content, enforce upload limits at the server, rate limit per user, and avoid retaining audio after transcription. These server controls are still to be implemented.
- The backend may call a provider directly or delegate to an n8n workflow. Its external request and response contract stays the same when that routing changes.

The matching backend route is implemented in the separate backend work package. It remains disabled until the backend provider is configured and deployed. A 404 results in a clear "server not ready" message; it is not treated as successful transcription.
