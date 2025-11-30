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
// import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NavigationBar from "../components/NavigationBar";

export default function ProfileScreen({ navigation }) {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

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
            onPress: async () => {
              setSigningOut(true);
              try {
                await signOut(auth);
              } catch (error) {
                console.log("Logout error:", error);
                setSigningOut(false);
              }
            }
          }
        ]
      );
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
            <Text style={styles.headerTitle}>PROFILE</Text>
            <View style={styles.headerSpacer} />
          </View>
        </View>
        <View style={styles.content}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#535FFD" />
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
              <Text style={styles.backText}>‹</Text>
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
                <View style={styles.profileImage}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                </View>
              ) : profileImage ? (
                <Image 
                  source={{ uri: profileImage }} 
                  style={styles.profileImage}
                />
              ) : (
                <View style={styles.profileImage}>
                  <Text style={styles.profileInitial}>
                    {userData?.nickname?.charAt(0)?.toUpperCase() || "U"}
                  </Text>
                </View>
              )}
              <View style={styles.cameraBadge}>
                <Text style={styles.cameraIcon}>📷</Text>
              </View>
            </TouchableOpacity>
            
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {userData?.nickname || "User"}
              </Text>
              <Text style={styles.profileEmail}>{userEmail}</Text>
              <Text style={styles.profileCourse}>
                {getCourseName()} • {getAcademicYear()}
              </Text>
            </View>
          </View>

          {/* Academic Information Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Academic Information</Text>
            
            <View style={styles.infoGrid}>
              <View style={styles.infoCard}>
                <Text style={styles.infoIcon}>🎓</Text>
                <Text style={styles.infoLabel}>Course</Text>
                <Text style={styles.infoValue}>{getCourseName()}</Text>
              </View>

              <View style={styles.infoCard}>
                <Text style={styles.infoIcon}>📚</Text>
                <Text style={styles.infoLabel}>Current Semester</Text>
                <Text style={styles.infoValue}>{getSemesterDisplay()}</Text>
              </View>

              <View style={styles.infoCard}>
                <Text style={styles.infoIcon}>📅</Text>
                <Text style={styles.infoLabel}>Academic Year</Text>
                <Text style={styles.infoValue}>{getAcademicYear()}</Text>
              </View>

              <View style={styles.infoCard}>
                <Text style={styles.infoIcon}>⏱️</Text>
                <Text style={styles.infoLabel}>Program Progress</Text>
                <Text style={styles.infoValue}>{Math.round(completionPercentage)}%</Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressLabels}>
                <Text style={styles.progressLabel}>Program Completion</Text>
                <Text style={styles.progressPercentage}>{Math.round(completionPercentage)}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { width: `${completionPercentage}%` }
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
              <Text style={styles.actionIcon}>👤</Text>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>Edit Nickname</Text>
                <Text style={styles.actionSubtitle}>Change how you appear in the app</Text>
              </View>
              <Text style={styles.actionArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate("EditCourse")}
            >
              <Text style={styles.actionIcon}>🎓</Text>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>Edit Course</Text>
                <Text style={styles.actionSubtitle}>Update your course information</Text>
              </View>
              <Text style={styles.actionArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate("EditCurrentSemester")}
            >
              <Text style={styles.actionIcon}>📚</Text>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>Update Semester</Text>
                <Text style={styles.actionSubtitle}>Change your current semester</Text>
              </View>
              <Text style={styles.actionArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate("EditUnits")}
            >
              <Text style={styles.actionIcon}>📝</Text>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>Manage Course Units</Text>
                <Text style={styles.actionSubtitle}>Add or remove course units</Text>
              </View>
              <Text style={styles.actionArrow}>›</Text>
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
            style={styles.logoutButton}
            onPress={handleLogout}
            disabled={signingOut}
          >
            {signingOut ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
              
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

// ... (keep the same styles as before)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    backgroundColor: "#FFFFFF",
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
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
    backgroundColor: "#FAFAFA",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  backText: { 
    fontSize: 24, 
    color: "#535FFD", 
    fontWeight: "300",
    lineHeight: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#383940",
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
    color: "#64748B",
    fontSize: 16,
  },
  profileHeaderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
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
    backgroundColor: "#535FFD",
    justifyContent: "center",
    alignItems: "center",
  },
  profileInitial: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "bold",
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: "#535FFD",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  cameraIcon: {
    fontSize: 12,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontWeight: "800",
    color: "#383940",
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: "#64748B",
    marginBottom: 8,
  },
  profileCourse: {
    fontSize: 14,
    color: "#535FFD",
    fontWeight: "600",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#383940",
    marginBottom: 16,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  infoCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  infoIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
    marginBottom: 4,
    textAlign: "center",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#383940",
    textAlign: "center",
  },
  progressContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginTop: 12,
    shadowColor: "#000",
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
    color: "#383940",
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: "700",
    color: "#535FFD",
  },
  progressBar: {
    height: 8,
    backgroundColor: "#F1F5F9",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#535FFD",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
  },
  actionButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  actionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#383940",
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 12,
    color: "#64748B",
  },
  actionArrow: {
    fontSize: 20,
    color: "#64748B",
    fontWeight: "300",
  },
  accountCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
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
    borderBottomColor: "#F1F5F9",
  },
  accountLabel: {
    fontSize: 14,
    color: "#64748B",
  },
  accountValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#383940",
  },
  bottomSpacing: {
    height: 20,
  },
    logoutButton: {
    backgroundColor: "#EF4444",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    shadowColor: "#EF4444",
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