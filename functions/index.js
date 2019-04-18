// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');
const servicesAccount = require('./service-account.json');
admin.initializeApp({
    credential: admin.credential.cert(servicesAccount),
    storageBucket: "interviewme-eed96.appspot.com"
});

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
    // If it was uploaded on the questions folder, so it's an audio for the question and a reference
    // to it should be registered on the questions collection on Firestore
    if(obj.name.includes("questions/")) {
        admin.storage().bucket().file(obj.name).getSignedUrl({
            action: 'read',
            expires: '03-09-2100'
        })
        .then(signedUrls => {
            return admin.firestore().collection('questions').doc().create({
                name: obj.name,
                downloadUrl: signedUrls[0]
            })
        })
        .then(documentData => {
            console.log("Saved question on Firestore");
        })
        .catch(error => {
            console.error("Error saving question on Firestore: " + error);
        })
    }
    // Otherwise, it's an user's answer file and a reference to it should be registered on the
    // users collection on Firestore
    else {
        admin.storage().bucket().file(obj.name).getSignedUrl({
            action: 'read',
            expires: '03-09-2100'
        })
        .then(signedUrls => {
            return admin.firestore().collection('users').doc(obj.metadata.customMetadata.user_uid).update({
                answers: FirebaseFirestore.FieldValue.arrayUnion({
                    questionId: obj.metadata.customMetadata.question_id,
                    downloadUrl: signedUrls[0]
                })
            })
        })
        .then(result => {
            console.log("Saved user's answer on Firestore")
        })
        .catch(error => {
            console.error("Error saving user's answer on Firestore: " + error);
        })
    }
});