import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  TextInput,
  TouchableOpacity, 
  ScrollView,
  Alert,
  KeyboardAvoidingView, // Added import
  Platform // Added import
} from "react-native";

// ⭐ Firestore imports - following the same pattern
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../../../firebase";
import { styles } from './Units.styles';

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


      // Navigate to next screen
      navigation.replace("CurrentSemester", { 
        nick, 
        course, 
        semesters 
      });

    } catch (error) {
      Alert.alert("Error", "Failed to save course units. Please try again.");
    }
  };

  return (
    <KeyboardAvoidingView // Added KeyboardAvoidingView wrapper
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"} // Different behavior for iOS vs Android
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20} // Adjust offset for Android
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.backBtn} 
            onPress={() => navigation.navigate("Semesters")}
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
        keyboardShouldPersistTaps="handled" // Ensures taps work properly with keyboard
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
    </KeyboardAvoidingView> // Close KeyboardAvoidingView
  );
}
