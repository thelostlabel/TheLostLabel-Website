# Agent Notes

## 2026-03-22 - Lost Website prod check (`152.53.142.222`)

Scope: Investigate reported `404` errors for:
- `/api/spotify/playlist/37i9dQZF1DWWY64wDtewQt/details`
- `/api/files/demo/f1fb9b76-8aed-49e7-98f3-47d6be7ed3a9/audio`
- `/api/files/demo/f1fb9b76-8aed-49e7-98f3-47d6be7ed3a9/waveform`

### SSH / platform facts
- Host reachable as `root@152.53.142.222` (key-based, no password prompt).
- Dokploy stack is up; service `the-lost-label-website-mwaq2s` is `1/1`.
- Website container has mount:
  - bind source: `/app/private/demos/uploads/demos`
  - bind target: `/app/private/uploads/demos`
- This confirms Dokploy bind mount for demo storage is active.

### File-route investigation
- DB record exists for `DemoFile.id = f1fb9b76-8aed-49e7-98f3-47d6be7ed3a9`.
- DB `filepath` is:
  - `private/uploads/demos/02f2ea21-7af3-4d8c-96fa-02f8892fa297_MIDU_ECHOING_funk.wav`
- File check results:
  - Missing in container at `/app/private/uploads/demos/...`
  - Missing on host at `/app/private/demos/uploads/demos/...`
- Conclusion: 404 on `/audio` and `/waveform` is caused by missing physical media file, not route mismatch.

### Spotify-route investigation
- App endpoint test from inside container:
  - `GET /api/spotify/playlist/37i9dQZF1DWWY64wDtewQt/details` -> `404 {"error":"Playlist details not found"}`
- Direct Spotify API test (client credentials from container env):
  - `GET https://api.spotify.com/v1/playlists/37i9dQZF1DWWY64wDtewQt?fields=images,name,external_urls` -> `404 Resource not found`
- Conclusion: Playlist ID itself is not currently resolvable by Spotify API; app 404 is expected behavior.

### Env confirmation in prod container
- `NODE_ENV=production`
- Spotify env vars are present in container.
- `REMOTE_STORAGE_PATH` is not needed in production for this case because bind mount exists; issue is absent file itself.

### Net diagnosis
1. `playlist details` 404: external Spotify resource not found.
2. `audio/waveform` 404: DB points to a file that no longer exists on host storage.
