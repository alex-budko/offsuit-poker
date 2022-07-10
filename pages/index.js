import { useAuthState } from 'react-firebase-hooks/auth';
import { authentication } from '../firebase/firebase-config';
import Loading from '../components/Loading';


import { GoogleSignIn, SignOut } from '../components/auth'


export default function Home() {
  const [user, loading, error] = useAuthState(authentication);
  if (loading) {
    return (
      <div>
        <p>Initialising User...</p>
        <Loading />
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
      <>
        <div>
          <p>Current User Name: {user.displayName}</p>
          <p>Current User Email: {user.email}</p>
        </div>
        <div>
          <p onClick={SignOut}>Sign Me Out</p>
        </div>
      </>
    );
  } else {
    return (
      <div>
        <p onClick={GoogleSignIn}>Sign In With Google</p>
      </div>
    )
  }
}
