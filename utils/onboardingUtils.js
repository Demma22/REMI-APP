import { auth, db } from '../firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

// Simple check for onboarding completion
export const checkOnboardingCompletion = async () => {
  try {
    const user = auth.currentUser;
    if (!user) return false;

    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) return false;

    const userData = userDoc.data();
    // Simply check the onboarding_completed flag
    return userData.onboarding_completed === true;
  } catch (error) {
    console.error("Error checking onboarding completion:", error);
    return false;
  }
};

// Mark onboarding as completed
export const markOnboardingCompleted = async () => {
  try {
    const user = auth.currentUser;
    if (!user) return false;

    const userDocRef = doc(db, "users", user.uid);
    await updateDoc(userDocRef, {
      onboarding_completed: true,
      onboarding_completed_at: new Date()
    });
    
    return true;
  } catch (error) {
    console.error("Error marking onboarding completed:", error);
    return false;
  }
};