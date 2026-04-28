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
import { getStyles } from './Semesters.styles';

const { height } = Dimensions.get("window");

export default function Semesters({ navigation, route }) {
  const nick = route?.params?.nick || "";
  const course = route?.params?.course || "";
  const [semesters, setSemesters] = useState("");
  const [isValid, setIsValid] = useState(false);
  const [isTouched, setIsTouched] = useState(false);
  
  const { theme } = useTheme();

  const validateSemesters = (text) => {
    // Only allow numbers
    const numericText = text.replace(/[^0-9]/g, '');
    setSemesters(numericText);
    setIsTouched(true);
    
    const num = parseInt(numericText);
    const isValidNumber = !isNaN(num) && num >= 1 && num <= 12;
    
    setIsValid(isValidNumber);
  };

  const saveSemestersAndProceed = async () => {
    if (!isValid) {
      Alert.alert(
        "Invalid Number",
        "Please enter a valid number of semesters between 1 and 12.",
        [{ text: "OK" }]
      );
      return;
    }

    const num = parseInt(semesters);
    
    try {
      await setDoc(
        doc(db, "users", auth.currentUser.uid),
        {
          total_semesters: num,
          updatedAt: new Date(),
        },
        { merge: true }
      );

      // Use navigate instead of replace
      navigation.navigate("Units", { 
        nick, 
        course, 
        semesters: num 
      });

    } catch (error) {
      Alert.alert("Error", "Failed to save semester count. Please try again.");
    }
  };

  const getValidationMessage = () => {
    if (!isTouched || semesters.length === 0) return null;
    
    const num = parseInt(semesters);
    
    if (isNaN(num)) {
      return "Please enter a valid number";
    }
    if (num < 1) {
      return "Must be at least 1 semester";
    }
    if (num > 12) {
      return "Maximum 12 semesters allowed";
    }
    
    return "Perfect!";
  };

  const getValidationColor = () => {
    if (!isTouched || semesters.length === 0) return theme.colors.textSecondary;
    return isValid ? "#10B981" : "#EF4444";
  };

  const styles = getStyles(theme);

  return (
    <View style={styles.container}>

      {/* Header with Back Button - Goes back to Course */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.backBtn} 
            onPress={() => navigation.navigate("Course")} // Navigate to Course
          >
            <SvgIcon name="arrow-back" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>SEMESTERS</Text>
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
            <Text style={styles.title}>How many semesters in your program?</Text>
            <Text style={styles.subtitle}>
              Enter the total number of semesters for your course
            </Text>
          </View>

          {/* Input Section */}
          <View style={styles.inputSection}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Number of Semesters</Text>
              <TextInput
                style={[
                  styles.input,
                  isTouched && {
                    borderColor: getValidationColor(),
                    backgroundColor: isValid ? "#F0F9FF" : "#FFFFFF"
                  }
                ]}
                placeholder="e.g., 8"
                placeholderTextColor="#94A3B8"
                value={semesters}
                onChangeText={validateSemesters}
                onSubmitEditing={saveSemestersAndProceed}
                keyboardType="number-pad"
                maxLength={2}
                returnKeyType="done"
              />
            </View>

            {/* Validation Message */}
            {isTouched && semesters.length > 0 && (
              <View style={styles.validationContainer}>
                <Text style={[styles.validationText, { color: getValidationColor() }]}>
                  {getValidationMessage()}
                </Text>
              </View>
            )}

            {/* Info Box */}
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                Most programs have between 6-8 semesters. Enter the total number for your entire program.
              </Text>
            </View>
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
          onPress={saveSemestersAndProceed}
          disabled={!isValid}
        >
          <Text style={styles.nextButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
