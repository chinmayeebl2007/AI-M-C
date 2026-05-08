// backend/firebase.js - Firebase Configuration (Optional)
// For now, we're using in-memory storage. 
// This file is a placeholder for future Firebase integration.

/*
TO SETUP FIREBASE (Optional - for production):

1. Go to https://console.firebase.google.com/
2. Create a new project
3. Go to Project Settings > Service Accounts
4. Click "Generate New Private Key"
5. Save the JSON file
6. Place it in this folder as service-account-key.json

Then uncomment the code below:
*/

/*
const admin = require('firebase-admin');

let db = null;

function initFirebase() {
    try {
        // For development with service account
        const serviceAccount = require('./service-account-key.json');
        
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        
        db = admin.firestore();
        console.log('✅ Firebase initialized successfully');
        return true;
    } catch (error) {
        console.log('⚠️ Firebase not configured, using in-memory storage');
        return false;
    }
}

// Save data to Firestore
async function saveToFirestore(collection, data) {
    if (!db) return null;
    const docRef = await db.collection(collection).add(data);
    return docRef.id;
}

// Get data from Firestore
async function getFromFirestore(collection, query = null) {
    if (!db) return [];
    const snapshot = await db.collection(collection).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Update data in Firestore
async function updateInFirestore(collection, id, data) {
    if (!db) return null;
    await db.collection(collection).doc(id).update(data);
    return true;
}

// Delete from Firestore
async function deleteFromFirestore(collection, id) {
    if (!db) return null;
    await db.collection(collection).doc(id).delete();
    return true;
}

module.exports = {
    initFirebase,
    saveToFirestore,
    getFromFirestore,
    updateInFirestore,
    deleteFromFirestore,
    db
};
*/

// For now, just export empty functions (using in-memory storage)
console.log('📦 Using in-memory storage (Firebase not configured)');

module.exports = {
    initFirebase: () => { console.log('⚠️ Firebase not configured, using in-memory'); return false; },
    saveToFirestore: async () => null,
    getFromFirestore: async () => [],
    updateInFirestore: async () => null,
    deleteFromFirestore: async () => null,
    db: null
};