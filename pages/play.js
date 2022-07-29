import { useState } from "react";
import {
  Stack,
  FormControl,
  Input,
  Button,
  useColorModeValue,
  Heading,
  Text,
  Container,
  Flex,
} from "@chakra-ui/react";
import { CheckIcon } from "@chakra-ui/icons";
import { uuid } from "uuidv4";

export default function play() {
  const [state, setState] = useState(["initial" | "submitting" | "success"]);
  const [error, setError] = useState(false);

  const copyLink = (e) => {
    e.preventDefault();

    setError(false);
    setState("submitting");

    setTimeout(() => {
      setState("success");
    }, 1000);

    const t = e.target[0];
    t.select();
    t.setSelectionRange(0, 99999); /* For mobile devices */

    navigator.clipboard.writeText(t.value);
  };

  return (
    <Flex
      minH={"100vh"}
      align={"center"}
      mt={"-10"}
      bg={useColorModeValue("gray.50", "gray.800")}
    >
      <Container
        maxW={"lg"}
        bg={useColorModeValue("white", "whiteAlpha.100")}
        boxShadow={"xl"}
        rounded={"lg"}
        p={6}
        direction={"column"}
      >
        <Heading
          as={"h2"}
          fontSize={{ base: "xl", sm: "2xl" }}
          textAlign={"center"}
          mb={5}
        >
          Create Room Code
        </Heading>
        <Stack
          onSubmit={(e) => copyLink(e)}
          direction={{ base: "column", md: "row" }}
          as={"form"}
          spacing={"12px"}
        >
          <FormControl>
            <Input
              variant={"solid"}
              borderWidth={1}
              color={useColorModeValue("black.700", "white.700")}
              _placeholder={{
                color: "gray.400",
              }}
              borderColor={useColorModeValue("gray.300", "gray.700")}
              required
              placeholder={"Code"}
              name={"playing_link"}
              value={`http://localhost:3000/poker/${uuid()}`}
              disabled={true}
            />
          </FormControl>
          <FormControl w={{ base: "100%", md: "40%" }}>
            <Button
              colorScheme={state === "success" ? "green" : "blue"}
              isLoading={state === "submitting"}
              w="100%"
              type={state === "success" ? "button" : "submit"}
            >
              {state === "success" ? <CheckIcon /> : "Copy"}
            </Button>
          </FormControl>
        </Stack>
        <Text
          mt={2}
          textAlign={"center"}
          color={error ? "red.500" : "gray.500"}
        >
          {error
            ? "Oh no an error occured! 😢 Please try again later."
            : "Enjoy ✌️"}
        </Text>
      </Container>
    </Flex>
  );
}
