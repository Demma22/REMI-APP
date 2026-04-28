// screens/exam/AddExamScreen.js
import React, { useState, useEffect } from "react";
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
  Keyboard,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Switch,
} from "react-native";
import { auth, db } from "../../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import NavigationBar from "../../components/NavigationBar";
import SvgIcon from "../../components/SvgIcon";
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../../hooks/useNotifications';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getStyles } from "./AddExamScreen.styles";

export default function AddExamScreen({ navigation }) {
  const [examName, setExamName] = useState("");
  const [examDate, setExamDate] = useState(new Date());
  const [examTime, setExamTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [room, setRoom] = useState("");
  const [reminder, setReminder] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preparingNotifications, setPreparingNotifications] = useState(false);
  const [currentSemester, setCurrentSemester] = useState(1);
  const [showMenuModal, setShowMenuModal] = useState(false);
  
  const { theme } = useTheme();
  const { scheduleExamNotifications } = useNotifications();
  const styles = getStyles(theme);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        setCurrentSemester(userDoc.data().current_semester || 1);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTimeForDisplay = (date) => {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const formatTimeForStorage = (date) => {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) setExamDate(selectedDate);
  };

  const handleTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) setExamTime(selectedTime);
  };

  const handleScanTimetable = () => {
    setShowMenuModal(false);
    navigation.navigate("AITimetableScanner", { mode: "exams" });
  };

  const handleManualAdd = () => {
    setShowMenuModal(false);
  };

  const saveExam = async () => {
    if (!examName.trim()) {
      Alert.alert("Error", "Please enter an exam name");
      return;
    }

    setSaving(true);
    try {
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      let examsList = [];
      if (userDoc.exists() && userDoc.data().exams) {
        examsList = userDoc.data().exams;
      }

      const examTimeStr = formatTimeForStorage(examTime);
      const examDateObj = examDate;

      const newExam = {
        name: examName.trim(),
        date: examDateObj,
        start: examTimeStr,
        room: room.trim(),
        semester: currentSemester,
        reminder: reminder,
        id: Date.now() + Math.random(),
        createdAt: new Date().toISOString(),
      };

      examsList.push(newExam);
      await setDoc(userDocRef, { exams: examsList }, { merge: true });

      if (reminder) {
        setPreparingNotifications(true);
        try {
          const updatedUserDoc = await getDoc(userDocRef);
          if (updatedUserDoc.exists()) {
            await scheduleExamNotifications(updatedUserDoc.data());
          }
        } catch (notifError) {
          console.error("Notification error:", notifError);
        } finally {
          setPreparingNotifications(false);
        }
      }

      Alert.alert(
        "Success", 
        `Exam added successfully!\n\nYou will receive reminders 2 days and 2 hours before the exam.`
      );
      
      navigation.goBack();
    } catch (error) {
      console.error("Save error:", error);
      Alert.alert("Error", "Could not save exam");
    } finally {
      setSaving(false);
    }
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.centerText}>Loading...</Text>
        </View>
        <NavigationBar />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {preparingNotifications && (
        <View style={styles.processingOverlay}>
          <View style={[styles.processingCard, { backgroundColor: theme.colors.card }]}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.processingTitle, { color: theme.colors.textPrimary }]}>
              Preparing Notifications
            </Text>
            <Text style={[styles.processingText, { color: theme.colors.textSecondary }]}>
              Scheduling your exam reminders...
            </Text>
          </View>
        </View>
      )}
      
      <KeyboardAvoidingView 
        style={styles.wrap}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <ScrollView style={styles.wrap} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <TouchableOpacity 
                style={styles.backBtn} 
                onPress={() => navigation.goBack()}
                activeOpacity={0.7}
                disabled={saving || preparingNotifications}
              >
                <SvgIcon name="arrow-back" size={20} color={theme.colors.primary} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>ADD EXAM</Text>
              <TouchableOpacity 
                style={styles.menuBtn}
                onPress={() => setShowMenuModal(true)}
                disabled={saving || preparingNotifications}
              >
                <SvgIcon name="more-vertical" size={20} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.content}>
              <View style={styles.semesterInfo}>
                <SvgIcon name="calendar" size={16} color={theme.colors.warning} />
                <Text style={styles.semesterText}>Semester {currentSemester}</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Exam/Test Name *</Text>
                <TextInput
                  style={styles.input}
                  value={examName}
                  onChangeText={setExamName}
                  placeholder="e.g., Final Exam, Midterm Test"
                  placeholderTextColor={theme.colors.textPlaceholder}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Exam Date *</Text>
                <TouchableOpacity
                  style={styles.datePickerButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <SvgIcon name="calendar" size={20} color={theme.colors.primary} />
                  <Text style={styles.datePickerText}>{formatDate(examDate)}</Text>
                  <SvgIcon name="chevron-down" size={16} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Exam Time *</Text>
                <TouchableOpacity
                  style={styles.timePickerButton}
                  onPress={() => setShowTimePicker(true)}
                >
                  <SvgIcon name="clock" size={20} color={theme.colors.primary} />
                  <Text style={styles.timePickerText}>{formatTimeForDisplay(examTime)}</Text>
                  <SvgIcon name="chevron-down" size={16} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Room / Location</Text>
                <TextInput
                  style={styles.input}
                  value={room}
                  onChangeText={setRoom}
                  placeholder="e.g., Room 304, Online"
                  placeholderTextColor={theme.colors.textPlaceholder}
                />
              </View>

              <View style={styles.switchRow}>
                <View style={styles.switchLabel}>
                  <SvgIcon name="bell" size={20} color={theme.colors.primary} />
                  <Text style={styles.label}>Send Reminders</Text>
                </View>
                <Switch
                  value={reminder}
                  onValueChange={setReminder}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>
              <Text style={styles.hintText}>
                {reminder 
                  ? "You will receive reminders 2 days and 2 hours before the exam" 
                  : "No reminders will be sent for this exam"}
              </Text>

              <TouchableOpacity 
                style={[styles.saveBtn, (saving || preparingNotifications) && styles.saveBtnProcessing]} 
                onPress={saveExam} 
                activeOpacity={0.8}
                disabled={saving || preparingNotifications}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <SvgIcon name="save" size={18} color="white" />
                )}
                <Text style={styles.saveBtnText}>
                  {saving ? "Saving..." : 
                   preparingNotifications ? "Processing..." : "ADD EXAM"}
                </Text>
              </TouchableOpacity>

              <View style={styles.bottomSpacing} />
            </View>

            {/* Date Picker */}
            {showDatePicker && (
              <DateTimePicker
                value={examDate}
                mode="date"
                display="default"
                onChange={handleDateChange}
                minimumDate={new Date()}
              />
            )}

            {/* Time Picker */}
            {showTimePicker && (
              <DateTimePicker
                value={examTime}
                mode="time"
                display="default"
                onChange={handleTimeChange}
              />
            )}

            {/* Menu Modal */}
            <Modal
              visible={showMenuModal}
              transparent={true}
              animationType="fade"
              onRequestClose={() => setShowMenuModal(false)}
            >
              <TouchableOpacity 
                style={styles.modalOverlay} 
                activeOpacity={1} 
                onPress={() => setShowMenuModal(false)}
              >
                <View style={[styles.menuModal, { backgroundColor: theme.colors.card }]}>
                  <TouchableOpacity style={styles.menuItem} onPress={handleScanTimetable}>
                    <SvgIcon name="scan" size={20} color={theme.colors.primary} />
                    <Text style={[styles.menuItemText, { color: theme.colors.textPrimary }]}>
                      Scan Exam Timetable
                    </Text>
                  </TouchableOpacity>
                  <View style={[styles.menuDivider, { backgroundColor: theme.colors.border }]} />
                  <TouchableOpacity style={styles.menuItem} onPress={handleManualAdd}>
                    <SvgIcon name="edit" size={20} color={theme.colors.primary} />
                    <Text style={[styles.menuItemText, { color: theme.colors.textPrimary }]}>
                      Add Manually
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </Modal>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      <NavigationBar />
    </View>
  );
}