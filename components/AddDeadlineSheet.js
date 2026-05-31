import React, { forwardRef, useImperativeHandle, useRef, useState } from "react";
import {
  View, Text, TouchableOpacity, ScrollView,
  Dimensions, Animated, StyleSheet, Platform,
  TextInput, KeyboardAvoidingView, Modal,
  ActivityIndicator, Alert,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation } from "@react-navigation/native";
import { getUserData, updateUserData } from "../services/userDataService";
import { useNotifications } from "../hooks/useNotifications";
import SvgIcon from "./SvgIcon";
import TimePicker from "../screens/timetable/components/TimePicker";

const { height: SCREEN_H } = Dimensions.get("window");
const SHEET_H = SCREEN_H * 0.80;

const PICKER_THEME = {
  colors: {
    primary: "#535FFD", textPrimary: "#111111",
    textSecondary: "#666666", card: "#FFFFFF",
    border: "#E0E0E0", primaryLight: "#ECEEFF",
  },
};
const PICKER_STYLES = StyleSheet.create({
  timePickerContainer: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  timePickerContent: { width: "90%", borderRadius: 24, padding: 20 },
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

const AddDeadlineSheet = forwardRef(({ onSaved }, ref) => {
  const navigation = useNavigation();
  const sheetAnim = useRef(new Animated.Value(SHEET_H)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const [sheetOpen, setSheetOpen] = useState(false);

  const [deadlineName, setDeadlineName] = useState("");
  const [deadlineDate, setDeadlineDate] = useState(new Date());
  const [hour, setHour] = useState(9);
  const [minute, setMinute] = useState("00");
  const [period, setPeriod] = useState("AM");
  const [room, setRoom] = useState("");
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const { scheduleExamNotifications } = useNotifications();

  const openSheet = () => {
    sheetAnim.setValue(SHEET_H);
    setSheetOpen(true);
    Animated.parallel([
      Animated.spring(sheetAnim, { toValue: 0, useNativeDriver: true, bounciness: 4 }),
      Animated.timing(backdropAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  };

  const closeSheet = () => {
    Animated.parallel([
      Animated.timing(sheetAnim, { toValue: SHEET_H, duration: 280, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => {
      setSheetOpen(false);
      setDeadlineName("");
      setDeadlineDate(new Date());
      setHour(9); setMinute("00"); setPeriod("AM");
      setRoom("");
    });
  };

  useImperativeHandle(ref, () => ({ open: openSheet, close: closeSheet }));

  const formatDate = (date) =>
    date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const formatTimeDisplay = (h, m, p) => `${h}:${m} ${p}`;

  const formatTimeForStorage = (h, m, p) => {
    let hr = h;
    if (p === "PM" && h !== 12) hr = h + 12;
    if (p === "AM" && h === 12) hr = 0;
    return `${hr}:${m} ${p}`;
  };

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (selectedDate) setDeadlineDate(selectedDate);
  };

  const saveDeadline = async () => {
    if (!deadlineName.trim()) {
      Alert.alert("Error", "Please enter a deadline name");
      return;
    }
    setSaving(true);
    try {
      const userData = await getUserData();
      const examsList = Array.isArray(userData?.exams) ? [...userData.exams] : [];
      examsList.push({
        name: deadlineName.trim(),
        date: deadlineDate.toISOString(),
        start: formatTimeForStorage(hour, minute, period),
        room: room.trim(),
        reminder: true,
        id: Date.now() + Math.random(),
        createdAt: new Date().toISOString(),
      });
      await updateUserData({ exams: examsList });
      try {
        const updated = await getUserData();
        if (updated) await scheduleExamNotifications(updated);
      } catch {}
      closeSheet();
      onSaved?.();
    } catch {
      Alert.alert("Error", "Could not save deadline");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <Animated.View
        pointerEvents={sheetOpen ? "auto" : "none"}
        style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(0,0,0,0.45)", opacity: backdropAnim, zIndex: 10 }]}
      >
        <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={closeSheet} activeOpacity={1} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        pointerEvents={sheetOpen ? "auto" : "none"}
        style={[ds.sheet, { transform: [{ translateY: sheetAnim }] }]}
      >
        <View style={ds.handle} />
        <View style={ds.headerRow}>
          <View style={{ width: 36 }} />
          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={closeSheet} style={ds.iconBtn}>
            <Text style={{ color: "#111111", fontSize: 16, fontWeight: "500", lineHeight: 20 }}>✕</Text>
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={ds.title}>Add Deadline</Text>

            <Text style={ds.label}>Deadline Name</Text>
            <TextInput
              style={ds.input}
              value={deadlineName}
              onChangeText={setDeadlineName}
              placeholder="eg Final Exam, Assignment"
              placeholderTextColor="#AAAAAA"
            />

            <Text style={ds.label}>Date</Text>
            <TouchableOpacity style={ds.chip} onPress={() => setShowDatePicker(true)}>
              <Text style={ds.chipText}>{formatDate(deadlineDate)}</Text>
            </TouchableOpacity>

            <Text style={ds.label}>Time</Text>
            <TouchableOpacity style={[ds.chip, { marginBottom: 20 }]} onPress={() => setShowTimePicker(true)}>
              <Text style={ds.chipText}>{formatTimeDisplay(hour, minute, period)}</Text>
            </TouchableOpacity>

            <Text style={ds.label}>Room / Location</Text>
            <TextInput
              style={[ds.input, { marginBottom: 24 }]}
              value={room}
              onChangeText={setRoom}
              placeholder="eg Room 304, Online"
              placeholderTextColor="#AAAAAA"
            />

            <TouchableOpacity style={ds.addBtn} onPress={saveDeadline} disabled={saving} activeOpacity={0.85}>
              {saving
                ? <ActivityIndicator color="#FFFFFF" />
                : <Text style={ds.addBtnText}>ADD DEADLINE</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity
              style={ds.scanBtn}
              activeOpacity={0.85}
              onPress={() => { closeSheet(); setTimeout(() => navigation.navigate("AITimetableScanner", { source: "camera", mode: "deadlines" }), 300); }}
            >
              <SvgIcon name="scan" size={18} color="#535FFD" />
              <Text style={ds.scanBtnText}>Scan with AI</Text>
            </TouchableOpacity>
            <View style={{ height: 32 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>

      {/* Date picker – Android inline */}
      {showDatePicker && Platform.OS === "android" && (
        <DateTimePicker
          value={deadlineDate} mode="date" display="default"
          onChange={handleDateChange} minimumDate={new Date()}
        />
      )}

      {/* Date picker – iOS modal */}
      {showDatePicker && Platform.OS === "ios" && (
        <Modal transparent animationType="slide" visible onRequestClose={() => setShowDatePicker(false)}>
          <View style={ds.dateModalOverlay}>
            <View style={ds.dateModalContent}>
              <View style={ds.dateModalHeader}>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={{ color: "#EF4444", fontSize: 16 }}>Cancel</Text>
                </TouchableOpacity>
                <Text style={{ fontSize: 16, fontWeight: "600", color: "#111111" }}>Select Date</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={{ color: "#535FFD", fontSize: 16, fontWeight: "600" }}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={deadlineDate} mode="date" display="spinner"
                onChange={handleDateChange} minimumDate={new Date()}
                style={{ alignSelf: "center" }}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Time picker modal */}
      <Modal visible={showTimePicker} transparent animationType="slide" onRequestClose={() => setShowTimePicker(false)}>
        <TimePicker
          hour={hour} minute={minute} period={period}
          onHourChange={setHour} onMinuteChange={setMinute} onPeriodChange={setPeriod}
          onClose={() => setShowTimePicker(false)}
          theme={PICKER_THEME} styles={PICKER_STYLES}
        />
      </Modal>
    </>
  );
});

export default AddDeadlineSheet;

const ds = StyleSheet.create({
  sheet: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    height: SHEET_H,
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
  chip: { backgroundColor: "#F2F2F2", borderRadius: 50, paddingHorizontal: 18, paddingVertical: 14, marginBottom: 20 },
  chipText: { fontSize: 15, color: "#888888" },
  addBtn: { backgroundColor: "#535FFD", borderRadius: 50, paddingVertical: 18, alignItems: "center" },
  addBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800", letterSpacing: 0.5 },
  scanBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 50, paddingVertical: 16, marginTop: 12, borderWidth: 1.5, borderColor: "#535FFD" },
  scanBtnText: { color: "#535FFD", fontSize: 15, fontWeight: "700" },
  dateModalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  dateModalContent: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  dateModalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
});
