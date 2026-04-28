import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "./firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { View, Image, useColorScheme } from "react-native";
import { deactivateKeepAwake } from "expo-keep-awake";
import { StatusBar } from "expo-status-bar";

// Import ThemeProvider and NotificationsProvider
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { NotificationsProvider, useNotifications } from './contexts/NotificationsContext';

// AUTH SCREENS
import SplashIntro from "./screens/splashscreen/SplashIntro";
import LoginScreen from "./screens/auth/Login/LoginScreen";
import SignupScreen from "./screens/auth/SignUp/SignupScreen";

// ONBOARDING SCREENS
import Nickname from "./screens/onboarding/Nickname/Nickname";
import Course from "./screens/onboarding/Course/Course";
import Semesters from "./screens/onboarding/Semesters/Semesters";
import Units from "./screens/onboarding/Units/Units";
import CurrentSemester from "./screens/onboarding/CurrentSem/CurrentSemester";

// APP SCREENS
import HomeScreen from "./screens/Home/HomeScreen";
import AddActivityScreen from "./screens/timetable/AddActivity/AddActivityScreen";
import TimetableScreen from "./screens/timetable/TimetableHome/TimetableScreen";
import EditTimetableScreen from "./screens/timetable/EditTimetable/EditTimetableScreen";
import ChatScreen from "./screens/chatbot/ChatScreen";
import GPAScreen from "./screens/gpa/GPAHome/GPAScreen";
import ExportGPAScreen from "./screens/gpa/ExportGPA/ExportGPAScreen";
import GPACalculationScreen from "./screens/gpa/GPACalculator/GPACalculationScreen";
import ProfileScreen from "./screens/Profile/ProfileScreen";
import TermsConditionsScreen from "./screens/DataProtection/TermsConditionsScreen";
import PrivacyPolicyScreen from "./screens/DataProtection/PrivacyPolicyScreen";
import DataDeleteScreen from "./screens/DataProtection/DataDeletion/DataDeleteScreen";
import AddExamScreen from "./screens/exam/AddExamScreen";
import ExamTimetableScreen from "./screens/exam/ExamTimetableScreen";
import SettingsScreen from "./screens/settings/SettingsHome/SettingsScreen";
import EditNickname from "./screens/settings/EditNickname";
import ContactUsScreen from "./screens/settings/ContactUs/ContactUsScreen";
import AboutUsScreen from "./screens/settings/AboutUs/AboutUsScreen";
import EditCurrentSemester from "./screens/settings/EditCurrentSemester";
import AITimetableScanner from "./screens/timetable/AI_Scanner/AITimetableScanner";
import ReviewScannedLectures from "./screens/timetable/ReviewScannedInfo/ReviewScannedLectures";
import EditUnits from "./screens/settings/EditUnits";
import EditCourse from "./screens/settings/EditCourse";
import NotificationsSettingsScreen from "./screens/settings/NotificationsSettings/NotificationsSettingsScreen";
import ManageFunNotifications from "./screens/admin/ManageFunNotifications"; // Import Admin Panel

const Stack = createStackNavigator();

