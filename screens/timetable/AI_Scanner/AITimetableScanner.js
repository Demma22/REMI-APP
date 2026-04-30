// screens/timetable/AITimetableScanner.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  ImageBackground,
  Animated,
  Modal,
  Dimensions,
} from 'react-native';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../../firebase';
import { useTheme } from '../../../contexts/ThemeContext';
import SvgIcon from '../../../components/SvgIcon';
import { pickAndScanTimetableWithUri, takePhotoAndScanWithUri } from '../../../utils/smartTimetableScanner';
import TimePicker from '../components/TimePicker';
import { trackFeatureUsage, shouldShowRateReview } from '../../../utils/rateReviewTracker';
import { getStyles } from './AITimetableScanner.styles';

const { width, height } = Dimensions.get('window');

export default function AITimetableScanner({ navigation, route }) {
  const { mode = 'lectures' } = route?.params || {};
  const { theme } = useTheme();
  const styles = getStyles(theme);
  
  const [scanStage, setScanStage] = useState('idle'); // idle, loading, scanning, confirming
  const [rawText, setRawText] = useState('');
  const [lectures, setLectures] = useState([]);
  const [exams, setExams] = useState([]);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [capturedImageUri, setCapturedImageUri] = useState(null);
  
  // Time picker state
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedLectureIndex, setSelectedLectureIndex] = useState(null);
  const [timeField, setTimeField] = useState(null); // 'start' or 'end'
  const [tempHour, setTempHour] = useState(9);
  const [tempMinute, setTempMinute] = useState("00");
  const [tempPeriod, setTempPeriod] = useState("AM");
  
  // Animation values
  const scanLineY = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  
  // Store the scan result before showing animation
  const pendingScanResult = useRef(null);
  
  const scanningMessages = [
    { text: "Analyzing document layout...", duration: 1500 },
    { text: "Detecting text areas...", duration: 1500 },
    { text: "Reading course names...", duration: 1500 },
    { text: "Extracting time slots...", duration: 1500 },
    { text: "Identifying days...", duration: 1500 },
    { text: "Processing locations...", duration: 1500 },
    { text: "Finalizing timetable...", duration: 1500 },
  ];

  const startScanningAnimations = () => {
    scanLineY.setValue(0);
    pulseAnim.setValue(1);
    progressAnim.setValue(0);
    setCurrentMessageIndex(0);
    
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineY, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineY, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
    
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ])
    ).start();
    
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 10500,
      useNativeDriver: false,
    }).start();
    
    let messageIndex = 0;
    const messageInterval = setInterval(() => {
      messageIndex++;
      if (messageIndex < scanningMessages.length) {
        setCurrentMessageIndex(messageIndex);
      } else {
        clearInterval(messageInterval);
      }
    }, 1500);
    
    return () => clearInterval(messageInterval);
  };

  const openTimePicker = (index, field, currentTime) => {
    setSelectedLectureIndex(index);
    setTimeField(field);
    
    if (currentTime && currentTime !== 'TBD' && currentTime !== '') {
      const match = currentTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (match) {
        let hour = parseInt(match[1]);
        const minute = match[2];
        const period = match[3].toUpperCase();
        
        let displayHour = hour;
        if (period === 'PM' && hour !== 12) displayHour = hour - 12;
        if (period === 'AM' && hour === 12) displayHour = 12;
        if (displayHour === 0) displayHour = 12;
        
        setTempHour(displayHour);
        setTempMinute(minute);
        setTempPeriod(period);
      } else {
        setTempHour(9);
        setTempMinute("00");
        setTempPeriod("AM");
      }
    } else {
      setTempHour(9);
      setTempMinute("00");
      setTempPeriod("AM");
    }
    
    setShowTimePicker(true);
  };

  const handleTimeConfirm = () => {
    if (selectedLectureIndex !== null && timeField) {
      const updated = [...lectures];
      let displayHour = tempHour;
      if (tempPeriod === 'PM' && tempHour !== 12) displayHour = tempHour + 12;
      if (tempPeriod === 'AM' && tempHour === 12) displayHour = 0;
      const formattedTime = `${displayHour}:${tempMinute} ${tempPeriod}`;
      
      updated[selectedLectureIndex][timeField] = formattedTime;
      setLectures(updated);
    }
    setShowTimePicker(false);
    setSelectedLectureIndex(null);
    setTimeField(null);
  };

  const handleScan = async (isCamera = false) => {
    setErrorMessage('');
    setScanStage('loading');
    
    try {
      let result;
      let imageUri;
      
      if (isCamera) {
        const response = await takePhotoAndScanWithUri(mode);
        imageUri = response.uri;
        result = response.scanResult;
      } else {
        const response = await pickAndScanTimetableWithUri(mode);
        imageUri = response.uri;
        result = response.scanResult;
      }
      
      if (!imageUri) {
        setScanStage('idle');
        return;
      }
      
      pendingScanResult.current = result;
      setCapturedImageUri(imageUri);
      setScanStage('scanning');
      startScanningAnimations();
      
      setTimeout(() => {
        if (pendingScanResult.current) {
          if (mode === 'lectures' && pendingScanResult.current.lectures && pendingScanResult.current.lectures.length > 0) {
            setRawText(pendingScanResult.current.rawText);
            setLectures(pendingScanResult.current.lectures);
            setScanStage('confirming');
            pendingScanResult.current = null;
          } else if (mode === 'exams' && pendingScanResult.current.exams && pendingScanResult.current.exams.length > 0) {
            setRawText(pendingScanResult.current.rawText);
            setExams(pendingScanResult.current.exams);
            setScanStage('confirming');
            pendingScanResult.current = null;
          } else {
            setScanStage('idle');
            setCapturedImageUri(null);
            Alert.alert('No Items Found', 'No items could be detected. Please try with a clearer image.');
            pendingScanResult.current = null;
          }
        } else {
          setScanStage('idle');
          setCapturedImageUri(null);
          Alert.alert('No Items Found', 'No items could be detected. Please try with a clearer image.');
        }
      }, 10500);
      
    } catch (error) {
      console.error('Scan error:', error);
      Alert.alert('Scan Failed', error.message || 'Failed to scan. Please try again.');
      setErrorMessage(error.message);
      setScanStage('idle');
      setCapturedImageUri(null);
      pendingScanResult.current = null;
    }
  };

  const confirmAndSaveLectures = () => {
    const validLectures = lectures.filter(l => l.name && l.name.trim() !== '');
    if (validLectures.length === 0) {
      Alert.alert('No Lectures', 'Please enter course names before saving.');
      return;
    }
    
    const invalidTimes = lectures.filter(l => !l.start || l.start === '' || l.start === 'TBD');
    if (invalidTimes.length > 0) {
      Alert.alert(
        'Missing Times',
        `${invalidTimes.length} lecture(s) have missing start times. Please set them before saving.`,
        [{ text: 'OK' }]
      );
      return;
    }
    
    const lectureSummary = lectures.map((l, i) => 
      `${i + 1}. ${l.name} - ${l.day} at ${l.start}`
    ).join('\n');
    
    Alert.alert(
      'Confirm Schedule',
      `You are about to add ${lectures.length} lecture(s):\n\n${lectureSummary}\n\nAre all times correct?`,
      [
        { text: 'Edit', style: 'cancel' },
        { text: 'Confirm', onPress: () => handleSaveLectures() }
      ]
    );
  };

  const handleSaveLectures = async () => {
    if (lectures.length === 0) {
      Alert.alert('No Lectures', 'No lectures to save.');
      return;
    }
    
    setSaving(true);
    try {
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      let timetableData = {};
      if (userDoc.exists() && userDoc.data().timetable) {
        timetableData = userDoc.data().timetable;
      }
      
      const currentSemester = userDoc.data()?.current_semester || 1;
      let savedCount = 0;
      
      for (const lecture of lectures) {
        if (!lecture.name || lecture.name.trim() === '') continue;
        
        const dayKey = lecture.day.toLowerCase();
        if (!timetableData[dayKey]) {
          timetableData[dayKey] = [];
        }
        
        timetableData[dayKey].push({
          name: lecture.name.trim(),
          start: lecture.start || 'TBD',
          end: lecture.end || '',
          lecturer: lecture.lecturer || '',
          room: lecture.room || '',
          semester: currentSemester,
          day: lecture.day,
          id: Date.now() + Math.random() + savedCount,
          createdAt: new Date().toISOString(),
        });
        savedCount++;
      }
      
      if (savedCount === 0) {
        Alert.alert('Error', 'No valid lectures to save.');
        return;
      }
      
      await setDoc(userDocRef, { timetable: timetableData }, { merge: true });
      
      // ========== ADD THIS TRACKING CODE ==========
      await trackFeatureUsage();
      const showRateReview = await shouldShowRateReview();
      if (showRateReview) {
        navigation.navigate('RateReviewModal');
        return;
      }
      // ========== END TRACKING CODE ==========
      
      Alert.alert('Success!', `${savedCount} lecture(s) added.`, [
        { text: 'View Timetable', onPress: () => navigation.navigate('Timetable') },
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save: ' + (error.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveExams = async () => {
    if (exams.length === 0) {
      Alert.alert('No Exams', 'No exams to save.');
      return;
    }
    
    setSaving(true);
    try {
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      let existingExams = [];
      if (userDoc.exists() && userDoc.data().exams) {
        existingExams = userDoc.data().exams;
      }
      
      const currentSemester = userDoc.data()?.current_semester || 1;
      
      const newExams = exams.map(exam => ({
        name: exam.name.trim(),
        date: new Date(exam.date),
        start: exam.start || 'TBD',
        room: exam.room || '',
        semester: currentSemester,
        id: Date.now() + Math.random(),
        createdAt: new Date().toISOString(),
      }));
      
      const allExams = [...existingExams, ...newExams];
      await setDoc(userDocRef, { exams: allExams }, { merge: true });
      
      // ========== ADD THIS TRACKING CODE ==========
      await trackFeatureUsage();
      const showRateReview = await shouldShowRateReview();
      if (showRateReview) {
        navigation.navigate('RateReviewModal');
        return;
      }
      // ========== END TRACKING CODE ==========
      
      Alert.alert('Success!', `${exams.length} exam(s) added.`, [
        { text: 'View Exams', onPress: () => navigation.navigate('ExamTimetable') },
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save: ' + (error.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleEditLecture = (index, field, value) => {
    const updated = [...lectures];
    updated[index][field] = value;
    setLectures(updated);
  };

  const handleEditExam = (index, field, value) => {
    const updated = [...exams];
    updated[index][field] = value;
    setExams(updated);
  };

  const handleRemoveLecture = (index) => {
    Alert.alert('Remove Lecture', 'Remove this lecture?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          const updated = lectures.filter((_, i) => i !== index);
          setLectures(updated);
          if (updated.length === 0) setScanStage('idle');
        },
      },
    ]);
  };

  const handleRemoveExam = (index) => {
    Alert.alert('Remove Exam', 'Remove this exam?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          const updated = exams.filter((_, i) => i !== index);
          setExams(updated);
          if (updated.length === 0) setScanStage('idle');
        },
      },
    ]);
  };

  const handleAddManualLecture = () => {
    setLectures([...lectures, { name: '', day: 'Monday', start: '', end: '', lecturer: '', room: '' }]);
  };

  const handleAddManualExam = () => {
    setExams([...exams, { name: '', date: '', start: '', room: '' }]);
  };

  const handleRetry = () => {
    setScanStage('idle');
    setErrorMessage('');
    setLectures([]);
    setExams([]);
    setRawText('');
    setCapturedImageUri(null);
    pendingScanResult.current = null;
  };

  const formatTimeDisplay = (time) => {
    if (!time || time === '' || time === 'TBD') return 'Set Time';
    return time;
  };

  const scanLineTranslate = scanLineY.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 200],
  });
  
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });
  
  const currentMsg = scanningMessages[currentMessageIndex] || scanningMessages[0];
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // LOADING STATE
  if (scanStage === 'loading') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingTitle}>Wait a moment</Text>
        <Text style={styles.loadingSubtitle}>Processing your selection...</Text>
      </View>
    );
  }

  // SCANNING OVERLAY
  if (scanStage === 'scanning' && capturedImageUri) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <ImageBackground 
          source={{ uri: capturedImageUri }} 
          style={styles.scanImageBackground}
          imageStyle={styles.scanImageStyle}
          resizeMode="contain"
        >
          <View style={[styles.scanDarkOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]} />
          
          <Animated.View 
            style={[
              styles.scanLine,
              { 
                backgroundColor: theme.colors.primary,
                transform: [{ translateY: scanLineTranslate }],
                top: '30%',
              }
            ]} 
          />
          
          <Animated.View 
            style={[
              styles.centerScanner,
              { transform: [{ scale: pulseAnim }] }
            ]}
          >
            <View style={[styles.scannerCircle, { backgroundColor: theme.colors.primary + '40', borderColor: theme.colors.primary }]}>
              <SvgIcon name="scan" size={40} color={theme.colors.primary} />
            </View>
          </Animated.View>
          
          <View style={styles.scanProgressSection}>
            <View style={[styles.scanProgressBarContainer, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Animated.View 
                style={[
                  styles.scanProgressFill, 
                  { 
                    backgroundColor: theme.colors.primary,
                    width: progressWidth
                  }
                ]} 
              />
            </View>
            
            <View style={styles.scanStatusContainer}>
              <Text style={[styles.scanStatusText, { color: '#FFFFFF' }]}>
                {currentMsg.text}
              </Text>
            </View>
            
            <View style={styles.scanWaitContainer}>
              <Text style={styles.scanWaitText}>
                Please wait while AI analyzes your document...
              </Text>
            </View>
          </View>
        </ImageBackground>
      </View>
    );
  }

  // CONFIRMING SCREEN - Lectures Mode
  if (scanStage === 'confirming' && mode === 'lectures') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleRetry} style={styles.backBtn}>
            <SvgIcon name="arrow-back" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Confirm Lectures</Text>
          <TouchableOpacity onPress={handleAddManualLecture} style={styles.addBtn}>
            <SvgIcon name="plus" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.aiSummary}>
            <Text style={styles.aiSummaryText}>AI detected {lectures.length} lecture(s). Review and edit.</Text>
          </View>
          
          {lectures.map((lecture, idx) => (
            <View key={idx} style={styles.lectureCard}>
              <View style={styles.lectureHeader}>
                <Text style={styles.lectureNumber}>#{idx + 1}</Text>
                <TouchableOpacity onPress={() => handleRemoveLecture(idx)}>
                  <SvgIcon name="trash" size={18} color={theme.colors.danger} />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.label}>Course Name *</Text>
              <TextInput 
                style={[styles.input, !lecture.name && styles.inputError]} 
                value={lecture.name} 
                onChangeText={(text) => handleEditLecture(idx, 'name', text)} 
                placeholder="Course name"
                placeholderTextColor={theme.colors.textTertiary}
              />
              
              <Text style={styles.label}>Day</Text>
              <View style={styles.dayPicker}>
                {daysOfWeek.map(day => (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.dayButton,
                      lecture.day === day && styles.dayButtonSelected
                    ]}
                    onPress={() => handleEditLecture(idx, 'day', day)}
                  >
                    <Text style={[
                      styles.dayButtonText,
                      lecture.day === day && styles.dayButtonTextSelected
                    ]}>
                      {day.slice(0, 3)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <Text style={styles.label}>Start Time *</Text>
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => openTimePicker(idx, 'start', lecture.start)}
              >
                <SvgIcon name="clock" size={16} color={theme.colors.primary} />
                <Text style={styles.timeButtonText}>
                  {formatTimeDisplay(lecture.start)}
                </Text>
                <SvgIcon name="chevron-down" size={14} color={theme.colors.textSecondary} />
              </TouchableOpacity>
              
              <Text style={styles.label}>End Time</Text>
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => openTimePicker(idx, 'end', lecture.end)}
              >
                <SvgIcon name="clock" size={16} color={theme.colors.primary} />
                <Text style={styles.timeButtonText}>
                  {formatTimeDisplay(lecture.end)}
                </Text>
                <SvgIcon name="chevron-down" size={14} color={theme.colors.textSecondary} />
              </TouchableOpacity>
              
              <Text style={styles.label}>Room</Text>
              <TextInput 
                style={styles.input} 
                value={lecture.room} 
                onChangeText={(text) => handleEditLecture(idx, 'room', text)} 
                placeholder="Room number"
                placeholderTextColor={theme.colors.textTertiary}
              />
              
              <Text style={styles.label}>Lecturer</Text>
              <TextInput 
                style={styles.input} 
                value={lecture.lecturer} 
                onChangeText={(text) => handleEditLecture(idx, 'lecturer', text)} 
                placeholder="Lecturer name"
                placeholderTextColor={theme.colors.textTertiary}
              />
            </View>
          ))}
          
          <TouchableOpacity style={styles.addButton} onPress={handleAddManualLecture}>
            <SvgIcon name="plus" size={20} color={theme.colors.primary} />
            <Text style={styles.addButtonText}>Add Another Lecture</Text>
          </TouchableOpacity>
          
          <View style={styles.bottomSpacing} />
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
            onPress={confirmAndSaveLectures} 
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Save {lectures.length} Lecture(s)</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.rescanButton} onPress={handleRetry}>
            <Text style={[styles.rescanButtonText, { color: theme.colors.textSecondary }]}>Rescan</Text>
          </TouchableOpacity>
        </View>

        {/* Time Picker Modal */}
        <Modal
          visible={showTimePicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowTimePicker(false)}
        >
          <TimePicker
            hour={tempHour}
            minute={tempMinute}
            period={tempPeriod}
            onHourChange={setTempHour}
            onMinuteChange={setTempMinute}
            onPeriodChange={setTempPeriod}
            onClose={handleTimeConfirm}
            theme={theme}
            styles={styles}
          />
        </Modal>
      </View>
    );
  }

  // CONFIRMING SCREEN - Exams Mode
  if (scanStage === 'confirming' && mode === 'exams') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleRetry} style={styles.backBtn}>
            <SvgIcon name="arrow-back" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Confirm Exams</Text>
          <TouchableOpacity onPress={handleAddManualExam} style={styles.addBtn}>
            <SvgIcon name="plus" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.aiSummary}>
            <Text style={styles.aiSummaryText}>AI detected {exams.length} exam(s). Review and edit.</Text>
          </View>
          
          {exams.map((exam, idx) => (
            <View key={idx} style={styles.lectureCard}>
              <View style={styles.lectureHeader}>
                <Text style={styles.lectureNumber}>#{idx + 1}</Text>
                <TouchableOpacity onPress={() => handleRemoveExam(idx)}>
                  <SvgIcon name="trash" size={18} color={theme.colors.danger} />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.label}>Exam Name *</Text>
              <TextInput 
                style={[styles.input, !exam.name && styles.inputError]} 
                value={exam.name} 
                onChangeText={(text) => handleEditExam(idx, 'name', text)} 
                placeholder="Exam name"
                placeholderTextColor={theme.colors.textTertiary}
              />
              
              <Text style={styles.label}>Date</Text>
              <TextInput 
                style={styles.input} 
                value={exam.date} 
                onChangeText={(text) => handleEditExam(idx, 'date', text)} 
                placeholder="YYYY-MM-DD"
                placeholderTextColor={theme.colors.textTertiary}
              />
              
              <Text style={styles.label}>Time</Text>
              <TextInput 
                style={styles.input} 
                value={exam.start} 
                onChangeText={(text) => handleEditExam(idx, 'start', text)} 
                placeholder="9:00 AM"
                placeholderTextColor={theme.colors.textTertiary}
              />
              
              <Text style={styles.label}>Room</Text>
              <TextInput 
                style={styles.input} 
                value={exam.room} 
                onChangeText={(text) => handleEditExam(idx, 'room', text)} 
                placeholder="Room number"
                placeholderTextColor={theme.colors.textTertiary}
              />
            </View>
          ))}
          
          <TouchableOpacity style={styles.addButton} onPress={handleAddManualExam}>
            <SvgIcon name="plus" size={20} color={theme.colors.primary} />
            <Text style={styles.addButtonText}>Add Another Exam</Text>
          </TouchableOpacity>
          
          <View style={styles.bottomSpacing} />
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
            onPress={handleSaveExams} 
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Save {exams.length} Exam(s)</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.rescanButton} onPress={handleRetry}>
            <Text style={[styles.rescanButtonText, { color: theme.colors.textSecondary }]}>Rescan</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // INITIAL SCREEN
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <SvgIcon name="arrow-back" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI {mode === 'lectures' ? 'Timetable' : 'Exam'} Scanner</Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView style={styles.content}>
        <View style={styles.introCard}>
          <SvgIcon name="scan" size={68} color={theme.colors.primary} />
          <Text style={styles.introTitle}>Smart {mode === 'lectures' ? 'Timetable' : 'Exam'} Scanner</Text>
          <Text style={styles.introText}>Take a photo or upload an image. AI will extract all {mode === 'lectures' ? 'lectures' : 'exams'} automatically.</Text>
        </View>
        {errorMessage !== '' && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}
        <TouchableOpacity style={styles.cameraButton} onPress={() => handleScan(true)}>
          <Text style={styles.buttonText}>Take Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.galleryButton} onPress={() => handleScan(false)}>
          <Text style={styles.buttonText}>Choose from Gallery</Text>
        </TouchableOpacity>
        <View style={styles.tipCard}>
          <Text style={styles.tipText}>Tip: Ensure clear, well-lit image for best results.</Text>
          <Text style={styles.tipText}>Make sure you are connected to the internet for optimal performance.</Text>
        </View>
      </ScrollView>
    </View>
  );
}