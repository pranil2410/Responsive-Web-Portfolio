import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, updateDoc, increment, collection, addDoc, getDocs, query, orderBy } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";

// Firebase Config structure
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || ""
};

// Check if valid credentials are provided
const isFirebaseConfigured = 
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== "YOUR_API_KEY" &&
  firebaseConfig.projectId;

let app;
let firestoreDb: any = null;
let firebaseStorage: any = null;
let firebaseAuth: any = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    firestoreDb = getFirestore(app);
    firebaseStorage = getStorage(app);
    firebaseAuth = getAuth(app);
    console.log("Firebase initialized successfully.");
  } catch (error) {
    console.error("Failed to initialize Firebase, falling back to Mock Mode:", error);
  }
} else {
  console.log("No valid Firebase credentials found. Running in Offline/Mock Mode.");
}

export const isOfflineMode = !firestoreDb;

// Default Static Fallbacks (Links)
import defaultLinks from "../data/links.json";

// Dynamic Fallback Store (Local Storage Keys)
const KEYS = {
  LINKS: "portfolio_links",
  VISITORS: "portfolio_visitors",
  DOWNLOADS: "portfolio_downloads",
  MESSAGES: "portfolio_messages",
  ANALYTICS_PROJECTS: "portfolio_analytics_projects",
  RESUMES: "portfolio_resumes_data",
  AUTH_USER: "portfolio_auth_user"
};

// ----------------------------------------------------
// DATABASE SERVICES (Polymorphic fallback)
// ----------------------------------------------------
export const dbService = {
  // 1. LINK MANAGEMENT
  async getLinks(): Promise<typeof defaultLinks> {
    if (!isOfflineMode) {
      try {
        const docRef = doc(firestoreDb, "config", "links");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          return docSnap.data() as typeof defaultLinks;
        } else {
          // If Firestore is empty, seed it with default links
          await setDoc(docRef, defaultLinks);
          return defaultLinks;
        }
      } catch (err) {
        console.error("Firestore getLinks error, using localStorage:", err);
      }
    }
    const local = localStorage.getItem(KEYS.LINKS);
    if (!local) {
      localStorage.setItem(KEYS.LINKS, JSON.stringify(defaultLinks));
      return defaultLinks;
    }
    return JSON.parse(local);
  },

  async saveLinks(links: typeof defaultLinks): Promise<void> {
    if (!isOfflineMode) {
      try {
        const docRef = doc(firestoreDb, "config", "links");
        await setDoc(docRef, links);
        return;
      } catch (err) {
        console.error("Firestore saveLinks error, using localStorage:", err);
      }
    }
    localStorage.setItem(KEYS.LINKS, JSON.stringify(links));
  },

  // 2. VISITOR COUNTER
  async incrementVisitorCount(): Promise<number> {
    if (!isOfflineMode) {
      try {
        const docRef = doc(firestoreDb, "analytics", "visitors");
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
          await setDoc(docRef, { count: 1 });
          return 1;
        } else {
          await updateDoc(docRef, { count: increment(1) });
          return (docSnap.data().count || 0) + 1;
        }
      } catch (err) {
        console.error("Firestore visitor increment error:", err);
      }
    }
    const local = localStorage.getItem(KEYS.VISITORS) || "0";
    const newCount = parseInt(local, 10) + 1;
    localStorage.setItem(KEYS.VISITORS, newCount.toString());
    return newCount;
  },

  async getVisitorCount(): Promise<number> {
    if (!isOfflineMode) {
      try {
        const docRef = doc(firestoreDb, "analytics", "visitors");
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? (docSnap.data().count || 0) : 0;
      } catch (err) {
        console.error("Firestore getVisitorCount error:", err);
      }
    }
    return parseInt(localStorage.getItem(KEYS.VISITORS) || "0", 10);
  },

  // 3. RESUME DOWNLOAD COUNTER
  async incrementDownloadCount(roleId: string): Promise<number> {
    if (!isOfflineMode) {
      try {
        const docRef = doc(firestoreDb, "analytics", "downloads");
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
          await setDoc(docRef, { [roleId]: 1 });
          return 1;
        } else {
          await updateDoc(docRef, { [roleId]: increment(1) });
          const freshDoc = await getDoc(docRef);
          return freshDoc.data()?.[roleId] || 1;
        }
      } catch (err) {
        console.error("Firestore incrementDownloadCount error:", err);
      }
    }
    const local = localStorage.getItem(KEYS.DOWNLOADS) || "{}";
    const data = JSON.parse(local);
    data[roleId] = (data[roleId] || 0) + 1;
    localStorage.setItem(KEYS.DOWNLOADS, JSON.stringify(data));
    return data[roleId];
  },

  async getDownloadCounts(): Promise<Record<string, number>> {
    if (!isOfflineMode) {
      try {
        const docRef = doc(firestoreDb, "analytics", "downloads");
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? docSnap.data() : {};
      } catch (err) {
        console.error("Firestore getDownloadCounts error:", err);
      }
    }
    return JSON.parse(localStorage.getItem(KEYS.DOWNLOADS) || "{}");
  },

  // 4. PROJECT CLICKS ANALYTICS
  async incrementProjectClick(projectId: string): Promise<number> {
    if (!isOfflineMode) {
      try {
        const docRef = doc(firestoreDb, "analytics", "project_clicks");
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
          await setDoc(docRef, { [projectId]: 1 });
          return 1;
        } else {
          await updateDoc(docRef, { [projectId]: increment(1) });
          const freshDoc = await getDoc(docRef);
          return freshDoc.data()?.[projectId] || 1;
        }
      } catch (err) {
        console.error("Firestore incrementProjectClick error:", err);
      }
    }
    const local = localStorage.getItem(KEYS.ANALYTICS_PROJECTS) || "{}";
    const data = JSON.parse(local);
    data[projectId] = (data[projectId] || 0) + 1;
    localStorage.setItem(KEYS.ANALYTICS_PROJECTS, JSON.stringify(data));
    return data[projectId];
  },

  async getProjectClicks(): Promise<Record<string, number>> {
    if (!isOfflineMode) {
      try {
        const docRef = doc(firestoreDb, "analytics", "project_clicks");
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? docSnap.data() : {};
      } catch (err) {
        console.error("Firestore getProjectClicks error:", err);
      }
    }
    return JSON.parse(localStorage.getItem(KEYS.ANALYTICS_PROJECTS) || "{}");
  },

  // 5. CONTACT FORM MESSAGES
  async addMessage(msg: { name: string; email: string; message: string; role?: string }): Promise<void> {
    const fullMsg = {
      ...msg,
      timestamp: new Date().toISOString()
    };
    if (!isOfflineMode) {
      try {
        const colRef = collection(firestoreDb, "messages");
        await addDoc(colRef, fullMsg);
        return;
      } catch (err) {
        console.error("Firestore addMessage error:", err);
      }
    }
    const local = localStorage.getItem(KEYS.MESSAGES) || "[]";
    const messages = JSON.parse(local);
    messages.push(fullMsg);
    localStorage.setItem(KEYS.MESSAGES, JSON.stringify(messages));
  },

  async getMessages(): Promise<Array<{ name: string; email: string; message: string; timestamp: string; role?: string }>> {
    if (!isOfflineMode) {
      try {
        const colRef = collection(firestoreDb, "messages");
        const q = query(colRef, orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        const results: any[] = [];
        querySnapshot.forEach((docSnap) => {
          results.push(docSnap.data());
        });
        return results;
      } catch (err) {
        console.error("Firestore getMessages error:", err);
      }
    }
    const local = localStorage.getItem(KEYS.MESSAGES) || "[]";
    return JSON.parse(local).sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
};

// ----------------------------------------------------
// STORAGE SERVICES (Polymorphic fallback)
// ----------------------------------------------------
export const storageService = {
  async uploadResume(file: File, roleId: string): Promise<{ downloadUrl: string; name: string; size: string }> {
    const fileSizeStr = `${(file.size / 1024 / 1024).toFixed(2)} MB`;
    
    if (!isOfflineMode) {
      try {
        const storageRef = ref(firebaseStorage, `resumes/${roleId}_${file.name}`);
        const uploadResult = await uploadBytes(storageRef, file);
        const downloadUrl = await getDownloadURL(uploadResult.ref);
        return {
          downloadUrl,
          name: file.name,
          size: fileSizeStr
        };
      } catch (err) {
        console.error("Firebase Storage upload error, falling back to local:", err);
      }
    }

    // Mock Upload (read file as base64 and save metadata in localStorage)
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        // In local storage, we can mock the URL by storing it locally
        // Since base64 PDFs can be large, we'll store a mock URL but save the file size and name
        const mockUrl = base64data; // Can be used directly as href in frontend!
        
        // Save metadata
        const localResumes = localStorage.getItem(KEYS.RESUMES) || "{}";
        const resumes = JSON.parse(localResumes);
        resumes[roleId] = {
          downloadUrl: mockUrl,
          name: file.name,
          size: fileSizeStr,
          uploadedAt: new Date().toISOString()
        };
        localStorage.setItem(KEYS.RESUMES, JSON.stringify(resumes));
        
        resolve({
          downloadUrl: mockUrl,
          name: file.name,
          size: fileSizeStr
        });
      };
      reader.readAsDataURL(file);
    });
  },

  async getUploadedResume(roleId: string): Promise<{ downloadUrl: string; name: string; size: string } | null> {
    const localResumes = localStorage.getItem(KEYS.RESUMES) || "{}";
    const resumes = JSON.parse(localResumes);
    return resumes[roleId] || null;
  }
};

