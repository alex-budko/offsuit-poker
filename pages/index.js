import { useAuthState } from 'react-firebase-hooks/auth';
import { authentication } from '../firebase/firebase-config';
import { GoogleSignIn, SignOut } from '../components/auth'
import Hero from '../components/Hero'


export default function Home() {
  return (
    <>
      <Hero />
    </>
  )
}
