import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged, User } from "firebase/auth";
import { getFirestore, doc, getDocFromServer, Firestore } from "firebase/firestore";

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  firestoreDatabaseId?: string;
}

let firebaseApp: any = null;
let firebaseAuth: any = null;
let firestoreDb: Firestore | null = null;
let currentUser: User | null = null;
let isInitialized = false;

export async function initFirebase(): Promise<{ auth: any; db: Firestore | null; user: User | null }> {
  if (isInitialized) {
    return { auth: firebaseAuth, db: firestoreDb, user: currentUser };
  }

  try {
    let config: FirebaseConfig;
    try {
      const response = await fetch("/firebase-applet-config.json");
      if (!response.ok) {
        throw new Error("Could not find firebase-applet-config.json");
      }
      const contentType = response.headers.get("content-type");
      if (contentType && !contentType.includes("application/json")) {
        throw new Error("Response is not JSON");
      }
      config = await response.json();
      if (!config.apiKey || !config.projectId) {
        throw new Error("Invalid Firebase configuration payload");
      }
    } catch (fetchErr) {
      console.warn("Could not fetch firebase-applet-config.json dynamically, falling back to bundled config:", fetchErr);
      config = {
        projectId: "gen-lang-client-0042070778",
        appId: "1:193227941175:web:8aa1c17257d04ec110e6b2",
        apiKey: "AIzaSyB7SR60YgjyNyhZiRq03nIb17kUgOZ-eSc",
        authDomain: "gen-lang-client-0042070778.firebaseapp.com",
        firestoreDatabaseId: "ai-studio-acompanhamentode-407cf176-0ed3-4ff4-b77e-b612b0adfeb7",
        storageBucket: "gen-lang-client-0042070778.firebasestorage.app",
        messagingSenderId: "193227941175"
      };
    }

    if (getApps().length === 0) {
      firebaseApp = initializeApp(config);
    } else {
      firebaseApp = getApp();
    }

    firebaseAuth = getAuth(firebaseApp);
    
    // Support custom database ID if defined
    if (config.firestoreDatabaseId) {
      firestoreDb = getFirestore(firebaseApp, config.firestoreDatabaseId);
    } else {
      firestoreDb = getFirestore(firebaseApp);
    }

    // Authenticate user anonymously to establish secure connection
    try {
      currentUser = await new Promise((resolve, reject) => {
        const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
          unsubscribe();
          resolve(user);
        }, (err) => {
          unsubscribe();
          reject(err);
        });
      });

      if (!currentUser) {
        const credential = await signInAnonymously(firebaseAuth);
        currentUser = credential.user;
      }
    } catch (authErr) {
      console.warn("Firebase anonymous authentication failed (it might be disabled in the Firebase console). Firestore database will still be used without Auth:", authErr);
    }

    // Test connection as per critical guidelines
    if (firestoreDb) {
      try {
        await getDocFromServer(doc(firestoreDb, "test", "connection"));
      } catch (error) {
        if (error instanceof Error && error.message.includes("the client is offline")) {
          console.warn("Firebase client is currently offline.");
        }
      }
    }

    isInitialized = true;
    console.log("Firebase initialized successfully with UID:", currentUser?.uid);
    return { auth: firebaseAuth, db: firestoreDb, user: currentUser };
  } catch (error) {
    console.warn("Firebase failed to initialize, falling back to local database:", error);
    return { auth: null, db: null, user: null };
  }
}

export function getFirebaseInstance() {
  return {
    auth: firebaseAuth,
    db: firestoreDb,
    user: currentUser,
    isInitialized
  };
}
