import React, { useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions
} from "react-native";

import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../../firebase";

const { height } = Dimensions.get("window");

export default function Course({ navigation, route }) {
  const nick = route?.params?.nick || "";
  const [course, setCourse] = useState("");
  const [isValid, setIsValid] = useState(false);
  const [isTouched, setIsTouched] = useState(false);

  const validateCourse = (text) => {
    setCourse(text);
    setIsTouched(true);
    
    const trimmedText = text.trim();
    const isValidLength = trimmedText.length >= 3 && trimmedText.length <= 50;
    const notEmpty = trimmedText.length > 0;
    
    setIsValid(isValidLength && notEmpty);
  };

  const saveCourseAndProceed = async () => {
    if (!isValid) {
      Alert.alert(
        "Invalid Course Name",
        "Please enter a course between 3–50 characters."
      );
      return;
    }

    const trimmedCourse = course.trim();

    try {
      await setDoc(
        doc(db, "users", auth.currentUser.uid),
        {
          course: trimmedCourse,
          updatedAt: new Date(),
        },
        { merge: true }
      );

      navigation.replace("Semesters", { nick, course: trimmedCourse });

    } catch (error) {
      console.error("Firestore Error:", error);
      Alert.alert("Error", "Failed to save your course. Please try again.");
    }
  };

  const getValidationMessage = () => {
    if (!isTouched || course.trim().length === 0) return null;
    
    const trimmed = course.trim();
    
    if (trimmed.length < 3) return "Course must be at least 3 characters";
    if (trimmed.length > 50) return "Course must be 50 characters or less";
    
    return "Looks good!";
  };

  const getValidationColor = () => {
    if (!isTouched || course.trim().length === 0) return "#64748B";
    return isValid ? "#10B981" : "#EF4444";
  };

  return (
    <View style={styles.container}>
      {/* Simple Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backBtn} 
          onPress={() => navigation.navigate("Nickname")}
        >
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Course</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Section */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>What course are you pursuing?</Text>
            <Text style={styles.subtitle}>Enter your course or program name</Text>
          </View>

          {/* Input Section */}
          <View style={styles.inputSection}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Course Name</Text>
              <TextInput
                style={[
                  styles.input,
                  isTouched && {
                    borderColor: getValidationColor(),
                    backgroundColor: isValid ? "#F0F9FF" : "#FFFFFF"
                  }
                ]}
                placeholder="e.g., Computer Science, Business Administration..."
                placeholderTextColor="#94A3B8"
                value={course}
                onChangeText={validateCourse}
                onSubmitEditing={saveCourseAndProceed}
                autoCapitalize="words"
                autoCorrect={false}
                maxLength={50}
                returnKeyType="done"
              />

              <View style={styles.counterContainer}>
                <Text style={styles.counterText}>{course.length}/50</Text>
              </View>
            </View>

            {isTouched && course.trim().length > 0 && (
              <View style={styles.validationContainer}>
                <Text style={[styles.validationText, { color: getValidationColor() }]}>
                  {getValidationMessage()}
                </Text>
              </View>
            )}
          </View>

          {/* Spacer */}
          <View style={styles.spacer} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Button Section */}
      <View style={styles.buttonSection}>
        <TouchableOpacity 
          style={[
            styles.nextButton,
            isValid ? styles.nextButtonActive : styles.nextButtonDisabled
          ]}
          onPress={saveCourseAndProceed}
          disabled={!isValid}
        >
          <Text style={styles.nextButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  header: {
    backgroundColor: "#FFFFFF",
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 16,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  backText: {
    fontSize: 24,
    color: "#383940",
    fontWeight: "300",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#383940",
  },
  headerSpacer: {
    width: 40,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 120,
  },
  titleSection: {
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#383940",
    marginBottom: 12,
    marginTop: 100,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: "#64748B",
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  inputSection: {
    marginBottom: 40,
  },
  inputContainer: {
    position: 'relative',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#383940",
    marginBottom: 12,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#F1F5F9",
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    color: "#383940",
    paddingRight: 70,
  },
  counterContainer: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
  counterText: {
    fontSize: 14,
    color: "#94A3B8",
    fontWeight: '500',
  },
  validationContainer: {
    marginTop: 12,
    paddingHorizontal: 4,
  },
  validationText: {
    fontSize: 14,
    fontWeight: '500',
  },
  spacer: {
    flex: 1,
    minHeight: 20,
  },
  buttonSection: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    backgroundColor: "#FFFFFF",
  },
  nextButton: {
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
  },
  nextButtonActive: {
    backgroundColor: "#535FFD",
  },
  nextButtonDisabled: {
    backgroundColor: "#E2E8F0",
  },
  nextButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
});