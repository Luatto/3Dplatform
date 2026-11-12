let currentPrayingUser = null;
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
    const room = socket.handshake.query.room || 'chung';
    socket.join(room);

    // Cấp một cái tên ngẫu nhiên lúc mới vào
    const defaultName = "Khách " + Math.floor(Math.random() * 1000);

    const minX = 5; const maxX = 9; 
    const minZ = 8; const maxZ = 12;
    const randX = Math.random() * (maxX - minX) + minX;
    const randZ = Math.random() * (maxZ - minZ) + minZ;
    const randomColor = Math.random() * 0xffffff;

    // Lưu thêm thuộc tính 'name'
    activeUsers[socket.id] = { 
        id: socket.id, x: randX, z: randZ, color: randomColor, room: room, name: defaultName 
    };

    const usersInRoom = {};
    for (let id in activeUsers) {
        if (activeUsers[id].room === room) {
            usersInRoom[id] = activeUsers[id];
        }
    }
    
    socket.emit('currentUsers', usersInRoom);
    socket.to(room).emit('userJoined', activeUsers[socket.id]);

    // Lắng nghe khi có người đổi tên
    socket.on('updateName', (newName) => {
        if (activeUsers[socket.id]) {
            activeUsers[socket.id].name = newName;
            // Phát tên mới cho tất cả mọi người trong phòng (bao gồm cả người vừa đổi)
            io.to(room).emit('nameUpdated', { id: socket.id, name: newName });
        }
    });

    // --- THÊM ĐOẠN NÀY ĐỂ XỬ LÝ MŨ ---
    socket.on('toggleHat', (isWearingHat) => {
        if (activeUsers[socket.id]) {
            activeUsers[socket.id].hasHat = isWearingHat;
            // Báo cho mọi người trong phòng biết người này vừa đội/tháo mũ
            io.to(room).emit('hatUpdated', { id: socket.id, hasHat: isWearingHat });
        }
    });
    // ---------------------------------

    // --- THÊM ĐOẠN CODE NÀY VÀO ---
    // Lắng nghe sự kiện cắm cờ từ 1 người dùng
    socket.on('plantFlag', (flagData) => {
        if (activeUsers[socket.id]) {
            // Gắn tên hiện tại của người dùng vào dữ liệu cờ
            flagData.userName = activeUsers[socket.id].name;
            // Phát cờ này cho tất cả những người khác trong cùng phòng
            socket.to(room).emit('flagPlanted', flagData);
        }
    });
    // -----------------------------
    
// --- THÊM ĐOẠN CODE NÀY VÀO ĐỂ XỬ LÝ DI CHUYỂN HÌNH NỘM ---
    socket.on('moveToLocation', (pos) => {
        if (activeUsers[socket.id]) {
            // Cập nhật vị trí mới vào dữ liệu người dùng trên server (để người vào sau cũng thấy)
            activeUsers[socket.id].x = pos.x;
            activeUsers[socket.id].y = pos.y; // Lưu thêm y
            activeUsers[socket.id].z = pos.z;
            
            // Phát tọa độ mới cho tất cả mọi người trong phòng (bao gồm cả người vừa click)
            io.to(room).emit('userMoved', {
                id: socket.id,
                x: pos.x,
                y: pos.y,
                z: pos.z
            });
        }
    });
    // --------------------------------------------------------
    
    // Lắng nghe sự kiện người dùng xin đọc kinh
    socket.on('pray', (data) => {
        // Kiểm tra xem có ai đang khấn không
        if (currentPrayingUser) {
            // Nếu có, từ chối và gửi tên người đó về để báo lỗi
            socket.emit('prayRejected', { prayingName: currentPrayingUser });
        } else {
            // Khóa lại bằng tên của người vừa gửi
            currentPrayingUser = data.userName;
            
            // Phản hồi "Đồng ý" cho người bấm nút
            socket.emit('prayAccepted', data);
            
            // Phát hình nộm cho tất cả những người khác trong phòng
            socket.to(room).emit('userPrayed', data); // (Lưu ý: Nếu code cũ dùng socket.broadcast.emit thì bạn đổi lại cho khớp nhé)
            
            // Mở khóa sau đúng 90 giây (khớp với thời gian hình nộm rơi xuống đất)
            setTimeout(() => {
                currentPrayingUser = null;
            }, 90000);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server đang chạy tại port ${PORT}`);
});
