import React, { useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator
} from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, query, collection, where, getDocs } from "firebase/firestore";
import { auth, db } from "../../firebase";
import SvgIcon from "../../components/SvgIcon";
import { usernameToEmail, validateUsernameFormat } from "../../utils/usernameHelper";

const { height } = Dimensions.get("window");

export default function SignupScreen({ navigation }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Check if username exists in Firestore
  const checkUsernameExists = async (username) => {
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("username", "==", username.trim().toLowerCase()));
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty; // true if username exists
    } catch (error) {
      console.error("Error checking username:", error);
      return false;
    }
  };

  const validateForm = async () => {
    // Validate username format
    const usernameValidation = validateUsernameFormat(username);
    if (!usernameValidation.valid) {
      setError(usernameValidation.error);
      return false;
    }

    // Check if username already exists
    const usernameExists = await checkUsernameExists(username);
    if (usernameExists) {
      setError("Username already taken. Please choose another.");
      return false;
    }

    // Validate password
    if (!password.trim()) {
      setError("Please create a password");
      return false;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }

    if (!confirmPassword.trim()) {
      setError("Please confirm your password");
      return false;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    setError("");
    return true;
  };

  const signup = async () => {
    if (!(await validateForm())) {
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      // Convert username to Firebase email format
      const firebaseEmail = usernameToEmail(username);
      const cleanUsername = username.trim().toLowerCase();
      
      const userCredential = await createUserWithEmailAndPassword(auth, firebaseEmail, password);
      const user = userCredential.user;
      
      await setDoc(doc(db, "users", user.uid), {
        username: cleanUsername, // Store lowercase username
        email: user.email, // Store Firebase email for reference
        created_at: new Date(),
        onboarding_completed: false,
        nickname: null,
        course: null,
        total_semesters: null,
        current_semester: null,
        units: {},
        timetable: {},
        exams: {},
        gpa_data: {},
        chat_history: []
      });

      console.log("✅ User account created with username:", cleanUsername);
      navigation.navigate("Nickname");
      
    } catch (error) {
      console.error("Signup error:", error);
      
      if (error.code === 'auth/email-already-in-use') {
        setError("Username already taken. Please choose another.");
      } else if (error.code === 'auth/weak-password') {
        setError("Password is too weak. Please use a stronger password");
      } else if (error.code === 'auth/operation-not-allowed') {
        setError("Signup is temporarily unavailable. Please try again later.");
      } else {
        setError("Failed to create account. Please try again.");
      }
      
      setIsLoading(false);
      return;
    }
    
    setIsLoading(false);
  };

  const isFormValid = () => {
    const usernameValidation = validateUsernameFormat(username);
    return usernameValidation.valid && 
           username.trim() && 
           password.trim() && 
           confirmPassword.trim() && 
           password.length >= 6 && 
           password === confirmPassword;
  };

  const handleTermsPress = () => {
    navigation.navigate("TermsConditions");
  };

  const handlePrivacyPress = () => {
    navigation.navigate("PrivacyPolicy");
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
          <View style={styles.header}>
            <Text style={styles.title}>Join REMI</Text>
            <Text style={styles.subtitle}>
              Create your account and start your academic journey
            </Text>
          </View>

          <View style={styles.formCard}>
            {error ? (
              <View style={styles.errorContainer}>
                <SvgIcon name="warning" size={20} color="#DC2626" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Username Input */}
            <View style={styles.inputContainer}>
              <View style={styles.inputLabelContainer}>
                <Text style={styles.inputLabel}>Username</Text>
              </View>
              <TextInput
                placeholder="john_doe"
                style={styles.input}
                value={username}
                autoCapitalize="none"
                onChangeText={(text) => {
                  setUsername(text);
                  if (error) setError("");
                }}
                placeholderTextColor="#94A3B8"
                editable={!isLoading}
                maxLength={20}
              />
              <View style={styles.usernameHintContainer}>
                <SvgIcon name="info" size={14} color="#94A3B8" style={styles.hintIcon} />
                <Text style={styles.usernameHint}>
                  3-20 characters, letters, numbers, _ and - only
                </Text>
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <View style={styles.inputLabelContainer}>
                <Text style={styles.inputLabel}>Password</Text>
              </View>
              <View style={styles.passwordContainer}>
                <TextInput
                  placeholder="Create a password"
                  style={styles.passwordInput}
                  value={password}
                  secureTextEntry={!showPassword}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (error) setError("");
                  }}
                  placeholderTextColor="#94A3B8"
                  autoComplete="password-new"
                  editable={!isLoading}
                />
                <TouchableOpacity 
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  <SvgIcon name="eye" size={22} color={showPassword ? "#535FFD" : "#94A3B8"} />
                </TouchableOpacity>
              </View>
              <View style={styles.passwordHintContainer}>
                <SvgIcon name="info" size={14} color="#94A3B8" style={styles.hintIcon} />
                <Text style={styles.passwordHint}>Must be at least 6 characters</Text>
              </View>
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <View style={styles.inputLabelContainer}>
                <Text style={styles.inputLabel}>Confirm Password</Text>
              </View>
              <View style={styles.passwordContainer}>
                <TextInput
                  placeholder="Confirm your password"
                  style={styles.passwordInput}
                  value={confirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (error) setError("");
                  }}
                  placeholderTextColor="#94A3B8"
                  editable={!isLoading}
                />
                <TouchableOpacity 
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                >
                  <SvgIcon name="eye" size={22} color={showConfirmPassword ? "#535FFD" : "#94A3B8"} />
                </TouchableOpacity>
              </View>
              {password !== confirmPassword && confirmPassword.length > 0 && (
                <View style={styles.passwordMatchContainer}>
                  <SvgIcon name="warning" size={14} color="#DC2626" style={styles.matchIcon} />
                  <Text style={styles.passwordMatchText}>Passwords do not match</Text>
                </View>
              )}
              {password === confirmPassword && confirmPassword.length > 0 && (
                <View style={[styles.passwordMatchContainer, styles.passwordMatchSuccess]}>
                  <SvgIcon name="check" size={14} color="#10B981" style={styles.matchIcon} />
                  <Text style={[styles.passwordMatchText, styles.passwordMatchSuccessText]}>Passwords match!</Text>
                </View>
              )}
            </View>

            <TouchableOpacity 
              style={[
                styles.signupButton,
                isLoading && styles.signupButtonDisabled,
                !isFormValid() && styles.signupButtonDisabled
              ]}
              onPress={signup}
              disabled={isLoading || !isFormValid()}
              activeOpacity={0.9}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.signupButtonText}>Create Account</Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={styles.termsText}>
              By creating an account, you agree to our{" "}
              <Text style={styles.termsLink} onPress={handleTermsPress}>
                Terms & Conditions
              </Text>{" "}
              and{" "}
              <Text style={styles.termsLink} onPress={handlePrivacyPress}>
                Privacy Policy
              </Text>
            </Text>
          </View>

          <View style={styles.loginSection}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate("Login")}
              disabled={isLoading}
            >
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingTop: 40,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    paddingTop: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#383940",
    marginTop: 60,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: "#64748B",
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    marginBottom: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FECACA',
    gap: 12,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#383940",
  },
  input: {
    backgroundColor: "#FAFAFA",
    borderWidth: 2,
    borderColor: "#F1F5F9",
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    color: "#383940",
  },
  usernameHintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
    marginLeft: 4,
  },
  usernameHint: {
    fontSize: 12,
    color: "#94A3B8",
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    backgroundColor: "#FAFAFA",
    borderWidth: 2,
    borderColor: "#F1F5F9",
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    color: "#383940",
    paddingRight: 60,
  },
  eyeButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  passwordHintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
    marginLeft: 4,
  },
  hintIcon: {
    marginTop: 1,
  },
  passwordHint: {
    fontSize: 12,
    color: "#94A3B8",
  },
  passwordMatchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
    marginLeft: 4,
  },
  passwordMatchSuccess: {
    marginTop: 8,
  },
  matchIcon: {
    marginTop: 1,
  },
  passwordMatchText: {
    fontSize: 12,
    color: "#DC2626",
  },
  passwordMatchSuccessText: {
    color: "#10B981",
  },
  signupButton: {
    backgroundColor: "#535FFD",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 8,
    marginBottom: 24,
    shadowColor: "#535FFD",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  signupButtonDisabled: {
    backgroundColor: "#94A3B8",
    shadowColor: "#94A3B8",
  },
  buttonIcon: {
    marginRight: 4,
  },
  signupButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  termsText: {
    fontSize: 12,
    color: "#94A3B8",
    textAlign: 'center',
    lineHeight: 16,
  },
  termsLink: {
    color: "#535FFD",
    fontWeight: "600",
  },
  loginSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    color: "#64748B",
    fontSize: 16,
  },
  loginLink: {
    color: "#535FFD",
    fontSize: 16,
    fontWeight: "700",
  },
});