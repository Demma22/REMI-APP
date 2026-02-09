import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Switch,
} from "react-native";
import { auth, db } from "../../firebase";
import { signOut } from "firebase/auth";
import { doc, getDoc, updateDoc, deleteField } from "firebase/firestore";
import NavigationBar from "../../components/NavigationBar";
import SvgIcon from "../../components/SvgIcon";
import { useTheme } from '../../contexts/ThemeContext';

export default function SettingsScreen({ navigation }) {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { theme, toggleTheme, isDarkMode } = useTheme();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      }
    } catch (error) {
      console.log("Settings load error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadUserData();
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
      // Sign out from Firebase
      await signOut(auth);
      
      // Navigate to SplashPage immediately
      navigation.reset({
        index: 0,
        routes: [{ name: 'SplashIntro' }],
      });
      
    } catch (error) {
      console.log("Logout error:", error);
      Alert.alert("Logout Error", "Failed to logout. Please try again.");
      setSigningOut(false);
    }
  };

  const handleChangeCurrentSemester = () => {
    navigation.navigate("EditCurrentSemester", {
      nick: userData?.nickname,
      course: userData?.course,
      semesters: userData?.total_semesters
    });
  };

  const handleEditNickname = () => {
    navigation.navigate("EditNickname", {
      isEditing: true,
      currentNickname: userData?.nickname
    });
  };

  const handleEditCourse = () => {
    navigation.navigate("EditCourse", {
      isEditing: true,
      currentCourse: userData?.course
    });
  };

  const handleEditCourseUnits = () => {
    navigation.navigate("EditUnits", {
      isEditing: true,
      currentSemesters: userData?.total_semesters,
      currentUnits: userData?.units
    });
  };

  const handleNotificationSettings = () => {
    navigation.navigate("NotificationsSettings");
  };

  const handleDeleteAllData = () => {
    Alert.alert(
      "Delete All Data",
      "This will delete ALL your data including profile, timetable, exams, and GPA. You'll be taken back to onboarding. This action cannot be undone!",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete Everything", 
          style: "destructive",
          onPress: deleteAllDataAndReset
        }
      ]
    );
  };

  const deleteAllDataAndReset = async () => {
    try {
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      
      // Reset all user data except email and creation date
      await updateDoc(userDocRef, {
        nickname: deleteField(),
        course: deleteField(),
        total_semesters: deleteField(),
        current_semester: deleteField(),
        units: deleteField(),
        timetable: deleteField(),
        exams: deleteField(),
        gpa_data: deleteField(),
        chat_history: deleteField(),
        onboarding_completed: false,
        onboarding_completed_at: deleteField(),
      });
      
      Alert.alert(
        "Data Deleted", 
        "All your data has been deleted. You'll now go through onboarding again.",
        [
          {
            text: "OK",
            onPress: () => {
              // Navigate to onboarding
              navigation.reset({
                index: 0,
                routes: [{ name: 'OnboardingSplash' }],
              });
            }
          }
        ]
      );
    } catch (error) {
      console.log("Delete all data error:", error);
      Alert.alert("Error", "Failed to delete data");
    }
  };

  const handleMyProfile = () => {
    navigation.navigate("Profile");
  };

  const styles = getStyles(theme);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity 
              style={styles.backBtn} 
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>SETTINGS</Text>
            <View style={styles.headerSpacer} />
          </View>
        </View>
        <View style={styles.content}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading settings...</Text>
          </View>
        </View>
        <NavigationBar />
      </View>
    );
  }

  return (
    <View style={styles.container}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity 
              style={styles.backBtn} 
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>SETTINGS</Text>
            <View style={styles.headerSpacer} />
          </View>
        </View>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        <View style={styles.content}>
          {/* User Profile Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Profile Settings</Text>
            
            <TouchableOpacity 
              style={styles.menuButton}
              onPress={handleMyProfile}
            >
              <View style={[styles.menuIconContainer, { backgroundColor: theme.colors.primaryLight }]}>
                <SvgIcon name="user" size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>My Profile</Text>
                <Text style={styles.menuSubtitle}>
                  {userData?.nickname ? `Viewing as ${userData.nickname}` : 'View your profile information'}
                </Text>
              </View>
              <SvgIcon name="chevron-right" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuButton}
              onPress={handleEditNickname}
            >
              <View style={[styles.menuIconContainer, { backgroundColor: theme.colors.secondaryLight }]}>
                <SvgIcon name="edit" size={20} color={theme.colors.secondary} />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>Edit Nickname</Text>
                <Text style={styles.menuSubtitle}>
                  {userData?.nickname ? `Current: ${userData.nickname}` : 'Set your display name'}
                </Text>
              </View>
              <SvgIcon name="chevron-right" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuButton}
              onPress={handleEditCourse}
            >
              <View style={[styles.menuIconContainer, { backgroundColor: theme.colors.successLight }]}>
                <SvgIcon name="graduation-cap" size={20} color={theme.colors.success} />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>Edit Course</Text>
                <Text style={styles.menuSubtitle}>
                  {userData?.course ? `Current: ${userData.course}` : 'Set your course name'}
                </Text>
              </View>
              <SvgIcon name="chevron-right" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuButton}
              onPress={handleChangeCurrentSemester}
            >
              <View style={[styles.menuIconContainer, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
                <SvgIcon name="book" size={20} color="#8B5CF6" />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>Change Current Semester</Text>
                <Text style={styles.menuSubtitle}>
                  {userData?.current_semester ? `Current: Semester ${userData.current_semester}` : 'Set your current semester'}
                </Text>
              </View>
              <SvgIcon name="chevron-right" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuButton}
              onPress={handleEditCourseUnits}
            >
              <View style={[styles.menuIconContainer, { backgroundColor: theme.colors.dangerLight }]}>
                <SvgIcon name="file" size={20} color={theme.colors.danger} />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>Edit Course Units</Text>
                <Text style={styles.menuSubtitle}>
                  {userData?.course ? `Current: ${userData.course}` : 'Manage your course units'}
                </Text>
              </View>
              <SvgIcon name="chevron-right" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* App Settings Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>App Settings</Text>
            
            <TouchableOpacity 
              style={styles.menuButton}
              onPress={handleNotificationSettings}
            >
              <View style={[styles.menuIconContainer, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                <SvgIcon name="bell" size={20} color="#3B82F6" />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>Notifications</Text>
                <Text style={styles.menuSubtitle}>
                  Manage lecture and exam reminders
                </Text>
              </View>
              <SvgIcon name="chevron-right" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
            
            <View style={styles.menuButton}>
              <View style={[styles.menuIconContainer, { backgroundColor: 'rgba(56, 57, 64, 0.1)' }]}>
                <SvgIcon name={isDarkMode ? "sun" : "moon"} size={20} color={theme.colors.textPrimary} />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>Dark Mode</Text>
                <Text style={styles.menuSubtitle}>
                  {isDarkMode ? 'Switch to light theme' : 'Switch to dark theme'}
                </Text>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={toggleTheme}
                trackColor={{ false: theme.colors.borderDark, true: theme.colors.primary }}
                thumbColor="#FFFFFF"
                ios_backgroundColor={theme.colors.borderDark}
              />
            </View>
          </View>

          {/* Data Management Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data Management</Text>
            
            <TouchableOpacity 
              style={[styles.menuButton, styles.dangerButton]}
              onPress={handleDeleteAllData}
            >
              <View style={[styles.menuIconContainer, { backgroundColor: theme.colors.dangerLight }]}>
                <SvgIcon name="trash" size={20} color={theme.colors.danger} />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>Delete All Data</Text>
                <Text style={styles.menuSubtitle}>Reset everything and start over</Text>
              </View>
              <SvgIcon name="chevron-right" size={20} color={theme.colors.danger} />
            </TouchableOpacity>
          </View>

          {/* Account Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            
            <View style={styles.accountInfo}>
              <View style={styles.emailContainer}>
                <SvgIcon name="email" size={16} color={theme.colors.textSecondary} style={styles.accountIcon} />
                <Text style={styles.accountEmail}>{auth.currentUser?.email}</Text>
              </View>
              <View style={styles.statusBadge}>
                <SvgIcon name="check-circle" size={12} color={theme.colors.success} />
                <Text style={[styles.accountStatus, { color: theme.colors.success }]}>Active</Text>
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
                <>
                  <SvgIcon name="logout" size={18} color="white" />
                  <Text style={styles.logoutButtonText}>Logout</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.bottomSpacing} />
        </View>
      </ScrollView>

      <NavigationBar />
    </View>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    backgroundColor: theme.colors.backgroundSecondary,
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  backText: { 
    fontSize: 24, 
    color: theme.colors.primary, 
    fontWeight: "300",
    lineHeight: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: theme.colors.textPrimary,
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    padding: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    color: theme.colors.textSecondary,
    fontSize: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    marginBottom: 16,
  },
  menuButton: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  dangerButton: {
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.danger,
  },
  accountInfo: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  emailContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  accountIcon: {
    marginRight: 8,
  },
  accountEmail: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.textPrimary,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  accountStatus: {
    fontSize: 12,
    fontWeight: "600",
  },
  logoutButton: {
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
    shadowColor: theme.colors.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  bottomSpacing: {
    height: 20,
  },
});