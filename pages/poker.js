import { useCallback, useEffect, useState } from "react";
import { Box } from "@chakra-ui/react";
import io from "socket.io-client";
import { Stage, TilingSprite, Container, Sprite } from "@inlet/react-pixi";

import deck from "../poker/card-deck/deck";
import shuffle from "../poker/logic/shuffle";

function poker() {

  const [IO, setIO] = useState(null);

  useEffect(() => {
    console.log(deck);
    deck = shuffle(deck);
    console.log(deck);
  }, []);

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
          <Sprite x={342} y={50.5} image="/images/poker.png" />
          <TilingSprite
            x={342} y={50.5}
            image={"/images/card-deck.png"}
            width={49}
            height={76}
            tilePosition={{ x: -49, y: -76 }}
            tileScale={{ x: .5, y: .5 }}
          />
          <TilingSprite
            x={250} y={150}
            image={"/images/card-deck.png"}
            width={49}
            height={76}
            tilePosition={{ x: -49, y: -76 }}
            tileScale={{ x: .5, y: .5 }}
          />
        </Container>
      </Stage>
    </Box>
  );
}

export default poker;
