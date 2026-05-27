// screens/settings/SettingsHome/SettingsScreen.js
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
import { supabase } from "../../../supabase";
import { getUserData, signOutUser } from "../../../services/userDataService";
import NavigationBar from "../../../components/NavigationBar";
import SvgIcon from "../../../components/SvgIcon";
import ScreenHeader from "../../../components/ScreenHeader";
import { useTheme } from '../../../contexts/ThemeContext';
import { getStyles } from './SettingsScreen.styles';
import { SettingsSkeleton } from '../../../components/SkeletonLoader';

const ADMIN_EMAILS = ['denis@gmail.com', 'your-email@gmail.com'];

export default function SettingsScreen({ navigation }) {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { theme, toggleTheme, isDarkMode } = useTheme();

  useEffect(() => {
    loadUserData();
    checkAdminStatus();
    
    // Refresh data when screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      loadUserData();
      checkAdminStatus();
    });
    
    return unsubscribe;
  }, [navigation]);

  const checkAdminStatus = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAdmin(!!(session?.user && ADMIN_EMAILS.includes(session.user.email)));
  };

  const loadUserData = async () => {
    try {
      const data = await getUserData();
      if (data) setUserData(data);
    } catch (error) {
      console.error("Error loading user data:", error);
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
      await signOutUser();
      // App.js onAuthStateChange handles navigation automatically
    } catch (error) {
      Alert.alert("Logout Error", "Failed to logout. Please try again.");
      setSigningOut(false);
    }
  };

  const handleEditNickname = () => {
    navigation.navigate("EditNickname");
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

  const styles = getStyles(theme);

  if (loading) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="SETTINGS" onBackPress={() => navigation.goBack()} />
        <SettingsSkeleton />
        <NavigationBar />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="SETTINGS" onBackPress={() => navigation.goBack()} />

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
          {isAdmin && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.secondary }]}>
              Admin Settings
              </Text>
              
              {/* Statistics Dashboard Button - Add this inside the Admin Settings section */}
              <TouchableOpacity 
                style={[styles.menuButton, { backgroundColor: theme.colors.primaryLight }]}
                onPress={() => navigation.navigate("StatisticsDashboard")}
              >
                <View style={[styles.menuIconContainer, { backgroundColor: theme.colors.primary }]}>
                  <SvgIcon name="chart-line" size={20} color="#FFFFFF" />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuTitle}>Statistics Dashboard</Text>
                  <Text style={styles.menuSubtitle}>
                    View user onboarding analytics and insights
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

          {/* About Us Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>

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
                  Learn more about REMI and connect with us
                </Text>
              </View>
              <SvgIcon name="chevron-right" size={20} color={theme.colors.textSecondary} />
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
                <SvgIcon name="user" size={16} color={theme.colors.textSecondary} style={styles.accountIcon} />
                <Text style={styles.accountEmail}>{userData?.username || 'User'}</Text>
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