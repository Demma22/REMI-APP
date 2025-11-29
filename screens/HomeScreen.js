import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Dimensions,
} from "react-native";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

const { width } = Dimensions.get("window");

export default function HomeScreen({ navigation }) {
  const [todayLectures, setTodayLectures] = useState([]);
  const [gpaSummary, setGpaSummary] = useState([]);
  const [upcomingExam, setUpcomingExam] = useState(null);
  const [userName, setUserName] = useState("");
  const [userNickname, setUserNickname] = useState("");
  const [loading, setLoading] = useState(true);

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
        
        // Set nickname from Firestore (this is what we saved during onboarding)
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
      
    } catch (err) {
      console.log("User data load error:", err);
      setUserName("User");
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

  return (
    <View style={styles.container}>
      {/* Header with profile on the right */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Text style={styles.welcome}>Welcome back</Text>
            <Text style={styles.userName}>{getDisplayName()}</Text>
          </View>

          <TouchableOpacity 
            style={styles.profileSection} 
            onPress={navigateToProfile}
            activeOpacity={0.7}
          >
            <View style={styles.profileIcon}>
              <Text style={styles.profileInitial}>
                {getProfileInitial()}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* App Logo */}
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>REMI</Text>
          <View style={styles.logoSubtitleContainer}>
            <View style={styles.logoDot}></View>
            <Text style={styles.logoSubtitle}>Your Study Assistant</Text>
          </View>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          {/* TODAY CARD */}
          <View style={styles.summaryCard}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIcon, { backgroundColor: "rgba(60, 99, 255, 0.2)" }]}>
                <Text style={[styles.cardIconText, { color: "#3C63FF" }]}>📚</Text>
              </View>
              <Text style={styles.cardTitle}>TODAY</Text>
            </View>
            
            <View style={styles.cardContent}>
              {todayLectures.length === 0 ? (
                <Text style={styles.summaryEmpty}>No lectures today</Text>
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
                <Text style={styles.moreText}>+{todayLectures.length - 3} more</Text>
              )}
            </View>
          </View>

          {/* GPA CARD */}
          <View style={styles.summaryCard}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIcon, { backgroundColor: "rgba(255, 138, 35, 0.2)" }]}>
                <Text style={[styles.cardIconText, { color: "#FF8A23" }]}>📊</Text>
              </View>
              <Text style={styles.cardTitle}>GPA</Text>
            </View>
            
            <View style={styles.cardContent}>
              {gpaSummary.length === 0 ? (
                <Text style={styles.summaryEmpty}>No GPA calculated yet</Text>
              ) : (
                <>
                  {overallGPA && (
                    <View style={styles.overallGpaItem}>
                      <Text style={styles.overallGpaLabel}>Overall</Text>
                      <Text style={styles.overallGpaValue}>{overallGPA}</Text>
                    </View>
                  )}
                  {gpaSummary.slice(0, 2).map((item, idx) => (
                    <View key={idx} style={styles.gpaItem}>
                      <Text style={styles.gpaSemester}>{item.semester}</Text>
                      <Text style={styles.gpaValue}>{item.gpa}</Text>
                    </View>
                  ))}
                </>
              )}
            </View>
          </View>
        </View>

        {/* Upcoming Exam Card */}
        {upcomingExam && (
          <View style={styles.examCard}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIcon, { backgroundColor: "rgba(83, 95, 253, 0.2)" }]}>
                <Text style={[styles.cardIconText, { color: "#535FFD" }]}>⏰</Text>
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
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.grid}>
            <MenuItem
              label="Timetable"
              color="#3C63FF"
              icon="⏱"
              action={() => navigation.navigate("Timetable")}
            />

            <MenuItem
              label="Chat"
              color="#FF8A23"
              icon="🤖"
              action={() => navigation.navigate("Chat")}
            />

            <MenuItem
              label="GPA"
              color="#2E2E38"
              icon="📊"
              action={() => navigation.navigate("GPA")}
            />

            <MenuItem
              label="Edit Timetable"
              color="#FF8A23"
              icon="📝"
              action={() => navigation.navigate("EditTimetable")}
            />

            <MenuItem
              label="Exams"
              color="#2E2E38"
              icon="🗓"
              action={() => navigation.navigate("ExamTimetable")}
            />

            <MenuItem
              label="Settings"
              color="#3C63FF"
              icon="⚙️"
              action={() => navigation.navigate("Settings")}
            />
          </View>
        </View>
      </ScrollView>

      {/* Floating Voice Assistant */}
      <View style={styles.voiceSection}>
        <TouchableOpacity style={styles.voiceBtn}>
          <View style={styles.voiceBtnInner}>
            <Text style={styles.voiceIcon}>🎤</Text>
          </View>
          <View style={styles.voicePulse}></View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* Menu Item Component */
function MenuItem({ label, color, icon, action }) {
  return (
    <TouchableOpacity 
      style={[styles.menuItem, { borderLeftColor: color }]} 
      onPress={action}
      activeOpacity={0.7}
    >
      <Text style={styles.menuIcon}>{icon}</Text>
      <Text style={styles.menuText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
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
    alignItems: "center",
    marginBottom: 15,
  },
  headerLeft: {
    flex: 1,
  },
  profileSection: {
    marginLeft: 15,
  },
  profileIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#3C63FF",
    justifyContent: "center",
    alignItems: "center",
  },
  profileInitial: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  welcome: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 2,
  },
  userName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
  },
  logoutBtn: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  logoutText: {
    color: "#64748B",
    fontWeight: "600",
    fontSize: 12,
  },
  logoContainer: {
    alignItems: "center",
    marginVertical: 20,
    paddingHorizontal: 24,
  },
  logo: {
    fontSize: 48,
    fontWeight: "900",
    color: "#1E293B",
    letterSpacing: 1,
  },
  logoSubtitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  logoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#3C63FF",
    marginRight: 8,
  },
  logoSubtitle: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
  summaryRow: {
    flexDirection: "row",
    paddingHorizontal: 24,
    marginBottom: 16,
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
    marginHorizontal: 24,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    borderLeftWidth: 4,
    borderLeftColor: "#535FFD",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  cardIconText: {
    fontSize: 18,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
  },
  examSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  cardContent: {
    minHeight: 80,
  },
  examContent: {
    minHeight: 60,
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
    backgroundColor: "#3C63FF",
    marginRight: 12,
    marginTop: 6,
  },
  lectureInfo: {
    flex: 1,
  },
  lectureCourse: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
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
    color: "#1E293B",
  },
  overallGpaValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FF8A23",
  },
  summaryEmpty: {
    color: "#94A3B8",
    fontSize: 14,
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 20,
  },
  moreText: {
    color: "#3C63FF",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 8,
  },
  examCourse: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 8,
  },
  examDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  examDate: {
    fontSize: 14,
    color: "#535FFD",
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
    paddingHorizontal: 24,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  menuItem: {
    width: (width - 72) / 3,
    height: 100,
    backgroundColor: "white",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  menuIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  menuText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1E293B",
    textAlign: "center",
  },
  voiceSection: {
    position: "absolute",
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  voiceBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#3C63FF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#3C63FF",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  voiceBtnInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#3C63FF",
    justifyContent: "center",
    alignItems: "center",
  },
  voiceIcon: {
    fontSize: 26,
    color: "white",
  },
  voicePulse: {
    position: "absolute",
    top: -5,
    left: -5,
    right: -5,
    bottom: -5,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: "rgba(60, 99, 255, 0.3)",
    zIndex: -1,
  },
});