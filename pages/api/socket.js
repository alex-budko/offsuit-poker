import { Server } from "Socket.IO";

import deck from "../../poker/card-deck/deck";
import shuffle from "../../poker/logic/shuffle";

let d = shuffle(deck);
let players = [null, null];
let tableCards = []
let gameOngoing = false;


let nextStage = 1

const calculateSeatAndStage = (seat, stage) => {
  if (seat === 0) {
    seat = 1;
  } else {
    seat = 0;
    stage += 1;
  }
  return [seat, stage];
};

const SocketHandler = (req, res) => {
  if (!res.socket.server.io) {
    const io = new Server(res.socket.server);

    io.on("connection", (socket) => {
      socket.join("room1");

      socket.on("getPlayers", () => {
        if (players !== [null, null]) {
          socket.to("room1").emit("updatePlayers", players);
          socket.to("room1").emit("addTableCards", tableCards)
        }
      });

      socket.on("playerJoining", (seatIndex, name) => {
        players[seatIndex] = {
          name: name,
          id: socket.id,
          chips: 1000,
          seatIndex: seatIndex,
          cards: [d.pop(), d.pop()],
        };
        socket.to("room1").emit("updatePlayers", players);
      });

      socket.on("startGame", () => {
        gameOngoing = true;
        socket.to("room1").emit("startRound");
      });

      //stages => 0: pre-flop, 1:flop, 2: turn, 3: river, 4: show
      socket.on("tableTurn", (seatIndex, stage, turnType, betSize=0) => {
        
        // 1st move
        if (turnType === "start") {
          socket.to("room1").emit("playerTurn", seatIndex, stage);
        //nth move
        } else {
          if (turnType === "bet") {
            players[seatIndex].chips -= betSize;
            socket.to("room1").emit("updatePlayers", players);
          } 
          const newSeatAndStage = calculateSeatAndStage(seatIndex, stage);
          if (newSeatAndStage[1] === nextStage) {
            nextStage++
            if (newSeatAndStage[1] === 1) {
              tableCards = tableCards.concat([d.pop(), d.pop(), d.pop()])
            } else {
              tableCards = tableCards.concat([d.pop()])
            }
            socket.to("room1").emit("addTableCards", tableCards);
          }
          socket.to("room1").emit("playerTurn", newSeatAndStage[0], newSeatAndStage[1], betSize);
        }
      });
    });

    res.socket.server.io = io;
  } else {
    console.log("socket.io already running");
  }
  res.end();
};

export default SocketHandler;
