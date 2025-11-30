// screens/SettingsScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { auth, db } from "../../firebase";
import { signOut } from "firebase/auth";
import { doc, getDoc, updateDoc, deleteField } from "firebase/firestore";
import NavigationBar from "../../components/NavigationBar";

export default function SettingsScreen({ navigation }) {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

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
            <ActivityIndicator size="large" color="#535FFD" />
            <Text style={styles.loadingText}>Loading settings...</Text>
          </View>
        </View>
        <NavigationBar />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
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

        <View style={styles.content}>
          {/* User Profile Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Profile Settings</Text>
            
            <TouchableOpacity 
              style={styles.menuButton}
              onPress={handleMyProfile}
            >
              <Text style={styles.menuIcon}>👤</Text>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>My Profile</Text>
                <Text style={styles.menuSubtitle}>
                  {userData?.nickname ? `Viewing as ${userData.nickname}` : 'View your profile information'}
                </Text>
              </View>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuButton}
              onPress={handleEditNickname}
            >
              <Text style={styles.menuIcon}>✏️</Text>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>Edit Nickname</Text>
                <Text style={styles.menuSubtitle}>
                  {userData?.nickname ? `Current: ${userData.nickname}` : 'Set your display name'}
                </Text>
              </View>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>

           <TouchableOpacity 
              style={styles.menuButton}
              onPress={handleEditCourse}
            >
              <Text style={styles.menuIcon}>✏️</Text>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>Edit Course</Text>
                <Text style={styles.menuSubtitle}>
                  {userData?.course ? `Current: ${userData.course}` : 'Set your course name'}
                </Text>
              </View>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>


            <TouchableOpacity 
              style={styles.menuButton}
              onPress={handleChangeCurrentSemester}
            >
              <Text style={styles.menuIcon}>🎓</Text>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>Change Current Semester</Text>
                <Text style={styles.menuSubtitle}>
                  {userData?.current_semester ? `Current: Semester ${userData.current_semester}` : 'Set your current semester'}
                </Text>
              </View>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuButton}
              onPress={handleEditCourseUnits}
            >
              <Text style={styles.menuIcon}>📚</Text>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>Edit Course Units</Text>
                <Text style={styles.menuSubtitle}>
                  {userData?.course ? `Current: ${userData.course}` : 'Manage your course units'}
                </Text>
              </View>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Data Management Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data Management</Text>
            
            <TouchableOpacity 
              style={[styles.menuButton, styles.dangerButton]}
              onPress={handleDeleteAllData}
            >
              <Text style={styles.menuIcon}>🗑️</Text>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>Delete All Data</Text>
                <Text style={styles.menuSubtitle}>Reset everything and start over</Text>
              </View>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Account Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            
            <View style={styles.accountInfo}>
              <Text style={styles.accountEmail}>{auth.currentUser?.email}</Text>
              <Text style={styles.accountStatus}>Active</Text>
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
          </View>

          <View style={styles.bottomSpacing} />
        </View>
      </ScrollView>

      <NavigationBar />
    </View>
  );
}

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
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#383940",
    marginBottom: 16,
  },
  menuButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  dangerButton: {
    borderLeftWidth: 4,
    borderLeftColor: "#EF4444",
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#383940",
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 12,
    color: "#64748B",
  },
  menuArrow: {
    fontSize: 20,
    color: "#64748B",
    fontWeight: "300",
  },
  accountInfo: {
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
  accountEmail: {
    fontSize: 16,
    fontWeight: "600",
    color: "#383940",
    marginBottom: 4,
  },
  accountStatus: {
    fontSize: 12,
    color: "#10B981",
    fontWeight: "600",
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