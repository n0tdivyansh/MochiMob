# Mochi Mob — Design Spec

**Date:** 2026-09-26
**Status:** Approved in chat (game + tech sections), awaiting written-spec review
**Location:** `games-clone/mochi-mob/`

## 1. Goal

An original, production-quality co-op puzzle platformer in the spirit of the "everyone must cooperate to clear" genre (Pico Park style). Every character, level, sound and visual is original. It runs in the browser, supports a solo mode (one person controls a team of 2–4 blobs), 2–4 players locally (shared keyboard + gamepads) and online (room codes via a Node WebSocket server), and ships 20 levels across 4 worlds.

Solo and local modes need no server: the client build is a static site that works on any static host. The Online Play button checks server reachability and shows "Online unavailable" instead of failing when no server is running.

### Success criteria

- All 20 levels are beatable with 2, 3 and 4 players (proven by automated solution replays for 2 players and for every level whose rules scale with player count).
- All 20 levels are beatable in solo mode with a 2-blob team (proven by solo solution replays that use only swap and follow commands).
- Local play works with any mix of keyboard slots and gamepads.
- Online: create room, share 4-letter code, 2–4 players join, ready up, play any unlocked level, clear it, return to lobby. Survives one player disconnecting and reconnecting within 30 s.
- No uncaught exceptions in the browser console or server log during a full playthrough.
- Stable 60 fps on a mid-range laptop at 1080p.
- Visual bar: soft clay look with squash/stretch, lighting, shadows, particles, parallax; not flat placeholder shapes.

### Non-goals

- Mobile/touch controls (desktop-first; layout must not break on small screens, but touch play is out of scope).
- Accounts, matchmaking with strangers, persistence on the server.
- Level editor UI (levels are data files).
- AI teammates that solve puzzles on their own (solo helpers only follow the active blob).

## 2. Game design

### 2.1 Characters

Players are mochi blobs: rounded soft bodies, big glossy eyes, small mouth. Four palettes: Strawberry (pink), Matcha (green), Yuzu (yellow), Ube (purple). Each palette also has a shape glyph (heart, leaf, star, moon) shown on the blob's cheek and on color mechanics, for colorblind support.

Animation (procedural): idle wobble, blink every 2–5 s, eyes look toward velocity, squash on land, stretch on jump, lean while running, flatten while squished, puff-of-smoke death, happy bounce on level clear.

### 2.2 Controls

| Action | Kbd slot 1 | Kbd slot 2 | Kbd slot 3 | Kbd slot 4 | Gamepad |
|---|---|---|---|---|---|
| Left/Right | A / D | ← / → | J / L | Num4 / Num6 | Stick / D-pad |
| Jump | W | ↑ | I | Num8 | A (south) |
| Squish | S | ↓ | K | Num5 | B (east) or stick down |
| Enter door / interact | W at door | ↑ at door | I at door | Num8 at door | Up / A at door |
| Emote 1–2 | Q / E | , / . | U / O | Num7 / Num9 | X / Y |
| Pause | Esc | Esc | Esc | Esc | Start |

Keys are remappable in Settings. Online, each browser controls exactly one blob using slot-1 keys (arrows also work) or its first gamepad.

Solo mode uses slot-1 keys (arrows also work) or the first gamepad, plus:

| Action | Keyboard | Gamepad |
|---|---|---|
| Previous / next blob | Q / E | LB / RB |
| Select blob directly | 1 – 4 | — |
| Toggle "Follow me" | F | Y |

### 2.2.1 Solo mode rules

