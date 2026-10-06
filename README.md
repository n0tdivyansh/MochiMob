# Mochi Mob

> An original 2D jelly-blob co-op puzzle platformer for 1–4 players. Built with pure Canvas 2D, WebAudio, deterministic simulation, and integrated with the CrazyGames SDK v3.

![Mochi Mob](poster.png)

---

## 🎮 Overview

In **Mochi Mob**, you control adorable, squashy mochi jelly blobs working together to navigate obstacles, solve pressure plate puzzles, ride synchronized lifts and conveyor belts, and carry the key to the exit door.

Everything in the game — characters, backgrounds, textures, physics, particles, sound effects, and musical tracks — is procedurally generated in pure code with zero external art or audio assets.

---

## 🕹️ Game Modes

### 1. Solo Trials (Levels `t-1` to `t-16`)
Built specifically for single-player play with a single mochi. Designed to ease players in and ramp up through satisfying puzzle mechanics:
- **`t-1` First Hop**: Learning basic movement and jumping.
- **`t-2` Squeeze Play**: Crawling through 1-tile crawlways while squished.
- **`t-3` Heavy Lift**: Moving crates onto latch pressure plates.
- **`t-4` Chroma**: Color-coded plates and security gates.
- **`t-5` Mushroom Spring**: Using bouncy mushroom launch pads.
- **`t-6` Treadmill**: Conveyor belt momentum and counter-running.
- **`t-7` Sky Step**: Synchronized moving platforms and precision timing.
- **`t-8` The Gauntlet**: Combined platforming, crate moving, and crawl puzzles.
- **`t-9` Spike Vault**: Air control over hazard pits and bounce chaining.
- **`t-10` Dual Shift**: Multi-stage weighted plates and latch puzzle solving.
- **`t-11` Belt & Brawn**: Pushing crates across conveyor belts into crawl slots.
- **`t-12` Chroma Chamber**: Tri-color sequence gates.
- **`t-13` Sky Lifts**: Synchronized horizontal and vertical platforming.
- **`t-14` Crate Step**: Using crates to trigger plates and create elevation steps.
- **`t-15` Vertical Vault**: 4-tier vertical ascent with spring pads and cloud shelves.
- **`t-16` Conveyor Clash**: Mid-air belt redirection and precision jumping.

### 2. Co-op Campaign (20 Levels across 4 Worlds)
Play with 2–4 players locally, or tackle them solo using hot-swapping:
- **World 1: Meadow**: Team stacking, Squish Trampolines, and synchronized doors.
- **World 2: Factory**: Heavy crates, conveyor belts, weighted plates, and timed lifts.
- **World 3: Canopy**: Elastic rope tethering, swing-jumping, and cliff climbing.
- **World 4: Summit**: Multi-gate color coordination, labyrinth rooms, and the grand finale.

---

## 🍮 Core Mechanics

- **Squish Trampoline (`S` / Down)**: Holding down squishes your mochi flat. Teammates who jump on a squished mochi get launched **7 tiles high** into the air!
- **Squish Crawling (`S` + Left / Right)**: Crawl through narrow 1-tile gaps while squished.
- **Team Stacking**: Stand on top of teammates to gain extra elevation or push together to move heavier crates.
- **Elastic Tethers**: On rope levels, teammates are bound by elastic cords, allowing players to anchor on cliffs and swing friends across chasms.
- **Pressure Plates & Latches**: Stepping on plates opens gates; latch plates stay open once triggered by players or crates.

---

## ⌨️ Controls

### Keyboard (Player 1 / Solo)
| Action | Keys |
| --- | --- |
| **Move Left / Right** | `A` / `D` or `Left` / `Right` |
| **Jump** | `W` or `Up` or `Space` |
| **Squish / Crawl** | `S` or `Down` |
| **Switch Mochi (Solo)** | `Q` / `E` or `1` / `2` / `3` / `4` |
| **Toggle Follow AI (Solo)** | `F` |
| **Pause** | `P` or `Esc` or Pause button |

*(In Solo mode with multiple mochi, inactive teammates remain squished on the floor so you can easily use them as launch trampolines!)*

### Local Multiplayer (Up to 4 Players)
- **Player 1**: `W` / `A` / `S` / `D`
- **Player 2**: `Up` / `Left` / `Down` / `Right`
- **Player 3 & 4**: Keypad or custom bindings in Settings
- **Gamepads**: Plug-and-play support for standard USB/Bluetooth gamepads.

---

## 🚀 Development & Build

### Requirements
- Node.js 20+
- npm

### Setup & Run
```bash
# Install dependencies
npm install

# Start local dev server (http://localhost:5175/)
npm run dev:client

# Run deterministic test suite (all 297 tests)
npm test

# Production build (outputs to dist/)
npm run build
```

---

## 🌐 Platform Integration (CrazyGames SDK v3)

- **Instant Onboarding**: First visit jumps straight into `t-1` with interactive in-world visual key prompts.
- **Lifecycle Events**: Full integration with `loadingStop`, `gameplayStart`, and `gameplayStop`.
- **Celebrations**: Fires `happytime` on 3-star level completions.
- **Audio & Focus**: Automatically mutes WebAudio and pauses the simulation when the browser tab loses focus.
- **Responsive Layout**: Letterboxed virtual 1920×1080 viewport scaling dynamically from mobile screens up to 4K displays.

---

## 📄 License

Proprietary / All Rights Reserved.
