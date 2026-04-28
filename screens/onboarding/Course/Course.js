import React, { useState } from "react";
import { 
  View, 
  Text, 
  TextInput,
  TouchableOpacity, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions
} from "react-native";

import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../../../firebase";
import SvgIcon from "../../../components/SvgIcon";
import { useTheme } from '../../../contexts/ThemeContext';
import { getStyles } from './Course.styles';

const { height } = Dimensions.get("window");

export default function Course({ navigation, route }) {
  const nick = route?.params?.nick || "";
  const [course, setCourse] = useState("");
  const [isValid, setIsValid] = useState(false);
  const [isTouched, setIsTouched] = useState(false);
  
  const { theme } = useTheme();

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
    if (!isTouched || course.trim().length === 0) return theme.colors.textSecondary;
    return isValid ? "#10B981" : "#EF4444";
  };

  const styles = getStyles(theme);

  return (
    <View style={styles.container}>

      {/* Header with Back Button - USE navigate NOT goBack */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.backBtn} 
            onPress={() => navigation.navigate("Nickname")} // Navigate to Nickname
          >
            <SvgIcon name="arrow-back" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>COURSE</Text>
          <View style={styles.headerSpacer} />
        </View>
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
