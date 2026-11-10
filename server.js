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
// 1. KHAI BÁO VÙNG GIỚI HẠN (Tọa độ X và Z)
    // Bạn hãy thay đổi các con số này để căn chỉnh vùng mong muốn
    const minX = 1.0;  // Giới hạn cạnh trái
    const maxX = 5.0;  // Giới hạn cạnh phải
    const minZ = -2.0; // Giới hạn cạnh trước
    const maxZ = 2.0;  // Giới hạn cạnh sau

    // 2. TẠO VỊ TRÍ NGẪU NHIÊN TRONG VÙNG ĐÃ CHỌN
    const randX = Math.random() * (maxX - minX) + minX;
    const randZ = Math.random() * (maxZ - minZ) + minZ;
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
