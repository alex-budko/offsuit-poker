import { Server } from "Socket.IO";

import deck from "../../poker/card-deck/deck";
import shuffle from "../../poker/logic/shuffle";

let d = shuffle(deck);
let players = [null, null];
let gameOngoing = false;

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
      socket.on("tableTurn", (seatIndex, stage, turnType) => {
        // 1st move
        if (turnType === "start") {
          socket.to("room1").emit("playerTurn", seatIndex, stage);
        //nth move
        } else {
          if (turnType === "bet") {
            players[seatIndex].chips -= 20;
            socket.to("room1").emit("updatePlayers", players);
          } 
          const newSeatAndStage = calculateSeatAndStage(seatIndex, stage);
          console.log(newSeatAndStage)
          socket.to("room1").emit("playerTurn", newSeatAndStage[0], newSeatAndStage[1]);
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
