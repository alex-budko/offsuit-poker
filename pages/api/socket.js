import { Server } from "Socket.IO";

import deck from "../../poker/card-deck/deck";
import shuffle from "../../poker/logic/shuffle";

let d = shuffle(deck);
let players = [null, null];
let tableCards = [];
let potSize = 0;

//stage turn count
let turnCount = 0;

let room_link = null;

const calculateSeatAndStage = (seat, stage, nextStage) => {

  if (nextStage && turnCount >= 2) {
    stage += 1;
    turnCount = 0;
  }

  if (seat === 0) {
    seat = 1;
  } else {
    seat = 0;
  }

  return [seat, stage];
};

const SocketHandler = (req, res) => {
  if (!res.socket.server.io) {
    const io = new Server(res.socket.server);

    io.on("connection", (socket) => {
      socket.on("joinRoom", (roomLink) => {
        room_link = roomLink;
        socket.join(room_link);
      });

      socket.on("getPlayers", () => {
        if (players !== [null, null]) {
          socket.to(room_link).emit("updatePlayers", players);
          socket.to(room_link).emit("updateTableCards", tableCards);
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
        socket.to(room_link).emit("updatePlayers", players);
      });

      socket.on("startGame", () => {
        socket.to(room_link).emit("startRound");
      });

      socket.on("evaluateResult", (playerFolded = -1) => {
          if (playerFolded >= 0) {
            if (playerFolded == 0) {
              players[1].chips += potSize;
            } else {
              players[0].chips += potSize;
            }
          } else {
            console.log("evalCards");
          }
        
          socket.to(room_link).emit("updatePlayers", players)
          socket.to(room_link).emit("restartGame", players)
      })

      //stages => 0: pre-flop, 1:flop, 2: turn, 3: river, 4: show
      socket.on(
        "tableTurn",
        (seatIndex, stage, turnType, betSize = 0, nextStage = false) => {

          if (turnType === "fold") {
            socket.emit("evaluateResult", seatIndex)
          }

          // 1st move
          if (turnType === "start") {
            socket.to(room_link).emit("playerTurn", seatIndex, stage);
            //nth move
          } else {
            //reset betSize on nextStage
            if (nextStage) {
              betSize = 0;
            }

            turnCount += 1;

            if (turnType === "bet") {
              players[seatIndex].chips -= betSize;
              potSize += betSize;
              socket.to(room_link).emit("updatePotSize", potSize);
              socket.to(room_link).emit("updatePlayers", players);
            }

            const newSeatAndStage = calculateSeatAndStage(
              seatIndex,
              stage,
              nextStage
            );

            if (newSeatAndStage[1] > stage) {
              if (newSeatAndStage[1] === 1) {
                tableCards = tableCards.concat([d.pop(), d.pop(), d.pop()]);
              } else {
                tableCards = tableCards.concat([d.pop()]);
              }
              socket.to(room_link).emit("updateTableCards", tableCards);
            }
            socket
              .to(room_link)
              .emit(
                "playerTurn",
                newSeatAndStage[0],
                newSeatAndStage[1],
                betSize
              );
          }
        }
      );
    });

    res.socket.server.io = io;
  } else {
    console.log("socket.io already running");
  }
  res.end();
};

export default SocketHandler;
