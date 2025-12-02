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

export default function Nickname({ navigation }) {
  const [nick, setNick] = useState("");
  const [isValid, setIsValid] = useState(false);
  const [isTouched, setIsTouched] = useState(false);

  const validateNickname = (text) => {
    setNick(text);
    setIsTouched(true);

    const t = text.trim();
    const valid =
      t.length >= 2 &&
      t.length <= 20 &&
      /^[a-zA-Z0-9\s\-_]+$/.test(t) &&
      !/\s{2,}/.test(t);

    setIsValid(valid);
  };

  // Save nickname to Firestore and navigate to Course screen
  const saveNicknameAndProceed = async () => {
    if (!isValid) {
      Alert.alert("Invalid Nickname", "Please enter a valid nickname.");
      return;
    }

    const trimmedNick = nick.trim();

    try {
      await setDoc(
        doc(db, "users", auth.currentUser.uid),
        {
          nickname: trimmedNick,
          createdAt: new Date(),
        },
        // Only update Nickname field, don't overwrite other data
        { merge: true }
      );

      navigation.replace("Course", { nick: trimmedNick });

    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Could not save nickname.");
    }
  };

  const getValidationMessage = () => {
    if (!isTouched || nick.trim().length === 0) return null;
    const t = nick.trim();

    if (t.length < 2) return "Nickname must be at least 2 characters";
    if (t.length > 20) return "Nickname must be 20 characters or less";
    if (!/^[a-zA-Z0-9\s\-_]+$/.test(t))
      return "Only letters, numbers, spaces, hyphens, and underscores allowed";
    if (/\s{2,}/.test(t)) return "No consecutive spaces allowed";

    return "Looks good!";
  };

  const getValidationColor = () => {
    if (!isTouched || nick.trim().length === 0) return "#64748B";
    return isValid ? "#10B981" : "#EF4444";
  };

  return (
    <View style={styles.container}>
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
            <Text style={styles.title}>What should I call you?</Text>
            <Text style={styles.subtitle}>
              Choose a nickname that I can use to personalize your experience
            </Text>
          </View>

          {/* Input Section */}
          <View style={styles.inputSection}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Your Nickname</Text>

              <TextInput
                style={[
                  styles.input,
                  isTouched && {
                    borderColor: getValidationColor(),
                    backgroundColor: isValid ? "#F0F9FF" : "#FFFFFF",
                  },
                ]}
                placeholder="Enter your preferred nickname..."
                placeholderTextColor="#94A3B8"
                value={nick}
                onChangeText={validateNickname}
                onSubmitEditing={saveNicknameAndProceed}
                autoCapitalize="words"
                autoCorrect={false}
                maxLength={20}
                returnKeyType="done"
              />

              <View style={styles.counterContainer}>
                <Text style={styles.counterText}>{nick.length}/20</Text>
              </View>
            </View>

            {isTouched && nick.trim().length > 0 && (
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
            isValid ? styles.nextButtonActive : styles.nextButtonDisabled,
          ]}
          disabled={!isValid}
          onPress={saveNicknameAndProceed}
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
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
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
    marginTop: 200,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#64748B",
    textAlign: "center",
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
    fontWeight: "500",
  },
  validationContainer: {
    marginTop: 12,
    paddingHorizontal: 4,
  },
  validationText: {
    fontSize: 14,
    fontWeight: "500",
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