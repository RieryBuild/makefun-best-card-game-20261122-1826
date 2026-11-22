# Ember Court — gate run (builder self-check)

Competition: best-card-game-20261122-1826 ("Make the best card game", $50 top-10).
Build dir: `~/workspace/makefun-work/best-card-game-20261122-1826-build/`
Built: 23 Nov 2026, ~02:50–04:15 WITA (session started after the 02:26 WITA open).
Node for all local runs: `~/workspace/tools/node22/bin/node` (22.21.0).

## Iterations (in-session revision — thinking_revised)

| # | Weaknesses found in self-critique | What changed | Measured result |
|---|-----------------------------------|--------------|-----------------|
| v1 | First full build | All files written fresh from the spec | Play/title/win/loss shots rendered; sim 50 seeds: 41 player / 9 warden wins, 0 unfinished, max 19 turns |
| v2 | (1) PASS/MEND/SOUND buttons overlapped the first hand card; (2) clash result text overlapped hand-card tops; (3) floating toast sat on top of the Warden's hand backs; (4) "YOU: 19 life" callout covered the legend; (5) last hand card overlapped the status panel and clipped "Last clash" text | Legend moved to the top-left rail (compact); buttons moved to a vertical stack on the left rail; clash cards shrunk to 112×158 with result text inside the zone; toast removed (result line already reports damage); "YOU: 19 life" callout dropped; hand re-centred (spacing 140, centre 660); bottom hint line removed | Play frame re-shot and read back: zero overlaps — legend, status, buttons, hand, clash zone all clear |
| v3 | Headless console showed AudioContext autoplay warnings (INFO) on every shot load — audio probed before any user gesture | audio.js: `tone()` returns early until `unlock()` (click/key) sets `unlocked` | Console lines on `?shot=play`: 4 INFO warnings → **0 lines** |
| v4 | Cards read slightly flat; clash zone had no "court" identity; stills could not show the material layer | Card faces: element wash + faint icon watermark; clash zone: gold court circle + ember glow | Play/title re-shot; cards read as real cards at thumbnail size; see scorecard below |

## Visual scorecard (play frame, 10 categories, 0–3)

Genre equivalents: Hero = player hand/cards · Obstacles = the Warden + wheel · Interactables = clash/deck/discard · World = the table.

| Category | v1 (before) | Final (after) | Evidence (one line) |
|---|---|---|---|
| Art direction | 2 | 2 | Deep-teal felt + gold + ember identity drives table, cards, UI, feedback |
| Hero/player | 1 | 2 | Authored cards: wash, watermark icon, gold winner rim, fanned hand, hover lift (v1: buttons hid a card) |
| Obstacles/enemies | 2 | 2 | Patterned card backs, telegraphed intent bar, life panel with heart pips |
| Rewards/interactables | 1 | 2 | Clash zone + court circle + result lines, deck/discard counts, clear buttons (v1: overlaps) |
| World/environment | 2 | 2 | Felt speckle + diamond weave + vignette + gold inlay + drifting embers + court circle |
| Materials/textures | 1 | 2 | Felt, gold, cream card stock, element washes are shared material roles (v1: flat faces) |
| Lighting/render | 1 | 2 | Radial felt gradient, vignette, card shadows, ember glow behind the clash |
| VFX/motion | 1 | 2 | Event-driven: clash slide-in, Kindle/Guard/win-burst, embers (stills cannot prove timing; animation code is in main.js/render.js) |
| UI/HUD | 1 | 2 | Top bar, life panels, legend wheel, status panel, in-frame callouts; zero overlaps in final frame (v1: three overlaps) |
| Performance evidence | 1 | 2 | 10 game files / 48,888 B, 42 ember particles, felt cached once, 1280×720 headless QA, 0 console errors |
| **Average** | **1.3** | **2.0** | **Zero automatic failures** (no placeholders, no generic stat-card HUD, no overlap/clipping, real playable input, active-play shot exists) |

Honest note on the 2.3 target: this scorecard is calibrated for 3D showcase work (anchors are 3D scenes); a 2D canvas card game caps around 2.0 on its scale — every category is ≥ 2 and no automatic failure stands, but the 2.3 average was **not** reached. Do not inflate the numbers; the frame is a finished, readable card table.

## MQ self-checks

