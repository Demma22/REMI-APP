// screens/timetable/AddActivityScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import { getUserData, updateUserData } from "../../../services/userDataService";
import NavigationBar from "../../../components/NavigationBar";
import SvgIcon from "../../../components/SvgIcon";
import { useTheme } from '../../../contexts/ThemeContext';
import ScreenHeader from "../../../components/ScreenHeader";
import { useNotifications } from '../../../hooks/useNotifications';
import { getStyles } from "./AddActivityScreen.styles";
import { FormSkeleton } from "../../../components/SkeletonLoader";
import TimePicker from "../components/TimePicker";
import ActivityTypeSelector from "../components/ActivityTypeSelector";
import { trackFeatureUsage, shouldShowRateReview } from '../../../utils/rateReviewTracker';

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const activityTypes = [
  { id: "study", name: "Study", color: "#3B82F6" },
  { id: "lecture", name: "Lecture", color: "#8B5CF6" },
  { id: "break", name: "Break", color: "#10B981" },
  { id: "exercise", name: "Exercise", color: "#F59E0B" },
  { id: "meeting", name: "Meeting", color: "#EF4444" },
  { id: "custom", name: "Custom", color: "#6B7280" },
];

export default function AddActivityScreen({ navigation }) {
  const [activityName, setActivityName] = useState("");
  const [day, setDay] = useState("Monday");
  const [startHour, setStartHour] = useState(9);
  const [startMinute, setStartMinute] = useState("00");
  const [startPeriod, setStartPeriod] = useState("AM");
  const [endHour, setEndHour] = useState(10);
  const [endMinute, setEndMinute] = useState("00");
  const [endPeriod, setEndPeriod] = useState("AM");
  const [activityType, setActivityType] = useState("study");
  const [lecturer, setLecturer] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [reminder, setReminder] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preparingNotifications, setPreparingNotifications] = useState(false);
  const [currentSemester, setCurrentSemester] = useState(1);

  // Dropdown states
  const [showDayDropdown, setShowDayDropdown] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  
  const { theme } = useTheme();
  const { scheduleActivityNotifications } = useNotifications();
  const styles = getStyles(theme);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const data = await getUserData();
      if (data) {
        setCurrentSemester(data.currentSemester || 1);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeForDisplay = (hour, minute, period) => {
    return `${hour}:${minute} ${period}`;
  };

  const formatTimeForStorage = (hour, minute, period) => {
    let displayHour = hour;
    if (period === "PM" && hour !== 12) displayHour = hour + 12;
    if (period === "AM" && hour === 12) displayHour = 0;
    return `${displayHour}:${minute} ${period}`;
  };

  const handleSave = async () => {
    if (!activityName.trim()) {
      Alert.alert("Error", "Please enter an activity name");
      return;
    }

    setSaving(true);
    try {
      const existingData = await getUserData();
      let timetableData = existingData?.timetable || {};

      const dayKey = day.toLowerCase();
      if (!timetableData[dayKey]) {
        timetableData[dayKey] = [];
      }

      const startTime = formatTimeForStorage(startHour, startMinute, startPeriod);
      const endTime = formatTimeForStorage(endHour, endMinute, endPeriod);

      const newActivity = {
        name: activityName.trim(),
        start: startTime,
        end: endTime,
        type: activityType,
        lecturer: lecturer.trim(),
        location: location.trim(),
        notes: notes.trim(),
        reminder: reminder,
        semester: currentSemester,
        day: day,
        id: Date.now() + Math.random(),
        createdAt: new Date().toISOString(),
        isActivity: true,
      };

      timetableData[dayKey] = [...timetableData[dayKey], newActivity];
      await updateUserData({ timetable: timetableData });

      // Schedule notifications if reminder is enabled
      if (reminder) {
        setPreparingNotifications(true);
        try {
          const activityData = {
            name: activityName.trim(),
            day: day,
            startTime: startTime,
            reminderMinutes: 30
          };
          
          await scheduleActivityNotifications(activityData);
          console.log("✅ Activity notification scheduled successfully");
        } catch (notifError) {
          console.error("Notification scheduling error:", notifError);
        } finally {
          setPreparingNotifications(false);
        }
      }

      Alert.alert(
        "Success", 
        `Activity added successfully!\n\nYou will receive notifications 30 minutes before this activity.`
      );
      
      await trackFeatureUsage();
      const showRateReview = await shouldShowRateReview();
      if (showRateReview) {
        navigation.navigate('RateReviewModal');
        return;
      }
      
      navigation.goBack();
    } catch (error) {
      console.error("Save error:", error);
      Alert.alert("Error", "Could not save activity");
    } finally {
      setSaving(false);
    }
  };

  const renderDayItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.dropdownItem, day === item && styles.dropdownItemSelected]}
      onPress={() => {
        setDay(item);
        setShowDayDropdown(false);
      }}
    >
      <Text style={[styles.dropdownItemText, day === item && styles.dropdownItemTextSelected]}>
        {item}
      </Text>
      {day === item && <SvgIcon name="check" size={16} color={theme.colors.secondary} />}
    </TouchableOpacity>
  );

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="ADD ACTIVITY" onBackPress={() => navigation.goBack()} />
        <FormSkeleton />
        <NavigationBar />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Processing Overlay */}
      {preparingNotifications && (
        <View style={styles.processingOverlay}>
          <View style={[styles.processingCard, { backgroundColor: theme.colors.card }]}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.processingTitle, { color: theme.colors.textPrimary }]}>
              Preparing Notifications
            </Text>
            <Text style={[styles.processingText, { color: theme.colors.textSecondary }]}>
              Scheduling your reminders...
            </Text>
          </View>
        </View>
      )}
      
      <KeyboardAvoidingView 
        style={styles.wrap}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header - STATIC */}
        <ScreenHeader title="ADD ACTIVITY" onBackPress={() => navigation.goBack()} />

        {/* Scrollable Content */}
        <ScrollView 
          style={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* Activity Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Activity Name *</Text>
              <TextInput
                style={styles.input}
                value={activityName}
                onChangeText={setActivityName}
                placeholder="e.g., Study Session, Lecture, Meeting"
                placeholderTextColor={theme.colors.textTertiary}
                placeholderTextColor={theme.colors.textTertiary}
              />
            </View>

            {/* Day Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Day</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowDayDropdown(true)}
              >
                <SvgIcon name="calendar" size={16} color={theme.colors.primary} />
                <Text style={styles.dropdownButtonText}>{day}</Text>
                <SvgIcon name="chevron-down" size={14} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Time Selection Row */}
            <View style={styles.timeRow}>
              <View style={styles.timeField}>
                <Text style={styles.label}>Start Time *</Text>
                <TouchableOpacity
                  style={styles.timePickerButton}
                  onPress={() => setShowStartTimePicker(true)}
                >
                  <SvgIcon name="clock" size={16} color={theme.colors.primary} />
                  <Text style={styles.timePickerText}>
                    {formatTimeForDisplay(startHour, startMinute, startPeriod)}
                  </Text>
                  <SvgIcon name="chevron-down" size={14} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.timeField}>
                <Text style={styles.label}>End Time</Text>
                <TouchableOpacity
                  style={styles.timePickerButton}
                  onPress={() => setShowEndTimePicker(true)}
                >
                  <SvgIcon name="clock" size={16} color={theme.colors.primary} />
                  <Text style={styles.timePickerText}>
                    {formatTimeForDisplay(endHour, endMinute, endPeriod)}
                  </Text>
                  <SvgIcon name="chevron-down" size={14} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Activity Type */}
            <ActivityTypeSelector
              selectedType={activityType}
              onSelectType={setActivityType}
              activityTypes={activityTypes}
              theme={theme}
              styles={styles}
            />

            {/* Lecturer Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Lecturer / Instructor</Text>
              <TextInput
                style={styles.input}
                value={lecturer}
                onChangeText={setLecturer}
                placeholder="Enter lecturer name"
                placeholderTextColor={theme.colors.textTertiary}
              />
            </View>

            {/* Location */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Location</Text>
              <TextInput
                style={styles.input}
                value={location}
                onChangeText={setLocation}
                placeholder="e.g., Library, Room 304, Home"
                placeholderTextColor={theme.colors.textTertiary}
              />
            </View>

            {/* Notes */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Notes (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Any additional details..."
                placeholderTextColor={theme.colors.textTertiary}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Reminder Switch */}
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
                ? "You will receive notifications 30 minutes before this activity" 
                : "No reminders will be sent for this activity"}
            </Text>

            {/* Save Button */}
            <TouchableOpacity 
              style={[
                styles.saveBtn,
                (saving || preparingNotifications) && styles.saveBtnProcessing
              ]} 
              onPress={handleSave} 
              activeOpacity={0.8}
              disabled={saving || preparingNotifications}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.saveBtnText}>
                    {saving ? "Saving..." : 
                     preparingNotifications ? "Processing..." : "ADD ACTIVITY"}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.bottomSpacing} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

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

      {/* Start Time Picker Modal */}
      <Modal
        visible={showStartTimePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowStartTimePicker(false)}
      >
        <TimePicker
          hour={startHour}
          minute={startMinute}
          period={startPeriod}
          onHourChange={setStartHour}
          onMinuteChange={setStartMinute}
          onPeriodChange={setStartPeriod}
          onClose={() => setShowStartTimePicker(false)}
          theme={theme}
          styles={styles}
        />
      </Modal>

      {/* End Time Picker Modal */}
      <Modal
        visible={showEndTimePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEndTimePicker(false)}
      >
        <TimePicker
          hour={endHour}
          minute={endMinute}
          period={endPeriod}
          onHourChange={setEndHour}
          onMinuteChange={setEndMinute}
          onPeriodChange={setEndPeriod}
          onClose={() => setShowEndTimePicker(false)}
          theme={theme}
          styles={styles}
        />
      </Modal>

      <NavigationBar />
    </View>
  );
}