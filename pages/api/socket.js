import { Server } from "Socket.IO";

import deck from "../../poker/card-deck/deck";
import shuffle from "../../poker/logic/shuffle";

let d = shuffle(deck);

let tables = {};

const SocketHandler = (req, res) => {
  if (!res.socket.server.io) {
    const io = new Server(res.socket.server);

    io.on("connection", (socket) => {
      socket.on("joinRoom", (room_link) => {
        socket.join(room_link);

        console.log(room_link);

        tables[room_link] = {
          players: {},
          stage: {},
          pot_size: 0,
          bet_size: 0,
          table_cards: [],
        }
          ? !tables[room_link]
          : tables[room_link];
      });

      socket.on("playerJoining", (room_link, seat_index, name) => {
        tables[room_link]["players"][seatIndex] = {
          name: name,
          id: socket.id,
          chips: 1000,
          seatIndex: seat_index,
          cards: [d.pop(), d.pop()],
        };
        socket
          .to(room_link)
          .emit("updatePlayers", tables[room_link]["players"]);
      });

      socket.on("getPlayers", (room_link) => {
        if (typeof tables[room_link]["players"] !== "undefined") {
          socket
            .to(room_link)
            .emit("updatePlayers", tables[room_link]["players"]);
          socket
            .to(room_link)
            .emit("updateTableCards", tables[room_link]["table_cards"]);
        }
      });

      socket.on("startGame", (room_link) => {
        socket.to(room_link).emit("startRound");
      });

      // socket.on(
      //   "tableTurn",
      //   (room_link, seat_index, stage, turn_type, bet_size = 0, nextStage = false) => {
      //     // if check, betSize = 0
      //     betSize = turn_type === "check" ? 0 : betSize;
      //     // 1st move
      //     if (turn_type === "start") {
      //       socket.to(room_link).emit("playerTurn", seat_index, stage);
      //       //nth move
      //     } else if (turn_type === "fold") {
      //       evaluateResult(room_link, seatIndex);
      //       socket.to(room_link).emit("updateTableCards", tables[room_link]['tableCards']);
      //     } else {
      //       //reset betSize on nextStage
      //       if (nextStage) {
      //         turn_type = 0;
      //       }

      //       tables[room_link]['turnCount'] += 1;

      //       if (turn_type === "bet") {
      //         tables[room_link]['players'][seatIndex]['chips'] -= betSize;

      //         tables[room_link]['pot_size'] += betSize;

      //         socket.to(room_link).emit("updatePotSize", potSize);
      //         socket.to(room_link).emit("updatePlayers", tables[room_link]['players']);
      //       }

      //       const newSeatAndStage = calculateSeatAndStage(
      //         seatIndex,
      //         stage,
      //         nextStage
      //       );

      //       if (newSeatAndStage[1] > stage) {
      //         if (newSeatAndStage[1] === 1) {
      //           tableCards = tableCards.concat([d.pop(), d.pop(), d.pop()]);
      //         } else {
      //           tableCards = tableCards.concat([d.pop()]);
      //         }
      //         socket.to(room_link).emit("updateTableCards", tableCards);
      //       }
      //       socket
      //         .to(room_link)
      //         .emit(
      //           "playerTurn",
      //           newSeatAndStage[0],
      //           newSeatAndStage[1],
      //           betSize
      //         );
      //     }
      //   }
      // );

      const evaluateResult = () => {
        socket
          .to(room_link)
          .emit("updatePlayers", tables[room_link]["players"]);
        socket.to(room_link).emit("restartGame", tables[room_link]["players"]);
      };

      // const calculateSeatAndStage = (seat, stage, nextStage) => {
      //   if (nextStage && turnCount >= 2) {
      //     stage += 1;
      //     turnCount = 0;
      //   }

      //   if (seat === 0) {
      //     seat = 1;
      //   } else {
      //     seat = 0;
      //   }

      //   return [seat, stage];
      // };

      // const restartTable = (players) => {
      //   d = shuffle(deck);
      //   for (var seatIdx = 0; seatIdx < players.length; seatIdx++) {
      //     players[seatIdx].cards = [d.pop(), d.pop()];
      //   }
      //   players = players;
      //   potSize = 0;
      //   turnCount = 0;
      //   tableCards = [];
      // };
    });

    res.socket.server.io = io;
  } else {
    console.log("socket.io already running");
  }
  res.end();
};

export default SocketHandler;
