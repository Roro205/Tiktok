const http = require('http');
const { Server } = require("socket.io");

const httpServer = http.createServer((req, res) => {
  // 用于健康检查
  res.write('Gomoku Server is Healthy');
  res.end();
});

const io = new Server(httpServer, {
  cors: {
    origin: "*", // 允许任何网站（包括你的 Netlify 前端）连接
    methods: ["GET", "POST"]
  }
});

// 内存中临时存储房间数据
// 结构: { "房间号": { p1: "socketid1", p2: "socketid2" } }
const rooms = {};

io.on("connection", (socket) => {
  console.log("新玩家连接:", socket.id);

  // === 事件1：创建房间 ===
  socket.on("create_room", () => {
    // 生成一个随机 6 位房间号
    const roomId = Math.random().toString(36).substring(2, 8);
    
    rooms[roomId] = {
      p1: socket.id, // 房主（执黑）
      p2: null       // 等待加入
    };
    
    socket.join(roomId); // 加入 socket 分组
    socket.emit("room_created", roomId); // 告诉前端房间号
    console.log(`房间 ${roomId} 创建`);
  });

  // === 事件2：加入房间 ===
  socket.on("join_room", (roomId) => {
    const room = rooms[roomId];
    
    // 检查房间是否存在
    if (!room) {
      socket.emit("err", "房间不存在");
      return;
    }
    // 检查房间是否已满
    if (room.p2) {
      socket.emit("err", "房间已满");
      return;
    }

    // 加入成功
    room.p2 = socket.id; // 加入者（执白）
    socket.join(roomId);

    // 广播游戏开始
    io.to(room.p1).emit("game_start", { role: "black" }); // 告诉房主你是黑棋
    io.to(room.p2).emit("game_start", { role: "white" }); // 告诉加入者你是白棋
    console.log(`房间 ${roomId} 对战开始`);
  });

  // === 事件3：落子 ===
  socket.on("move", (data) => {
    // data 包含: { roomId, x, y, color }
    // socket.to(房间号) 会发给房间里的"其他人"（即对手），不会发给自己
    socket.to(data.roomId).emit("remote_move", data);
  });

  // 断开连接
  socket.on("disconnect", () => {
    console.log("玩家断开", socket.id);
    // 实际项目中这里应该清理 rooms 数据，通知对手
  });
});

const PORT = 3000;
httpServer.listen(PORT, () => {
  console.log(`后端服务运行在端口 ${PORT}`);
});