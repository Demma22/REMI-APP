import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "./firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { View, Text, ActivityIndicator } from "react-native";

// AUTH SCREENS
import SplashIntro from "./screens/SplashIntro";
import LoginScreen from "./screens/auth/LoginScreen";
import SignupScreen from "./screens/auth/SignupScreen";

// ONBOARDING SCREENS
import Nickname from "./screens/onboarding/Nickname";
import Course from "./screens/onboarding/Course";
import Semesters from "./screens/onboarding/Semesters";
import Units from "./screens/onboarding/Units";
import CurrentSemester from "./screens/onboarding/CurrentSemester";

// APP SCREENS
import HomeScreen from "./screens/HomeScreen";
import AddLectureScreen from "./screens/timetable/AddLectureScreen";
import TimetableScreen from "./screens/timetable/TimetableScreen";
import EditTimetableScreen from "./screens/timetable/EditTimetableScreen";
import ChatScreen from "./screens/chatbot/ChatScreen";
import GPAScreen from "./screens/gpa/GPAScreen";
import GPACalculationScreen from "./screens/gpa/GPACalculationScreen";
import ProfileScreen from "./screens/ProfileScreen";
import AddExamScreen from "./screens/exam/AddExamScreen";
import ExamTimetableScreen from "./screens/exam/ExamTimetableScreen";
import SettingsScreen from "./screens/settings/SettingsScreen";
import EditNickname from "./screens/settings/EditNickname";
import EditCurrentSemester from "./screens/settings/EditCurrentSemester";
import EditUnits from "./screens/settings/EditUnits";
import EditCourse from "./screens/settings/EditCourse";

const Stack = createStackNavigator();

