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
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";
import SvgIcon from "../../components/SvgIcon"; // Add this import

const { height } = Dimensions.get("window");

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = () => {
    if (!email.trim()) {
      setError("Please enter your email address");
      return false;
    }

    if (!email.includes('@') || !email.includes('.')) {
      setError("Please enter a valid email address");
      return false;
    }

    if (!password.trim()) {
      setError("Please enter your password");
      return false;
    }

    setError("");
    return true;
  };

  const checkOnboardingStatus = async (userId) => {
    try {
      const userDocRef = doc(db, "users", userId);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return userData.onboarding_completed === true;
      }
      return false;
    } catch (error) {
      console.error("Error checking onboarding:", error);
      return false;
    }
  };

  const login = async () => {
    // Validate form before attempting login
    if (!validateForm()) {
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      console.log("🔄 Attempting login for:", email);
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;
      
      console.log("✅ Login successful for:", user.email);
      console.log("📱 User UID:", user.uid);
      
      // Check onboarding status and navigate accordingly
      const isOnboardingCompleted = await checkOnboardingStatus(user.uid);
      console.log("🎯 Onboarding completed:", isOnboardingCompleted);
      
      if (isOnboardingCompleted) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Home' }],
        });
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: 'OnboardingSplash' }],
        });
      }
      
    } catch (error) {
      console.error("❌ Login error:", error);
      
      // More specific error handling
      switch (error.code) {
        case 'auth/invalid-email':
          setError("Please enter a valid email address");
          break;
        case 'auth/user-disabled':
          setError("This account has been disabled");
          break;
        case 'auth/user-not-found':
          setError("No account found with this email");
          break;
        case 'auth/wrong-password':
          setError("Incorrect password. Please try again.");
          break;
        case 'auth/network-request-failed':
          setError("Network error. Please check your connection.");
          break;
        case 'auth/too-many-requests':
          setError("Too many failed attempts. Please try again later.");
          break;
        default:
          setError("Login failed. Please check your credentials and try again.");
      }
      
      // IMPORTANT: Don't navigate away - stay on login page
      setIsLoading(false);
      return; // Stop further execution
    }
    
    setIsLoading(false);
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
          {/* Welcome Header with Icon */}
          <View style={styles.header}>

            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>
              Sign in to continue your academic journey
            </Text>
          </View>

          {/* Form Container with Card Design */}
          <View style={styles.formCard}>
            {/* Error Message */}
            {error ? (
              <View style={styles.errorContainer}>
                <SvgIcon name="warning" size={20} color="#DC2626" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <View style={styles.inputLabelContainer}>
                <SvgIcon name="email" size={16} color="#64748B" style={styles.inputIcon} />
                <Text style={styles.inputLabel}>Username</Text>
              </View>
              <TextInput
                placeholder="john..."
                style={styles.input}
                value={email}
                autoCapitalize="none"
                keyboardType="email-address"
                onChangeText={(text) => {
                  setEmail(text);
                  if (error) setError("");
                }}
                placeholderTextColor="#94A3B8"
                autoComplete="email"
                editable={!isLoading}
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <View style={styles.inputLabelContainer}>
                <SvgIcon name="lock" size={16} color="#64748B" style={styles.inputIcon} />
                <Text style={styles.inputLabel}>Password</Text>
              </View>
              <View style={styles.passwordContainer}>
                <TextInput
                  placeholder="Enter your password"
                  style={styles.passwordInput}
                  value={password}
                  secureTextEntry={!showPassword}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (error) setError("");
                  }}
                  placeholderTextColor="#94A3B8"
                  autoComplete="password"
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
            </View>

            {/* Forgot Password Link 
            <TouchableOpacity 
              style={styles.forgotPassword}
              onPress={() => navigation.navigate("ForgotPassword")}
              disabled={isLoading}
            >
              <Text style={styles.forgotPasswordText}>Forgot your password?</Text>
            </TouchableOpacity>
*/}

            {/* Login Button */}
            <TouchableOpacity 
              style={[
                styles.loginButton,
                isLoading && styles.loginButtonDisabled,
                (!email.trim() || !password.trim()) && styles.loginButtonDisabled
              ]}
              onPress={login}
              disabled={isLoading || !email.trim() || !password.trim()}
              activeOpacity={0.9}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.loginButtonText}>Sign In</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Sign Up Section */}
          <View style={styles.signupSection}>
            <Text style={styles.signupText}>New to REMI? </Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate("Signup")}
              disabled={isLoading}
            >
              <Text style={styles.signupLink}>Create an account</Text>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>SND</Text>
            <View style={styles.dividerLine} />
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
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFFFFF",
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 2,
    borderColor: "#F1F5F9",
  },
  title: {
    fontSize: 32,
    marginTop: 120,
    fontWeight: "800",
    color: "#383940",
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: "#535FFD",
    fontSize: 14,
    fontWeight: "600",
  },
  loginButton: {
    backgroundColor: "#535FFD",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    shadowColor: "#535FFD",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonDisabled: {
    backgroundColor: "#94A3B8",
    shadowColor: "#94A3B8",
  },
  buttonIcon: {
    marginRight: 4,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  signupSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  signupText: {
    color: "#64748B",
    fontSize: 16,
  },
  signupLink: {
    color: "#535FFD",
    fontSize: 16,
    fontWeight: "700",
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    paddingHorizontal: 16,
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '500',
  },
  socialButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#F1F5F9',
    gap: 12,
  },
  socialButtonText: {
    color: '#383940',
    fontSize: 14,
    fontWeight: '600',
  },
});