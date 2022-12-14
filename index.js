const express = require("express");

const cors = require("cors");

const app = express();
const server = require("http").Server(app);

app.use(cors());

// const io = (module.exports.io = require("socket.io")(server));

const io = require("socket.io")(server, {
  cors: {
    origin: "https://buzzing.netlify.app",
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT || 8800;

let activeUsers = [];

io.on("connection", (socket) => {
  console.log("client connected");
  // add new User
  socket.on("new-user-add", (newUserId) => {
    // if user is not added previously
    if (!activeUsers.some((user) => user.userId === newUserId)) {
      activeUsers.push({ userId: newUserId, socketId: socket.id });
      console.log("New User Connected", activeUsers);
    }
    // send all active users to new user
    io.emit("get-users", activeUsers);
  });

  // send message to a specific user
  socket.on("send-message", (data) => {
    const { receiverId } = data;
    const user = activeUsers.find((user) => user.userId === receiverId);
    console.log("Sending from socket to :", receiverId);
    console.log("Data: ", data);
    if (user) {
      io.to(user.socketId).emit("receive-message", data);
      console.log("user found", user);
    }
  });

  socket.on("disconnect", () => {
    // remove user from active users
    activeUsers = activeUsers.filter((user) => user.socketId !== socket.id);
    console.log("User Disconnected", activeUsers);
    // send all active users to all users
    io.emit("get-users", activeUsers);
  });
});

server.listen(PORT, () => {
  console.log(`listening on ${PORT}`);
});
