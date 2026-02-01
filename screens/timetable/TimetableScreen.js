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
import SvgIcon from "../../components/SvgIcon";
import { useTheme } from '../../contexts/ThemeContext'; // Add this import

export default function TimetableScreen({ navigation }) {
  if (!auth.currentUser) return <Text style={styles.center}>Not logged in</Text>;

  const [timetable, setTimetable] = useState({});
  const [currentSemester, setCurrentSemester] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const { theme } = useTheme(); // Get theme from context

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
              <SvgIcon name="arrow-back" size={20} color={theme.colors.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>TIMETABLE</Text>
            <View style={styles.headerSpacer} />
          </View>
        </View>

        <View style={styles.content}>
          {/* Semester Info */}
          {currentSemester && (
            <View style={[styles.semesterInfo, { backgroundColor: theme.mode === 'dark' ? '#3E2A1D' : '#FFF7ED', borderLeftColor: theme.colors.secondary }]}>
              <View style={[styles.semesterIconContainer, { backgroundColor: theme.mode === 'dark' ? 'rgba(251, 191, 36, 0.2)' : 'rgba(146, 64, 14, 0.1)' }]}>
                <SvgIcon name="calendar" size={16} color={theme.mode === 'dark' ? '#FBBF24' : '#92400E'} />
              </View>
              <Text style={[styles.semesterText, { color: theme.mode === 'dark' ? '#FBBF24' : '#92400E' }]}>
                Semester {currentSemester} Timetable
              </Text>
            </View>
          )}

          {/* If empty: invite to add lectures */}
          {!hasFilteredLectures ? (
            <View style={styles.emptyCard}>
              <View style={[styles.emptyIcon, { backgroundColor: theme.colors.primaryLight }]}>
                <SvgIcon name="book" size={32} color={theme.colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>No lectures scheduled yet</Text>
              <Text style={styles.emptySub}>
                Add your lectures for {currentSemester ? `Semester ${currentSemester}` : "your semester"} to get started.
              </Text>

              <TouchableOpacity
                style={[styles.addPrimary, { backgroundColor: theme.colors.primary }]}
                onPress={() => navigation.navigate("AddLecture")}
              >
                <SvgIcon name="plus" size={18} color="white" />
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
                        <SvgIcon name="book" size={12} color={theme.colors.primary} />
                        <Text style={[styles.lectureCountText, { color: theme.colors.primary }]}> {list.length} lecture{list.length !== 1 ? 's' : ''}</Text>
                      </View>
                    </View>
                    
                    {list.map((lecture, i) => (
                      <View key={`${dayKey}-${i}`} style={styles.lectureCard}>
                        <View style={[styles.lectureColorBar, { backgroundColor: theme.colors.primary }]} />
                        <View style={styles.lectureContent}>
                          <Text style={styles.lectureName}>{lecture.name}</Text>
                          <View style={styles.lectureDetails}>
                            <View style={styles.lectureTimeRow}>
                              <SvgIcon name="clock" size={14} color={theme.colors.primary} />
                              <Text style={[styles.lectureTime, { color: theme.colors.primary }]}> {lecture.start} - {lecture.end}</Text>
                            </View>
                            {lecture.room && (
                              <View style={styles.lectureMetaRow}>
                                <SvgIcon name="location" size={14} color={theme.colors.textSecondary} />
                                <Text style={styles.lectureMeta}> {lecture.room}</Text>
                              </View>
                            )}
                            {lecture.lecturer && (
                              <View style={styles.lectureMetaRow}>
                                <SvgIcon name="user" size={14} color={theme.colors.textSecondary} />
                                <Text style={styles.lectureMeta}> {lecture.lecturer}</Text>
                              </View>
                            )}
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
            style={[styles.addFloatingBtn, { backgroundColor: theme.colors.primary }]}
            onPress={() => navigation.navigate("AddLecture")}
          >
            <SvgIcon name="plus" size={18} color="white" />
            <Text style={styles.addFloatingText}>Add Lecture</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.editFloatingBtn, { backgroundColor: theme.colors.secondary }]}
            onPress={() => navigation.navigate("EditTimetable")}
          >
            <SvgIcon name="edit" size={14} color="white" />
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

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
    fontSize: 24,
    fontWeight: "800",
    color: theme.colors.textPrimary,
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    padding: 24,
  },
  semesterInfo: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
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
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyTitle: { 
    fontSize: 20, 
    fontWeight: "700", 
    color: theme.colors.textPrimary,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySub: { 
    color: theme.colors.textSecondary, 
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  addPrimary: {
    paddingVertical: 16,
    paddingHorizontal: 24,
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
  addPrimaryText: { 
    color: "#FFFFFF", 
    fontWeight: "700",
    fontSize: 16,
  },
  timetableContainer: {
    marginTop: 8,
  },
  dayCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 20,
    marginBottom: 20,
    padding: 20,
    shadowColor: theme.colors.shadow,
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
    borderBottomColor: theme.colors.border,
  },
  dayTitle: { 
    fontWeight: "700", 
    fontSize: 18,
    color: theme.colors.textPrimary,
  },
  lectureCount: {
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  lectureCountText: {
    fontSize: 12,
    fontWeight: "600",
  },
  lectureCard: {
    flexDirection: "row",
    backgroundColor: theme.colors.backgroundTertiary,
    borderRadius: 16,
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  lectureColorBar: {
    width: 4,
  },
  lectureContent: {
    flex: 1,
    padding: 16,
  },
  lectureName: { 
    fontWeight: "700", 
    fontSize: 16,
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  lectureDetails: {
    gap: 6,
  },
  lectureTimeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  lectureTime: {
    fontSize: 14,
    fontWeight: "600",
  },
  lectureMetaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  lectureMeta: {
    color: theme.colors.textSecondary,
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
  editFloatingBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: theme.colors.secondary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    gap: 8,
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