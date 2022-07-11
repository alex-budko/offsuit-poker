import { useAuthState } from 'react-firebase-hooks/auth';
import { authentication } from '../firebase/firebase-config';
import { GoogleSignIn, SignOut } from '../components/auth'
import Loading from '../components/Loading';
import Navbar from '../components/Navbar';


export default function Home() {
  const [user, loading, error] = useAuthState(authentication);
  return <Navbar />
  
  // if (loading) {
  //   return (
  //     <div>
  //       <p>Initialising User...</p>
  //       <Loading />
  //     </div>
  //   );
  // }
  // if (error) {
  //   return (
  //     <div>
  //       <p>Error: {error}</p>
  //     </div>
  //   );
  // }
  // if (user) {
  //   return (
  //     <>
  //       <Navbar />
  //     </>
  //   );
  // } else {
  //   return (
  //     <div>
  //       <p onClick={GoogleSignIn}>Sign In With Google</p>
  //     </div>
  //   )
  // }
}
