// screens/auth/SignUp/SignupScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Linking,
} from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, query, collection, where, getDocs } from "firebase/firestore";
import { auth, db } from "../../../firebase";
import SvgIcon from "../../../components/SvgIcon";
import { usernameToEmail, validateUsernameFormat } from "../../../utils/usernameHelper";
import { useTheme } from '../../../contexts/ThemeContext';
import { getStyles } from "./SignupScreen.styles";

export default function SignupScreen({ navigation }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");

  const { theme } = useTheme();
  const styles = getStyles(theme);

  // Check if username exists in Firestore
  const checkUsernameExists = async (username) => {
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("username", "==", username.trim().toLowerCase()));
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      return false;
    }
  };

  const validateUsernameInput = (value) => {
    const validation = validateUsernameFormat(value);
    if (!validation.valid && value.length > 0) {
      setUsernameError(validation.error);
      return false;
    } else {
      setUsernameError("");
      return true;
    }
  };

  const validatePasswordInput = (value) => {
    if (value.length > 0 && value.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return false;
    } else {
      setPasswordError("");
      return true;
    }
  };

  const validateConfirmPassword = (value) => {
    if (value.length > 0 && password !== value) {
      setConfirmError("Passwords do not match");
      return false;
    } else {
      setConfirmError("");
      return true;
    }
  };

  const validateForm = async () => {
    const usernameValidation = validateUsernameFormat(username);
    if (!usernameValidation.valid) {
      setError(usernameValidation.error);
      return false;
    }

    const usernameExists = await checkUsernameExists(username);
    if (usernameExists) {
      setError("Username already taken. Please choose another.");
      return false;
    }

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
      const firebaseEmail = usernameToEmail(username);
      const cleanUsername = username.trim().toLowerCase();
      
      const userCredential = await createUserWithEmailAndPassword(auth, firebaseEmail, password);
      const user = userCredential.user;
      
      await setDoc(doc(db, "users", user.uid), {
        username: cleanUsername,
        email: user.email,
        created_at: new Date(),
        onboarding_completed: false,
        nickname: null,
      });

      navigation.navigate("Onboarding");
      
    } catch (error) {
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

  const handleUsernameChange = (text) => {
    setUsername(text);
    validateUsernameInput(text);
    if (error) setError("");
  };

  const handlePasswordChange = (text) => {
    setPassword(text);
    validatePasswordInput(text);
    if (confirmPassword && password !== text) {
      setConfirmError("Passwords do not match");
    } else if (confirmPassword && password === text) {
      setConfirmError("");
    }
    if (error) setError("");
  };

  const handleConfirmChange = (text) => {
    setConfirmPassword(text);
    validateConfirmPassword(text);
    if (error) setError("");
  };

  const handleTermsPress = () => {
    Linking.openURL('https://sndstudio-ug.com/terms');
  };

  const handlePrivacyPress = () => {
    Linking.openURL('https://sndstudio-ug.com/privacy');
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
          {renderContent()}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );

  function renderContent() {
    return (
      <>
        <View style={styles.header}>
          <Text style={styles.title}>Join REMI</Text>
          <Text style={styles.subtitle}>
            Create your account and start your journey
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
              placeholder="letters, numbers, _ and - only"
              style={[styles.input, usernameError ? styles.inputError : null]}
              value={username}
              autoCapitalize="none"
              onChangeText={handleUsernameChange}
              placeholderTextColor="rgba(255,255,255,0.6)"
              editable={!isLoading}
              maxLength={20}
            />
            {usernameError ? (
              <View style={styles.errorHintContainer}>
                <SvgIcon name="warning" size={12} color="#F87171" />
                <Text style={styles.errorHintText}>{usernameError}</Text>
              </View>
            ) : null}
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <View style={styles.inputLabelContainer}>
              <Text style={styles.inputLabel}>Password</Text>
            </View>
            <View style={styles.passwordContainer}>
              <TextInput
                placeholder="••••••"
                style={[styles.passwordInput, passwordError ? styles.inputError : null]}
                value={password}
                secureTextEntry={!showPassword}
                onChangeText={handlePasswordChange}
                placeholderTextColor="rgba(255,255,255,0.6)"
                autoComplete="password-new"
                editable={!isLoading}
              />
              <TouchableOpacity 
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                <SvgIcon name={showPassword ? "eye-off" : "eye"} size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            {passwordError ? (
              <View style={styles.errorHintContainer}>
                <SvgIcon name="warning" size={12} color="#F87171" />
                <Text style={styles.errorHintText}>{passwordError}</Text>
              </View>
            ) : null}
          </View>

          {/* Confirm Password Input */}
          <View style={styles.inputContainer}>
            <View style={styles.inputLabelContainer}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
            </View>
            <View style={styles.passwordContainer}>
              <TextInput
                placeholder="••••••"
                style={[styles.passwordInput, confirmError ? styles.inputError : null]}
                value={confirmPassword}
                secureTextEntry={!showConfirmPassword}
                onChangeText={handleConfirmChange}
                placeholderTextColor="rgba(255,255,255,0.6)"
                editable={!isLoading}
              />
              <TouchableOpacity 
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
              >
                <SvgIcon name={showConfirmPassword ? "eye-off" : "eye"} size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            {confirmError ? (
              <View style={styles.errorHintContainer}>
                <SvgIcon name="warning" size={12} color="#F87171" />
                <Text style={styles.errorHintText}>{confirmError}</Text>
              </View>
            ) : null}
            {password && confirmPassword && !confirmError && password === confirmPassword ? (
              <View style={styles.successHintContainer}>
                <SvgIcon name="check" size={12} color="#34D399" />
                <Text style={styles.successHintText}>Passwords match!</Text>
              </View>
            ) : null}
          </View>

          <TouchableOpacity 
            style={[
              styles.signupButton,
              isLoading && styles.signupButtonDisabled,
            ]}
            onPress={signup}
            disabled={isLoading}
            activeOpacity={0.9}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#535FFD" />
            ) : (
              <Text style={styles.signupButtonText}>Create Account</Text>
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
      </>
    );
  }
}