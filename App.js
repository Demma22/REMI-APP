// App.js
import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { View, Image, useColorScheme } from "react-native";
import { deactivateKeepAwake } from "expo-keep-awake";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "./supabase";
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { NotificationsProvider } from './contexts/NotificationsContext';

// AUTH SCREENS
import SplashIntro from "./screens/splashscreen/SplashIntro";
import LoginScreen from "./screens/auth/Login/LoginScreen";
import SignupScreen from "./screens/auth/SignUp/SignupScreen";

// NEW ONBOARDING SCREEN
import OnboardingScreen from "./screens/onboarding/OnboardingScreen";



// APP SCREENS
import HomeScreen from "./screens/Home/HomeScreen";
import AddActivityScreen from "./screens/timetable/AddActivity/AddActivityScreen";
import TimetableScreen from "./screens/timetable/TimetableHome/TimetableScreen";
import EditTimetableScreen from "./screens/timetable/EditTimetable/EditTimetableScreen";

import GPAScreen from "./screens/gpa/GPAHome/GPAScreen";
import CurriculumSelectorScreen from "./screens/gpa/CurriculumSelector/CurriculumSelectorScreen";
import ScanResultsScreen from "./screens/gpa/ScanResults/ScanResultsScreen";
import ReviewScannedResults from "./screens/gpa/ReviewScannedResults/ReviewScannedResultsScreen";
import ExportGPAScreen from "./screens/gpa/ExportGPA/ExportGPAScreen";
import ProfileScreen from "./screens/Profile/ProfileScreen";
import TermsConditionsScreen from "./screens/DataProtection/TermsConditionsScreen";
import PrivacyPolicyScreen from "./screens/DataProtection/PrivacyPolicyScreen";
import DataDeleteScreen from "./screens/DataProtection/DataDeletion/DataDeleteScreen";
import AddExamScreen from "./screens/exam/AddExamScreen";
import DeadlinesScreen from "./screens/deadlines/DeadlinesScreen";
import RateReviewModal from "./components/RateReviewModal";
import SettingsScreen from "./screens/settings/SettingsHome/SettingsScreen";
import EditNickname from "./screens/settings/EditNickname/EditNickname";
import ContactUsScreen from "./screens/settings/ContactUs/ContactUsScreen";
import AboutUsScreen from "./screens/settings/AboutUs/AboutUsScreen";
import EditCurrentSemester from "./screens/settings/EditCurrentSemester";
import AITimetableScanner from "./screens/timetable/AI_Scanner/AITimetableScanner";
import ReviewScannedLectures from "./screens/timetable/ReviewScannedInfo/ReviewScannedLectures";
import EditUnits from "./screens/settings/EditUnits";
import EditCourse from "./screens/settings/EditCourse";
import NotificationsSettingsScreen from "./screens/settings/NotificationsSettings/NotificationsSettingsScreen";
import StatisticsDashboard from "./screens/admin/StatisticsDashboard/StatisticsDashboard";

const Stack = createStackNavigator();

// SafeAreaWrapper component to wrap all screens
const SafeAreaWrapper = ({ children }) => {
  const { theme } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      {children}
    </SafeAreaView>
  );
};

