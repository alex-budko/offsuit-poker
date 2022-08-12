import { Server } from "socket.io";

import * as PokerEvaluator from 'poker-evaluator';

import deck from "../../poker/card-deck/deck";
import shuffle from "../../poker/logic/shuffle";
const tables = {};

const SocketHandler = (req, res) => {
  if (!res.socket.server.io) {
    const io = new Server(res.socket.server);

    console.log('hey')
     
    io.on("connection", (socket) => {
      socket.on("joinRoom", (room_link) => {
        socket.join(room_link);
        tables[room_link] = {
          deck: shuffle(deck),
          players: [],
          dealer: 0,
          active_player: 0, // active player index
          pot_size: 0,
          max_bet: 0,
          stage: 0,
          table_cards: [],
        };
      });

      socket.on("playerJoining", (room_link, seat_index, name) => {
        // TODO: add seat_index validation
        console.log('Player ', name, ' joined with seat_index', seat_index)
        tables[room_link]["players"][seat_index] = {
          name: name,
          active: true,
          played_in_round: false,
          bet: 0,
          id: socket.id,
          chips: 1000,
          cards: [tables[room_link]['deck'].pop(), tables[room_link]['deck'].pop()],
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
        let d = shuffle(deck)
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
        console.log("Bet Size", bet_size);
        const table = tables[room_link];
        const players = table["players"];
        const active_player = table["active_player"];
        console.log("Player bet: ", bet_size);
        if (turn_type === "fold") {
          players[active_player]["active"] = false;
        } else { // bet or check
          players[active_player]["played_in_round"] = true;
          players[active_player]["chips"] += players[active_player]["bet"];
          players[active_player]["bet"] = bet_size;
          players[active_player]["chips"] -= bet_size;
          table["pot_size"] += bet_size;
          table["max_bet"] = Math.max(table["max_bet"], players[active_player]["bet"]);
          console.log("Now max bet is: ", table["max_bet"]);
        }

        // get idx of next player
        let next_player = active_player;
        while(true) {
          next_player = (next_player + 1) % players.length;
          if (players[next_player]["active"]) {
            break;
          }
        }
        console.log("Active player: ", active_player);
        table["active_player"] = next_player
        console.log("Next player: ", next_player);
        console.log("Player player in round: ", players[next_player]["played_in_round"]);

        if (players[next_player]["played_in_round"] && players[next_player]["bet"] === table["max_bet"]) { // end of this stage, start new stage
          const winners = evaluateResult(room_link);
          let d = table["deck"];
          let table_cards = table["table_cards"];
          if (winners.length === 0) { // next stage
            if (table["stage"] === 0) {
              table_cards.push(d.pop(), d.pop(), d.pop())
            } else {
              table_cards.push(d.pop())
            }
            table["stage"] += 1
            table["max_bet"] = 0
            for (let player = 0; player < players.length; player++) {
              if (players[player] && players[player]["active"]) {
                players[player]["played_in_round"] = false
                players[player]["bet"] = 0
              }
            }
            // TODO: calculate who needs to go first in next stage
            console.log("max bet", table['max_bet'])
            socket.to(room_link).emit('updateTableCards', table_cards)
            socket.to(room_link).emit('updatePlayers', players)
            socket.to(room_link).emit("updatePotSize", table["pot_size"])
            socket.to(room_link).emit('playerTurn', table['active_player'], table['max_bet'])
          } else { // someone won
            let chipsWon = table["pot_size"] / winners.length;
            for (let winner_idx in winners) {
              players[winner_idx]["chips"] += chipsWon
            }
            // display winner(s) in frontend
            // socket.to(room_link).emit("updateWinners", winners, chipsWon)
            // start new round
            table["deck"] =  shuffle(deck)
            table["stage"] = 0
            table["max_bet"] = 0
            table["pot_size"] = 0
            // update table cards
            for (player in players) {
              if (player) {
                player["cards"] = [table["deck"].pop(), table["deck"].pop()]
              }
            }
            // calculate next dealer
            const next_dealer = (table["dealer"] + 1) % players.length;
            while(!players[next_dealer]) {
              next_dealer = (next_dealer + 1) % players.length;
            }
            socket.to(room_link).emit('updateTableCards', table_cards)
            socket.to(room_link).emit('updatePlayers', players)
            socket.to(room_link).emit("updatePotSize", table["pot_size"])
            socket.to(room_link).emit("updateTableCards", [])
            // calculate next dealer
            socket.to(room_link).emit('playerTurn', next_dealer, table['max_bet'])
          }
          
        } else { // keep playing this stage, next player to go
          console.log("max bet", table['max_bet'])
          socket.to(room_link).emit("updatePlayers", players)
          socket.to(room_link).emit("updatePotSize", table["pot_size"])
          socket.to(room_link).emit('playerTurn', table['active_player'], table['max_bet'])
        } 
      });

    });

    const evaluateResult = (room_link) => {
      console.log("Evaluate result ...");
      const table = tables[room_link];
      const players = table["players"];
    
      let active_players = []
      let winners = []
    
      for (let player = 0; player < players.length; player++) {
        if (players[player] && players[player]['active']) {
          active_players.push({seat_index: player, player: players[player]})
        }
      }
      // one player left
      if (active_players.length === 1) {
        return [active_players[0]['seat_index']]
      } else if (table['stage'] === 3) {

        let winning_combos = []
        let table_cards = table['table_cards']
        let lowest_hand_rank = 100000

        for (let player = 0; player < active_players.length; player++) {
          const player_cards = active_players[player]['player']['cards']
          const combo = PokerEvaluator.evalHand(table_cards.concat(player_cards))
          lowest_hand_rank = Math.min(lowest_hand_rank, combo['handRank'])
          winning_combos[player] = {seat_index: active_players[player]['seat_index'], handRank: combo['handRank']}
        }
        winners = decideWinners(winning_combos, lowest_hand_rank)
      }
      if (winners.length === 0) {
        console.log("No winner yet, deal more cards");
      }
      return winners
    } 

    const decideWinners = (winning_combos, lowest_hand_rank) => {
      console.log("Trying to decide winner...");
      let winners = []
      for (let combo = 0; combo < winning_combos.length; combo++) {
        if (winning_combos[combo]['handRank'] === lowest_hand_rank) {
          winners.push(winning_combos[combo]['seat_index'])
        }
      }
      console.log(winners)
      return winners
    }
    res.socket.server.io = io;
  } else {
    console.log("socket.io already running");
  }
  res.end();
};

export default SocketHandler;
