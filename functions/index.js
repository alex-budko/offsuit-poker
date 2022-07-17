const functions =  require("firebase-functions")
const admin = require('firebase-admin')

admin.initializeApp()

exports.addMessage = functions.https.onRequest(async (req, res) => {
    // Grab the text parameter.
    const original = req.query.text;
    // Push the new message into Firestore using the Firebase Admin SDK.
    const writeResult = await admin.firestore().collection('messages').add({original: original});
    // Send back a message that we've successfully written the message
    res.json({result: `Message with ID: ${writeResult.id} added.`});
  });

  exports.sendWelcomeEmail = functions.auth.user().onCreate((user) => {
    console.log('Welcome to the WEB!')
  });