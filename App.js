import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "./firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { View, Image } from "react-native";

// Import ThemeProvider and NotificationsProvider
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationsProvider } from './contexts/NotificationsContext';

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
import ExportGPAScreen from "./screens/gpa/ExportGPAScreen";
import GPACalculationScreen from "./screens/gpa/GPACalculationScreen";
import ProfileScreen from "./screens/ProfileScreen";
import TermsConditionsScreen from "./screens/TermsConditionsScreen";
import PrivacyPolicyScreen from "./screens/PrivacyPolicyScreen";
import AddExamScreen from "./screens/exam/AddExamScreen";
import ExamTimetableScreen from "./screens/exam/ExamTimetableScreen";
import SettingsScreen from "./screens/settings/SettingsScreen";
import EditNickname from "./screens/settings/EditNickname";
import EditCurrentSemester from "./screens/settings/EditCurrentSemester";
import EditUnits from "./screens/settings/EditUnits";
import EditCourse from "./screens/settings/EditCourse";
import NotificationsSettingsScreen from "./screens/settings/NotificationsSettingsScreen";

const Stack = createStackNavigator();

function AppContent() {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);

  const migrateExistingUser = async (userData, userId) => {
    try {
      if (userData.nickname && userData.course && userData.total_semesters && userData.current_semester) {
        const userDocRef = doc(db, "users", userId);
        await updateDoc(userDocRef, {
          onboarding_completed: true,
          onboarding_completed_at: new Date(),
          migrated_at: new Date()
        });
        
        return true;
      }
    } catch (error) {
      // Silent fail for migration
    }
    return false;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            
            let isOnboardingComplete = userData.onboarding_completed === true;
            
            if (!isOnboardingComplete) {
              const wasMigrated = await migrateExistingUser(userData, currentUser.uid);
              if (wasMigrated) {
                isOnboardingComplete = true;
              }
            }
            
            setOnboardingCompleted(isOnboardingComplete);
          } else {
            setOnboardingCompleted(false);
          }
        } catch (error) {
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
      <View style={{ flex: 1, backgroundColor: '#535ffd' }}>
        <Image
          source={require('./assets/splash-icon.png')}
          style={{ flex: 1, width: '100%', height: '100%' }}
          resizeMode="contain"
        />
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
            
            <Stack.Screen name="Nickname" component={Nickname} />
            <Stack.Screen name="Course" component={Course} />
            <Stack.Screen name="Semesters" component={Semesters} />
            <Stack.Screen name="Units" component={Units} />
            <Stack.Screen name="CurrentSemester" component={CurrentSemester} />
            
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="TermsConditions" component={TermsConditionsScreen} />
            <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
            <Stack.Screen name="Timetable" component={TimetableScreen} />
            <Stack.Screen name="AddLecture" component={AddLectureScreen} />
            <Stack.Screen name="EditTimetable" component={EditTimetableScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="GPA" component={GPAScreen} />
            <Stack.Screen name="ExportGPA" component={ExportGPAScreen} />
            <Stack.Screen name="GPACalculation" component={GPACalculationScreen} />
            <Stack.Screen name="AddExam" component={AddExamScreen} />
            <Stack.Screen name="ExamTimetable" component={ExamTimetableScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="NotificationsSettings" component={NotificationsSettingsScreen} />
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
            
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="TermsConditions" component={TermsConditionsScreen} />
            <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
            <Stack.Screen name="Timetable" component={TimetableScreen} />
            <Stack.Screen name="AddLecture" component={AddLectureScreen} />
            <Stack.Screen name="EditTimetable" component={EditTimetableScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="GPA" component={GPAScreen} />
            <Stack.Screen name="ExportGPA" component={ExportGPAScreen} />
            <Stack.Screen name="GPACalculation" component={GPACalculationScreen} />
            <Stack.Screen name="AddExam" component={AddExamScreen} />
            <Stack.Screen name="ExamTimetable" component={ExamTimetableScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="NotificationsSettings" component={NotificationsSettingsScreen} />
            <Stack.Screen name="EditNickname" component={EditNickname} />
            <Stack.Screen name="EditCurrentSemester" component={EditCurrentSemester} />
            <Stack.Screen name="EditUnits" component={EditUnits} />
            <Stack.Screen name="EditCourse" component={EditCourse} />

            <Stack.Screen name="SplashIntro" component={SplashIntro} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
          </>
        ) : (
          // MAIN APP FLOW - User logged in AND completed onboarding
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="TermsConditions" component={TermsConditionsScreen} />
            <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
            <Stack.Screen name="Timetable" component={TimetableScreen} />
            <Stack.Screen name="AddLecture" component={AddLectureScreen} />
            <Stack.Screen name="EditTimetable" component={EditTimetableScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="GPA" component={GPAScreen} />
            <Stack.Screen name="ExportGPA" component={ExportGPAScreen} />
            <Stack.Screen name="GPACalculation" component={GPACalculationScreen} />
            <Stack.Screen name="AddExam" component={AddExamScreen} />
            <Stack.Screen name="ExamTimetable" component={ExamTimetableScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="NotificationsSettings" component={NotificationsSettingsScreen} />
            <Stack.Screen name="EditNickname" component={EditNickname} />
            <Stack.Screen name="EditCurrentSemester" component={EditCurrentSemester} />
            <Stack.Screen name="EditUnits" component={EditUnits} />
            <Stack.Screen name="EditCourse" component={EditCourse} />

            <Stack.Screen name="Nickname" component={Nickname} />
            <Stack.Screen name="Course" component={Course} />
            <Stack.Screen name="Semesters" component={Semesters} />
            <Stack.Screen name="Units" component={Units} />
            <Stack.Screen name="CurrentSemester" component={CurrentSemester} />
            
            <Stack.Screen name="SplashIntro" component={SplashIntro} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <NotificationsProvider>
        <AppContent />
      </NotificationsProvider>
    </ThemeProvider>
  );
}