import { authentication } from '../firebase/firebase-config'
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

const provider = new GoogleAuthProvider();

// sign in with google
export const GoogleSignIn = ()=> {
  signInWithPopup(authentication, provider)
  .then((result) => {
    // This gives  a Google Access Token.
  const credential = GoogleAuthProvider.credentialFromResult(result);
  const token = credential.accessToken;
  const user = result.user;
}).catch((error) => {
  console.log(error)
  const errorCode = error.code;
  const errorMessage = error.message;
  const email = error.customData.email;
  const credential = GoogleAuthProvider.credentialFromError(error);
  console.log(error)
});
}

// sign out
export const SignOut = ()=> {
  signOut(authentication).then(() => {
    console.log('Sign-out successful.')
  }).catch((error) => {
    console.log(error)
  });
}