- **MQ1 — competition/eligibility: PASS.** Slug best-card-game-20261122-1826, opened 22 Nov 18:26Z (23 Nov 02:26 WITA); this session started after the open; quota per coordinator state (02:42 WITA): can_submit TRUE, day 6/6, hard 40/40, blind-round slot available, round-1 cutoff 05:26 WITA. Quota NOT re-checked by the builder — coordinator re-verifies before submit.
- **MQ2 — complete game in one frame: PASS.** 1-play.jpg shows both hands, life 19 vs 14 with heart pips, clash zone with both cards + result, deck (57) + discard, legend wheel, status panel, PASS/MEND buttons, turn counter, Warden intent. Title, win ("THE COURT IS YOURS") and loss ("THE WARDEN PREVAILS") screens all render from real game states.
- **MQ3 — rules/AI/depth: PASS.** Wheel Flame>Gale>Stone>Tide>Flame, Kindle +2, Surge/Guard/Echo/Flow all implemented in deck.js and exercised by the sim (41/50 player wins greedy-vs-greedy; wins AND losses reachable; 0 unfinished in 50 seeds; max 19 turns). Warden telegraphs intent (~70% accurate) and bluffs ~16% of turns.
- **MQ4 — structure: PASS.** game/index.html + src/config.js, deck.js, ai.js, render.js, input.js, audio.js, main.js, shots.js — one clear job each, named for what they do. main.ts (fresh, own words) at root; serve.ts; shots.json; vendor/makefun-game.ts unchanged (sha256 dc67187521b24025ff952f8c231485a6eb92d6d71d29edd2a08154ffb4376129, matches kit).
- **MQ5 — top-5 study applied: PASS.** Sibling-study principles (§3 of coordinator state) applied, no other entry's code/repo/site read at any point. Cover is the play table, not the title screen.
- **MQ6 — determinism: PASS.** main.ts run twice (MAKEFUN_OUTPUT_DIR=/tmp/outA, /tmp/outB): `diff -r` identical. dossier.json sha256 `1ec0fe6941097569cac0f0380f6e5c436e1f9aadacb4cd4df71a4f767d0cad5d` (583,118 B). Fresh buildDossier on a copy without dossier.json: **byte-identical**.
- **MQ7 — screenshots: PASS.** 4 JPEGs, all 1280×720, each ≤ 256 KiB (see table). Real renders of the game's own code via headless Chrome against the local server; autopilot plays the real rules forward from fixed seeds (play seed 1, title seed 1, win seed 1, loss seed 2 — loss uses seed 2 because seed 1's worst-vs-greedy line ends in a player win; shots.json records this).
- **MQ8 — gates/caps: PASS.** game/ 10 files, 48,888 B (≤993 files, ≤48 MiB); index.html 869 B (≤1 MiB); screenshots 4, total 398,662 B; dossier.json 583,118 B (≤1.5 MiB); /output 15 files total. No network refs in game/ (grep `https?://` → NONE); all imports relative `./…`; all 8 game JS files pass `node --check`.

## Gate self-checks

- **Gate 0 — session/window: PASS.** `bundle --dry-run` (after `git init` + commit in the build dir, since the CLI refuses a non-repo) found sessions, including this builder session `e05964a5-3f67-48e6-9ff5-8b29b6c8ff38` (`/home/hatch/agents/agent-e05964a5-3f67-48e6-9ff5-8b29b6c8ff38/sessions/e05964a5-3f67-48e6-9ff5-8b29b6c8ff38.jsonl`). It warned 0 usage rows attached — expected mid-turn; the parent/coordinator attaches usage rows at bundle time. Pre-opening sessions were correctly left out by the CLI.
- **Gate 1 — transcripts/authorship: BUILDER PART PASS, coordinator to seal.** All game code written fresh in this session from the spec; starter "Block Dodger" used as layout reference only, never copied or re-typed; no other entry's files read. main.ts ≥1 authored line (whole file is fresh). ≥2 in-session revisions of render.js/audio.js (v2, v3, v4 above). Bundle/submit/repo are the coordinator's job — NOT done here.
- **Gate 2 — build/dossier: PASS.** main.ts exit 0 twice; diff identical; dossier byte-identical to fresh buildDossier; vendor file unchanged.
- **Gate 3 — play-test: PASS.** `?shot=play` autopilot completes a real game; win shot reaches the win screen in 9 turns (seed 1, best-reply vs weakest); loss shot reaches the loss screen in 16 turns (seed 2, worst vs greedy); 0 console errors on the final build; 0 network requests (code inspection: no http refs, no external assets, WebAudio synth only).

## Screenshots

| File | Size | Dimensions | State |
|---|---|---|---|
| screenshots/1-play.jpg (cover) | 134,573 B | 1280×720 | Turn 5, You 19 · Warden 14, held clash, intent "eyes the Gale" |
| screenshots/2-title.jpg | 97,870 B | 1280×720 | Title screen, four sample cards |
| screenshots/3-win.jpg | 89,044 B | 1280×720 | "THE COURT IS YOURS", 9 turns |
| screenshots/4-loss.jpg | 77,175 B | 1280×720 | "THE WARDEN PREVAILS", 16 turns |

## File list (final tree, 21 files + .git)

- LICENSE (MIT, SPDX line 1), README.md (3 make.fun badges + bounty link), main.ts, serve.ts, shots.json, package.json, .makefun/owner.json (wallet 6do8zGw4FPLCB1Cq44G8r8KwQccbhHUqtAptaRji6ALk)
- game/index.html (869 B), game/package.json, game/src/config.js, deck.js, ai.js, render.js, input.js, audio.js, main.js, shots.js
- vendor/makefun-game.ts (kit copy, unchanged)
- screenshots/1-play.jpg, 2-title.jpg, 3-win.jpg, 4-loss.jpg
- gate-run.md (this file)

## Risks / open items for the coordinator (Gate 1)

1. Scorecard average is 2.0, not the 2.3 target (2D-calibration note above) — judge criterion 4 (look/originality) is the exposure, not a gate failure.
2. README `?ref=riery` is a guess for the referral code — verify/replace before submit.
3. Win-screen gold burst rays cross the headline — readable, cosmetic only.
4. Loss shot uses seed 2 (documented in shots.json); win/play/title use seed 1.
5. Local git repo was initialised in the build dir for the dry-run check (commit `87fc46a` "Ember Court v1" + gate-run commit to follow) — coordinator owns the GitHub repo creation/push.
6. Usage rows: dry-run warned 0 attached; parent must run the SELECT + bundle with --muse-usage at seal time.
