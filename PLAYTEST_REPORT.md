# PROJECT ELITE — Playtest Report

**Date:** April 15, 2026  
**Tester:** Automated headless browser playtest  
**Build:** Latest commit on main branch  
**Environment:** Node 22 server (port 3000) + Webpack dev server (port 5000) + Chromium headless (1920×1080)

---

## How the Game SHOULD Work (from source code analysis)

### Intended Flow
1. **NewGameScene** — Title screen with "PROJECT ELITE" logo over a sci-fi battlefield background. Player chooses "New Game" or "Join Game". If New Game, enters their name and clicks Next. If Join Game, enters name + room code.
2. **SelectCharacterScene** — Shows room code, character selection (Gherid or Akosha) with green selection indicators, a player list, and a "Start Game" button for the host. Assets load from Azure blob storage.
3. **LoadingScene (Game Scene)** — The actual tactical game. A crashed spaceship map with 9 grid squares. Player and 6 enemies spawn on the grid. Turn-based combat:
   - **Player Round (2 min):** Click grid squares to move (1 step to adjacent squares). Click enemies to attack (if within range). Timer counts down.
   - **Enemy Round:** Server-side AI computes enemy moves and attacks. Runners (speed 2, damage 1, range 1) rush the player. Biters (speed 1, damage 2, range 1) are slow but hit hard. Shooters (speed 0, damage 1, range 2) snipe from afar.
   - **Win:** Accumulate 40 score (5 per kill = 8 kills needed). **Lose:** All players reach 0 HP.
4. **Multiplayer:** Socket.IO connects clients to server. Rooms with 4-character codes. Up to 4 players.

### Characters
- **Gherid** — HP 5, Damage 2, Range 1 (melee tank)
- **Akosha** — HP 4, Damage 1, Range 2 (ranged)

### Grid Layout
9 squares on a crashed spaceship map. Adjacency defined in constants. Players start at squares 1 and 9. Enemies start at squares 3-8.

---

## Section 1: What Works Correctly

### ✅ Server
- **Compiles and starts cleanly** — `ts-node` runs without errors, Socket.IO listens on port 3000
- **Room creation works** — 4-character room code generated, player registered
- **Socket.IO connection established** — Client connects successfully, room join confirmed
- **Game state management** — Server correctly tracks players, enemies, grid positions, health, score
- **Enemy AI logic** — `computeEnemyPhase()` correctly implements BFS pathfinding, movement speeds, attack ranges, and damage
- **Combat resolution** — Damage calculations work correctly on the server side
- **Win/lose conditions** — Server correctly detects game over when all players die

### ✅ Client — NewGameScene (Title Screen)
- **Renders perfectly** — Background image (23MB game-background-v2.png) loads and scales correctly
- **"New Game" button** — Visible, interactive, click handler works
- **"Join Game" button** — Visible, interactive, click handler works  
- **Name textbox** — RexUI BBCodeText editable field appears after clicking New Game
- **Room code textbox** — Appears when "Join Game" is selected (hidden for "New Game")
- **Next button** — Visible, click connects to server and transitions to character select
- **Socket.IO connect + room creation** — Happens automatically on Next click, room code received

### ✅ Client — LoadingScene (Game Scene) — Partial
- **Map renders correctly** — Tilemap JSON parsed, background image (crashed-spaceship-map-v3.png) displayed with correct scaling and centering
- **Grid squares created from Tiled object layer** — All 9 squares loaded with correct positions
- **Player sprite spawned** — Gherid sprite visible at correct grid position (square 1)
- **Enemy sprites spawned** — All 6 enemies visible at correct grid positions (squares 3-8)
- **HUD elements created** — Score, Round, HP text objects positioned correctly
- **Timer bar component** — Visual countdown bar works when manually started
- **Movement** — Server correctly validates adjacency and updates grid position
- **Sprite tweening** — Player sprite animates smoothly to new position after move
- **Grid interaction zones** — Interactive zones created for all 9 grid squares

---

## Section 2: What's Broken and Why

### 🔴 BUG 1: ROUND_START Event Lost — Game Unplayable (CRITICAL)

**What should happen:** When the game starts, the server emits `GAME_STARTED` followed immediately by `ROUND_START`. The client receives `ROUND_START`, sets `controlsEnabled = true`, shows the timer bar, and displays "Round 1 — GO!" overlay.

**What actually happens:** The `ROUND_START` event is emitted by the server before the client's `setupSocketListeners()` finishes registering handlers in the new scene. The event is silently lost. `controlsEnabled` stays `false`, the timer bar stays hidden, the phase overlay never appears, and the HUD shows "HP: --" because `updateHUD()` never runs.

