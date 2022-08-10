import { Server } from "Socket.IO";

import * as PokerEvaluator from 'poker-evaluator';

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
          active_player: 0,
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
          played_in_round: false,
          bet: 0,
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

        //first active_player
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
          evaluateResult()
          return
        }

        players[active_player]['bet'] += bet_size

      });
    });

    const evaluateResult = ()=> {
      const table = tables[room_link];
      const players = table["players"];
    
      let active_players = []
      let winners = []
    
      for (let player = 0; player < players.length; player++) {
        if (players[player]) {
          active_players.append(players[player])
        }
      }
      // one player left
      if (active_players.length === 1) {
        // restartGame(winner)
      } else if (table['stage'] === 3) {

        let winning_combos = []
        let table_cards = table['table_cards']

        for (let player = 0; player < active_players.length; player++) {
          const player_cards = active_players[player]['cards']
          winning_combos[player] = PokerEvaluator.evalHand(table_cards.concat(player_cards))
        }

        winners = decideWinners(winning_combos)
      } else {
      
      }
      return winners
    } 

    const decideWinners = (winning_combos) => {
      let winners = []

    }

    res.socket.server.io = io;
  } else {
    console.log("socket.io already running");
  }
  res.end();
};

export default SocketHandler;
