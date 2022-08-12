import { useEffect, useState } from "react";
import Router from "next/router";

import {
  Slider,
  Text,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Box,
  Button,
  Center,
  Container,
  useColorModeValue,
  HStack,
  FormControl,
  Input,
  VStack,
} from "@chakra-ui/react";

import io from "socket.io-client";
import { validate } from "uuid";

function Poker({ room_code }) {
  const [IO, setIO] = useState(null);

  const [players, setPlayers] = useState([null]);

  //while game is on-going
  const [playerTurn, setPlayerTurn] = useState(null);
  const [pot, setPot] = useState(0);

  //margin-top
  const [playerPositions, setPlayerPositions] = useState([
    { top: -75, left: 220 },
    { top: 350, left: 220 },
    { top: 125, left: -40 },
    { top: 125, left: 610 },
  ]);

  const [gameStarted, setGameStarted] = useState(false);

  const [tableCards, setTableCards] = useState([]);

  const [betSize, setBetSize] = useState(0);

  const [requiredBet, setRequiredBet] = useState(0);

  const [winners, setWinners] = useState([]);

  useEffect(() => {
    if (!validate(`${room_code}`)) {
      Router.push("/invalid-link");
    }
  }, []);

  useEffect(() => {
    setBetSize(requiredBet);
  }, [requiredBet]);

  const bgColor_ = useColorModeValue('gray.600', 'white.600')
  const textBgColor_ = useColorModeValue('gray.600', 'green.800')
  const color_ = useColorModeValue('blue.300', 'white.800')

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

        socket.on("updateWinners", (winners) => {
          setWinners(winners);
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
      <Box h={"79vh"}>
        <Box
          position="fixed"
          minW="600px"
          minH="350px"
          style={{
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
          bgColor={"gray.700"}
          rounded="20%"
          shadow="dark-lg"
          p="5"
        >
          <Center>
            <HStack>
              {tableCards &&
                tableCards.map((tableCard, i) => {
                  return (
                    <Container
                      key={i * 800}
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
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
          <Box
            bgColor="gray.500"
            p="3"
            rounded="2xl"
            style={{ position: "absolute", top: "50px", left: "50px" }}
          >
            <HStack>
              <Text>Pot: </Text>
              <Text fontWeight={'bold'}>{pot}</Text>
            </HStack>
          </Box>
          {playerPositions.map((playerPosition, i) => {
            return (
              <Container
                borderRadius="md"
                key={i}
                position="absolute"
                bgColor={bgColor_}
                top={playerPosition["top"]}
                left={playerPosition["left"]}
                width={150}
                height={75}
                border={"1px solid white"}
              >
                {players[i] && (
                  <>
                    <HStack>
                      {players[i].cards.map((card, j) => {
                        let bP = `${15 * -51.8}px ${0}px`;
                        if (players[i].id === IO.id) {
                          bP = `${faceValue[card[0]] * -51.8}px ${
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
                  {!players[i] && !gameStarted && (
                    <form onSubmit={(e) => handleAddPlayer(e, i)}>
                      <FormControl isRequired>
                        <Center>
                          <Input
                            position={"absolute"}
                            bgColor="whiteAlpha.800"
                            style={{
                              top: "50%",
                              left: "50%",
                              transform: "translate(-50%, 45%)",
                            }}
                            type="text"
                            name="name"
                          />
                        </Center>
                      </FormControl>
                      <Center>
                        <Button
                          marginTop={"80px"}
                          type="submit"
                          minW="90px"
                          bgColor="green.600"
                          _hover={{
                            shadow: "dark-lg",
                            bgColor: "green.800",
                          }}
                        >
                          Join
                        </Button>
                      </Center>
                    </form>
                  )}
                  {players[i] && <Text bgColor={textBgColor_} p='2' rounded='xl' mt='2' color={color_}>{players[i].chips}</Text>}
                </Center>
              </Container>
            );
          })}
        </Box>
      </Box>
      {players.length > 1 && !gameStarted && (
        <Center>
          <Button
            mt={5}
            width="100px"
            bgColor={"green.600"}
            fontWeight="extrabold"
            _hover={{
              bgColor: "green.400",
              width: "120px",
              height: "50px",
            }}
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
            onClick={() => {
              console.log("ALL PLAYERS JOINED");
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

  return { room_code };
};

export default Poker;
