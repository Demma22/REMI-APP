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
  Alert,
  ScrollView
} from "react-native";

import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../../firebase";

export default function Nickname({ navigation }) {
  const [nick, setNick] = useState("");
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
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      {/* Background Design */}
      <View style={styles.background}>
        <View style={[styles.circle, styles.circle1]} />
        <View style={[styles.circle, styles.circle2]} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>NICKNAME</Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View 
          style={[
            styles.content,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}
        >
          {/* Header Section */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>What should we call you?</Text>
            <Text style={styles.subtitle}>
              Choose a nickname that we can use to personalize your experience
            </Text>
          </View>

          {/* Input Section - Fixed positioning */}
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

          {/* Button Section - Always visible at bottom */}
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
        </Animated.View>
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
  },
  titleSection: {
    alignItems: 'center',
    marginTop: 60,
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  counterContainer: {
    position: 'absolute',
    top: 18,
    right: 18,
  },
  counterText: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: '500',
  },
  validationContainer: {
    marginTop: 12,
  },
  validationText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  buttonSection: {
    marginTop: 'auto', // This pushes the button to the bottom
    marginBottom: 20,
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