// screens/timetable/AITimetableScanner.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../../firebase';
import { useTheme } from '../../../contexts/ThemeContext';
import SvgIcon from '../../../components/SvgIcon';
import { pickAndScanTimetable, takePhotoAndScan } from '../../../utils/smartTimetableScanner';
import { getStyles } from './AITimetableScanner.styles';

export default function AITimetableScanner({ navigation, route }) {
  const { mode = 'lectures' } = route?.params || {};
  const { theme } = useTheme();
  const styles = getStyles(theme);
  
  const [loading, setLoading] = useState(false);
  const [scanStage, setScanStage] = useState('idle');
  const [rawText, setRawText] = useState('');
  const [lectures, setLectures] = useState([]);
  const [exams, setExams] = useState([]);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleScan = async (isCamera = false) => {
    setLoading(true);
    setScanStage('scanning');
    setErrorMessage('');
    
    try {
      let result;
      if (isCamera) {
        result = await takePhotoAndScan(mode);
      } else {
        result = await pickAndScanTimetable(mode);
      }
      
      if (result) {
        if (mode === 'lectures' && result.lectures && result.lectures.length > 0) {
          setRawText(result.rawText);
          setLectures(result.lectures);
          setScanStage('confirming');
          Alert.alert('Success!', `Found ${result.lectures.length} lectures.`, [{ text: 'Review & Save' }]);
        } else if (mode === 'exams' && result.exams && result.exams.length > 0) {
          setRawText(result.rawText);
          setExams(result.exams);
          setScanStage('confirming');
          Alert.alert('Success!', `Found ${result.exams.length} exams.`, [{ text: 'Review & Save' }]);
        } else {
          setScanStage('idle');
          Alert.alert('No Items Found', 'No items could be detected. Please try with a clearer image.');
        }
      } else {
        setScanStage('idle');
      }
    } catch (error) {
      console.error('Scan error:', error);
      Alert.alert('Scan Failed', error.message || 'Failed to scan. Please try again.');
      setErrorMessage(error.message);
      setScanStage('idle');
    } finally {
      setLoading(false);
    }
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
  };

  if (scanStage === 'scanning' || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingTitle}>AI is analyzing your {mode}...</Text>
        <Text style={styles.loadingSubtitle}>Reading text from image...</Text>
      </View>
    );
  }

  if (scanStage === 'confirming') {
    if (mode === 'lectures') {
      return (
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleRetry} style={styles.backBtn}>
              <SvgIcon name="arrow-back" size={24} color={theme.colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Confirm Lectures</Text>
            <View style={styles.headerSpacer} />
          </View>
          <ScrollView style={styles.content}>
            <View style={styles.aiSummary}>
              <SvgIcon name="scan" size={24} color={theme.colors.primary} />
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
                <TextInput style={[styles.input, !lecture.name && styles.inputError]} value={lecture.name} onChangeText={(text) => handleEditLecture(idx, 'name', text)} placeholder="Course name" />
                <Text style={styles.label}>Day</Text>
                <View style={styles.dayPicker}>
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                    <TouchableOpacity key={day} style={[styles.dayButton, lecture.day === day && styles.dayButtonSelected]} onPress={() => handleEditLecture(idx, 'day', day)}>
                      <Text style={[styles.dayButtonText, lecture.day === day && styles.dayButtonTextSelected]}>{day.slice(0, 3)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.timeRow}>
                  <View style={styles.timeField}><Text style={styles.label}>Start Time</Text><TextInput style={styles.input} value={lecture.start} onChangeText={(text) => handleEditLecture(idx, 'start', text)} placeholder="9:00 AM" /></View>
                  <View style={styles.timeField}><Text style={styles.label}>End Time</Text><TextInput style={styles.input} value={lecture.end} onChangeText={(text) => handleEditLecture(idx, 'end', text)} placeholder="10:30 AM" /></View>
                </View>
                <Text style={styles.label}>Room</Text><TextInput style={styles.input} value={lecture.room} onChangeText={(text) => handleEditLecture(idx, 'room', text)} placeholder="Room number" />
                <Text style={styles.label}>Lecturer</Text><TextInput style={styles.input} value={lecture.lecturer} onChangeText={(text) => handleEditLecture(idx, 'lecturer', text)} placeholder="Lecturer name" />
              </View>
            ))}
            <TouchableOpacity style={styles.addButton} onPress={handleAddManualLecture}><SvgIcon name="plus" size={20} color={theme.colors.primary} /><Text style={styles.addButtonText}>Add Another Lecture</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.saveButton, saving && styles.saveButtonDisabled]} onPress={handleSaveLectures} disabled={saving}>
              {saving ? <ActivityIndicator color="#FFFFFF" /> : <><SvgIcon name="save" size={20} color="#FFFFFF" /><Text style={styles.saveButtonText}>Save {lectures.length} Lecture(s)</Text></>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.rescanButton} onPress={handleRetry}><Text style={[styles.rescanButtonText, { color: theme.colors.textSecondary }]}>← Rescan</Text></TouchableOpacity>
          </ScrollView>
        </View>
      );
    } else {
      return (
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleRetry} style={styles.backBtn}>
              <SvgIcon name="arrow-back" size={24} color={theme.colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Confirm Exams</Text>
            <View style={styles.headerSpacer} />
          </View>
          <ScrollView style={styles.content}>
            <View style={styles.aiSummary}>
              <SvgIcon name="robot" size={24} color={theme.colors.primary} />
              <Text style={styles.aiSummaryText}>AI detected {exams.length} exam(s). Review and edit.</Text>
            </View>
            {exams.map((exam, idx) => (
              <View key={idx} style={styles.lectureCard}>
                <View style={styles.lectureHeader}>
                  <Text style={styles.lectureNumber}>#{idx + 1}</Text>
                  <TouchableOpacity onPress={() => handleRemoveExam(idx)}><SvgIcon name="trash" size={18} color={theme.colors.danger} /></TouchableOpacity>
                </View>
                <Text style={styles.label}>Exam Name *</Text><TextInput style={[styles.input, !exam.name && styles.inputError]} value={exam.name} onChangeText={(text) => handleEditExam(idx, 'name', text)} placeholder="Exam name" />
                <Text style={styles.label}>Date</Text><TextInput style={styles.input} value={exam.date} onChangeText={(text) => handleEditExam(idx, 'date', text)} placeholder="YYYY-MM-DD or Apr 15, 2025" />
                <Text style={styles.label}>Time</Text><TextInput style={styles.input} value={exam.start} onChangeText={(text) => handleEditExam(idx, 'start', text)} placeholder="9:00 AM" />
                <Text style={styles.label}>Room</Text><TextInput style={styles.input} value={exam.room} onChangeText={(text) => handleEditExam(idx, 'room', text)} placeholder="Room number" />
              </View>
            ))}
            <TouchableOpacity style={styles.addButton} onPress={handleAddManualExam}><SvgIcon name="plus" size={20} color={theme.colors.primary} /><Text style={styles.addButtonText}>Add Another Exam</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.saveButton, saving && styles.saveButtonDisabled]} onPress={handleSaveExams} disabled={saving}>
              {saving ? <ActivityIndicator color="#FFFFFF" /> : <><SvgIcon name="save" size={20} color="#FFFFFF" /><Text style={styles.saveButtonText}>Save {exams.length} Exam(s)</Text></>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.rescanButton} onPress={handleRetry}><Text style={[styles.rescanButtonText, { color: theme.colors.textSecondary }]}>← Rescan</Text></TouchableOpacity>
          </ScrollView>
        </View>
      );
    }
  }

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
        {errorMessage !== '' && (<View style={styles.errorCard}><SvgIcon name="alert-circle" size={20} color="#EF4444" /><Text style={styles.errorText}>{errorMessage}</Text></View>)}
        <TouchableOpacity style={styles.cameraButton} onPress={() => handleScan(true)}><Text style={styles.buttonText}>Take Photo</Text></TouchableOpacity>
        <TouchableOpacity style={styles.galleryButton} onPress={() => handleScan(false)}><Text style={styles.buttonText}>Choose from Gallery</Text></TouchableOpacity>
        <View style={styles.tipCard}><SvgIcon name="info" size={16} color={theme.colors.textSecondary} /><Text style={styles.tipText}>Tip: Ensure clear, well-lit image for best results.</Text></View>
      </ScrollView>
    </View>
  );
}