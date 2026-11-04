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

## Results, 4 November 2026

- Passed two independent browser-context accounts: sign-in to the Auth emulator, create space, invite/join, live bidirectional text delivery.
- Passed exact-ID direct message creation and real-time delivery.
- Passed image upload through the Storage emulator and display in the other member's conversation.
- Passed reply rendering and literal HTML-like input, without injected image elements or script execution.
- Passed reactions, saved messages, pinned messages, author edit, and author soft-delete.
- Passed actual WebRTC video and voice connections across browser contexts using Chromium's synthetic test microphones/cameras. Mute, camera disable, hangup, decline, and caller cancellation passed.
- Passed production-build service-worker installation and offline reload: cached message visible; send button disabled.
- Passed offline preference restoration and private CacheStorage deletion on sign-out.
- Passed search-result navigation and image lightbox.
- Passed desktop, 820×1180 iPad-style portrait, 1180×820 landscape, and 375×812 phone viewport checks; desktop-to-mobile-to-desktop transitions were checked.
- Passed phone navigation open/select/close, details open/close, and appearance switch.
- No uncaught page errors were observed during the exercised flows. No horizontal document overflow or clipped composer was observed at the tested viewports.
- Fourteen Firebase emulator security assertions passed, including unauthenticated/nonmember read denial, author impersonation denial, other-author edit denial, foreign reaction manipulation denial, uninvited membership escalation denial, directory listing denial, and rejecting email fields in public profiles.
- `npm audit` returned zero vulnerabilities after dependency updates.

## Still requires external activation/validation

- Google sign-in on the live GitHub Pages URL reported `auth/unauthorized-domain`. The project owner must authorize `ardy03851-bit.github.io` and confirm the Google provider.
- Publish the reviewed Firestore/Storage rules to the live project; local emulator rules are not a production release.
- Confirm live Storage provisioning and any billing requirement with the project owner.
- Test Google login with a real account and a second real person after activation.
- Validate on physical iPad hardware; responsive Chromium viewport tests do not establish every Safari/WebKit behavior.
- TURN-backed calling across restrictive real-world networks, screen-capture permissions, push notifications, and production abuse controls are not signed off.
