# Chat attachments integration contract (draft)

## Product surfaces

Web, mobile, and desktop should have the same Chat capabilities, conversation history, attachment
behavior, video captions, review, retry, and download. Only their visual presentation and
device-specific controls differ. All three should use a common backend Chat contract, with
their respective authentication and file selection adapters. The current website, Expo app,
and Electron desktop renderer are separate implementations, so changes must be integrated and
verified on each surface; a mobile change does not automatically update the others.

This branch adds an image-only mobile picker and prepares broader client-side attachment
validation. The existing `POST /api/chat/turns` contract accepts JSON text only. Do not ship
the picker before the new image route and durable retry path are integrated and tested together.

The backend checkpoint now has `POST /api/chat/files/inspect` for one JPEG, PNG, or PDF up to
10 MB with a question. It analyzes the bytes without retaining the file, but its answer is not
yet a Chat turn and does not appear in conversation history or cross-device sync. Keep this
endpoint behind test use until attachment IDs, history, idempotency, guest rules, and the three
client adapters are integrated. The broader allowlist below is a later target, not live support.

The image-only mobile checkpoint uses `POST /api/chat/turns/image` for signed-in accounts. Its
answer is a normal Chat turn and syncs as text; the original image is not retained by the server,
so another device sees `[Зураг]` and the question, without a thumbnail. The app copies a JPEG
into its document directory before queueing, reuses the same IDs and file for retries, and
deletes the local copy after successful persistence. The picker must not be shipped against a
server without this route. A native build is required for the new Expo image modules.

## Supported inputs

Up to three attachments per turn, 10,000,000 bytes each and 20,000,000 bytes combined. See
`src/mobile/chat-attachments.ts` for the client allowlist. Treat filename and client MIME as
untrusted on the server; inspect actual bytes, validate container formats, and reject archives,
executables, malformed files and unsupported types. Convert iPhone HEIC/HEIF photos to JPEG
before validation/upload, or add an explicitly tested conversion path on the server.

## Backend contract to implement against the latest backend source

- Authenticated, account-scoped temporary upload, with the same guest/normal-user rules as chat.
- Stream with bounded memory, strict byte limits and validated type; return opaque attachment IDs.
- Associate IDs atomically with an idempotent `clientTurnId` when creating the chat turn.
- Pass images as image inputs and supported documents as file inputs to the provider. Bound total
  provider request size and processing time; do not embed file content in message text.
- Persist attachment metadata with user messages and expose it through history and change sync.
  Never return raw file data in sync responses.
- Retain upload IDs and local URI references for retry; if the local file vanished, show a
  recoverable error and never send text silently without the selected attachments.
- Clean up orphan uploads and provide account-scoped access/deletion. Avoid logging file bytes,
  transcripts, signed URLs, or bearer tokens.

The protocol, storage policy and response schema must be aligned with the current backend's
auth, database migrations, chat idempotency, sync and provider routing before implementation.

## Short video and subtitles (requested follow-up)

Add video as a separate media workflow after the upload/auth/storage contract is implemented.
Accept only verified, decodable short clips (initial target: MP4/MOV, at most 260 seconds) and
enforce both byte and duration limits on the server. Never trust filename, MIME type, or client
duration. Extract audio in an isolated bounded worker, transcribe Mongolian speech with segment
timestamps, and generate UTF-8 SRT and WebVTT files. Allow users to review and correct the
caption text and timing before exporting. A transcript alone is insufficient for subtitles:
the existing `/api/voice/transcribe` returns only `{ text }`, without timing information.

For visual recognition of a clip, sample a bounded number of frames separately and describe
what is visible; distinguish this from speech transcription. If the user wants subtitles burned
into the picture, render a new video as a later export step with explicit size, duration, and
processing limits. Keep original and generated media account-scoped, define retention and
deletion, and avoid logging media, transcripts, or temporary URLs. Do not activate a video
picker until processing, failure recovery, and mobile download/share are verified end to end.
