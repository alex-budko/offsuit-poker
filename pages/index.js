import {GoogleSignIn} from '../components/auth'
import styles from '../styles/Home.module.css'
import { useAuthState } from 'react-firebase-hooks/auth';
import { authentication } from '../firebase/firebase-config';
export default function Home() {

  const [user, loading, error] = useAuthState(authentication);
  if (loading) {
    return (
      <div>
        <p>Initialising User...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div>
        <p>Error: {error}</p>
      </div>
    );
  }
  if (user) {
    return (
      <div>
        <p>Current User: {user.email}</p>
      </div>
    );
  } else {
    return (
      <div className={styles.container}>
        <p onClick={GoogleSignIn}>Sign In With Google</p>
      </div>
    )
  }
}
