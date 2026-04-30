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
import TimePicker from "../timetable/components/TimePicker";

export default function AddExamScreen({ navigation }) {
  const [examName, setExamName] = useState("");
  const [examDate, setExamDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  // Time picker state
  const [hour, setHour] = useState(9);
  const [minute, setMinute] = useState("00");
  const [period, setPeriod] = useState("AM");
  
  const [room, setRoom] = useState("");
  const [reminder, setReminder] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preparingNotifications, setPreparingNotifications] = useState(false);
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
        // No need to set semester anymore
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

  const formatTimeForDisplay = (hourVal, minuteVal, periodVal) => {
    return `${hourVal}:${minuteVal} ${periodVal}`;
  };

  const formatTimeForStorage = (hourVal, minuteVal, periodVal) => {
    let displayHour = hourVal;
    if (periodVal === "PM" && hourVal !== 12) displayHour = hourVal + 12;
    if (periodVal === "AM" && hourVal === 12) displayHour = 0;
    return `${displayHour}:${minuteVal} ${periodVal}`;
  };

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setExamDate(selectedDate);
    }
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

      const examTimeStr = formatTimeForStorage(hour, minute, period);
      const examDateObj = examDate;

      const newExam = {
        name: examName.trim(),
        date: examDateObj,
        start: examTimeStr,
        room: room.trim(),
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
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {/* Header - STATIC (outside ScrollView) */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backBtn} 
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            disabled={saving || preparingNotifications}
          >
            <SvgIcon name="arrow-back" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>ADD TEST</Text>
          <TouchableOpacity 
            style={styles.menuBtn}
            onPress={() => setShowMenuModal(true)}
            disabled={saving || preparingNotifications}
          >
            <SvgIcon name="scan" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Scrollable Content */}
        <ScrollView 
          style={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Test/Exam Name *</Text>
              <TextInput
                style={styles.input}
                value={examName}
                onChangeText={setExamName}
                placeholder="e.g., Final Exam, Midterm Test"
                placeholderTextColor={theme.colors.textTertiary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Test Date *</Text>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowDatePicker(true)}
              >
                <SvgIcon name="calendar" size={20} color={theme.colors.primary} />
                <Text style={styles.datePickerText}>{formatDate(examDate)}</Text>
                <SvgIcon name="chevron-down" size={16} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Date Picker - Android */}
            {showDatePicker && Platform.OS === 'android' && (
              <DateTimePicker
                value={examDate}
                mode="date"
                display="default"
                onChange={handleDateChange}
                minimumDate={new Date()}
              />
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Test Time *</Text>
              <TouchableOpacity
                style={styles.timePickerButton}
                onPress={() => setShowTimePicker(true)}
              >
                <SvgIcon name="clock" size={20} color={theme.colors.primary} />
                <Text style={styles.timePickerText}>
                  {formatTimeForDisplay(hour, minute, period)}
                </Text>
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
                placeholderTextColor={theme.colors.textTertiary}
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
                <>
                  <Text style={styles.saveBtnText}>
                    {saving ? "Saving..." : preparingNotifications ? "Processing..." : "ADD EXAM"}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.bottomSpacing} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Date Picker - iOS Modal */}
      {showDatePicker && Platform.OS === 'ios' && (
        <Modal
          transparent={true}
          animationType="slide"
          visible={showDatePicker}
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.pickerModalContent, { backgroundColor: theme.colors.card }]}>
              <View style={styles.pickerModalHeader}>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={[styles.pickerModalCancel, { color: theme.colors.danger }]}>Cancel</Text>
                </TouchableOpacity>
                <Text style={[styles.pickerModalTitle, { color: theme.colors.textPrimary }]}>Select Date</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={[styles.pickerModalDone, { color: theme.colors.primary }]}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={examDate}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                minimumDate={new Date()}
                style={styles.datePickerIOS}
                textColor={theme.colors.textPrimary}
                themeVariant={theme.mode === 'dark' ? 'dark' : 'light'}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Time Picker Modal */}
      <Modal
        visible={showTimePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTimePicker(false)}
      >
        <TimePicker
          hour={hour}
          minute={minute}
          period={period}
          onHourChange={setHour}
          onMinuteChange={setMinute}
          onPeriodChange={setPeriod}
          onClose={() => setShowTimePicker(false)}
          theme={theme}
          styles={styles}
        />
      </Modal>

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

      <NavigationBar />
    </View>
  );
}