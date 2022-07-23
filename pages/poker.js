import { useEffect, useState } from "react";

import {
  Box,
  Button,
  Center,
  Container,
  HStack,
  FormControl,
  Image,
  Input,
} from "@chakra-ui/react";

import io from "socket.io-client";

function poker() {
  const [IO, setIO] = useState(null);

  const [players, setPlayers] = useState([null, null]);

  //while game is on-going
  const [turn, setTurn] = useState(null);
  const [stage, setStage] = useState(null);
  const [pot, setPot] = useState(0);

  //margin-top
  const [playerPositions, setPlayerPositions] = useState([-70, 50]);

  const [gameStarted, setGameStarted] = useState(false);
  const [currentTableCards, setCurrentTableCards] = useState([]);

  const suit = {
    d: 0,
    h: 1,
    s: 2,
    c: 3,
  };

  const faceValue = {
    A: 0,
    2: 1,
    3: 2,
    4: 3,
    5: 4,
    6: 5,
    7: 6,
    8: 7,
    9: 8,
    T: 9,
    J: 10,
    Q: 11,
    K: 12,
  };

  const handleAddPlayer = (e, i) => {
    e.preventDefault();
    IO.emit("playerJoining", i, e.target.name.value);
  };

  useEffect(() => {
    fetch("/api/socket").finally(() => {
      const socket = io();

      setIO(socket);

      socket.on("connect", () => {
        console.log("Getting Current Players");
        socket.emit("getPlayers");
      });

      socket.on("updatePlayers", (players) => {
        console.log("Updating Players", players);
        setPlayers(players);
      });

      socket.on("playerTurn", (seatIndex, stage) => {
        setTurn(seatIndex)
        setStage(stage)
      });

      socket.on("disconnect", () => {
        console.log("disconnect");
      });

      socket.on("startRound", () => {
        setGameStarted(true);
        socket.emit("tableTurn", 0, 0, "start");
      });
    });
  }, []);

  return (
    <Center>
      <Box h={"100vh"}>
        <Image mt={"10vh"} src="images/poker.png" alt="Poker Table"></Image>

        {playerPositions.map((playerPosition, i) => {
          return (
            <Container
              borderRadius="md"
              key={i}
              mt={`${playerPosition}vh`}
              width={150}
              height={75}
              border={"1px solid white"}
            >
              {players[i] && (
                <>
                  <HStack>
                    {players[i].cards.map((card, j) => {
                      let bP = `${15 * -52}px ${0}px`;
                      if (players[i].id === IO.id) {
                        bP = `${faceValue[card[1]] * -52}px ${
                          suit[card[0]] * -73
                        }px`;
                      }
                      return (
                        <Container
                          key={j}
                          style={{
                            marginTop: 5,
                            backgroundImage: "url('images/card-deck.png')",
                            overflow: "hidden",
                            backgroundPosition: bP,
                            height: 62,
                            width: 42,
                          }}
                        ></Container>
                      );
                    })}
                  </HStack>
                  <HStack>
                    {(players[i].id === IO.id && i === turn) &&
                      ["Bet", "Check", "Fold"].map((move) => {
                        return (
                          <Button
                            onClick={() => {
                              IO.emit("tableTurn", turn, stage, "bet");
                              console.log(move);
                            }}
                          >
                            {move}
                          </Button>
                        );
                      })}
                  </HStack>
                </>
              )}
              <Center>
                {!players[i] ? (
                  <form onSubmit={(e) => handleAddPlayer(e, i)}>
                    <FormControl isRequired>
                      <Input type="text" name="name" />
                    </FormControl>
                    <Center>
                      <Button mt={5} type="submit">
                        Join
                      </Button>
                    </Center>
                  </form>
                ) : (
                  <h1>{players[i].chips}</h1>
                )}
              </Center>
            </Container>
          );
        })}
      </Box>
      {players[0] && players[1] && (
        <Center>
          <Button
            mt={5}
            onClick={() => {
              IO.emit("startGame");
            }}
          >
            Start
          </Button>
        </Center>
      )}
    </Center>
  );
}

export default poker;
