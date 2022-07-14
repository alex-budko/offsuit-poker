import { Server } from "Socket.IO";

const SocketHandler = (req, res) => {
  if (!res.socket.server.io) {
    console.log("First use, starting socket.io");

    const io = new Server(res.socket.server);

    io.on("connection", (socket) => {
      socket.broadcast.emit("user-connect");
      socket.on("hello", (msg) => {
        console.log("User-Typed")
        socket.broadcast.emit("user-typed", msg);
      });
    });

    res.socket.server.io = io;

  } else {
    console.log("socket.io already running");
  }
  res.end();
};

export default SocketHandler;
