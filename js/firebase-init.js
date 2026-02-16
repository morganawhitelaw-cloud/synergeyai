if (typeof firebaseConfig === 'undefined') {
    console.error('Firebase config not found. Make sure js/config.js is loaded.');
} else {
    firebase.initializeApp(firebaseConfig);
    // Initialize Firestore and make it globally available
    window.db = firebase.firestore();
}
