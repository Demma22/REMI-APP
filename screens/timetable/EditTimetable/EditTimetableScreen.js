// screens/timetable/EditTimetableScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { auth, db } from "../../../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import NavigationBar from "../../../components/NavigationBar";
import SvgIcon from "../../../components/SvgIcon";
import { useTheme } from '../../../contexts/ThemeContext';
import { useNotifications } from '../../../hooks/useNotifications';
import { getStyles } from "./EditTimetableScreen.styles";
import TimePicker from "../components/TimePicker";
import ActivityTypeSelector from "../components/ActivityTypeSelector";

const capitalize = (s) => s && s[0].toUpperCase() + s.slice(1);

const hours = Array.from({ length: 12 }, (_, i) => i + 1);
const minutes = ["00", "15", "30", "45"];
const periods = ["AM", "PM"];

const activityTypes = [
  { id: "study", name: "Study 📚", color: "#3B82F6" },
  { id: "lecture", name: "Lecture 🎓", color: "#8B5CF6" },
  { id: "break", name: "Break ☕", color: "#10B981" },
  { id: "exercise", name: "Exercise 🏃", color: "#F59E0B" },
  { id: "meeting", name: "Meeting 👥", color: "#EF4444" },
  { id: "custom", name: "Custom ⚙️", color: "#6B7280" },
];

