import { FcGoogle } from "react-icons/fc";
import { FaFacebook } from "react-icons/fa";
import { SiLinkedin, SiMessenger } from "react-icons/si";
import { Box, Button, Center, Stack, Text } from "@chakra-ui/react";
import { GoogleSignIn } from "../components/Auth";
import { useAuthState } from 'react-firebase-hooks/auth';
import { authentication } from "../firebase/firebase-config";

export default function Signin() {

  const [user] = useAuthState(authentication);

  if (user) {
    window.location = '/'
  }

  return (
    <Box h={"79vh"}>
      <Center p={8}>
        <Stack spacing={2} align={"center"} maxW={"md"} w={"full"}>
          {/* Facebook */}
          <Button w={"full"}  colorScheme={"facebook"} leftIcon={<FaFacebook />}>
            <Center>
              <Text>Continue with Facebook</Text>
            </Center>
          </Button>

          {/* Google */}
          <Button w={"full"} onClick={()=> GoogleSignIn()} variant={"outline"} leftIcon={<FcGoogle />}>
            <Center>
              <Text>Continue with Google</Text>
            </Center>
          </Button>

          {/* LinkedIn */}
          <Button
            w={"full"}
            colorScheme={"messenger"}
            leftIcon={<SiLinkedin />}
          >
            <Center>
              <Text>Continue with Linkedin</Text>
            </Center>
          </Button>

          {/* Messenger */}
          <Button
            w={"full"}
            colorScheme={"messenger"}
            leftIcon={<SiMessenger />}
          >
            <Center>
              <Text>Continue with Messenger</Text>
            </Center>
          </Button>
        </Stack>
      </Center>
    </Box>
  );
}
