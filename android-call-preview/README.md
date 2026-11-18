# Android call warning: preview

Owner: Aydan

A one-page preview of what a customer would see on an Android phone when a reported number calls:

1. The phone rings (an incoming call screen in the style of Google's Phone app).
2. A notification from Pause & Prove slides in: "Possible scam call".
3. Tapping it opens the warning: why the call was flagged, a question to ask yourself, and safe next steps.
4. The customer chooses what to do:
   - **Check if the bank is really calling:** the app already knows the number, so it checks it straight away. It uses the same wording as the website's "Is the bank really calling?" page.
   - **Hang up and call the bank yourself:** the call ends and the phone's keypad opens with no number filled in, plus a hint to use the number on the back of the card.
   - **Record this call:** explains how, and that not every phone can record calls.
5. After the call, a notification says what to do next.

The call plays out like a real one. You can answer it (a timer counts up, and Android's green call chip appears in the status bar), decline it, or leave it ringing until it becomes a missed call after 45 seconds. While it rings, Android's Answer and Decline card stays at the top of the app.

Some buttons open pages of our real website, https://fsdp-project.vercel.app, inside the phone, like an in-app browser: "Someone is calling me now", "Check a message, call or picture", "Freeze my accounts" and "Learn the signs".

It stands on its own: it is not linked from the main app and changes no shared file.

## Open it

Double-click `index.html` in this folder, or serve this folder and open the page:

```bash
python -m http.server 8000
```

Then go to http://localhost:8000. Under the phone:

- **Replay the call** starts it again.
- **Auto-play** loops the whole story without anyone clicking (for the booth). Any tap stops it. Open http://localhost:8000/?autoplay to start it straight away.
- **Sound** turns on a ringtone made in the browser (no sound files). It is off by default.
- **What happens** shows numbered captions, and highlights the step on screen.

## Notes

- Everything is made up: the number (+44 20 7946 0123 is from a UK range kept for films and TV), the 37 reports and the "no record" result. Nothing is sent anywhere.
- The website pages need an internet connection. Everything else works offline, except the fonts, which fall back to Segoe UI or Arial.
- Why a notification: on Android, a bank app set as the phone's "Caller ID & spam app" can see the number of an incoming call and show a notification. It cannot hear the call. On iPhone, an app can only add a label to the call screen, so the iPhone version would look different.
- Android draws the top line of a notification (app name and time). The content below it uses our look.
- Colours, font, cards and buttons follow the website (`css/base.css`, `css/clarity.css`, and the home page's dark red card). The page keeps its own copy of those values so it works on its own. The logo is redrawn as a small SVG from `img/pause&prove_logo.png`.
