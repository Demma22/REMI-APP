// screens/AddExamScreen.js
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
  FlatList,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import DateTimePicker from '@react-native-community/datetimepicker';
import { auth, db } from "../../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import NavigationBar from "../../components/NavigationBar";

const { width } = Dimensions.get("window");

export default function AddExamScreen({ navigation }) {
  if (!auth.currentUser) return <Text style={styles.center}>Not logged in</Text>;

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [numPapers, setNumPapers] = useState(1);
  const [entries, setEntries] = useState([]);
  const [coursesForSemester, setCoursesForSemester] = useState([]);
  const [currentSemester, setCurrentSemester] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Dropdown states - EXACTLY like AddLectureScreen
  const [showPaperPicker, setShowPaperPicker] = useState(false);
  const [showCourseDropdown, setShowCourseDropdown] = useState(null);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    const arr = Array.from({ length: numPapers }).map((_, i) => {
      const prev = entries[i] || {};
      return {
        name: prev.name || (coursesForSemester[0] || ""),
        start: prev.start || "9:00 AM",
        end: prev.end || "11:00 AM",
      };
    });
    setEntries(arr);
  }, [numPapers, coursesForSemester]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // Get current semester
        const semester = userData.current_semester || null;
        setCurrentSemester(semester);
        
        // Get courses for current semester - EXACTLY like AddLectureScreen
        if (semester && userData.units && userData.units[semester - 1]) {
          setCoursesForSemester(userData.units[semester - 1] || []);
        } else {
          setCoursesForSemester([]);
        }
      }
    } catch (error) {
      console.log("Error loading user data:", error);
      Alert.alert("Error", "Could not load user data");
    } finally {
      setLoading(false);
    }
  };

  const updateEntry = (idx, key, val) => {
    const copy = [...entries];
    copy[idx] = { ...copy[idx], [key]: val };
    setEntries(copy);
  };

  const onDateChange = (event, date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  };

  // Validate time format (HH:MM AM/PM)
  const validateTime = (time) => {
    const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/i;
    return timeRegex.test(time);
  };

  // Validate start time is before end time
  const validateTimeOrder = (start, end) => {
    const convertTo24Hour = (time) => {
      const [timePart, period] = time.split(' ');
      let [hours, minutes] = timePart.split(':').map(Number);
      
      if (period.toUpperCase() === 'PM' && hours !== 12) hours += 12;
      if (period.toUpperCase() === 'AM' && hours === 12) hours = 0;
      
      return hours * 60 + minutes;
    };

    return convertTo24Hour(start) < convertTo24Hour(end);
  };

  const saveExams = async () => {
    try {
      // Validate entries
      for (let i = 0; i < entries.length; i++) {
        const paper = entries[i];
        
        if (!paper.name.trim()) {
          Alert.alert("Error", `Please select a course for Paper ${i + 1}`);
          return;
        }
        
        if (!paper.start.trim() || !paper.end.trim()) {
          Alert.alert("Error", `Please enter both start and end times for Paper ${i + 1}`);
          return;
        }
        
        if (!validateTime(paper.start)) {
          Alert.alert("Error", `Invalid start time format for Paper ${i + 1}. Use format like "9:00 AM"`);
          return;
        }
        
        if (!validateTime(paper.end)) {
          Alert.alert("Error", `Invalid end time format for Paper ${i + 1}. Use format like "11:00 AM"`);
          return;
        }
        
        if (!validateTimeOrder(paper.start, paper.end)) {
          Alert.alert("Error", `Start time must be before end time for Paper ${i + 1}`);
          return;
        }
      }

      const newExams = entries.map(paper => ({
        ...paper,
        date: selectedDate.toISOString(),
        semester: currentSemester,
        id: Date.now() + Math.random(),
        formattedDate: formatDate(selectedDate),
      }));

      const userDocRef = doc(db, "users", auth.currentUser.uid);
      
      // Get existing exams and add new ones - FIXED VERSION
      const userDoc = await getDoc(userDocRef);
      let existingExams = [];
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // FIX: Properly handle the exams data structure
        if (userData.exams) {
          if (Array.isArray(userData.exams)) {
            // If it's already an array, use it directly
            existingExams = userData.exams;
          } else if (typeof userData.exams === 'object' && userData.exams !== null) {
            // If it's an object, convert it to array of values
            existingExams = Object.values(userData.exams);
          }
          // If it's neither array nor object, existingExams remains empty array
        }
      }
      
      // FIX: Ensure we're working with arrays
      const updatedExams = [...existingExams, ...newExams];
      
      await setDoc(userDocRef, { 
        exams: updatedExams 
      }, { merge: true });
      
      Alert.alert("Success", "Exam(s) saved successfully!");
      
      // Reset form
      setEntries([{
        name: coursesForSemester[0] || "",
        start: "9:00 AM",
        end: "11:00 AM",
      }]);
      setNumPapers(1);
      
    } catch (error) {
      console.log("Save error:", error);
      console.log("Error details:", error.message);
      Alert.alert("Error", "Could not save exam(s)");
    }
  };

  // Render dropdown items - EXACTLY like AddLectureScreen
  const renderPaperItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.dropdownItem,
        numPapers === item && styles.dropdownItemSelected
      ]}
      onPress={() => {
        setNumPapers(item);
        setShowPaperPicker(false);
      }}
    >
      <Text style={[
        styles.dropdownItemText,
        numPapers === item && styles.dropdownItemTextSelected
      ]}>
        {item} paper{item !== 1 ? 's' : ''}
      </Text>
      {numPapers === item && (
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
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backBtn} 
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>ADD EXAM</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.content}>
          <Text style={styles.loadingText}>Loading your data...</Text>
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
              <Text style={styles.headerTitle}>ADD EXAM</Text>
              <View style={styles.placeholder} />
            </View>

            <View style={styles.content}>
              {/* Semester Info */}
              {currentSemester && (
                <View style={styles.semesterInfo}>
                  <Text style={styles.semesterText}>Adding exams for Semester {currentSemester}</Text>
                  <Text style={styles.courseCount}>
                    {coursesForSemester.length} course units available
                  </Text>
                </View>
              )}

              {/* Add Exam Section */}
              <View style={styles.addExamSection}>
                <Text style={styles.sectionTitle}>Schedule New Exam</Text>

                {/* Select Date Section */}
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Select Date</Text>
                  <TouchableOpacity 
                    style={styles.datePickerButton}
                    onPress={() => setShowDatePicker(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
                    <Text style={styles.dropdownArrow}>▼</Text>
                  </TouchableOpacity>
                  
                  {showDatePicker && (
                    <DateTimePicker
                      value={selectedDate}
                      mode="date"
                      display="default"
                      onChange={onDateChange}
                      minimumDate={new Date()}
                    />
                  )}
                </View>

                {/* How many papers Section */}
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>How many papers</Text>
                  <TouchableOpacity 
                    style={styles.pickerButton}
                    onPress={() => setShowPaperPicker(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.pickerButtonText}>{numPapers} paper{numPapers !== 1 ? 's' : ''}</Text>
                    <Text style={styles.dropdownArrow}>▼</Text>
                  </TouchableOpacity>
                </View>

                {/* Paper Forms */}
                {entries.map((paper, i) => (
                  <View key={i} style={styles.paperCard}>
                    <View style={styles.paperHeader}>
                      <Text style={styles.paperTitle}>
                        {i === 0 ? "First Paper" : `Paper ${i + 1}`}
                      </Text>
                      <View style={styles.paperNumber}>
                        <Text style={styles.paperNumberText}>#{i + 1}</Text>
                      </View>
                    </View>

                    {/* Course Selection Dropdown - EXACTLY like AddLectureScreen */}
                    <Text style={styles.inputLabel}>Course Unit *</Text>
                    <TouchableOpacity
                      style={[
                        styles.courseDropdownButton,
                        !paper.name && styles.courseDropdownButtonEmpty,
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
                        !paper.name && styles.courseDropdownButtonTextEmpty
                      ]}>
                        {paper.name || "Select a course unit"}
                      </Text>
                      <Text style={styles.dropdownArrow}>▼</Text>
                    </TouchableOpacity>

                    {/* Time Inputs Row */}
                    <View style={styles.timeRow}>
                      <View style={styles.timeInputContainer}>
                        <Text style={styles.inputLabel}>Start Time *</Text>
                        <TextInput 
                          style={styles.timeInput} 
                          value={paper.start} 
                          onChangeText={(v) => updateEntry(i, "start", v)}
                          placeholder="9:00 AM"
                          placeholderTextColor="#94A3B8"
                        />
                        <Text style={styles.timeHint}>Format: 9:00 AM</Text>
                      </View>
                      
                      <View style={styles.timeInputContainer}>
                        <Text style={styles.inputLabel}>End Time *</Text>
                        <TextInput 
                          style={styles.timeInput} 
                          value={paper.end} 
                          onChangeText={(v) => updateEntry(i, "end", v)}
                          placeholder="11:00 AM"
                          placeholderTextColor="#94A3B8"
                        />
                        <Text style={styles.timeHint}>Format: 11:00 AM</Text>
                      </View>
                    </View>
                  </View>
                ))}

                {/* Save Button */}
                <TouchableOpacity 
                  style={[
                    styles.saveBtn,
                    coursesForSemester.length === 0 && styles.saveBtnDisabled
                  ]} 
                  onPress={saveExams} 
                  activeOpacity={0.8}
                  disabled={coursesForSemester.length === 0}
                >
                  <Text style={styles.saveBtnText}>
                    {coursesForSemester.length === 0 
                      ? "ADD COURSES FIRST" 
                      : `💾 SAVE ${entries.length} PAPER${entries.length > 1 ? 'S' : ''}`}
                  </Text>
                </TouchableOpacity>

                {/* Help Text */}
                {coursesForSemester.length === 0 && (
                  <View style={styles.helpCard}>
                    <Text style={styles.helpText}>
                      You need to add course units for Semester {currentSemester} before scheduling exams.
                    </Text>
                    <TouchableOpacity 
                      style={styles.helpButton}
                      onPress={() => navigation.navigate("Units")}
                    >
                      <Text style={styles.helpButtonText}>Add Course Units</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* View Timetable Button */}
              <TouchableOpacity 
                style={styles.viewTimetableBtn}
                onPress={() => navigation.navigate("ExamTimetable")}
              >
                <Text style={styles.viewTimetableText}>📅 VIEW EXAM TIMETABLE</Text>
              </TouchableOpacity>

              {/* Bottom spacing for navigation bar */}
              <View style={styles.bottomSpacing} />
            </View>

            {/* Paper Picker Modal */}
            <Modal
              visible={showPaperPicker}
              transparent={true}
              animationType="slide"
              onRequestClose={() => setShowPaperPicker(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Number of Papers</Text>
                    <TouchableOpacity onPress={() => setShowPaperPicker(false)}>
                      <Text style={styles.modalClose}>✕</Text>
                    </TouchableOpacity>
                  </View>
                  <FlatList
                    data={[1, 2, 3, 4, 5]}
                    renderItem={renderPaperItem}
                    keyExtractor={(item) => item.toString()}
                    style={styles.dropdownList}
                  />
                </View>
              </View>
            </Modal>

            {/* Course Selection Modal - EXACTLY like AddLectureScreen */}
            <Modal
              visible={showCourseDropdown !== null}
              transparent={true}
              animationType="slide"
              onRequestClose={() => setShowCourseDropdown(null)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Select Course Unit</Text>
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
  center: { 
    textAlign: "center", 
    marginTop: 40,
    fontSize: 16,
    color: "#64748B"
  },
  loadingText: {
    textAlign: "center",
    color: "#64748B",
    fontSize: 16,
    marginTop: 20,
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

  // Add Exam Section Styles
  addExamSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#383940",
    marginBottom: 16,
  },

  // Semester Info
  semesterInfo: {
    backgroundColor: "#FFF7ED",
    padding: 20,
    borderRadius: 20,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: "#FF8A23",
  },
  semesterText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#92400E",
    marginBottom: 4,
  },
  courseCount: {
    fontSize: 14,
    color: "#92400E",
    opacity: 0.8,
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

  // Date Picker Styles
  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  dateText: {
    fontSize: 16,
    color: "#383940",
    fontWeight: "600",
  },

  // Paper Picker Button
  pickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  pickerButtonText: {
    fontSize: 16,
    color: "#383940",
    fontWeight: "600",
  },
  dropdownArrow: {
    fontSize: 12,
    color: "#64748B",
  },

  // Course Selection Styles - EXACTLY like AddLectureScreen
  courseDropdownButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  courseDropdownButtonEmpty: {
    borderColor: "#FDBA74",
  },
  courseDropdownButtonActive: {
    borderColor: "#535FFD",
  },
  courseDropdownButtonText: {
    fontSize: 16,
    color: "#383940",
    fontWeight: "600",
  },
  courseDropdownButtonTextEmpty: {
    color: "#94A3B8",
  },

  // Paper Card Styles
  paperCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  paperHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  paperTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#383940",
  },
  paperNumber: {
    backgroundColor: "rgba(83, 95, 253, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  paperNumberText: {
    color: "#535FFD",
    fontSize: 14,
    fontWeight: "700",
  },

  // Input Styles
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#383940",
    marginBottom: 8,
    marginTop: 12,
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
    backgroundColor: "#FAFAFA",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#383940",
    textAlign: "center",
  },
  timeHint: {
    fontSize: 11,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 4,
  },

  // Save Button Styles
  saveBtn: {
    backgroundColor: "#535FFD",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
    shadowColor: "#535FFD",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
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

  // View Timetable Button
  viewTimetableBtn: {
    backgroundColor: "#FF8A23",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
    shadowColor: "#FF8A23",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  viewTimetableText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  // Help Card
  helpCard: {
    backgroundColor: "#FFF7ED",
    padding: 20,
    borderRadius: 16,
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
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  helpButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },

  // Modal Styles - EXACTLY like AddLectureScreen
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    marginHorizontal: 20,
    maxHeight: "60%",
    width: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#383940",
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
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownItemSelected: {
    backgroundColor: "rgba(83, 95, 253, 0.1)",
  },
  dropdownItemText: {
    fontSize: 16,
    color: "#383940",
  },
  dropdownItemTextSelected: {
    color: "#535FFD",
    fontWeight: "600",
  },
  checkmark: {
    color: "#535FFD",
    fontWeight: "bold",
    fontSize: 16,
  },

  // Bottom spacing for navigation bar
  bottomSpacing: {
    height: 80,
  },
});