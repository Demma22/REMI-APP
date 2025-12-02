// screens/AddLectureScreen.js
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

const { width } = Dimensions.get("window");

export default function AddLectureScreen({ navigation }) {
  if (!auth.currentUser) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.center}>Not logged in</Text>
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

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const lectureOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  useEffect(() => {
    loadUserData();
  }, []);

  // Load user data and course units from Firestore - UPDATED
  const loadUserData = async () => {
    try {
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // Get current semester
        const semester = userData.current_semester || 1;
        setCurrentSemester(semester);
        
        // UPDATED: Get course units for current semester from new structure
        if (userData.units && userData.units[semester]) {
          setCoursesForSemester(userData.units[semester]);
        } else {
          setCoursesForSemester([]);
        }
      }
    } catch (error) {
      console.log("Error loading user data:", error);
      Alert.alert("Error", "Failed to load course data");
    } finally {
      setLoading(false);
    }
  };

  // Update entries when number of lectures changes
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
      // Validate all entries
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

      // Save to Firestore
      await saveToFirestore();
      
      Alert.alert("Success", "Lecture(s) added successfully!");
      navigation.goBack();
    } catch (error) {
      console.log("Save error:", error);
      Alert.alert("Error", "Could not save lecture(s)");
    }
  };

  // Save lectures to Firestore
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

      // Add new lectures with semester info
      const lecturesWithSemester = entries.map(lecture => ({
        ...lecture,
        semester: currentSemester,
        day: day,
        id: Date.now() + Math.random(),
        createdAt: new Date().toISOString()
      }));

      timetableData[dayKey] = [...timetableData[dayKey], ...lecturesWithSemester];

      // Save back to Firestore
      await setDoc(userDocRef, {
        timetable: timetableData
      }, { merge: true });

    } catch (error) {
      console.log("Firestore save error:", error);
      throw error;
    }
  };

  // Render dropdown items
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
        <Text style={styles.checkmark}>✓</Text>
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
        <Text style={styles.checkmark}>✓</Text>
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
        <Text style={styles.checkmark}>✓</Text>
      )}
    </TouchableOpacity>
  );

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

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
                <Text style={styles.backText}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>ADD LECTURE</Text>
              <View style={styles.placeholder} />
            </View>

            <View style={styles.content}>
              {/* Current Semester Info */}
              <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>Current Semester: {currentSemester}</Text>
                <Text style={styles.infoSubtitle}>
                  {coursesForSemester.length > 0 
                    ? `${coursesForSemester.length} courses available` 
                    : "No courses found for this semester"}
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
                  <Text style={styles.dropdownButtonText}>{day}</Text>
                  <Text style={styles.dropdownArrow}>▼</Text>
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
                  <Text style={styles.dropdownButtonText}>
                    {numLectures} lecture{numLectures !== 1 ? 's' : ''}
                  </Text>
                  <Text style={styles.dropdownArrow}>▼</Text>
                </TouchableOpacity>
              </View>

              {/* Lecture Forms */}
              {entries.map((lec, i) => (
                <View key={i} style={styles.lectureCard}>
                  <View style={styles.lectureHeader}>
                    <Text style={styles.lectureTitle}>
                      Lecture {i + 1}
                    </Text>
                    {coursesForSemester.length === 0 && (
                      <Text style={styles.warningText}>No courses available</Text>
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
                    <Text style={[
                      styles.courseDropdownButtonText,
                      !lec.name && styles.courseDropdownButtonTextEmpty
                    ]}>
                      {lec.name || "Select a course"}
                    </Text>
                    <Text style={styles.dropdownArrow}>▼</Text>
                  </TouchableOpacity>

                  {/* Time Inputs Row */}
                  <View style={styles.timeRow}>
                    <View style={styles.timeInputContainer}>
                      <Text style={styles.inputLabel}>Start Time *</Text>
                      <TextInput 
                        style={styles.timeInput} 
                        value={lec.start} 
                        onChangeText={(v) => updateEntry(i, "start", v)}
                        placeholder="9:00 AM"
                        placeholderTextColor="#94A3B8"
                      />
                    </View>
                    
                    <View style={styles.timeInputContainer}>
                      <Text style={styles.inputLabel}>End Time *</Text>
                      <TextInput 
                        style={styles.timeInput} 
                        value={lec.end} 
                        onChangeText={(v) => updateEntry(i, "end", v)}
                        placeholder="10:00 AM"
                        placeholderTextColor="#94A3B8"
                      />
                    </View>
                  </View>

                  {/* Lecturer Input */}
                  <Text style={styles.inputLabel}>Lecturer</Text>
                  <TextInput 
                    style={styles.input} 
                    value={lec.lecturer} 
                    onChangeText={(v) => updateEntry(i, "lecturer", v)}
                    placeholder="Enter lecturer name"
                    placeholderTextColor="#94A3B8"
                  />

                  {/* Room Input */}
                  <Text style={styles.inputLabel}>Room</Text>
                  <TextInput 
                    style={styles.input} 
                    value={lec.room} 
                    onChangeText={(v) => updateEntry(i, "room", v)}
                    placeholder="Enter room number"
                    placeholderTextColor="#94A3B8"
                  />
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
                <Text style={styles.saveBtnText}>
                  {coursesForSemester.length === 0 
                    ? "ADD COURSES FIRST" 
                    : `💾 SAVE ${entries.length} LECTURE${entries.length > 1 ? 'S' : ''}`}
                </Text>
              </TouchableOpacity>

              {/* Help Text */}
              {coursesForSemester.length === 0 && (
                <View style={styles.helpCard}>
                  <Text style={styles.helpText}>
                    You need to add course units for Semester {currentSemester} before scheduling lectures.
                  </Text>
                  <TouchableOpacity 
                    style={styles.helpButton}
                    onPress={() => navigation.navigate("EditUnits")}
                  >
                    <Text style={styles.helpButtonText}>Add Course Units</Text>
                  </TouchableOpacity>
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
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Select Day</Text>
                    <TouchableOpacity onPress={() => setShowDayDropdown(false)}>
                      <Text style={styles.modalClose}>✕</Text>
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
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Number of Lectures</Text>
                    <TouchableOpacity onPress={() => setShowLecturesDropdown(false)}>
                      <Text style={styles.modalClose}>✕</Text>
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
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Select Course</Text>
                    <TouchableOpacity onPress={() => setShowCourseDropdown(null)}>
                      <Text style={styles.modalClose}>✕</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  wrap: { 
    flex: 1, 
    backgroundColor: "#FAFAFA",
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: "#FAFAFA",
  },
  center: { 
    fontSize: 16,
    color: "#64748B"
  },

  // Header Styles
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 60,
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
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    color: "#383940", 
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
    backgroundColor: "#FFF7ED",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#FF8A23",
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#383940",
    marginBottom: 4,
  },
  infoSubtitle: {
    fontSize: 14,
    color: "#64748B",
  },

  // Section Styles
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#383940",
    marginBottom: 12,
  },

  // Dropdown Styles
  dropdownButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: "#383940",
    fontWeight: "500",
  },
  dropdownArrow: {
    fontSize: 12,
    color: "#64748B",
  },

  // Course Selection Styles
  courseDropdownButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  courseDropdownButtonEmpty: {
    borderColor: "#FDBA74",
  },
  courseDropdownButtonActive: {
    borderColor: "#FF8A23",
  },
  courseDropdownButtonText: {
    fontSize: 16,
    color: "#1E293B",
    fontWeight: "500",
  },
  courseDropdownButtonTextEmpty: {
    color: "#94A3B8",
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginHorizontal: 20,
    maxHeight: "60%",
    width: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
  },
  modalClose: {
    fontSize: 20,
    color: "#64748B",
    fontWeight: "bold",
  },
  dropdownList: {
    maxHeight: 300,
  },
  dropdownItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownItemSelected: {
    backgroundColor: "#FFF7ED",
  },
  dropdownItemText: {
    fontSize: 16,
    color: "#374151",
  },
  dropdownItemTextSelected: {
    color: "#FF8A23",
    fontWeight: "600",
  },
  checkmark: {
    color: "#FF8A23",
    fontWeight: "bold",
    fontSize: 16,
  },

  // Lecture Card Styles
  lectureCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 3,
    borderLeftColor: "#FF8A23",
  },
  lectureHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  lectureTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
  },
  warningText: {
    fontSize: 12,
    color: "#EF4444",
    fontWeight: "600",
  },

  // Input Styles
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#1E293B",
  },

  // Time Input Styles
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  timeInputContainer: {
    width: (width - 72) / 2,
  },
  timeInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#1E293B",
    textAlign: "center",
  },

  // Save Button Styles
  saveBtn: {
    backgroundColor: "#FF8A23",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
    shadowColor: "#FF8A23",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveBtnDisabled: {
    backgroundColor: "#94A3B8",
    shadowColor: "#94A3B8",
  },
  saveBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  // Help Card
  helpCard: {
    backgroundColor: "#FFF7ED",
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#FF8A23",
  },
  helpText: {
    fontSize: 14,
    color: "#92400E",
    marginBottom: 12,
    lineHeight: 20,
  },
  helpButton: {
    backgroundColor: "#FF8A23",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
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