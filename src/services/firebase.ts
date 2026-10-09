import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getDatabase, Database } from 'firebase/database';
import { getAuth, Auth, signInAnonymously } from 'firebase/auth';
import firebaseConfigJson from '../../firebase-applet-config.json';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
  auth?: Auth | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let rtdb: Database | null = null;
let auth: Auth | null = null;
let isConfigured = false;
let authReady: Promise<void> = Promise.resolve();

try {
  const config = firebaseConfigJson;
  if (config && config.projectId && config.apiKey) {
    if (!getApps().length) {
      app = initializeApp(config);
    } else {
      app = getApps()[0];
    }

    db = config.firestoreDatabaseId
      ? getFirestore(app, config.firestoreDatabaseId)
      : getFirestore(app);
    // Realtime Database carries ephemeral active-match state; Firestore is reserved for rankings.
    if (config.databaseURL) {
      rtdb = getDatabase(app, config.databaseURL);
    }

    auth = getAuth(app);
    isConfigured = true;

    authReady = (async () => {
      if (auth!.currentUser) return;
      try {
        await signInAnonymously(auth!);
      } catch (error) {
        console.warn('Anonymous Firebase Auth unavailable:', error);
      }
    })();
  }
} catch (e) {
  console.info('Firebase initialization status:', e);
}

export async function ensureFirebaseAuth(): Promise<boolean> {
  if (!isConfigured || !auth) return false;

  await authReady;

  // Firebase Auth can fail transiently during the first page load. Retry
  // here instead of leaving the app with a null currentUser forever.
  if (!auth.currentUser) {
    try {
      await signInAnonymously(auth);
    } catch (error) {
      console.warn('Firebase anonymous auth retry failed:', error);
    }
  }

  return !!auth.currentUser;
}

export { app, db, rtdb, auth, isConfigured };
