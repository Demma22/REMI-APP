import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
  Dimensions, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getUserData, saveUserData, getCurrentUserInfo, updateUserData } from '../../services/userDataService';
import SvgIcon from '../../components/SvgIcon';
import { OnboardingSkeleton } from '../../components/SkeletonLoader';

const { width: SW } = Dimensions.get('window');
const PURPLE = '#535FFD';

const INTRO_SLIDES = [
  {
    emoji: '🎯',
    title: 'Deep focus,\nevery day',
    body: 'Start focus sessions, track your streak, and build a study habit that sticks.',
  },
  {
    emoji: '📅',
    title: 'Your schedule,\nalways clear',
    body: "Add your classes and activities. Know what's next without thinking twice.",
  },
  {
    emoji: '⏰',
    title: 'Never miss\na deadline',
    body: 'Track assignments, exams, and due dates — all in one place.',
  },
];

const QUESTIONS = [
  {
    id: 'nickname',
    question: "What should we call you?",
    type: 'text',
    placeholder: 'Your nickname',
    required: true,
  },
  {
    id: 'studyStage',
    question: 'What stage are you in?',
    type: 'single',
    options: [
      { id: 'high_school',   label: 'High School',   icon: 'highschool' },
      { id: 'undergraduate', label: 'Undergraduate',  icon: 'undergraduate' },
      { id: 'graduate',      label: 'Graduate',       icon: 'graduate' },
      { id: 'professional',  label: 'Professional',   icon: 'professional' },
      { id: 'not_studying',  label: 'Not studying',   icon: 'nonstudent' },
    ],
  },
  {
    id: 'focusTarget',
    question: 'How long do you want to\nfocus each day?',
    type: 'focusTarget',
    options: [
      { mins: 30,  label: '30 min',   sublabel: 'Light focus' },
      { mins: 60,  label: '1 hour',   sublabel: 'Moderate' },
      { mins: 90,  label: '1.5 hrs',  sublabel: 'Deep work' },
      { mins: 120, label: '2 hours',  sublabel: 'Intense' },
    ],
  },
  {
    id: 'heardFrom',
    question: 'How did you hear about REMI?',
    type: 'single',
    options: [
      { id: 'family_friend', label: 'Friends & Family', icon: 'friends' },
      { id: 'social_media',  label: 'Social Media',     icon: 'media' },
      { id: 'snd_studio',    label: 'SND Studio',       icon: 'web' },
      { id: 'app_store',     label: 'App Store',        icon: 'app' },
      { id: 'other',         label: 'Other',            icon: 'other' },
    ],
  },
  {
    id: 'timetable',
    type: 'timetable',
    question: 'Add your first class',
    body: "We'll remind you before it starts. You can add more later.",
    optional: true,
  },
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MIN_STEPS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

function fmtTime(h, m, p) {
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} ${p}`;
}

function TimeDrum({ label, hour, minute, period, onHour, onMinute, onPeriod }) {
  const mIdx = MIN_STEPS.indexOf(minute);
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: '#888', marginBottom: 6, letterSpacing: 0.5 }}>{label}</Text>
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: '#F5F5FF', borderRadius: 14, padding: 10,
        borderWidth: 1.5, borderColor: '#E0E0FF',
      }}>
        {/* Hour */}
        <View style={{ alignItems: 'center', minWidth: 32 }}>
          <TouchableOpacity onPress={() => onHour(hour === 12 ? 1 : hour + 1)} hitSlop={8}>
            <Text style={{ color: PURPLE, fontSize: 14, fontWeight: '800' }}>▲</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 22, fontWeight: '800', color: '#111', marginVertical: 2 }}>
            {String(hour).padStart(2, '0')}
          </Text>
          <TouchableOpacity onPress={() => onHour(hour === 1 ? 12 : hour - 1)} hitSlop={8}>
            <Text style={{ color: PURPLE, fontSize: 14, fontWeight: '800' }}>▼</Text>
          </TouchableOpacity>
        </View>
        <Text style={{ fontSize: 20, fontWeight: '700', color: '#555' }}>:</Text>
        {/* Minute */}
        <View style={{ alignItems: 'center', minWidth: 32 }}>
          <TouchableOpacity onPress={() => onMinute(MIN_STEPS[(mIdx + 1) % MIN_STEPS.length])} hitSlop={8}>
            <Text style={{ color: PURPLE, fontSize: 14, fontWeight: '800' }}>▲</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 22, fontWeight: '800', color: '#111', marginVertical: 2 }}>
            {String(minute).padStart(2, '0')}
          </Text>
          <TouchableOpacity onPress={() => onMinute(MIN_STEPS[(mIdx - 1 + MIN_STEPS.length) % MIN_STEPS.length])} hitSlop={8}>
            <Text style={{ color: PURPLE, fontSize: 14, fontWeight: '800' }}>▼</Text>
          </TouchableOpacity>
        </View>
        {/* AM/PM */}
        <TouchableOpacity
          onPress={() => onPeriod(period === 'AM' ? 'PM' : 'AM')}
          style={{ backgroundColor: `${PURPLE}20`, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 5, marginLeft: 2 }}
        >
          <Text style={{ color: PURPLE, fontWeight: '800', fontSize: 12 }}>{period}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function OnboardingScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  // Phase: 'intro' | 'questions' | 'loading'
  const [phase, setPhase] = useState('intro');
  const [slideIdx, setSlideIdx] = useState(0);
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [textValue, setTextValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingInit, setLoadingInit] = useState(true);

  // Timetable state
  const [courseName, setCourseName] = useState('');
  const [classDay, setClassDay] = useState('Monday');
  const [startH, setStartH] = useState(9);
  const [startM, setStartM] = useState(0);
  const [startP, setStartP] = useState('AM');
  const [endH, setEndH] = useState(10);
  const [endM, setEndM] = useState(0);
  const [endP, setEndP] = useState('AM');

  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => { checkExisting(); }, []);

  const checkExisting = async () => {
    try {
      const userInfo = await getCurrentUserInfo();
      if (!userInfo) { setLoadingInit(false); return; }
      const ud = await getUserData();
      if (ud?.onboardingCompleted === true) {
        navigation.replace('Home');
        return;
      }
      // Resume at questions if partially answered
      if (ud?.nickname) setPhase('questions');
    } catch {}
    finally { setLoadingInit(false); }
  };

  const fadeTransition = (cb) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
      cb();
      Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    });
  };

  // ── Intro navigation ────────────────────────────────────────────────────────
  const nextSlide = () => {
    if (slideIdx < INTRO_SLIDES.length - 1) {
      fadeTransition(() => setSlideIdx(i => i + 1));
    } else {
      fadeTransition(() => setPhase('questions'));
    }
  };

  const skipIntro = () => {
    fadeTransition(() => setPhase('questions'));
  };

  // ── Question navigation ─────────────────────────────────────────────────────
  const currentQ = QUESTIONS[qIdx];
  const isLastQ = qIdx === QUESTIONS.length - 1;

  const advance = (newAnswers) => {
    if (isLastQ) {
      completeOnboarding(newAnswers);
    } else {
      fadeTransition(() => setQIdx(i => i + 1));
    }
  };

  const handleSingle = (optId) => {
    const na = { ...answers, [currentQ.id]: optId };
    setAnswers(na);
    advance(na);
  };

  const handleFocusTarget = (mins) => {
    const na = { ...answers, focusTarget: mins };
    setAnswers(na);
    advance(na);
  };

  const handleText = () => {
    if (!textValue.trim()) { Alert.alert('Required', 'Please enter your nickname'); return; }
    const na = { ...answers, nickname: textValue.trim() };
    setAnswers(na);
    advance(na);
  };

  const handleTimetableAdd = async (finalAnswers) => {
    if (!courseName.trim()) { Alert.alert('Required', 'Please enter a course name'); return; }
    const startTime = fmtTime(startH, startM, startP);
    const endTime = fmtTime(endH, endM, endP);
    const entry = {
      name: courseName.trim(),
      start: startTime,
      end: endTime,
      type: 'class',
      lecturer: '',
      location: '',
      reminder: true,
      day: classDay,
      id: Date.now(),
      createdAt: new Date().toISOString(),
      isActivity: true,
    };
    const timetable = { [classDay.toLowerCase()]: [entry] };
    await completeOnboarding(finalAnswers, timetable);
  };

  const completeOnboarding = async (finalAnswers, timetable = null) => {
    setSaving(true);
    try {
      const userInfo = await getCurrentUserInfo();
      if (!userInfo) { Alert.alert('Error', 'Not logged in'); setSaving(false); return; }

      const data = {
        nickname: finalAnswers.nickname || '',
        studyStage: finalAnswers.studyStage || null,
        focusTarget: finalAnswers.focusTarget || 60,
        heardFrom: finalAnswers.heardFrom || null,
        onboarding_completed: true,
        onboardingCompleted: true,
        onboarding_completed_at: new Date().toISOString(),
      };
      if (timetable) data.timetable = timetable;

      await saveUserData(data);
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    } catch {
      Alert.alert('Error', 'Failed to save. Please try again.');
      setSaving(false);
    }
  };

  const skipTimetable = () => completeOnboarding(answers);

  // ── Render ──────────────────────────────────────────────────────────────────
  if (loadingInit) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <OnboardingSkeleton />
      </View>
    );
  }

  if (saving) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={PURPLE} />
        <Text style={{ marginTop: 16, fontSize: 15, color: '#888' }}>Setting up your account…</Text>
      </View>
    );
  }

  // ── Intro slides ─────────────────────────────────────────────────────────────
  if (phase === 'intro') {
    const slide = INTRO_SLIDES[slideIdx];
    return (
      <View style={{ flex: 1, backgroundColor: '#1A1F8F' }}>
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          {/* Skip */}
          <TouchableOpacity
            onPress={skipIntro}
            style={{ position: 'absolute', top: insets.top + 16, right: 24, zIndex: 10, paddingVertical: 6, paddingHorizontal: 14, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20 }}
          >
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600' }}>Skip</Text>
          </TouchableOpacity>

          {/* Content */}
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 20 }}>
            <Text style={{ fontSize: 80 }}>{slide.emoji}</Text>
            <Text style={{ fontSize: 36, fontWeight: '800', color: '#FFFFFF', textAlign: 'center', lineHeight: 44, letterSpacing: -0.5 }}>
              {slide.title}
            </Text>
            <Text style={{ fontSize: 16, color: 'rgba(255,255,255,0.65)', textAlign: 'center', lineHeight: 24, maxWidth: 300 }}>
              {slide.body}
            </Text>
          </View>

          {/* Dots + button */}
          <View style={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 32, gap: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
              {INTRO_SLIDES.map((_, i) => (
                <View key={i} style={{
                  width: i === slideIdx ? 24 : 8, height: 8, borderRadius: 4,
                  backgroundColor: i === slideIdx ? '#FFFFFF' : 'rgba(255,255,255,0.3)',
                }} />
              ))}
            </View>
            <TouchableOpacity
              onPress={nextSlide}
              style={{ backgroundColor: '#FFFFFF', borderRadius: 50, paddingVertical: 18, alignItems: 'center' }}
              activeOpacity={0.9}
            >
              <Text style={{ color: '#1A1F8F', fontSize: 16, fontWeight: '800' }}>
                {slideIdx === INTRO_SLIDES.length - 1 ? "Let's go →" : 'Next'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    );
  }

  // ── Questions ────────────────────────────────────────────────────────────────
  const progress = (qIdx / QUESTIONS.length) * 100;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#FFFFFF' }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {/* Progress bar */}
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: 10, backgroundColor: '#FFFFFF' }}>
        <View style={{ height: 4, backgroundColor: '#EFEFEF', borderRadius: 2, overflow: 'hidden' }}>
          <View style={{ width: `${progress}%`, height: '100%', backgroundColor: PURPLE, borderRadius: 2 }} />
        </View>
      </View>

      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 24, paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Nickname */}
          {currentQ.type === 'text' && (
            <>
              <Text style={qTitle}>{currentQ.question}</Text>
              <TextInput
                style={textInputStyle}
                value={textValue}
                onChangeText={setTextValue}
                placeholder={currentQ.placeholder}
                placeholderTextColor="#C0C0C0"
                autoFocus
                maxLength={30}
                onSubmitEditing={handleText}
                returnKeyType="done"
              />
              <Btn label="Continue" onPress={handleText} />
            </>
          )}

          {/* Single select */}
          {currentQ.type === 'single' && (
            <>
              <Text style={qTitle}>{currentQ.question}</Text>
              <View style={{ gap: 10, marginTop: 4 }}>
                {currentQ.options.map(opt => {
                  const selected = answers[currentQ.id] === opt.id;
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      onPress={() => handleSingle(opt.id)}
                      activeOpacity={0.75}
                      style={{
                        flexDirection: 'row', alignItems: 'center', gap: 14,
                        backgroundColor: selected ? `${PURPLE}10` : '#F8F8FF',
                        borderRadius: 16, padding: 16,
                        borderWidth: 2, borderColor: selected ? PURPLE : '#EFEFEF',
                      }}
                    >
                      {opt.icon && (
                        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: selected ? `${PURPLE}18` : '#EFEFEF', justifyContent: 'center', alignItems: 'center' }}>
                          <SvgIcon name={opt.icon} size={22} color={selected ? PURPLE : '#888'} />
                        </View>
                      )}
                      <Text style={{ flex: 1, fontSize: 16, fontWeight: '600', color: selected ? PURPLE : '#111' }}>
                        {opt.label}
                      </Text>
                      {selected && (
                        <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: PURPLE, justifyContent: 'center', alignItems: 'center' }}>
                          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '900' }}>✓</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          {/* Focus target */}
          {currentQ.type === 'focusTarget' && (
            <>
              <Text style={qTitle}>{currentQ.question}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 4 }}>
                {currentQ.options.map(opt => {
                  const selected = answers.focusTarget === opt.mins;
                  return (
                    <TouchableOpacity
                      key={opt.mins}
                      onPress={() => handleFocusTarget(opt.mins)}
                      activeOpacity={0.8}
                      style={{
                        width: (SW - 60) / 2, paddingVertical: 22, borderRadius: 18,
                        alignItems: 'center',
                        backgroundColor: selected ? PURPLE : '#F5F5FF',
                        borderWidth: 2, borderColor: selected ? PURPLE : '#E8E8FF',
                      }}
                    >
                      <Text style={{ fontSize: 22, fontWeight: '800', color: selected ? '#FFF' : '#111', letterSpacing: -0.5 }}>
                        {opt.label}
                      </Text>
                      <Text style={{ fontSize: 12, fontWeight: '500', color: selected ? 'rgba(255,255,255,0.75)' : '#888', marginTop: 3 }}>
                        {opt.sublabel}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          {/* Timetable */}
          {currentQ.type === 'timetable' && (
            <>
              <Text style={qTitle}>{currentQ.question}</Text>
              <Text style={{ fontSize: 14, color: '#888', marginBottom: 24, lineHeight: 20 }}>{currentQ.body}</Text>

              {/* Course name */}
              <Text style={fieldLabel}>Course / Class name</Text>
              <TextInput
                style={textInputStyle}
                value={courseName}
                onChangeText={setCourseName}
                placeholder="e.g. Mathematics, Physics…"
                placeholderTextColor="#C0C0C0"
                maxLength={50}
              />

              {/* Day selector */}
              <Text style={[fieldLabel, { marginTop: 8 }]}>Day</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                {DAYS.map((d, i) => {
                  const sel = classDay === d;
                  return (
                    <TouchableOpacity
                      key={d}
                      onPress={() => setClassDay(d)}
                      style={{
                        paddingHorizontal: 16, paddingVertical: 10, borderRadius: 50,
                        backgroundColor: sel ? PURPLE : '#F0F0FF',
                        borderWidth: 1.5, borderColor: sel ? PURPLE : '#E0E0FF',
                      }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: '700', color: sel ? '#FFF' : '#555' }}>
                        {DAY_SHORT[i]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Time pickers */}
              <Text style={[fieldLabel]}>Time</Text>
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 28 }}>
                <TimeDrum
                  label="START"
                  hour={startH} minute={startM} period={startP}
                  onHour={setStartH} onMinute={setStartM} onPeriod={setStartP}
                />
                <TimeDrum
                  label="END"
                  hour={endH} minute={endM} period={endP}
                  onHour={setEndH} onMinute={setEndM} onPeriod={setEndP}
                />
              </View>

              <Btn label="Add Class & Continue" onPress={() => handleTimetableAdd(answers)} />
              <TouchableOpacity onPress={skipTimetable} style={{ marginTop: 14, alignItems: 'center', padding: 8 }}>
                <Text style={{ color: '#AAAAAA', fontSize: 14, fontWeight: '500' }}>Skip for now</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

function Btn({ label, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.88}
      style={{ backgroundColor: PURPLE, borderRadius: 50, paddingVertical: 18, alignItems: 'center', marginTop: 8 }}
    >
      <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>{label}</Text>
    </TouchableOpacity>
  );
}

const qTitle = {
  fontSize: 28, fontWeight: '800', color: '#111',
  marginBottom: 24, lineHeight: 36, letterSpacing: -0.3,
};

const textInputStyle = {
  backgroundColor: '#F5F5FF',
  borderWidth: 1.5, borderColor: '#E0E0FF',
  borderRadius: 16, paddingHorizontal: 20, paddingVertical: 18,
  fontSize: 17, color: '#111', marginBottom: 8,
};

const fieldLabel = {
  fontSize: 12, fontWeight: '700', color: '#888',
  letterSpacing: 0.5, marginBottom: 8, textTransform: 'uppercase',
};
