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
import SvgIcon from "../components/SvgIcon";
import { useTheme } from '../contexts/ThemeContext';

const { width } = Dimensions.get("window");

/* Menu Item Component - Updated for 3x2 grid */
function MenuItem({ label, color, iconName, subtitle, action, theme }) {
  const opacityColor = `${color}15`; // Add opacity to the color
  
  const menuItemStyles = StyleSheet.create({
    menuItem: {
      width: (width - 60) / 3, // Changed from /2 to /3 for 3 columns
      backgroundColor: theme.colors.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      alignItems: "center",
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 5,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    menuIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 12,
      backgroundColor: opacityColor,
    },
    menuText: {
      fontSize: 12,
      fontWeight: "700",
      color: theme.colors.textPrimary,
      marginBottom: 4,
      textAlign: "center",
    },
    menuSubtitle: {
      fontSize: 10,
      color: theme.colors.textSecondary,
      textAlign: "center",
    },
  });
  
  return (
    <TouchableOpacity 
      style={menuItemStyles.menuItem}
      onPress={action}
      activeOpacity={0.7}
    >
      <View style={menuItemStyles.menuIconContainer}>
        <SvgIcon name={iconName} size={24} color={color} />
      </View>
      <Text style={menuItemStyles.menuText}>{label}</Text>
      <Text style={menuItemStyles.menuSubtitle}>{subtitle}</Text>
    </TouchableOpacity>
  );
}

/* Stat Item Component - Updated design */
function StatItem({ number, label, iconName, theme }) {
  const statItemStyles = StyleSheet.create({
    statItem: {
      flex: 1,
      backgroundColor: theme.colors.card,
      borderRadius: 16,
      padding: 16,
      marginHorizontal: 6,
      alignItems: "center",
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 5,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    statIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 8,
      backgroundColor: theme.colors.primaryLight,
    },
    statNumber: {
      fontSize: 20,
      fontWeight: "800",
      color: theme.colors.primary,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      textAlign: "center",
    },
  });
  
  return (
    <View style={statItemStyles.statItem}>
      <View style={statItemStyles.statIconContainer}>
        <SvgIcon name={iconName} size={18} color={theme.colors.primary} />
      </View>
      <Text style={statItemStyles.statNumber}>{number}</Text>
      <Text style={statItemStyles.statLabel}>{label}</Text>
    </View>
  );
}