function AppContent() {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);

  const { theme } = useTheme();
  const systemColorScheme = useColorScheme();
  const isDarkMode = theme.mode === 'dark' ||
    (theme.mode === 'system' && systemColorScheme === 'dark');

  useEffect(() => {
    deactivateKeepAwake();
    const interval = setInterval(() => deactivateKeepAwake(), 30000);
    return () => clearInterval(interval);
  }, []);

  const checkOnboarding = async (userId) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', userId)
      .single();
    return profile?.onboarding_completed === true;
  };

  useEffect(() => {
    // Let onAuthStateChange be the single source of truth.
    // INITIAL_SESSION fires immediately with the cached session (or null),
    // so we use it to set checkingAuth=false instead of a separate getSession() call.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          if (session?.user) {
            setUser(session.user);
            setOnboardingCompleted(await checkOnboarding(session.user.id));
          } else {
            setUser(null);
            setOnboardingCompleted(false);
          }
        } catch {
          setUser(null);
          setOnboardingCompleted(false);
        } finally {
          if (event === 'INITIAL_SESSION') {
            setCheckingAuth(false);
          }
        }
      }
    );

    // Fallback: if INITIAL_SESSION never fires (network/error), unblock after 5s
    const timeout = setTimeout(() => setCheckingAuth(false), 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  if (checkingAuth) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#535ffd' }} edges={['top', 'bottom']}>
        <StatusBar style="light" backgroundColor="#535ffd" />
        <Image
          source={require('./assets/splash-icon.png')}
          style={{ flex: 1, width: '100%', height: '100%' }}
          resizeMode="contain"
        />
      </SafeAreaView>
    );
  }

  return (
    <NavigationContainer>
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
            

            
            {/* App screens */}
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="TermsConditions" component={TermsConditionsScreen} />
            <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
            <Stack.Screen name="DataDelete" component={DataDeleteScreen} />
            <Stack.Screen name="Timetable" component={TimetableScreen} />
            <Stack.Screen name="AddActivity" component={AddActivityScreen} />
            <Stack.Screen name="EditTimetable" component={EditTimetableScreen} />
            <Stack.Screen name="GPA" component={GPAScreen} />
            <Stack.Screen name="RateReviewModal" component={RateReviewModal} />
            <Stack.Screen name="CurriculumSelector" component={CurriculumSelectorScreen} />
            <Stack.Screen name="ScanResults" component={ScanResultsScreen} />
            <Stack.Screen name="ReviewScannedResults" component={ReviewScannedResults} />
            <Stack.Screen name="AITimetableScanner" component={AITimetableScanner} />
            <Stack.Screen name="ReviewScannedLectures" component={ReviewScannedLectures} />
            <Stack.Screen name="ExportGPA" component={ExportGPAScreen} />
            <Stack.Screen name="AddExam" component={AddExamScreen} />
            <Stack.Screen name="Deadlines" component={DeadlinesScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="AboutUs" component={AboutUsScreen} />
            <Stack.Screen name="NotificationsSettings" component={NotificationsSettingsScreen} />
            <Stack.Screen name="EditNickname" component={EditNickname} />
            <Stack.Screen name="ContactUs" component={ContactUsScreen} />
            <Stack.Screen name="EditCurrentSemester" component={EditCurrentSemester} />
            <Stack.Screen name="EditUnits" component={EditUnits} />
            <Stack.Screen name="EditCourse" component={EditCourse} />
            <Stack.Screen name="StatisticsDashboard" component={StatisticsDashboard} />
          </>
        ) : !onboardingCompleted ? (
          // ONBOARDING FLOW - User logged in but hasn't completed onboarding
          <>
            {/* NEW ONBOARDING SCREEN */}
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            

            
            {/* App screens for navigation after onboarding */}
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="TermsConditions" component={TermsConditionsScreen} />
            <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
            <Stack.Screen name="DataDelete" component={DataDeleteScreen} />
            <Stack.Screen name="Timetable" component={TimetableScreen} />
            <Stack.Screen name="AddActivity" component={AddActivityScreen} />
            <Stack.Screen name="EditTimetable" component={EditTimetableScreen} />
            <Stack.Screen name="GPA" component={GPAScreen} />
            <Stack.Screen name="RateReviewModal" component={RateReviewModal} />
            <Stack.Screen name="CurriculumSelector" component={CurriculumSelectorScreen} />
            <Stack.Screen name="ScanResults" component={ScanResultsScreen} />
            <Stack.Screen name="ReviewScannedResults" component={ReviewScannedResults} />
            <Stack.Screen name="ExportGPA" component={ExportGPAScreen} />
            <Stack.Screen name="AddExam" component={AddExamScreen} />
            <Stack.Screen name="Deadlines" component={DeadlinesScreen} />
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
            <Stack.Screen name="StatisticsDashboard" component={StatisticsDashboard} />
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
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="GPA" component={GPAScreen} />
            <Stack.Screen name="RateReviewModal" component={RateReviewModal} />
            <Stack.Screen name="CurriculumSelector" component={CurriculumSelectorScreen} />
            <Stack.Screen name="ScanResults" component={ScanResultsScreen} />
            <Stack.Screen name="ReviewScannedResults" component={ReviewScannedResults} />
            <Stack.Screen name="ExportGPA" component={ExportGPAScreen} />
            <Stack.Screen name="AddExam" component={AddExamScreen} />
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
            <Stack.Screen name="StatisticsDashboard" component={StatisticsDashboard} />
            <Stack.Screen name="Deadlines" component={DeadlinesScreen} />
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
    <SafeAreaProvider>
      <ThemeProvider>
        <NotificationsProvider>
          <AppContent />
        </NotificationsProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}