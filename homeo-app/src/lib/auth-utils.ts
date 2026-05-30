import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
function initFirebaseAdmin() {
  if (admin.apps.length > 0) return admin.app();

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.warn('Firebase Admin variables missing. Authentication features will fail.');
    return null;
  }

  // Handle literal "\n" characters in env variables (common Vercel/NextJS gotcha)
  if (privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  } else if (!privateKey.includes('\n')) {
    // If it's just one long string without newlines, we might have an issue parsing it
    // But we'll try to let firebase-admin handle it.
  }

  try {
    return admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  } catch (error) {
    console.error('Firebase Admin initialization error', error);
    return null;
  }
}

const adminApp = initFirebaseAdmin();

/**
 * Verifies a Firebase ID token and returns the decoded user data.
 * Throws an error if the token is invalid or missing.
 */
export async function verifyFirebaseToken(authHeader: string | null) {
  if (!adminApp) {
    throw new Error('Firebase Admin not initialized');
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid Authorization header');
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying Firebase token:', error);
    throw new Error('Invalid authentication token');
  }
}

/**
 * For Demo mode only: creates a custom token for the given phone number
 */
export async function createDemoCustomToken(phone: string) {
  if (!adminApp) throw new Error('Firebase Admin not initialized');
  
  try {
    // Create or get user
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByPhoneNumber(phone);
    } catch (e: any) {
      if (e.code === 'auth/user-not-found') {
        userRecord = await admin.auth().createUser({ phoneNumber: phone });
      } else {
        throw e;
      }
    }
    
    // Create custom token
    const customToken = await admin.auth().createCustomToken(userRecord.uid);
    return customToken;
  } catch (error) {
    console.error('Error creating custom token:', error);
    throw new Error('Failed to create demo session');
  }
}
