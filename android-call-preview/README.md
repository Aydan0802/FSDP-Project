# Android call warning: preview

Owner: Aydan

A one-page preview of what a customer would see on an Android phone when a suspicious number calls:

1. The phone's incoming call screen.
2. A notification from Verify the Caller slides in: "Possible scam call".
3. Tapping it opens the warning: why the call was flagged, a question to stop and think, and safe next steps (check if the bank is really calling, hang up and call back, record the call).

It stands on its own: it is not linked from the main app and changes no shared file.

## Open it

Double-click `index.html` in this folder, or serve this folder and open the page:

```bash
python -m http.server 8000
```

Then go to http://localhost:8000. "Replay the call" under the phone starts it again.

## Notes

- Everything is made up: the number (+44 20 7946 0123 is from a UK range kept for films and TV), the 37 reports and the time. Nothing is sent anywhere.
- The action buttons only say "not built yet".
- Why a notification: on Android, a bank app set as the phone's "Caller ID & spam app" can see the number of an incoming call and show a notification. It cannot hear the call. On iPhone, an app can only add a label to the call screen, so the iPhone version would look different.
- Colours and font follow the Clarity theme (`css/base.css`, `css/clarity.css`); the page carries its own copy of those values so it works on its own.
