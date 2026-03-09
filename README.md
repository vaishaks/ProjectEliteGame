# Project ELITE: Video Game

A digital adaptation of the Project ELITE board game, built with Phaser 3 and TypeScript. Players cooperate in real-time timed rounds to move across a grid map, fight enemies, and score points before the enemy AI phase advances.

## Project Structure

```
ProjectEliteGame/
├── game/          # Phaser 3 client (TypeScript + Webpack)
└── server/        # Node.js + Socket.IO multiplayer server
```

## Prerequisites

- **Node.js** >= 16 (tested with v22; v16-18 recommended for easiest setup)
- **npm** >= 8
- **yarn** >= 1.22 (for the game client)

## Running Locally

### 1. Start the server

```bash
cd server
npm install
npm run dev
```

The server starts on **http://localhost:3000**.

### 2. Start the game client

Open a second terminal:

```bash
cd game
yarn install
yarn dev
```

The game opens on **http://localhost:5000**.

> **Node.js 17+ note:** If you see an `ERR_OSSL_EVP_UNSUPPORTED` error, the older Webpack version needs the OpenSSL legacy provider. Set this before running:
> ```bash
> export NODE_OPTIONS=--openssl-legacy-provider
> yarn dev
> ```

### 3. Play

1. Open **http://localhost:5000** in your browser
2. Click **New Game**, enter your name, and click **Next**
3. You'll see a room code on the character select screen
4. To add another player: open a second browser tab, click **Join Game**, enter the room code and a name, click **Next**
5. Select characters, then the host clicks **Start Game**
6. During each 2-minute round, click grid squares to move and click enemies to attack
7. After the timer expires, enemies move and attack automatically
8. Reach a score of 40 to win

## Building for Production

### Game client

```bash
cd game
NODE_OPTIONS=--openssl-legacy-provider yarn build
```

Output is written to `game/dist/`. This is a static site (HTML + JS + assets) that can be served by any web server.

### Server

```bash
cd server
npm run build
npm start
```

Compiles TypeScript to `server/dist/` and runs the production server.

## Hosting

### Option A: Static hosting (client) + Node.js server

**Client** — deploy the `game/dist/` folder to any static hosting service:

- **Azure Blob Storage / Static Web Apps** (the project includes a `web.config` for Azure IIS)
- **Netlify** or **Vercel** — point to the `game/` directory with build command `NODE_OPTIONS=--openssl-legacy-provider yarn build` and publish directory `dist`
- **GitHub Pages** — push the `game/dist/` contents to a `gh-pages` branch
- **AWS S3 + CloudFront**
- **Any web server** (nginx, Apache) serving the `dist/` folder

**Server** — deploy to any Node.js hosting:

- **Azure App Service** — create a Node.js web app, deploy the `server/` directory
- **Railway** or **Render** — connect the repo, set root directory to `server/`, start command `npm start`
- **AWS EC2 / DigitalOcean** — run `npm run build && npm start` behind a reverse proxy (nginx)
- **Heroku** — set buildpack to Node.js, root to `server/`

**Important:** Update the server URL in `game/src/services/socket-service.ts` to point to your deployed server before building the client:

```typescript
const SERVER_URL = 'https://your-server-domain.com';
```

### Option B: Single server hosting

Serve both the game client and Socket.IO from one Node.js process. Add static file serving to `server/src/index.ts`:

```typescript
app.use(express.static(path.join(__dirname, '../../game/dist')));
```

Then build the client, deploy only the `server/` directory (with `game/dist/` accessible), and run `npm start`.

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT`   | `3000`  | Server listen port |

## Tech Stack

- **Game client:** Phaser 3.55, TypeScript 4.3, Webpack 5, phaser3-rex-plugins (UI)
- **Server:** Node.js, Express, Socket.IO 4
- **Assets:** Hosted on Azure Blob Storage (character select screen) and locally (game map, sprites)
