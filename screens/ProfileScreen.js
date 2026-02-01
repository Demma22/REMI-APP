// screens/ProfileScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NavigationBar from "../components/NavigationBar";
import SvgIcon from "../components/SvgIcon";
import { useTheme } from '../contexts/ThemeContext'; // Add this import

export default function ProfileScreen({ navigation }) {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  
  const { theme } = useTheme(); // Get theme from context

  // AsyncStorage keys
  const PROFILE_IMAGE_KEY = '@profile_image';

  useEffect(() => {
    loadUserProfile();
    const focus = navigation.addListener("focus", loadUserProfile);
    return focus;
  }, []);

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

      // Load user profile from Firestore
      const userDocRef = doc(db, "users", currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserData(data);
      }

      // Load profile image from AsyncStorage
      await loadProfileImage();
      
    } catch (error) {
      console.log("Profile load error:", error);
      Alert.alert("Error", "Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  // Load profile image from AsyncStorage
  const loadProfileImage = async () => {
    try {
      const savedImage = await AsyncStorage.getItem(PROFILE_IMAGE_KEY);
      if (savedImage) {
        setProfileImage(savedImage);
      }
    } catch (error) {
      console.log("Error loading profile image:", error);
    }
  };

  // Save profile image to AsyncStorage
  const saveProfileImage = async (imageUri) => {
    try {
      await AsyncStorage.setItem(PROFILE_IMAGE_KEY, imageUri);
      setProfileImage(imageUri);
    } catch (error) {
      console.log("Error saving profile image:", error);
      throw error;
    }
  };

  // Remove profile image from AsyncStorage
  const removeProfileImage = async () => {
    try {
      await AsyncStorage.removeItem(PROFILE_IMAGE_KEY);
      setProfileImage(null);
    } catch (error) {
      console.log("Error removing profile image:", error);
      throw error;
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
      // Sign out from Firebase
      await signOut(auth);
      
      // Navigate to SplashPage immediately
      navigation.reset({
        index: 0,
        routes: [{ name: 'SplashIntro' }], // Changed from 'OnboardingSplash' to 'SplashIntro'
      });
      
    } catch (error) {
      console.log("Logout error:", error);
      Alert.alert("Logout Error", "Failed to logout. Please try again.");
      setSigningOut(false);
    }
  };
  
  // Calculate program completion percentage
  const getCompletionPercentage = () => {
    if (!userData?.current_semester || !userData?.total_semesters) return 0;
    
    const currentSemester = userData.current_semester;
    const totalSemesters = userData.total_semesters;
    
    const percentage = ((currentSemester - 1) / totalSemesters) * 100;
    return Math.min(Math.max(percentage, 0), 100);
  };

  const getAcademicYear = () => {
    if (!userData?.current_semester) return "Not set";
    const semester = userData.current_semester;
    const year = Math.ceil(semester / 2);
    return `Year ${year}`;
  };

  const getSemesterDisplay = () => {
    if (!userData?.current_semester) return "Not set";
    return `Semester ${userData.current_semester}`;
  };

  const getTotalSemesters = () => {
    if (!userData?.total_semesters) return "Not set";
    return `${userData.total_semesters} semester${userData.total_semesters !== 1 ? 's' : ''}`;
  };

  const getCourseUnitsCount = () => {
    if (!userData?.units) return "0";
    let totalUnits = 0;
    Object.values(userData.units).forEach(semesterUnits => {
      totalUnits += semesterUnits.length;
    });
    return `${totalUnits} unit${totalUnits !== 1 ? 's' : ''}`;
  };

  const getCourseName = () => {
    if (!userData?.course) return "Not set";
    return userData.course
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  // Handle profile picture selection
  const pickImage = async () => {
    try {
      console.log("Starting image picker...");
      
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log("Permission status:", status);
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required', 
          'To upload profile pictures, please enable photo library access in your device settings.'
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      console.log("Image picker result:", result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        console.log("Selected image URI:", selectedImage.uri);
        await saveProfileImageToStorage(selectedImage.uri);
      } else {
        console.log("User canceled image selection");
      }
    } catch (error) {
      console.error("Image picker error:", error);
      Alert.alert("Error", "Failed to access photo library. Please try again.");
    }
  };

  // Save image to AsyncStorage (much simpler than Firebase Storage)
  const saveProfileImageToStorage = async (imageUri) => {
    try {
      setUploading(true);
      console.log("Saving image to AsyncStorage...");

      // Validate the image URI
      if (!imageUri) {
        throw new Error("Invalid image URI");
      }

      // Save to AsyncStorage
      await saveProfileImage(imageUri);
      
      console.log("Profile image saved successfully!");
      Alert.alert("Success", "Profile picture updated successfully!");
      
    } catch (error) {
      console.error("Save image error:", error);
      Alert.alert("Error", "Failed to save profile picture. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  // Remove profile picture
  const removeProfileImageFromStorage = async () => {
    try {
      setUploading(true);
      
      await removeProfileImage();
      
      Alert.alert("Success", "Profile picture removed");
      
    } catch (error) {
      console.log("Remove image error:", error);
      Alert.alert("Error", "Failed to remove profile picture");
    } finally {
      setUploading(false);
    }
  };

  // Handle profile picture press
  const handleProfilePicturePress = () => {
    Alert.alert(
      "Profile Picture",
      "Choose an option",
      [
        {
          text: "Choose from Library",
          onPress: pickImage,
        },
        ...(profileImage ? [{
          text: "Remove Current",
          onPress: removeProfileImageFromStorage,
          style: "destructive",
        }] : []),
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );
  };

  // Clear all app data (useful for debugging)
  const clearAllData = async () => {
    try {
      await AsyncStorage.clear();
      setProfileImage(null);
      Alert.alert("Success", "All app data cleared");
    } catch (error) {
      console.log("Error clearing data:", error);
    }
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

  const completionPercentage = getCompletionPercentage();

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
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
          {/* Profile Header Card */}
          <View style={styles.profileHeaderCard}>
            <TouchableOpacity 
              style={styles.profileImageContainer}
              onPress={handleProfilePicturePress}
              disabled={uploading}
            >
              {uploading ? (
                <View style={[styles.profileImage, { backgroundColor: theme.colors.primary }]}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                </View>
              ) : profileImage ? (
                <Image 
                  source={{ uri: profileImage }} 
                  style={styles.profileImage}
                />
              ) : (
                <View style={[styles.profileImage, { backgroundColor: theme.colors.primary }]}>
                  <SvgIcon name="user" size={32} color="white" />
                </View>
              )}
              <View style={[styles.cameraBadge, { backgroundColor: theme.colors.primary }]}>
                <SvgIcon name="camera" size={12} color="white" />
              </View>
            </TouchableOpacity>
            
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {userData?.nickname || "User"}
              </Text>
              <Text style={styles.profileEmail}>{userEmail}</Text>
              <Text style={[styles.profileCourse, { color: theme.colors.primary }]}>
                {getCourseName()} • {getAcademicYear()}
              </Text>
            </View>
          </View>

          {/* Academic Information Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Academic Information</Text>
            
            <View style={styles.infoGrid}>
              <View style={styles.infoCard}>
                <SvgIcon name="graduation-cap" size={24} color={theme.colors.primary} />
                <Text style={styles.infoLabel}>Course</Text>
                <Text style={styles.infoValue}>{getCourseName()}</Text>
              </View>

              <View style={styles.infoCard}>
                <SvgIcon name="book" size={24} color={theme.colors.primary} />
                <Text style={styles.infoLabel}>Current Semester</Text>
                <Text style={styles.infoValue}>{getSemesterDisplay()}</Text>
              </View>

              <View style={styles.infoCard}>
                <SvgIcon name="calendar" size={24} color={theme.colors.primary} />
                <Text style={styles.infoLabel}>Academic Year</Text>
                <Text style={styles.infoValue}>{getAcademicYear()}</Text>
              </View>

              <View style={styles.infoCard}>
                <SvgIcon name="chart-line" size={24} color={theme.colors.primary} />
                <Text style={styles.infoLabel}>Program Progress</Text>
                <Text style={styles.infoValue}>{Math.round(completionPercentage)}%</Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressLabels}>
                <Text style={styles.progressLabel}>Program Completion</Text>
                <Text style={[styles.progressPercentage, { color: theme.colors.primary }]}>{Math.round(completionPercentage)}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { 
                      width: `${completionPercentage}%`,
                      backgroundColor: theme.colors.primary
                    }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                {userData?.current_semester || 0} of {userData?.total_semesters || 0} semesters completed
              </Text>
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

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate("EditCourse")}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: theme.colors.secondaryLight }]}>
                <SvgIcon name="graduation-cap" size={20} color={theme.colors.secondary} />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>Edit Course</Text>
                <Text style={styles.actionSubtitle}>Update your course information</Text>
              </View>
              <SvgIcon name="chevron-right" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate("EditCurrentSemester")}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: theme.colors.successLight }]}>
                <SvgIcon name="book" size={20} color={theme.colors.success} />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>Update Semester</Text>
                <Text style={styles.actionSubtitle}>Change your current semester</Text>
              </View>
              <SvgIcon name="chevron-right" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate("EditUnits")}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
                <SvgIcon name="file" size={20} color="#8B5CF6" />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>Manage Course Units</Text>
                <Text style={styles.actionSubtitle}>Add or remove course units</Text>
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
              <>
                <SvgIcon name="logout" size={20} color="white" />
                <Text style={styles.logoutButtonText}>Logout</Text>
              </>
            )}
          </TouchableOpacity>

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
  profileHeaderCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 24,
    padding: 24,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    marginBottom: 24,
  },
  profileImageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.backgroundSecondary,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontWeight: "800",
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  profileCourse: {
    fontSize: 14,
    fontWeight: "600",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    marginBottom: 16,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  infoCard: {
    width: "48%",
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: "center",
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  infoLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: "600",
    marginBottom: 4,
    textAlign: "center",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    textAlign: "center",
  },
  progressContainer: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 20,
    marginTop: 12,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.textPrimary,
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: "700",
  },
  progressBar: {
    height: 8,
    backgroundColor: theme.colors.borderLight,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: "center",
  },
  actionButton: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  accountCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 20,
    padding: 20,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  accountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  accountLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  accountValue: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.textPrimary,
  },
  logoutButton: {
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
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
    marginLeft: 8,
  },
  bottomSpacing: {
    height: 20,
  },
});