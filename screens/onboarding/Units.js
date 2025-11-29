import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Alert
} from "react-native";

// ⭐ Firestore imports - following the same pattern
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../../firebase";

export default function Units({ navigation, route }) {
  const { nick, course, semesters } = route.params;

  // Create array: one array per semester
  const [units, setUnits] = useState(
    Array.from({ length: semesters }).map(() => [""])
  );

  // Update a single unit
  const updateUnit = (semIndex, unitIndex, value) => {
    const copy = [...units];
    copy[semIndex][unitIndex] = value;
    setUnits(copy);
  };

  // Add new course unit to a semester
  const addUnit = (semIndex) => {
    const copy = [...units];
    copy[semIndex].push("");
    setUnits(copy);
  };

  // Remove empty units before saving
  const removeEmptyUnits = (unitsArray) => {
    return unitsArray.map(semesterUnits => 
      semesterUnits.filter(unit => unit.trim() !== "")
    );
  };

  // Save course units to Firestore
  const saveUnitsAndProceed = async () => {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) {
        Alert.alert("Error", "Not logged in");
        return;
      }

      // Remove empty units
      const cleanedUnits = removeEmptyUnits(units);
      
      // Check if at least one semester has units
      const hasUnits = cleanedUnits.some(semester => semester.length > 0);
      if (!hasUnits) {
        Alert.alert("Warning", "Please add at least one course unit before continuing.");
        return;
      }

      // ⭐ NEW: Format units for Firestore in the new structure
      const formattedUnits = {};
      cleanedUnits.forEach((semesterUnits, index) => {
        if (semesterUnits.length > 0) {
          // Use semester number as key (1, 2, 3, etc.)
          const semesterNumber = (index + 1).toString();
          formattedUnits[semesterNumber] = semesterUnits;
        }
      });

      // ⭐ Save course units to Firestore - UPDATED FIELD NAME
      await setDoc(
        doc(db, "users", uid),
        {
          units: formattedUnits, // ⭐ CHANGED: from course_units to units
          course: course, // Save the course name
          nickname: nick, // Save the nickname
          total_semesters: semesters, // Save total semesters
          updatedAt: new Date(),
        },
        { merge: true } // Merge with existing data
      );

      console.log("✅ Course units saved to Firestore in new format");

      // Navigate to next screen
      navigation.replace("CurrentSemester", { 
        nick, 
        course, 
        semesters 
      });

    } catch (error) {
      console.error("Firestore Error:", error);
      Alert.alert("Error", "Failed to save course units. Please try again.");
    }
  };

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

          <Text style={styles.headerTitle}>COURSE UNITS</Text>

          <View style={styles.headerSpacer} />
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Page Introduction */}
        <View style={styles.introSection}>
          <Text style={styles.introTitle}>Set Up Your Course Units</Text>
          <Text style={styles.introSubtitle}>
            Enter your course units for each semester. You can add as many courses as needed.
          </Text>
        </View>

        {/* Semester List */}
        {units.map((sem, semIndex) => (
          <View key={semIndex} style={styles.semesterCard}>
            
            <View style={styles.semesterHeader}>
              <Text style={styles.semesterTitle}>Semester {semIndex + 1}</Text>
              <View style={styles.courseCount}>
                <Text style={styles.courseCountText}>
                  {sem.filter(unit => unit.trim() !== "").length} course{sem.filter(unit => unit.trim() !== "").length !== 1 ? "s" : ""}
                </Text>
              </View>
            </View>

            {/* Course inputs */}
            <View style={styles.coursesList}>
              {sem.map((unit, unitIndex) => (
                <View key={unitIndex} style={styles.inputContainer}>
                  
                  <Text style={styles.inputLabel}>Course {unitIndex + 1}</Text>

                  <TextInput
                    style={styles.input}
                    placeholder={`e.g., Calculus, Programming, etc.`}
                    value={unit}
                    onChangeText={(v) => updateUnit(semIndex, unitIndex, v)}
                    placeholderTextColor="#94A3B8"
                  />

                </View>
              ))}
            </View>

            <TouchableOpacity 
              style={styles.addBtn} 
              onPress={() => addUnit(semIndex)}
            >
              <Text style={styles.addBtnText}>+ Add Course</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Continue Button */}
        <TouchableOpacity style={styles.finishBtn} onPress={saveUnitsAndProceed}>
          <Text style={styles.finishBtnText}>Continue</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },
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
  backText: { fontSize: 24, color: "#535FFD", fontWeight: "300", lineHeight: 24 },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#383940", textAlign: "center" },
  headerSpacer: { width: 40 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 40 },
  introSection: { marginBottom: 30 },
  introTitle: { fontSize: 24, fontWeight: "700", color: "#383940", marginBottom: 8 },
  introSubtitle: { fontSize: 16, color: "#64748B", lineHeight: 22 },
  semesterCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  semesterHeader: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  semesterTitle: { fontSize: 18, fontWeight: "700", color: "#383940" },
  courseCount: {
    backgroundColor: "rgba(83, 95, 253, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  courseCountText: { color: "#535FFD", fontSize: 12, fontWeight: "600" },
  coursesList: { gap: 16, marginBottom: 20 },
  inputContainer: { gap: 8 },
  inputLabel: { fontSize: 14, fontWeight: "600", color: "#383940" },
  input: {
    backgroundColor: "#FAFAFA",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    color: "#383940",
  },
  addBtn: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#535FFD",
    borderStyle: "dashed",
  },
  addBtnText: { color: "#535FFD", fontSize: 14, fontWeight: "600" },
  finishBtn: {
    backgroundColor: "#535FFD",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#535FFD",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  finishBtnText: { color: "#FFFFFF", fontSize: 18, fontWeight: "700" },
  bottomSpacing: { height: 20 },
});