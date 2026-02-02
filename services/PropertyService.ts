import { db } from "../firebase";
import { collection, getDocs, doc, setDoc, deleteDoc, writeBatch } from "firebase/firestore";
import { Property } from "../types";
import { PROPERTIES } from "../constants"; // Import your static data

export const PropertyService = {
  // 1. Fetch All Properties
  async fetchProperties(): Promise<Property[]> {
    try {
      const snapshot = await getDocs(collection(db, "properties"));
      if (snapshot.empty) return [];
      
      return snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as Property));
    } catch (error) {
      console.error("Error fetching properties:", error);
      return [];
    }
  },

  // 2. Save Property
  async saveProperty(property: Property) {
    const docRef = property.id 
      ? doc(db, "properties", property.id)
      : doc(collection(db, "properties"));
    
    // Merge true ensures we don't overwrite fields we didn't pass (if any)
    const payload = { ...property, id: docRef.id, updatedAt: new Date().toISOString() };
    await setDoc(docRef, payload, { merge: true });
    return docRef.id;
  },

  // 3. Delete Property
  async deleteProperty(id: string) {
    try {
      await deleteDoc(doc(db, "properties", id));
      return true;
    } catch (error) {
      return false;
    }
  },

  // 4. SEED DATABASE (Run once to migrate constants to DB)
  async seedDatabase() {
    const batch = writeBatch(db);
    
    PROPERTIES.forEach((prop) => {
      // Create a reference for each property
      // We use the existing ID from constants if possible, or new one
      const ref = doc(collection(db, "properties")); 
      batch.set(ref, {
        ...prop,
        id: ref.id, // Ensure ID matches the document
        uploadedAt: new Date().toISOString()
      });
    });

    await batch.commit();
    return true;
  }
};