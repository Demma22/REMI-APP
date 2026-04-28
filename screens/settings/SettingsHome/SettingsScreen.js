import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Switch,
} from "react-native";
import { auth, db } from "../../../firebase";
import { signOut } from "firebase/auth";
import { doc, getDoc, updateDoc, deleteField } from "firebase/firestore";
import NavigationBar from "../../../components/NavigationBar";
import SvgIcon from "../../../components/SvgIcon";
import { useTheme } from '../../../contexts/ThemeContext';
import { useNotifications } from '../../../contexts/NotificationsContext';
import { getStyles } from './SettingsScreen.styles';

// Admin emails list - must match the list in ManageFunNotifications.js
const ADMIN_EMAILS = ['denis@gmail.com', 'your-email@gmail.com']; // Add your admin emails here

export default function SettingsScreen({ navigation }) {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { theme, toggleTheme, isDarkMode } = useTheme();
  const { sendRandomFunNotification, scheduleFunNotifications } = useNotifications();

  useEffect(() => {
    loadUserData();
    checkAdminStatus();
  }, []);

  const checkAdminStatus = () => {
    const currentUser = auth.currentUser;
    if (currentUser && ADMIN_EMAILS.includes(currentUser.email)) {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  };

  const loadUserData = async () => {
    try {
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      }
    } catch (error) {

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

  const handleContactUs = () => {
    navigation.navigate("ContactUs");
  };

  const handleAboutUs = () => {
    navigation.navigate("AboutUs");
  };

  const handleDeleteAllData = () => {
    Alert.alert(
      "Delete Account & Data",
      "To delete your account and all associated data, please contact our support team.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Contact Support", 
          onPress: handleContactUs
        }
      ]
    );
  };

  const handleMyProfile = () => {
    navigation.navigate("Profile");
  };

  const handleManageFunNotifications = () => {
    navigation.navigate("ManageFunNotifications");
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
          {/* ========== ADMIN SECTION ========== */}
          {/* Only visible to admin users */}
          {isAdmin && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.secondary }]}>
                🔧 Admin Settings
              </Text>
              
              <TouchableOpacity 
                style={[styles.menuButton, { backgroundColor: theme.colors.secondaryLight }]}
                onPress={handleManageFunNotifications}
              >
                <View style={[styles.menuIconContainer, { backgroundColor: theme.colors.secondary }]}>
                  <SvgIcon name="smile" size={20} color="#FFFFFF" />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuTitle}>Manage Fun Notifications</Text>
                  <Text style={styles.menuSubtitle}>
                    Add, edit, or delete fun messages for all users
                  </Text>
                </View>
                <SvgIcon name="chevron-right" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
          )}

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

            {/* Contact Us button */}
            <TouchableOpacity 
              style={styles.menuButton}
              onPress={handleContactUs}
            >
              <View style={[styles.menuIconContainer, { backgroundColor: 'rgba(83, 95, 253, 0.1)' }]}>
                <SvgIcon name="phone" size={20} color="#535FFD" />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>Contact Us</Text>
                <Text style={styles.menuSubtitle}>
                  Get help, report issues, or send feedback
                </Text>
              </View>
              <SvgIcon name="chevron-right" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* About Us Button */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About Us</Text>

            <TouchableOpacity 
              style={styles.menuButton}
              onPress={handleAboutUs}
            >
              <View style={[styles.menuIconContainer, { backgroundColor: 'rgba(83, 95, 253, 0.1)' }]}>
                <SvgIcon name="info" size={20} color="#535FFD" />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>About Us</Text>
                <Text style={styles.menuSubtitle}>
                  Our Social Media Hundles and More
                </Text>
              </View>
              <SvgIcon name="info" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
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
                <Text style={styles.menuTitle}>Delete Account & Data</Text>
                <Text style={styles.menuSubtitle}>Contact support to delete your account</Text>
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
                <Text style={styles.logoutButtonText}>Logout</Text>
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
