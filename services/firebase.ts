import { initializeApp } from "firebase/app";
import { initializeFirestore, persistentLocalCache, doc, setDoc, getDoc, collection, getDocs, updateDoc, addDoc, serverTimestamp, getDocFromServer, getDocFromCache, getDocsFromCache, getDocsFromServer, query, where } from "firebase/firestore";
import { getAuth, signInAnonymously, signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { UserData } from '../types';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, { localCache: persistentLocalCache() }, firebaseConfig.firestoreDatabaseId);

export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const isMockFirebase = !firebaseConfig.apiKey || firebaseConfig.apiKey.includes('remixed') || firebaseConfig.projectId.includes('remixed');

const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
    if (isMockFirebase) throw new Error("Firebase configuration is not set up (using mock credentials).");
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
};

export const signInAsGuest = async () => {
    if (isMockFirebase) throw new Error("Firebase configuration is not set up (using mock credentials).");
    const result = await signInAnonymously(auth);
    return result.user;
};

export const signUpWithEmail = async (email: string, pass: string) => {
    if (isMockFirebase) throw new Error("Firebase configuration is not set up (using mock credentials).");
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    return result.user;
};

export const loginWithEmail = async (email: string, pass: string) => {
    if (isMockFirebase) throw new Error("Firebase configuration is not set up (using mock credentials).");
    const result = await signInWithEmailAndPassword(auth, email, pass);
    return result.user;
};

export const signOut = async () => {
    if (isMockFirebase) return;
    await firebaseSignOut(auth);
};

// --- Firestore Generic Functions ---

// 1. Save basic user data
export const saveBasicUserData = async (userId: string, email: string | null, displayName: string | null) => {
    try {
        const userRef = doc(db, "users", userId);
        await setDoc(userRef, {
            email: email || "guest",
            displayName: displayName || "Guest User",
            lastLogin: serverTimestamp()
        }, { merge: true });
    } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `users/${userId}`);
    }
};

// 2. Add app data to a subcollection
export const addAppData = async (userId: string, collectionName: string, data: any) => {
    try {
        const subColRef = collection(db, "users", userId, collectionName);
        const cleanData = sanitizeData(data);
        const docRef = await addDoc(subColRef, {
            ...cleanData,
            createdAt: serverTimestamp()
        });
        return docRef.id;
    } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, `users/${userId}/${collectionName}`);
        return null;
    }
};

// 3. Read app data from a subcollection
export const getAppData = async (userId: string, collectionName: string) => {
    try {
        const subColRef = collection(db, "users", userId, collectionName);
        const snapshot = await getDocs(subColRef);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
        handleFirestoreError(e, OperationType.LIST, `users/${userId}/${collectionName}`);
        return [];
    }
};

// 4. Update specific app data document
export const updateAppData = async (userId: string, collectionName: string, docId: string, data: any) => {
    try {
        const docRef = doc(db, "users", userId, collectionName, docId);
        const cleanData = sanitizeData(data);
        await updateDoc(docRef, {
            ...cleanData,
            updatedAt: serverTimestamp()
        });
        return true;
    } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `users/${userId}/${collectionName}/${docId}`);
        return false;
    }
};

export const getUserProgress = async (userId: string) => {
    try {
        const docRef = doc(db, "user_progress", userId);
        const docSnap = await getDoc(docRef);

        if (docSnap && docSnap.exists()) {
            return docSnap.data().data as UserData;
        }
        return null;
    } catch (e) {
        handleFirestoreError(e, OperationType.GET, `user_progress/${userId}`);
        return null;
    }
};

export const upsertUserProgress = async (userId: string, userData: UserData) => {
    try {
        const docRef = doc(db, "user_progress", userId);
        // Sanitize data to remove undefined values
        const cleanData = sanitizeData(userData);
        await setDoc(docRef, {
            user_id: userId,
            data: cleanData,
            updated_at: serverTimestamp()
        }, { merge: true });
    } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `user_progress/${userId}`);
    }
};

// Helper to remove undefined values (Firestore doesn't like them)
const sanitizeData = (data: any): any => {
    if (Array.isArray(data)) {
        return data.map(sanitizeData);
    } else if (data !== null && typeof data === 'object') {
        return Object.entries(data).reduce((acc, [key, value]) => {
            if (value !== undefined) {
                acc[key] = sanitizeData(value);
            }
            return acc;
        }, {} as any);
    }
    return data;
};

export const saveLessonToFirebase = async (
    targetLang: string,
    level: string,
    dayNumber: number, 
    stage: string, 
    data: any
) => {
    try {
        const docId = `${targetLang}_${level}_day${dayNumber}`;
        const docRef = doc(db, "lessons", docId);
        
        // Sanitize data to remove undefined values
        const cleanData = sanitizeData(data);

        await setDoc(docRef, {
            targetLang,
            level,
            dayNumber,
            [stage]: cleanData,
            lastUpdated: serverTimestamp()
        }, { merge: true });
        
        console.log(`✅ تم الحفظ في فايربيس بنجاح: ${docId} (${stage})`);
    } catch (e: any) {
        handleFirestoreError(e, OperationType.WRITE, `lessons/${targetLang}_${level}_day${dayNumber}`);
    }
};