**Root cause:** Race condition in `game-engine.ts`. `startGame()` calls:
```typescript
this.io.to(roomCode).emit(SocketEvent.GAME_STARTED, { gameState: room.state });
this.startPlayerRound(room);  // emits ROUND_START immediately
```
The client receives `GAME_STARTED` in `SelectCharacterScene.onGameStarted`, which calls `this.scene.start('loading-scene', {...})`. Phaser then:
1. Destroys the current scene
2. Boots the new scene
3. Calls `preload()` (loads assets)
4. Calls `init()` 
5. Calls `create()` → which calls `setupSocketListeners()`

Steps 1-5 take time (especially asset loading). Meanwhile, `ROUND_START` arrives with no listener attached.

**Impact:** The player can never interact with the game. Controls are permanently disabled. The server's 2-minute timer expires, enemies attack the helpless player, and the game ends in defeat — all while the client shows a static game board with no timer or controls.

**Fix:** The server should delay `ROUND_START` emission. Options:
- Add a `PLAYER_READY` event that clients send after `create()` finishes. Server waits for all players to send it before starting the round.
- Add a timeout (e.g., 3-5 seconds) between `GAME_STARTED` and `ROUND_START`.
- Register socket listeners in `init()` instead of `create()` so they're ready before assets load.

---

### 🔴 BUG 2: Character Select — All Assets Fail to Load (CRITICAL)

**What should happen:** The character select screen shows a themed background, character portraits, an activity box showing the player list, and a "Start Game" button.

**What actually happens:** Black screen with neon green placeholder rectangles. All sprites display `__MISSING` texture. The "Players:" text and room code text are visible, but everything else is broken. Character sprites are positioned thousands of pixels off-screen (x=-3259, x=5179).

**Root cause:** `SelectCharacterScene.preload()` loads ALL assets from an external Azure blob URL:
```typescript
this.load.baseURL = 'https://projectelitestorage.blob.core.windows.net/assets/';
```
This URL is unreachable (Azure storage account not accessible/expired). None of the 6 assets load. Phaser substitutes `__MISSING` textures (32×32 green squares).

**Secondary issue:** The `scaleNumber` calculation in `create()`:
```typescript
this.scaleNumber = window.innerHeight / this.background.height;
```
With the `__MISSING` texture, `this.background.height` = 32 (the missing texture size). So `scaleNumber` = 1080/32 = **33.75** instead of ~1. This makes `slotSpacing` = 250 × 33.75 = **8437.5 pixels**, placing character sprites thousands of pixels off-screen.

**Impact:** 
- Character select is visually broken and unusable
- Character selection sprites are off-screen and unclickable
- The "Start Game" button is positioned at y=1004 (below viewport at 1080) making it barely reachable
- The player list never shows the host's own entry (only shows when other players join)

**Fix:** Move character select assets to local `assets/` folder (like the NewGame scene does) instead of relying on an external Azure URL. Add the missing image files: `select-character-background.png`, `select-character-corner-v3.png`, `activity-box.png`, `start-game-btn.png`, `character-gherid.png`.

---

### 🔴 BUG 3: Player's Own Entry Missing from Player List (HIGH)

**What should happen:** After creating a room, the host should see their name in the player list on the character select screen.

**What actually happens:** The "Players:" header is visible but the list is empty. The host's name never appears.

**Root cause:** The `onPlayerJoined` event only fires when OTHER players join the room (`socket.to(room.code).emit` in server). The host's initial player data is never pushed to the player list UI. The `ROOM_CREATED` response only contains `roomCode` and `playerId`, not the full player list.

**Fix:** Either:
- Populate the player list from `room.state.players` in the `ROOM_CREATED`/`ROOM_JOINED` response
- Or emit `PLAYER_JOINED` to ALL players (including the sender) using `io.to(room.code).emit` instead of `socket.to(room.code).emit`

---

### 🟡 BUG 4: Timer Bar Not Linked to Server Timer (MEDIUM)

**What should happen:** The timer bar counts down the 2-minute round, synchronized with the server's timer.

**What actually happens:** Even when manually enabled, the timer bar runs independently on the client side. The server's `roundTimerHandle` uses `setTimeout` which doesn't sync with the client's visual timer. If there's any latency or desync, the client timer and server timer drift apart.

**Root cause:** `TimerBar.update(delta)` uses Phaser's frame delta, while the server uses `setTimeout(callback, ROUND_DURATION_MS)`. No synchronization mechanism exists.

**Impact:** The timer bar may show time remaining when the server has already ended the round, or vice versa.

---

### 🟡 BUG 5: No Error Handling in Asset Loading (MEDIUM)

**What should happen:** If assets fail to load, the game should show an error message or retry.

**What actually happens:** Failed assets are silently replaced with Phaser's 32×32 `__MISSING` texture. No `loaderror` handler is registered in any scene. The game continues with broken visuals and no user feedback.

**Root cause:** Neither `NewGameScene.preload()` nor `SelectCharacterScene.preload()` nor `LoadingScene.preload()` register `this.load.on('loaderror', ...)`.

