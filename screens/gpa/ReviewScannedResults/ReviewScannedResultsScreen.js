// screens/gpa/ReviewScannedResults/ReviewScannedResultsScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { getUserData, updateUserData } from '../../../services/userDataService';
import { useTheme } from '../../../contexts/ThemeContext';
import SvgIcon from '../../../components/SvgIcon';
import NavigationBar from '../../../components/NavigationBar';
import ScreenHeader from '../../../components/ScreenHeader';
import { GRADING_SCALES } from '../../../utils/gradingScales';
import { getStyles } from './ReviewScannedResultsScreen.styles';

export default function ReviewScannedResultsScreen({ navigation, route }) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  
  const {
    results,
    gpa,
    totalCredits,
    totalQualityPoints,
    classification,
    semester,
    curriculum
  } = route.params;
  
  const [saving, setSaving] = useState(false);
  const [editedResults, setEditedResults] = useState(results);
  
  const scale = GRADING_SCALES[curriculum] || GRADING_SCALES.uganda;
  
  const recalculateGPA = () => {
    let newTotalCredits = 0;
    let newTotalQualityPoints = 0;
    
    editedResults.forEach(course => {
      const credits = course.credits || 3;
      const gradePoint = course.gradePoint || scale.getGradePoint(course.percentage || course.marks || 0);
      
      newTotalCredits += credits;
      newTotalQualityPoints += credits * gradePoint;
    });
    
    const newGPA = newTotalCredits > 0 ? (newTotalQualityPoints / newTotalCredits).toFixed(2) : 0;
    const newClassification = scale.getClassification(parseFloat(newGPA));
    
    return {
      gpa: parseFloat(newGPA),
      totalCredits: newTotalCredits,
      totalQualityPoints: newTotalQualityPoints,
      classification: newClassification
    };
  };
  
  const handleSave = async () => {
    const recalculated = recalculateGPA();

    setSaving(true);
    try {
      const userData = await getUserData();
      let existingGpaData = userData?.gpaData || {};

      const semesterKey = `semester${semester}`;

      const coursesData = editedResults.map(course => {
        const credits = course.credits || 3;
        const marks = course.percentage || course.marks || 0;
        const gradePoint = course.gradePoint || scale.getGradePoint(marks);
        const gradeLetter = course.gradeLetter || scale.getGradeLetter(marks);
        const qualityPoints = credits * gradePoint;

        return {
          name: course.name || "Unknown Course",
          marks: parseFloat(marks),
          grade: gradeLetter,
          creditUnits: parseFloat(credits),
          gradePoints: parseFloat(gradePoint),
          qualityPoints: parseFloat(qualityPoints),
        };
      });

      existingGpaData[semesterKey] = {
        semester: semesterKey,
        semesterNumber: parseInt(semester),
        gpa: recalculated.gpa,
        totalCreditUnits: recalculated.totalCredits,
        totalQualityPoints: recalculated.totalQualityPoints,
        courses: coursesData,
        scannedAt: new Date().toISOString(),
        scannedVia: "ocr_ai",
      };

      await updateUserData({ gpaData: existingGpaData });

      Alert.alert(
        'Success!',
        `GPA ${recalculated.gpa} saved for Semester ${semester}\n\nClassification: ${recalculated.classification}`,
        [{ text: 'View GPA', onPress: () => navigation.replace('GPA') }]
      );
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save results: ' + error.message);
    } finally {
      setSaving(false);
    }
  };
  
  const recalculated = recalculateGPA();
  
  return (
    <View style={styles.container}>
      <ScreenHeader title="Scan Results" onBackPress={() => navigation.goBack()} />
      
      <ScrollView style={styles.content}>
        {/* GPA Summary Card */}
        <View style={[styles.gpaSummaryCard, { backgroundColor: theme.colors.primary }]}>
          <Text style={styles.gpaSummaryTitle}>CALCULATED GPA</Text>
          <Text style={styles.gpaSummaryValue}>{recalculated.gpa.toFixed(2)}</Text>
          <Text style={styles.gpaSummaryClassification}>{recalculated.classification}</Text>
          <View style={styles.gpaSummaryStats}>
            <View style={styles.gpaStat}>
              <Text style={styles.gpaStatValue}>{editedResults.length}</Text>
              <Text style={styles.gpaStatLabel}>Courses</Text>
            </View>
            <View style={styles.gpaStat}>
              <Text style={styles.gpaStatValue}>{recalculated.totalCredits.toFixed(1)}</Text>
              <Text style={styles.gpaStatLabel}>Credits</Text>
            </View>
            <View style={styles.gpaStat}>
              <Text style={styles.gpaStatValue}>{recalculated.totalQualityPoints.toFixed(2)}</Text>
              <Text style={styles.gpaStatLabel}>Quality Pts</Text>
            </View>
          </View>
        </View>
        
        {/* Semester Info */}
        <View style={styles.semesterInfo}>
          <SvgIcon name="calendar" size={16} color={theme.colors.primary} />
          <Text style={styles.semesterInfoText}>
            Saving to Semester {semester}
          </Text>
        </View>
        
        {/* Grading Scale Info */}
        <View style={styles.scaleInfo}>
          <SvgIcon name="flag" size={16} color={theme.colors.textSecondary} />
          <Text style={styles.scaleInfoText}>
            Using {scale.name} grading system
          </Text>
        </View>
        
        {/* Courses List */}
        <Text style={styles.sectionTitle}>Detected Courses</Text>
        
        {editedResults.map((course, idx) => {
          // Safe value extraction
          const marks = course.percentage || course.marks || 0;
          const credits = course.credits || 3;
          const gradePoint = course.gradePoint || scale.getGradePoint(marks);
          const gradeLetter = course.gradeLetter || scale.getGradeLetter(marks);
          const qualityPoints = credits * gradePoint;
          
          return (
            <View key={idx} style={styles.courseCard}>
              <View style={styles.courseHeader}>
                <Text style={styles.courseName}>{course.name}</Text>
                <View style={styles.courseBadge}>
                  <Text style={styles.courseBadgeText}>{gradeLetter}</Text>
                </View>
              </View>
              
              <View style={styles.courseDetails}>
                <View style={styles.courseDetail}>
                  <Text style={styles.courseDetailLabel}>Total Marks</Text>
                  <Text style={styles.courseDetailValue}>
                    {course.totalMarks || marks} / {course.maxMarks || 100}
                  </Text>
                </View>
                <View style={styles.courseDetail}>
                  <Text style={styles.courseDetailLabel}>Percentage</Text>
                  <Text style={styles.courseDetailValue}>{marks.toFixed(1)}%</Text>
                </View>
                <View style={styles.courseDetail}>
                  <Text style={styles.courseDetailLabel}>Grade Points</Text>
                  <Text style={styles.courseDetailValue}>{gradePoint.toFixed(1)}</Text>
                </View>
                <View style={styles.courseDetail}>
                  <Text style={styles.courseDetailLabel}>Credits</Text>
                  <Text style={styles.courseDetailValue}>{credits}</Text>
                </View>
                {course.iaMarks && (
                  <View style={styles.courseDetail}>
                    <Text style={styles.courseDetailLabel}>IA Marks</Text>
                    <Text style={styles.courseDetailValue}>{course.iaMarks}</Text>
                  </View>
                )}
                {course.ueMarks && (
                  <View style={styles.courseDetail}>
                    <Text style={styles.courseDetailLabel}>UE Marks</Text>
                    <Text style={styles.courseDetailValue}>{course.ueMarks}</Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}
        
        {/* Save Button */}
        <TouchableOpacity 
          style={[styles.saveButton, { backgroundColor: theme.colors.secondary }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <SvgIcon name="save" size={20} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>
                Save to Semester {semester}
              </Text>
            </>
          )}
        </TouchableOpacity>
        
        <View style={styles.bottomSpacing} />
      </ScrollView>
      
      <NavigationBar />
    </View>
  );
}