# Privacy

Time Pilot is designed to work locally first. The game does not use adverts,
analytics trackers, third-party telemetry, or account sign-in.

This document describes what is stored when the optional high-score backend is
enabled.

## Local Device Storage

The game stores normal play data in the browser's local storage on the player's
device. This can include:

- Preferences, such as language, volume, zoom, video filters, and control
  settings.
- Achievements and achievement progress.
- High scores entered on the device.
- A short session-restore snapshot for interrupted player runs.
- Debug options when debug tools are enabled.

This data stays on the device unless a feature explicitly syncs it. The current
sync feature is high scores.

## Remote High Scores

When the high-score API is available, Time Pilot may send score submissions from
online player runs to the backend. A remote score record can include:

- Player-entered display name.
- Final score.
- A small list of run statistics shown on the leaderboard, such as era reached,
  enemies defeated, bonuses collected, shots fired/hit, accuracy, continues
  used, lives remaining, and play time.
- Game version.
- Submission time and server received time.
- A generated run identifier used to verify the submission.

The backend does not need or store an email address, account identifier, postal
address, payment details, contact details, or a real name.

## Anti-Cheat Receipts

For best-effort protection against fake score submissions, the client asks the
backend for a single-use run receipt at the start of an online run. The backend
stores:

- Generated run ID.
- Hashed run token.
- Receipt issue time.
- Receipt expiry time.
- Whether the receipt has already been used.

The raw receipt token is returned to the client once. The backend stores only a
hash of that token. This is not a guarantee against cheating, because browser
games cannot be made fully tamper-proof, but it raises the bar above accepting
arbitrary score posts.

Offline runs do not receive a remote run receipt. Their scores are saved locally
only and are not treated as trusted remote submissions later.

## Backend Storage

The high-score backend uses PostgreSQL when `DATABASE_URL` is configured. If
PostgreSQL is unavailable or not configured, it falls back to JSON storage in
`data/high-scores.json`.

Both storage modes contain the same kind of high-score and run-receipt data. The
JSON fallback is intended for development and small self-hosted deployments.
Production deployments should use PostgreSQL and a stable `HIGH_SCORE_SECRET`.

## Network and Hosting Logs

The Time Pilot application code does not intentionally collect IP addresses or
browser fingerprints. However, normal web hosting, reverse proxy, CDN, database,
or platform logs may record technical request information such as IP address,
user agent, URL, timestamp, and response status. Those logs are controlled by
the hosting environment used to run the site or API.

## What Is Not Collected

Time Pilot does not intentionally collect:

- Advertising identifiers.
- Analytics events.
- Cross-site tracking data.
- Precise location.
- Contacts.
- Microphone, camera, or file contents.
- Account credentials.
- Payment information.

## Data Removal

Players can clear local Time Pilot data from the in-game debug reset tools or
through the browser's site-data controls.

Remote high-score removal depends on the deployment owner, because remote scores
live in the configured PostgreSQL database or JSON storage file.
