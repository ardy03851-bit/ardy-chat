# Ardy verification inventory

## Main flows
- Google sign-in and a clear setup or popup error; never fabricate a signed-in session.
- Create a space; list it; copy an invite; second member joins; nonmember denied.
- Create a direct message by exact Ardy ID; send and receive in two browser contexts.
- Text, image upload, reply, reaction, save, pin, edit, and delete.
- Search loaded messages and conversations; navigate saved messages.
- Profile and appearance settings; keyboard focus and modal dismissal.
- One-to-one voice/video signaling, accept/decline, mute, camera, hangup, cleanup.
- Install manifest and iPad safe areas; portrait/landscape and 375px.
- Explicit offline opt-in; reload offline; view cached history; disable sending; purge at sign-out.
- No page-level overflow, clipped composer, missing icons, broken fonts, or uncaught errors.

## Off-happy-path checks
- XSS-like message text is literal, not executable.
- Invalid friend ID or expired invite gives a contextual error.
- Attachment type and size restrictions.
- Member cannot edit another sender's text, forge identity, remove other reactions, or read another room.
- A network drop must not silently enqueue an offline send.

## Environment
Local test-only Firebase emulator mode is gated to localhost/127.0.0.1 and `?emulator=1`.
Production uses the supplied ardy-chat Firebase project and Google authentication only.
Emulator tests do not prove Google OAuth, production Firebase rules deployment, real iPad hardware, TURN traversal, or production Storage billing/setup.
