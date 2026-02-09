import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
  Alert,
  RefreshControl,
} from "react-native";
import { auth, db } from "../../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import NavigationBar from "../../components/NavigationBar";
import SvgIcon from "../../components/SvgIcon";
import { useTheme } from '../../contexts/ThemeContext';

export default function ExamTimetableScreen({ navigation }) {
  if (!auth.currentUser) {
    return <Text style={[styles.center, { color: theme.colors.textPrimary }]}>Not logged in</Text>;
  }

  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentSemester, setCurrentSemester] = useState(null);
  
  const { theme } = useTheme();

  useEffect(() => {
    loadExams();
    const focus = navigation.addListener("focus", loadExams);
    return focus;
  }, []);

  const loadExams = async () => {
    try {
      setLoading(true);
      
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        setCurrentSemester(userData.current_semester || null);
        
        const examsData = userData.exams || [];
        
        if (Array.isArray(examsData)) {
          // Sort exams by datetime (soonest first)
          const sortedExams = examsData.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateA - dateB;
          });
          setExams(sortedExams);
        } else {
          console.log("Exams data is not an array, resetting to empty array");
          setExams([]);
        }
      } else {
        setExams([]);
      }
    } catch (error) {
      console.log("Error loading exams:", error);
      Alert.alert("Error", "Could not load exams");
      setExams([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadExams();
  };

  const deleteExam = async (examId) => {
    Alert.alert(
      "Delete Exam",
      "Are you sure you want to delete this exam?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const updatedExams = Array.isArray(exams) ? exams.filter(exam => exam.id !== examId) : [];
              
              const userDocRef = doc(db, "users", auth.currentUser.uid);
              await updateDoc(userDocRef, { 
                exams: updatedExams 
              });
              
              setExams(updatedExams);
              Alert.alert("Success", "Exam deleted successfully!");
            } catch (error) {
              console.log("Delete error:", error);
              Alert.alert("Error", "Could not delete exam");
            }
          }
        }
      ]
    );
  };

  // Group exams by date
  const groupExamsByDate = () => {
    const grouped = {};
    
    if (Array.isArray(exams)) {
      exams.forEach(exam => {
        const date = exam.formattedDate || formatDate(new Date(exam.date));
        if (!grouped[date]) {
          grouped[date] = [];
        }
        grouped[date].push(exam);
      });
    }
    
    return grouped;
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  };

  const getUpcomingExams = () => {
    const now = new Date();
    return Array.isArray(exams) ? exams.filter(exam => {
      const examDate = new Date(exam.date);
      return examDate >= now;
    }) : [];
  };

  const getPastExams = () => {
    const now = new Date();
    return Array.isArray(exams) ? exams.filter(exam => {
      const examDate = new Date(exam.date);
      return examDate < now;
    }) : [];
  };

  const groupedExams = groupExamsByDate();
  const upcomingExams = getUpcomingExams();
  const pastExams = getPastExams();

  const renderExamItem = ({ item }) => (
    <View style={styles.examItem}>
      <View style={styles.examContent}>
        <View style={styles.examHeader}>
          <Text style={styles.examCourse}>{item.name}</Text>
          <TouchableOpacity 
            style={styles.deleteBtn}
            onPress={() => deleteExam(item.id)}
          >
            <SvgIcon name="close" size={16} color={theme.colors.error} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.examDetails}>
          <View style={styles.examTimeContainer}>
            <SvgIcon name="clock" size={14} color={theme.colors.primary} />
            <Text style={styles.examTime}> {item.start} - {item.end}</Text>
          </View>
          
          {item.semester && (
            <View style={[styles.semesterBadge, { backgroundColor: theme.colors.secondary + '20' }]}>
              <Text style={[styles.semesterText, { color: theme.colors.secondary }]}>Semester {item.semester}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  const renderDateSection = ({ item: date }) => (
    <View style={styles.dateSection}>
      <View style={styles.dateHeader}>
        <Text style={styles.dateTitle}>{date}</Text>
        <Text style={styles.examCount}>
          {groupedExams[date]?.length || 0} exam{groupedExams[date]?.length !== 1 ? 's' : ''}
        </Text>
      </View>
      
      {groupedExams[date]?.map((exam, index) => (
        <View key={exam.id} style={[
          styles.examCard,
          index === groupedExams[date].length - 1 && styles.lastExamCard
        ]}>
          <View style={[styles.examColorBar, { backgroundColor: theme.colors.secondary }]} />
          <View style={styles.examCardContent}>
            <Text style={styles.examCardCourse}>{exam.name}</Text>
            <View style={styles.examCardDetails}>
              <View style={styles.examCardTimeRow}>
                <SvgIcon name="clock" size={14} color={theme.colors.primary} />
                <Text style={styles.examCardTime}> {exam.start} - {exam.end}</Text>
              </View>
              {exam.semester && (
                <View style={[styles.examCardSemesterContainer, { backgroundColor: theme.colors.primaryLight }]}>
                  <Text style={[styles.examCardSemester, { color: theme.colors.primary }]}>Semester {exam.semester}</Text>
                </View>
              )}
            </View>
          </View>
          <TouchableOpacity 
            style={[styles.examDeleteBtn, { backgroundColor: theme.colors.error + '20' }]}
            onPress={() => deleteExam(exam.id)}
          >
            <SvgIcon name="trash" size={14} color={theme.colors.error} />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );

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
            <Text style={styles.headerTitle}>EXAM TIMETABLE</Text>
            <View style={styles.headerSpacer} />
          </View>
        </View>
        <View style={styles.content}>
          <View style={styles.emptyCard}>
            <Text style={styles.emptySub}>Loading your exams...</Text>
          </View>
        </View>
        <NavigationBar />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.backBtn} 
            onPress={() => navigation.goBack()}
          >
            <SvgIcon name="arrow-back" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>EXAM TIMETABLE</Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
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
          {/* Summary Cards */}
          {exams.length > 0 && (
            <View style={styles.summarySection}>
              <View style={styles.summaryRow}>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryNumber}>{exams.length}</Text>
                  <Text style={styles.summaryLabel}>Total Exams</Text>
                </View>
                
                <View style={styles.summaryCard}>
                  <Text style={[styles.summaryNumber, { color: theme.colors.success }]}>{upcomingExams.length}</Text>
                  <Text style={styles.summaryLabel}>Upcoming</Text>
                </View>
                
                <View style={styles.summaryCard}>
                  <Text style={[styles.summaryNumber, { color: theme.colors.textSecondary }]}>{pastExams.length}</Text>
                  <Text style={styles.summaryLabel}>Completed</Text>
                </View>
              </View>
            </View>
          )}

          {/* Current Semester Info */}
          {currentSemester && (
            <View style={[styles.semesterInfo, { 
              backgroundColor: theme.mode === 'dark' ? '#3E2A1D' : '#FFF7ED',
              borderLeftColor: theme.colors.secondary 
            }]}>
              <View style={[styles.semesterIconContainer, { 
                backgroundColor: theme.mode === 'dark' ? 'rgba(251, 191, 36, 0.2)' : 'rgba(146, 64, 14, 0.1)' 
              }]}>
                <SvgIcon name="calendar" size={16} color={theme.mode === 'dark' ? '#FBBF24' : '#92400E'} />
              </View>
              <Text style={[styles.semesterText, { 
                color: theme.mode === 'dark' ? '#FBBF24' : '#92400E' 
              }]}>
                Semester {currentSemester}
              </Text>
            </View>
          )}

          {/* Exams List */}
          {exams.length > 0 ? (
            <View style={styles.examsSection}>
              <Text style={styles.sectionTitle}>Your Exam Schedule</Text>
              
              {Object.keys(groupedExams).length > 0 ? (
                <FlatList
                  data={Object.keys(groupedExams)}
                  renderItem={renderDateSection}
                  keyExtractor={(date) => date}
                  scrollEnabled={false}
                  style={styles.datesList}
                />
              ) : (
                <View style={styles.emptyState}>
                  <View style={[styles.emptyIconContainer, { backgroundColor: theme.colors.primaryLight }]}>
                    <SvgIcon name="chart" size={32} color={theme.colors.primary} />
                  </View>
                  <Text style={styles.emptyTitle}>No Exams Scheduled</Text>
                  <Text style={styles.emptySubtitle}>
                    You haven't scheduled any exams yet
                  </Text>
                </View>
              )}
            </View>
          ) : (
            /* Empty State */
            <View style={styles.emptyState}>
              <View style={[styles.emptyIconContainer, { backgroundColor: theme.colors.primaryLight }]}>
                <SvgIcon name="book" size={32} color={theme.colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>No exams scheduled yet</Text>
              <Text style={styles.emptySubtitle}>
                Schedule your first exam to get started with your exam timetable
              </Text>
              
              <TouchableOpacity 
                style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => navigation.navigate("AddExam")}
              >
                <SvgIcon name="plus" size={18} color="white" />
                <Text style={styles.addButtonText}>Schedule Your First Exam</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Bottom spacing for navigation bar */}
          <View style={styles.bottomSpacing} />
        </View>
      </ScrollView>

      {/* Floating Action Button - Only show when there are exams */}
      {exams.length > 0 && (
        <View style={styles.floatingActions}>
          <TouchableOpacity
            style={[styles.addFloatingBtn, { backgroundColor: theme.colors.primary }]}
            onPress={() => navigation.navigate("AddExam")}
          >
            <SvgIcon name="plus" size={18} color="white" />
            <Text style={styles.addFloatingText}>Add Exam</Text>
          </TouchableOpacity>
        </View>
      )}

      <NavigationBar />
    </View>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  center: {
    textAlign: "center",
    marginTop: 40,
  },
  scrollView: {
    flex: 1,
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
    flex: 1,
  },
  summarySection: {
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: theme.colors.card,
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: "800",
    color: theme.colors.primary,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: "600",
    textAlign: "center",
  },
  semesterInfo: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  semesterIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  semesterText: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  examsSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    marginBottom: 20,
  },
  datesList: {
    marginBottom: 16,
  },
  dateSection: {
    marginBottom: 24,
  },
  dateHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  dateTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  examCount: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: "600",
  },
  examCard: {
    flexDirection: "row",
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    marginBottom: 8,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  lastExamCard: {
    marginBottom: 0,
  },
  examColorBar: {
    width: 4,
  },
  examCardContent: {
    flex: 1,
    padding: 16,
  },
  examCardCourse: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  examCardDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  examCardTimeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  examCardTime: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: "600",
  },
  examCardSemesterContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  examCardSemester: {
    fontSize: 12,
    fontWeight: "600",
  },
  examDeleteBtn: {
    padding: 16,
    justifyContent: "center",
    alignItems: "center",
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
  },
  emptyState: {
    backgroundColor: theme.colors.card,
    padding: 40,
    borderRadius: 24,
    alignItems: "center",
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    marginTop: 20,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyIcon: {
    fontSize: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  addButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 20,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  examItem: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  examContent: {
    padding: 16,
  },
  examHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  examCourse: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    flex: 1,
  },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.error + '20',
    alignItems: "center",
    justifyContent: "center",
  },
  examDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  examTimeContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  examTime: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: "600",
  },
  semesterBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  semesterText: {
    fontSize: 12,
    fontWeight: "600",
  },
  floatingActions: {
    position: "absolute",
    bottom: 80,
    right: 24,
  },
  addFloatingBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    gap: 8,
  },
  addFloatingText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  emptyCard: {
    backgroundColor: theme.colors.card,
    padding: 32,
    borderRadius: 24,
    alignItems: "center",
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    marginTop: 20,
  },
  emptySub: { 
    color: theme.colors.textSecondary, 
    textAlign: "center",
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 100,
  },
});