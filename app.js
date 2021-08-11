const express = require('express')
const socket = require('socket.io')
const cookieParser = require('cookie-parser')
const  mysql = require('mysql')
// const passport = require('passport');
// passport.use(new LocalStrategy(
//   function(username, password, done) {
//     User.findOne({ username: username }, function (err, user) {
//       if (err) { return done(err); }
//       if (!user) { return done(null, false); }
//       if (!user.verifyPassword(password)) { return done(null, false); }
//       return done(null, user);
//     });
//   }
// ));

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

var db = mysql.createConnection({
  host : 'localhost',
  user : 'root',
  password : 'root',
  database : 'socket'
});



io.on('connection', function (socket) {
  socket.on('join', function (data) {
    console.log("channel sent : ", data.channel)
    console.log("liste room",io.sockets.adapter.rooms)
    console.log("room h20",io.sockets.adapter.rooms['h20'])

    if(io.sockets.adapter.rooms.get(data.channel)){
      db.query("Insert into `pseudochannel` (`channel`,`pseudo`) VALUES (?,?)",[data.channel,socket.nickname],function(err,rows,fields){
      socket.join(data.channel)
      socket.activeChan = data.channel

      io.in(data.channel).emit("join", 
      {
        pseudo : socket.nickname
      })  
      // {
        //   message: "newUser",
        //   pseudo: socket.nickname,
        //   time: "date"
        // }
      })
    }
  })
  socket.on('listMessages',function(data){
      db.query("Select pseudo,message from messageChan where channel = ? order by date",[data.channel], function(err, rows,fields){
          if(err) throw err;
          
          let list;
          if(rows.length != 0){
            list = Object.values(rows).map(x=>x)
            
          }else{
             list = [{pseudo: "BOT",message:'Aucun message dans ce channel'}]
          }
          socket.emit("listMessages",{
            list : list
          })
      })
  })

  
    

  socket.on('messageChan', function ({ message,channel }) {
    //on vérifie que la channel existe
    
    let date = new Date()
    db.query("Insert into `messageChan` (`channel`,`date`,`pseudo`,`message`) VALUES(?,?,?,?)",[channel,date,socket.nickname,message],function(err,rows,fields){
      if (err) throw err;   
      io.in(channel).emit("messageChan",
      {
        message: message,
        pseudo: socket.nickname,
        time: date
      }
    )
    })
    
  })

  socket.on("login_register", function (data) {
    const pseudo = data.pseudo;
    socket.nickname = pseudo;
    db.query("SELECT * FROM pseudo WHERE name=?", [pseudo], function(err, rows, fields){
      if(rows.length == 0){
        db.query("INSERT INTO pseudo(`name`) VALUES(?)", [pseudo], function(err, result){
            if(err) throw err;
            socket.nickname = pseudo
            socket.emit("logged_in", {validate: true});
            
            socket.id = pseudo
            console.log(socket.id)
            console.log("liste des sockets",io.sockets.adapter.rooms)
            
          }); 
    }
    });
})

socket.on('create',function(data){
  console.log("create room",data)
  console.log(io.sockets.adapter.rooms)
  if(!io.sockets.adapter.rooms[data]){// sil n'existe pas de channel
      db.query("Insert into `channel` (`name`) VALUES (?) ",[data.channel], function(err, rows, fields){
          db.query("Insert into `pseudoChannel` (`channel`,`pseudo`) VALUES (?,?)",[data.channel,socket.nickname],function(err,rows,fields){
              if(err) throw err;
              socket.join(data.channel)
              socket.activeChan = data.channel
              socket.emit("create",{validate : true})
          })
      })
  }else{
      socket.emit("create",{er : "Votre channel existe déjà"})
  }
})
socket.on('listChannels',function(){   
  //réaliser un insert 
    db.query("Select distinct name from  channel ",function(err,rows,fields){
      if(err) throw err;
      liste =  rows.map(x => x.name)
      socket.emit("listChannels",{liste :liste})
    })

    })

  socket.on('leave',function(data){
    socket.leave('some room');
    console.log("in leave",data.channel)
    io.to(data.channel).emit("leave",{ pseudo : socket.nickname})
  })
  socket.on('delete',function(data){
    db.query("DELETE FROM `channel` WHERE `name` = ? ",[data.channel], function(err, rows, fields){
      db.query("DELETE FROM `pseudoChannel` WHERE `channel` = ?",[data.channel],function(err, rows, fields){
        
        socket.emit("delete", {validate: true})
      })
      
    })
  //   io.of('/').in(data.channel).clients(function(error, clients) {
  //     if (clients.length > 0) {
  //         console.log(clients);
  //         clients.forEach(function (socket_id) {
  //             io.sockets.sockets[socket_id].leave(data.channel);
  //         });
  //     }
  // });
        
    })

    socket.on("logged_out",function(data){
      console.log("disconnect",data,socket.nickname)
      db.query("DELETE FROM `pseudo` WHERE `name` = ? ",[socket.nickname], function(err, rows, fields){
        if (err) throw err;
        db.query("DELETE FROM `pseudoChannel` WHERE `pseudo` = ? ",[socket.nickname], function(err, rows, fields){
          if (err) throw err;
          console.log("client déconnecté")
          socket.disconnect()
          
        })
      })
    })
})