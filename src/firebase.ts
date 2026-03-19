import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const storage = getStorage(app);

// Firestore Connection Test
async function testConnection() {
  try {
    // Attempt to fetch a non-existent document to check connectivity
    await getDocFromServer(doc(db, '_connection_test', 'ping'));
    console.log("✅ Firestore connection successful! Data will sync from the cloud.");
  } catch (error: any) {
    if (error.message?.includes('the client is offline')) {
      console.error("❌ Firestore connection failed: Client is offline. Check Firebase configuration.");
    } else if (error.code === 'permission-denied') {
      // Permission denied on a non-existent collection is actually a sign of connectivity
      console.log("✅ Firestore connection established (Permission Denied as expected for test path).");
    } else {
      console.error("❌ Firestore Connection Error:", error.message || error);
    }
  }
}

testConnection();
