import { useEffect, useRef, useState, useCallback } from "react";
import Router from "next/router";

import * as d3 from "d3";

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
  Wrap,
  useMediaQuery,
} from "@chakra-ui/react";

import io from "socket.io-client";
import { validate } from "uuid";
import { capitalize } from "../../utils/capitalize";

function Poker({ room_code }) {
  const ref = useRef();

  const [IO, setIO] = useState(null);

  const [players, setPlayers] = useState([null]);

  //while game is on-going
  const [playerTurn, setPlayerTurn] = useState(null);

  // pots
  const [pots, setPots] = useState([]);

  const [gameStarted, setGameStarted] = useState(false);

  const [allWentAllIn, setAllWentAllIn] = useState(false);

  const [tableCards, setTableCards] = useState([]);

  const [id, setId] = useState(null);

  const [betSize, setBetSize] = useState(0);

  const [requiredBet, setRequiredBet] = useState(0);

  const [winners, setWinners] = useState([]);

  const BOARD_WIDTH = ["220px", "350px", "500px", "600px"];

  const BOARD_HEIGHT = ["350px", "350px", "350px", "350px"];

  const PLAYER_POSITIONS = [
    {
      top: ["-95px", "-95px", "-95px", "-95px"],
      left: ["40px", "110px", "180px", "220px"],
    },
    {
      top: ["125px", "125px", "125px", "125px"],
      left: ["-85px", "-85px", "-160px", "-160px"],
    },
    {
      top: ["355px", "355px", "355px", "355px"],
      left: ["40px", "110px", "180px", "220px"],
    },
    {
      top: ["125px", "125px", "125px", "125px"],
      left: ["230px", "360px", "510px", "610px"],
    },
  ];

  const [isMobile] = useMediaQuery("(min-width: 480px)");

  useEffect(() => {
    if (!validate(`${room_code}`)) {
      Router.push("/invalid-link");
    }
  }, [room_code]);

  useEffect(() => {
    setBetSize(requiredBet);
  }, [requiredBet]);

  const bgColor_ = useColorModeValue("gray.600", "white.600");
  const textBgColor_ = useColorModeValue("gray.600", "green.800");
  const color_ = useColorModeValue("blue.300", "white.800");

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
    IO.emit("playerJoining", room_code, i, e.target.name.value, id);
  };
  const changeBetSize = (e) => {
    setBetSize(e);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (localStorage.getItem("id") !== null) {
        setId(localStorage.getItem("id"));
      } else if (IO && IO.id && !id) {
        setId(IO.id);
        localStorage.setItem("id", IO.id);
      }
    }
  }, [IO, id]);

  useEffect(() => {
    if (room_code) {
      fetch("/api/socket").finally(() => {
        const socket = io();

        setIO(socket);

        socket.on("connect", () => {
          socket.emit("joinRoom", room_code);
          socket.emit("getGameInfo", room_code);
        });

        socket.on("updatePlayers", (players) => {
          setPlayers(players);
        });

        socket.on("updateTableCards", (newCards) => {
          setTableCards(newCards);
        });

        socket.on("updateGameStarted", (gameStarted) => {
          setGameStarted(gameStarted);
        });

        socket.on("updatePots", (pots) => {
          setPots(pots);
        });

        socket.on("updateWinners", (winners) => {
          setWinners(winners);
        });

        socket.on("updateAllWentAllIn", (allWentAllIn) => {
          setAllWentAllIn(allWentAllIn);
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
      <Box h={["115vh", "100vh"]}>
        <Box
          position="absolute"
          width={BOARD_WIDTH}
          height={BOARD_HEIGHT}
          style={{
            marginTop: "-65px",
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
                      position="absolute"
                      style={{
                        top: "50%",
                        left: "50%",
                        marginLeft: isMobile
                          ? `${(2 - i) * -50}px`
                          : `${i > 2 ? (3.5 - i) * -50 : (1 - i) * -50}px`,
                        marginTop: isMobile ? `0px` : `${i > 2 ? 75 : 0}px`,
                        transform: "translate(-50%, -50%)",
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
          {pots.length > 0 && <Box
            bgColor="gray.500"
            p="3"
            rounded="2xl"
            style={{ position: "absolute", top: "50px", left: "50px" }}
          >
            <VStack>
              {pots.map((pot, l) => {
                return (
                  <HStack key={l * 77 + 77}>
                    <Text>Pot: </Text>
                    <Text fontWeight={"bold"}>{pot['pot_size']}</Text>
                  </HStack>
                );
              })}
            </VStack>
          </Box>}
          {PLAYER_POSITIONS.map((playerPosition, i) => {
            return (
              <Container
                borderRadius="md"
                ref={ref}
                key={i * 999 + 43}
                position="absolute"
                bgColor={bgColor_}
                top={playerPosition["top"]}
                left={playerPosition["left"]}
                width={i > 1 ? ["75px", "75px", "150px"] : "150px"}
                height={i > 1 ? ["150px", "150px", "75px"] : "75px"}
                border={"1px solid white"}
                id={`box${i}`}
              >
                {players[i] && players[i].active && (
                  <>
                    <Wrap justify="center">
                      {players[i].cards.map((card, j) => {
                        let bP = `${15 * -51.8}px ${0}px`;
                        if (players[i].id === id) {
                          bP = `${faceValue[card[0]] * -51.8}px ${
                            suit[card[1]] * -73
                          }px`;
                        }
                        return (
                          <Box
                            key={j + 234}
                            ml="-2"
                            style={{
                              marginTop: 5,
                              backgroundImage: "url('/images/card-deck.png')",
                              overflow: "hidden",
                              backgroundPosition: bP,
                              height: 62,
                              width: 42,
                            }}
                          ></Box>
                        );
                      })}
                    </Wrap>
                    <HStack>
                      {players[i].id === id &&
                        i === playerTurn &&
                        !players[i].all_in &&
                        !allWentAllIn &&
                        ["bet", "check", "fold"].map((move, j) => {
                          if (move !== "check" || requiredBet === 0) {
                            return (
                              <Button
                                key={j * 123 + 123}
                                onClick={() => {
                                  let bet_ = betSize;
                                  if (requiredBet > players[i].chips) {
                                    bet_ = players[i].chips + players[i].bet;
                                  }
                                  IO.emit("evalTurn", room_code, move, bet_);
                                }}
                              >
                                {move}
                              </Button>
                            );
                          }
                        })}
                      {players[i].id === id &&
                        i === playerTurn &&
                        !allWentAllIn && (
                          <VStack>
                            <Box>{betSize}</Box>
                            <Slider
                              aria-label="slider-ex-2"
                              width="100px"
                              colorScheme="red"
                              step={50}
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
                  {players[i] && (
                    <Text
                      bgColor={textBgColor_}
                      p="2"
                      rounded="xl"
                      mt="2"
                      color={color_}
                    >
                      {players[i].chips}
                    </Text>
                  )}
                </Center>
              </Container>
            );
          })}
        </Box>
        {winners.length > 0 && (
          <VStack
            minW="300px"
            minH="300px"
            rounded="2xl"
            shadow={"dark-lg"}
            bgColor="blue.800"
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
          >
            {winners.map((winner, i) => {
              console.log(winners);
              if (winner === null) return;
              console.log("winners[winner]", winners[winner]);
              d3.select(`#box${i}`).style("border", "10px solid yellow");
              setTimeout(() => {
                d3.select(`#box${i}`).style("border", "1px solid white");
              }, 5000);

              return (
                <Center key={i * 912 + 912}>
                  <HStack
                    key={i * 324 + 324}
                    bgColor="gray.800"
                    p="5"
                    mt="2"
                    shadow={"dark-lg"}
                    rounded="xl"
                  >
                    <Text color="gray.50">{players[i].name} Won With</Text>
                    <Text color="gray.50">
                      {capitalize(winner["handName"])}
                    </Text>
                  </HStack>
                </Center>
              );
            })}
          </VStack>
        )}
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
