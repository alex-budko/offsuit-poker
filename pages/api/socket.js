import { Server } from "Socket.IO";

import deck from "../../poker/card-deck/deck";
import shuffle from "../../poker/logic/shuffle";

let d = shuffle(deck);

const tables = {};

const SocketHandler = (req, res) => {
  if (!res.socket.server.io) {
    const io = new Server(res.socket.server);

    io.on("connection", (socket) => {
      socket.on("joinRoom", (room_link) => {
        socket.join(room_link);
        tables[room_link] = {
          players: [],
          pot_size: 0,
          max_bet: 0,
          table_cards: [],
          stage: 0,
          active_players: [], // seat idx + bet + bool current + bool passed
        };
      });

      socket.on("playerJoining", (room_link, seat_index, name) => {
        // TODO: add seat_index validation
        tables[room_link]["players"][seat_index] = {
          name: name,
          id: socket.id,
          chips: 1000,
          cards: [],
        };
        socket
          .to(room_link)
          .emit("updatePlayers", tables[room_link]["players"]);
      });

      socket.on("getPlayers", (room_link) => {
        if (tables[room_link]["players"].length > 0) {
          socket
            .to(room_link)
            .emit("updatePlayers", tables[room_link]["players"]);
          // socket
          //   .to(room_link)
          //   .emit("updateTableCards", tables[room_link]["table_cards"]);
        }
      });

      socket.on("startGame", (room_link) => {
        d = shuffle(deck);
        const players = tables[room_link]["players"];

        for (let player = 0; player < players.length; player++) {
          if (players[player]) {
            players[player]["cards"] = [d.pop(), d.pop()];
            tables[room_link]["active_players"].push({
              seat_index: player,
              bet_size: 0,
              current: false,
            });
          }
        }

        console.log(tables[room_link]["active_players"]);

        tables[room_link]["active_players"][0]["current"] = true;

        socket
          .to(room_link)
          .emit("updatePlayers", tables[room_link]["players"]);

        socket.to(room_link).emit("startRound");

        //player turn of first active_player
        socket
          .to(room_link)
          .emit(
            "playerTurn",
            tables[room_link]["active_players"][0]["seat_index"]
          );
      });

      socket.on("evalTurn", (room_link, turn_type, bet_size=0) => {
        const players = tables[room_link]["players"];
        const active_players = tables[room_link]["active_players"];
        let currentPlayerIndex = 0;
        for (let active_player = 0; active_player < active_players.length; player++) {
          if (active_players[active_player]["current"]) {
            currentPlayerIndex = active_players[active_player]["seat_index"];
            break;
          }
        }

        // if the turn came back to the player
        if (active_players[currentPlayerIndex]['bet_size'] === bet_size && active_players[currentPlayerIndex]['passed']) {
          // ...
          //socket.emit have next stage or evaluate game result
        }

        active_players[currentPlayerIndex]['passed'] = true


        if (turn_type === "bet") {
          tables[room_link]["players"][seatIndex]["chips"] -= betSize;

          tables[room_link]["pot_size"] += betSize;

          socket.to(room_link).emit("updatePotSize", potSize);
          socket
            .to(room_link)
            .emit("updatePlayers", tables[room_link]["players"]);
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
          .emit("playerTurn", newSeatAndStage[0], newSeatAndStage[1], betSize);
      });

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
    });

    res.socket.server.io = io;
  } else {
    console.log("socket.io already running");
  }
  res.end();
};

export default SocketHandler;
