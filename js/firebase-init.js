// Firebase Initialization
// Depends on firebaseConfig being defined (e.g., in js/config.js)

if (typeof firebaseConfig === 'undefined') {
    console.error('Firebase configuration not found. Please ensure js/config.js is loaded before js/firebase-init.js');
} else {
    // Initialize Firebase
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }

    // Initialize Firestore and make it globally available
    // Using window.db ensures it's accessible across all scripts
    window.db = firebase.firestore();

    console.log('Firebase initialized successfully');
}
