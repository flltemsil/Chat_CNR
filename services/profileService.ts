import { db, doc, getDoc, setDoc, updateDoc, serverTimestamp } from '../firebase';
import { UserProfile } from '../types';

export const profileService = {
  async getProfile(uid: string): Promise<UserProfile | null> {
    try {
      const docSnap = await getDoc(doc(db, 'users', uid));
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          uid: data.uid,
          name: data.name,
          email: data.email,
          role: data.role,
          isPro: data.isPro || false,
          interests: data.interests || [],
          bio: data.bio || '',
          phone: data.phone || '',
          lastLogin: data.lastLogin?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        };
      }
      return null;
    } catch (error) {
      console.error("Error fetching profile:", error);
      throw error;
    }
  },

  async updateProfile(uid: string, profile: Partial<UserProfile>): Promise<void> {
    try {
      const profileRef = doc(db, 'users', uid);
      await updateDoc(profileRef, {
        ...profile,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  },

  async createUserProfile(uid: string, email: string, name: string, role: 'admin' | 'user' = 'user'): Promise<UserProfile> {
    const newProfile: UserProfile = {
      uid,
      email,
      name,
      role,
      isPro: false,
      interests: [],
      bio: '',
      phone: '',
      lastLogin: new Date(),
      updatedAt: new Date()
    };

    try {
      await setDoc(doc(db, 'users', uid), {
        ...newProfile,
        lastLogin: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return newProfile;
    } catch (error) {
      console.error("Error creating profile:", error);
      throw error;
    }
  }
};
