// screens/EditTimetableScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { auth, db } from "../../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import NavigationBar from "../../components/NavigationBar";
import SvgIcon from "../../components/SvgIcon";
import { useTheme } from '../../contexts/ThemeContext';

export default function EditTimetableScreen({ navigation }) {
  if (!auth.currentUser) return <Text style={styles.center}>Not logged in</Text>;

  const [timetable, setTimetable] = useState({});
  const [currentSemester, setCurrentSemester] = useState(null);
  const [day, setDay] = useState("monday");
  const [lectures, setLectures] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showDayPicker, setShowDayPicker] = useState(false);
  const [showLecturePicker, setShowLecturePicker] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const { theme } = useTheme();

  useEffect(() => {
    load();
    const unsub = navigation.addListener("focus", load);
    return unsub;
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      
      // Load user data from Firestore
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // Get current semester
        setCurrentSemester(userData.current_semester || null);
        
        // Get timetable data
        const timetableData = userData.timetable || {};
        setTimetable(timetableData);
        
        // Get lectures for current day
        const dayList = timetableData[day] || [];
        setLectures(dayList);
        setSelectedIndex(0);
      }
    } catch (e) {
      console.log("Edit timetable load error:", e);
      Alert.alert("Error", "Could not load timetable data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const list = timetable[day] || [];
    setLectures(list);
    setSelectedIndex(0);
  }, [day, timetable]);

  const updateLecture = (idx, key, val) => {
    const copy = [...lectures];
    copy[idx] = { ...copy[idx], [key]: val };
    setLectures(copy);
  };

  const saveTimetable = async () => {
    try {
      // Update timetable with modified lectures for current day
      const updatedTimetable = { 
        ...timetable, 
        [day]: lectures 
      };

      // Save to Firestore
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      await setDoc(userDocRef, { 
        timetable: updatedTimetable 
      }, { merge: true });

      Alert.alert("Saved", "Timetable updated successfully");
      navigation.goBack();
    } catch (e) {
      console.log("Save error:", e);
      Alert.alert("Error", "Could not update timetable");
    }
  };

  const removeLecture = async (idx) => {
    try {
      // Create copy of lectures and remove the selected one
      const copy = [...lectures];
      copy.splice(idx, 1);
      
      // Update timetable with removed lecture
      const updatedTimetable = { 
        ...timetable, 
        [day]: copy 
      };

      // Save to Firestore
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      await setDoc(userDocRef, { 
        timetable: updatedTimetable 
      }, { merge: true });

      // Update local state
      setTimetable(updatedTimetable);
      setLectures(copy);
      
      // Adjust selected index
      if (copy.length === 0) {
        setSelectedIndex(0);
      } else if (selectedIndex >= copy.length) {
        setSelectedIndex(copy.length - 1);
      }

      Alert.alert("Removed", "Lecture removed successfully");
    } catch (e) {
      console.log("Remove error:", e);
      Alert.alert("Error", "Could not remove lecture");
    }
  };

  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

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
            <Text style={styles.headerTitle}>EDIT TIMETABLE</Text>
            <View style={styles.headerSpacer} />
          </View>
        </View>
        <View style={styles.content}>
          <View style={styles.emptyState}>
            <Text style={styles.emptySubtitle}>Loading timetable...</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>

        {/* Modern Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity 
              style={styles.backBtn} 
              onPress={() => navigation.goBack()}
            >
              <SvgIcon name="arrow-back" size={20} color={theme.colors.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>EDIT TIMETABLE</Text>
            <View style={styles.headerSpacer} />
          </View>
        </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Semester Info */}
          {currentSemester && (
            <View style={[styles.semesterInfo, { backgroundColor: theme.colors.warningLight, borderLeftColor: theme.colors.warning }]}>
              <Text style={[styles.semesterText, { color: theme.colors.warning }]}>Editing Semester {currentSemester} Timetable</Text>
            </View>
          )}

          {/* Day Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Select Day</Text>
            <TouchableOpacity 
              style={styles.dropdown}
              onPress={() => setShowDayPicker(true)}
            >
              <Text style={styles.dropdownText}>{capitalize(day)}</Text>
              <SvgIcon name="chevron-down" size={16} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {lectures.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIcon, { backgroundColor: theme.colors.primaryLight }]}>
                <SvgIcon name="calendar" size={32} color={theme.colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>No lectures scheduled</Text>
              <Text style={styles.emptySubtitle}>No lectures found for {capitalize(day)}</Text>
            </View>
          ) : (
            <>
              {/* Lecture Selection */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Select Lecture</Text>
                <TouchableOpacity 
                  style={styles.dropdown}
                  onPress={() => setShowLecturePicker(true)}
                >
                  <Text style={styles.dropdownText} numberOfLines={1}>
                    {lectures[selectedIndex]?.name} — {lectures[selectedIndex]?.start} - {lectures[selectedIndex]?.end}
                  </Text>
                  <SvgIcon name="chevron-down" size={16} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Edit Form */}
              <View style={styles.editCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>Lecture Details</Text>
                  <View style={[styles.lectureNumber, { backgroundColor: theme.colors.primary + '15' }]}>
                    <Text style={[styles.lectureNumberText, { color: theme.colors.primary }]}>#{selectedIndex + 1}</Text>
                  </View>
                </View>

                <View style={styles.form}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Course Name</Text>
                    <TextInput
                      style={styles.input}
                      value={lectures[selectedIndex]?.name || ""}
                      onChangeText={(v) => updateLecture(selectedIndex, "name", v)}
                      placeholder="Enter course name"
                      placeholderTextColor={theme.colors.textTertiary}
                    />
                  </View>

                  <View style={styles.row}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                      <Text style={styles.inputLabel}>Start Time</Text>
                      <TextInput
                        style={styles.input}
                        value={lectures[selectedIndex]?.start || ""}
                        onChangeText={(v) => updateLecture(selectedIndex, "start", v)}
                        placeholder="9:00 AM"
                        placeholderTextColor={theme.colors.textTertiary}
                      />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                      <Text style={styles.inputLabel}>End Time</Text>
                      <TextInput
                        style={styles.input}
                        value={lectures[selectedIndex]?.end || ""}
                        onChangeText={(v) => updateLecture(selectedIndex, "end", v)}
                        placeholder="11:00 AM"
                        placeholderTextColor={theme.colors.textTertiary}
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Lecturer</Text>
                    <TextInput
                      style={styles.input}
                      value={lectures[selectedIndex]?.lecturer || ""}
                      onChangeText={(v) => updateLecture(selectedIndex, "lecturer", v)}
                      placeholder="Enter lecturer name"
                      placeholderTextColor={theme.colors.textTertiary}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Room</Text>
                    <TextInput
                      style={styles.input}
                      value={lectures[selectedIndex]?.room || ""}
                      onChangeText={(v) => updateLecture(selectedIndex, "room", v)}
                      placeholder="Enter room number"
                      placeholderTextColor={theme.colors.textTertiary}
                    />
                  </View>
                </View>

                <View style={styles.actionButtons}>
                  <TouchableOpacity 
                    style={[styles.editButton, { backgroundColor: theme.colors.primary }]}
                    onPress={saveTimetable}
                  >
                    <SvgIcon name="content-save" size={20} color="#FFFFFF" />
                    <Text style={styles.editButtonText}>SAVE CHANGES</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.removeButton, { backgroundColor: theme.colors.danger }]}
                    onPress={() =>
                      Alert.alert(
                        "Remove Lecture",
                        "Are you sure you want to remove this lecture?",
                        [
                          { text: "Cancel", style: "cancel" },
                          { 
                            text: "Remove", 
                            style: "destructive", 
                            onPress: () => removeLecture(selectedIndex) 
                          },
                        ]
                      )
                    }
                  >
                    <SvgIcon name="delete" size={20} color="#FFFFFF" />
                    <Text style={styles.removeButtonText}>REMOVE LECTURE</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Bottom spacing for navigation */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Day Picker Modal */}
      <Modal
        visible={showDayPicker}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>Select Day</Text>
            <ScrollView style={styles.modalList}>
              {days.map((d, index) => (
                <TouchableOpacity
                  key={d}
                  style={[
                    styles.modalItem,
                    day === d && [styles.modalItemSelected, { backgroundColor: theme.colors.primary + '15' }]
                  ]}
                  onPress={() => {
                    setDay(d);
                    setShowDayPicker(false);
                  }}
                >
                  <Text style={[
                    styles.modalItemText,
                    { color: theme.colors.textPrimary },
                    day === d && [styles.modalItemTextSelected, { color: theme.colors.primary }]
                  ]}>
                    {capitalize(d)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={[styles.modalClose, { backgroundColor: theme.colors.backgroundSecondary }]}
              onPress={() => setShowDayPicker(false)}
            >
              <Text style={[styles.modalCloseText, { color: theme.colors.textPrimary }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Lecture Picker Modal */}
      <Modal
        visible={showLecturePicker}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>Select Lecture</Text>
            <ScrollView style={styles.modalList}>
              {lectures.map((lecture, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.modalItem,
                    selectedIndex === index && [styles.modalItemSelected, { backgroundColor: theme.colors.primary + '15' }]
                  ]}
                  onPress={() => {
                    setSelectedIndex(index);
                    setShowLecturePicker(false);
                  }}
                >
                  <Text style={[
                    styles.modalItemText,
                    { color: theme.colors.textPrimary },
                    selectedIndex === index && [styles.modalItemTextSelected, { color: theme.colors.primary }]
                  ]}>
                    {lecture.name} — {lecture.start} - {lecture.end}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={[styles.modalClose, { backgroundColor: theme.colors.backgroundSecondary }]}
              onPress={() => setShowLecturePicker(false)}
            >
              <Text style={[styles.modalCloseText, { color: theme.colors.textPrimary }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
  },
  semesterInfo: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
  },
  semesterText: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.colors.card,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  dropdownText: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    fontWeight: "600",
    flex: 1,
    marginRight: 8,
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
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
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
  },
  editCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 24,
    padding: 24,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  lectureNumber: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  lectureNumberText: {
    fontSize: 14,
    fontWeight: "700",
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.textPrimary,
  },
  input: {
    backgroundColor: theme.mode === 'dark' ? theme.colors.backgroundSecondary : theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  row: {
    flexDirection: "row",
  },
  actionButtons: {
    marginTop: 24,
    gap: 12,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 18,
    borderRadius: 16,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  editButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 18,
    borderRadius: 16,
    shadowColor: theme.colors.danger,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  removeButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "60%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
    textAlign: "center",
  },
  modalList: {
    maxHeight: 300,
  },
  modalItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  modalItemSelected: {},
  modalItemText: {
    fontSize: 16,
    fontWeight: "500",
  },
  modalItemTextSelected: {
    fontWeight: "700",
  },
  modalClose: {
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 16,
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: "600",
  },
  bottomSpacing: {
    height: 100,
  },
  center: { 
    textAlign: "center", 
    marginTop: 40,
    color: theme.colors.textPrimary,
  },
});