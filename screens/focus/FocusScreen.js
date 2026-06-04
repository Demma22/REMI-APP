import React, { useEffect, useRef, useState, useMemo } from "react";
import {
  View, Text, TouchableOpacity, ScrollView, Animated,
  StyleSheet, Platform, Modal, AppState,
} from "react-native";
import { activateKeepAwake, deactivateKeepAwake } from "expo-keep-awake";
import AnimatedGradientBg from "../../components/AnimatedGradientBg";
import { Svg, Circle } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getUserData, updateUserData } from "../../services/userDataService";
import NavigationBar from "../../components/NavigationBar";
import SvgIcon from "../../components/SvgIcon";
import { useTheme } from "../../contexts/ThemeContext";
import { useFocusMusic, MUSIC_STATIONS } from "../../hooks/useFocusMusic";

const PURPLE = "#535FFD";

const TARGET_OPTIONS = [
  { mins: 30, label: "30 min", sublabel: "Light focus" },
  { mins: 60, label: "1 hour", sublabel: "Moderate" },
  { mins: 90, label: "1.5 hrs", sublabel: "Deep work" },
  { mins: 120, label: "2 hours", sublabel: "Intense" },
];

// Active timer ring
const RING = 230;
const STROKE = 14;
const RADIUS = RING / 2 - STROKE / 2;
const CIRC = 2 * Math.PI * RADIUS;

// Idle dashboard main ring
const DASH_RING = 192;
const DASH_STROKE = 16;
const DASH_RADIUS = DASH_RING / 2 - DASH_STROKE / 2;
const DASH_CIRC = 2 * Math.PI * DASH_RADIUS;


const CAL_ITEM_W = 54;

const DRUM_ITEM_H = 60;
const HOUR_VALUES = [0, 1, 2, 3, 4, 5];
const MINUTE_VALUES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

function localDateStr(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
function todayStr() {
  return localDateStr();
}
function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return localDateStr(d);
}
function formatCountdown(secs) {
  if (secs >= 3600) {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ── Pulse ring (active timer background) ──────────────────────────────────────
function PulseRing({ delay, size, color }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(scale,   { toValue: 3.8, duration: 2200, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0,   duration: 2200, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scale,   { toValue: 1,    duration: 0, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.45, duration: 0, useNativeDriver: true }),
        ]),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        width: size, height: size, borderRadius: size / 2,
        borderWidth: 2, borderColor: color,
        opacity, transform: [{ scale }],
      }}
    />
  );
}

