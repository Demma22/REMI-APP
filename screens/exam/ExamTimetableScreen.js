// screens/ExamTimetableScreen.js
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

export default function ExamTimetableScreen({ navigation }) {
  if (!auth.currentUser) {
    return <Text style={styles.center}>Not logged in</Text>;
  }

  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentSemester, setCurrentSemester] = useState(null);

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
        
        // Get current semester
        setCurrentSemester(userData.current_semester || null);
        
        // Get exams data - FIX: Ensure it's always an array
        const examsData = userData.exams || [];
        
        // FIX: Check if examsData is actually an array before using array methods
        if (Array.isArray(examsData)) {
          // Sort exams by date (soonest first)
          const sortedExams = examsData.sort((a, b) => new Date(a.date) - new Date(b.date));
          setExams(sortedExams);
        } else {
          // If examsData is not an array, set empty array
          console.log("Exams data is not an array, resetting to empty array");
          setExams([]);
        }
      } else {
        setExams([]);
      }
    } catch (error) {
      console.log("Error loading exams:", error);
      Alert.alert("Error", "Could not load exams");
      setExams([]); // Set empty array on error
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
              // FIX: Ensure exams is an array before filtering
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
    
    // FIX: Ensure exams is an array before forEach
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
    // FIX: Ensure exams is an array before filtering
    return Array.isArray(exams) ? exams.filter(exam => new Date(exam.date) >= now) : [];
  };

  const getPastExams = () => {
    const now = new Date();
    // FIX: Ensure exams is an array before filtering
    return Array.isArray(exams) ? exams.filter(exam => new Date(exam.date) < now) : [];
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
            <Text style={styles.deleteText}>×</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.examDetails}>
          <View style={styles.examTimeContainer}>
            <Text style={styles.examTime}>🕒 {item.start} - {item.end}</Text>
          </View>
          
          {item.semester && (
            <View style={styles.semesterBadge}>
              <Text style={styles.semesterText}>Semester {item.semester}</Text>
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
          <View style={styles.examColorBar} />
          <View style={styles.examCardContent}>
            <Text style={styles.examCardCourse}>{exam.name}</Text>
            <View style={styles.examCardDetails}>
              <Text style={styles.examCardTime}>🕒 {exam.start} - {exam.end}</Text>
              {exam.semester && (
                <Text style={styles.examCardSemester}>Semester {exam.semester}</Text>
              )}
            </View>
          </View>
          <TouchableOpacity 
            style={styles.examDeleteBtn}
            onPress={() => deleteExam(exam.id)}
          >
            <Text style={styles.examDeleteText}>×</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );

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
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#535FFD"]}
            tintColor="#535FFD"
          />
        }
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
            <Text style={styles.headerTitle}>EXAM TIMETABLE</Text>
            <View style={styles.headerSpacer} />
          </View>
        </View>

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
                  <Text style={styles.summaryNumber}>{upcomingExams.length}</Text>
                  <Text style={styles.summaryLabel}>Upcoming</Text>
                </View>
                
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryNumber}>{pastExams.length}</Text>
                  <Text style={styles.summaryLabel}>Completed</Text>
                </View>
              </View>
            </View>
          )}

          {/* Current Semester Info */}
          {currentSemester && (
            <View style={styles.semesterInfo}>
              <Text style={styles.semesterText}>
                Current Semester: {currentSemester}
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
                  <Text style={styles.emptyIcon}>📊</Text>
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
              <View style={styles.emptyIconContainer}>
                <Text style={styles.emptyIcon}>📚</Text>
              </View>
              <Text style={styles.emptyTitle}>No exams scheduled yet</Text>
              <Text style={styles.emptySubtitle}>
                Schedule your first exam to get started with your exam timetable
              </Text>
              
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => navigation.navigate("AddExam")}
              >
                <Text style={styles.addButtonText}>+ Schedule Your First Exam</Text>
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
            style={styles.addFloatingBtn}
            onPress={() => navigation.navigate("AddExam")}
          >
            <Text style={styles.addFloatingIcon}>+</Text>
            <Text style={styles.addFloatingText}>Add Exam</Text>
          </TouchableOpacity>
        </View>
      )}

      <NavigationBar />
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  center: {
    textAlign: "center",
    marginTop: 40,
    color: "#383940",
  },
  scrollView: {
    flex: 1,
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
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: "800",
    color: "#535FFD",
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
    textAlign: "center",
  },
  semesterInfo: {
    backgroundColor: "#FFF7ED",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: "#FF8A23",
  },
  semesterText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#92400E",
    textAlign: "center",
  },
  examsSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#383940",
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
    color: "#383940",
  },
  examCount: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "600",
  },
  examCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    overflow: "hidden",
  },
  lastExamCard: {
    marginBottom: 0,
  },
  examColorBar: {
    width: 4,
    backgroundColor: "#FF8A23",
  },
  examCardContent: {
    flex: 1,
    padding: 16,
  },
  examCardCourse: {
    fontSize: 16,
    fontWeight: "700",
    color: "#383940",
    marginBottom: 8,
  },
  examCardDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  examCardTime: {
    fontSize: 14,
    color: "#535FFD",
    fontWeight: "600",
  },
  examCardSemester: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
    backgroundColor: "rgba(83, 95, 253, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  examDeleteBtn: {
    padding: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  examDeleteText: {
    color: "#EF4444",
    fontSize: 18,
    fontWeight: "bold",
  },
  emptyState: {
    backgroundColor: "#FFFFFF",
    padding: 40,
    borderRadius: 24,
    alignItems: "center",
    shadowColor: "#000",
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
    backgroundColor: "rgba(83, 95, 253, 0.1)",
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
    color: "#383940",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  addButton: {
    backgroundColor: "#535FFD",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 20,
    shadowColor: "#535FFD",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  examItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
    color: "#383940",
    flex: 1,
  },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteText: {
    color: "#EF4444",
    fontSize: 16,
    fontWeight: "bold",
  },
  examDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  examTimeContainer: {
    flex: 1,
  },
  examTime: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "600",
  },
  semesterBadge: {
    backgroundColor: "rgba(255, 138, 35, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  semesterText: {
    fontSize: 12,
    color: "#FF8A23",
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
    backgroundColor: "#535FFD",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: "#535FFD",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  addFloatingIcon: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    marginRight: 8,
  },
  addFloatingText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    padding: 32,
    borderRadius: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    marginTop: 20,
  },
  emptySub: { 
    color: "#666", 
    textAlign: "center",
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 100,
  },
});