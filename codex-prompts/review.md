# Task: Review "Tae-ri's Story Time" and write a findings report

You are reviewing a small web app. **Do not change any existing file.** Your only output is ONE new file:
`reviews/codex-review.md` (create the `reviews/` folder if needed).

Do NOT call any external API (Gemini, OpenAI, etc.), do NOT read or print `.env`, and do NOT run
`tools/make_audio.mjs` without `--dry`. Do not commit or push.

## What the app is
An English picture-book web app for a 6–7 year old Korean child (name "Tae-ri"), deployed on GitHub Pages
(https://salgoo100.github.io/book-reading/). Parents use it on an iPad/phone (Safari, Chrome) and on a Windows PC.

- `index.html` — the whole app (HTML/CSS/JS in one file). Key parts:
  - `STORIES` data: 10 stories. Level 1 = `scenes`; some stories have `levels: {2:[...], 3:[...]}`.
    Each scene: `text` (English), `ko` (Korean hint), optional `who` (comma list of speaker roles, one per "quoted" part, in order),
    `why` (character explanation), `ask` (talk question), `quiz` (`opts: [[emoji, label, isCorrect]]`), `pic` (image name, default `sceneN`), `art` (emoji fallback).
  - Speech: pre-generated audio listed in `audio/manifest.json` is played first (`playClips`); otherwise browser `speechSynthesis` with per-role voices (`CAST`, `speakParts`). The child's name is spoken as `KID_SAY` ("Terry").
  - Word highlight: for recorded audio, word timing is estimated from word length and the speech span `s`/`e` in the manifest.
  - Screens: home → (level picker if `levels`) → reading (Read / Slow / Read All autoplay / Why / Talk / Quiz / Korean toggle) → end screen (stars, "Try Level N").
  - Video mode (`#video`, `videoSetup`, `videoPlay`): 16:9 recording screen, subtitles, auto-advance, child's name replaced with "friend",
    clips that contain the name are not played. Only levels whose audio is complete are selectable.
- `tools/make_audio.mjs` — generates audio with Gemini TTS (or `--openai`); builds the clip list from `STORIES` and must use the **same keys** as `index.html`
  (`<story>/s<i>-p<j>`, `<story>/L<lv>/s<i>-p<j>`, `-why`, `-ask`, `-quiz`, `-quiz<k>`, `<story>/end`, `<story>/moral`, `common/great`).
- `tools/convert_images.py` — PNG → WebP.
- `images/<story>/*.webp`, `audio/**/*.wav`, `audio/manifest.json`, `manifest.webmanifest`, `icons/`.
- Planning docs: `PARKING_LOT.md`, `scenarios/*.md`, `codex-prompts/*.md` (illustration prompts).

Run locally with: `python -m http.server 8765` (then open http://localhost:8765). You may also run `node tools/make_audio.mjs --dry`.

## What to check
1. **Bugs / logic** in `index.html`: navigation between screens, level handling (`read(id,i,lv)`, `end`, progress keys),
   Read All autoplay start/stop and race conditions (`auto`, `playId`, `clipId`), audio fallback when a clip is missing,
   word-highlight loop ending correctly, video mode (start/exit, Esc, fullscreen, timers continuing after exit), localStorage handling.
2. **Data integrity** (write a small Node script in your head or run one that only reads files):
   - every scene's number of "quoted" parts equals the number of `who` roles; every role exists in `CAST` in BOTH `index.html` and `tools/make_audio.mjs`;
   - every `why.who` label resolves to the intended role with `roleOf` (watch for substring collisions);
   - every referenced picture exists in `images/<story>/` (`pic` or `sceneN`);
   - every key in `audio/manifest.json` points to an existing file, and key naming in `index.html` matches `tools/make_audio.mjs`;
   - quiz options have exactly one correct answer.
3. **Mobile / browser issues**: iOS Safari audio autoplay rules (chained clips, Read All, video mode), `speechSynthesis` quirks,
   `requestFullscreen` on iPhone, layout at 375px and 1024px widths, touch targets, PWA manifest/icons.
4. **Content**: English grammar and naturalness; whether Level 1 / 2 / 3 difficulty really increases; Korean hint accuracy and typos;
   anything scary or inappropriate for a 6–7 year old; consistency with the original plots (the parent wants original plots kept).
5. **Performance**: total page weight, image/audio sizes, anything loaded unnecessarily on startup.
6. **Security / privacy**: no API keys or secrets committed (check git history too: `git log -p -S "AIza"`, `git log -p -S "sk-"`), `.env` ignored,
   no personal data beyond the child's first name.
7. **Code quality** (lower priority): duplicated logic between `index.html` and `tools/make_audio.mjs`, dead code, fragile string replacements.

## Report format (`reviews/codex-review.md`)
- Start with a 5-line summary (overall health + top 3 issues).
- Then findings grouped by severity: **Critical / High / Medium / Low / Nitpick**.
- Each finding: title, `file:line`, what happens (concrete repro steps or example data), why it matters, suggested fix (short code snippet if helpful).
- A separate section "Content notes" for story text/translation suggestions (table: story, level, scene, current, suggestion).
- A final section "Verified OK" listing what you checked and found fine.
- Write the report in **Korean** (code, file names, and English story text stay in English).

When done, print the path of the report.
