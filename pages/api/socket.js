import { Server } from "socket.io";

import * as PokerEvaluator from "poker-evaluator";

import deck from "../../poker/card-deck/deck";
import shuffle from "../../poker/logic/shuffle";
const tables = {}; // defines tables for each game

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
            dealer: 0,
            active_player: 0,
            all_went_all_in: false,
            max_bet: 0,
            stage: 0,

            pot_index: 0,

            player_bet_sizes: [],

            pots: [
              {
                pot_size: 0,
                players: [],
              },
            ],

            players: [],
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
          chips: 300 * seat_index + 300,
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
          socket.to(room_link).emit("updatePots", table["pots"]);
          socket
            .to(room_link)
            .emit("playerTurn", table["active_player"], table["max_bet"]);
        }
        socket.to(room_link).emit("updatePlayers", table["players"]);
      });

      socket.on("startGame", (room_link) => {
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

        // ALEX CHANGED THIS
        if (turn_type === "check") {
          bet_size = 0;
        }

        if (turn_type === "fold") {
          players[active_player]["active"] = false;
        } else {
          updateChips(table, players, active_player, bet_size);

          if (players[active_player]["chips"] === 0) {
            players[active_player]["all_in"] = true;
            console.log("all in", players[active_player]["all_in"]);
          }

          table["max_bet"] = Math.max(
            table["max_bet"],
            players[active_player]["bet"]
          );
          console.log("Now max bet is: ", table["max_bet"]);
        }
        console.log("previous idx", table["active_player"]);

        // get idx of next player
        let next_player = active_player + 1;

        const MAX_ITERATION = players.length + next_player;
        for (let player = next_player; player < MAX_ITERATION; player++) {
          next_player = player % players.length;
          if (
            players[next_player] &&
            players[next_player]["active"] &&
            !players[next_player]["all_in"]
          ) {
            break;
          }
        }
        table["active_player"] = next_player;
        console.log("now idx is ", table["active_player"], "\n");
        console.log("Active player all in:", players[next_player]["all_in"]);
        if (
          (players[next_player]["played_in_round"] &&
            players[next_player]["bet"] === table["max_bet"]) ||
          players[next_player]["all_in"] ||
          !players[next_player]["active"] ||
          allFolded(players)
        ) {
          // current stage is over -> next stage or next round
          evaluatePots(
            table,
            table["pots"],
            table["player_bet_sizes"],
            table["pot_index"]
          );

          console.log("current stage:", table["stage"]);
          console.log("all folded: ", allFolded(players));
          console.log("all went all in", allWentAllIn(players));

          if (
            !allFolded(players) &&
            !table["all_went_all_in"] &&
            allWentAllIn(players)
          ) {
            table["all_went_all_in"] = true;
            console.log("all went all in");
            // maybe this will cause frontend issues where backend is updated but frontend is not
            socket.to(room_link).emit("updateAllWentAllIn", true);
            socket.to(room_link).emit("updatePots", table["pots"]);
            socket.to(room_link).emit("updatePlayers", players);
            let stage = table["stage"];

            let waitTime = 1000 + stage * 1000;

            while (stage < 3) {
              const play = (stage) => {
                setTimeout(() => {
                  addCards(stage, table["deck"], table["table_cards"]);
                  socket
                    .to(room_link)
                    .emit("updateTableCards", table["table_cards"]);
                  stage += 1;
                }, waitTime);
              };
              waitTime = 1000 + stage * 1000;
              play(stage);
              stage += 1;
            }
            setTimeout(() => {
              table["stage"] = 3;
              const winners = evaluateResult(room_link);
              provideWinners(10000, table, winners, players, room_link);
            }, 10000);
          } else {
            const winners = evaluateResult(room_link); // handles case where all folded

            if (winners.length === 0) {
              // next stage
              addCards(table["stage"], table["deck"], table["table_cards"]);

              table["stage"] += 1;
              table["max_bet"] = 0;

              for (let player = 0; player < players.length; player++) {
                if (players[player]) {
                  players[player]["played_in_round"] = false;
                  players[player]["bet"] = 0;
                }
              }

              // TODO: calculate who needs to go first in next stage
              // calculate dealder but ignore all-inners
              socket
                .to(room_link)
                .emit("updateTableCards", table["table_cards"]);
              socket.to(room_link).emit("updatePlayers", players);
              socket.to(room_link).emit("updatePots", table["pots"]);
              socket
                .to(room_link)
                .emit("playerTurn", table["active_player"], table["max_bet"]);
            } else {
              // someone won, next round
              provideWinners(
                5000,
                table,
                evaluateResult(room_link),
                players,
                room_link
              );
            }
          }
        } else {
          // keep playing this stage, next player to go
          table["active_player"] = next_player;
          keepPlaying(table, players, room_link);
        }
      });

      const addCards = (stage, deck, table_cards) => {
        if (stage === 0) {
          table_cards.push(deck.pop(), deck.pop(), deck.pop());
        } else {
          table_cards.push(deck.pop());
        }
      };

      const provideWinners = (time, table, winners, players, room_link) => {
        for (let winner = 0; winner < winners.length; winner++) {
          if (typeof winners[winner] !== 'undefined') {
            players[winner]["chips"] += winners[winner]["potSize"];
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
        }, time);
      };

      const keepPlaying = (table, players, room_link) => {
        socket.to(room_link).emit("updatePlayers", players);
        socket.to(room_link).emit("updatePots", table["pots"]);
        socket
          .to(room_link)
          .emit("playerTurn", table["active_player"], table["max_bet"]);
      };

      const restartGame = (table, players, next_dealer, room_link) => {
        for (const player of players) {
          if (player && player["online"]) {
            player["all_in"] = false;
            player["played_in_round"] = false;
            player["bet"] = 0;
            player["cards"] = [table["deck"].pop(), table["deck"].pop()];
            //player is active only if he/she has more than 0 chips
            player["active"] = player["chips"] === 0 ? false : true;
          }
        }
        console.log("Players before new round:", players);
        socket.to(room_link).emit("updateWinners", []);
        table["stage"] = 0;
        table["max_bet"] = 0;
        table["pots"] = []
        table["all_went_all_in"] = false;
        table["table_cards"] = [];
        socket.to(room_link).emit("updatePlayers", players);
        socket
          .to(room_link)
          .emit("updateAllWentAllIn", table["all_went_all_in"]);
        socket.to(room_link).emit("updatePots", table["pots"]);
        socket.to(room_link).emit("updateTableCards", table["table_cards"]);
        socket.to(room_link).emit("playerTurn", next_dealer, table["max_bet"]);
      };

      const updateChips = (table, players, active_player, bet_size) => {
        players[active_player]["played_in_round"] = true;
        players[active_player]["chips"] += players[active_player]["bet"];

        const previous_bet_size = players[active_player]["bet"];
        const pot_index = table["pot_index"];
        table["pots"][pot_index]["pot_size"] += bet_size - previous_bet_size;

        table["player_bet_sizes"][active_player] = bet_size;

        if (!table["pots"][pot_index]["players"].includes(active_player))
          table["pots"][pot_index]["players"].push(active_player);

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

      const allWentAllIn = (players) => {
        let allIn = 0;
        let in_game_players = 0;
        for (let player = 0; player < players.length; player++) {
          if (players[player] && players[player]["active"]) {
            in_game_players += 1;
            if (players[player]["all_in"]) {
              allIn += 1;
            }
          }
        }
        return allIn >= in_game_players - 1;
      };

      const evaluatePots = (table, pots, player_bet_sizes, pot_index) => {
        console.log("evaluating pots...");
        let bet_sizes_set = new Set(
          [...player_bet_sizes].filter((x) => x !== null && x > 0)
        );
        console.log("bet sizes set", bet_sizes_set);
        console.log("player bet sizes", player_bet_sizes);
        while (bet_sizes_set.size > 1) {
          let pot_size = pots[pot_index]["pot_size"];
          let side_pot = 0;
          let side_pot_players = [];
          const min_bet = Math.min(
            ...player_bet_sizes.filter((x) => x !== null && x > 0)
          );

          for (let player = 0; player < player_bet_sizes.length; player++) {
            if (player_bet_sizes[player] && player_bet_sizes[player] > 0) {
              player_bet_sizes[player] -= min_bet;
              pot_size -= player_bet_sizes[player];
              side_pot += player_bet_sizes[player];
              if (player_bet_sizes[player] > 0) {
                side_pot_players.push(player);
              }
            }
          }
          pots[pot_index]["pot_size"] = pot_size;

          pot_index++;
          table["pot_index"]++;

          pots.push({
            pot_size: side_pot,
            players: side_pot_players,
          });
          bet_sizes_set = new Set(
            [...player_bet_sizes].filter((x) => x !== null && x > 0)
          );
        }
        console.log(pots);
      };

      const evaluateResult = (room_link) => {
        console.log("evaluate result");
        const table = tables[room_link];
        const players = table["players"];
        const pots = table["pots"];

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

        // ALEX THINKS THIS IS UNNECESSARY
        // one player left
        // if (active_players.length === 1) {
        //   winners.push({
        //     seatIndex: active_players[0]["seat_index"],
        //     handName: "Winner by Fold",
        //     potSize: table["pot_size"],
        //   });
        // } else 
        
        if (table["stage"] === 3) {
          let winning_combos = [];
          let table_cards = table["table_cards"];

          for (let player = 0; player < active_players.length; player++) {
            const player_cards = active_players[player]["player"]["cards"];
            const combo = PokerEvaluator.evalHand(
              table_cards.concat(player_cards)
            );
            winning_combos[player] = {
              seat_index: active_players[player]["seat_index"],
              value: combo["value"],
              hand_name: combo["handName"],
            };
          }
          winners = decideWinners(winning_combos, pots);
        }
        if (winners.length === 0) {
          console.log("No winner yet, deal more cards");
        } else {
          socket.to(room_link).emit("updateWinners", winners);
        }
        return winners;
      };

      const decideWinners = (winning_combos, pots) => {
        console.log(winning_combos);
        let winners = [];

        while (pots.length > 0) {
          //get the last pot
          let pot = pots.pop();

          let winner_count = 1;
          let winning_value = 0;

          //loop through all combos
          for (let combo = 0; combo < winning_combos.length; combo++) {
            if (!pot["players"].includes(winning_combos[combo]["seat_index"]))
              continue;

            const previous_winning_value = winning_value;

            console.log(previous_winning_value, winning_combos[combo]["value"]);

            winning_value = Math.max(
              winning_value,
              winning_combos[combo]["value"]
            );

            if (previous_winning_value === winning_combos[combo]["value"]) {
              winner_count += 1;
              // winner count reset becasue a higher winning value was found
            } else if (
              previous_winning_value < winning_combos[combo]["value"]
            ) {
              winner_count = 1;
            }
          }

          console.log(winner_count, "winner count");
          console.log(winning_value, "winning value");

          for (let combo = 0; combo < winning_combos.length; combo++) {
            // if the player is in the pot and has the winning value
            const seat_index = winning_combos[combo]["seat_index"];
            const value = winning_combos[combo]["value"];
            const hand_name = winning_combos[combo]["hand_name"];

            console.log(seat_index, value, hand_name);
            if (
              pot["players"].includes(seat_index) &&
              value === winning_value
            ) {
              if (
                typeof winners[winning_combos[combo]["seat_index"]] ===
                "undefined"
              ) {
                console.log("adding winner");
                winners[winning_combos[combo]["seat_index"]] = {
                  handName: hand_name,
                  potSize: pot["pot_size"] / winner_count,
                };
              } else {
                winners[winning_combos[combo]["seat_index"]]["potSize"] +=
                  pot["pot_size"] / winner_count;
              }
            }
          }
        }
        console.log("winners", winners);
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
