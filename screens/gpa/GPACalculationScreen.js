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

export default function GPACalculationScreen({ route, navigation }) {
  if (!auth.currentUser) {
    return <Text style={styles.center}>Not logged in</Text>;
  }

  const { semesterKey: initialSemesterKey } = route.params || {};
  const [userData, setUserData] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState(initialSemesterKey);
  const [showSemesterPicker, setShowSemesterPicker] = useState(false);
  const [grades, setGrades] = useState({});
  const [creditUnits, setCreditUnits] = useState({});
  const [calculatedGPA, setCalculatedGPA] = useState(null);
  const [loading, setLoading] = useState(true);

  const GRADE_POINTS = { 
    A: 5.0, "A-": 4.7, "B+": 4.3, B: 4.0, "B-": 3.7, 
    "C+": 3.3, C: 3.0, "C-": 2.7, D: 2.0, F: 0.0 
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
        
        // Load existing GPA data if available
        if (data.gpa_data) {
          // You could pre-populate grades/credits if previously saved
          console.log("Existing GPA data:", data.gpa_data);
        }
      }
    } catch (error) {
      console.log("Load error:", error);
      Alert.alert("Error", "Failed to load user data");
    } finally {
      setLoading(false);
    }
  };

  const initializeForm = (semesterKey) => {
    if (!userData || !semesterKey) return;
    
    const semesterNumber = semesterKey.replace('semester', '');
    const courses = userData.units?.[semesterNumber] || [];
    
    const initialGrades = {};
    const initialCredits = {};
    
    courses.forEach(course => {
      initialGrades[course] = "";
      initialCredits[course] = "";
    });
    
    setGrades(initialGrades);
    setCreditUnits(initialCredits);
    setCalculatedGPA(null);
  };

  const handleGradeChange = (courseName, value) => {
    setGrades(prev => ({ ...prev, [courseName]: value }));
    setCalculatedGPA(null);
  };

  const handleCreditChange = (courseName, value) => {
    setCreditUnits(prev => ({ ...prev, [courseName]: value }));
    setCalculatedGPA(null);
  };

  const calculateGPA = async () => {
    if (!selectedSemester) {
      Alert.alert("Select Semester", "Please select a semester first.");
      return;
    }

    let totalUnits = 0;
    let totalPoints = 0;
    let validEntries = 0;

    const semesterNumber = selectedSemester.replace('semester', '');
    const courses = userData?.units?.[semesterNumber] || [];

    courses.forEach(course => {
      const grade = (grades[course] || "").toUpperCase().trim();
      const credit = parseFloat(creditUnits[course] || "0");

      if (GRADE_POINTS[grade] !== undefined && credit > 0) {
        totalUnits += credit;
        totalPoints += credit * GRADE_POINTS[grade];
        validEntries++;
      }
    });

    if (validEntries === 0) {
      Alert.alert("No Valid Entries", "Please enter at least one valid grade and credit unit.");
      return;
    }

    const result = totalPoints / totalUnits;
    const formattedGPA = isNaN(result) ? "0.00" : result.toFixed(2);
    setCalculatedGPA(formattedGPA);

    // Save to Firebase Firestore
    try {
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      const semesterNumber = selectedSemester.replace('semester', '');
      
      // Prepare GPA data to save
      const gpaData = {
        semester: selectedSemester,
        semesterNumber: parseInt(semesterNumber),
        gpa: parseFloat(formattedGPA),
        courses: courses.map(course => ({
          name: course,
          grade: grades[course] || "",
          creditUnits: parseFloat(creditUnits[course] || "0"),
          points: GRADE_POINTS[(grades[course] || "").toUpperCase().trim()] || 0
        })).filter(course => course.grade && course.creditUnits > 0),
        totalCreditUnits: totalUnits,
        calculatedAt: new Date().toISOString()
      };

      // Save to Firestore using merge to preserve other data
      await setDoc(userDocRef, {
        gpa_data: {
          ...(userData?.gpa_data || {}),
          [selectedSemester]: gpaData
        }
      }, { merge: true });

      Alert.alert("Success", `GPA for ${selectedSemester}: ${formattedGPA}\n\nSaved to your profile!`);
    } catch (error) {
      console.log("Save error:", error);
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

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity 
              style={styles.backBtn} 
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backText}>‹</Text>
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
            <Text style={styles.backText}>‹</Text>
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
            <Text style={styles.dropdownIcon}>▼</Text>
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
              <Text style={styles.sectionTitle}>Enter Grades & Credit Units</Text>
              
              {courses.map((course, index) => (
                <View key={index} style={styles.courseCard}>
                  <Text style={styles.courseName}>{course}</Text>
                  
                  <View style={styles.inputRow}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Grade</Text>
                      <TextInput
                        style={styles.gradeInput}
                        placeholder="A, B+, B..."
                        value={grades[course] || ""}
                        onChangeText={(v) => handleGradeChange(course, v)}
                        placeholderTextColor="#94A3B8"
                      />
                    </View>
                    
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Credit Units</Text>
                      <TextInput
                        style={styles.creditInput}
                        placeholder="3"
                        keyboardType="numeric"
                        value={creditUnits[course] || ""}
                        onChangeText={(v) => handleCreditChange(course, v)}
                        placeholderTextColor="#94A3B8"
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
                {calculatedGPA ? "🔄 RECALCULATE GPA" : "📊 CALCULATE GPA"}
              </Text>
            </TouchableOpacity>
          </>
        ) : selectedSemester ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📚</Text>
            <Text style={styles.emptyTitle}>No Courses Found</Text>
            <Text style={styles.emptySubtitle}>
              No courses found for {selectedSemester}. Please check your academic profile.
            </Text>
          </View>
        ) : (
          <View style={styles.instructionState}>
            <Text style={styles.instructionIcon}>🎯</Text>
            <Text style={styles.instructionTitle}>Select a Semester</Text>
            <Text style={styles.instructionSubtitle}>
              Choose a semester from the dropdown above to start calculating your GPA
            </Text>
          </View>
        )}

        {/* Grade Guide */}
        <View style={styles.guideCard}>
          <Text style={styles.guideTitle}>Grade Points Reference</Text>
          <View style={styles.gradeGrid}>
            {Object.entries(GRADE_POINTS).map(([grade, points]) => (
              <View key={grade} style={styles.gradeItem}>
                <Text style={styles.gradeText}>{grade}</Text>
                <Text style={styles.pointsText}>{points.toFixed(1)} pts</Text>
              </View>
            ))}
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
          <View style={styles.modalContent}>
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
              style={styles.modalClose}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  center: {
    textAlign: "center",
    marginTop: 40,
    color: "#383940",
  },
  loadingText: {
    textAlign: "center",
    color: "#64748B",
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
    backgroundColor: "#FFFFFF",
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
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
    backgroundColor: "#FAFAFA",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  backText: { 
    fontSize: 24, 
    color: "#535FFD", 
    fontWeight: "300",
    lineHeight: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#383940",
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
    color: "#383940",
    marginBottom: 8,
  },
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  dropdownText: {
    fontSize: 16,
    color: "#383940",
    fontWeight: "600",
  },
  dropdownIcon: {
    fontSize: 12,
    color: "#64748B",
  },
  resultCard: {
    backgroundColor: "#10B981",
    margin: 24,
    padding: 24,
    borderRadius: 24,
    alignItems: "center",
    shadowColor: "#10B981",
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
    color: "#383940",
    marginBottom: 20,
  },
  courseCard: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  courseName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#383940",
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
    color: "#383940",
  },
  gradeInput: {
    backgroundColor: "#FAFAFA",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    color: "#383940",
  },
  creditInput: {
    backgroundColor: "#FAFAFA",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    color: "#383940",
    textAlign: "center",
  },
  calculateButton: {
    backgroundColor: "#535FFD",
    margin: 24,
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#535FFD",
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
    backgroundColor: "#FFFFFF",
    margin: 24,
    padding: 40,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  instructionState: {
    backgroundColor: "#FFFFFF",
    margin: 24,
    padding: 40,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  instructionIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#383940",
    marginBottom: 8,
    textAlign: "center",
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#383940",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
  },
  instructionSubtitle: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
  },
  guideCard: {
    backgroundColor: "#FFFFFF",
    margin: 24,
    padding: 20,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  guideTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#383940",
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
    backgroundColor: "#FAFAFA",
  },
  gradeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#383940",
    marginBottom: 4,
  },
  pointsText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "60%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#383940",
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
    backgroundColor: "rgba(83, 95, 253, 0.1)",
  },
  modalItemText: {
    fontSize: 16,
    color: "#383940",
    fontWeight: "500",
  },
  modalItemTextSelected: {
    color: "#535FFD",
    fontWeight: "700",
  },
  modalItemSubtext: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
  },
  modalClose: {
    backgroundColor: "#F1F5F9",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 16,
  },
  modalCloseText: {
    color: "#383940",
    fontSize: 16,
    fontWeight: "600",
  },
  bottomSpacing: {
    height: 20,
  },
});