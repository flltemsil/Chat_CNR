import { db, doc, getDoc, setDoc, updateDoc, serverTimestamp } from '../firebase';
import { UserProfile } from '../types';

export const profileService = {
  async getProfile(uid: string): Promise<UserProfile | null> {
    try {
      const docSnap = await getDoc(doc(db, 'users', uid));
      if (docSnap.exists()) {
        const data = docSnap.data();
        let isPro = data.isPro || false;
        let proExpiresAt = data.proExpiresAt ? (data.proExpiresAt.toDate ? data.proExpiresAt.toDate() : new Date(data.proExpiresAt)) : null;

        // Auto-expire Pro if 1 month expired or if it is a legacy pro without expiration date
        if (isPro && data.role !== 'admin') {
          if (proExpiresAt && proExpiresAt.getTime() <= Date.now()) {
            isPro = false;
            proExpiresAt = null;
            updateDoc(doc(db, 'users', uid), { isPro: false, proExpiresAt: null }).catch(console.error);
          } else if (!proExpiresAt) {
            isPro = false;
            updateDoc(doc(db, 'users', uid), { isPro: false, proExpiresAt: null }).catch(console.error);
          }
        }

        return {
          uid: data.uid,
          name: data.name,
          email: data.email,
          role: data.role,
          isPro,
          proExpiresAt,
          interests: data.interests || [],
          bio: data.bio || '',
          phone: data.phone || '',
          lastLogin: data.lastLogin?.toDate ? data.lastLogin.toDate() : (data.lastLogin ? new Date(data.lastLogin) : undefined),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.updatedAt ? new Date(data.updatedAt) : undefined),
          isOnline: data.isOnline,
          lastActive: data.lastActive?.toDate ? data.lastActive.toDate() : (data.lastActive ? new Date(data.lastActive) : undefined),
          dailyVisits: data.dailyVisits || {},
          todayVisits: data.todayVisits || 0,
          lastVisitDate: data.lastVisitDate || '',
          totalVisits: data.totalVisits || 0,
          notificationsEnabled: data.notificationsEnabled || false,
          lastMonthlyNotification: data.lastMonthlyNotification?.toDate ? data.lastMonthlyNotification.toDate() : (data.lastMonthlyNotification ? new Date(data.lastMonthlyNotification) : undefined)
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
    const todayStr = new Date().toISOString().split("T")[0];
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
      updatedAt: new Date(),
      dailyVisits: { [todayStr]: 1 },
      todayVisits: 1,
      lastVisitDate: todayStr,
      totalVisits: 1,
      notificationsEnabled: false
    };

    try {
      await setDoc(doc(db, 'users', uid), {
        ...newProfile,
        lastLogin: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastActive: serverTimestamp(),
        isOnline: true
      });
      return newProfile;
    } catch (error) {
      console.error("Error creating profile:", error);
      throw error;
    }
  }
};
