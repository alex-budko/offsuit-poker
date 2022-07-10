import {authentication} from '../firebase/firebase-config'
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const provider = new GoogleAuthProvider();

export const GoogleSignIn = ()=> {
  signInWithPopup(authentication, provider)
  .then((result) => {
    // This gives  a Google Access Token.
  const credential = GoogleAuthProvider.credentialFromResult(result);
  const token = credential.accessToken;
  const user = result.user;
  console.log(user)
}).catch((error) => {
  console.log(error)
  const errorCode = error.code;
  const errorMessage = error.message;
  const email = error.customData.email;
  const credential = GoogleAuthProvider.credentialFromError(error);
});
}