function AppContent() {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  
  // Get theme from context
  const { theme } = useTheme();
  const systemColorScheme = useColorScheme();
  
  // Get notifications functions
  const { scheduleFunNotifications, sendRandomFunNotification } = useNotifications();
  
  // Determine if dark mode is active
  const isDarkMode = theme.mode === 'dark' || 
    (theme.mode === 'system' && systemColorScheme === 'dark');

  // Keep-awake management useEffect
  useEffect(() => {
    // Disable keep-awake when component mounts
    deactivateKeepAwake();
    
    // Set up periodic check to disable keep-awake (in case a screen activates it)
    const interval = setInterval(() => {
      deactivateKeepAwake();
    }, 30000); // Check every 30 seconds
    
    return () => {
      clearInterval(interval);
      deactivateKeepAwake();
    };
  }, []);

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

  // Function to schedule fun notifications for user
  const scheduleUserFunNotifications = async (userData, isOnboardingComplete) => {
    // Only schedule fun notifications if onboarding is complete
    if (isOnboardingComplete) {
      try {
        // Check if fun notifications have already been scheduled for this user
        if (!userData.fun_notifications_scheduled) {
          console.log("🎉 Scheduling fun notifications for existing user...");
          await scheduleFunNotifications(userData);
          
          // Mark that fun notifications have been scheduled for this user
          const userDocRef = doc(db, "users", auth.currentUser.uid);
          await updateDoc(userDocRef, {
            fun_notifications_scheduled: true,
            fun_notifications_scheduled_at: new Date()
          });
          console.log("✅ Fun notifications scheduled successfully");
        } else {
          console.log("📱 Fun notifications already scheduled for this user");
        }
      } catch (funError) {
        console.error("Error scheduling fun notifications:", funError);
      }
    }
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
            
            // Schedule fun notifications for existing users who have completed onboarding
            await scheduleUserFunNotifications(userData, isOnboardingComplete);
            
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
  }, [scheduleFunNotifications]);

  if (checkingAuth) {
    return (
      <View style={{ flex: 1, backgroundColor: '#535ffd' }}>
        <StatusBar style="light" backgroundColor="#535ffd" />
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
      {/* Global StatusBar - This controls the status bar icons color */}
      <StatusBar 
        style={isDarkMode ? "light" : "dark"}
        backgroundColor="transparent"
        translucent={true}
      />
      
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
            <Stack.Screen name="DataDelete" component={DataDeleteScreen} />
            <Stack.Screen name="Timetable" component={TimetableScreen} />
            <Stack.Screen name="AddActivity" component={AddActivityScreen} />
            <Stack.Screen name="EditTimetable" component={EditTimetableScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="GPA" component={GPAScreen} />
            <Stack.Screen name="AITimetableScanner" component={AITimetableScanner} />
            <Stack.Screen name="ReviewScannedLectures" component={ReviewScannedLectures} />
            <Stack.Screen name="ExportGPA" component={ExportGPAScreen} />
            <Stack.Screen name="GPACalculation" component={GPACalculationScreen} />
            <Stack.Screen name="AddExam" component={AddExamScreen} />
            <Stack.Screen name="ExamTimetable" component={ExamTimetableScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="AboutUs" component={AboutUsScreen} />
            <Stack.Screen name="NotificationsSettings" component={NotificationsSettingsScreen} />
            <Stack.Screen name="EditNickname" component={EditNickname} />
            <Stack.Screen name="ContactUs" component={ContactUsScreen} />
            <Stack.Screen name="EditCurrentSemester" component={EditCurrentSemester} />
            <Stack.Screen name="EditUnits" component={EditUnits} />
            <Stack.Screen name="EditCourse" component={EditCourse} />
            <Stack.Screen name="ManageFunNotifications" component={ManageFunNotifications} />
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
            <Stack.Screen name="DataDelete" component={DataDeleteScreen} />
            <Stack.Screen name="Timetable" component={TimetableScreen} />
            <Stack.Screen name="AddActivity" component={AddActivityScreen} />
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
            <Stack.Screen name="ContactUs" component={ContactUsScreen} />
            <Stack.Screen name="AboutUs" component={AboutUsScreen} />
            <Stack.Screen name="AITimetableScanner" component={AITimetableScanner} />
            <Stack.Screen name="ReviewScannedLectures" component={ReviewScannedLectures} />
            <Stack.Screen name="EditCurrentSemester" component={EditCurrentSemester} />
            <Stack.Screen name="EditUnits" component={EditUnits} />
            <Stack.Screen name="EditCourse" component={EditCourse} />
            <Stack.Screen name="ManageFunNotifications" component={ManageFunNotifications} />

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
            <Stack.Screen name="DataDelete" component={DataDeleteScreen} />
            <Stack.Screen name="Timetable" component={TimetableScreen} />
            <Stack.Screen name="AddActivity" component={AddActivityScreen} />
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
            <Stack.Screen name="ContactUs" component={ContactUsScreen} />
            <Stack.Screen name="AITimetableScanner" component={AITimetableScanner} />
            <Stack.Screen name="ReviewScannedLectures" component={ReviewScannedLectures} />
            <Stack.Screen name="AboutUs" component={AboutUsScreen} />
            <Stack.Screen name="EditCurrentSemester" component={EditCurrentSemester} />
            <Stack.Screen name="EditUnits" component={EditUnits} />
            <Stack.Screen name="EditCourse" component={EditCourse} />
            <Stack.Screen name="ManageFunNotifications" component={ManageFunNotifications} />

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