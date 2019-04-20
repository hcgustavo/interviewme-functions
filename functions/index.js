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
        interviews: []
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
        .then(result => {
            console.log("Saved question on Firestore");
        })
        .catch(error => {
            console.error("Error saving question on Firestore: " + error);
        })
    }
});

/**
 * Listens for deletion of an interview from user's list
 */
exports.onUserInterviewDeleted = functions.firestore.document('/users/{userUid}').onUpdate((snap) => {
    let before = snap.before.data();
    let after = snap.after.data();

    // Get id of deleted interview
    if(after.interviews.length < before.interviews.length) {
        let removedId = "";
        before.interviews.forEach(interview => {
            if(!after.interviews.includes(interview)) {
                removedId = interview;
            }
        })

        admin.firestore().collection('interviews').doc(removedId).delete()
        .then(deleteResult => {
            console.log(`Deleted ${removedId} from 'interviews' collection`);
        })
        .catch(error => {
            console.error(`Error deleting ${removedId} from 'interviews' collection: ` + error);
        })
    }
});

/**
 * Listens for deletion of an interview from interviews collection
 */
exports.onInterviewDeleted = functions.firestore.document('/interviews/{interviewId}').onDelete((snap) => {
    let answersToDeletePromises = [];
    snap.data().answers.forEach(answer => {
        answersToDeletePromises.push(admin.firestore().collection('answers').doc(answer).delete());
    })
    Promise.all(answersToDeletePromises)
    .then(answersResults => {
        console.log("Deleted answers from 'answers' collection");
    })
    .catch(error => {
        console.error("Error deleting answers from 'answers' collection: " + error);
    })

});

/**
 * Listens from deletion of an answer from answers collection
 */
exports.onAnswerDeleted = functions.firestore.document('/answers/{answerId}').onDelete((snap) => {
    let name = snap.data().name;
    admin.storage().bucket().file(name).delete()
    .then(deleteResult => {
        console.log(`Deleted file ${name} from storage`);
    })
    .catch(error => {
        console.error(`Error deleting file ${name} from storage`);
    })
});