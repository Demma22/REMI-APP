import React, { forwardRef, useImperativeHandle, useRef, useState } from "react";
import {
  View, Text, TouchableOpacity, ScrollView,
  Dimensions, Animated, StyleSheet, Platform,
  TextInput, KeyboardAvoidingView, Modal, ActivityIndicator, Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { getUserData, updateUserData } from "../services/userDataService";
import { useNotifications } from "../hooks/useNotifications";
import SvgIcon from "./SvgIcon";
import TimePicker from "../screens/timetable/components/TimePicker";
import { AIScanButtons } from "./AIScanSheet";

const { height: SCREEN_H } = Dimensions.get("window");
const SHEET_H_SMALL = SCREEN_H * 0.50;
const SHEET_H_LARGE = SCREEN_H * 0.92;

const DAYS = [
  { label: "MON", value: "Monday" },
  { label: "TUE", value: "Tuesday" },
  { label: "WED", value: "Wednesday" },
  { label: "THUR", value: "Thursday" },
  { label: "FRI", value: "Friday" },
  { label: "SAT", value: "Saturday" },
  { label: "SUN", value: "Sunday" },
];

const CATEGORIES = [
  { id: "study", label: "Study" },
  { id: "lecture", label: "Lecture" },
  { id: "break", label: "Break" },
];

const PICKER_THEME = {
  colors: {
    primary: "#535FFD", textPrimary: "#111111",
    textSecondary: "#666666", card: "#FFFFFF",
    border: "#E0E0E0", primaryLight: "#ECEEFF",
  },
};

const PICKER_STYLES = StyleSheet.create({
  timePickerContainer: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  timePickerContent: { width: "90%", borderRadius: 15, padding: 20 },
  timePickerHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  timePickerTitle: { fontSize: 18, fontWeight: "700" },
  timePickerColumns: { flexDirection: "row", justifyContent: "space-between", height: 200 },
  timePickerColumn: { flex: 1, alignItems: "center" },
  timePickerColumnLabel: { fontSize: 14, marginBottom: 8 },
  pickerList: { alignItems: "center" },
  pickerItem: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, marginVertical: 2 },
  pickerItemSelected: { backgroundColor: "#ECEEFF" },
  pickerItemText: { fontSize: 20, color: "#111111" },
  pickerItemTextSelected: { color: "#535FFD", fontWeight: "700" },
  timePickerConfirmBtn: { paddingVertical: 14, borderRadius: 12, alignItems: "center", marginTop: 20 },
  timePickerConfirmText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
});

function formatTimeForStorage(hour, minute, period) {
  let h = hour;
  if (period === "PM" && hour !== 12) h = hour + 12;
  if (period === "AM" && hour === 12) h = 0;
  return `${h}:${minute} ${period}`;
}

