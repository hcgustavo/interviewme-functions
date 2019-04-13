// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');
admin.initializeApp();

/**
 * Triggered wher a new user is created
 * Action: creates the user's register on Firestore
 */
exports.onNewUserCreated = functions.auth.user().onCreate((user) => {
    
});

/**
 * Triggered when new a new object is created in the bucket
 * Action: create object's register on Firestore (it can be a question or an user's recorded answer)
 */
exports.onNewAudioUploaded = functions.storage.object().onFinalize((obj) => {
    console.log("Audio id = " + obj.id);
});