- Player picks team size 2–4 (default 2). Level rules scale to team size exactly like player count.
- Exactly one blob is active and receives input. Swapping is instant; a ring and arrow mark the active blob.
- Idle blobs hold their last pose: a blob left squished stays squished (usable as a bounce pad), a blob left on a plate keeps pressing it, a blob mid-air finishes its fall and stands still.
- "Follow me" (toggle, shown on HUD): idle blobs that are not squished walk toward the active blob, stop within 72 px, jump when blocked by a wall up to 1 tile or when the active blob stands higher and is within 160 px horizontally, and never walk off a ledge into a pit unless the active blob is below them. This makes "everyone pushes", "everyone on the lift" and tether walks possible alone. Swapping to a blob leaves follow mode on for the others.
- The follow behaviour is part of the simulation (deterministic, driven by a per-tick "follow" flag), so solo replays are reproducible.
- Level design rule: no puzzle may require two blobs to act simultaneously within a timing window shorter than a swap allows (≥ 0.5 s), so every level is solvable solo.
- Camera: frames the active blob first (keeps it within the inner 60% of the screen), includes idle blobs when zoom allows; screen-edge walls are disabled in solo.
- Progress, stars and best times are tracked separately for solo and co-op (both unlock the same levels).

### 2.3 Movement and physics

Virtual resolution 1920×1080; tile = 64 px. Fixed step 1/60 s.

- Blob hitbox 52×48 (squished: 60×24, bottom-aligned).
- Gravity 2600 px/s², max fall 1400 px/s.
- Run speed 380 px/s, ground accel 3200, air accel 2200, friction 3600.
- Jump velocity 900 px/s; releasing jump early cuts upward velocity to 40%.
- Coyote time 0.10 s, jump buffer 0.12 s.
- Blobs are solid to each other and to crates. A blob standing on another blob or crate is carried by it (inherits its horizontal delta each step), enabling towers.
- Pushing: a blob moving into a crate pushes it only if the number of blobs pushing in that direction (directly or through a chain of blobs) is at least the crate's `weight`. Otherwise it is blocked.
- **Squish (signature mechanic):** holding Squish on the ground flattens the blob (cannot move, hitbox shrinks). A blob landing on a squished blob is launched at 1500 px/s upward. Squished blobs fit under 32 px-high gaps (crawl is not allowed; a squished blob moves only if carried by a platform/conveyor).
- Collision resolution: axis-separated AABB sweep against tiles, then dynamic bodies, with stuck detection that nudges a body up to 16 px to the nearest free spot.

### 2.4 Level objects

| Object | Behaviour |
|---|---|
| Solid tile, one-way platform | Standard. One-way: solid from above only, drop-through not supported. |
| Spikes, pit (below level bottom) | Kill → respawn at last reached checkpoint after 0.8 s. |
| Checkpoint flag | Activates when any blob touches it; team respawn point. |
| Key | Picked up by touch; follows holder with lag. If holder dies, key returns to holder's last safe grounded position. Another blob touching the holder does not steal it. |
| Exit door | Opens when key holder touches it (key consumed). Once open, a blob pressing Up at the door enters (disappears, shown as icon on the door). Level clears when all blobs are inside. Entered blobs can press Up again to come back out. |
| Crate | Dynamic box with `weight` (number or `"players"`). Affected by gravity, carried by lifts/conveyors, can be stood on. |
| Pressure plate | `need`: number or `"all"` or `"all-1"`. Active while that many blobs (crates count as 1) stand on it. `latch: true` keeps it on forever once triggered. Linked by `id` to targets. |
| Gate / door block | Solid while closed; opens (slides) while any linked plate is active. |
| Lift | Platform moving along a path between two points. Modes: `weight` (moves toward end when ≥ `need` blobs on it, returns otherwise), `plate` (moves while linked plate active), `loop` (always). |
| Conveyor | Tile row moving bodies on top at 160 px/s. |
| Tether (world rule) | When the level sets `tether: true`, every blob is linked to the team chain (blob i ↔ blob i+1) by a rope of max length 256 px (configurable). Constraint projection after physics, with velocity correction so hanging blobs swing. |
| Color gate | Solid for everyone except blobs of its color. |
| Color plate | Pressure plate counting only blobs of its color. |
| Paint pool | Walking through recolors the blob to the pool's color (for that level). |
| Bounce pad | Launches anything at 1300 px/s. |

Player-count scaling: every entity may carry `minPlayers` (only exists when count ≥ value) and numeric fields may use `"players"`, `"all"`, `"all-1"`. Color objects reference palette slots 0–3; slots ≥ player count are removed or remapped as each level specifies.

### 2.5 Camera

