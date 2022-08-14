import { Server } from "socket.io";

import * as PokerEvaluator from "poker-evaluator";

import deck from "../../poker/card-deck/deck";
import shuffle from "../../poker/logic/shuffle";
const tables = {};

const SocketHandler = (req, res) => {
  if (!res.socket.server.io) {
    const io = new Server(res.socket.server);

    io.on("connection", (socket) => {
      socket.on("joinRoom", (room_link) => {
        socket.join(room_link);
        if (!(room_link in tables)) {
          tables[room_link] = {
            deck: shuffle(deck),
            game_started: false,
            players: [],
            dealer: 0,
            active_player: 0, // active player index
            pot_size: 0,
            max_bet: 0,
            stage: 0,
            table_cards: [],
          };
        }
      });

      socket.on("playerJoining", (room_link, seat_index, name, id) => {
        tables[room_link]["players"][seat_index] = {
          name: name,
          active: true,
          online: true,
          played_in_round: false,
          bet: 0,
          id: id,
          all_in: false,
          chips: 1000,
          cards: [
            tables[room_link]["deck"].pop(),
            tables[room_link]["deck"].pop(),
          ],
        };
        socket
          .to(room_link)
          .emit("updatePlayers", tables[room_link]["players"]);
      });

      socket.on("getGameInfo", (room_link) => {
        const table = tables[room_link];
        if (table["game_started"]) {
          socket
            .to(room_link)
            .emit("updateTableCards", tables[room_link]["table_cards"]);
          socket
            .to(room_link)
            .emit("updateGameStarted", tables[room_link]["game_started"]);
          socket.to(room_link).emit("updatePotSize", table["pot_size"]);
          socket
            .to(room_link)
            .emit("playerTurn", table["active_player"], table["max_bet"]);
        }
        socket.to(room_link).emit("updatePlayers", table["players"]);
      });

      socket.on("startGame", (room_link) => {
        let d = shuffle(deck);
        const table = tables[room_link];
        table["game_started"] = true;
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
        } else {
          updateChips(table, players, active_player, bet_size);

          if (players[active_player]["chips"] === 0) {
            players[active_player]["all_in"] = true;
          }

          table["pot_size"] += bet_size;
          table["max_bet"] = Math.max(
            table["max_bet"],
            players[active_player]["bet"]
          );
          console.log("Now max bet is: ", table["max_bet"]);
        }

        // get idx of next player
        let next_player = active_player;
        while (true) {
          next_player = (next_player + 1) % players.length;
          if (players[next_player] && players[next_player]["active"]) {
            break;
          }
        }
        table["active_player"] = next_player;
        if (
          (players[next_player]["played_in_round"] &&
            players[next_player]["bet"] === table["max_bet"]) ||
          allFolded(players)
        ) {
          // end of this stage, start new stage
          const winners = evaluateResult(room_link);
          let d = table["deck"];
          let table_cards = table["table_cards"];
          if (winners.length === 0) {
            // next stage
            if (table["stage"] === 0) {
              table_cards.push(d.pop(), d.pop(), d.pop());
            } else {
              table_cards.push(d.pop());
            }
            table["stage"] += 1;
            table["max_bet"] = 0;
            for (let player = 0; player < players.length; player++) {
              if (players[player]) {
                players[player]["played_in_round"] = false;
                players[player]["bet"] = 0;
              }
            }
            // TODO: calculate who needs to go first in next stage
            socket.to(room_link).emit("updateTableCards", table_cards);
            socket.to(room_link).emit("updatePlayers", players);
            socket.to(room_link).emit("updatePotSize", table["pot_size"]);
            socket
              .to(room_link)
              .emit("playerTurn", table["active_player"], table["max_bet"]);
          } else {
            // someone won
            let chipsWon = table["pot_size"] / winners.length;
            for (const winner of winners) {
              players[winner["seatIndex"]]["chips"] += chipsWon;
            }
            for (const player of players) {
              if (player && player["online"]) {
                player["active"] = true;
                player["cards"] = [table["deck"].pop(), table["deck"].pop()];
              }
            }
            // calculate next dealer
            let next_dealer = (table["dealer"] + 1) % players.length;

            while (!players[next_dealer]) {
              next_dealer = (next_dealer + 1) % players.length;
            }

            table["dealer"] = next_dealer;
            table["active_player"] = next_dealer;
            table["deck"] = shuffle(deck);

            setTimeout(() => {
              restartGame(table, players, next_dealer, room_link);
            }, 5000);
          }
        } else {
          // keep playing this stage, next player to go
          keepPlaying(table, players, room_link);
        }
      });

      const keepPlaying = (table, players, room_link) => {
        socket.to(room_link).emit("updatePlayers", players);
        socket.to(room_link).emit("updatePotSize", table["pot_size"]);
        socket
          .to(room_link)
          .emit("playerTurn", table["active_player"], table["max_bet"]);
      };

      const restartGame = (table, players, next_dealer, room_link) => {
        socket.to(room_link).emit("updateWinners", []);
        table["stage"] = 0;
        table["max_bet"] = 0;
        table["pot_size"] = 0;
        table["table_cards"] = [];
        socket.to(room_link).emit("updatePlayers", players);
        socket.to(room_link).emit("updatePotSize", table["pot_size"]);
        socket.to(room_link).emit("updateTableCards", table["table_cards"]);
        socket.to(room_link).emit("playerTurn", next_dealer, table["max_bet"]);
      };

      const updateChips = (table, players, active_player, bet_size) => {
        players[active_player]["played_in_round"] = true;
        players[active_player]["chips"] += players[active_player]["bet"];
        table["pot_size"] -= players[active_player]["bet"];
        players[active_player]["bet"] = bet_size;
        players[active_player]["chips"] -= bet_size;
      };

      const allFolded = (players) => {
        let folded = 0;
        let in_game_players = 0;
        for (let player = 0; player < players.length; player++) {
          if (players[player]) {
            in_game_players += 1;
            if (!players[player]["active"]) {
              folded += 1;
            }
          }
        }
        return folded === in_game_players - 1;
      };

      const evaluateResult = (room_link) => {
        const table = tables[room_link];
        const players = table["players"];

        let active_players = [];
        let winners = [];

        for (let player = 0; player < players.length; player++) {
          if (players[player] && players[player]["active"]) {
            active_players.push({
              seat_index: player,
              player: players[player],
            });
          }
        }
        // one player left
        if (active_players.length === 1) {
          winners.push({
            seatIndex: active_players[0]["seat_index"],
            handName: "Winner by Fold",
          });
        } else if (table["stage"] === 3) {
          let winning_combos = [];
          let table_cards = table["table_cards"];
          let highest_hand_rank = -1;

          for (let player = 0; player < active_players.length; player++) {
            const player_cards = active_players[player]["player"]["cards"];
            const combo = PokerEvaluator.evalHand(
              table_cards.concat(player_cards)
            );
            highest_hand_rank = Math.max(highest_hand_rank, combo["value"]);
            winning_combos[player] = {
              seat_index: active_players[player]["seat_index"],
              value: combo["value"],
              hand_name: combo["handName"],
            };
          }
          winners = decideWinners(winning_combos, highest_hand_rank);
        }
        if (winners.length === 0) {
          console.log("No winner yet, deal more cards");
        } else {
          socket.to(room_link).emit("updateWinners", winners);
        }
        return winners;
      };

      const decideWinners = (winning_combos, highest_hand_rank) => {
        let winners = [];
        for (let combo = 0; combo < winning_combos.length; combo++) {
          if (winning_combos[combo]["value"] === highest_hand_rank) {
            winners.push({
              seatIndex: winning_combos[combo]["seat_index"],
              handName: winning_combos[combo]["hand_name"],
            });
          }
        }
        return winners;
      };
    });

    res.socket.server.io = io;
  } else {
    console.log("socket.io already running");
  }
  res.end();
};

export default SocketHandler;