export const getLessonsMetadata = async (targetLang: string, level: string) => {
    try {
        const q = query(
            collection(db, "lessons"),
            where("targetLang", "==", targetLang),
            where("level", "==", level)
        );
        const querySnapshot = await getDocs(q);
        const metadata: any[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.metadata && data.metadata.topic) {
                metadata.push({
                    dayNumber: data.dayNumber,
                    topic: data.metadata.topic
                });
            } else if (data.topic) { // Fallback if topic is at root
                 metadata.push({
                    dayNumber: data.dayNumber,
                    topic: data.topic
                });
            }
        });
        
        // If Firebase is empty, try to fetch the first few days statically to build metadata
        if (metadata.length === 0) {
            const fetchFn = typeof window !== 'undefined' && window.fetch ? window.fetch.bind(window) : fetch;
            for (let i = 1; i <= 100; i++) {
                try {
                    let res = await fetchFn(`/lessons/${targetLang}/${level}/day${i}.json`);
                    if (!res.ok) {
                        res = await fetchFn(`/lessons/${targetLang}/day${i}.json`);
                    }
                    if (res.ok) {
                        const data = await res.json();
                        // Removing level strict mismatch check to ensure all local files appear
                        if (data.metadata && data.metadata.topic) {
                            metadata.push({ dayNumber: data.dayNumber || i, topic: data.metadata.topic });
                        } else if (data.topic) {
                            metadata.push({ dayNumber: data.dayNumber || i, topic: data.topic });
                        }
                    } else {
                        break; // Stop at first missing file to avoid 50 404s
                    }
                } catch (e) {
                    break;
                }
            }
        }
        
        return metadata.sort((a, b) => a.dayNumber - b.dayNumber);
    } catch (e) {
        console.error("Error fetching lesson metadata:", e);
        return [];
    }
};

export const getLessonFromFirebase = async (
    targetLang: string,
    level: string,
    dayNumber: number
) => {
    try {
        // Fallback or override: fetch statically from the public directory.
        try {
            const fetchFn = typeof window !== 'undefined' && window.fetch ? window.fetch.bind(window) : fetch;
            
            // Try with level directory first
            console.log(`[getLessonFromFirebase] Attempting static fetch for /lessons/${targetLang}/${level}/day${dayNumber}.json`);
            let res = await fetchFn(`/lessons/${targetLang}/${level}/day${dayNumber}.json`);
            
            if (!res.ok) {
                // Try without level directory as a fallback
                console.log(`[getLessonFromFirebase] Fallback: Attempting static fetch for /lessons/${targetLang}/day${dayNumber}.json`);
                res = await fetchFn(`/lessons/${targetLang}/day${dayNumber}.json`);
            }
            
            if (res.ok) {
                const data = await res.json();
                
                console.log(`[getLessonFromFirebase] Static fetch successful for day ${dayNumber}`);
                return data;
            } else {
                console.log(`[getLessonFromFirebase] Static fetch failed with status ${res.status}`);
            }
        } catch (staticErr) {
            console.log("[getLessonFromFirebase] Static fetch failed with exception, falling back to Firebase:", staticErr);
        }

        const docId = `${targetLang}_${level}_day${dayNumber}`;
        const docRef = doc(db, "lessons", docId);
        
        // Fetch normally: will read from cache first but instantly sync from server
        // if connected. This ensures uploaded lessons are visible.
        const docSnap = await getDoc(docRef);

        if (docSnap && docSnap.exists()) {
            return docSnap.data();
        } else {
            return null;
        }
    } catch (e) {
        handleFirestoreError(e, OperationType.GET, `lessons/${targetLang}_${level}_day${dayNumber}`);
        return null;
    }
};

export const importLessonsFromJson = async (jsonData: any) => {
    try {
        let lessonsArray = [];
        if (Array.isArray(jsonData)) {
            lessonsArray = jsonData;
        } else if (typeof jsonData === 'object') {
            if (jsonData.targetLang && jsonData.dayNumber !== undefined) {
                // It's a single lesson object
                lessonsArray = [jsonData];
            } else {
                // If it's an object, maybe it's a map of id -> lesson
                lessonsArray = Object.values(jsonData);
            }
        }

        let count = 0;
        for (const lesson of lessonsArray) {
            const targetLang = lesson.targetLang;
            const dayNumber = lesson.dayNumber;
            const level = lesson.level || (lesson.metadata && lesson.metadata.level) || 'A1';
            
            if (!targetLang || dayNumber === undefined) {
                console.warn("Skipping invalid lesson format (missing targetLang or dayNumber):", lesson);
                continue;
            }

            const docId = `${targetLang}_${level}_day${dayNumber}`;
            const docRef = doc(db, "lessons", docId);
            
            const cleanData = sanitizeData(lesson);
            cleanData.lastUpdated = serverTimestamp();

            await setDoc(docRef, cleanData, { merge: true });
            count++;
        }
        
        return { success: true, count };
    } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `lessons/import`);
        return { success: false, error: e };
    }
};