Shared camera centred on the bounding box of living blobs, zoom from 1.0 down to 0.65 to fit them. When zoom is at minimum and blobs spread further, the camera edges act as walls (blobs cannot leave the frame). Camera clamped to level bounds; smooth follow with 0.15 s lag; small screen shake on crate land and death.

The camera-edge wall is part of the simulation (computed from blob positions deterministically, without smoothing) so online and local agree.

### 2.6 Worlds and levels

Each world has its own palette, parallax backdrop, music loop and one headline mechanic.

**World 1 — Puddle Meadow** (towers, Squish, crates)
1. *First Steps* — learn walking, jumping, and that you can stand on a friend: key on a ledge two blobs tall.
2. *Bounce House* — wall too high for a tower; one blob squishes, others bounce.
3. *Heavy Pudding* — crate with `weight: "players"` blocks the tunnel; everyone pushes, then uses it as a step.
4. *Low Road* — key behind a low gap; a squished blob is carried through on a conveyor while others hold position.
5. *Tower of Mochi* — tall vertical climb chaining towers and squish bounces; checkpoints mid-way.

**World 2 — Tinker Works** (plates, gates, lifts, conveyors)
1. *Press Here* — plate `need: 1` opens gate; the presser is freed by a second plate on the far side.
2. *All Aboard* — latching plate `need: "all"` opens the way.
3. *Going Up* — weight lift `need: "all"`; lift with fewer blobs sinks.
4. *Relay* — chain of three plates / gates; team must leapfrog, leaving one blob on each plate in turn.
5. *Factory Floor* — conveyors, crates onto plates, plate-driven lifts.

**World 3 — Tangle Woods** (tether)
1. *Tied Together* — gentle intro with pits; learn the rope limits.
2. *Anchor Down* — key hangs below a cliff; team anchors while one blob dangles to grab it.
3. *Leap of Faith* — sequence of gaps wider than one jump; hanging swing lets the chain cross.
4. *Swaying Boughs* — loop lifts plus tether.
5. *Canopy Run* — tether with plates and a towering finish.

**World 4 — Prism Peaks** (colors)
1. *True Colors* — color gates, each blob opens their own path.
2. *Paint Party* — color plates; paint pools to swap roles.
3. *Mixed Signals* — plates of one color open gates of another.
4. *Rainbow Tower* — towers where each floor has a color gate.
5. *Summit* — finale combining towers, squish, plates, lifts, colors.

Level layouts may be adjusted during implementation if a replay test shows a design is unsolvable or trivially skippable; the headline mechanic of each level stays.

Progress: level N+1 unlocks when N is cleared; world W+1 unlocks when W's level 5 is cleared. Stars per level: 1 = cleared, 2 = under par time, 3 = under gold time (times set per level after playtest).

### 2.7 Meta and UI

Screens (HTML/CSS overlay above the canvas, keyboard + gamepad navigable, focus ring visible):

- **Title** — logo, animated blobs, buttons: Solo, Local Co-op, Online Play, Settings, Credits.
- **Solo setup** — choose team size 2–4, short control card, then world map.
- **Local setup** — press Jump on any device to join a slot (shows color and control hint); 2–4 required; Start.
- **Online** — Create Room / Join Room (code input); lobby with player list, colors, ready toggles, leader picks level from world map; Leave.
- **World map** — 4 worlds, 5 nodes each, locked/unlocked, stars, best times.
- **In-game HUD** — level name, timer, key holder indicator, blobs-inside counter on door, emote bubbles; in solo also team portraits (active highlighted, number keys shown) and Follow on/off badge.
- **Pause** — Resume, Restart level, Settings, Quit to map (online: only leader restarts/quits for the room; others see "Leave room"; online pause does not freeze the sim).
- **Results** — time, stars, confetti, Next / Retry / Map.
- **Settings** — master/music/SFX volume, key remap per slot, fullscreen, reduced motion (disables shake and heavy particles), show colorblind glyphs (default on). Stored in localStorage.

Online progress: the room's unlocked levels are the union of what the leader has unlocked locally; clears in online play are saved to every participant's local progress.

### 2.8 Audio

