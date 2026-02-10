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
import SvgIcon from "../../components/SvgIcon";
import { useTheme } from '../../contexts/ThemeContext';

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

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  // Header styling - Like ProfileScreen but adapted
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
    color: theme.colors.textPrimary,
    marginBottom: 12,
    marginTop: 90,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
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
    color: theme.colors.textPrimary,
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
    textAlign: 'center',
  },
  validationContainer: {
    marginTop: 12,
    marginBottom: 20,
  },
  validationText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: "rgba(83, 95, 253, 0.05)",
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    marginTop: 50,
    borderLeftColor: "#535FFD",
  },
  infoText: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 20,
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