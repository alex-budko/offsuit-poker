import { useEffect, useState } from "react";
import { Box, Button, Center, Input } from "@chakra-ui/react";
import io from "socket.io-client";
import { Stage, TilingSprite, Container, Sprite} from "@inlet/react-pixi";

import deck from "../poker/card-deck/deck";
import shuffle from "../poker/logic/shuffle";

function poker() {
  const [currentDeck, setCurrentDeck] = useState(shuffle(deck))
  const [IO, setIO] = useState(null);

  console.log(currentDeck)

  const suit = {
    'c': 0,
    'd': 1,
    'h': 2,
    's': 3,
  }

  const faceValue = {
    'A': 0,
    '2': 1,
    '3': 2,
    '4': 3,
    '5': 4,
    '6': 5,
    '7': 6,
    '8': 7,
    '9': 8,
    'T': 9,
    'J': 10,
    'Q': 11,
    'K': 11,
  }


  useEffect(() => {
    fetch("/api/socket").finally(() => {
      const socket = io();
      setIO(socket);
      socket.on("connect", () => {
        socket.emit("hello");
      });

      socket.on("user-typed", (msg) => {
        console.log(msg);
      });

      socket.on("user-connect", () => {
        console.log("a user connected");
      });

      socket.on("disconnect", () => {
        console.log("disconnect");
      });
    });
  }, []);

  return (
    <Box h={"79vh"}>
      <Stage width={1280} height={520} options={{ backgroundAlpha: 0 }}>
        <Container>
          <Sprite x={342} y={70.5} image="/images/poker.png" />

          <TilingSprite
            x={590} y={10.5}
            image={"/images/card-deck.png"}
            width={49}
            height={76}
            tilePosition={{ x: -49.205*faceValue[currentDeck[0][1]], y: -76.58*suit[currentDeck[0][0]] }}
            tileScale={{ x: .5, y: .5 }}
          />

          <TilingSprite
            x={590+55} y={10.5}
            image={"/images/card-deck.png"}
            width={49}
            height={76}
            tilePosition={{ x: -49.205*faceValue[currentDeck[1][1]], y: -76.58*suit[currentDeck[1][0]] }}
            tileScale={{ x: .5, y: .5 }}
          />


          <TilingSprite
            x={590} y={425.5}
            image={"/images/card-deck.png"}
            width={49}
            height={76}
            tilePosition={{ x: -49.205*faceValue[currentDeck[2][1]], y: -76.58*suit[currentDeck[2][0]] }}
            tileScale={{ x: .5, y: .5 }}
          />

          <TilingSprite
            x={590+55} y={425.5}
            image={"/images/card-deck.png"}
            width={49}
            height={76}
            tilePosition={{ x: -49.205*faceValue[currentDeck[3][1]], y: -76.58*suit[currentDeck[3][0]] }}
            tileScale={{ x: .5, y: .5 }}
          />

        </Container>
      </Stage>
    </Box>
  );
}

export default poker;