// ── Scroll drum picker ─────────────────────────────────────────────────────────
function ScrollDrum({ values, initialIndex, onSelect, textColor, highlightBg }) {
  const scrollY = useRef(new Animated.Value(initialIndex * DRUM_ITEM_H)).current;
  const scrollRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => {
      scrollRef.current?.scrollTo({ y: initialIndex * DRUM_ITEM_H, animated: false });
    }, 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={{ height: DRUM_ITEM_H * 3, width: "100%" }}>
      <View
        pointerEvents="none"
        style={{
          position: "absolute", zIndex: 1,
          top: DRUM_ITEM_H, left: 10, right: 10, height: DRUM_ITEM_H,
          backgroundColor: highlightBg, borderRadius: 14,
        }}
      />
      <Animated.ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={DRUM_ITEM_H}
        decelerationRate="fast"
        contentContainerStyle={{ paddingVertical: DRUM_ITEM_H }}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        onMomentumScrollEnd={e => {
          const idx = Math.round(e.nativeEvent.contentOffset.y / DRUM_ITEM_H);
          onSelect(values[Math.min(Math.max(idx, 0), values.length - 1)]);
        }}
      >
        {values.map((v, i) => {
          const center = i * DRUM_ITEM_H;
          const opacity = scrollY.interpolate({
            inputRange: [center - DRUM_ITEM_H, center, center + DRUM_ITEM_H],
            outputRange: [0.18, 1, 0.18],
            extrapolate: "clamp",
          });
          const scale = scrollY.interpolate({
            inputRange: [center - DRUM_ITEM_H, center, center + DRUM_ITEM_H],
            outputRange: [0.6, 1.18, 0.6],
            extrapolate: "clamp",
          });
          return (
            <Animated.View
              key={i}
              style={{
                height: DRUM_ITEM_H, alignItems: "center", justifyContent: "center",
                opacity, transform: [{ scale }],
              }}
            >
              <Text style={{ fontSize: 38, fontWeight: "900", color: textColor, letterSpacing: -1 }}>
                {String(v).padStart(2, "0")}
              </Text>
            </Animated.View>
          );
        })}
      </Animated.ScrollView>
    </View>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function FocusScreen({ navigation, route }) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const [phase, setPhase] = useState(() => route.params?.quickStart ? "quickstart" : "idle");
  const [paused, setPaused] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [duration, setDuration] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [streak, setStreak] = useState(0);
  const [todaySessions, setTodaySessions] = useState([]);
  const [allFocusSessions, setAllFocusSessions] = useState([]);
  const [selectedDate, setSelectedDate] = useState(() => todayStr());
  const [viewMonth, setViewMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [topics, setTopics] = useState([]);
  const [focusTarget, setFocusTarget] = useState(60);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [selectedTargetOption, setSelectedTargetOption] = useState(60);

  // Quickstart state
  const [qsTypedText, setQsTypedText] = useState("");
  const [qsTypingDone, setQsTypingDone] = useState(false);
  const [qsHours, setQsHours] = useState(0);
  const [qsMinutes, setQsMinutes] = useState(25);
  const [qsBtnLabel, setQsBtnLabel] = useState("Start");
  const qsIconScale       = useRef(new Animated.Value(0.4)).current;
  const qsSubtitleOpacity = useRef(new Animated.Value(0)).current;
  const qsPickersY        = useRef(new Animated.Value(60)).current;
  const qsPickersOpacity  = useRef(new Animated.Value(0)).current;
  const qsBtnY            = useRef(new Animated.Value(30)).current;
  const qsBtnOpacity      = useRef(new Animated.Value(0)).current;
  const qsBtnTextOpacity  = useRef(new Animated.Value(1)).current;
  const qsMountFade       = useRef(new Animated.Value(0)).current;
  const qsTypingTimer     = useRef(null);
  const qsBtnToggle       = useRef(null);

  const { stationId, selectStation, isPlaying, isLoading, volumeStep, changeVolume, togglePlay, stopMusic, currentStation } = useFocusMusic();

  const timerRef = useRef(null);
  const totalRef = useRef(25 * 60);
  const sessionMinsRef = useRef(25);
  const endTimeRef = useRef(null);
  const remainingOnPauseRef = useRef(null);
  const finishSessionRef = useRef(null);
  const calScrollRef = useRef(null);

  const progress = 1 - timeLeft / totalRef.current;
  const strokeOffset = CIRC * (1 - progress);

  // Calendar: all days in the viewed month
  const calendarDays = useMemo(() => {
    const { year, month } = viewMonth;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({
        iso,
        dayName: date.toLocaleString("en-US", { weekday: "short" }),
        dayNum: d,
        isFuture: date > today,
      });
    }
    return days;
  }, [viewMonth]);

  const now = new Date();
  const isCurrentMonth =
    viewMonth.year === now.getFullYear() && viewMonth.month === now.getMonth();

  const goToPrevMonth = () => {
    setViewMonth(prev => {
      const d = new Date(prev.year, prev.month - 1, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  const goToNextMonth = () => {
    if (isCurrentMonth) return;
    setViewMonth(prev => {
      const d = new Date(prev.year, prev.month + 1, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  const sessionDates = useMemo(
    () => new Set(allFocusSessions.map(s => s.date)),
    [allFocusSessions]
  );

  const selectedDaySessions = useMemo(
    () => allFocusSessions.filter(s => s.date === selectedDate),
    [allFocusSessions, selectedDate]
  );

  const selectedDayMinutes = selectedDaySessions.reduce((s, x) => s + (x.duration || 0), 0);
  const remainingMinutes = Math.max(0, focusTarget - selectedDayMinutes);
  const dayProgress = focusTarget > 0 ? Math.min(selectedDayMinutes / focusTarget, 1) : 0;
  const isToday = selectedDate === todayStr();

  // Scroll calendar: show today when on current month, else reset to start
  useEffect(() => {
    if (phase !== "idle") return;
    const t = setTimeout(() => {
      if (isCurrentMonth) {
        const todayIdx = new Date().getDate() - 1;
        calScrollRef.current?.scrollTo({ x: todayIdx * CAL_ITEM_W - 140, animated: false });
      } else {
        calScrollRef.current?.scrollTo({ x: 0, animated: false });
      }
    }, 150);
    return () => clearTimeout(t);
  }, [phase, viewMonth]);

  useEffect(() => {
    loadFocusData();
    loadTopics();
    const unsub = navigation.addListener("focus", () => {
      loadFocusData();
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

  useEffect(() => { finishSessionRef.current = finishSession; });

  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active" && endTimeRef.current !== null) {
        const remaining = Math.ceil((endTimeRef.current - Date.now()) / 1000);
        if (remaining <= 0) {
          if (timerRef.current) clearInterval(timerRef.current);
          timerRef.current = null;
          endTimeRef.current = null;
          setTimeLeft(0);
          finishSessionRef.current(sessionMinsRef.current, true);
        } else {
          setTimeLeft(remaining);
        }
      }
    });
    return () => sub.remove();
  }, []);

  // Quickstart animation sequence
  useEffect(() => {
    if (phase !== "quickstart") return;

    // Auto-start music at low volume
    if (stationId === 'off') selectStation('lofi');

    setQsTypedText("");
    setQsTypingDone(false);
    setQsHours(0);
    setQsMinutes(25);
    setQsBtnLabel("Start");
    qsIconScale.setValue(0.4);
    qsSubtitleOpacity.setValue(0);
    qsPickersY.setValue(60);
    qsPickersOpacity.setValue(0);
    qsBtnY.setValue(30);
    qsBtnOpacity.setValue(0);
    qsBtnTextOpacity.setValue(1);
    qsMountFade.setValue(0);

    Animated.timing(qsMountFade, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    Animated.spring(qsIconScale, { toValue: 1, tension: 140, friction: 8, useNativeDriver: true }).start();

    const FULL = "Activating\nFocus Mode";
    let i = 0;
    const type = () => {
      i++;
      setQsTypedText(FULL.slice(0, i));
      if (i < FULL.length) {
        qsTypingTimer.current = setTimeout(type, 52);
      } else {
        setQsTypingDone(true);
        setTimeout(() => {
          Animated.timing(qsSubtitleOpacity, { toValue: 1, duration: 480, useNativeDriver: true }).start(() => {
            Animated.parallel([
              Animated.spring(qsPickersY, { toValue: 0, tension: 58, friction: 9, useNativeDriver: true }),
              Animated.timing(qsPickersOpacity, { toValue: 1, duration: 420, useNativeDriver: true }),
            ]).start(() => {
              Animated.parallel([
                Animated.spring(qsBtnY, { toValue: 0, tension: 85, friction: 10, useNativeDriver: true }),
                Animated.timing(qsBtnOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
              ]).start(() => {
                qsBtnToggle.current = setInterval(() => {
                  Animated.timing(qsBtnTextOpacity, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => {
                    setQsBtnLabel(prev => prev === "Start" ? "Lock In" : "Start");
                    Animated.timing(qsBtnTextOpacity, { toValue: 1, duration: 220, useNativeDriver: true }).start();
                  });
                }, 4000);
              });
            });
          });
        }, 180);
      }
    };

    const initial = setTimeout(type, 380);
    return () => {
      clearTimeout(initial);
      clearTimeout(qsTypingTimer.current);
      if (qsBtnToggle.current) clearInterval(qsBtnToggle.current);
    };
  }, [phase]);

  const loadFocusData = async () => {
    try {
      const ud = await getUserData();
      const sessions = Array.isArray(ud?.focusSessions) ? ud.focusSessions : [];
      setAllFocusSessions(sessions);
      setTodaySessions(sessions.filter(s => s.date === todayStr()));
      setStreak(ud?.focusStreak?.count || 0);
      if (ud?.focusTarget != null) {
        setFocusTarget(ud.focusTarget);
        setSelectedTargetOption(ud.focusTarget);
      } else {
        setShowTargetModal(true);
      }
    } catch {}
  };

  const saveTarget = async (mins) => {
    try {
      await updateUserData({ focusTarget: mins });
      setFocusTarget(mins);
      setSelectedTargetOption(mins);
      setShowTargetModal(false);
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

  const startSession = (overrideMins) => {
    const mins = overrideMins !== undefined ? overrideMins : duration;
    const total = mins * 60;
    totalRef.current = total;
    sessionMinsRef.current = mins;
    setTimeLeft(total);
    setPaused(false);
    activateKeepAwake();
    endTimeRef.current = Date.now() + total * 1000;
    setPhase("active");
    timerRef.current = setInterval(() => {
      const remaining = Math.ceil((endTimeRef.current - Date.now()) / 1000);
      if (remaining <= 0) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        endTimeRef.current = null;
        setTimeLeft(0);
        finishSessionRef.current(mins);
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);
  };

  const pauseSession = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    remainingOnPauseRef.current = endTimeRef.current
      ? Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000))
      : 0;
    endTimeRef.current = null;
    setPaused(true);
  };

  const resumeSession = () => {
    const remaining = remainingOnPauseRef.current;
    if (!remaining || remaining <= 0) return;
    endTimeRef.current = Date.now() + remaining * 1000;
    setPaused(false);
    timerRef.current = setInterval(() => {
      const r = Math.ceil((endTimeRef.current - Date.now()) / 1000);
      if (r <= 0) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        endTimeRef.current = null;
        setTimeLeft(0);
        finishSessionRef.current(sessionMinsRef.current, true);
      } else {
        setTimeLeft(r);
      }
    }, 1000);
  };

  const endSession = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    endTimeRef.current = null;
    deactivateKeepAwake();
    const elapsed = Math.max(Math.ceil((totalRef.current - timeLeft) / 60), 1);
    finishSession(elapsed, false);
  };

  const finishSession = async (minutesDone, isCompleted = true) => {
    deactivateKeepAwake();
    stopMusic();
    endTimeRef.current = null;
    setSessionDuration(minutesDone);
    setPhase("done");
    const today = todayStr();
    const newSession = {
      topic: selectedTopic?.label || "Free Focus",
      duration: minutesDone,
      date: today,
      completedAt: new Date().toISOString(),
      completed: isCompleted,
    };
    try {
      const ud = await getUserData();
      const allSessions = Array.isArray(ud?.focusSessions) ? ud.focusSessions : [];
      allSessions.push(newSession);

      const streakData = ud?.focusStreak || { count: 0, lastDate: null };
      let newCount = streakData.count;
      if (streakData.lastDate === today) {
        // already counted today
      } else if (streakData.lastDate === yesterdayStr()) {
        newCount += 1;
      } else {
        newCount = 1;
      }

      await updateUserData({
        focusSessions: allSessions,
        focusStreak: { count: newCount, lastDate: today },
      });

      setAllFocusSessions(allSessions);
      setTodaySessions(allSessions.filter(s => s.date === today));
      setStreak(newCount);
    } catch {}
  };

  const handleDone = () => {
    setPaused(false);
    setPhase("idle");
    setTimeLeft(duration * 60);
  };

  // ── QUICKSTART ─────────────────────────────────────────────────────────────
  if (phase === "quickstart") {
    const totalMins = qsHours * 60 + qsMinutes;
    return (
      <Animated.View style={{ flex: 1, opacity: qsMountFade }}>
        <AnimatedGradientBg>
          <TouchableOpacity
            style={[fs.qsBack, { top: insets.top + 12 }]}
            onPress={() => {
              if (qsBtnToggle.current) clearInterval(qsBtnToggle.current);
              setPhase("idle");
            }}
            activeOpacity={0.7}
          >
            <SvgIcon name="arrow-back" size={20} color="rgba(255,255,255,0.75)" />
          </TouchableOpacity>

          <View style={fs.qsWrap}>
            <Text style={[fs.qsTitle, { color: "#FFFFFF" }]}>
              {qsTypedText}
              {!qsTypingDone ? (
                <Text style={{ color: PURPLE, fontWeight: "900" }}>|</Text>
              ) : null}
            </Text>

            <Animated.Text style={[fs.qsSub, { color: "rgba(255,255,255,0.5)", opacity: qsSubtitleOpacity }]}>
              Select how long
            </Animated.Text>

            {/* Music volume control */}
            <Animated.View style={{
              opacity: qsSubtitleOpacity,
              flexDirection: "row", alignItems: "center", gap: 10,
              backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 50,
              paddingHorizontal: 16, paddingVertical: 10,
            }}>
              <Text style={{ fontSize: 14 }}>🌙</Text>
              <Text style={{ fontSize: 13, fontWeight: "600", color: "rgba(255,255,255,0.6)", marginRight: 4 }}>
                {isLoading ? "Connecting…" : "Focus Music"}
              </Text>
              <TouchableOpacity onPress={() => changeVolume(volumeStep - 1)} activeOpacity={0.7} style={{ padding: 4 }}>
                <Text style={{ fontSize: 16, color: "rgba(255,255,255,0.5)", fontWeight: "700" }}>−</Text>
              </TouchableOpacity>
              {[0,1,2,3,4].map(i => (
                <TouchableOpacity key={i} onPress={() => changeVolume(i)} activeOpacity={0.7}>
                  <View style={{
                    width: 7, height: 7, borderRadius: 3.5,
                    backgroundColor: i <= volumeStep ? "#FFFFFF" : "rgba(255,255,255,0.2)",
                  }} />
                </TouchableOpacity>
              ))}
              <TouchableOpacity onPress={() => changeVolume(volumeStep + 1)} activeOpacity={0.7} style={{ padding: 4 }}>
                <Text style={{ fontSize: 16, color: "rgba(255,255,255,0.5)", fontWeight: "700" }}>+</Text>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View style={[
              fs.qsDrumsRow,
              { opacity: qsPickersOpacity, transform: [{ translateY: qsPickersY }] },
            ]}>
              <View style={[fs.qsDrumCard, { backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "rgba(255,255,255,0.13)" }]}>
                <ScrollDrum
                  key="hours"
                  values={HOUR_VALUES}
                  initialIndex={0}
                  onSelect={setQsHours}
                  textColor="#FFFFFF"
                  highlightBg="rgba(255,255,255,0.13)"
                />
                <Text style={[fs.qsDrumLabel, { color: "rgba(255,255,255,0.4)" }]}>HRS</Text>
              </View>

              <Text style={[fs.qsColon, { color: "rgba(255,255,255,0.55)" }]}>:</Text>

              <View style={[fs.qsDrumCard, { backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "rgba(255,255,255,0.13)" }]}>
                <ScrollDrum
                  key="minutes"
                  values={MINUTE_VALUES}
                  initialIndex={5}
                  onSelect={setQsMinutes}
                  textColor="#FFFFFF"
                  highlightBg="rgba(255,255,255,0.13)"
                />
                <Text style={[fs.qsDrumLabel, { color: "rgba(255,255,255,0.4)" }]}>MIN</Text>
              </View>
            </Animated.View>

            <Animated.View style={{ width: "100%", opacity: qsBtnOpacity, transform: [{ translateY: qsBtnY }] }}>
              <TouchableOpacity
                style={[fs.startBtn, fs.qsStartBtn, { backgroundColor: "#FFFFFF", shadowColor: "#000" }, totalMins === 0 && { opacity: 0.35 }]}
                onPress={() => {
                  if (totalMins === 0) return;
                  if (qsBtnToggle.current) clearInterval(qsBtnToggle.current);
                  startSession(totalMins);
                }}
                activeOpacity={0.85}
                disabled={totalMins === 0}
              >
                <Animated.Text style={[fs.startBtnText, { color: "#111111", opacity: qsBtnTextOpacity }]}>
                  {qsBtnLabel}
                </Animated.Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </AnimatedGradientBg>
      </Animated.View>
    );
  }

  // ── ACTIVE ─────────────────────────────────────────────────────────────────
  if (phase === "active") {
    return (
      <AnimatedGradientBg>
        <View style={[fs.activeWrap, { paddingTop: insets.top + 24 }]}>
          <View style={fs.activeTopicRow}>
            <View style={[fs.activeDot, { backgroundColor: "rgba(255,255,255,0.5)" }]} />
            <Text style={[fs.activeTopicLabel, { color: "rgba(255,255,255,0.6)" }]} numberOfLines={1}>
              {selectedTopic?.label || "Free Focus"}
            </Text>
          </View>

          <View style={fs.ringWrap}>
            <Svg width={RING} height={RING} style={StyleSheet.absoluteFill}>
              <Circle
                cx={RING / 2} cy={RING / 2} r={RADIUS}
                stroke="rgba(255,255,255,0.15)" strokeWidth={STROKE} fill="none"
              />
              <Circle
                cx={RING / 2} cy={RING / 2} r={RADIUS}
                stroke="#FFFFFF" strokeWidth={STROKE} fill="none"
                strokeDasharray={CIRC}
                strokeDashoffset={strokeOffset}
                strokeLinecap="round"
                rotation="-90"
                origin={`${RING / 2},${RING / 2}`}
              />
            </Svg>
            <Text style={[fs.timerText, { color: "#FFFFFF" }]}>
              {formatCountdown(timeLeft)}
            </Text>
          </View>

          <Text style={[fs.activeSub, { color: "rgba(255,255,255,0.5)" }]}>
            {paused ? "Paused" : "Stay focused"}
          </Text>

          {stationId !== 'off' && (
            <TouchableOpacity
              onPress={togglePlay}
              activeOpacity={0.7}
              style={{
                flexDirection: "row", alignItems: "center", gap: 8,
                paddingHorizontal: 16, paddingVertical: 8, borderRadius: 50,
                backgroundColor: "rgba(255,255,255,0.12)",
                borderWidth: 1, borderColor: "rgba(255,255,255,0.2)",
              }}
            >
              <Text style={{ fontSize: 14 }}>{currentStation?.emoji}</Text>
              <Text style={{ fontSize: 13, fontWeight: "600", color: "rgba(255,255,255,0.8)" }}>
                {currentStation?.label}
              </Text>
              <Text style={{ fontSize: 15, color: "rgba(255,255,255,0.7)", marginLeft: 2 }}>
                {isLoading ? "…" : isPlaying ? "⏸" : "▶"}
              </Text>
            </TouchableOpacity>
          )}

          <View style={fs.activeActionRow}>
            <TouchableOpacity
              style={fs.pauseBtn}
              onPress={paused ? resumeSession : pauseSession}
              activeOpacity={0.85}
            >
              <Text style={fs.pauseBtnText}>{paused ? "Resume" : "Pause"}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={fs.endBtn} onPress={endSession} activeOpacity={0.85}>
              <Text style={fs.endBtnText}>End</Text>
            </TouchableOpacity>
          </View>
        </View>
      </AnimatedGradientBg>
    );
  }

  // ── IDLE ───────────────────────────────────────────────────────────────────
  return (
    <View style={[fs.root, { backgroundColor: theme.colors.background }]}>

      {/* Header */}
      <View style={[fs.header, { paddingTop: insets.top + 12, backgroundColor: theme.colors.background }]}>
        <Text style={[fs.headerTitle, { color: theme.colors.textPrimary }]}>Focus</Text>
        <SvgIcon name="focus" size={22} color={PURPLE} />
      </View>

      {/* Calendar section */}
      <View style={[fs.calendarSection, { borderBottomColor: theme.colors.border }]}>

        {/* Month navigation header */}
        <View style={fs.monthHeader}>
          <TouchableOpacity onPress={goToPrevMonth} style={fs.monthNavBtn}>
            <Text style={[fs.monthNavChevron, { color: theme.colors.textPrimary }]}>‹</Text>
          </TouchableOpacity>
          <Text style={[fs.monthLabel, { color: theme.colors.textPrimary }]}>
            {new Date(viewMonth.year, viewMonth.month).toLocaleString("en-US", { month: "long", year: "numeric" })}
          </Text>
          <TouchableOpacity onPress={goToNextMonth} style={fs.monthNavBtn} disabled={isCurrentMonth}>
            <Text style={[fs.monthNavChevron, { color: isCurrentMonth ? theme.colors.border : theme.colors.textPrimary }]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Days strip — fixed height so horizontal ScrollView doesn't expand */}
        <View style={{ height: 82 }}>
        <ScrollView
          ref={calScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12 }}
        >
        {calendarDays.map((day) => {
          const isSelected = day.iso === selectedDate;
          const hasSession = sessionDates.has(day.iso);
          return (
            <TouchableOpacity
              key={day.iso}
              onPress={() => setSelectedDate(day.iso)}
              style={{ width: CAL_ITEM_W, alignItems: "center", paddingVertical: 10 }}
              activeOpacity={0.7}
            >
              <Text style={{
                fontSize: 11, fontWeight: "600", marginBottom: 5,
                color: theme.colors.textSecondary,
                opacity: day.isFuture ? 0.4 : 1,
              }}>
                {day.dayName}
              </Text>
              <View style={{
                width: 36, height: 36, borderRadius: 18,
                backgroundColor: isSelected ? PURPLE : "transparent",
                alignItems: "center", justifyContent: "center",
                opacity: day.isFuture ? 0.4 : 1,
              }}>
                <Text style={{
                  fontSize: 15, fontWeight: "700",
                  color: isSelected ? "#FFFFFF" : theme.colors.textPrimary,
                }}>
                  {day.dayNum}
                </Text>
              </View>
              {/* Activity dot */}
              <View style={{ height: 5, marginTop: 3, alignItems: "center" }}>
                {hasSession && (
                  <View style={{
                    width: 4, height: 4, borderRadius: 2,
                    backgroundColor: isSelected ? "rgba(255,255,255,0.5)" : PURPLE,
                  }} />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
        </ScrollView>
        </View>

      </View>

      {/* Main scrollable dashboard */}
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120, paddingTop: 12 }}
      >
        <View style={{ paddingHorizontal: 20 }}>
          <Text style={{ fontSize: 11, fontWeight: "800", color: theme.colors.textSecondary, letterSpacing: 1.5 }}>
            FOCUS SUMMARY
          </Text>

          {/* Main ring + side stats */}
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 20 }}>

            {/* Left: Sessions */}
            <View style={{ flex: 1, alignItems: "center", gap: 4 }}>
              <SvgIcon name="focus" size={22} color={theme.colors.textSecondary} />
              <Text style={{ fontSize: 30, fontWeight: "800", color: theme.colors.textPrimary, letterSpacing: -0.5 }}>
                {selectedDaySessions.length}
              </Text>
              <Text style={{ fontSize: 11, fontWeight: "600", color: theme.colors.textSecondary }}>Sessions</Text>
            </View>

            {/* Main ring */}
            <View style={{ width: DASH_RING, height: DASH_RING, alignItems: "center", justifyContent: "center" }}>
              <Svg width={DASH_RING} height={DASH_RING} style={StyleSheet.absoluteFill}>
                <Circle
                  cx={DASH_RING / 2} cy={DASH_RING / 2} r={DASH_RADIUS}
                  stroke={theme.colors.border} strokeWidth={DASH_STROKE} fill="none"
                />
                <Circle
                  cx={DASH_RING / 2} cy={DASH_RING / 2} r={DASH_RADIUS}
                  stroke={PURPLE}
                  strokeWidth={DASH_STROKE} fill="none"
                  strokeDasharray={DASH_CIRC}
                  strokeDashoffset={DASH_CIRC * (1 - dayProgress)}
                  strokeLinecap="round"
                  rotation="-90"
                  origin={`${DASH_RING / 2},${DASH_RING / 2}`}
                />
              </Svg>
              <View style={{ alignItems: "center" }}>
                <Text style={{ fontSize: 42, fontWeight: "800", color: theme.colors.textPrimary, letterSpacing: -2 }}>
                  {remainingMinutes}
                </Text>
                <Text style={{ fontSize: 12, color: theme.colors.textSecondary, fontWeight: "600", marginTop: 2 }}>
                  {remainingMinutes === 0 && focusTarget > 0 ? "Goal hit! 🎉" : "min remaining"}
                </Text>
              </View>
            </View>

            {/* Right: Streak */}
            <View style={{ flex: 1, alignItems: "center", gap: 4 }}>
              <SvgIcon name="fire" size={22} color={theme.colors.textSecondary} />
              <Text style={{ fontSize: 30, fontWeight: "800", color: theme.colors.textPrimary, letterSpacing: -0.5 }}>
                {streak}
              </Text>
              <Text style={{ fontSize: 11, fontWeight: "600", color: theme.colors.textSecondary }}>Streak</Text>
            </View>
          </View>

        </View>

        {/* Music toggle */}
        <TouchableOpacity
          onPress={() => selectStation(stationId === 'off' ? 'lofi' : 'off')}
          activeOpacity={0.75}
          style={{
            marginHorizontal: 20, marginTop: 28,
            flexDirection: "row", alignItems: "center", justifyContent: "space-between",
            backgroundColor: theme.colors.card, borderRadius: 16,
            padding: 16, borderWidth: 1, borderColor: theme.colors.border,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Text style={{ fontSize: 22 }}>🌙</Text>
            <View>
              <Text style={{ fontSize: 15, fontWeight: "700", color: theme.colors.textPrimary }}>Focus Music</Text>
              <Text style={{ fontSize: 12, color: theme.colors.textSecondary, marginTop: 1 }}>
                {isLoading ? "Connecting…" : stationId === 'off' ? "Tap to play" : isPlaying ? "Playing" : "Paused"}
              </Text>
            </View>
          </View>
          <View style={{
            width: 44, height: 26, borderRadius: 13,
            backgroundColor: stationId !== 'off' ? PURPLE : theme.colors.border,
            justifyContent: "center", paddingHorizontal: 3,
          }}>
            <View style={{
              width: 20, height: 20, borderRadius: 10, backgroundColor: "#FFFFFF",
              alignSelf: stationId !== 'off' ? "flex-end" : "flex-start",
            }} />
          </View>
        </TouchableOpacity>

        {/* Daily goal row */}
        <View style={{
          paddingHorizontal: 20, marginTop: 28,
          flexDirection: "row", justifyContent: "space-between", alignItems: "center",
        }}>
          <View>
            <Text style={[fs.sectionLabel, { color: theme.colors.textPrimary }]}>Daily Goal</Text>
            <Text style={{ color: theme.colors.textSecondary, fontSize: 12, marginTop: 2 }}>
              {focusTarget} min / day
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowTargetModal(true)}
            style={{ backgroundColor: `${PURPLE}15`, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 }}
          >
            <Text style={{ color: PURPLE, fontSize: 13, fontWeight: "700" }}>Edit Goal</Text>
          </TouchableOpacity>
        </View>

        {/* Sessions list for selected day */}
        {selectedDaySessions.length > 0 && (
          <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
            <Text style={[fs.sectionLabel, { color: theme.colors.textPrimary }]}>
              {isToday ? "Today's Sessions" : "Sessions"}
            </Text>
            <View style={{ marginTop: 12, gap: 10 }}>
              {selectedDaySessions.map((s, i) => (
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

        {/* Start session button — today only */}
        {isToday && (
          <View style={{ paddingHorizontal: 20, marginTop: 28 }}>
            <TouchableOpacity
              style={fs.startBtn}
              onPress={() => setPhase("quickstart")}
              activeOpacity={0.85}
            >
              <SvgIcon name="focus" size={20} color="#FFFFFF" />
              <Text style={fs.startBtnText}>Start Session</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <NavigationBar />

      {/* Set daily goal modal */}
      <Modal visible={showTargetModal} transparent animationType="fade" onRequestClose={() => saveTarget(60)}>
        <View style={fs.targetOverlay}>
          <View style={[fs.targetCard, { backgroundColor: theme.colors.card }]}>
            <View style={[fs.doneIconRing, { marginBottom: 8 }]}>
              <SvgIcon name="focus" size={36} color={PURPLE} />
            </View>
            <Text style={[fs.doneTitle, { color: theme.colors.textPrimary }]}>Set Your Daily Goal</Text>
            <Text style={[fs.doneSub, { color: theme.colors.textSecondary, marginBottom: 20 }]}>
              How many minutes do you want to focus each day?
            </Text>
            <View style={fs.targetOptionsGrid}>
              {TARGET_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.mins}
                  style={[fs.targetOption, { borderColor: theme.colors.border, backgroundColor: theme.colors.background },
                    selectedTargetOption === opt.mins && { backgroundColor: PURPLE, borderColor: PURPLE }]}
                  onPress={() => setSelectedTargetOption(opt.mins)}
                  activeOpacity={0.8}
                >
                  <Text style={[fs.targetOptLabel, { color: theme.colors.textPrimary },
                    selectedTargetOption === opt.mins && { color: "#FFFFFF" }]}>
                    {opt.label}
                  </Text>
                  <Text style={[fs.targetOptSub, { color: theme.colors.textSecondary },
                    selectedTargetOption === opt.mins && { color: "rgba(255,255,255,0.7)" }]}>
                    {opt.sublabel}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[fs.doneDoneBtn, { marginTop: 20 }]}
              onPress={() => saveTarget(selectedTargetOption)}
              activeOpacity={0.85}
            >
              <Text style={fs.doneDoneBtnText}>Set My Goal</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => saveTarget(60)} style={{ marginTop: 12 }}>
              <Text style={{ color: theme.colors.textSecondary, fontSize: 13, textAlign: "center" }}>Skip for now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Session complete modal */}
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

  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingBottom: 14,
  },
  headerTitle: { fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },

  calendarSection: { borderBottomWidth: StyleSheet.hairlineWidth },
  monthHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 6,
  },
  monthNavBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  monthNavChevron: { fontSize: 26, fontWeight: "300", lineHeight: 30 },
  monthLabel: { fontSize: 15, fontWeight: "700" },

  sectionLabel: { fontSize: 16, fontWeight: "800" },

  startBtn: {
    backgroundColor: PURPLE, borderRadius: 50, paddingVertical: 18,
    alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 10,
    ...Platform.select({
      ios: { shadowColor: PURPLE, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16 },
      android: { elevation: 0 },
    }),
  },
  startBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "500", letterSpacing: 0.5 },

  sessionRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderRadius: 15, padding: 14, borderWidth: 1,
  },
  sessionDot: { width: 8, height: 8, borderRadius: 4 },
  sessionTopic: { flex: 1, fontSize: 14, fontWeight: "600" },
  sessionMins: { fontSize: 13, fontWeight: "500" },

  // Quickstart
  qsWrap: {
    flex: 1, alignItems: "center", justifyContent: "center",
    paddingHorizontal: 28, gap: 18,
  },
  qsBack: {
    position: "absolute", left: 20,
    width: 44, height: 44, alignItems: "center", justifyContent: "center",
  },
  qsTitle: {
    fontSize: 34, fontWeight: "500", letterSpacing: -0.5,
    textAlign: "center", lineHeight: 40, minHeight: 80,
  },
  qsSub: { fontSize: 15, fontWeight: "500", textAlign: "center" },
  qsDrumsRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 4 },
  qsDrumCard: {
    width: 130, borderRadius: 15, overflow: "hidden",
    alignItems: "center", paddingBottom: 14,
  },
  qsDrumLabel: { fontSize: 11, fontWeight: "800", letterSpacing: 2.5, marginTop: 2 },
  qsColon: { fontSize: 40, fontWeight: "900", letterSpacing: -2, paddingBottom: 28 },
  qsStartBtn: { flexDirection: "column", gap: 0, marginTop: 4 },

  // Active timer
  activeWrap: {
    flex: 1, alignItems: "center", justifyContent: "center",
    paddingHorizontal: 32, gap: 24,
  },
  activeTopicRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  activeDot: { width: 8, height: 8, borderRadius: 4 },
  activeTopicLabel: { fontSize: 15, fontWeight: "600" },
  ringWrap: { width: RING, height: RING, alignItems: "center", justifyContent: "center" },
  timerText: { fontSize: 56, fontWeight: "800", letterSpacing: -2 },
  activeSub: { fontSize: 14, fontWeight: "500" },
  activeActionRow: { flexDirection: "row", gap: 12, width: "100%", marginTop: 8 },
  pauseBtn: {
    flex: 1, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 50,
    paddingVertical: 16, alignItems: "center",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.25)",
  },
  pauseBtnText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  endBtn: {
    flex: 1, backgroundColor: "#FFFFFF", borderRadius: 50,
    paddingVertical: 16, alignItems: "center",
  },
  endBtnText: { color: "#111111", fontSize: 15, fontWeight: "700" },

  // Done modal
  doneOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center", alignItems: "center", paddingHorizontal: 32,
  },
  doneCard: {
    width: "100%", borderRadius: 28, padding: 32, alignItems: "center", gap: 12,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.15, shadowRadius: 24 },
      android: { elevation: 12 },
    }),
  },
  doneIconRing: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: `${PURPLE}15`,
    alignItems: "center", justifyContent: "center", marginBottom: 4,
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

  // Target modal
  targetOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center", alignItems: "center", paddingHorizontal: 28,
  },
  targetCard: {
    width: "100%", borderRadius: 28, padding: 28, alignItems: "center",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.15, shadowRadius: 24 },
      android: { elevation: 12 },
    }),
  },
  targetOptionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, width: "100%" },
  targetOption: {
    width: "47%", borderRadius: 15, borderWidth: 1.5,
    paddingVertical: 14, paddingHorizontal: 12, alignItems: "center",
  },
  targetOptLabel: { fontSize: 18, fontWeight: "800", letterSpacing: -0.5 },
  targetOptSub: { fontSize: 12, fontWeight: "500", marginTop: 2 },
});
