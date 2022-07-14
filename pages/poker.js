import { useEffect, useState, useRef } from "react";
import { Box, Button, Center, Input } from "@chakra-ui/react";
import io from "socket.io-client";

import deck from "../poker/card-deck/deck";
import shuffle from "../poker/logic/shuffle";

function poker() {
  const [IO, setIO] = useState(null);
  useEffect(() => {
    console.log(deck)
    deck = shuffle(deck)
    console.log(deck)
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

  return <Box h={"79vh"}></Box>;
}

export default poker;
