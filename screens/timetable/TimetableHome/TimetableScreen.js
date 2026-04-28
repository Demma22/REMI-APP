// screens/TimetableScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
  Modal,
} from "react-native";
import { auth, db } from "../../../firebase";
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";
import NavigationBar from "../../../components/NavigationBar";
import SvgIcon from "../../../components/SvgIcon";
import { useTheme } from '../../../contexts/ThemeContext';
import { useNotifications } from '../../../hooks/useNotifications';
import { getStyles } from "./TimetableScreen.styles";

// Helper function to capitalize first letter
const capitalize = (s) => s && s[0].toUpperCase() + s.slice(1);

// Days of the week
const daysOrder = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

// Tab options
const tabs = [
  { id: "timetable", name: "Timetable", icon: "calendar" },
  { id: "exams", name: "Exams", icon: "book" },
];

export default function TimetableScreen({ navigation }) {
  const { theme } = useTheme();
  const { cancelLectureNotifications, cancelExamNotifications } = useNotifications();
  const styles = getStyles(theme);
  
  const [activeTab, setActiveTab] = useState("timetable");
  const [timetable, setTimetable] = useState({});
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);

  useEffect(() => {
    loadData();
    const focus = navigation.addListener("focus", loadData);
    return focus;
  }, [navigation]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setTimetable(userData.timetable || {});
        
        // Clean up old exams (older than 7 days)
        const allExams = userData.exams || [];
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        const filteredExams = allExams.filter(exam => {
          let examDate;
          if (exam.date?.toDate) examDate = exam.date.toDate();
          else if (exam.date) examDate = new Date(exam.date);
          else return true;
          return examDate >= oneWeekAgo;
        });
        
        // If exams were removed, update Firestore
        if (filteredExams.length !== allExams.length) {
          await setDoc(userDocRef, { exams: filteredExams }, { merge: true });
          setExams(filteredExams);
        } else {
          setExams(allExams);
        }
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleDeleteLecture = async (dayKey, lectureIndex, lecture) => {
    Alert.alert(
      "Delete Activity",
      `Are you sure you want to delete "${lecture.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              if (lecture.id) {
                await cancelLectureNotifications([lecture.id]);
              }

              const dayLectures = [...(timetable[dayKey] || [])];
              dayLectures.splice(lectureIndex, 1);
              
              const updatedTimetable = { ...timetable, [dayKey]: dayLectures };

              const userDocRef = doc(db, "users", auth.currentUser.uid);
              await setDoc(userDocRef, { timetable: updatedTimetable }, { merge: true });

              setTimetable(updatedTimetable);
              Alert.alert("Success", "Activity deleted successfully");
            } catch (error) {
              Alert.alert("Error", "Failed to delete activity");
            }
          }
        }
      ]
    );
  };

  const handleDeleteExam = async (examIndex, exam) => {
    Alert.alert(
      "Delete Exam",
      `Are you sure you want to delete "${exam.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              if (exam.id && cancelExamNotifications) {
                await cancelExamNotifications([exam.id]);
              }

              const updatedExams = exams.filter((_, i) => i !== examIndex);
              
              const userDocRef = doc(db, "users", auth.currentUser.uid);
              await setDoc(userDocRef, { exams: updatedExams }, { merge: true });

              setExams(updatedExams);
              Alert.alert("Success", "Exam deleted successfully");
            } catch (error) {
              Alert.alert("Error", "Failed to delete exam");
            }
          }
        }
      ]
    );
  };

  const handleEditLecture = (dayKey, lectureIndex, lecture) => {
    navigation.navigate("EditTimetable", {
      initialDay: dayKey,
      initialLectureIndex: lectureIndex,
      lecture: lecture
    });
  };

  const handleEditExam = (examIndex, exam) => {
    navigation.navigate("EditExam", { exam, examIndex });
  };

  const handleAddTimetable = () => {
    setShowAddMenu(false);
    navigation.navigate("AddActivity");
  };

  const handleScanTimetable = () => {
    setShowAddMenu(false);
    navigation.navigate("AITimetableScanner", { mode: "lectures" });
  };

  const handleAddExam = () => {
    setShowAddMenu(false);
    navigation.navigate("AddExam");
  };

  const handleScanExamTimetable = () => {
    setShowAddMenu(false);
    navigation.navigate("AITimetableScanner", { mode: "exams" });
  };

  const handleAddButtonPress = () => {
    setShowAddMenu(true);
  };

  const getFilteredTimetable = () => {
    // No semester filtering - return all activities
    return timetable;
  };

  const filteredTimetable = getFilteredTimetable();
  const hasAnyLecture = daysOrder.some(d => (filteredTimetable[d] && filteredTimetable[d].length > 0));
  const hasAnyExam = exams.length > 0;

  const formatExamDate = (date) => {
    if (!date) return "TBD";
    if (date.toDate) return date.toDate().toLocaleDateString();
    return new Date(date).toLocaleDateString();
  };

  const getUpcomingExams = () => {
    const now = new Date();
    return exams
      .filter(exam => {
        let examDate;
        if (exam.date?.toDate) examDate = exam.date.toDate();
        else if (exam.date) examDate = new Date(exam.date);
        else return false;
        return examDate >= now;
      })
      .sort((a, b) => {
        let dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
        let dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
        return dateA - dateB;
      });
  };

  const getPastExams = () => {
    const now = new Date();
    return exams
      .filter(exam => {
        let examDate;
        if (exam.date?.toDate) examDate = exam.date.toDate();
        else if (exam.date) examDate = new Date(exam.date);
        else return false;
        return examDate < now;
      })
      .sort((a, b) => {
        let dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
        let dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
        return dateB - dateA;
      });
  };

  const upcomingExams = getUpcomingExams();
  const pastExams = getPastExams();

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <SvgIcon name="arrow-back" size={20} color={theme.colors.secondary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>MY SCHEDULE</Text>
            <View style={styles.headerSpacer} />
          </View>
        </View>
        <View style={styles.content}>
          <View style={styles.emptyCard}>
            <Text style={styles.emptySub}>Loading your schedule...</Text>
          </View>
        </View>
        <NavigationBar />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <SvgIcon name="arrow-back" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>MY SCHEDULE</Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => setActiveTab(tab.id)}
          >
            <SvgIcon 
              name={tab.icon} 
              size={18} 
              color={activeTab === tab.id ? theme.colors.primary : theme.colors.textSecondary} 
            />
            <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
              {tab.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
        }
      >
        <View style={styles.content}>
          {activeTab === "timetable" ? (
            <>
              {!hasAnyLecture ? (
                <View style={styles.emptyCard}>
                  <View style={[styles.emptyIcon, { backgroundColor: theme.colors.primaryLight }]}>
                    <SvgIcon name="calendar" size={32} color={theme.colors.primary} />
                  </View>
                  <Text style={styles.emptyTitle}>No activities scheduled yet</Text>
                  <Text style={styles.emptySub}>
                    Add your weekly activities (study time, lectures, etc.) to stay organized.
                  </Text>
                  
                  <TouchableOpacity
                    style={[styles.primaryButton, { backgroundColor: theme.colors.primary }]}
                    onPress={handleAddButtonPress}
                  >
                    <SvgIcon name="plus" size={18} color="white" />
                    <Text style={styles.primaryButtonText}>Add Activity</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.timetableContainer}>
                  {daysOrder.map((dayKey) => {
                    const list = filteredTimetable[dayKey] || [];
                    if (!list.length) return null;
                    
                    return (
                      <View key={dayKey} style={styles.dayCard}>
                        <View style={styles.dayHeader}>
                          <Text style={styles.dayTitle}>{capitalize(dayKey)}</Text>
                          <View style={styles.lectureCount}>
                            <SvgIcon name="book" size={12} color="#FFFFFF" />
                            <Text style={styles.lectureCountText}> {list.length}</Text>
                          </View>
                        </View>
                        
                        {list.map((lecture, i) => (
                          <View key={`${dayKey}-${i}`} style={styles.lectureCard}>
                            <View style={styles.lectureColorBar} />
                            <View style={styles.lectureContent}>
                              <Text style={styles.lectureName}>{lecture.name}</Text>
                              <View style={styles.lectureDetails}>
                                <View style={styles.lectureTimeRow}>
                                  <SvgIcon name="clock" size={14} color="rgba(255,255,255,0.9)" />
                                  <Text style={styles.lectureTime}> {lecture.start} - {lecture.end}</Text>
                                </View>
                                {lecture.location && (
                                  <View style={styles.lectureMetaRow}>
                                    <SvgIcon name="location" size={14} color="rgba(255,255,255,0.75)" />
                                    <Text style={styles.lectureMeta}> {lecture.location}</Text>
                                  </View>
                                )}
                                {lecture.lecturer && (
                                  <View style={styles.lectureMetaRow}>
                                    <SvgIcon name="user" size={14} color="rgba(255,255,255,0.75)" />
                                    <Text style={styles.lectureMeta}> {lecture.lecturer}</Text>
                                  </View>
                                )}
                                {lecture.type && (
                                  <View style={styles.lectureMetaRow}>
                                    <SvgIcon name="tag" size={14} color="rgba(255,255,255,0.75)" />
                                    <Text style={styles.lectureMeta}> {capitalize(lecture.type)}</Text>
                                  </View>
                                )}
                              </View>
                            </View>
                            
                            <View style={styles.lectureActions}>
                              <TouchableOpacity
                                style={[styles.actionButton, styles.editButton]}
                                onPress={() => handleEditLecture(dayKey, i, lecture)}
                              >
                                <SvgIcon name="pencil" size={18} color="#FFFFFF" />
                              </TouchableOpacity>
                              
                              <TouchableOpacity
                                style={[styles.actionButton, styles.deleteButton]}
                                onPress={() => handleDeleteLecture(dayKey, i, lecture)}
                              >
                                <SvgIcon name="trash" size={18} color="#FFFFFF" />
                              </TouchableOpacity>
                            </View>
                          </View>
                        ))}
                      </View>
                    );
                  })}
                </View>
              )}
            </>
          ) : (
            // Exams Tab
            <View>
              {!hasAnyExam ? (
                <View style={styles.emptyCard}>
                  <View style={[styles.emptyIcon, { backgroundColor: theme.colors.dangerLight }]}>
                    <SvgIcon name="book" size={32} color={theme.colors.danger} />
                  </View>
                  <Text style={styles.emptyTitle}>No exams scheduled</Text>
                  <Text style={styles.emptySub}>
                    Add your exams to get reminders and stay prepared.
                  </Text>
                  
                  <TouchableOpacity
                    style={[styles.primaryButton, { backgroundColor: theme.colors.danger }]}
                    onPress={handleAddButtonPress}
                  >
                    <SvgIcon name="plus" size={18} color="white" />
                    <Text style={styles.primaryButtonText}>Add Exam</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  {/* Upcoming Exams */}
                  {upcomingExams.length > 0 && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Upcoming Exams</Text>
                      {upcomingExams.map((exam, idx) => (
                        <View key={idx} style={styles.examCard}>
                          <View style={styles.examHeader}>
                            <Text style={styles.examName}>{exam.name}</Text>
                            <View style={styles.examActions}>
                              <TouchableOpacity onPress={() => handleEditExam(idx, exam)}>
                                <SvgIcon name="pencil" size={18} color="#FFFFFF" />
                              </TouchableOpacity>
                              <TouchableOpacity onPress={() => handleDeleteExam(idx, exam)}>
                                <SvgIcon name="trash" size={18} color="#FDAC1B" />
                              </TouchableOpacity>
                            </View>
                          </View>
                          <View style={styles.examDetails}>
                            <View style={styles.examInfoRow}>
                              <SvgIcon name="calendar" size={14} color="#FFFFFF" />
                              <Text style={styles.examInfoText}>{formatExamDate(exam.date)}</Text>
                            </View>
                            <View style={styles.examInfoRow}>
                              <SvgIcon name="clock" size={14} color="#FFFFFF" />
                              <Text style={styles.examInfoText}>{exam.start || "TBD"}</Text>
                            </View>
                            {exam.room && (
                              <View style={styles.examInfoRow}>
                                <SvgIcon name="location" size={14} color="#FFFFFF" />
                                <Text style={styles.examInfoText}>Room {exam.room}</Text>
                              </View>
                            )}
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                  
                  {/* Past Exams */}
                  {pastExams.length > 0 && (
                    <View style={styles.section}>
                      <Text style={[styles.sectionTitle, { color: theme.colors.textTertiary }]}>Past Exams</Text>
                      {pastExams.map((exam, idx) => (
                        <View key={idx} style={[styles.pastExamCard, { opacity: 0.5 }]}>
                          <Text style={styles.examName}>{exam.name}</Text>
                          <View style={styles.examDetails}>
                            <View style={styles.examInfoRow}>
                              <SvgIcon name="calendar" size={14} color={theme.colors.secondary} />
                              <Text style={styles.examInfoText}>{formatExamDate(exam.date)}</Text>
                            </View>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </>
              )}
            </View>
          )}
        </View>
        
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Floating Action Button */}
      <View style={styles.floatingActions}>
        <TouchableOpacity
          style={[styles.floatingBtn, { backgroundColor: activeTab === "timetable" ? theme.colors.secondary : theme.colors.danger }]}
          onPress={handleAddButtonPress}
        >
          <SvgIcon name="plus" size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* Add Menu Modal */}
      <Modal
        visible={showAddMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAddMenu(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowAddMenu(false)}
        >
          <View style={[styles.menuModal, { backgroundColor: theme.colors.card }]}>
            {activeTab === "timetable" ? (
              <>
                <TouchableOpacity style={styles.menuItem} onPress={handleScanTimetable}>
                  <View style={[styles.menuIconBg, { backgroundColor: theme.colors.primaryLight }]}>
                    <SvgIcon name="scan" size={20} color={theme.colors.primary} />
                  </View>
                  <View style={styles.menuTextContainer}>
                    <Text style={[styles.menuItemTitle, { color: theme.colors.textPrimary }]}>
                      Scan with AI
                    </Text>
                    <Text style={[styles.menuItemDesc, { color: theme.colors.textSecondary }]}>
                      Use screenshots to extract timetable from image
                    </Text>
                  </View>
                </TouchableOpacity>
                <View style={[styles.menuDivider, { backgroundColor: theme.colors.border }]} />
                <TouchableOpacity style={styles.menuItem} onPress={handleAddTimetable}>
                  <View style={[styles.menuIconBg, { backgroundColor: theme.colors.secondaryLight }]}>
                    <SvgIcon name="edit" size={20} color={theme.colors.secondary} />
                  </View>
                  <View style={styles.menuTextContainer}>
                    <Text style={[styles.menuItemTitle, { color: theme.colors.textPrimary }]}>
                      Add Manually
                    </Text>
                    <Text style={[styles.menuItemDesc, { color: theme.colors.textSecondary }]}>
                      Enter lecture details manually
                    </Text>
                  </View>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity style={styles.menuItem} onPress={handleScanExamTimetable}>
                  <View style={[styles.menuIconBg, { backgroundColor: theme.colors.dangerLight }]}>
                    <SvgIcon name="scan" size={20} color={theme.colors.danger} />
                  </View>
                  <View style={styles.menuTextContainer}>
                    <Text style={[styles.menuItemTitle, { color: theme.colors.textPrimary }]}>
                      Scan with AI
                    </Text>
                    <Text style={[styles.menuItemDesc, { color: theme.colors.textSecondary }]}>
                      Use screenshots to extract timetable from image
                    </Text>
                  </View>
                </TouchableOpacity>
                <View style={[styles.menuDivider, { backgroundColor: theme.colors.border }]} />
                <TouchableOpacity style={styles.menuItem} onPress={handleAddExam}>
                  <View style={[styles.menuIconBg, { backgroundColor: theme.colors.dangerLight }]}>
                    <SvgIcon name="edit" size={20} color={theme.colors.danger} />
                  </View>
                  <View style={styles.menuTextContainer}>
                    <Text style={[styles.menuItemTitle, { color: theme.colors.textPrimary }]}>
                      Add Manually
                    </Text>
                    <Text style={[styles.menuItemDesc, { color: theme.colors.textSecondary }]}>
                      Enter exam details manually
                    </Text>
                  </View>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      <NavigationBar />
    </View>
  );
}