// ----------------------------------------------------
// AUTHENTICATION SERVICES (Polymorphic fallback)
// ----------------------------------------------------
export const authService = {
  async login(password: string): Promise<boolean> {
    // Admin password check. We can use a simple static password check for easy local deployment,
    // or authenticate against Firebase Auth.
    // If Firebase Auth is setup, we'll try to sign in with email: admin@portfolio.com and password
    const adminEmail = "admin@portfolio.com";
    if (!isOfflineMode) {
      try {
        await signInWithEmailAndPassword(firebaseAuth, adminEmail, password);
        return true;
      } catch (err) {
        console.error("Firebase auth login error:", err);
        // Fallback check if auth user is not created in Firebase Console yet
        if (password === "admin123") {
          localStorage.setItem(KEYS.AUTH_USER, "true");
          return true;
        }
        return false;
      }
    }
    
    // Offline/Local admin password
    if (password === "admin123" || password === "admin") {
      localStorage.setItem(KEYS.AUTH_USER, "true");
      return true;
    }
    return false;
  },

  async logout(): Promise<void> {
    if (!isOfflineMode) {
      try {
        await signOut(firebaseAuth);
      } catch (err) {
        console.error("Firebase auth logout error:", err);
      }
    }
    localStorage.removeItem(KEYS.AUTH_USER);
  },

  async isAuthenticated(): Promise<boolean> {
    if (!isOfflineMode) {
      return new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
          unsubscribe();
          if (user) {
            resolve(true);
          } else {
            resolve(localStorage.getItem(KEYS.AUTH_USER) === "true");
          }
        });
      });
    }
    return localStorage.getItem(KEYS.AUTH_USER) === "true";
  }
};