All procedural via WebAudio: soft "boing" jump, squish squelch, land thud, key chime, door unlock, plate click, death pop, clear fanfare, UI ticks. Music: small step sequencer with original melodies, one loop per world plus title theme. Audio starts after first user gesture. Master/music/SFX gain buses.

## 3. Technical architecture

### 3.1 Stack

- Client: Vite 6, vanilla JS (ES modules), Canvas 2D, no game framework.
- Server: Node 20+, `ws`. No database.
- Tests: Vitest.
- One package: `mochi-mob/package.json`, scripts `dev` (Vite + server concurrently), `build`, `start` (server serves `dist/` and WebSocket on one port), `test`.

### 3.2 Directory layout

```
mochi-mob/
  index.html
  package.json
  vite.config.js
  server/
    index.js          # http static server + ws upgrade
    rooms.js          # room lifecycle, leader, reconnect
  src/
    main.js           # boot, screen router
    shared/
      protocol.js     # message schemas + validation (client + server)
    sim/              # PURE: no DOM, no timers, no Math.random
      constants.js
      world.js        # createWorld(level, playerCount) -> state
      step.js         # step(state, inputs) -> mutates state one tick
      physics.js      # AABB sweep, carry, push
      entities/       # blob, crate, plate, gate, lift, conveyor, key, door, tether, color, paint, bounce, checkpoint, spikes
      solo.js         # active blob, swap, follow AI
      snapshot.js     # serialize/deserialize compact state
    levels/
      index.js        # registry, world metadata
      w1-1.js ... w4-5.js
      validate.js
    render/
      renderer.js     # canvas, virtual resolution, camera transform
      sprites.js      # pre-baked blob/tile/prop sprites via offscreen canvas
      backdrops.js    # per-world parallax
      particles.js
      effects.js      # vignette, grain, shake, flashes
    audio/
      audio.js        # buses, SFX synth
      music.js        # sequencer + songs
    input/
      keyboard.js
      gamepad.js
      devices.js      # slot assignment, remap
    net/
      client.js       # ws connection, reconnect
      predict.js      # prediction + reconciliation
    game/
      localSession.js
      soloSession.js
      onlineSession.js
      loop.js         # fixed-step accumulator, render interpolation
    ui/
      screens/*.js
      ui.css
    save.js
  tests/
    sim/*.test.js
    levels/solutions/*.js   # scripted input tracks
    levels/solve.test.js
    server/rooms.test.js
```

### 3.3 Simulation contract

- `createWorld(levelDef, playerCount, options)` returns a plain JSON-serializable state object. `options.solo` enables solo rules (follow AI, no camera-edge walls).
- `step(state, inputs)` advances exactly one tick; `inputs` is an array of bitmasks (LEFT=1, RIGHT=2, JUMP=4, SQUISH=8, UP=16). In solo, `inputs` is a single bitmask plus `state.solo = {active, follow}`; swap/follow commands are applied through `soloCommand(state, cmd)` so replays can record them. Emits events into `state.events` (jump, land, die, key, door, clear…) consumed by audio/render and cleared by the caller.
- No wall-clock time, no `Math.random`, no DOM. Same inputs from same state produce same state on the same JS engine.
- `snapshot.encode(state)` / `decode` produce a compact array form for network.

### 3.4 Local and solo sessions

Fixed-step accumulator loop (max 5 steps per frame to avoid spiral), render interpolates between previous and current state. In local co-op each device slot maps to a player index. In solo (`game/soloSession.js`) one device drives the active blob and swap/follow keys issue solo commands.

### 3.5 Online protocol

JSON messages over one WebSocket, all validated by `shared/protocol.js` (type, field types, lengths).

Client → server: `create {name}`, `join {code, name}`, `rejoin {token}`, `ready {on}`, `pick {level}` (leader), `start` (leader), `input {seq, bits}` (every tick, batched up to 3 per message), `emote {id}`, `restart`/`quit` (leader), `leave`.

Server → client: `room {code, you, token, players, leader, level, phase}`, `error {code, msg}`, `start {level, playerCount, youIndex}`, `snap {tick, ack, state}` (30 Hz; `ack` = last processed input seq for that client), `event {…}` (clear, emote), `phase {…}`.

