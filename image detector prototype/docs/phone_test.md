# Phone test: do AI labels survive WhatsApp and Telegram?

Our evaluation (`eval_results.md`) only *assumes* what the apps do. This 20-minute test with our own phones measures it. Do it before quoting any real-world numbers in the pitch.

## Rules
- Make **harmless** pictures only, for example "a cartoon cat reading a newspaper" or "a red teapot on a table". No real people, no faces, no bank logos, no documents, nothing that looks like a scam.
- Use free tools we already have. Don't pay for anything.
- Keep the files on our own devices and delete them afterwards. Don't post them anywhere.

## Steps
1. Make one picture in each tool you can use, and save the original file from the tool:
   - ChatGPT (images are said to carry content credentials)
   - Gemini (content credentials and SynthID)
   - Meta AI (inside WhatsApp; said to add the IPTC label)
   - Microsoft Copilot
2. Check each original in the demo first (`demo/index.html`, see the README) and note the result. This is the "document" row.
3. Send each original from one phone to a teammate's phone:
   - WhatsApp, as a normal photo
   - WhatsApp, as a document (paperclip → Document)
   - Telegram, as a normal photo
   - Telegram, as a file
4. On the receiving phone, save each picture and copy it to the laptop (USB, or email it to yourself *as an attachment*. Don't use a chat app here, because it would change the file again). Keep the file names the apps give.
5. Also take a screenshot of each picture on the phone.
6. Check every file in the demo and fill in the table below.

## Results (fill in)

| Tool | Original | WhatsApp photo | WhatsApp document | Telegram photo | Telegram file | Screenshot |
|---|---|---|---|---|---|---|
| ChatGPT | | | | | | |
| Gemini | | | | | | |
| Meta AI | | | | | | |
| Copilot | | | | | | |

Write the result key (likely / partial / uncertain / unsure) and the first reason, for example "likely: content credentials say AI" or "unsure: no details left".

Afterwards, add a "Run 2: phone test" section to `eval_results.md` with this table, the date, the app versions and the phones used.
