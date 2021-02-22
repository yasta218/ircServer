const express = require('express')
const socket = require('socket.io')
const cookieParser = require('cookie-parser')
const session = require('express-session');

var app = express();
var server = app.listen(82, function () {
  console.log("listening to port 82.");
});
options = {
  cors: true,
}
const io = socket(server, options)

app.use(cookieParser());
app.use(express.static('./'));


io.on('connection', function (socket) {

  socket.on('create', function (data) {
    console.log("rrrrrrrrr.F.F.F.F.F.")
    socket.join(data.channel)
    console.log("insertion channel")
    socket.activeChan = data.channel
    console.log(socket.rooms)
    socket.emit("create", { channel: data.channel })
  })

  socket.on('join', function (data) {
    console.log("channel sent : ", data.channel)
    console.log("rooms : ", io.sockets.adapter.rooms)
    socket.join("1er")
    io.to("1er").emit("newUser",
      {
        message: "newUser",
        pseudo: socket.nickname,
        time: "date"
      }
    )
    socket.activeChan = data.channel
    console.log("active chan : ", socket.activeChan)
    socket.emit("joinChannel", { channel: data.channel })
  })

  socket.on('messageChan', function ({ message }) {
    //on vérifie que la channel existe
    console.log("j'y suis !! ")
    console.log("rooms", socket.rooms.has("1er"))
    let date = new Date()
    console.log(message)
    console.log(socket.activeChan)
    console.log(socket.nickname)
    console.log(date)
    io.to("1er").emit("newUser",
      {
        message: message,
        pseudo: socket.nickname,
        time: date
      }
    )
    console.log(socket.rooms)
    console.log(message)
    console.log("emission socket terminé !!!")
  })

  socket.on("login_register", function (data) {
    const pseudo = data.pseudo;
    socket.nickname = pseudo
    socket.emit("logged_in", { validate: true });
    console.log("after save")
  });
})