// step: "options" | "aiScan" | "manual"
// open()        → starts at "options" (Choose Option flow)
// open(dayKey)  → starts at "manual" (direct form with day pre-selected)
const AddActivitySheet = forwardRef(({ onSaved }, ref) => {
  const navigation = useNavigation();
  const sheetAnim = useRef(new Animated.Value(SHEET_H_SMALL)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const stepRef = useRef("options");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [step, setStep] = useState("options");

  const [activityName, setActivityName] = useState("");
  const [selectedDay, setSelectedDay] = useState("Monday");
  const [startHour, setStartHour] = useState(9);
  const [startMinute, setStartMinute] = useState("00");
  const [startPeriod, setStartPeriod] = useState("AM");
  const [endHour, setEndHour] = useState(10);
  const [endMinute, setEndMinute] = useState("00");
  const [endPeriod, setEndPeriod] = useState("AM");
  const [category, setCategory] = useState("study");
  const [location, setLocation] = useState("");
  const [instructor, setInstructor] = useState("");
  const [preselectedDay, setPreselectedDay] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const { scheduleActivityNotifications } = useNotifications();

  const setStepTracked = (s) => { stepRef.current = s; setStep(s); };

  const resetForm = () => {
    setActivityName("");
    setSelectedDay("Monday");
    setStartHour(9); setStartMinute("00"); setStartPeriod("AM");
    setEndHour(10); setEndMinute("00"); setEndPeriod("AM");
    setCategory("study");
    setLocation("");
    setInstructor("");
  };

  const openSheet = (dayKey) => {
    if (dayKey) {
      const match = DAYS.find(d => d.value.toLowerCase() === dayKey.toLowerCase());
      if (match) setSelectedDay(match.value);
      setPreselectedDay(true);
      setStepTracked("manual");
      sheetAnim.setValue(SHEET_H_LARGE);
    } else {
      setPreselectedDay(false);
      setStepTracked("options");
      sheetAnim.setValue(SHEET_H_SMALL);
    }
    setSheetOpen(true);
    Animated.parallel([
      Animated.spring(sheetAnim, { toValue: 0, useNativeDriver: true, bounciness: 4 }),
      Animated.timing(backdropAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  };

  const closeSheet = () => {
    const dist = stepRef.current === "manual" ? SHEET_H_LARGE : SHEET_H_SMALL;
    Animated.parallel([
      Animated.timing(sheetAnim, { toValue: dist, duration: 280, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => { setSheetOpen(false); setStepTracked("options"); setPreselectedDay(false); resetForm(); });
  };

  useImperativeHandle(ref, () => ({ open: openSheet, close: closeSheet }));

  const handleSave = async () => {
    if (!activityName.trim()) {
      Alert.alert("Error", "Please enter an activity name");
      return;
    }
    setSaving(true);
    try {
      const existing = await getUserData();
      const timetable = existing?.timetable || {};
      const dayKey = selectedDay.toLowerCase();
      if (!timetable[dayKey]) timetable[dayKey] = [];
      const startTime = formatTimeForStorage(startHour, startMinute, startPeriod);
      const endTime = formatTimeForStorage(endHour, endMinute, endPeriod);
      timetable[dayKey] = [
        ...timetable[dayKey],
        {
          name: activityName.trim(),
          start: startTime,
          end: endTime,
          type: category,
          lecturer: instructor.trim(),
          location: location.trim(),
          reminder: true,
          day: selectedDay,
          id: Date.now() + Math.random(),
          createdAt: new Date().toISOString(),
          isActivity: true,
        },
      ];
      await updateUserData({ timetable });
      try {
        await scheduleActivityNotifications({ name: activityName.trim(), day: selectedDay, startTime, reminderMinutes: 30 });
      } catch {}
      closeSheet();
      onSaved?.();
    } catch {
      Alert.alert("Error", "Could not save activity");
    } finally {
      setSaving(false);
    }
  };

  const goToManual = () => {
    setStepTracked("manual");
  };

  const goToAiScan = () => {
    setStepTracked("aiScan");
  };

  const goBack = () => {
    setStepTracked("options");
  };

  return (
    <>
      <Animated.View
        pointerEvents={sheetOpen ? "auto" : "none"}
        style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(0,0,0,0.45)", opacity: backdropAnim, zIndex: 10 }]}
      >
        <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={closeSheet} activeOpacity={1} />
      </Animated.View>

      <Animated.View
        pointerEvents={sheetOpen ? "auto" : "none"}
        style={[
          as.sheet,
          step === "manual" && { height: SHEET_H_LARGE },
          { transform: [{ translateY: sheetAnim }] },
        ]}
      >
        <View style={as.handle} />

        {/* Header row with back/close */}
        <View style={as.headerRow}>
          {(step === "aiScan" || step === "manual") ? (
            <TouchableOpacity onPress={goBack} style={as.iconBtn}>
              <SvgIcon name="arrow-back" size={18} color="#111111" />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 36 }} />
          )}
          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={closeSheet} style={as.iconBtn}>
            <Text style={{ color: "#111111", fontSize: 16, fontWeight: "500", lineHeight: 20 }}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* ── Step: options ── */}
        {step === "options" && (
          <>
            <Text style={as.title}>Choose Option</Text>
            <View style={as.optionRow}>
              <TouchableOpacity style={as.optionBtn} activeOpacity={0.85} onPress={goToManual}>
                <SvgIcon name="plus" size={44} color="#FFFFFF" />
                <Text style={as.optionBtnText}>Manually</Text>
              </TouchableOpacity>
              <TouchableOpacity style={as.optionBtn} activeOpacity={0.85} onPress={goToAiScan}>
                <SvgIcon name="scan" size={44} color="#FFFFFF" />
                <Text style={as.optionBtnText}>AI Scan</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* ── Step: aiScan ── */}
        {step === "aiScan" && (
          <>
            <Text style={as.title}>AI Scan</Text>
            <AIScanButtons
              onCamera={() => { closeSheet(); setTimeout(() => navigation.navigate("AITimetableScanner", { source: "camera" }), 300); }}
              onGallery={() => { closeSheet(); setTimeout(() => navigation.navigate("AITimetableScanner", { source: "gallery" }), 300); }}
            />
          </>
        )}

        {/* ── Step: manual form ── */}
        {step === "manual" && (
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={as.title}>Add Activity</Text>

              <Text style={as.label}>Activity Name</Text>
              <TextInput
                style={as.input}
                value={activityName}
                onChangeText={setActivityName}
                placeholder="eg Study Session, Lecture"
                placeholderTextColor="#AAAAAA"
              />

              {!preselectedDay && (
                <>
                  <Text style={as.label}>Select Day</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                    {DAYS.map(d => (
                      <TouchableOpacity
                        key={d.value}
                        style={[as.dayChip, selectedDay === d.value && as.dayChipActive]}
                        onPress={() => setSelectedDay(d.value)}
                      >
                        <Text style={[as.dayChipText, selectedDay === d.value && as.dayChipTextActive]}>{d.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              )}

              <View style={{ flexDirection: "row", gap: 16, marginBottom: 20 }}>
                <View style={{ flex: 1 }}>
                  <Text style={as.label}>Start Time</Text>
                  <TouchableOpacity style={as.chip} onPress={() => setShowStartPicker(true)}>
                    <Text style={as.chipText}>{startHour}:{startMinute} {startPeriod}</Text>
                  </TouchableOpacity>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={as.label}>End Time</Text>
                  <TouchableOpacity style={as.chip} onPress={() => setShowEndPicker(true)}>
                    <Text style={as.chipText}>{endHour}:{endMinute} {endPeriod}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={as.label}>Category</Text>
              <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
                {CATEGORIES.map(c => (
                  <TouchableOpacity
                    key={c.id}
                    style={[as.categoryChip, category === c.id && as.categoryChipActive]}
                    onPress={() => setCategory(c.id)}
                  >
                    <Text style={[as.categoryChipText, category === c.id && as.categoryChipTextActive]}>{c.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={as.label}>Location</Text>
              <TextInput
                style={as.input}
                value={location}
                onChangeText={setLocation}
                placeholder="eg Library, Room 304"
                placeholderTextColor="#AAAAAA"
              />

              <Text style={as.label}>Instructor</Text>
              <TextInput
                style={[as.input, { marginBottom: 24 }]}
                value={instructor}
                onChangeText={setInstructor}
                placeholder="enter name"
                placeholderTextColor="#AAAAAA"
              />

              <TouchableOpacity style={as.addBtn} onPress={handleSave} disabled={saving} activeOpacity={0.85}>
                {saving
                  ? <ActivityIndicator color="#FFFFFF" />
                  : <Text style={as.addBtnText}>ADD ACTIVITY</Text>
                }
              </TouchableOpacity>

              <TouchableOpacity
                style={as.scanBtn}
                activeOpacity={0.85}
                onPress={goToAiScan}
              >
                <SvgIcon name="scan" size={18} color="#535FFD" />
                <Text style={as.scanBtnText}>Scan with AI</Text>
              </TouchableOpacity>
              <View style={{ height: 32 }} />
            </ScrollView>
          </KeyboardAvoidingView>
        )}
      </Animated.View>

      <Modal visible={showStartPicker} transparent animationType="slide" onRequestClose={() => setShowStartPicker(false)}>
        <TimePicker
          hour={startHour} minute={startMinute} period={startPeriod}
          onHourChange={setStartHour} onMinuteChange={setStartMinute} onPeriodChange={setStartPeriod}
          onClose={() => setShowStartPicker(false)}
          theme={PICKER_THEME} styles={PICKER_STYLES}
        />
      </Modal>
      <Modal visible={showEndPicker} transparent animationType="slide" onRequestClose={() => setShowEndPicker(false)}>
        <TimePicker
          hour={endHour} minute={endMinute} period={endPeriod}
          onHourChange={setEndHour} onMinuteChange={setEndMinute} onPeriodChange={setEndPeriod}
          onClose={() => setShowEndPicker(false)}
          theme={PICKER_THEME} styles={PICKER_STYLES}
        />
      </Modal>
    </>
  );
});

export default AddActivitySheet;

const as = StyleSheet.create({
  sheet: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    height: SHEET_H_SMALL,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 28, paddingTop: 12, paddingBottom: 40,
    zIndex: 20,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.15, shadowRadius: 20 },
      android: { elevation: 20 },
    }),
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#E0E0E0", alignSelf: "center", marginBottom: 14 },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 18 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#F0F0F0", justifyContent: "center", alignItems: "center" },
  title: { color: "#111111", fontSize: 28, fontWeight: "800", letterSpacing: -0.5, marginBottom: 20 },
  label: { fontSize: 14, fontWeight: "700", color: "#111111", marginBottom: 8 },
  input: { backgroundColor: "#F2F2F2", borderRadius: 50, paddingHorizontal: 18, paddingVertical: 14, fontSize: 15, color: "#111111", marginBottom: 20 },
  chip: { backgroundColor: "#F2F2F2", borderRadius: 50, paddingHorizontal: 18, paddingVertical: 14 },
  chipText: { fontSize: 15, color: "#888888" },
  // Options step
  optionRow: { flexDirection: "row", gap: 16 },
  optionBtn: { flex: 1, backgroundColor: "#535FFD", borderRadius: 15, paddingVertical: 28, alignItems: "center", justifyContent: "center", gap: 10 },
  optionBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  // Manual form
  dayChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 50, backgroundColor: "#F0F0F0", marginRight: 8 },
  dayChipActive: { backgroundColor: "#535FFD" },
  dayChipText: { fontSize: 12, fontWeight: "600", color: "#666666" },
  dayChipTextActive: { color: "#FFFFFF" },
  categoryChip: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 50, backgroundColor: "#F0F0F0" },
  categoryChipActive: { backgroundColor: "#535FFD" },
  categoryChipText: { fontSize: 14, fontWeight: "600", color: "#666666" },
  categoryChipTextActive: { color: "#FFFFFF" },
  addBtn: { backgroundColor: "#535FFD", borderRadius: 50, paddingVertical: 18, alignItems: "center" },
  addBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800", letterSpacing: 0.5 },
  scanBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 50, paddingVertical: 16, marginTop: 12, borderWidth: 1.5, borderColor: "#535FFD" },
  scanBtnText: { color: "#535FFD", fontSize: 15, fontWeight: "700" },
});
