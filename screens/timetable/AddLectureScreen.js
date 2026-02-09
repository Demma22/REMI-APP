import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Dimensions,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { auth, db } from "../../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import NavigationBar from "../../components/NavigationBar";
import SvgIcon from "../../components/SvgIcon";
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../../hooks/useNotifications';

const { width } = Dimensions.get("window");

export default function AddLectureScreen({ navigation }) {
  if (!auth.currentUser) {
    return (
      <View style={styles.centerContainer}>
        <Text style={[styles.center, { color: theme.colors.textPrimary }]}>Not logged in</Text>
      </View>
    );
  }

  const [day, setDay] = useState("Monday");
  const [numLectures, setNumLectures] = useState(1);
  const [entries, setEntries] = useState([]);
  const [coursesForSemester, setCoursesForSemester] = useState([]);
  const [currentSemester, setCurrentSemester] = useState(1);
  const [loading, setLoading] = useState(true);

  // Dropdown states
  const [showDayDropdown, setShowDayDropdown] = useState(false);
  const [showLecturesDropdown, setShowLecturesDropdown] = useState(false);
  const [showCourseDropdown, setShowCourseDropdown] = useState(null);
  
  const { theme } = useTheme();
  const { scheduleLectureNotifications } = useNotifications();

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const lectureOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        const semester = userData.current_semester || 1;
        setCurrentSemester(semester);
        
        if (userData.units && userData.units[semester]) {
          setCoursesForSemester(userData.units[semester]);
        } else {
          setCoursesForSemester([]);
        }
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load course data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const arr = Array.from({ length: numLectures }).map((_, i) => {
      const prev = entries[i] || {};
      return {
        name: prev.name || (coursesForSemester[0] || ""),
        start: prev.start || "9:00 AM",
        end: prev.end || "10:00 AM",
        lecturer: prev.lecturer || "",
        room: prev.room || "",
      };
    });
    setEntries(arr);
  }, [numLectures, coursesForSemester]);

  const updateEntry = (idx, key, val) => {
    const copy = [...entries];
    copy[idx] = { ...copy[idx], [key]: val };
    setEntries(copy);
  };

  const save = async () => {
    try {
      for (let i = 0; i < entries.length; i++) {
        const lec = entries[i];
        if (!lec.name.trim()) {
          Alert.alert("Error", `Please select a course for Lecture ${i + 1}`);
          return;
        }
        if (!lec.start.trim() || !lec.end.trim()) {
          Alert.alert("Error", `Please enter both start and end times for Lecture ${i + 1}`);
          return;
        }
      }

      await saveToFirestore();
      
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        try {
          await scheduleLectureNotifications(userDoc.data());
          
          Alert.alert(
            "Success", 
            `Lecture(s) added!\n\n` +
            `You'll get notifications every week before each lecture`
          );
          
        } catch (notificationError) {
          Alert.alert(
            "Lecture Saved",
            "Lecture was saved successfully!\n\n" +
            "Weekly notifications may not work on some Android devices.\n\n" +
            "Tip: Make sure your device allows repeating notifications in system settings.",
            [{ text: "OK", onPress: () => navigation.goBack() }]
          );
          return;
        }
      }
      
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", "Could not save lecture(s)");
    }
  };

  const saveToFirestore = async () => {
    try {
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      let timetableData = {};
      if (userDoc.exists() && userDoc.data().timetable) {
        timetableData = userDoc.data().timetable;
      }

      const dayKey = day.toLowerCase();
      if (!timetableData[dayKey]) {
        timetableData[dayKey] = [];
      }

      const lecturesWithSemester = entries.map(lecture => ({
        ...lecture,
        semester: currentSemester,
        day: day,
        id: Date.now() + Math.random(),
        createdAt: new Date().toISOString()
      }));

      timetableData[dayKey] = [...timetableData[dayKey], ...lecturesWithSemester];

      await setDoc(userDocRef, {
        timetable: timetableData
      }, { merge: true });

    } catch (error) {
      throw error;
    }
  };

  const renderDayItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.dropdownItem,
        day === item && styles.dropdownItemSelected
      ]}
      onPress={() => {
        setDay(item);
        setShowDayDropdown(false);
      }}
    >
      <Text style={[
        styles.dropdownItemText,
        day === item && styles.dropdownItemTextSelected
      ]}>
        {item}
      </Text>
      {day === item && (
        <SvgIcon name="check" size={16} color={theme.colors.secondary} />
      )}
    </TouchableOpacity>
  );

  const renderLectureItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.dropdownItem,
        numLectures === item && styles.dropdownItemSelected
      ]}
      onPress={() => {
        setNumLectures(item);
        setShowLecturesDropdown(false);
      }}
    >
      <Text style={[
        styles.dropdownItemText,
        numLectures === item && styles.dropdownItemTextSelected
      ]}>
        {item} lecture{item !== 1 ? 's' : ''}
      </Text>
      {numLectures === item && (
        <SvgIcon name="check" size={16} color={theme.colors.secondary} />
      )}
    </TouchableOpacity>
  );

  const renderCourseItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.dropdownItem,
        entries[showCourseDropdown]?.name === item && styles.dropdownItemSelected
      ]}
      onPress={() => {
        updateEntry(showCourseDropdown, "name", item);
        setShowCourseDropdown(null);
      }}
    >
      <Text style={[
        styles.dropdownItemText,
        entries[showCourseDropdown]?.name === item && styles.dropdownItemTextSelected
      ]}>
        {item}
      </Text>
      {entries[showCourseDropdown]?.name === item && (
        <SvgIcon name="check" size={16} color={theme.colors.secondary} />
      )}
    </TouchableOpacity>
  );

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const styles = getStyles(theme);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.center}>Loading...</Text>
        </View>
        <NavigationBar />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.wrap}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <ScrollView style={styles.wrap} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity 
                style={styles.backBtn} 
                onPress={() => navigation.goBack()}
                activeOpacity={0.7}
              >
                <SvgIcon name="arrow-back" size={20} color={theme.colors.primary} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>ADD LECTURE</Text>
              <View style={styles.placeholder} />
            </View>

            <View style={styles.content}>
              {/* Current Semester Info */}
              <View style={[styles.infoCard, { 
                backgroundColor: theme.mode === 'dark' ? '#3E2A1D' : '#FFF7ED',
                borderLeftColor: theme.colors.secondary 
              }]}>
                <View style={[styles.infoIconContainer, { 
                  backgroundColor: theme.mode === 'dark' ? 'rgba(251, 191, 36, 0.2)' : 'rgba(146, 64, 14, 0.1)' 
                }]}>
                  <SvgIcon name="calendar" size={16} color={theme.mode === 'dark' ? '#FBBF24' : '#92400E'} />
                </View>
                <View style={styles.infoTextContainer}>
                  <Text style={[styles.infoTitle, { 
                    color: theme.mode === 'dark' ? '#FBBF24' : '#92400E' 
                  }]}>
                    Semester {currentSemester}
                  </Text>
                  <Text style={[styles.infoSubtitle, { 
                    color: theme.mode === 'dark' ? '#FBBF24' : '#92400E' 
                  }]}>
                    {coursesForSemester.length > 0 
                      ? `${coursesForSemester.length} courses available` 
                      : "No courses found for this semester"}
                  </Text>
                </View>
              </View>

              {/* Notification Info */}
              <View style={[styles.notificationInfo, { 
                backgroundColor: theme.mode === 'dark' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(37, 99, 235, 0.1)',
                borderLeftColor: theme.colors.primary 
              }]}>
                <SvgIcon name="bell" size={16} color={theme.colors.primary} />
                <Text style={[styles.notificationText, { color: theme.colors.primary }]}>
                  Weekly notifications will be scheduled automatically
                </Text>
              </View>

              {/* Select Day Dropdown */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Select Day</Text>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setShowDayDropdown(true)}
                  activeOpacity={0.7}
                >
                  <SvgIcon name="calendar" size={16} color={theme.colors.primary} />
                  <Text style={styles.dropdownButtonText}>{day}</Text>
                  <SvgIcon name="chevron-down" size={14} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* How many lectures Dropdown */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>How many lectures for {day}?</Text>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setShowLecturesDropdown(true)}
                  activeOpacity={0.7}
                >
                  <SvgIcon name="book" size={16} color={theme.colors.primary} />
                  <Text style={styles.dropdownButtonText}>
                    {numLectures} lecture{numLectures !== 1 ? 's' : ''}
                  </Text>
                  <SvgIcon name="chevron-down" size={14} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Lecture Forms */}
              {entries.map((lec, i) => (
                <View key={i} style={styles.lectureCard}>
                  <View style={styles.lectureHeader}>
                    <View style={styles.lectureHeaderLeft}>
                      <View style={[styles.lectureNumber, { backgroundColor: theme.colors.primaryLight }]}>
                        <Text style={[styles.lectureNumberText, { color: theme.colors.primary }]}>#{i + 1}</Text>
                      </View>
                      <Text style={styles.lectureTitle}>
                        Lecture {i + 1}
                      </Text>
                    </View>
                    {coursesForSemester.length === 0 && (
                      <Text style={styles.warningText}>No courses</Text>
                    )}
                  </View>

                  {/* Course Selection Dropdown */}
                  <Text style={styles.inputLabel}>Course *</Text>
                  <TouchableOpacity
                    style={[
                      styles.courseDropdownButton,
                      !lec.name && styles.courseDropdownButtonEmpty,
                      showCourseDropdown === i && styles.courseDropdownButtonActive
                    ]}
                    onPress={() => {
                      if (coursesForSemester.length > 0) {
                        setShowCourseDropdown(i);
                      }
                    }}
                    disabled={coursesForSemester.length === 0}
                  >
                    <SvgIcon name="book" size={16} color={theme.colors.textSecondary} />
                    <Text style={[
                      styles.courseDropdownButtonText,
                      !lec.name && styles.courseDropdownButtonTextEmpty
                    ]}>
                      {lec.name || "Select a course"}
                    </Text>
                    <SvgIcon name="chevron-down" size={14} color={theme.colors.textSecondary} />
                  </TouchableOpacity>

                  {/* Time Inputs Row */}
                  <View style={styles.timeRow}>
                    <View style={styles.timeInputContainer}>
                      <Text style={styles.inputLabel}>Start Time *</Text>
                      <View style={styles.timeInputWrapper}>
                        <SvgIcon name="clock" size={16} color={theme.colors.textSecondary} />
                        <TextInput 
                          style={styles.timeInput} 
                          value={lec.start} 
                          onChangeText={(v) => updateEntry(i, "start", v)}
                          placeholder="9:00 AM"
                          placeholderTextColor={theme.colors.textPlaceholder}
                        />
                      </View>
                      <Text style={[styles.timeHint, { color: theme.colors.textTertiary }]}>Format: 9:00 AM</Text>
                    </View>
                    
                    <View style={styles.timeInputContainer}>
                      <Text style={styles.inputLabel}>End Time *</Text>
                      <View style={styles.timeInputWrapper}>
                        <SvgIcon name="clock" size={16} color={theme.colors.textSecondary} />
                        <TextInput 
                          style={styles.timeInput} 
                          value={lec.end} 
                          onChangeText={(v) => updateEntry(i, "end", v)}
                          placeholder="10:00 AM"
                          placeholderTextColor={theme.colors.textPlaceholder}
                        />
                      </View>
                      <Text style={[styles.timeHint, { color: theme.colors.textTertiary }]}>Format: 10:00 AM</Text>
                    </View>
                  </View>

                  {/* Lecturer Input */}
                  <Text style={styles.inputLabel}>Lecturer</Text>
                  <View style={styles.inputWrapper}>
                    <SvgIcon name="user" size={16} color={theme.colors.textSecondary} />
                    <TextInput 
                      style={styles.input} 
                      value={lec.lecturer} 
                      onChangeText={(v) => updateEntry(i, "lecturer", v)}
                      placeholder="Enter lecturer name"
                      placeholderTextColor={theme.colors.textPlaceholder}
                    />
                  </View>

                  {/* Room Input */}
                  <Text style={styles.inputLabel}>Room</Text>
                  <View style={styles.inputWrapper}>
                    <SvgIcon name="location" size={16} color={theme.colors.textSecondary} />
                    <TextInput 
                      style={styles.input} 
                      value={lec.room} 
                      onChangeText={(v) => updateEntry(i, "room", v)}
                      placeholder="Enter room number"
                      placeholderTextColor={theme.colors.textPlaceholder}
                    />
                  </View>
                </View>
              ))}

              {/* Save Button */}
              <TouchableOpacity 
                style={[
                  styles.saveBtn,
                  coursesForSemester.length === 0 && styles.saveBtnDisabled
                ]} 
                onPress={save} 
                activeOpacity={0.8}
                disabled={coursesForSemester.length === 0}
              >
                <SvgIcon name="save" size={18} color="white" />
                <Text style={styles.saveBtnText}>
                  {coursesForSemester.length === 0 
                    ? "ADD COURSES FIRST" 
                    : `SAVE ${entries.length} LECTURE${entries.length > 1 ? 'S' : ''}`}
                </Text>
              </TouchableOpacity>

              {/* Help Text */}
              {coursesForSemester.length === 0 && (
                <View style={[styles.helpCard, { 
                  backgroundColor: theme.mode === 'dark' ? '#3E2A1D' : '#FFF7ED',
                  borderLeftColor: theme.colors.secondary 
                }]}>
                  <SvgIcon name="alert-circle" size={16} color={theme.mode === 'dark' ? '#FBBF24' : '#92400E'} />
                  <View style={styles.helpContent}>
                    <Text style={[styles.helpText, { 
                      color: theme.mode === 'dark' ? '#FBBF24' : '#92400E' 
                    }]}>
                      You need to add course units for Semester {currentSemester} before scheduling lectures.
                    </Text>
                    <TouchableOpacity 
                      style={[styles.helpButton, { backgroundColor: theme.colors.secondary }]}
                      onPress={() => navigation.navigate("EditUnits")}
                    >
                      <SvgIcon name="plus" size={14} color="white" />
                      <Text style={styles.helpButtonText}>Add Course Units</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Bottom spacing for navigation bar */}
              <View style={styles.bottomSpacing} />
            </View>

            {/* Day Selection Modal */}
            <Modal
              visible={showDayDropdown}
              transparent={true}
              animationType="slide"
              onRequestClose={() => setShowDayDropdown(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Select Day</Text>
                    <TouchableOpacity onPress={() => setShowDayDropdown(false)}>
                      <SvgIcon name="close" size={20} color={theme.colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                  <FlatList
                    data={days}
                    renderItem={renderDayItem}
                    keyExtractor={(item) => item}
                    style={styles.dropdownList}
                  />
                </View>
              </View>
            </Modal>

            {/* Lectures Count Modal */}
            <Modal
              visible={showLecturesDropdown}
              transparent={true}
              animationType="slide"
              onRequestClose={() => setShowLecturesDropdown(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Number of Lectures</Text>
                    <TouchableOpacity onPress={() => setShowLecturesDropdown(false)}>
                      <SvgIcon name="close" size={20} color={theme.colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                  <FlatList
                    data={lectureOptions}
                    renderItem={renderLectureItem}
                    keyExtractor={(item) => item.toString()}
                    style={styles.dropdownList}
                  />
                </View>
              </View>
            </Modal>

            {/* Course Selection Modal */}
            <Modal
              visible={showCourseDropdown !== null}
              transparent={true}
              animationType="slide"
              onRequestClose={() => setShowCourseDropdown(null)}
            >
              <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Select Course</Text>
                    <TouchableOpacity onPress={() => setShowCourseDropdown(null)}>
                      <SvgIcon name="close" size={20} color={theme.colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                  <FlatList
                    data={coursesForSemester}
                    renderItem={renderCourseItem}
                    keyExtractor={(item, index) => index.toString()}
                    style={styles.dropdownList}
                  />
                </View>
              </View>
            </Modal>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* Navigation Bar */}
      <NavigationBar />
    </View>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  wrap: { 
    flex: 1, 
    backgroundColor: theme.colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  center: { 
    fontSize: 16,
  },

  // Header Styles
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: theme.colors.backgroundSecondary,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.background,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  headerTitle: { 
    color: theme.colors.textPrimary, 
    fontSize: 24, 
    fontWeight: "800",
    textAlign: "center"
  },
  placeholder: {
    width: 44,
  },

  // Content Styles
  content: {
    padding: 24,
  },

  // Info Card
  infoCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  infoSubtitle: {
    fontSize: 14,
  },

  // Notification Info
  notificationInfo: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notificationText: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },

  // Section Styles
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    marginBottom: 12,
  },

  // Dropdown Styles
  dropdownButton: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    gap: 8,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    fontWeight: "500",
    flex: 1,
  },

  // Course Selection Styles
  courseDropdownButton: {
    backgroundColor: theme.colors.backgroundTertiary,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  courseDropdownButtonEmpty: {
    borderColor: theme.colors.secondary + '50',
  },
  courseDropdownButtonActive: {
    borderColor: theme.colors.secondary,
  },
  courseDropdownButtonText: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    fontWeight: "500",
    flex: 1,
  },
  courseDropdownButtonTextEmpty: {
    color: theme.colors.textPlaceholder,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    borderRadius: 24,
    marginHorizontal: 20,
    maxHeight: "60%",
    width: "90%",
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  dropdownList: {
    maxHeight: 300,
  },
  dropdownItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownItemSelected: {
    backgroundColor: theme.colors.primary + '10',
  },
  dropdownItemText: {
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  dropdownItemTextSelected: {
    color: theme.colors.secondary,
    fontWeight: "600",
  },

  // Lecture Card Styles
  lectureCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.secondary,
  },
  lectureHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  lectureHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  lectureTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  lectureNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  lectureNumberText: {
    fontSize: 14,
    fontWeight: "700",
  },
  warningText: {
    fontSize: 12,
    color: theme.colors.error,
    fontWeight: "600",
  },

  // Input Styles
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.textPrimary,
    marginBottom: 8,
    marginTop: 12,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.backgroundTertiary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.textPrimary,
    padding: 0,
  },

  // Time Input Styles
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  timeInputContainer: {
    width: (width - 72) / 2,
  },
  timeInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.backgroundTertiary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
  },
  timeInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.textPrimary,
    textAlign: "center",
    padding: 0,
  },
  timeHint: {
    fontSize: 11,
    textAlign: "center",
    marginTop: 4,
  },

  // Save Button Styles
  saveBtn: {
    backgroundColor: theme.colors.secondary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
    shadowColor: theme.colors.secondary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  saveBtnDisabled: {
    backgroundColor: theme.colors.textSecondary,
    shadowColor: theme.colors.textSecondary,
  },
  saveBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  // Help Card
  helpCard: {
    padding: 16,
    borderRadius: 16,
    borderLeftWidth: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  helpContent: {
    flex: 1,
  },
  helpText: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  helpButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignSelf: 'flex-start',
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  helpButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },

  // Bottom spacing for navigation bar
  bottomSpacing: {
    height: 80,
  },
});