import { useEffect, useState } from "react";
import Router from "next/router";

import {
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Box,
  Button,
  Center,
  Container,
  HStack,
  FormControl,
  Image,
  Input,
  VStack,
} from "@chakra-ui/react";

import io from "socket.io-client";
import { validate } from "uuid";

function Poker() {
  const [IO, setIO] = useState(null);

  const [room_code, setRoomCode] = useState(null)

  const [players, setPlayers] = useState([null, null]);

  //while game is on-going
  const [playerTurn, setPlayerTurn] = useState(null);
  const [pot, setPot] = useState(0);

  //margin-top
  const [playerPositions, setPlayerPositions] = useState([-70, 50]);

  const [gameStarted, setGameStarted] = useState(false);

  const [tableCards, setTableCards] = useState([]);

  const [betSize, setBetSize] = useState(0);

  const [requiredBet, setRequiredBet] = useState(0);

  useEffect(() => {
    if (window) {
      const queryString = window.location.pathname.split("/");
      setRoomCode(queryString[2]);
    }
    if (room_code !== null && !validate(`${room_code}`)) {
      Router.push('/invalid-link')
    }
  }, [room_code]);

  useEffect(() => {
    setBetSize(requiredBet);
  }, [requiredBet]);

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
    IO.emit("playerJoining", room_code, i, e.target.name.value);
  };
  const changeBetSize = (e) => {
    setBetSize(e);
  };

  useEffect(() => {
    if (room_code) {
      fetch("/api/socket").finally(() => {
        const socket = io();
  
        setIO(socket);
  
        socket.on("connect", () => {
          socket.emit("joinRoom", room_code);
          socket.emit("getPlayers", room_code);
          socket.emit("getTableCards", room_code);
        });
  
        socket.on("updatePlayers", (players) => {
          setPlayers(players);
        });
  
        socket.on("updateTableCards", (newCards) => {
          let newTableCards = [...tableCards];
          newTableCards = newTableCards.concat(newCards);
          setTableCards(newTableCards);
        });
  
        socket.on("updatePotSize", (potSize) => {
          setPot(potSize);
        });
  
        socket.on("playerTurn", (seatIndex, requiredBetSize = 0) => {
          setPlayerTurn(seatIndex);
          setRequiredBet(requiredBetSize);
        });
  
        socket.on("disconnect", () => {
          console.log("disconnect");
        });
  
        socket.on("startRound", () => {
          setGameStarted(true);
        });
      });
    }
  }, [room_code]);

  return (
    <Center>
      <Box h={"100vh"}>
        <Box>
          <Image mt={"10vh"} src="/images/poker.png" alt="Poker Table"></Image>
          <Center>
            <HStack>
              {tableCards &&
                tableCards.map((tableCard, i) => {
                  return (
                    <Container
                      key={i * 800}
                      style={{
                        position: "absolute",
                        marginTop: 5,
                        top: "42vh",
                        marginLeft: `${(3 - i) * -50}px`,
                        backgroundImage: "url('/images/card-deck.png')",
                        overflow: "hidden",
                        backgroundPosition: `${
                          faceValue[tableCard[0]] * -52
                        }px ${suit[tableCard[1]] * -73}px`,
                        height: 62,
                        width: 42,
                      }}
                    ></Container>
                  );
                })}
            </HStack>
          </Center>
        </Box>
        <p>Pot: {pot}</p>
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
                        bP = `${faceValue[card[0]] * -52}px ${
                          suit[card[1]] * -73
                        }px`;
                      }
                      return (
                        <Container
                          key={j}
                          style={{
                            marginTop: 5,
                            backgroundImage: "url('/images/card-deck.png')",
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
                    {players[i].id === IO.id &&
                      i === playerTurn &&
                      ["bet", "check", "fold"].map((move) => {
                        if (move !== "check" || requiredBet === 0) {
                          return (
                            <Button
                              onClick={() => {
                                IO.emit("evalTurn", room_code, move, betSize);
                              }}
                            >
                              {move}
                            </Button>
                          );
                        }
                      })}
                    {players[i].id === IO.id && i === playerTurn && (
                      <VStack>
                        <Box>{betSize}</Box>
                        <Slider
                          aria-label="slider-ex-2"
                          width="100px"
                          colorScheme="red"
                          defaultValue={requiredBet}
                          min={requiredBet}
                          max={players[i].chips}
                          onChange={(e) => changeBetSize(e)}
                        >
                          <SliderTrack>
                            <SliderFilledTrack />
                          </SliderTrack>
                          <SliderThumb />
                        </Slider>
                      </VStack>
                    )}
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
      {players[0] && players[1] && !gameStarted && (
        <Center>
          <Button
            mt={5}
            onClick={() => {
              IO.emit("startGame", room_code);
            }}
          >
            Start
          </Button>
        </Center>
      )}
    </Center>
  );
}

Poker.getInitialProps = async ({ query }) => {
  const { room_code } = query;

  return { room_code, query };
};

export default Poker;
