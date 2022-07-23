import { Server } from "Socket.IO";

import deck from "../../poker/card-deck/deck";
import shuffle from "../../poker/logic/shuffle";

let d = shuffle(deck)
let players = [null, null]
let gameOngoing = false

const SocketHandler = (req, res) => {
  if (!res.socket.server.io) {

    const io = new Server(res.socket.server);
    
    io.on("connection", (socket) => {
      socket.join('room1')

      socket.on("getPlayers", ()=> {
        if (players !== [null, null]) { 
          socket.to("room1").emit("updatePlayers", players)
        }
      })
      
      socket.on("playerJoining", (seatIndex, name) => {
        players[seatIndex] = {
          name: name, 
          chips: 1000,
          seatIndex: seatIndex,
          cards: [d.pop(), d.pop()]
        }
        socket.to("room1").emit("updatePlayers", players)
      })

      socket.on("startGame", ()=> {
        gameOngoing = true
        socket.to("room1").emit("startRound")
      })

      //stages => 0: pre-flop, 1:flop, 2: turn, 3: river, 4: show
      socket.on("tableTurn", (seatIndex, stage) => {
        socket.to("room1").emit("playerTurn", seatIndex, stage)
      })
    
    });

    res.socket.server.io = io;

  } else {
    console.log("socket.io already running");
  }
  res.end();
};

export default SocketHandler;
