import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Platform, 
  StyleSheet,
  Image,
  ScrollView,
  Dimensions,
  FlatList,
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
  const menuItemStyles = StyleSheet.create({
    menuItem: {
      width: (width - 60) / 3,
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
      backgroundColor: color + '20',
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
      backgroundColor: theme.colors.primary + '20',
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

/* Summary Card Component */
function SummaryCard({ type, data, theme, navigation }) {
  const isToday = type === 'today';
  const isGPA = type === 'gpa';
  
  const cardColors = {
    today: {
      background: theme.mode === 'dark' ? '#1E3A8A' : '#3B82F6',
      iconBackground: theme.mode === 'dark' ? '#3B82F6' : '#FFFFFF',
      iconColor: theme.mode === 'dark' ? '#FFFFFF' : '#3B82F6',
      textColor: '#FFFFFF',
      accent: '#FFFFFF',
    },
    gpa: {
      background: theme.mode === 'dark' ? '#92400E' : '#F59E0B',
      iconBackground: theme.mode === 'dark' ? '#F59E0B' : '#FFFFFF',
      iconColor: theme.mode === 'dark' ? '#FFFFFF' : '#F59E0B',
      textColor: '#FFFFFF',
      accent: '#FFFFFF',
    }
  };
  
  const colors = cardColors[type] || cardColors.today;
  
  const styles = StyleSheet.create({
    summaryCard: {
      width: width - 40,
      backgroundColor: colors.background,
      borderRadius: 20,
      padding: 20,
      marginHorizontal: 20,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 5,
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: 16,
      minHeight: 40,
    },
    cardIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
      flexShrink: 0,
      backgroundColor: colors.iconBackground,
    },
    cardTitleContainer: {
      flex: 1,
      justifyContent: "flex-start",
    },
    cardTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.textColor,
      lineHeight: 18,
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
      color: colors.textColor,
      fontSize: 13,
      fontWeight: '600',
      textAlign: "center",
      marginTop: 8,
      marginBottom: 2,
    },
    emptySubtitle: {
      color: colors.textColor,
      fontSize: 11,
      textAlign: "center",
      opacity: 0.8,
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
      flexShrink: 0,
      backgroundColor: colors.accent,
    },
    lectureInfo: {
      flex: 1,
    },
    lectureCourse: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.textColor,
      marginBottom: 2,
    },
    lectureTime: {
      fontSize: 11,
      color: colors.textColor,
      opacity: 0.9,
    },
    gpaItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: `${colors.accent}30`,
    },
    overallGpaItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
      paddingBottom: 10,
      borderBottomWidth: 2,
      borderBottomColor: `${colors.accent}40`,
    },
    gpaSemester: {
      fontSize: 13,
      color: colors.textColor,
      opacity: 0.9,
    },
    overallGpaLabel: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.textColor,
    },
    gpaValue: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.textColor,
    },
    overallGpaValue: {
      fontSize: 16,
      fontWeight: "800",
      color: colors.textColor,
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
      color: colors.accent,
    },
  });

  if (isToday) {
    const todayLectures = data || [];
    
    return (
      <View style={styles.summaryCard}>
        <View style={styles.cardHeader}>
          <View style={styles.cardIcon}>
            <SvgIcon name="clock" size={20} color={colors.iconColor} />
          </View>
          <View style={styles.cardTitleContainer}>
            <Text style={styles.cardTitle}>Today's Schedule</Text>
          </View>
        </View>
        
        <View style={styles.cardContent}>
          {todayLectures.length === 0 ? (
            <View style={styles.emptyState}>
              <SvgIcon name="coffee" size={28} color={colors.textColor} opacity={0.8} />
              <Text style={styles.summaryEmpty}>No lectures today</Text>
              <Text style={styles.emptySubtitle}>Enjoy your free time!</Text>
            </View>
          ) : (
            todayLectures.slice(0, 2).map((lec, idx) => (
              <View key={idx} style={styles.lectureItem}>
                <View style={styles.lectureDot}></View>
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
              <Text style={styles.moreText}>View {todayLectures.length - 2} more</Text>
              <SvgIcon name="chevron-right" size={12} color={colors.accent} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }
  
  if (isGPA) {
    const gpaSummary = data || [];
    const overallGPA = gpaSummary.length > 0 
      ? (gpaSummary.reduce((sum, item) => sum + parseFloat(item.gpa), 0) / gpaSummary.length).toFixed(2)
      : null;
    
    return (
      <View style={styles.summaryCard}>
        <View style={styles.cardHeader}>
          <View style={styles.cardIcon}>
            <SvgIcon name="chart-line" size={20} color={colors.iconColor} />
          </View>
          <View style={styles.cardTitleContainer}>
            <Text style={styles.cardTitle}>Academic Progress</Text>
          </View>
        </View>
        
        <View style={styles.cardContent}>
          {gpaSummary.length === 0 ? (
            <View style={styles.emptyState}>
              <SvgIcon name="chart-line" size={28} color={colors.textColor} opacity={0.8} />
              <Text style={styles.summaryEmpty}>No GPA data</Text>
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
                <TouchableOpacity 
                  style={styles.moreContainer}
                  onPress={() => navigation.navigate("GPA")}
                >
                  <Text style={styles.moreText}>View {gpaSummary.length - 2} more</Text>
                  <SvgIcon name="chevron-right" size={12} color={colors.accent} />
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </View>
    );
  }
  
  return null;
}

export default function HomeScreen({ navigation }) {
  const [todayLectures, setTodayLectures] = useState([]);
  const [gpaSummary, setGpaSummary] = useState([]);
  const [upcomingExam, setUpcomingExam] = useState(null);
  const [upcomingExamsCount, setUpcomingExamsCount] = useState(0);
  const [userName, setUserName] = useState("");
  const [userNickname, setUserNickname] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const flatListRef = useRef(null);
  
  const { theme } = useTheme();

  const PROFILE_IMAGE_KEY = '@profile_image';

  useEffect(() => {
    loadUserData();
    loadHomeData();
  }, []);

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
        
        loadTodaysLectures(userData);
        loadGPASummary(userData);
        loadUpcomingExam(userData);
      }
    } catch (err) {
      // Handle error silently
    } finally {
      setLoading(false);
    }
  };

  const loadTodaysLectures = (userData) => {
    try {
      const day = new Date().toLocaleString("en-US", { weekday: "long" }).toLowerCase();
      const timetable = userData.timetable || {};
      
      const currentSemester = userData.current_semester || 1;
      const todaysLectures = timetable[day]?.filter(lecture => 
        lecture.semester === currentSemester
      ) || [];
      
      const formattedLectures = todaysLectures.map(lecture => ({
        course: lecture.name,
        time: `${lecture.start} - ${lecture.end}`,
        room: lecture.room,
        lecturer: lecture.lecturer
      }));
      
      setTodayLectures(formattedLectures);
    } catch (err) {
      setTodayLectures([]);
    }
  };

  const loadGPASummary = (userData) => {
    try {
      const gpaData = userData.gpa_data || {};
      const gpaSummary = [];
      
      Object.keys(gpaData).forEach(semesterKey => {
        if (gpaData[semesterKey] && gpaData[semesterKey].gpa) {
          const semesterNumber = semesterKey.replace('semester', '');
          gpaSummary.push({
            semester: `Sem ${semesterNumber}`,
            gpa: gpaData[semesterKey].gpa.toFixed(2)
          });
        }
      });
      
      gpaSummary.sort((a, b) => {
        const numA = parseInt(a.semester.replace('Sem ', ''));
        const numB = parseInt(b.semester.replace('Sem ', ''));
        return numA - numB;
      });
      
      setGpaSummary(gpaSummary);
    } catch (err) {
      setGpaSummary([]);
    }
  };

  const loadUpcomingExam = (userData) => {
    try {
      const exams = userData.exams || [];
      
      if (!Array.isArray(exams)) {
        setUpcomingExam(null);
        setUpcomingExamsCount(0);
        return;
      }
      
      const now = new Date();
      
      const upcomingExams = exams
        .filter(exam => {
          try {
            const examDate = new Date(exam.date);
            const examDateOnly = new Date(examDate.getFullYear(), examDate.getMonth(), examDate.getDate());
            const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            
            return examDateOnly >= nowDateOnly;
          } catch (err) {
            return false;
          }
        })
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      
      setUpcomingExamsCount(upcomingExams.length);
      
      if (upcomingExams.length > 0) {
        setUpcomingExam(upcomingExams[0]);
      } else {
        setUpcomingExam(null);
      }
    } catch (err) {
      setUpcomingExam(null);
      setUpcomingExamsCount(0);
    }
  };

  const loadUserData = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const userDocRef = doc(db, "users", currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        if (userData.nickname) {
          setUserNickname(userData.nickname);
        }
        
        if (!userData.nickname) {
          setUserName(currentUser.email?.split('@')[0] || "User");
        }
      } else {
        setUserName(currentUser.email?.split('@')[0] || "User");
      }

      await loadProfileImage();
      
    } catch (err) {
      setUserName("User");
    }
  };

  const loadProfileImage = async () => {
    try {
      const savedImage = await AsyncStorage.getItem(PROFILE_IMAGE_KEY);
      if (savedImage) {
        setProfileImage(savedImage);
      }
    } catch (error) {
      // Handle error silently
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const navigateToProfile = () => {
    navigation.navigate("Profile");
  };

  const getDisplayName = () => {
    return userNickname || userName || "User";
  };

  const getOverallGPA = () => {
    if (gpaSummary.length === 0) return null;
    
    const total = gpaSummary.reduce((sum, item) => sum + parseFloat(item.gpa), 0);
    return (total / gpaSummary.length).toFixed(2);
  };

  const overallGPA = getOverallGPA();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const handleScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / width);
    setCurrentCardIndex(index);
  };

  const scrollToIndex = (index) => {
    if (flatListRef.current) {
      flatListRef.current.scrollToIndex({
        index,
        animated: true,
        viewPosition: 0.5,
      });
      setCurrentCardIndex(index);
    }
  };

  const summaryCards = [
    { id: 'today', type: 'today', data: todayLectures },
    { id: 'gpa', type: 'gpa', data: gpaSummary },
  ];

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
              <Text style={styles.waveEmoji}>👋</Text>
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
        {/* Horizontal Scroll Cards */}
        <Text style={styles.sectionTitle}></Text>
        <View style={styles.section}>
          <FlatList
            ref={flatListRef}
            data={summaryCards}
            horizontal
            showsHorizontalScrollIndicator={false}
            pagingEnabled
            snapToInterval={width}
            snapToAlignment="center"
            decelerationRate="fast"
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <SummaryCard 
                type={item.type}
                data={item.data}
                theme={theme}
                navigation={navigation}
              />
            )}
            contentContainerStyle={styles.cardsContainer}
            getItemLayout={(data, index) => ({
              length: width,
              offset: width * index,
              index,
            })}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            onMomentumScrollEnd={(event) => {
              const scrollPosition = event.nativeEvent.contentOffset.x;
              const index = Math.round(scrollPosition / width);
              setCurrentCardIndex(index);
            }}
          />
          {/* Pagination Dots */}
          <View style={styles.paginationContainer}>
            {summaryCards.map((_, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => scrollToIndex(index)}
                activeOpacity={0.7}
              >
                <View 
                  style={[
                    styles.paginationDot, 
                    { 
                      backgroundColor: index === currentCardIndex 
                        ? theme.colors.primary 
                        : theme.colors.border,
                      width: index === currentCardIndex ? 12 : 8,
                      height: index === currentCardIndex ? 12 : 8,
                      borderRadius: index === currentCardIndex ? 6 : 4,
                    }
                  ]} 
                />
              </TouchableOpacity>
            ))}
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
              color="#383940"
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
            <View style={[styles.examCard, { 
              backgroundColor: theme.mode === 'dark' ? '#DC2626' : '#EF4444' // Solid red for exam card
            }]}>
              <View style={styles.examHeader}>
                <View style={[styles.examIcon, { backgroundColor: '#FFFFFF20' }]}>
                  <SvgIcon name="bell" size={20} color="#FFFFFF" />
                </View>
                <View style={styles.examTitleContainer}>
                  <Text style={[styles.examCourse, { color: '#FFFFFF' }]}>{upcomingExam.name}</Text>
                  <View style={styles.examDetailsRow}>
                    <View style={styles.examDetail}>
                      <SvgIcon name="calendar" size={14} color="#FFFFFF" opacity={0.9} />
                      <Text style={[styles.examDetailText, { color: '#FFFFFF' }]}> {upcomingExam.formattedDate}</Text>
                    </View>
                    <View style={styles.examDetail}>
                      <SvgIcon name="clock" size={14} color="#FFFFFF" opacity={0.9} />
                      <Text style={[styles.examDetailText, { color: '#FFFFFF' }]}> {upcomingExam.start} - {upcomingExam.end}</Text>
                    </View>
                  </View>
                </View>
              </View>
              {upcomingExam.semester && (
                <View style={styles.examFooter}>
                  <View style={[styles.semesterBadge, { backgroundColor: '#FFFFFF30' }]}>
                    <SvgIcon name="graduation-cap" size={12} color="#FFFFFF" />
                    <Text style={[styles.semesterText, { color: '#FFFFFF' }]}> Semester {upcomingExam.semester}</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.viewDetailsButton}
                    onPress={() => navigation.navigate("ExamTimetable")}
                  >
                    <Text style={[styles.viewDetailsText, { color: '#FFFFFF' }]}>View Details</Text>
                    <SvgIcon name="chevron-right" size={14} color="#FFFFFF" />
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
              number={upcomingExamsCount} // FIXED: Uses count instead of just 0 or 1
              label="Upcoming Exams"
              iconName="clock"
              theme={theme}
            />
          </View>
        </View>

        {/* Bottom Navigation Hint */}
        <View style={styles.bottomHint}>
          <Text style={styles.hintText}>Product of the @SND group</Text>
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
  waveEmoji: {
    fontSize: 24,
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.colors.textPrimary,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  cardsContainer: {
    paddingLeft: 0,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  paginationDot: {
    marginHorizontal: 4,
    transitionProperty: 'width, height, background-color',
    transitionDuration: '200ms',
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  examCard: {
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 20,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
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
    flexShrink: 0,
  },
  examTitleContainer: {
    flex: 1,
  },
  examCourse: {
    fontSize: 16,
    fontWeight: "700",
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
    fontWeight: "500",
  },
  examFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#FFFFFF30',
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