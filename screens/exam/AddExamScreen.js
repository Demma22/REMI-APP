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
import SvgIcon from "../../components/SvgIcon";
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../../hooks/useNotifications';

const { width } = Dimensions.get("window");

export default function AddExamScreen({ navigation }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [numPapers, setNumPapers] = useState(1);
  const [entries, setEntries] = useState([]);
  const [coursesForSemester, setCoursesForSemester] = useState([]);
  const [currentSemester, setCurrentSemester] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [showPaperPicker, setShowPaperPicker] = useState(false);
  const [showCourseDropdown, setShowCourseDropdown] = useState(null);
  
  const { theme } = useTheme();
  const { scheduleExamNotifications } = useNotifications();

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
        
        const semester = userData.current_semester || null;
        setCurrentSemester(semester);
        
        if (semester !== null && userData.units) {
          if (Array.isArray(userData.units)) {
            if (semester <= userData.units.length) {
              const coursesIndex = semester;
              const coursesAltIndex = semester - 1;
              
              if (userData.units[coursesIndex]) {
                setCoursesForSemester(userData.units[coursesIndex] || []);
              } else if (userData.units[coursesAltIndex]) {
                setCoursesForSemester(userData.units[coursesAltIndex] || []);
              } else {
                const allUnits = userData.units.flat();
                if (allUnits.length > 0) {
                  setCoursesForSemester(allUnits);
                } else {
                  setCoursesForSemester([]);
                }
              }
            } else {
              const allUnits = userData.units.flat();
              setCoursesForSemester(allUnits.length > 0 ? allUnits : []);
            }
          } else if (typeof userData.units === 'object') {
            const semesterKey = `semester${semester}`;
            if (userData.units[semesterKey]) {
              setCoursesForSemester(userData.units[semesterKey] || []);
            } else if (userData.units[semester]) {
              setCoursesForSemester(userData.units[semester] || []);
            } else {
              const allCourses = Object.values(userData.units).flat();
              setCoursesForSemester(allCourses);
            }
          } else {
            setCoursesForSemester([]);
          }
        } else {
          setCoursesForSemester([]);
        }
      }
    } catch (error) {
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

  const validateTime = (time) => {
    const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/i;
    return timeRegex.test(time);
  };

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

      const formattedDate = formatDate(selectedDate);
      
      const newExams = entries.map(paper => ({
        ...paper,
        date: selectedDate.toISOString(),
        semester: currentSemester,
        id: Date.now() + Math.random(),
        formattedDate: formattedDate,
      }));

      const userDocRef = doc(db, "users", auth.currentUser.uid);
      
      const userDoc = await getDoc(userDocRef);
      let existingExams = [];
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        if (userData.exams) {
          if (Array.isArray(userData.exams)) {
            existingExams = userData.exams;
          } else if (typeof userData.exams === 'object' && userData.exams !== null) {
            existingExams = Object.values(userData.exams);
          }
        }
      }
      
      const updatedExams = [...existingExams, ...newExams];
      
      await setDoc(userDocRef, { 
        exams: updatedExams 
      }, { merge: true });
      
      const updatedUserDoc = await getDoc(userDocRef);
      if (updatedUserDoc.exists()) {
        await scheduleExamNotifications(updatedUserDoc.data());
      }
      
      Alert.alert("Success", "Exam(s) saved successfully with notifications!");
      
      setEntries([{
        name: coursesForSemester[0] || "",
        start: "9:00 AM",
        end: "11:00 AM",
      }]);
      setNumPapers(1);
      
    } catch (error) {
      Alert.alert("Error", "Could not save exam(s)");
    }
  };

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
        <SvgIcon name="check" size={16} color={theme.colors.primary} />
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
        <SvgIcon name="check" size={16} color={theme.colors.primary} />
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
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backBtn} 
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <SvgIcon name="arrow-back" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>ADD EXAM</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContent}>
          <Text style={styles.loadingText}>Loading your data...</Text>
        </View>
        <NavigationBar />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Static Header - outside of ScrollView */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backBtn} 
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <SvgIcon name="arrow-back" size={20} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ADD EXAM</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView 
        style={styles.wrap}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <ScrollView style={styles.wrap} showsVerticalScrollIndicator={false}>
            <View style={styles.content}>
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
                  <View style={styles.semesterTextContainer}>
                    <Text style={[styles.semesterText, { 
                      color: theme.mode === 'dark' ? '#FBBF24' : '#92400E' 
                    }]}>
                      Semester {currentSemester}
                    </Text>
                    <Text style={[styles.courseCount, { 
                      color: theme.mode === 'dark' ? '#FBBF24' : '#92400E',
                      opacity: 0.8 
                    }]}>
                      {coursesForSemester.length} courses available
                    </Text>
                  </View>
                </View>
              )}

              <View style={[styles.notificationInfo, { 
                backgroundColor: theme.mode === 'dark' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(37, 99, 235, 0.1)',
                borderLeftColor: theme.colors.primary 
              }]}>
                <SvgIcon name="bell" size={16} color={theme.colors.primary} />
                <Text style={[styles.notificationText, { color: theme.colors.primary }]}>
                  Notifications will be scheduled automatically
                </Text>
              </View>

              <View style={styles.addExamSection}>
                <Text style={styles.sectionTitle}>Schedule New Exam</Text>

                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Select Date</Text>
                  <TouchableOpacity 
                    style={styles.datePickerButton}
                    onPress={() => setShowDatePicker(true)}
                    activeOpacity={0.7}
                  >
                    <SvgIcon name="calendar" size={16} color={theme.colors.primary} />
                    <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
                    <SvgIcon name="chevron-down" size={14} color={theme.colors.textSecondary} />
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

                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>How many papers</Text>
                  <TouchableOpacity 
                    style={styles.pickerButton}
                    onPress={() => setShowPaperPicker(true)}
                    activeOpacity={0.7}
                  >
                    <SvgIcon name="file" size={16} color={theme.colors.primary} />
                    <Text style={styles.pickerButtonText}>{numPapers} paper{numPapers !== 1 ? 's' : ''}</Text>
                    <SvgIcon name="chevron-down" size={14} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                {entries.map((paper, i) => (
                  <View key={i} style={styles.paperCard}>
                    <View style={styles.paperHeader}>
                      <View style={styles.paperHeaderLeft}>
                        <View style={[styles.paperNumber, { backgroundColor: theme.colors.primaryLight }]}>
                          <Text style={[styles.paperNumberText, { color: theme.colors.primary }]}>#{i + 1}</Text>
                        </View>
                        <Text style={styles.paperTitle}>
                          {i === 0 ? "First Paper" : `Paper ${i + 1}`}
                        </Text>
                      </View>
                      <SvgIcon name="exam" size={20} color={theme.colors.secondary} />
                    </View>

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
                      <SvgIcon name="book" size={16} color={theme.colors.textSecondary} />
                      <Text style={[
                        styles.courseDropdownButtonText,
                        !paper.name && styles.courseDropdownButtonTextEmpty
                      ]}>
                        {paper.name || "Select a course unit"}
                      </Text>
                      <SvgIcon name="chevron-down" size={14} color={theme.colors.textSecondary} />
                    </TouchableOpacity>

                    <View style={styles.timeRow}>
                      <View style={styles.timeInputContainer}>
                        <Text style={styles.inputLabel}>Start Time *</Text>
                        <View style={styles.timeInputWrapper}>
                          <SvgIcon name="clock" size={16} color={theme.colors.textSecondary} />
                          <TextInput 
                            style={styles.timeInput} 
                            value={paper.start} 
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
                            value={paper.end} 
                            onChangeText={(v) => updateEntry(i, "end", v)}
                            placeholder="11:00 AM"
                            placeholderTextColor={theme.colors.textPlaceholder}
                          />
                        </View>
                        <Text style={[styles.timeHint, { color: theme.colors.textTertiary }]}>Format: 11:00 AM</Text>
                      </View>
                    </View>
                  </View>
                ))}

                <TouchableOpacity 
                  style={[
                    styles.saveBtn,
                    { backgroundColor: coursesForSemester.length === 0 ? theme.colors.textTertiary : theme.colors.primary },
                    coursesForSemester.length === 0 && styles.saveBtnDisabled
                  ]} 
                  onPress={saveExams} 
                  activeOpacity={0.8}
                  disabled={coursesForSemester.length === 0}
                >
                  <SvgIcon name="save" size={18} color="white" />
                  <Text style={styles.saveBtnText}>
                    {coursesForSemester.length === 0 
                      ? "ADD COURSES FIRST" 
                      : `SAVE ${entries.length} PAPER${entries.length > 1 ? 'S' : ''}`}
                  </Text>
                </TouchableOpacity>

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
                        You need to add course units for Semester {currentSemester} before scheduling exams.
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
              </View>

              {/* Reduced margin between buttons from 20 to 5 */}
              <TouchableOpacity 
                style={[styles.viewTimetableBtn, { backgroundColor: theme.colors.secondary, marginTop: 5 }]}
                onPress={() => navigation.navigate("ExamTimetable")}
              >
                <SvgIcon name="list" size={18} color="white" />
                <Text style={styles.viewTimetableText}>VIEW EXAM TIMETABLE</Text>
              </TouchableOpacity>

              <View style={styles.bottomSpacing} />
            </View>

            <Modal
              visible={showPaperPicker}
              transparent={true}
              animationType="slide"
              onRequestClose={() => setShowPaperPicker(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Number of Papers</Text>
                    <TouchableOpacity onPress={() => setShowPaperPicker(false)}>
                      <SvgIcon name="close" size={20} color={theme.colors.textSecondary} />
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

            <Modal
              visible={showCourseDropdown !== null}
              transparent={true}
              animationType="slide"
              onRequestClose={() => setShowCourseDropdown(null)}
            >
              <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Select Course Unit</Text>
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
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    textAlign: "center",
    color: theme.colors.textSecondary,
    fontSize: 16,
    marginTop: 20,
  },
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
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
  content: {
    padding: 24,
    marginTop: 140, // Added margin for static header
  },
  addExamSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    marginBottom: 16,
  },
  semesterInfo: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  semesterIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  semesterTextContainer: {
    flex: 1,
  },
  semesterText: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  courseCount: {
    fontSize: 14,
  },
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
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    marginBottom: 12,
  },
  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    gap: 8,
  },
  dateText: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    fontWeight: "600",
    flex: 1,
  },
  pickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    gap: 8,
  },
  pickerButtonText: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    fontWeight: "600",
    flex: 1,
  },
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
    color: theme.mode === 'dark' ? '#FFFFFF' : theme.colors.textPrimary, // White text in dark mode
    fontWeight: "500",
    flex: 1,
  },
  courseDropdownButtonTextEmpty: {
    color: theme.colors.textPlaceholder,
  },
  paperCard: {
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
  },
  paperHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  paperHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  paperTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  paperNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  paperNumberText: {
    fontSize: 14,
    fontWeight: "700",
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.textPrimary,
    marginBottom: 8,
    marginTop: 12,
  },
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
  saveBtn: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 5, // Reduced from 20 to 5
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  saveBtnDisabled: {
    shadowColor: theme.colors.textTertiary,
  },
  saveBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  viewTimetableBtn: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: theme.colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  viewTimetableText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
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
    color: theme.colors.primary,
    fontWeight: "600",
  },
  bottomSpacing: {
    height: 80,
  },
});