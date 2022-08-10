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
          active_player: 0, // active player index
          pot_size: 0,
          max_bet: 0,
          stage: 0,
          table_cards: [],
        };
      });

      socket.on("playerJoining", (room_link, seat_index, name) => {
        // TODO: add seat_index validation
        tables[room_link]["players"][seat_index] = {
          name: name,
          active: true,
          bet: 0,
          played_in_round: false,
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
        }
      });

      socket.compress("getTableCards", (room_link) => {
        socket
          .to(room_link)
          .emit("updateTableCards", tables[room_link]["table_cards"]);
      });

      socket.on("startGame", (room_link) => {
        d = shuffle(deck);
        const table = tables[room_link];
        socket.to(room_link).emit("updatePlayers", table["players"]);

        socket.to(room_link).emit("startRound");

        const players = table["players"];

        // get idx of first non-null player
        for (let player = 0; player < players.length; player++) {
          if (players[player]) {
            table["active_player"] = player;
            break;
          }
        }

        //player turn of first active_player
        socket.to(room_link).emit("playerTurn", table["active_player"]);
      });

      socket.on("evalTurn", (room_link, turn_type, bet_size = 0) => {
        const table = tables[room_link];
        const players = table["players"];
        const active_player = table["active_player"];

        if (turn_type === "fold") {
          players[active_player]["active"] = false;
        } else { // bet or check
          players[active_player]["played_in_round"] = true;
          players[active_player]["bet"] += bet_size;
          players[active_player]["chips"] -= bet_size;
          table["pot_size"] += bet_size;
          table["max_bet"] = Math.max(table["max_bet"], players[active_player]["bet"]);
        }

        // get idx of next player
        next_player = active_player;
        while(true) {
          next_player = (next_player + 1) % players.length;
          if (players[next_player]["active"]) {
            break;
          }
        }

        if (players[next_player]["played_in_round"] && players[next_player]["bet"] === table["max_bet"]) { // end of stage
          const winners = evaluateResult();
          if (winners.length > 0) { // round ended
            // update frontend
            // 
          }
          
        } else {

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
