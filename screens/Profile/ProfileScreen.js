// screens/Profile/ProfileScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { auth, db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import NavigationBar from "../../components/NavigationBar";
import SvgIcon from "../../components/SvgIcon";
import { useTheme } from '../../contexts/ThemeContext';
import { getStyles } from "./ProfileScreen.styles";

export default function ProfileScreen({ navigation }) {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  
  const { theme } = useTheme();
  const styles = getStyles(theme);

  useEffect(() => {
    loadUserProfile();
    const focus = navigation.addListener("focus", loadUserProfile);
    return focus;
  }, [navigation]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert("Error", "No user logged in");
        navigation.navigate("Login");
        return;
      }

      setUserEmail(currentUser.email || "");

      const userDocRef = doc(db, "users", currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserData(data);
      }
      
    } catch (error) {
      console.error("Error loading profile:", error);
      Alert.alert("Error", "Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Logout", 
          style: "destructive",
          onPress: performLogout
        }
      ]
    );
  };

  const performLogout = async () => {
    setSigningOut(true);
    try {
      await signOut(auth);
      navigation.reset({
        index: 0,
        routes: [{ name: 'SplashIntro' }],
      });
    } catch (error) {
      Alert.alert("Logout Error", "Failed to logout. Please try again.");
      setSigningOut(false);
    }
  };

  const getCourseName = () => {
    if (!userData?.course) return "Not set";
    return userData.course
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  const getOnboardingAnswers = () => {
    return {
      heardFrom: userData?.heardFrom || "Not answered",
      purpose: userData?.purpose || [],
      studyStage: userData?.studyStage || "Not answered",
      ageRange: userData?.ageRange || "Not answered",
    };
  };

  const getPurposeDisplay = () => {
    const purposes = userData?.purpose || [];
    if (purposes.length === 0) return "Not answered";
    return purposes.map(p => p.replace('_', ' ').toUpperCase()).join(", ");
  };

  const getHeardFromDisplay = () => {
    const heardMap = {
      'family_friend': 'Friends & Family',
      'social_media': 'Social Media',
      'snd_studio': 'SND Studio Website',
      'app_store': 'App Store',
      'other': 'Other'
    };
    return heardMap[userData?.heardFrom] || userData?.heardFrom || "Not answered";
  };

  const getStudyStageDisplay = () => {
    const stageMap = {
      'high_school': 'High School',
      'undergraduate': 'Undergraduate',
      'graduate': 'Graduate',
      'professional': 'Professional',
      'not_studying': 'Not studying'
    };
    return stageMap[userData?.studyStage] || userData?.studyStage || "Not answered";
  };

  const getAgeRangeDisplay = () => {
    const ageMap = {
      'under_18': 'Under 18',
      '18_24': '18-24',
      '25_34': '25-34',
      '35_44': '35-44',
      '45_plus': '45+'
    };
    return ageMap[userData?.ageRange] || userData?.ageRange || "Not answered";
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity 
              style={styles.backBtn} 
              onPress={() => navigation.goBack()}
            >
              <SvgIcon name="arrow-back" size={20} color={theme.colors.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>PROFILE</Text>
            <View style={styles.headerSpacer} />
          </View>
        </View>
        <View style={styles.content}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading your profile...</Text>
          </View>
        </View>
        <NavigationBar />
      </View>
    );
  }

  const onboarding = getOnboardingAnswers();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.backBtn} 
            onPress={() => navigation.goBack()}
          >
            <SvgIcon name="arrow-back" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>PROFILE</Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.content}>
          {/* Profile Header Card */}
          <View style={styles.profileHeaderCard}>
            <View style={styles.profileImageContainer}>
              <View style={[styles.profileImage, { backgroundColor: theme.colors.primary }]}>
                <SvgIcon name="user" size={32} color="white" />
              </View>
            </View>
            
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {userData?.nickname || "User"}
              </Text>
              <Text style={styles.profileEmail}>{userEmail}</Text>
              {userData?.course && (
                <Text style={[styles.profileCourse, { color: theme.colors.primary }]}>
                  {getCourseName()}
                </Text>
              )}
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate("EditNickname")}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: theme.colors.primaryLight }]}>
                <SvgIcon name="edit" size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>Edit Nickname</Text>
                <Text style={styles.actionSubtitle}>Change how you appear in the app</Text>
              </View>
              <SvgIcon name="chevron-right" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>

          </View>

          {/* Account Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Information</Text>
            <View style={styles.accountCard}>
              <View style={styles.accountRow}>
                <Text style={styles.accountLabel}>User ID</Text>
                <Text style={styles.accountValue}>
                  {auth.currentUser?.uid?.substring(0, 8)}...
                </Text>
              </View>
              <View style={styles.accountRow}>
                <Text style={styles.accountLabel}>Account Created</Text>
                <Text style={styles.accountValue}>
                  {auth.currentUser?.metadata?.creationTime 
                    ? new Date(auth.currentUser.metadata.creationTime).toLocaleDateString()
                    : "Unknown"
                  }
                </Text>
              </View>
              <View style={styles.accountRow}>
                <Text style={styles.accountLabel}>Last Sign In</Text>
                <Text style={styles.accountValue}>
                  {auth.currentUser?.metadata?.lastSignInTime
                    ? new Date(auth.currentUser.metadata.lastSignInTime).toLocaleDateString()
                    : "Unknown"
                  }
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.logoutButton, { backgroundColor: theme.colors.danger }]}
            onPress={handleLogout}
            disabled={signingOut}
          >
            {signingOut ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.logoutButtonText}>Logout</Text>
            )}
          </TouchableOpacity>

          <View style={styles.bottomSpacing} />
        </View>
      </ScrollView>

      <NavigationBar />
    </View>
  );
}