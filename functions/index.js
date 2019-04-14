// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');
admin.initializeApp();

/**
 * Triggered when a new user is created
 * Action: creates the user's register on Firestore
 */
exports.onNewUserCreated = functions.auth.user().onCreate((user) => {
    admin.firestore().collection("users").doc(user.uid).create({
        answers: []
    })
});

/**
 * Triggered when an user is deleted
 * Action: delete user's register from Firestore
 */
exports.onDeletedUser = functions.auth.user().onDelete((user) => {
    admin.firestore().collection("users").doc(user.uid).delete();
});

/**
 * Triggered when new a new object is created in the bucket
 * Action: create object's register on Firestore (it can be a question or an user's recorded answer)
 */
exports.onNewAudioUploaded = functions.storage.object().onFinalize((obj) => {
    console.log("Audio id = " + obj.id);
});