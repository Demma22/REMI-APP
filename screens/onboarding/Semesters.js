import React, { useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  KeyboardAvoidingView,
  Platform,
  Animated,
  Alert
} from "react-native";

// ⭐ Firestore imports - same pattern as previous screens
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../../firebase";

export default function Semesters({ navigation, route }) {
  const nick = route?.params?.nick || "";
  const course = route?.params?.course || "";
  const [semesters, setSemesters] = useState("");
  const [isValid, setIsValid] = useState(false);
  const [isTouched, setIsTouched] = useState(false);
  
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(30);

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

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
      // ⭐ Save semesters to Firestore - same pattern as previous screens
      await setDoc(
        doc(db, "users", auth.currentUser.uid),
        {
          total_semesters: num,
          updatedAt: new Date(),
        },
        { merge: true } // Merge with existing data (nickname, course)
      );

      // Navigate to next screen
      navigation.replace("Units", { 
        nick, 
        course, 
        semesters: num 
      });

    } catch (error) {
      console.error("Firestore Error:", error);
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
    if (!isTouched || semesters.length === 0) return "#64748B";
    return isValid ? "#10B981" : "#EF4444";
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Background Design */}
      <View style={styles.background}>
        <View style={[styles.circle, styles.circle1]} />
        <View style={[styles.circle, styles.circle2]} />
      </View>

      {/* Header with Back Button */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.backBtn} 
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>SEMESTER SETUP</Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
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

        {/* Action Button */}
        <View style={styles.buttonSection}>
          <TouchableOpacity 
            style={[
              styles.nextButton,
              isValid ? styles.nextButtonActive : styles.nextButtonDisabled
            ]}
            onPress={saveSemestersAndProceed}
            disabled={!isValid}
          >
            <Text style={styles.nextButtonText}>
              Continue
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  background: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  circle: {
    position: 'absolute',
    borderRadius: 500,
  },
  circle1: {
    top: -100,
    right: -100,
    width: 250,
    height: 250,
    backgroundColor: 'rgba(83, 95, 253, 0.08)',
  },
  circle2: {
    bottom: -150,
    left: -100,
    width: 300,
    height: 300,
    backgroundColor: 'rgba(247, 133, 34, 0.06)',
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
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#383940",
    marginBottom: 12,
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
    marginBottom: 16,
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
    padding: 18,
    borderRadius: 16,
    fontSize: 18,
    color: "#383940",
    textAlign: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
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
    borderLeftColor: "#535FFD",
  },
  infoText: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 20,
  },
  buttonSection: {
    marginTop: 20,
  },
  nextButton: {
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonActive: {
    backgroundColor: "#535FFD",
    shadowColor: "#535FFD",
    shadowOpacity: 0.3,
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