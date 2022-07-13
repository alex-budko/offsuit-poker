import { ChakraProvider } from '@chakra-ui/react'
import Layout from '../layout/Layout'
import ColorModeToggle from '../components/ColorModeToggle';

function MyApp({ Component, pageProps }) {
  return (
    <ChakraProvider>
      <Layout>
        <ColorModeToggle />
        <Component {...pageProps} />
      </Layout>
    </ChakraProvider>
  )}

export default MyApp