**Fix:** Add error handlers in each scene's `preload()`:
```typescript
this.load.on('loaderror', (file: any) => {
    console.error(`Failed to load: ${file.key} from ${file.url}`);
    // Show user-facing error or retry
});
```

---

### 🟡 BUG 6: Enemy Phase Not Animated on Client (MEDIUM)

**What should happen:** During the enemy phase, the client shows an "Enemy Phase" overlay, then animates each enemy's move and attack with tweens, damage numbers, and hit effects.

**What actually happens:** Due to Bug #1 (ROUND_START missed), the `onEnemyPhase` listener is technically registered but the entire game state is already out of sync. Even if the listener fires, the client's `controlsEnabled` was never set to `true`, so it's never set to `false` by the enemy phase handler. The phase overlay text was never shown.

**Root cause:** Same timing issue as Bug #1. All socket listeners are set up too late.

---

### 🟡 BUG 7: Game Over Not Displayed (MEDIUM)

**What should happen:** When the game ends, a "Victory!" or "Defeat..." overlay should appear with the final score.

**What actually happens:** The game ends silently. The phase overlay never appears. The game board remains static.

**Root cause:** Same timing issue as Bug #1. The `onGameOver` handler was registered but by the time it fires, the game state already reflects game-over but the visual state is stale.

---

### 🟡 BUG 8: Scene Naming Confusion (LOW)

**What it is:** The main game scene is called `LoadingScene` with key `'loading-scene'`. This is misleading — it's not a loading screen, it's the actual gameplay scene. This likely confuses developers.

**Impact:** Code readability and maintenance confusion. No functional impact.

**Fix:** Rename to `GameScene` / `'game-scene'`.

---

### 🟡 BUG 9: No Move Limit Per Turn (LOW)

**What should happen:** Players should have limited actions per turn (move once, attack once, etc.).

**What actually happens:** There's no limit on player actions during the 2-minute round. A player can move repeatedly and attack as many times as they want.

**Root cause:** `handlePlayerMove` and `handlePlayerAttack` in `game-engine.ts` only validate phase and adjacency/range — they don't track action counts per round.

**Impact:** Game balance issue. Players can spam movement and attacks to eliminate all enemies before the timer expires.

---

### 🟡 BUG 10: Player Starts with isReady=false (LOW)

**What should happen:** After selecting a character, the player should be marked as ready.

**What actually happens:** When creating a room, the host's `isReady` is set to `false`. It only becomes `true` when `selectCharacter` is called on the character select screen. But the host auto-selects 'gherid' on room creation, so they need to explicitly click a character to trigger `selectCharacter` and set `isReady = true`.

**Root cause:** `roomManager.createRoom()` sets `isReady: false`. The `selectCharacter()` handler sets it to `true`, but it requires an explicit socket event from the client.

**Impact:** Low — the start game button works regardless of ready state (no ready check in `startGame`).

---

## Summary

| # | Bug | Severity | Category |
|---|-----|----------|----------|
| 1 | ROUND_START event lost — controls never enable | 🔴 CRITICAL | Timing/Architecture |
| 2 | Character select assets fail (Azure URL) | 🔴 CRITICAL | Asset Loading |
| 3 | Host not shown in player list | 🔴 HIGH | Socket Events |
| 4 | Timer not synced with server | 🟡 MEDIUM | Synchronization |
| 5 | No asset loading error handling | 🟡 MEDIUM | Error Handling |
| 6 | Enemy phase animations never play | 🟡 MEDIUM | Timing/Architecture |
| 7 | Game over overlay never shows | 🟡 MEDIUM | Timing/Architecture |
| 8 | Scene naming confusion (LoadingScene = Game) | 🟡 LOW | Code Quality |
| 9 | No move/attack limit per turn | 🟡 LOW | Game Balance |
| 10 | Host starts with isReady=false | 🟡 LOW | State Init |

### Priority Fix Order
1. **Bug #1 (ROUND_START race condition)** — This single bug makes the game completely unplayable. Fix this first.
2. **Bug #2 (Azure asset URLs)** — Move assets to local folder. Without this, character select is broken.
3. **Bug #3 (Player list)** — Quick fix, improves the lobby experience.
4. **Bugs #5-7** — Error handling and visual state fixes.
5. **Bugs #4, 8-10** — Nice-to-haves for polish.

---

## Test Evidence

Screenshots captured during playtest:
1. `game_01_initial.png` — Title screen renders correctly ✅
2. `game_03_new_game.png` — Name entry screen works ✅  
3. `game_04_after_next.png` — Character select broken (green placeholder textures) ❌
4. `game_05_game_scene.png` — Game map renders but HP shows "--", no timer ❌
5. `game_06_controls_enabled.png` — After manual control enable: timer and HP work ✅
6. `game_07_after_move.png` — Movement works when controls are enabled ✅

Server logs confirmed: room creation, player connection, game start all work correctly on the server side.
