import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Platform, Modal,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Svg, Circle } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getUserData } from "../../services/userDataService";
import NavigationBar from "../../components/NavigationBar";
import SvgIcon from "../../components/SvgIcon";
import { useTheme } from "../../contexts/ThemeContext";

const PURPLE = "#535FFD";
const SESSIONS_KEY = "@remi_focus_sessions";
const STREAK_KEY = "@remi_focus_streak";

const DURATIONS = [
  { label: "25 min", value: 25 },
  { label: "45 min", value: 45 },
  { label: "60 min", value: 60 },
];

const RING = 230;
const STROKE = 14;
const RADIUS = RING / 2 - STROKE / 2;
const CIRC = 2 * Math.PI * RADIUS;

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

function formatCountdown(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function FocusScreen({ navigation, route }) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const [phase, setPhase] = useState("idle"); // idle | active | done
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [duration, setDuration] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [streak, setStreak] = useState(0);
  const [todaySessions, setTodaySessions] = useState([]);
  const [topics, setTopics] = useState([]);

  const timerRef = useRef(null);
  const totalRef = useRef(25 * 60);

  const progress = 1 - timeLeft / totalRef.current;
  const strokeOffset = CIRC * (1 - progress);

  useEffect(() => {
    loadStreak();
    loadTodaySessions();
    loadTopics();
    const unsub = navigation.addListener("focus", () => {
      loadStreak();
      loadTodaySessions();
      loadTopics();
    });
    return unsub;
  }, [navigation]);

  useEffect(() => {
    if (route.params?.quickStart) {
      setPhase("quickstart");
      navigation.setParams({ quickStart: undefined });
    }
  }, [route.params?.quickStart]);

  const loadStreak = async () => {
    try {
      const raw = await AsyncStorage.getItem(STREAK_KEY);
      if (raw) setStreak(JSON.parse(raw).count || 0);
    } catch {}
  };

  const loadTodaySessions = async () => {
    try {
      const raw = await AsyncStorage.getItem(SESSIONS_KEY);
      if (raw) {
        const all = JSON.parse(raw);
        setTodaySessions(all.filter(s => s.date === todayStr()));
      }
    } catch {}
  };

  const loadTopics = async () => {
    try {
      const ud = await getUserData();
      const list = [];
      const day = new Date().toLocaleString("en-US", { weekday: "long" }).toLowerCase();
      const timetable = ud?.timetable || {};
      (timetable[day] || []).forEach(lec =>
        list.push({ id: `lec_${lec.name}`, label: lec.name, type: "class" })
      );
      const exams = Array.isArray(ud?.exams) ? ud.exams : [];
      const now = new Date();
      exams
        .filter(e => { try { return new Date(e.date) >= now; } catch { return false; } })
        .slice(0, 3)
        .forEach(e => list.push({ id: `exam_${e.name}`, label: e.name, type: "deadline" }));
      list.push({ id: "free", label: "Free Focus", type: "free" });
      setTopics(list);
      if (!selectedTopic) setSelectedTopic(list[0]);
    } catch {
      const fallback = [{ id: "free", label: "Free Focus", type: "free" }];
      setTopics(fallback);
      if (!selectedTopic) setSelectedTopic(fallback[0]);
    }
  };

  const startSession = () => {
    const total = duration * 60;
    totalRef.current = total;
    setTimeLeft(total);
    setPhase("active");
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          finishSession(duration);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const endSession = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    const elapsed = Math.max(Math.ceil((totalRef.current - timeLeft) / 60), 1);
    finishSession(elapsed);
  };

  const finishSession = async (minutesDone) => {
    setSessionDuration(minutesDone);
    setPhase("done");
    const today = todayStr();
    const session = {
      topic: selectedTopic?.label || "Free Focus",
      duration: minutesDone,
      date: today,
      completedAt: new Date().toISOString(),
    };
    try {
      const raw = await AsyncStorage.getItem(SESSIONS_KEY);
      const all = raw ? JSON.parse(raw) : [];
      all.push(session);
      await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(all));
      setTodaySessions(all.filter(s => s.date === today));
    } catch {}
    try {
      const raw = await AsyncStorage.getItem(STREAK_KEY);
      const data = raw ? JSON.parse(raw) : { count: 0, lastDate: null };
      let newCount = data.count;
      if (data.lastDate === today) {
        // already counted today — keep
      } else if (data.lastDate === yesterdayStr()) {
        newCount += 1;
      } else {
        newCount = 1;
      }
      await AsyncStorage.setItem(STREAK_KEY, JSON.stringify({ count: newCount, lastDate: today }));
      setStreak(newCount);
    } catch {}
  };

  const handleDone = () => {
    setPhase("idle");
    setTimeLeft(duration * 60);
  };

  const handleDurationChange = (val) => {
    setDuration(val);
    if (phase === "idle" || phase === "quickstart") setTimeLeft(val * 60);
  };

  const todayMinutes = todaySessions.reduce((s, x) => s + (x.duration || 0), 0);

  // ── QUICKSTART ────────────────────────────────────────────────────
  if (phase === "quickstart") {
    return (
      <View style={[fs.root, { backgroundColor: theme.colors.background }]}>
        <View style={[fs.qsWrap, { paddingTop: insets.top + 24 }]}>
          <TouchableOpacity
            style={[fs.qsBack, { top: insets.top + 12 }]}
            onPress={() => setPhase("idle")}
            activeOpacity={0.7}
          >
            <SvgIcon name="arrow-back" size={20} color={theme.colors.textPrimary} />
          </TouchableOpacity>

          <View style={fs.qsIconRing}>
            <SvgIcon name="focus" size={32} color="#FFFFFF" />
          </View>

          <Text style={[fs.qsTitle, { color: theme.colors.textPrimary }]}>
            Activating Focus Mode
          </Text>
          <Text style={[fs.qsSub, { color: theme.colors.textSecondary }]}>
            How long do you want to focus?
          </Text>

          <View style={fs.qsDurationRow}>
            {DURATIONS.map(d => (
              <TouchableOpacity
                key={d.value}
                style={[
                  fs.durationChip,
                  { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
                  duration === d.value && fs.durationChipActive,
                ]}
                onPress={() => handleDurationChange(d.value)}
                activeOpacity={0.75}
              >
                <Text style={[
                  fs.durationChipText,
                  { color: theme.colors.textSecondary },
                  duration === d.value && fs.durationChipTextActive,
                ]}>
                  {d.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={fs.startBtn} onPress={startSession} activeOpacity={0.85}>
            <SvgIcon name="focus" size={20} color="#FFFFFF" />
            <Text style={fs.startBtnText}>Start Session</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── ACTIVE ────────────────────────────────────────────────────────
  if (phase === "active") {
    return (
      <View style={[fs.root, { backgroundColor: theme.colors.background }]}>
        <View style={[fs.activeWrap, { paddingTop: insets.top + 24 }]}>

          <View style={fs.activeTopicRow}>
            <View style={[fs.activeDot, { backgroundColor: PURPLE }]} />
            <Text style={[fs.activeTopicLabel, { color: theme.colors.textSecondary }]} numberOfLines={1}>
              {selectedTopic?.label || "Free Focus"}
            </Text>
          </View>

          <View style={fs.ringWrap}>
            <Svg width={RING} height={RING} style={StyleSheet.absoluteFill}>
              <Circle
                cx={RING / 2} cy={RING / 2} r={RADIUS}
                stroke={theme.colors.border} strokeWidth={STROKE} fill="none"
              />
              <Circle
                cx={RING / 2} cy={RING / 2} r={RADIUS}
                stroke={PURPLE} strokeWidth={STROKE} fill="none"
                strokeDasharray={CIRC}
                strokeDashoffset={strokeOffset}
                strokeLinecap="round"
                rotation="-90"
                origin={`${RING / 2},${RING / 2}`}
              />
            </Svg>
            <Text style={[fs.timerText, { color: theme.colors.textPrimary }]}>
              {formatCountdown(timeLeft)}
            </Text>
          </View>

          <Text style={[fs.activeSub, { color: theme.colors.textTertiary }]}>Stay focused</Text>

          <TouchableOpacity style={fs.endBtn} onPress={endSession} activeOpacity={0.85}>
            <Text style={fs.endBtnText}>End Session</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── IDLE ──────────────────────────────────────────────────────────
  return (
    <View style={[fs.root, { backgroundColor: theme.colors.background }]}>

      {/* Header */}
      <View style={[fs.header, { paddingTop: insets.top + 12, backgroundColor: theme.colors.background }]}>
        <Text style={[fs.headerTitle, { color: theme.colors.textPrimary }]}>Focus</Text>
        <SvgIcon name="focus" size={22} color={PURPLE} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120, paddingTop: 8 }}
      >
        {/* Stats row */}
        <View style={[fs.statsRow, { paddingHorizontal: 20, marginTop: 8 }]}>
          <View style={[fs.statCard, { backgroundColor: PURPLE }]}>
            <Text style={[fs.statValue, { color: "#FFFFFF" }]}>{streak}</Text>
            <Text style={[fs.statLabel, { color: "rgba(255,255,255,0.7)" }]}>Day Streak</Text>
          </View>
          <View style={[fs.statCard, { backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border }]}>
            <Text style={[fs.statValue, { color: theme.colors.textPrimary }]}>
              {todayMinutes >= 60
                ? `${Math.floor(todayMinutes / 60)}h ${todayMinutes % 60 > 0 ? `${todayMinutes % 60}m` : ""}`
                : `${todayMinutes}m`}
            </Text>
            <Text style={[fs.statLabel, { color: theme.colors.textSecondary }]}>Today</Text>
          </View>
          <View style={[fs.statCard, { backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border }]}>
            <Text style={[fs.statValue, { color: theme.colors.textPrimary }]}>{todaySessions.length}</Text>
            <Text style={[fs.statLabel, { color: theme.colors.textSecondary }]}>Sessions</Text>
          </View>
        </View>

        {/* Focus topic */}
        <View style={{ paddingHorizontal: 20, marginTop: 28 }}>
          <Text style={[fs.sectionLabel, { color: theme.colors.textPrimary }]}>What are you focusing on?</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
            {topics.map(t => (
              <TouchableOpacity
                key={t.id}
                style={[fs.topicChip, selectedTopic?.id === t.id && fs.topicChipActive]}
                onPress={() => setSelectedTopic(t)}
                activeOpacity={0.75}
              >
                <Text
                  style={[fs.topicChipText, selectedTopic?.id === t.id && fs.topicChipTextActive]}
                  numberOfLines={1}
                >
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Duration */}
        <View style={{ paddingHorizontal: 20, marginTop: 28 }}>
          <Text style={[fs.sectionLabel, { color: theme.colors.textPrimary }]}>Duration</Text>
          <View style={{ flexDirection: "row", gap: 12, marginTop: 12 }}>
            {DURATIONS.map(d => (
              <TouchableOpacity
                key={d.value}
                style={[fs.durationChip, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }, duration === d.value && fs.durationChipActive]}
                onPress={() => handleDurationChange(d.value)}
                activeOpacity={0.75}
              >
                <Text style={[fs.durationChipText, { color: theme.colors.textSecondary }, duration === d.value && fs.durationChipTextActive]}>
                  {d.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Start button */}
        <View style={{ paddingHorizontal: 20, marginTop: 32 }}>
          <TouchableOpacity style={fs.startBtn} onPress={startSession} activeOpacity={0.85}>
            <SvgIcon name="focus" size={20} color="#FFFFFF" />
            <Text style={fs.startBtnText}>Start Session</Text>
          </TouchableOpacity>
        </View>

        {/* Today's sessions */}
        {todaySessions.length > 0 && (
          <View style={{ paddingHorizontal: 20, marginTop: 32 }}>
            <Text style={[fs.sectionLabel, { color: theme.colors.textPrimary }]}>Today's Sessions</Text>
            <View style={{ marginTop: 12, gap: 10 }}>
              {todaySessions.map((s, i) => (
                <View key={i} style={[fs.sessionRow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                  <View style={[fs.sessionDot, { backgroundColor: PURPLE }]} />
                  <Text style={[fs.sessionTopic, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                    {s.topic}
                  </Text>
                  <Text style={[fs.sessionMins, { color: theme.colors.textSecondary }]}>
                    {s.duration} min
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <NavigationBar />

      {/* Done modal */}
      <Modal visible={phase === "done"} transparent animationType="fade" onRequestClose={handleDone}>
        <View style={fs.doneOverlay}>
          <View style={[fs.doneCard, { backgroundColor: theme.colors.card }]}>
            <View style={fs.doneIconRing}>
              <SvgIcon name="check-circle" size={44} color={PURPLE} />
            </View>
            <Text style={[fs.doneTitle, { color: theme.colors.textPrimary }]}>Session Complete</Text>
            <Text style={[fs.doneSub, { color: theme.colors.textSecondary }]}>
              You focused for{" "}
              <Text style={{ color: PURPLE, fontWeight: "800" }}>{sessionDuration} min</Text>
            </Text>
            <View style={[fs.doneStreakRow, { backgroundColor: `${PURPLE}18` }]}>
              <Text style={fs.doneStreakEmoji}>🔥</Text>
              <Text style={[fs.doneStreakLabel, { color: PURPLE }]}>{streak} day streak</Text>
            </View>
            <TouchableOpacity style={fs.doneDoneBtn} onPress={handleDone} activeOpacity={0.85}>
              <Text style={fs.doneDoneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const fs = StyleSheet.create({
  root: { flex: 1 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  headerTitle: { fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },

  // Stats row
  statsRow: { flexDirection: "row", gap: 12 },
  statCard: {
    flex: 1, borderRadius: 20, paddingVertical: 16,
    alignItems: "center", justifyContent: "center",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 0 },
    }),
  },
  statValue: { fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
  statLabel: { fontSize: 11, fontWeight: "600", marginTop: 3 },

  // Section label
  sectionLabel: { fontSize: 16, fontWeight: "800" },

  // Topic chips
  topicChip: {
    paddingHorizontal: 18, paddingVertical: 10,
    borderRadius: 50, backgroundColor: "#F0F0F0", marginRight: 10,
    maxWidth: 180,
  },
  topicChipActive: { backgroundColor: PURPLE },
  topicChipText: { fontSize: 13, fontWeight: "600", color: "#666666" },
  topicChipTextActive: { color: "#FFFFFF" },

  // Duration chips
  durationChip: {
    flex: 1, paddingVertical: 14, borderRadius: 50,
    alignItems: "center", borderWidth: 1,
  },
  durationChipActive: { backgroundColor: PURPLE, borderColor: PURPLE },
  durationChipText: { fontSize: 14, fontWeight: "600" },
  durationChipTextActive: { color: "#FFFFFF" },

  // Start button
  startBtn: {
    backgroundColor: PURPLE,
    borderRadius: 50,
    paddingVertical: 18,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    ...Platform.select({
      ios: { shadowColor: PURPLE, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16 },
      android: { elevation: 0 },
    }),
  },
  startBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800", letterSpacing: 0.5 },

  // Today sessions
  sessionRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderRadius: 16, padding: 14, borderWidth: 1,
  },
  sessionDot: { width: 8, height: 8, borderRadius: 4 },
  sessionTopic: { flex: 1, fontSize: 14, fontWeight: "600" },
  sessionMins: { fontSize: 13, fontWeight: "500" },

  // Quickstart phase
  qsWrap: {
    flex: 1, alignItems: "center", justifyContent: "center",
    paddingHorizontal: 32, gap: 16,
  },
  qsBack: {
    position: "absolute", left: 20,
    width: 44, height: 44, alignItems: "center", justifyContent: "center",
  },
  qsIconRing: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: PURPLE,
    alignItems: "center", justifyContent: "center",
    marginBottom: 8,
    ...Platform.select({
      ios: { shadowColor: PURPLE, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16 },
      android: { elevation: 0 },
    }),
  },
  qsTitle: { fontSize: 26, fontWeight: "900", letterSpacing: -0.5, textAlign: "center" },
  qsSub: { fontSize: 15, fontWeight: "500", textAlign: "center", marginBottom: 8 },
  qsDurationRow: { flexDirection: "row", gap: 12, width: "100%", marginTop: 8 },

  // Active phase
  activeWrap: {
    flex: 1, alignItems: "center", justifyContent: "center",
    paddingHorizontal: 40, gap: 24,
  },
  activeTopicRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  activeDot: { width: 8, height: 8, borderRadius: 4 },
  activeTopicLabel: { fontSize: 15, fontWeight: "600" },
  ringWrap: {
    width: RING, height: RING,
    alignItems: "center", justifyContent: "center",
  },
  timerText: { fontSize: 56, fontWeight: "800", letterSpacing: -2 },
  activeSub: { fontSize: 14, fontWeight: "500" },
  endBtn: {
    backgroundColor: "#111111",
    borderRadius: 50, paddingVertical: 16,
    paddingHorizontal: 48,
    marginTop: 16,
  },
  endBtnText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },

  // Done modal
  doneOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center", alignItems: "center",
    paddingHorizontal: 32,
  },
  doneCard: {
    width: "100%", borderRadius: 28, padding: 32,
    alignItems: "center", gap: 12,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.15, shadowRadius: 24 },
      android: { elevation: 12 },
    }),
  },
  doneIconRing: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: `${PURPLE}15`,
    alignItems: "center", justifyContent: "center",
    marginBottom: 4,
  },
  doneTitle: { fontSize: 24, fontWeight: "800", letterSpacing: -0.5 },
  doneSub: { fontSize: 15, textAlign: "center", lineHeight: 22 },
  doneStreakRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 50, marginTop: 4,
  },
  doneStreakEmoji: { fontSize: 18 },
  doneStreakLabel: { fontSize: 15, fontWeight: "700" },
  doneDoneBtn: {
    backgroundColor: PURPLE, borderRadius: 50,
    paddingVertical: 16, paddingHorizontal: 48,
    marginTop: 8, width: "100%", alignItems: "center",
  },
  doneDoneBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
});
