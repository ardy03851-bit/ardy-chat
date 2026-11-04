# Ardy

A quieter place for human conversations. A responsive, static web app with Firebase Authentication, Cloud Firestore, Firebase Storage, and peer-to-peer WebRTC calls. There is no AI chat or chatbot.

## Website

Public app: [Ardy on GitHub Pages](https://ardy03851-bit.github.io/ardy-chat/).

## Included

- Google sign-in and editable display name/profile.
- Private group spaces with seven-day invite links.
- Direct messages using exact Ardy IDs, without publishing email addresses or a user directory.
- Real-time text messaging and typing indicators.
- Image and PDF/text attachments, with type/size checks, progress, image lightbox, pasted images, and drag-and-drop.
- Large JPG/PNG/WebP images are compressed client-side when compression helps.
- Replies, three reaction types, saved messages, pins, own-message editing and deletion.
- Conversation/loaded-message search, with a keyboard shortcut.
- One-to-one audio/video calls, incoming call acceptance, mute, camera toggle, hangup, and browser-supported screen sharing.
- Responsive iPad portrait/landscape layout, safe-area support, standalone PWA manifest and home-screen icons.
- Explicitly opt-in, per-device offline reading of viewed conversations. No offline sending or queued sends.
- Dark and light appearance, accessible labels, modal focus trapping, reduced motion support.
- Clearly labeled sample conversation for signed-out visitors. Sample people are fictional and not live users.

## Firebase activation required

The public Firebase web configuration is already included. A web config alone does not enable Google authentication, authorize a new domain, provision Storage, or publish security rules. Firebase web API keys identify an app and are not admin credentials; data access must be enforced with Security Rules. [Firebase API key documentation](https://firebase.google.com/docs/projects/api-keys).

Complete these project-owner settings before inviting real users:

1. Open [Firebase Authentication for ardy-chat](https://console.firebase.google.com/project/ardy-chat/authentication/providers). Enable the **Google** provider and choose the project support email if prompted. [Google sign-in setup](https://firebase.google.com/docs/auth/web/google-signin).
2. In **Authentication → Settings → Authorized domains**, add `ardy03851-bit.github.io` without a scheme or path. Authorize only domains you trust. The in-thread preview may not support popup authentication; use the standalone GitHub Pages URL.
3. Ensure the **Cloud Firestore default database** exists. In **Firestore Database → Rules**, publish the exact contents of [`firestore.rules`](./firestore.rules), not open test rules. Review the impact before replacing rules on a project used by other applications. [Firestore rules documentation](https://firebase.google.com/docs/firestore/security/get-started).
4. Enable **Storage** for `ardy-chat.firebasestorage.app`. Review any billing requirement in your Firebase console before accepting it. In **Storage → Rules**, publish [`storage.rules`](./storage.rules). These rules check room membership through Firestore; the console may prompt to enable the necessary cross-service permission. [Storage rules documentation](https://firebase.google.com/docs/storage/security).
5. If the project has App Check enforcement already enabled, configure this web app with a compatible App Check provider before rollout. The app does not currently initialize App Check. Do not simply disable existing protection.

The connected Firebase Admin tool supports document operations, but does not expose Authentication settings, authorized domains, rule releases, Storage provisioning, or project billing controls. These settings are not silently bypassed or weakened.

With an independently authorized local Firebase CLI, rules can be deployed after review:

```sh
firebase deploy --only firestore:rules,storage --project ardy-chat
```

Do not place service account JSON, admin keys, tokens, or Firebase CLI credentials in this repository.

## Development

```sh
npm ci
npm run dev
npm run build
```

`index.html` is the HTML entry point; `src/app.js`, `src/style.css`, and `src/firebase.js` contain the application. `public/sw.js` and the manifest provide the install/offline shell. The production output is `dist/`, which can be hosted by a static HTTPS host.

All paths are relative so GitHub Pages project hosting works. The GitHub Actions workflow builds and deploys on pushes to `main`. Under repository **Settings → Pages**, the build source should be **GitHub Actions**.

The production build precaches its versioned JS, CSS, fonts, icons, and sample landscape through the service worker. On ordinary browser refresh the app shell stays available offline. The first installation must happen online.

## iPad home screen

Open the GitHub Pages app in Safari, tap **Share → Add to Home Screen**, enable **Open as Web App** if the option appears, then add it. Sign in from the installed app and enable **Settings → Offline reading** only on a trusted device. View the conversations you want saved before going offline.

Offline history is limited to the latest 150 loaded messages in each viewed conversation. Text and previously cached image attachments remain viewable; unseen messages and files cannot be fetched offline. Camera/microphone support and permissions depend on the browser/device. Real iPad hardware validation is still recommended.

## Calls and production boundaries

- Calls are one-to-one, not group voice rooms.
- Firestore carries the offer, answer, and ICE signaling. Browser media is peer-to-peer, with Google STUN servers configured.
- No TURN relay credentials are supplied. Calls may fail across restrictive NATs/firewalls. A reliable production calling service needs a TURN provider with short-lived credentials delivered by a trusted backend; never put a permanent TURN secret in public source.
- Screen sharing is offered only when supported by the browser. It requires an active video sender.
- No push notifications, unread receipts, server-side moderation, attachment malware scanning, abuse rate limiting, or end-to-end message encryption are claimed.
- Messages/files use Firebase access controls, not end-to-end encryption. Firebase Storage download-token URLs act as shareable bearer links; recipients should not redistribute them.
- Enable appropriate quotas, billing alerts, App Check, moderation/reporting, and abuse controls before a public-at-scale launch.
- Soft-deleting a message removes the visible message, not necessarily its uploaded storage object, previously saved copies, or copies retained by recipients.
- Online status means this device is connected, not a guarantee of another member’s presence.
- Profile changes apply to future messages. Older messages and room-member summaries preserve the name/photo snapshot from when they were created.

## Assets

The landscape in the explicitly labeled sample conversation is AI-generated photorealistic scenery, not a user-uploaded travel photograph or factual location evidence. No generated portraits are used. Avatars are initials; app icons are typographic. The bundled Satoshi font is distributed by [Fontshare](https://www.fontshare.com/fonts/satoshi). Interface icons use Lucide under the ISC license.

## Testing

See [`QA.md`](./QA.md) for verification scope and remaining external setup dependencies. Local emulator mode is available only on `localhost`/`127.0.0.1` with `?emulator=1`; it is unavailable on the public deployment. It uses anonymous test accounts only inside the Firebase Auth emulator, not in production.

The Firebase rules intentionally do not allow public reads, user-directory listing, nonmember message access, impersonated message authors, or editing another member’s message.