Server runs each playing room's sim at 60 Hz with a drift-corrected timer. Each client's newest input is applied per tick; missing input repeats the last one.

Client prediction: on each `snap`, reset local predicted state to the snapshot, drop acknowledged inputs, re-simulate pending own inputs (others repeat last known input) up to 20 ticks. Remote blobs render from an interpolation buffer 100 ms behind; own blob renders from prediction with correction smoothing (error decays over 100 ms, snaps if > 128 px). Sound/particle events come only from authoritative snapshots, except own jump/land which play from prediction.

Robustness: 4-letter codes from an unambiguous alphabet; max 4 players; max 200 rooms; rate limit 120 msgs/s per socket; message size limit 4 KB; heartbeat ping 5 s, drop after 15 s; on disconnect a player's slot is held for 30 s (their blob stands still) and can be reclaimed with `rejoin {token}`; if the leader leaves, the next player becomes leader; empty rooms are deleted; room idle > 30 min deleted. A room below 2 connected players during play returns to lobby after the 30 s grace.

### 3.6 Rendering

- Canvas sized to window × devicePixelRatio (capped at 2), letterboxed to 16:9, all drawing in 1920×1080 virtual units.
- Blob sprites pre-baked per palette at startup into offscreen canvases (body gradient, rim light, specular highlight, cheek glyph); drawn with per-frame scale for squash/stretch plus eyes drawn live.
- Tiles pre-baked per world into a chunk cache (rounded edges, top grass/metal/moss/crystal trims, soft inner shading) so each level's static geometry renders from a few large cached images.
- Contact shadows under blobs/crates, soft ambient gradient, 3–4 parallax layers generated procedurally per world, particles pooled (max 600), vignette and subtle grain overlay pre-rendered.
- Reduced motion setting disables shake, grain animation and dense particles.

### 3.7 Error handling

- Global `error`/`unhandledrejection` handler shows a non-blocking toast and logs; game continues if possible.
- Network loss: banner "Reconnecting…", exponential backoff (0.5 → 8 s), automatic `rejoin`; after 30 s return to title with message.
- Server: every handler wrapped; malformed messages → `error` reply and counted; 10 malformed → disconnect.
- Sim safety: velocity clamps, NaN guard that resets a body to last checkpoint, stuck-in-wall nudge.

## 4. Testing

- **Sim unit tests:** jump height/arc, coyote + buffer, variable jump, tower carry, push with weight, squish bounce and low-gap fit, plates (`need` variants, latch, color), gates, lift modes, conveyors, tether constraint, key follow/drop, door open/enter/exit, death + checkpoint respawn, camera-edge walls, determinism (same inputs twice → identical state).
- **Level validation:** every level has spawns ≥ 4, one key, one exit, entities inside bounds, no overlapping solids at spawn, resolved scaling for 2/3/4.
- **Solution replays:** scripted input tracks per level (2 players for all 20; 3 and 4 players for levels with scaled rules). Test runs the sim headless and asserts `clear` event.
- **Solo replays:** one solo track per level (2-blob team, single input stream + swap/follow commands) asserting `clear`. Unit tests for swap, idle pose hold, and follow AI (stops at distance, jumps 1-tile walls, refuses pit edges).
- **Server tests:** two in-process clients create/join room, start level, stream a replay's inputs, both receive `clear`; disconnect + rejoin keeps slot; leader handoff; malformed message handling.
- **Browser verification:** run dev server in preview pane, check console clean, screenshots of each world, play levels with two keyboard slots.

## 5. Delivery

- `npm install`, `npm run dev` for development (client on 5175, server on 8787, Vite proxies `/ws`).
- `npm run build && npm start` for production (single port, default 8787, `PORT` env respected).
- `npm run build` alone produces `dist/`, a static site with solo + local co-op fully working (host anywhere, including Vercel or GitHub Pages). Online server URL configurable via `VITE_SERVER_URL`; if unset or unreachable, Online Play shows "Online unavailable".
- README with controls, hosting notes (online server needs any Node host with WebSocket support, e.g. Render, Fly.io, Railway; not Vercel serverless).
- `.claude/launch.json` entry `mochi-mob`.