export default function HomeScreen({ navigation }) {
  const [todayLectures, setTodayLectures] = useState([]);
  const [gpaSummary, setGpaSummary] = useState([]);
  const [upcomingExam, setUpcomingExam] = useState(null);
  const [userName, setUserName] = useState("");
  const [userNickname, setUserNickname] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const { theme } = useTheme();

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
      
      // Make sure exams is an array
      if (!Array.isArray(exams)) {
        console.log("Exams data is not an array, resetting to empty array");
        setUpcomingExam(null);
        return;
      }
      
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

  const styles = getStyles(theme);

  return (
    <View style={styles.container}>
      {/* Header with profile on the right */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Text style={styles.welcome}>{getGreeting()}</Text>
            <View style={styles.userNameRow}>
              <Text style={styles.userName}>{getDisplayName()}</Text>
              <SvgIcon name="smile" size={24} color={theme.colors.primary} />
            </View>
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
              <View style={[styles.profileIcon, { backgroundColor: theme.colors.primary }]}>
                <SvgIcon name="user" size={24} color="white" />
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
        {/* Summary Cards Row */}
        <View style={styles.summaryRow}>
          {/* TODAY CARD */}
          <View style={styles.summaryCard}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIcon, { backgroundColor: theme.colors.primaryLight }]}>
                <SvgIcon name="calendar-clock" size={20} color={theme.colors.primary} />
              </View>
              <Text style={styles.cardTitle}>Today's Schedule</Text>
            </View>
            
            <View style={styles.cardContent}>
              {todayLectures.length === 0 ? (
                <View style={styles.emptyState}>
                  <SvgIcon name="coffee" size={28} color={theme.colors.textTertiary} />
                  <Text style={styles.summaryEmpty}>No lectures today</Text>
                  <Text style={styles.emptySubtitle}>Enjoy your free time!</Text>
                </View>
              ) : (
                todayLectures.slice(0, 2).map((lec, idx) => (
                  <View key={idx} style={styles.lectureItem}>
                    <View style={[styles.lectureDot, { backgroundColor: theme.colors.primary }]}></View>
                    <View style={styles.lectureInfo}>
                      <Text style={styles.lectureCourse}>{lec.course}</Text>
                      <Text style={styles.lectureTime}>{lec.time}</Text>
                    </View>
                  </View>
                ))
              )}
              {todayLectures.length > 2 && (
                <TouchableOpacity 
                  style={styles.moreContainer}
                  onPress={() => navigation.navigate("Timetable")}
                >
                  <SvgIcon name="chevron-right" size={12} color={theme.colors.primary} />
                  <Text style={[styles.moreText, { color: theme.colors.primary }]}> {todayLectures.length - 2} more</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* GPA CARD */}
          <View style={styles.summaryCard}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIcon, { backgroundColor: theme.colors.secondaryLight }]}>
                <SvgIcon name="chart-line" size={20} color={theme.colors.secondary} />
              </View>
              <Text style={styles.cardTitle}>Academic Progress</Text>
            </View>
            
            <View style={styles.cardContent}>
              {gpaSummary.length === 0 ? (
                <View style={styles.emptyState}>
                  <SvgIcon name="chart-line" size={28} color={theme.colors.textTertiary} />
                  <Text style={styles.summaryEmpty}>No GPA data</Text>
                  <Text style={styles.emptySubtitle}>Calculate your first GPA</Text>
                </View>
              ) : (
                <>
                  {overallGPA && (
                    <View style={[styles.overallGpaItem, { borderBottomColor: `${theme.colors.secondary}20` }]}>
                      <Text style={[styles.overallGpaLabel, { color: theme.colors.secondary }]}>CGPA</Text>
                      <Text style={[styles.overallGpaValue, { color: theme.colors.secondary }]}>{overallGPA}</Text>
                    </View>
                  )}
                  {gpaSummary.slice(0, 2).map((item, idx) => (
                    <View key={idx} style={[styles.gpaItem, { borderBottomColor: `${theme.colors.border}50` }]}>
                      <Text style={styles.gpaSemester}>{item.semester}</Text>
                      <Text style={styles.gpaValue}>{item.gpa}</Text>
                    </View>
                  ))}
                  {gpaSummary.length > 2 && (
                    <TouchableOpacity 
                      style={styles.moreContainer}
                      onPress={() => navigation.navigate("GPA")}
                    >
                      <SvgIcon name="chevron-right" size={12} color={theme.colors.secondary} />
                      <Text style={[styles.moreText, { color: theme.colors.secondary }]}> {gpaSummary.length - 2} more</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          </View>
        </View>

        {/* Quick Actions Grid - 3x2 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
          <View style={styles.grid}>
            {/* Row 1 */}
            <MenuItem
              label="Timetable"
              color={theme.colors.primary}
              iconName="calendar"
              subtitle="View schedule"
              action={() => navigation.navigate("Timetable")}
              theme={theme}
            />

            <MenuItem
              label="AI Assistant"
              color={theme.colors.secondary}
              iconName="robot"
              subtitle="Chat with Remi"
              action={() => navigation.navigate("Chat")}
              theme={theme}
            />

            <MenuItem
              label="GPA"
              color={theme.colors.success}
              iconName="calculator"
              subtitle="Track grades"
              action={() => navigation.navigate("GPA")}
              theme={theme}
            />

            {/* Row 2 */}
            <MenuItem
              label="Exams"
              color={theme.colors.danger}
              iconName="file"
              subtitle="Exam schedule"
              action={() => navigation.navigate("ExamTimetable")}
              theme={theme}
            />

            <MenuItem
              label="Edit Timetable"
              color="#8B5CF6"
              iconName="edit"
              action={() => navigation.navigate("EditTimetable")}
              theme={theme}
            />

            <MenuItem
              label="Settings"
              color="#10B981"
              iconName="cog"
              action={() => navigation.navigate("Settings")}
              theme={theme}
            />
          </View>
        </View>

        {/* Upcoming Exam Card */}
        {upcomingExam && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upcoming Exam</Text>
            <View style={[styles.examCard, { backgroundColor: theme.colors.card }]}>
              <View style={styles.examHeader}>
                <View style={[styles.examIcon, { backgroundColor: `${theme.colors.danger}15` }]}>
                  <SvgIcon name="clock-alert" size={20} color={theme.colors.danger} />
                </View>
                <View style={styles.examTitleContainer}>
                  <Text style={styles.examCourse}>{upcomingExam.name}</Text>
                  <View style={styles.examDetailsRow}>
                    <View style={styles.examDetail}>
                      <SvgIcon name="calendar" size={14} color={theme.colors.textSecondary} />
                      <Text style={styles.examDetailText}> {upcomingExam.formattedDate}</Text>
                    </View>
                    <View style={styles.examDetail}>
                      <SvgIcon name="clock" size={14} color={theme.colors.textSecondary} />
                      <Text style={styles.examDetailText}> {upcomingExam.start} - {upcomingExam.end}</Text>
                    </View>
                  </View>
                </View>
              </View>
              {upcomingExam.semester && (
                <View style={styles.examFooter}>
                  <View style={[styles.semesterBadge, { backgroundColor: `${theme.colors.secondary}15` }]}>
                    <SvgIcon name="graduation-cap" size={12} color={theme.colors.secondary} />
                    <Text style={[styles.semesterText, { color: theme.colors.secondary }]}> Semester {upcomingExam.semester}</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.viewDetailsButton}
                    onPress={() => navigation.navigate("ExamTimetable")}
                  >
                    <Text style={[styles.viewDetailsText, { color: theme.colors.primary }]}>View Details</Text>
                    <SvgIcon name="chevron-right" size={14} color={theme.colors.primary} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Quick Stats */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Quick Stats</Text>
          <View style={styles.statsGrid}>
            <StatItem
              number={todayLectures.length}
              label="Today's Lectures"
              iconName="book"
              theme={theme}
            />
            <StatItem
              number={gpaSummary.length}
              label="Semesters Tracked"
              iconName="chart-line"
              theme={theme}
            />
            <StatItem
              number={upcomingExam ? 1 : 0}
              label="Upcoming Exams"
              iconName="clock"
              theme={theme}
            />
          </View>
        </View>

        {/* Bottom Navigation Hint */}
        <View style={styles.bottomHint}>
          <Text style={styles.hintText}>Use bottom navigation for full access</Text>
        </View>
      </ScrollView>
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
    paddingBottom: 40,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 24,
    paddingBottom: 24,
    backgroundColor: theme.colors.backgroundSecondary,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerLeft: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  profileSection: {
    marginLeft: 15,
  },
  profileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  profileIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  welcome: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 4,
    fontWeight: '500',
  },
  userName: {
    fontSize: 24,
    fontWeight: "800",
    color: theme.colors.textPrimary,
  },
  summaryRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 24,
    marginTop: 10,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 6,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: theme.colors.border,
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
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  cardContent: {
    minHeight: 80,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  summaryEmpty: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    textAlign: "center",
    marginTop: 8,
    marginBottom: 2,
  },
  emptySubtitle: {
    color: theme.colors.textTertiary,
    fontSize: 11,
    textAlign: "center",
  },
  lectureItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  lectureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 10,
    marginTop: 8,
  },
  lectureInfo: {
    flex: 1,
  },
  lectureCourse: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  lectureTime: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  gpaItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  overallGpaItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 2,
  },
  gpaSemester: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  overallGpaLabel: {
    fontSize: 13,
    fontWeight: "700",
  },
  gpaValue: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  overallGpaValue: {
    fontSize: 16,
    fontWeight: "800",
  },
  moreContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    padding: 4,
  },
  moreText: {
    fontSize: 11,
    fontWeight: "600",
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.colors.textPrimary,
    marginBottom: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  examCard: {
    borderRadius: 20,
    padding: 16,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  examHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  examIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  examTitleContainer: {
    flex: 1,
  },
  examCourse: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    marginBottom: 6,
  },
  examDetailsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  examDetail: {
    flexDirection: "row",
    alignItems: "center",
  },
  examDetailText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: "500",
  },
  examFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: `${theme.colors.border}50`,
  },
  semesterBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  semesterText: {
    fontSize: 11,
    fontWeight: "600",
    marginLeft: 4,
  },
  viewDetailsButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewDetailsText: {
    fontSize: 12,
    fontWeight: "600",
    marginRight: 4,
  },
  bottomHint: {
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 8,
  },
  hintText: {
    fontSize: 12,
    color: theme.colors.textTertiary,
    fontStyle: "italic",
  },
});