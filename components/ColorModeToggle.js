import { Button, Box, useColorMode } from '@chakra-ui/react';
import { BsSun, BsMoonStarsFill } from 'react-icons/bs';

export default function ColorModeToggle(props) {
  const { colorMode, toggleColorMode } = useColorMode();
  return (
    <Box h="1vh" ml='3vw' mt='2vh' justifyContent="center" alignItems="center">
      <Button
        aria-label="Toggle Color Mode"
        onClick={toggleColorMode}
        _focus={{ boxShadow: 'none' }}
        w="fit-content"
        {...props}>
        {colorMode === 'light' ? <BsMoonStarsFill /> : <BsSun />}
      </Button>
    </Box>
  );
}