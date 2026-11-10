const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const activeUsers = {};

io.on('connection', (socket) => {
    const randX = (Math.random() - 0.5) * 15 + 3.7;
    const randZ = (Math.random() - 0.5) * 15;
    const randomColor = Math.random() * 0xffffff;

    activeUsers[socket.id] = { id: socket.id, x: randX, z: randZ, color: randomColor };

    socket.emit('currentUsers', activeUsers);
    socket.broadcast.emit('userJoined', activeUsers[socket.id]);

    socket.on('disconnect', () => {
        delete activeUsers[socket.id];
        io.emit('userLeft', socket.id);
    });
});

// --- ĐOẠN NÀY LÀ QUAN TRỌNG NHẤT ĐỂ CHẠY TRÊN RENDER ---
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server đang chạy tại port ${PORT}`);
});
