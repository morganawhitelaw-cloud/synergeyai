let db;

// Initialize Firebase
if (typeof firebaseConfig === 'undefined') {
    console.error('Firebase configuration not found. Please ensure js/config.js is loaded correctly.');
} else {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
}
