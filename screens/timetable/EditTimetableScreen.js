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
            <Text style={styles.headerTitle}>EDIT TIMETABLE</Text>
            <View style={styles.headerSpacer} />
          </View>
        </View>

        <View style={styles.content}>
          {/* Semester Info */}
          {currentSemester && (
            <View style={styles.semesterInfo}>
              <Text style={styles.semesterText}>Editing Semester {currentSemester} Timetable</Text>
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
              <Text style={styles.dropdownIcon}>▼</Text>
            </TouchableOpacity>
          </View>

          {lectures.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📚</Text>
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
                  <Text style={styles.dropdownText}>
                    {lectures[selectedIndex]?.name} — {lectures[selectedIndex]?.start} - {lectures[selectedIndex]?.end}
                  </Text>
                  <Text style={styles.dropdownIcon}>▼</Text>
                </TouchableOpacity>
              </View>

              {/* Edit Form */}
              <View style={styles.editCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>Lecture Details</Text>
                  <View style={styles.lectureNumber}>
                    <Text style={styles.lectureNumberText}>#{selectedIndex + 1}</Text>
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
                      />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                      <Text style={styles.inputLabel}>End Time</Text>
                      <TextInput
                        style={styles.input}
                        value={lectures[selectedIndex]?.end || ""}
                        onChangeText={(v) => updateLecture(selectedIndex, "end", v)}
                        placeholder="11:00 AM"
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
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Room</Text>
                    <TextInput
                      style={styles.input}
                      value={lectures[selectedIndex]?.room || ""}
                      onChangeText={(v) => updateLecture(selectedIndex, "room", v)}
                      placeholder="Enter room number"
                    />
                  </View>
                </View>

                <View style={styles.actionButtons}>
                  <TouchableOpacity 
                    style={styles.editButton}
                    onPress={saveTimetable}
                  >
                    <Text style={styles.editButtonText}>💾 SAVE CHANGES</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.removeButton}
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
                    <Text style={styles.removeButtonText}>🗑️ REMOVE LECTURE</Text>
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
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Day</Text>
            <ScrollView style={styles.modalList}>
              {days.map((d, index) => (
                <TouchableOpacity
                  key={d}
                  style={[
                    styles.modalItem,
                    day === d && styles.modalItemSelected
                  ]}
                  onPress={() => {
                    setDay(d);
                    setShowDayPicker(false);
                  }}
                >
                  <Text style={[
                    styles.modalItemText,
                    day === d && styles.modalItemTextSelected
                  ]}>
                    {capitalize(d)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setShowDayPicker(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
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
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Lecture</Text>
            <ScrollView style={styles.modalList}>
              {lectures.map((lecture, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.modalItem,
                    selectedIndex === index && styles.modalItemSelected
                  ]}
                  onPress={() => {
                    setSelectedIndex(index);
                    setShowLecturePicker(false);
                  }}
                >
                  <Text style={[
                    styles.modalItemText,
                    selectedIndex === index && styles.modalItemTextSelected
                  ]}>
                    {lecture.name} — {lecture.start} - {lecture.end}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setShowLecturePicker(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
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
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#383940",
    marginBottom: 8,
  },
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  dropdownText: {
    fontSize: 16,
    color: "#383940",
    fontWeight: "600",
  },
  dropdownIcon: {
    fontSize: 12,
    color: "#64748B",
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
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
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
  },
  editCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
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
    borderBottomColor: "#F1F5F9",
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#383940",
  },
  lectureNumber: {
    backgroundColor: "rgba(83, 95, 253, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  lectureNumberText: {
    color: "#535FFD",
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
    color: "#383940",
  },
  input: {
    backgroundColor: "#FAFAFA",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    color: "#383940",
  },
  row: {
    flexDirection: "row",
  },
  actionButtons: {
    marginTop: 24,
    gap: 12,
  },
  editButton: {
    backgroundColor: "#535FFD",
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#535FFD",
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
    backgroundColor: "#F78522",
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#F78522",
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
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "60%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#383940",
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
  modalItemSelected: {
    backgroundColor: "rgba(83, 95, 253, 0.1)",
  },
  modalItemText: {
    fontSize: 16,
    color: "#383940",
    fontWeight: "500",
  },
  modalItemTextSelected: {
    color: "#535FFD",
    fontWeight: "700",
  },
  modalClose: {
    backgroundColor: "#F1F5F9",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 16,
  },
  modalCloseText: {
    color: "#383940",
    fontSize: 16,
    fontWeight: "600",
  },
  bottomSpacing: {
    height: 100,
  },
  center: { 
    textAlign: "center", 
    marginTop: 40,
    color: "#383940",
  },
});