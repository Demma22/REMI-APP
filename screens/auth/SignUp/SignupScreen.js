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
import { supabase } from "../../../supabase";
import { Svg, Path } from "react-native-svg";
import SvgIcon from "../../../components/SvgIcon";
import { usernameToEmail, validateUsernameFormat } from "../../../utils/usernameHelper";
import { signInWithGoogle } from "../../../utils/googleAuth";
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

  const checkUsernameExists = async (username) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username.trim().toLowerCase())
        .maybeSingle();
      return !!data;
    } catch {
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
      const email = usernameToEmail(username.trim().toLowerCase());
      const { data, error } = await supabase.auth.signUp({ email, password });

      if (error) {
        if (error.message.includes('already registered')) {
          setError("Username already taken. Please choose another.");
        } else {
          setError(error.message);
        }
        setIsLoading(false);
        return;
      }

      // Save username to profile (trigger already created the row)
      await supabase
        .from('profiles')
        .update({ username: username.trim().toLowerCase() })
        .eq('id', data.user.id);

      // App.js onAuthStateChange handles navigation automatically
    } catch (err) {
      setError("Failed to create account. Please try again.");
      setIsLoading(false);
    }
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

  const handleGoogleSignIn = async () => {
    setError("");
    setIsLoading(true);
    try {
      const result = await signInWithGoogle();
      if (!result) return;
      if (result.onboardingCompleted) {
        navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
      } else {
        navigation.reset({ index: 0, routes: [{ name: 'SplashIntro' }] });
      }
    } catch (err) {
      setError(err.message || "Google sign-in failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
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
                <SvgIcon name="eye" size={22} color={showPassword ? "#ffffff" : "rgba(255,255,255,0.5)"} />
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
                <SvgIcon name="eye" size={22} color={showConfirmPassword ? "#ffffff" : "rgba(255,255,255,0.5)"} />
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

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleSignIn}
            disabled={isLoading}
            activeOpacity={0.9}
          >
            <Svg width={20} height={20} viewBox="0 0 24 24">
              <Path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <Path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <Path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <Path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </Svg>
            <Text style={styles.googleButtonText}>Continue with Google</Text>
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