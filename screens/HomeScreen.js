import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Platform, 
  StyleSheet,
  Image,
  ScrollView,
  Dimensions,
} from "react-native";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get("window");

export default function HomeScreen({ navigation }) {
  const [todayLectures, setTodayLectures] = useState([]);
  const [gpaSummary, setGpaSummary] = useState([]);
  const [upcomingExam, setUpcomingExam] = useState(null);
  const [userName, setUserName] = useState("");
  const [userNickname, setUserNickname] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(true);

  // AsyncStorage key for profile image
  const PROFILE_IMAGE_KEY = '@profile_image';

  useEffect(() => {
    loadUserData();
    loadHomeData();
  }, []);

  // Add focus listener to refresh data when returning to home
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadUserData();
      loadHomeData();
    });

    return unsubscribe;
  }, [navigation]);

  const loadHomeData = async () => {
    try {
      setLoading(true);
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // Load today's lectures from timetable
        loadTodaysLectures(userData);
        
        // Load GPA summary from gpa_data
        loadGPASummary(userData);
        
        // Load upcoming exam
        loadUpcomingExam(userData);
      }
    } catch (err) {
      console.log("Home data load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadTodaysLectures = (userData) => {
    try {
      const day = new Date().toLocaleString("en-US", { weekday: "long" }).toLowerCase();
      const timetable = userData.timetable || {};
      
      // Get lectures for today from current semester
      const currentSemester = userData.current_semester || 1;
      const todaysLectures = timetable[day]?.filter(lecture => 
        lecture.semester === currentSemester
      ) || [];
      
      // Format lectures for display
      const formattedLectures = todaysLectures.map(lecture => ({
        course: lecture.name,
        time: `${lecture.start} - ${lecture.end}`,
        room: lecture.room,
        lecturer: lecture.lecturer
      }));
      
      setTodayLectures(formattedLectures);
    } catch (err) {
      console.log("Timetable load error:", err);
      setTodayLectures([]);
    }
  };

  const loadGPASummary = (userData) => {
    try {
      const gpaData = userData.gpa_data || {};
      const gpaSummary = [];
      
      // Convert gpa_data object to array for display
      Object.keys(gpaData).forEach(semesterKey => {
        if (gpaData[semesterKey] && gpaData[semesterKey].gpa) {
          const semesterNumber = semesterKey.replace('semester', '');
          gpaSummary.push({
            semester: `Sem ${semesterNumber}`,
            gpa: gpaData[semesterKey].gpa.toFixed(2)
          });
        }
      });
      
      // Sort by semester number
      gpaSummary.sort((a, b) => {
        const numA = parseInt(a.semester.replace('Sem ', ''));
        const numB = parseInt(b.semester.replace('Sem ', ''));
        return numA - numB;
      });
      
      setGpaSummary(gpaSummary);
    } catch (err) {
      console.log("GPA load error:", err);
      setGpaSummary([]);
    }
  };

  const loadUpcomingExam = (userData) => {
    try {
      const exams = userData.exams || [];
      const now = new Date();
      
      // Find the next upcoming exam
      const upcomingExams = exams
        .filter(exam => new Date(exam.date) >= now)
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      
      if (upcomingExams.length > 0) {
        setUpcomingExam(upcomingExams[0]);
      } else {
        setUpcomingExam(null);
      }
    } catch (err) {
      console.log("Exam load error:", err);
      setUpcomingExam(null);
    }
  };

  const loadUserData = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      // Load user profile from Firestore
      const userDocRef = doc(db, "users", currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // Set nickname from Firestore
        if (userData.nickname) {
          setUserNickname(userData.nickname);
        }
        
        // Fallback to email username if no nickname
        if (!userData.nickname) {
          setUserName(currentUser.email?.split('@')[0] || "User");
        }
      } else {
        // Fallback if no user document exists
        setUserName(currentUser.email?.split('@')[0] || "User");
      }

      // Load profile image from AsyncStorage
      await loadProfileImage();
      
    } catch (err) {
      console.log("User data load error:", err);
      setUserName("User");
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

  const handleLogout = async () => {
    await signOut(auth);
  };

  const navigateToProfile = () => {
    navigation.navigate("Profile");
  };

  // Get display name - prefer nickname, fallback to username
  const getDisplayName = () => {
    return userNickname || userName || "User";
  };

  // Get initial for profile icon
  const getProfileInitial = () => {
    const name = getDisplayName();
    return name.charAt(0).toUpperCase();
  };

  // Calculate overall GPA
  const getOverallGPA = () => {
    if (gpaSummary.length === 0) return null;
    
    const total = gpaSummary.reduce((sum, item) => sum + parseFloat(item.gpa), 0);
    return (total / gpaSummary.length).toFixed(2);
  };

  const overallGPA = getOverallGPA();

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <View style={styles.container}>
      {/* Header with profile on the right */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Text style={styles.welcome}>{getGreeting()}</Text>
            <Text style={styles.userName}>{getDisplayName()} 👋</Text>
          </View>

          <TouchableOpacity 
            style={styles.profileSection} 
            onPress={navigateToProfile}
            activeOpacity={0.7}
          >
            {profileImage ? (
              <Image 
                source={{ uri: profileImage }} 
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.profileIcon}>
                <Text style={styles.profileInitial}>
                  {getProfileInitial()}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          {/* TODAY CARD */}
          <View style={styles.summaryCard}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIcon, { backgroundColor: "rgba(83, 95, 253, 0.1)" }]}>
                <Text style={[styles.cardIconText, { color: "#535FFD" }]}>📚</Text>
              </View>
              <Text style={styles.cardTitle}>Today's Schedule</Text>
            </View>
            
            <View style={styles.cardContent}>
              {todayLectures.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyEmoji}>🎉</Text>
                  <Text style={styles.summaryEmpty}>No lectures today</Text>
                  <Text style={styles.emptySubtitle}>Enjoy your free time!</Text>
                </View>
              ) : (
                todayLectures.slice(0, 3).map((lec, idx) => (
                  <View key={idx} style={styles.lectureItem}>
                    <View style={styles.lectureDot}></View>
                    <View style={styles.lectureInfo}>
                      <Text style={styles.lectureCourse}>{lec.course}</Text>
                      <Text style={styles.lectureTime}>{lec.time}</Text>
                      {lec.room && (
                        <Text style={styles.lectureRoom}>📍 {lec.room}</Text>
                      )}
                    </View>
                  </View>
                ))
              )}
              {todayLectures.length > 3 && (
                <Text style={styles.moreText}>+{todayLectures.length - 3} more lectures</Text>
              )}
            </View>
          </View>

          {/* GPA CARD */}
          <View style={styles.summaryCard}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIcon, { backgroundColor: "rgba(255, 138, 35, 0.1)" }]}>
                <Text style={[styles.cardIconText, { color: "#FF8A23" }]}>📊</Text>
              </View>
              <Text style={styles.cardTitle}>Academic Progress</Text>
            </View>
            
            <View style={styles.cardContent}>
              {gpaSummary.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyEmoji}>📈</Text>
                  <Text style={styles.summaryEmpty}>Track your GPA</Text>
                  <Text style={styles.emptySubtitle}>Calculate your first GPA</Text>
                </View>
              ) : (
                <>
                  {overallGPA && (
                    <View style={styles.overallGpaItem}>
                      <Text style={styles.overallGpaLabel}>CGPA</Text>
                      <Text style={styles.overallGpaValue}>{overallGPA}</Text>
                    </View>
                  )}
                  {gpaSummary.slice(0, 2).map((item, idx) => (
                    <View key={idx} style={styles.gpaItem}>
                      <Text style={styles.gpaSemester}>{item.semester}</Text>
                      <Text style={styles.gpaValue}>{item.gpa}</Text>
                    </View>
                  ))}
                  {gpaSummary.length > 2 && (
                    <Text style={styles.moreText}>+{gpaSummary.length - 2} more semesters</Text>
                  )}
                </>
              )}
            </View>
          </View>
        </View>

        {/* Upcoming Exam Card */}
        {upcomingExam && (
          <View style={styles.examCard}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIcon, { backgroundColor: "rgba(239, 68, 68, 0.1)" }]}>
                <Text style={[styles.cardIconText, { color: "#EF4444" }]}>⏰</Text>
              </View>
              <View>
                <Text style={styles.cardTitle}>UPCOMING EXAM</Text>
                <Text style={styles.examSubtitle}>Next on your schedule</Text>
              </View>
            </View>
            
            <View style={styles.examContent}>
              <Text style={styles.examCourse}>{upcomingExam.name}</Text>
              <View style={styles.examDetails}>
                <Text style={styles.examDate}>{upcomingExam.formattedDate}</Text>
                <Text style={styles.examTime}>🕒 {upcomingExam.start} - {upcomingExam.end}</Text>
              </View>
              {upcomingExam.semester && (
                <Text style={styles.examSemester}>Semester {upcomingExam.semester}</Text>
              )}
            </View>
          </View>
        )}

        {/* Quick Actions Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
          <View style={styles.grid}>
            <MenuItem
              label="Timetable"
              color="#535FFD"
              icon="⏱️"
              subtitle="View schedule"
              action={() => navigation.navigate("Timetable")}
            />

            <MenuItem
              label="AI Assistant"
              color="#FF8A23"
              icon="🤖"
              subtitle="Chat with Remi"
              action={() => navigation.navigate("Chat")}
            />

            <MenuItem
              label="GPA Calculator"
              color="#10B981"
              icon="📊"
              subtitle="Track grades"
              action={() => navigation.navigate("GPA")}
            />

            <MenuItem
              label="Exams"
              color="#EF4444"
              icon="📝"
              subtitle="Exam schedule"
              action={() => navigation.navigate("ExamTimetable")}
            />

            <MenuItem
              label="Edit Timetable"
              color="#8B5CF6"
              icon="🗓️"
              subtitle="New schedule"
              action={() => navigation.navigate("EditTimetable")}
            />

            <MenuItem
              label="Settings"
              color="#64748B"
              icon="⚙️"
              subtitle="Your account"
              action={() => navigation.navigate("Settings")}
            />
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Quick Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{todayLectures.length}</Text>
              <Text style={styles.statLabel}>Today's Lectures</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{gpaSummary.length}</Text>
              <Text style={styles.statLabel}>Semesters Tracked</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{upcomingExam ? 1 : 0}</Text>
              <Text style={styles.statLabel}>Upcoming Exams</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

/* Menu Item Component */
function MenuItem({ label, color, icon, subtitle, action }) {
  return (
    <TouchableOpacity 
      style={[styles.menuItem, { borderLeftColor: color }]} 
      onPress={action}
      activeOpacity={0.7}
    >
      <Text style={styles.menuIcon}>{icon}</Text>
      <Text style={styles.menuText}>{label}</Text>
      <Text style={styles.menuSubtitle}>{subtitle}</Text>
    </TouchableOpacity>
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
    paddingBottom: 40,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
    backgroundColor: "#FFFFFF",
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
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerLeft: {
    flex: 1,
  },
  profileSection: {
    marginLeft: 15,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "#F1F5F9",
  },
  profileIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#535FFD",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#F1F5F9",
  },
  profileInitial: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  welcome: {
    fontSize: 16,
    color: "#64748B",
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#383940",
  },
  summaryRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 20,
    marginTop: 10,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  examCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    borderLeftWidth: 4,
    borderLeftColor: "#EF4444",
  },
cardHeader: {
  flexDirection: "row",
  alignItems: "center",
  marginBottom: 16,
  width: '100%', // Ensure it takes full card width
  maxWidth: '100%', // Prevent overflow
},
cardIcon: {
  width: 44,
  height: 44,
  borderRadius: 12,
  justifyContent: "center",
  alignItems: "center",
  marginRight: 12,
  flexShrink: 0, // Prevent icon from shrinking
},
cardTitle: {
  fontSize: Platform.OS === 'ios' ? 14 : 16,
  fontWeight: "700",
  color: "#383940",
  includeFontPadding: false,
  flex: 1,
  flexShrink: 1, // Allow text to shrink on Android
  flexWrap: 'wrap', // Allow wrapping if needed
},
  examSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  cardContent: {
    minHeight: 100,
  },
  examContent: {
    minHeight: 60,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  emptyEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  summaryEmpty: {
    color: "#383940",
    fontSize: 14,
    fontWeight: '600',
    textAlign: "center",
    marginBottom: 4,
  },
  emptySubtitle: {
    color: "#94A3B8",
    fontSize: 12,
    textAlign: "center",
  },
  lectureItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  lectureDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#535FFD",
    marginRight: 12,
    marginTop: 6,
  },
  lectureInfo: {
    flex: 1,
  },
  lectureCourse: {
    fontSize: 14,
    fontWeight: "600",
    color: "#383940",
    marginBottom: 2,
  },
  lectureTime: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 2,
  },
  lectureRoom: {
    fontSize: 11,
    color: "#94A3B8",
  },
  gpaItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  overallGpaItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: "#FF8A23",
  },
  gpaSemester: {
    fontSize: 14,
    color: "#64748B",
  },
  overallGpaLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FF8A23",
  },
  gpaValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#383940",
  },
  overallGpaValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FF8A23",
  },
  moreText: {
    color: "#535FFD",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 8,
  },
  examCourse: {
    fontSize: 16,
    fontWeight: "700",
    color: "#383940",
    marginBottom: 8,
  },
  examDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  examDate: {
    fontSize: 14,
    color: "#EF4444",
    fontWeight: "600",
  },
  examTime: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "600",
  },
  examSemester: {
    fontSize: 12,
    color: "#FF8A23",
    fontWeight: "600",
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#383940",
    marginBottom: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  menuItem: {
    width: (width - 60) / 2,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  menuIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  menuText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#383940",
    marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: 11,
    color: "#64748B",
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 6,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "800",
    color: "#535FFD",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
  },
});