export default function EditTimetableScreen({ navigation, route }) {
  if (!auth.currentUser) return null;

  // Get params - using the names from TimetableScreen
  const { initialDay, initialLectureIndex, lecture } = route.params;
  
  console.log("Received params:", { initialDay, initialLectureIndex, lecture });
  
  const dayKey = initialDay;
  const lectureIndex = initialLectureIndex;
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form fields
  const [activityName, setActivityName] = useState("");
  const [activityType, setActivityType] = useState("study");
  const [startHour, setStartHour] = useState(9);
  const [startMinute, setStartMinute] = useState("00");
  const [startPeriod, setStartPeriod] = useState("AM");
  const [endHour, setEndHour] = useState(10);
  const [endMinute, setEndMinute] = useState("00");
  const [endPeriod, setEndPeriod] = useState("AM");
  const [lecturer, setLecturer] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  
  const { scheduleLectureNotifications, cancelLectureNotificationsById } = useNotifications();
  const { theme } = useTheme();
  const styles = getStyles(theme);

  useEffect(() => {
    if (lecture) {
      loadLectureData();
    } else {
      Alert.alert("Error", "No lecture data found");
      navigation.goBack();
    }
  }, []);

  const loadLectureData = () => {
    console.log("Loading lecture data:", lecture);
    
    if (lecture) {
      setActivityName(lecture.name || "");
      setActivityType(lecture.type || "study");
      setLecturer(lecture.lecturer || "");
      setLocation(lecture.location || lecture.room || "");
      setNotes(lecture.notes || "");
      
      // Parse start time
      if (lecture.start) {
        const timeStr = lecture.start;
        const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (match) {
          let hour = parseInt(match[1]);
          const minute = match[2];
          const period = match[3].toUpperCase();
          
          let displayHour = hour;
          if (period === "PM" && hour !== 12) displayHour = hour - 12;
          if (period === "AM" && hour === 12) displayHour = 12;
          if (displayHour === 0) displayHour = 12;
          
          setStartHour(displayHour);
          setStartMinute(minute);
          setStartPeriod(period);
        }
      }
      
      // Parse end time
      if (lecture.end) {
        const timeStr = lecture.end;
        const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (match) {
          let hour = parseInt(match[1]);
          const minute = match[2];
          const period = match[3].toUpperCase();
          
          let displayHour = hour;
          if (period === "PM" && hour !== 12) displayHour = hour - 12;
          if (period === "AM" && hour === 12) displayHour = 12;
          if (displayHour === 0) displayHour = 12;
          
          setEndHour(displayHour);
          setEndMinute(minute);
          setEndPeriod(period);
        }
      }
    }
  };

  const formatTimeForStorage = (hour, minute, period) => {
    let displayHour = hour;
    if (period === "PM" && hour !== 12) displayHour = hour + 12;
    if (period === "AM" && hour === 12) displayHour = 0;
    return `${displayHour}:${minute} ${period}`;
  };

  const formatTimeForDisplay = (hour, minute, period) => {
    return `${hour}:${minute} ${period}`;
  };

  const handleSave = async () => {
    if (!activityName.trim()) {
      Alert.alert("Error", "Please enter an activity name");
      return;
    }
    
    setSaving(true);
    
    try {
      const startTime = formatTimeForStorage(startHour, startMinute, startPeriod);
      const endTime = formatTimeForStorage(endHour, endMinute, endPeriod);
      
      // Create updated lecture object
      const updatedLecture = {
        ...lecture,
        name: activityName.trim(),
        type: activityType,
        start: startTime,
        end: endTime,
        lecturer: lecturer.trim(),
        location: location.trim(),
        room: location.trim(),
        notes: notes.trim(),
      };
      
      console.log("Saving updated lecture:", updatedLecture);
      console.log("Day key:", dayKey);
      console.log("Lecture index:", lectureIndex);
      
      // Get current user's document
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        let timetableData = userData.timetable || {};
        
        // Get the current day's lectures
        let dayLectures = [...(timetableData[dayKey] || [])];
        
        // Update the specific lecture at the given index
        if (lectureIndex !== undefined && dayLectures[lectureIndex]) {
          dayLectures[lectureIndex] = updatedLecture;
        } else {
          // Try to find by id if index doesn't work
          const foundIndex = dayLectures.findIndex(l => l.id === lecture.id);
          if (foundIndex !== -1) {
            dayLectures[foundIndex] = updatedLecture;
          } else {
            Alert.alert("Error", "Could not find the lecture to update");
            return;
          }
        }
        
        // Update the timetable
        timetableData[dayKey] = dayLectures;
        
        // Save back to Firestore
        await setDoc(userDocRef, { timetable: timetableData }, { merge: true });
        
        // Update notifications
        if (lecture.id) {
          await cancelLectureNotificationsById(lecture.id);
          await scheduleLectureNotifications(userData);
        }
        
        Alert.alert("Success", "Activity updated successfully");
        navigation.goBack();
      } else {
        Alert.alert("Error", "User document not found");
      }
    } catch (error) {
      console.error("Save error:", error);
      Alert.alert("Error", "Could not update activity: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <SvgIcon name="arrow-back" size={20} color={theme.colors.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>EDIT ACTIVITY</Text>
            <View style={styles.headerSpacer} />
          </View>
        </View>
        <View style={styles.content}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        </View>
        <NavigationBar />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <SvgIcon name="arrow-back" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>EDIT ACTIVITY</Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollViewContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <View style={styles.editCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Edit Activity</Text>
              <Text style={styles.dayText}>{capitalize(dayKey)}</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Activity Name *</Text>
                <TextInput
                  style={styles.input}
                  value={activityName}
                  onChangeText={setActivityName}
                  placeholder="e.g., Study Session, Lecture, Meeting"
                  placeholderTextColor="rgba(255,255,255,0.6)"
                />
              </View>

              {/* Activity Type Selector */}
              <ActivityTypeSelector
                selectedType={activityType}
                onSelectType={setActivityType}
                activityTypes={activityTypes}
                theme={theme}
                styles={styles}
              />

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>Start Time *</Text>
                  <TouchableOpacity
                    style={styles.timePickerButton}
                    onPress={() => setShowStartTimePicker(true)}
                  >
                    <SvgIcon name="clock" size={16} color="#FFFFFF" />
                    <Text style={styles.timePickerText}>
                      {formatTimeForDisplay(startHour, startMinute, startPeriod)}
                    </Text>
                    <SvgIcon name="chevron-down" size={14} color="rgba(255,255,255,0.7)" />
                  </TouchableOpacity>
                </View>

                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.inputLabel}>End Time</Text>
                  <TouchableOpacity
                    style={styles.timePickerButton}
                    onPress={() => setShowEndTimePicker(true)}
                  >
                    <SvgIcon name="clock" size={16} color="#FFFFFF" />
                    <Text style={styles.timePickerText}>
                      {formatTimeForDisplay(endHour, endMinute, endPeriod)}
                    </Text>
                    <SvgIcon name="chevron-down" size={14} color="rgba(255,255,255,0.7)" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Lecturer / Instructor</Text>
                <TextInput
                  style={styles.input}
                  value={lecturer}
                  onChangeText={setLecturer}
                  placeholder="Enter lecturer name"
                  placeholderTextColor="rgba(255,255,255,0.6)"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Room / Location</Text>
                <TextInput
                  style={styles.input}
                  value={location}
                  onChangeText={setLocation}
                  placeholder="Enter room number or location"
                  placeholderTextColor="rgba(255,255,255,0.6)"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Notes (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Additional notes..."
                  placeholderTextColor="rgba(255,255,255,0.6)"
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <SvgIcon name="save" size={20} color="#FFFFFF" />
                    <Text style={styles.saveButtonText}>SAVE CHANGES</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Start Time Picker Modal */}
      <Modal
        visible={showStartTimePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowStartTimePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>Select Start Time</Text>
              <TouchableOpacity onPress={() => setShowStartTimePicker(false)}>
                <SvgIcon name="close" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.timePickerContainer}>
              <View style={styles.pickerColumn}>
                <Text style={[styles.pickerLabel, { color: theme.colors.textPrimary }]}>Hour</Text>
                <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                  {hours.map((h) => (
                    <TouchableOpacity
                      key={h}
                      style={[styles.pickerItem, startHour === h && styles.pickerItemSelected]}
                      onPress={() => setStartHour(h)}
                    >
                      <Text style={[styles.pickerItemText, startHour === h && styles.pickerItemTextSelected]}>
                        {h}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              
              <View style={styles.pickerColumn}>
                <Text style={[styles.pickerLabel, { color: theme.colors.textPrimary }]}>Min</Text>
                <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                  {minutes.map((m) => (
                    <TouchableOpacity
                      key={m}
                      style={[styles.pickerItem, startMinute === m && styles.pickerItemSelected]}
                      onPress={() => setStartMinute(m)}
                    >
                      <Text style={[styles.pickerItemText, startMinute === m && styles.pickerItemTextSelected]}>
                        {m}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              
              <View style={styles.pickerColumn}>
                <Text style={[styles.pickerLabel, { color: theme.colors.textPrimary }]}>Period</Text>
                <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                  {periods.map((p) => (
                    <TouchableOpacity
                      key={p}
                      style={[styles.pickerItem, startPeriod === p && styles.pickerItemSelected]}
                      onPress={() => setStartPeriod(p)}
                    >
                      <Text style={[styles.pickerItemText, startPeriod === p && styles.pickerItemTextSelected]}>
                        {p}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
            
            <TouchableOpacity
              style={[styles.modalConfirm, { backgroundColor: theme.colors.primary }]}
              onPress={() => setShowStartTimePicker(false)}
            >
              <Text style={styles.modalConfirmText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* End Time Picker Modal */}
      <Modal
        visible={showEndTimePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEndTimePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>Select End Time</Text>
              <TouchableOpacity onPress={() => setShowEndTimePicker(false)}>
                <SvgIcon name="close" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.timePickerContainer}>
              <View style={styles.pickerColumn}>
                <Text style={[styles.pickerLabel, { color: theme.colors.textPrimary }]}>Hour</Text>
                <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                  {hours.map((h) => (
                    <TouchableOpacity
                      key={h}
                      style={[styles.pickerItem, endHour === h && styles.pickerItemSelected]}
                      onPress={() => setEndHour(h)}
                    >
                      <Text style={[styles.pickerItemText, endHour === h && styles.pickerItemTextSelected]}>
                        {h}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              
              <View style={styles.pickerColumn}>
                <Text style={[styles.pickerLabel, { color: theme.colors.textPrimary }]}>Min</Text>
                <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                  {minutes.map((m) => (
                    <TouchableOpacity
                      key={m}
                      style={[styles.pickerItem, endMinute === m && styles.pickerItemSelected]}
                      onPress={() => setEndMinute(m)}
                    >
                      <Text style={[styles.pickerItemText, endMinute === m && styles.pickerItemTextSelected]}>
                        {m}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              
              <View style={styles.pickerColumn}>
                <Text style={[styles.pickerLabel, { color: theme.colors.textPrimary }]}>Period</Text>
                <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                  {periods.map((p) => (
                    <TouchableOpacity
                      key={p}
                      style={[styles.pickerItem, endPeriod === p && styles.pickerItemSelected]}
                      onPress={() => setEndPeriod(p)}
                    >
                      <Text style={[styles.pickerItemText, endPeriod === p && styles.pickerItemTextSelected]}>
                        {p}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
            
            <TouchableOpacity
              style={[styles.modalConfirm, { backgroundColor: theme.colors.primary }]}
              onPress={() => setShowEndTimePicker(false)}
            >
              <Text style={styles.modalConfirmText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <NavigationBar />
    </KeyboardAvoidingView>
  );
}