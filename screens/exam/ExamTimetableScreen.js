// screens/exam/ExamTimetableScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
} from "react-native";
import { auth, db } from "../../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import NavigationBar from "../../components/NavigationBar";
import SvgIcon from "../../components/SvgIcon";
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../../hooks/useNotifications';
import { getStyles } from "./ExamTimetableScreen.styles";
import { useFocusEffect } from '@react-navigation/native';

export default function ExamTimetableScreen({ navigation }) {
  const { theme } = useTheme();
  const { scheduleExamNotifications, cancelExamNotifications } = useNotifications();
  const styles = getStyles(theme);
  
  const [exams, setExams] = useState([]);
  const [currentSemester, setCurrentSemester] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setCurrentSemester(userData.current_semester || null);
        
        let examsList = userData.exams || [];
        examsList = examsList.sort((a, b) => {
          let dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
          let dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
          return dateA - dateB;
        });
        setExams(examsList);
      }
    } catch (error) {
      console.error("Error loading exams:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleDeleteExam = async (examIndex, exam) => {
    Alert.alert(
      "Delete Exam",
      `Are you sure you want to delete "${exam.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const updatedExams = exams.filter((_, i) => i !== examIndex);
              const userDocRef = doc(db, "users", auth.currentUser.uid);
              await setDoc(userDocRef, { exams: updatedExams }, { merge: true });
              setExams(updatedExams);
              
              // Reschedule notifications
              const updatedUserDoc = await getDoc(userDocRef);
              if (updatedUserDoc.exists()) {
                await scheduleExamNotifications(updatedUserDoc.data());
              }
              
              Alert.alert("Success", "Exam deleted successfully");
            } catch (error) {
              Alert.alert("Error", "Failed to delete exam");
            }
          }
        }
      ]
    );
  };

  const handleEditExam = (exam) => {
    navigation.navigate("AddExam", { exam, isEditing: true });
  };

  const handleAddExam = () => {
    navigation.navigate("AddExam");
  };

  const formatExamDate = (date) => {
    if (!date) return "TBD";
    if (date.toDate) return date.toDate().toLocaleDateString();
    return new Date(date).toLocaleDateString();
  };

  const getUpcomingExams = () => {
    const now = new Date();
    return exams.filter(exam => {
      let examDate;
      if (exam.date?.toDate) examDate = exam.date.toDate();
      else if (exam.date) examDate = new Date(exam.date);
      else return false;
      return examDate >= now;
    });
  };

  const getPastExams = () => {
    const now = new Date();
    return exams.filter(exam => {
      let examDate;
      if (exam.date?.toDate) examDate = exam.date.toDate();
      else if (exam.date) examDate = new Date(exam.date);
      else return false;
      return examDate < now;
    }).sort((a, b) => {
      let dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
      let dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
      return dateB - dateA;
    });
  };

  const upcomingExams = getUpcomingExams();
  const pastExams = getPastExams();
  const hasAnyExam = exams.length > 0;

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <SvgIcon name="arrow-back" size={20} color={theme.colors.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>MY EXAMS</Text>
            <TouchableOpacity style={styles.addBtn} onPress={handleAddExam}>
              <SvgIcon name="plus" size={20} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.content}>
          <View style={styles.emptyCard}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.emptySub}>Loading your exams...</Text>
          </View>
        </View>
        <NavigationBar />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <SvgIcon name="arrow-back" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>MY EXAMS</Text>
          <TouchableOpacity style={styles.addBtn} onPress={handleAddExam}>
            <SvgIcon name="plus" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
        }
      >
        <View style={styles.content}>
          {currentSemester && (
            <View style={[styles.semesterInfo, { backgroundColor: theme.colors.warningLight, borderLeftColor: theme.colors.warning }]}>
              <SvgIcon name="calendar" size={16} color={theme.colors.warning} />
              <Text style={[styles.semesterText, { color: theme.colors.warning }]}>Semester {currentSemester}</Text>
            </View>
          )}

          {!hasAnyExam ? (
            <View style={styles.emptyCard}>
              <View style={[styles.emptyIcon, { backgroundColor: theme.colors.dangerLight }]}>
                <SvgIcon name="book" size={32} color={theme.colors.danger} />
              </View>
              <Text style={styles.emptyTitle}>No exams scheduled</Text>
              <Text style={styles.emptySub}>Add your exams to get reminders and stay prepared.</Text>
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: theme.colors.danger }]}
                onPress={handleAddExam}
              >
                <SvgIcon name="plus" size={18} color="white" />
                <Text style={styles.primaryButtonText}>Add Exam</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {upcomingExams.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Upcoming Exams</Text>
                  {upcomingExams.map((exam, idx) => (
                    <View key={idx} style={[styles.examCard, { borderLeftColor: theme.colors.danger }]}>
                      <View style={styles.examHeader}>
                        <Text style={styles.examName}>{exam.name}</Text>
                        <View style={styles.examActions}>
                          <TouchableOpacity onPress={() => handleEditExam(exam)}>
                            <SvgIcon name="pencil" size={18} color={theme.colors.primary} />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => handleDeleteExam(idx, exam)}>
                            <SvgIcon name="trash" size={18} color={theme.colors.danger} />
                          </TouchableOpacity>
                        </View>
                      </View>
                      <View style={styles.examDetails}>
                        <View style={styles.examInfoRow}>
                          <SvgIcon name="calendar" size={14} color={theme.colors.textSecondary} />
                          <Text style={styles.examInfoText}>{formatExamDate(exam.date)}</Text>
                        </View>
                        <View style={styles.examInfoRow}>
                          <SvgIcon name="clock" size={14} color={theme.colors.textSecondary} />
                          <Text style={styles.examInfoText}>{exam.start || "TBD"}</Text>
                        </View>
                        {exam.room && (
                          <View style={styles.examInfoRow}>
                            <SvgIcon name="location" size={14} color={theme.colors.textSecondary} />
                            <Text style={styles.examInfoText}>Room {exam.room}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              )}
              
              {pastExams.length > 0 && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.textTertiary }]}>Past Exams</Text>
                  {pastExams.map((exam, idx) => (
                    <View key={idx} style={[styles.examCard, styles.pastExamCard, { borderLeftColor: theme.colors.textTertiary }]}>
                      <Text style={styles.examName}>{exam.name}</Text>
                      <View style={styles.examDetails}>
                        <View style={styles.examInfoRow}>
                          <SvgIcon name="calendar" size={14} color={theme.colors.textSecondary} />
                          <Text style={styles.examInfoText}>{formatExamDate(exam.date)}</Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </View>
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {hasAnyExam && (
        <TouchableOpacity style={[styles.floatingBtn, { backgroundColor: theme.colors.danger }]} onPress={handleAddExam}>
          <SvgIcon name="plus" size={20} color="white" />
        </TouchableOpacity>
      )}

      <NavigationBar />
    </View>
  );
}