export default function App() {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);

  // Migration function for existing users
  const migrateExistingUser = async (userData, userId) => {
    try {
      // Check if user has all onboarding data but no completion flag
      if (userData.nickname && userData.course && userData.total_semesters && userData.current_semester) {
        console.log("🔄 Migrating existing user to onboarding completed");
        
        const userDocRef = doc(db, "users", userId);
        await updateDoc(userDocRef, {
          onboarding_completed: true,
          onboarding_completed_at: new Date(),
          migrated_at: new Date()
        });
        
        console.log("✅ Migration successful");
        return true;
      }
    } catch (error) {
      console.error("Migration error:", error);
    }
    return false;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        try {
          // Check if user has completed onboarding
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // Check the onboarding_completed flag
            let isOnboardingComplete = userData.onboarding_completed === true;
            
            // If not completed but has all data, migrate the user
            if (!isOnboardingComplete) {
              const wasMigrated = await migrateExistingUser(userData, currentUser.uid);
              if (wasMigrated) {
                isOnboardingComplete = true;
              }
            }
            
            setOnboardingCompleted(isOnboardingComplete);
            
            console.log("User onboarding status:", {
              email: currentUser.email,
              onboardingCompleted: isOnboardingComplete,
              hasNickname: !!userData.nickname,
              hasCourse: !!userData.course,
              hasSemesters: !!userData.total_semesters,
              hasCurrentSemester: !!userData.current_semester
            });
          } else {
            // No user document exists, onboarding not completed
            setOnboardingCompleted(false);
            console.log("No user document found for:", currentUser.email);
          }
        } catch (error) {
          console.error("Error checking onboarding status:", error);
          setOnboardingCompleted(false);
        }
      } else {
        setOnboardingCompleted(false);
      }
      
      setCheckingAuth(false);
    });

    return unsubscribe;
  }, []);

  if (checkingAuth) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFA' }}>
        <View style={{ alignItems: 'center' }}>
          <View style={{ 
            width: 80, 
            height: 80, 
            borderRadius: 40, 
            backgroundColor: '#FFFFFF', 
            justifyContent: 'center', 
            alignItems: 'center',
            marginBottom: 20,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.1,
            shadowRadius: 20,
            elevation: 10,
          }}>
            <Text style={{ fontSize: 32 }}>🎓</Text>
          </View>
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#383940', marginBottom: 10 }}>REMI</Text>
          <Text style={{ fontSize: 14, color: '#64748B', marginBottom: 20 }}>Loading your academic assistant...</Text>
          <ActivityIndicator size="large" color="#535FFD" />
        </View>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          // AUTH FLOW - User not logged in
          <>
            <Stack.Screen name="SplashIntro" component={SplashIntro} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
            
            {/* Onboarding screens for navigation consistency */}
            <Stack.Screen name="Nickname" component={Nickname} />
            <Stack.Screen name="Course" component={Course} />
            <Stack.Screen name="Semesters" component={Semesters} />
            <Stack.Screen name="Units" component={Units} />
            <Stack.Screen name="CurrentSemester" component={CurrentSemester} />
            
            {/* Main app screens to prevent navigation errors */}
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Timetable" component={TimetableScreen} />
            <Stack.Screen name="AddLecture" component={AddLectureScreen} />
            <Stack.Screen name="EditTimetable" component={EditTimetableScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="GPA" component={GPAScreen} />
            <Stack.Screen name="GPACalculation" component={GPACalculationScreen} />
            <Stack.Screen name="AddExam" component={AddExamScreen} />
            <Stack.Screen name="ExamTimetable" component={ExamTimetableScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="EditNickname" component={EditNickname} />
            <Stack.Screen name="EditCurrentSemester" component={EditCurrentSemester} />
            <Stack.Screen name="EditUnits" component={EditUnits} />
            <Stack.Screen name="EditCourse" component={EditCourse} />

          </>
        ) : !onboardingCompleted ? (
          // ONBOARDING FLOW - User logged in but hasn't completed onboarding
          <>
            <Stack.Screen name="Nickname" component={Nickname} />
            <Stack.Screen name="Course" component={Course} />
            <Stack.Screen name="Semesters" component={Semesters} />
            <Stack.Screen name="Units" component={Units} />
            <Stack.Screen name="CurrentSemester" component={CurrentSemester} />
            
            {/* Main app screens */}
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Timetable" component={TimetableScreen} />
            <Stack.Screen name="AddLecture" component={AddLectureScreen} />
            <Stack.Screen name="EditTimetable" component={EditTimetableScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="GPA" component={GPAScreen} />
            <Stack.Screen name="GPACalculation" component={GPACalculationScreen} />
            <Stack.Screen name="AddExam" component={AddExamScreen} />
            <Stack.Screen name="ExamTimetable" component={ExamTimetableScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="EditNickname" component={EditNickname} />
            <Stack.Screen name="EditCurrentSemester" component={EditCurrentSemester} />
            <Stack.Screen name="EditUnits" component={EditUnits} />
            <Stack.Screen name="EditCourse" component={EditCourse} />

            {/* Auth screens for navigation consistency */}
            <Stack.Screen name="SplashIntro" component={SplashIntro} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
          </>
        ) : (
          // MAIN APP FLOW - User logged in AND completed onboarding
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Timetable" component={TimetableScreen} />
            <Stack.Screen name="AddLecture" component={AddLectureScreen} />
            <Stack.Screen name="EditTimetable" component={EditTimetableScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="GPA" component={GPAScreen} />
            <Stack.Screen name="GPACalculation" component={GPACalculationScreen} />
            <Stack.Screen name="AddExam" component={AddExamScreen} />
            <Stack.Screen name="ExamTimetable" component={ExamTimetableScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="EditNickname" component={EditNickname} />
            <Stack.Screen name="EditCurrentSemester" component={EditCurrentSemester} />
            <Stack.Screen name="EditUnits" component={EditUnits} />
            <Stack.Screen name="EditCourse" component={EditCourse} />

            
            {/* Onboarding screens for users who want to update info */}
            <Stack.Screen name="Nickname" component={Nickname} />
            <Stack.Screen name="Course" component={Course} />
            <Stack.Screen name="Semesters" component={Semesters} />
            <Stack.Screen name="Units" component={Units} />
            <Stack.Screen name="CurrentSemester" component={CurrentSemester} />
            
            {/* Auth screens for navigation consistency */}
            <Stack.Screen name="SplashIntro" component={SplashIntro} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}