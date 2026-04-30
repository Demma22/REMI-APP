// screens/HomeScreen.js
import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  Image,
  ScrollView,
  Dimensions,
  FlatList,
} from "react-native";
import { auth, db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";
import AsyncStorage from '@react-native-async-storage/async-storage';
import SvgIcon from "../../components/SvgIcon";
import { useTheme } from '../../contexts/ThemeContext';
import { ImageBackground } from 'react-native';
import {
  getStyles,
  getMenuItemStyles,
  getStatItemStyles,
  getSummaryCardStyles,
  getSettingsMenuItemStyles
} from './HomeScreen.styles';

const { width } = Dimensions.get("window");

/* Menu Item Component - For main 3 colored menu items */
function MenuItem({ label, color, iconName, subtitle, action, theme }) {
  const menuItemStyles = getMenuItemStyles(theme, color);
  
  return (
    <TouchableOpacity 
      style={menuItemStyles.menuItem}
      onPress={action}
      activeOpacity={0.7}
    >
      <View style={menuItemStyles.menuIconContainer}>
        <SvgIcon name={iconName} size={50} color={color} />
      </View>
      <Text style={menuItemStyles.menuText}>{label}</Text>
      <Text style={menuItemStyles.menuSubtitle}>{subtitle}</Text>
    </TouchableOpacity>
  );
}

/* Settings Menu Item Component */
function SettingsMenuItem({ label, iconName, action, theme }) {
  const settingsStyles = getSettingsMenuItemStyles(theme);
  
  return (
    <TouchableOpacity 
      style={settingsStyles.settingsItem}
      onPress={action}
      activeOpacity={0.7}
    >
      <View style={settingsStyles.settingsIconContainer}>
        <SvgIcon name={iconName} size={20} color={theme.colors.textSecondary} />
      </View>
      <Text style={settingsStyles.settingsText}>{label}</Text>
      <SvgIcon name="chevron-right" size={16} color={theme.colors.textSecondary} />
    </TouchableOpacity>
  );
}

/* Stat Item Component */
function StatItem({ number, label, iconName, theme }) {
  const statItemStyles = getStatItemStyles(theme);
  
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
      background: '#535FFD',
      iconBackground: '#FFFFFF',
      iconColor: '#535FFD',
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
  const styles = getSummaryCardStyles(theme, colors);

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
              <Text style={styles.summaryEmpty}>Nothing Scheduled for today</Text>
              <Text style={styles.emptySubtitle}>Enjoy your free time!</Text>
            </View>
          ) : (
            todayLectures.slice(0, 3).map((lec, idx) => (
              <View key={idx} style={styles.lectureItem}>
                <View style={styles.lectureDot}></View>
                <View style={styles.lectureInfo}>
                  <Text style={styles.lectureCourse}>{lec.course}</Text>
                  <Text style={styles.lectureTime}>{lec.time}</Text>
                </View>
              </View>
            ))
          )}
          {todayLectures.length > 3 && (
            <TouchableOpacity 
              style={styles.moreContainer}
              onPress={() => navigation.navigate("Timetable")}
            >
              <Text style={styles.moreText}>View {todayLectures.length - 3} more</Text>
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
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const flatListRef = useRef(null);
  
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const PROFILE_IMAGE_KEY = '@profile_image';

  useEffect(() => {
    loadUserData();
    loadHomeData();
    checkOnboardingStatus();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadUserData();
      loadHomeData();
      checkOnboardingStatus();
    });

    return unsubscribe;
  }, [navigation]);

  const checkOnboardingStatus = async () => {
    try {
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        // Check if user has completed the new onboarding
        const hasNewOnboarding = userData.heardFrom && 
                                  userData.purpose && 
                                  userData.purpose.length > 0 && 
                                  userData.studyStage &&
                                  userData.nickname;
        
        setNeedsOnboarding(!hasNewOnboarding);
      }
    } catch (error) {
      console.error("Error checking onboarding status:", error);
    }
  };

  const handleCompleteOnboarding = () => {
    navigation.navigate("Onboarding");
  };

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
      console.error("Error loading home data:", err);
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
        lecturer: lecture.lecturer,
        start: lecture.start,
        end: lecture.end
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
            return examDate >= now;
          } catch (err) {
            return false;
          }
        })
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      
      setUpcomingExamsCount(upcomingExams.length);
      
      if (upcomingExams.length > 0) {
        const exam = upcomingExams[0];
        const examDate = new Date(exam.date);
        
        setUpcomingExam({
          name: exam.name,
          date: exam.date,
          formattedDate: examDate.toLocaleDateString(),
          start: exam.start || "TBD",
          end: exam.end || "",
          semester: exam.semester
        });
      } else {
        setUpcomingExam(null);
      }
    } catch (err) {
      console.error("Error loading upcoming exam:", err);
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

  const navigateToProfile = () => {
    navigation.navigate("Profile");
  };

  const getDisplayName = () => {
    return userNickname || userName || "User";
  };

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

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <Text style={styles.welcome}>Loading...</Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
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
        {/* Onboarding Banner - Only show if user hasn't completed onboarding */}
        {needsOnboarding && (
          <View style={[styles.onboardingBanner, { backgroundColor: theme.colors.primaryLight }]}>
            <View style={styles.onboardingBannerContent}>
              <View style={[styles.onboardingBannerIcon]}>
                <SvgIcon name="complete" size={60} color={theme.colors.primary} />
              </View>
              <View style={styles.onboardingBannerText}>
                <Text style={[styles.onboardingBannerTitle, { color: theme.colors.textPrimary }]}>
                  Complete Your Profile
                </Text>
                <Text style={[styles.onboardingBannerSubtitle, { color: theme.colors.textSecondary }]}>
                  Tell us a bit about yourself
                </Text>
              </View>
              <TouchableOpacity 
                style={[styles.onboardingBannerButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleCompleteOnboarding}
              >
                <Text style={styles.onboardingBannerButtonText}>Click Here</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Horizontal Scroll Cards */}
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

        {/* Main Quick Actions - 3 colored items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
          <View style={styles.grid}>
            <MenuItem
              label="Timetable"
              color={theme.colors.primary}
              iconName="timetable"
              subtitle="View schedule"
              action={() => navigation.navigate("Timetable")}
              theme={theme}
            />

            <MenuItem
              label="AI Assistant"
              color={theme.colors.primary}
              iconName="ai-home"
              subtitle="Chat with Remi"
              action={() => navigation.navigate("Chat")}
              theme={theme}
            />

            <MenuItem
              label="GPA"
              color={theme.colors.primary}
              iconName="gpa"
              subtitle="Track grades"
              action={() => navigation.navigate("GPA")}
              theme={theme}
            />
          </View>
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <SettingsMenuItem
            label="Settings"
            iconName="cog"
            action={() => navigation.navigate("Settings")}
            theme={theme}
          />
        </View>

        {/* Upcoming Exam Card */}
        {upcomingExam && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upcoming Exam</Text>
            <View style={[styles.examCard, { 
              backgroundColor: theme.mode === 'dark' ? '#DC2626' : '#EF4444'
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
                      <Text style={[styles.examDetailText, { color: '#FFFFFF' }]}> {upcomingExam.start}</Text>
                    </View>
                  </View>
                </View>
              </View>
              <View style={styles.examFooter}>
                {upcomingExam.semester && (
                  <View style={[styles.semesterBadge, { backgroundColor: '#FFFFFF30' }]}>
                    <SvgIcon name="graduation-cap" size={12} color="#FFFFFF" />
                    <Text style={[styles.semesterText, { color: '#FFFFFF' }]}> Semester {upcomingExam.semester}</Text>
                  </View>
                )}
                <TouchableOpacity 
                  style={styles.viewDetailsButton}
                  onPress={() => navigation.navigate("ExamTimetable")}
                >
                  <Text style={[styles.viewDetailsText, { color: '#FFFFFF' }]}>View Details</Text>
                  <SvgIcon name="chevron-right" size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

      </ScrollView>
    </View>
  );
}