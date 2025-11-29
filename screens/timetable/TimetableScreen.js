// screens/TimetableScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { auth, db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";
import NavigationBar from "../../components/NavigationBar";

export default function TimetableScreen({ navigation }) {
  if (!auth.currentUser) return <Text style={styles.center}>Not logged in</Text>;

  const [timetable, setTimetable] = useState({});
  const [currentSemester, setCurrentSemester] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
    const focus = navigation.addListener("focus", load);
    return focus;
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      
      // Load timetable from Firestore
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // Get current semester
        setCurrentSemester(userData.current_semester || null);
        
        // Get timetable data
        const timetableData = userData.timetable || {};
        setTimetable(timetableData);
      }
    } catch (e) {
      console.log("Timetable load error:", e);
    } finally {
      setLoading(false);
    }
  };

  // Grouped display: all days or empty state
  const daysOrder = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];
  const hasAny = daysOrder.some(d => (timetable[d] && timetable[d].length > 0));

  // Filter lectures for current semester only
  const getFilteredTimetable = () => {
    if (!currentSemester) return timetable;
    
    const filtered = {};
    daysOrder.forEach(day => {
      if (timetable[day]) {
        filtered[day] = timetable[day].filter(lecture => 
          lecture.semester === currentSemester
        );
      }
    });
    return filtered;
  };

  const filteredTimetable = getFilteredTimetable();
  const hasFilteredLectures = daysOrder.some(d => (filteredTimetable[d] && filteredTimetable[d].length > 0));

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
            <Text style={styles.headerTitle}>TIMETABLE</Text>
            <View style={styles.headerSpacer} />
          </View>
        </View>
        <View style={styles.content}>
          <View style={styles.emptyCard}>
            <Text style={styles.emptySub}>Loading your timetable...</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Modern Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity 
              style={styles.backBtn} 
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>TIMETABLE</Text>
            <View style={styles.headerSpacer} />
          </View>
        </View>

        <View style={styles.content}>
          {/* Semester Info */}
          {currentSemester && (
            <View style={styles.semesterInfo}>
              <Text style={styles.semesterText}>Semester {currentSemester} Timetable</Text>
            </View>
          )}

          {/* If empty: invite to add lectures */}
          {!hasFilteredLectures ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Text style={styles.emptyIconText}>📚</Text>
              </View>
              <Text style={styles.emptyTitle}>No lectures scheduled yet</Text>
              <Text style={styles.emptySub}>
                Add your lectures for {currentSemester ? `Semester ${currentSemester}` : "your semester"} to get started.
              </Text>

              <TouchableOpacity
                style={styles.addPrimary}
                onPress={() => navigation.navigate("AddLecture")}
              >
                <Text style={styles.addPrimaryText}>Add Your First Lecture</Text>
              </TouchableOpacity>
            </View>
          ) : (
            // Show grouped timetable for each day (matches wireframe layout)
            <View style={styles.timetableContainer}>
              {daysOrder.map((dayKey) => {
                const list = filteredTimetable[dayKey] || [];
                if (!list.length) return null;
                
                return (
                  <View key={dayKey} style={styles.dayCard}>
                    <View style={styles.dayHeader}>
                      <Text style={styles.dayTitle}>{capitalize(dayKey)}</Text>
                      <View style={styles.lectureCount}>
                        <Text style={styles.lectureCountText}>{list.length} lecture{list.length !== 1 ? 's' : ''}</Text>
                      </View>
                    </View>
                    
                    {list.map((lecture, i) => (
                      <View key={`${dayKey}-${i}`} style={styles.lectureCard}>
                        <View style={styles.lectureColorBar} />
                        <View style={styles.lectureContent}>
                          <Text style={styles.lectureName}>{lecture.name}</Text>
                          <View style={styles.lectureDetails}>
                            <Text style={styles.lectureTime}>🕒 {lecture.start} - {lecture.end}</Text>
                            {lecture.room && <Text style={styles.lectureMeta}>📍 {lecture.room}</Text>}
                            {lecture.lecturer && <Text style={styles.lectureMeta}>👨‍🏫 {lecture.lecturer}</Text>}
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Bottom spacing for navigation bar */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Floating Action Buttons - Only show when timetable has content */}
      {hasFilteredLectures && (
        <View style={styles.floatingActions}>
          <TouchableOpacity
            style={styles.addFloatingBtn}
            onPress={() => navigation.navigate("AddLecture")}
          >
            <Text style={styles.addFloatingIcon}>+</Text>
            <Text style={styles.addFloatingText}>Add Lecture</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.editFloatingBtn}
            onPress={() => navigation.navigate("EditTimetable")}
          >
            <Text style={styles.editFloatingIcon}>✏️</Text>
            <Text style={styles.editFloatingText}>Edit Timetable</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Navigation Bar */}
      <NavigationBar />
    </View>
  );
}

const capitalize = (s) => s && s[0].toUpperCase() + s.slice(1);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
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
    fontSize: 24,
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
  semesterInfo: {
    backgroundColor: "#FFF7ED",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#FF8A23",
  },
  semesterText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#92400E",
    textAlign: "center",
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
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(83, 95, 253, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyIconText: {
    fontSize: 32,
  },
  emptyTitle: { 
    fontSize: 20, 
    fontWeight: "700", 
    color: "#383940",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySub: { 
    color: "#666", 
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  addPrimary: {
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
  addPrimaryText: { 
    color: "#FFFFFF", 
    fontWeight: "700",
    fontSize: 16,
  },
  timetableContainer: {
    marginTop: 8,
  },
  dayCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    marginBottom: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  dayTitle: { 
    fontWeight: "700", 
    fontSize: 18,
    color: "#383940",
  },
  lectureCount: {
    backgroundColor: "rgba(83, 95, 253, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  lectureCountText: {
    color: "#535FFD",
    fontSize: 12,
    fontWeight: "600",
  },
  lectureCard: {
    flexDirection: "row",
    backgroundColor: "#FAFAFA",
    borderRadius: 16,
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  lectureColorBar: {
    width: 4,
    backgroundColor: "#535FFD",
  },
  lectureContent: {
    flex: 1,
    padding: 16,
  },
  lectureName: { 
    fontWeight: "700", 
    fontSize: 16,
    color: "#383940",
    marginBottom: 8,
  },
  lectureDetails: {
    gap: 4,
  },
  lectureTime: {
    color: "#535FFD",
    fontSize: 14,
    fontWeight: "600",
  },
  lectureMeta: {
    color: "#666",
    fontSize: 14,
  },
  floatingActions: {
    position: "absolute",
    bottom: 80,
    right: 24,
    gap: 12,
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
  editFloatingBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF8A23",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: "#FF8A23",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  editFloatingIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  editFloatingText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  bottomSpacing: {
    height: 100,
  },
});