import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { RoomManager } from './room-manager';
import { GameEngine } from './game-engine';
import { SocketEvent } from './types';

const PORT = process.env.PORT || 3000;

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});

const roomManager = new RoomManager();
const gameEngine = new GameEngine(io, roomManager);

// Serve the game client static files
import path from 'path';
app.use(express.static(path.join(__dirname, '../../game/dist')));

app.get('/api/status', (_req, res) => {
    res.json({ status: 'Project ELITE server running' });
});

io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);

    socket.on(SocketEvent.CREATE_ROOM, (data: { playerName: string }) => {
        const room = roomManager.createRoom(socket.id, data.playerName);
        socket.join(room.code);
        // Include players array so the host can populate their own player list
        socket.emit(SocketEvent.ROOM_CREATED, {
            roomCode: room.code,
            playerId: socket.id,
            players: room.state.players,
        });
        console.log(`Room ${room.code} created by ${data.playerName}`);
    });

    socket.on(SocketEvent.JOIN_ROOM, (data: { roomCode: string; playerName: string }) => {
        const room = roomManager.joinRoom(data.roomCode, socket.id, data.playerName);
        if (!room) {
            socket.emit(SocketEvent.ERROR, { message: 'Could not join room. Room may not exist or is full.' });
            return;
        }
        socket.join(room.code);
        socket.emit(SocketEvent.ROOM_JOINED, {
            roomCode: room.code,
            playerId: socket.id,
            players: room.state.players,
        });
        // Notify ALL players (including host) about the updated player list
        io.to(room.code).emit(SocketEvent.PLAYER_JOINED, {
            players: room.state.players,
        });
        console.log(`${data.playerName} joined room ${room.code}`);
    });

    socket.on(SocketEvent.SELECT_CHARACTER, (data: { characterKey: string }) => {
        const room = roomManager.getRoomByPlayerId(socket.id);
        if (!room) return;

        const success = roomManager.selectCharacter(room.code, socket.id, data.characterKey as any);
        if (success) {
            io.to(room.code).emit(SocketEvent.CHARACTER_SELECTED, {
                players: room.state.players,
            });
        }
    });

    socket.on(SocketEvent.START_GAME, () => {
        const room = roomManager.getRoomByPlayerId(socket.id);
        if (!room || room.hostId !== socket.id) return;

        gameEngine.startGame(room.code);
    });

    socket.on(SocketEvent.PLAYER_READY, () => {
        gameEngine.handlePlayerReady(socket.id);
    });

    socket.on(SocketEvent.PLAYER_MOVE, (data: { targetGrid: number }) => {
        gameEngine.handlePlayerMove(socket.id, data.targetGrid);
    });

    socket.on(SocketEvent.PLAYER_ATTACK, (data: { targetEnemyId: string }) => {
        gameEngine.handlePlayerAttack(socket.id, data.targetEnemyId);
    });

    socket.on(SocketEvent.DISCONNECT, () => {
        console.log(`Player disconnected: ${socket.id}`);
        const room = roomManager.removePlayer(socket.id);
        if (room) {
            io.to(room.code).emit(SocketEvent.STATE_UPDATE, {
                gameState: room.state,
            });
        }
    });
});

server.listen(PORT, () => {
    console.log(`Project ELITE server running on port ${PORT}`);
});
