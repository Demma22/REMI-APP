import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Alert,
  Modal
} from "react-native";
import { auth, db } from "../../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import NavigationBar from "../../components/NavigationBar";
import SvgIcon from "../../components/SvgIcon";
import { useTheme } from '../../contexts/ThemeContext';

export default function GPACalculationScreen({ route, navigation }) {
  const { theme } = useTheme();
  
  if (!auth.currentUser) {
    return <Text style={[styles.center, { color: theme.colors.textPrimary }]}>Not logged in</Text>;
  }

  const { semesterKey: initialSemesterKey } = route.params || {};
  const [userData, setUserData] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState(initialSemesterKey);
  const [showSemesterPicker, setShowSemesterPicker] = useState(false);
  const [marks, setMarks] = useState({});
  const [creditUnits, setCreditUnits] = useState({});
  const [calculatedGPA, setCalculatedGPA] = useState(null);
  const [loading, setLoading] = useState(true);

  // ISBAT University Grading System (NCHE Uganda)
  const getGradePoint = (marks) => {
    const numericMarks = parseFloat(marks);
    if (isNaN(numericMarks)) return 0;
    
    if (numericMarks >= 80) return 5.0;
    if (numericMarks >= 75) return 4.5;
    if (numericMarks >= 70) return 4.0;
    if (numericMarks >= 65) return 3.5;
    if (numericMarks >= 60) return 3.0;
    if (numericMarks >= 55) return 2.5;
    if (numericMarks >= 50) return 2.0;
    return 0.0;
  };

  const getGradeLetter = (marks) => {
    const numericMarks = parseFloat(marks);
    if (isNaN(numericMarks)) return "F";
    
    if (numericMarks >= 80) return "A";
    if (numericMarks >= 75) return "A-";
    if (numericMarks >= 70) return "B+";
    if (numericMarks >= 65) return "B";
    if (numericMarks >= 60) return "B-";
    if (numericMarks >= 55) return "C+";
    if (numericMarks >= 50) return "C";
    return "F";
  };

  useEffect(() => { 
    loadUserData(); 
  }, []);

  useEffect(() => {
    if (userData && initialSemesterKey) {
      initializeForm(initialSemesterKey);
    }
  }, [userData, initialSemesterKey]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserData(data);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load user data");
    } finally {
      setLoading(false);
    }
  };

  const initializeForm = (semesterKey) => {
    if (!userData || !semesterKey) return;
    
    const semesterNumber = semesterKey.replace('semester', '');
    const courses = userData.units?.[semesterNumber] || [];
    
    const initialMarks = {};
    const initialCredits = {};
    
    courses.forEach(course => {
      initialMarks[course] = "";
      initialCredits[course] = "";
    });
    
    setMarks(initialMarks);
    setCreditUnits(initialCredits);
    setCalculatedGPA(null);
  };

  const handleMarksChange = (courseName, value) => {
    const cleanedValue = value.replace(/[^0-9.]/g, '');
    setMarks(prev => ({ ...prev, [courseName]: cleanedValue }));
    setCalculatedGPA(null);
  };

  const handleCreditChange = (courseName, value) => {
    const cleanedValue = value.replace(/[^0-9.]/g, '');
    setCreditUnits(prev => ({ ...prev, [courseName]: cleanedValue }));
    setCalculatedGPA(null);
  };

  const calculateGPA = async () => {
    if (!selectedSemester) {
      Alert.alert("Select Semester", "Please select a semester first.");
      return;
    }

    let totalCreditUnits = 0;
    let totalQualityPoints = 0;
    let validEntries = 0;

    const semesterNumber = selectedSemester.replace('semester', '');
    const courses = userData?.units?.[semesterNumber] || [];

    courses.forEach(course => {
      const courseMarks = parseFloat(marks[course] || "0");
      const creditUnitsValue = parseFloat(creditUnits[course] || "0");

      if (courseMarks >= 0 && courseMarks <= 100 && creditUnitsValue > 0) {
        const gradePoint = getGradePoint(courseMarks);
        totalCreditUnits += creditUnitsValue;
        totalQualityPoints += creditUnitsValue * gradePoint;
        validEntries++;
      }
    });

    if (validEntries === 0) {
      Alert.alert("No Valid Entries", "Please enter at least one valid marks (0-100) and credit units.");
      return;
    }

    const gpa = totalQualityPoints / totalCreditUnits;
    const formattedGPA = isNaN(gpa) ? "0.00" : gpa.toFixed(2);
    setCalculatedGPA(formattedGPA);

    try {
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      const semesterNumber = selectedSemester.replace('semester', '');
      
      const gpaData = {
        semester: selectedSemester,
        semesterNumber: parseInt(semesterNumber),
        gpa: parseFloat(formattedGPA),
        courses: courses.map(course => {
          const courseMarks = parseFloat(marks[course] || "0");
          const creditUnitsValue = parseFloat(creditUnits[course] || "0");
          const gradePoint = getGradePoint(courseMarks);
          const gradeLetter = getGradeLetter(courseMarks);
          
          return {
            name: course,
            marks: courseMarks,
            grade: gradeLetter,
            creditUnits: creditUnitsValue,
            gradePoints: gradePoint,
            qualityPoints: creditUnitsValue * gradePoint
          };
        }).filter(course => course.marks > 0 && course.creditUnits > 0),
        totalCreditUnits: totalCreditUnits,
        totalQualityPoints: totalQualityPoints,
        calculatedAt: new Date().toISOString()
      };

      await setDoc(userDocRef, {
        gpa_data: {
          ...(userData?.gpa_data || {}),
          [selectedSemester]: gpaData
        }
      }, { merge: true });

      Alert.alert(
        "Success", 
        `GPA for ${selectedSemester}: ${formattedGPA}\n\n` +
        `Based on ${validEntries} course${validEntries !== 1 ? 's' : ''}\n` +
        `Total Credits: ${totalCreditUnits}\n` +
        `Saved to your profile!`
      );
    } catch (error) {
      Alert.alert("Error", "Could not save GPA to your profile");
    }
  };

  const getCurrentCourses = () => {
    if (!selectedSemester || !userData) return [];
    const semesterNumber = selectedSemester.replace('semester', '');
    return userData.units?.[semesterNumber] || [];
  };

  const getAvailableSemesters = () => {
    if (!userData?.units) return [];
    return Object.keys(userData.units).map(sem => `semester${sem}`);
  };

  const courses = getCurrentCourses();
  const availableSemesters = getAvailableSemesters();

  const styles = getStyles(theme);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity 
              style={styles.backBtn} 
              onPress={() => navigation.goBack()}
            >
              <SvgIcon name="arrow-back" size={20} color={theme.colors.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>CALCULATE GPA</Text>
            <View style={styles.headerSpacer} />
          </View>
        </View>
        <View style={styles.content}>
          <Text style={styles.loadingText}>Loading your data...</Text>
        </View>
        <NavigationBar />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.backBtn} 
            onPress={() => navigation.goBack()}
          >
            <SvgIcon name="arrow-back" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>CALCULATE GPA</Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Semester Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Select Semester</Text>
          <TouchableOpacity 
            style={styles.dropdown}
            onPress={() => setShowSemesterPicker(true)}
          >
            <Text style={styles.dropdownText}>
              {selectedSemester ? selectedSemester.toUpperCase() : "Choose Semester"}
            </Text>
            <SvgIcon name="chevron-down" size={14} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {selectedSemester && courses.length > 0 ? (
          <>
            {/* GPA Result */}
            {calculatedGPA && (
              <View style={styles.resultCard}>
                <Text style={styles.resultTitle}>CALCULATED GPA</Text>
                <Text style={styles.resultGPA}>{calculatedGPA}</Text>
                <Text style={styles.resultSubtitle}>
                  Based on {courses.length} courses in {selectedSemester}
                </Text>
              </View>
            )}

            {/* Courses Form */}
            <View style={styles.coursesSection}>
              <Text style={styles.sectionTitle}>Enter Marks & Credit Units</Text>
              
              {courses.map((course, index) => (
                <View key={index} style={styles.courseCard}>
                  <Text style={styles.courseName}>{course}</Text>
                  
                  <View style={styles.inputRow}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Marks (0-100)</Text>
                      <TextInput
                        style={styles.marksInput}
                        placeholder="75, 80, 65..."
                        keyboardType="numeric"
                        value={marks[course] || ""}
                        onChangeText={(v) => handleMarksChange(course, v)}
                        placeholderTextColor={theme.colors.textPlaceholder}
                        maxLength={5}
                      />
                      {marks[course] && (
                        <Text style={styles.gradeIndicator}>
                          Grade: {getGradeLetter(marks[course])} ({getGradePoint(marks[course]).toFixed(1)} pts)
                        </Text>
                      )}
                    </View>
                    
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Credit Units</Text>
                      <TextInput
                        style={styles.creditInput}
                        placeholder="3"
                        keyboardType="numeric"
                        value={creditUnits[course] || ""}
                        onChangeText={(v) => handleCreditChange(course, v)}
                        placeholderTextColor={theme.colors.textPlaceholder}
                        maxLength={3}
                      />
                    </View>
                  </View>
                </View>
              ))}
            </View>

            {/* Calculate Button */}
            <TouchableOpacity 
              style={styles.calculateButton}
              onPress={calculateGPA}
            >
              <Text style={styles.calculateButtonText}>
                {calculatedGPA ? "RECALCULATE GPA" : "CALCULATE GPA"}
              </Text>
            </TouchableOpacity>
          </>
        ) : selectedSemester ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconContainer, { backgroundColor: theme.colors.primaryLight }]}>
              <SvgIcon name="book" size={32} color={theme.colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No Courses Found</Text>
            <Text style={styles.emptySubtitle}>
              No courses found for {selectedSemester}. Please check your academic profile.
            </Text>
          </View>
        ) : (
          <View style={styles.instructionState}>
            <View style={[styles.instructionIconContainer, { backgroundColor: theme.colors.primaryLight }]}>
              <SvgIcon name="target" size={32} color={theme.colors.primary} />
            </View>
            <Text style={styles.instructionTitle}>Select a Semester</Text>
            <Text style={styles.instructionSubtitle}>
              Choose a semester from the dropdown above to start calculating your GPA
            </Text>
          </View>
        )}

        {/* Grade Guide */}
        <View style={styles.guideCard}>
          <Text style={styles.guideTitle}>Grading System</Text>
          <View style={styles.gradeGrid}>
            <View style={[styles.gradeItem, { backgroundColor: theme.colors.backgroundTertiary }]}>
              <Text style={styles.gradeText}>80-100</Text>
              <Text style={styles.pointsText}>5.0 pts</Text>
              <Text style={[styles.gradeLetter, { color: theme.colors.success }]}>A</Text>
            </View>
            <View style={[styles.gradeItem, { backgroundColor: theme.colors.backgroundTertiary }]}>
              <Text style={styles.gradeText}>75-79</Text>
              <Text style={styles.pointsText}>4.5 pts</Text>
              <Text style={[styles.gradeLetter, { color: theme.colors.success }]}>A-</Text>
            </View>
            <View style={[styles.gradeItem, { backgroundColor: theme.colors.backgroundTertiary }]}>
              <Text style={styles.gradeText}>70-74</Text>
              <Text style={styles.pointsText}>4.0 pts</Text>
              <Text style={[styles.gradeLetter, { color: theme.colors.warning }]}>B+</Text>
            </View>
            <View style={[styles.gradeItem, { backgroundColor: theme.colors.backgroundTertiary }]}>
              <Text style={styles.gradeText}>65-69</Text>
              <Text style={styles.pointsText}>3.5 pts</Text>
              <Text style={[styles.gradeLetter, { color: theme.colors.warning }]}>B</Text>
            </View>
            <View style={[styles.gradeItem, { backgroundColor: theme.colors.backgroundTertiary }]}>
              <Text style={styles.gradeText}>60-64</Text>
              <Text style={styles.pointsText}>3.0 pts</Text>
              <Text style={[styles.gradeLetter, { color: theme.colors.warning }]}>B-</Text>
            </View>
            <View style={[styles.gradeItem, { backgroundColor: theme.colors.backgroundTertiary }]}>
              <Text style={styles.gradeText}>55-59</Text>
              <Text style={styles.pointsText}>2.5 pts</Text>
              <Text style={[styles.gradeLetter, { color: '#FF9800' }]}>C+</Text>
            </View>
            <View style={[styles.gradeItem, { backgroundColor: theme.colors.backgroundTertiary }]}>
              <Text style={styles.gradeText}>50-54</Text>
              <Text style={styles.pointsText}>2.0 pts</Text>
              <Text style={[styles.gradeLetter, { color: '#FF9800' }]}>C</Text>
            </View>
            <View style={[styles.gradeItem, { backgroundColor: theme.colors.backgroundTertiary }]}>
              <Text style={styles.gradeText}>0-49</Text>
              <Text style={styles.pointsText}>0.0 pts</Text>
              <Text style={[styles.gradeLetter, { color: theme.colors.error }]}>F</Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Semester Picker Modal */}
      <Modal
        visible={showSemesterPicker}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
            <Text style={styles.modalTitle}>Select Semester</Text>
            <ScrollView style={styles.modalList}>
              {availableSemesters.map((semesterKey) => {
                const semesterNumber = semesterKey.replace('semester', '');
                const coursesCount = userData?.units?.[semesterNumber]?.length || 0;
                
                return (
                  <TouchableOpacity
                    key={semesterKey}
                    style={[
                      styles.modalItem,
                      selectedSemester === semesterKey && styles.modalItemSelected
                    ]}
                    onPress={() => {
                      setSelectedSemester(semesterKey);
                      setShowSemesterPicker(false);
                      initializeForm(semesterKey);
                    }}
                  >
                    <Text style={[
                      styles.modalItemText,
                      selectedSemester === semesterKey && styles.modalItemTextSelected
                    ]}>
                      {semesterKey.toUpperCase()}
                    </Text>
                    <Text style={styles.modalItemSubtext}>
                      {coursesCount} course{coursesCount !== 1 ? 's' : ''} available
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity
              style={[styles.modalClose, { backgroundColor: theme.colors.backgroundTertiary }]}
              onPress={() => setShowSemesterPicker(false)}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <NavigationBar />
    </View>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  center: {
    textAlign: "center",
    marginTop: 40,
  },
  loadingText: {
    textAlign: "center",
    color: theme.colors.textSecondary,
    fontSize: 16,
    marginTop: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    backgroundColor: theme.colors.backgroundSecondary,
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: theme.colors.textPrimary,
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },
  section: {
    padding: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.colors.card,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  dropdownText: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    fontWeight: "600",
  },
  resultCard: {
    backgroundColor: theme.colors.success,
    margin: 24,
    padding: 24,
    borderRadius: 24,
    alignItems: "center",
    shadowColor: theme.colors.success,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  resultTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    opacity: 0.9,
  },
  resultGPA: {
    color: "#FFFFFF",
    fontSize: 48,
    fontWeight: "900",
    marginBottom: 8,
  },
  resultSubtitle: {
    color: "#FFFFFF",
    fontSize: 12,
    opacity: 0.8,
  },
  coursesSection: {
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    marginBottom: 20,
  },
  courseCard: {
    backgroundColor: theme.colors.card,
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  courseName: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: "row",
    gap: 12,
  },
  inputGroup: {
    flex: 1,
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.textPrimary,
  },
  marksInput: {
    backgroundColor: theme.colors.backgroundTertiary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  creditInput: {
    backgroundColor: theme.colors.backgroundTertiary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    color: theme.colors.textPrimary,
    textAlign: "center",
  },
  gradeIndicator: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: "500",
    marginTop: 4,
  },
  calculateButton: {
    backgroundColor: theme.colors.primary,
    margin: 24,
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  calculateButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  emptyState: {
    backgroundColor: theme.colors.card,
    margin: 24,
    padding: 40,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  instructionState: {
    backgroundColor: theme.colors.card,
    margin: 24,
    padding: 40,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  emptyIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  instructionIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    marginBottom: 8,
    textAlign: "center",
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  instructionSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  guideCard: {
    backgroundColor: theme.colors.card,
    margin: 24,
    padding: 20,
    borderRadius: 20,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  guideTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    marginBottom: 16,
    textAlign: "center",
  },
  gradeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  gradeItem: {
    width: "30%",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  gradeText: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.textPrimary,
    marginBottom: 4,
    textAlign: "center",
  },
  pointsText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: "500",
    marginBottom: 2,
  },
  gradeLetter: {
    fontSize: 14,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "60%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    marginBottom: 16,
    textAlign: "center",
  },
  modalList: {
    maxHeight: 300,
  },
  modalItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  modalItemSelected: {
    backgroundColor: theme.colors.primary + '20',
  },
  modalItemText: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    fontWeight: "500",
  },
  modalItemTextSelected: {
    color: theme.colors.primary,
    fontWeight: "700",
  },
  modalItemSubtext: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  modalClose: {
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 16,
  },
  modalCloseText: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: "600",
  },
  bottomSpacing: {
    height: 20,
  },
});