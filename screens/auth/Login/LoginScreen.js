import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator
} from "react-native";
import { Svg, Path } from "react-native-svg";
import SvgIcon from "../../../components/SvgIcon";
import { supabase } from "../../../supabase";
import { usernameToEmail, validateUsernameFormat } from "../../../utils/usernameHelper";
import { signInWithGoogle } from "../../../utils/googleAuth";
import { styles } from './LoginScreen.styles';

const { height } = Dimensions.get("window");

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = () => {
    if (!username.trim()) {
      setError("Please enter your username");
      return false;
    }

    if (username.trim().length < 3) {
      setError("Username must be at least 3 characters");
      return false;
    }

    if (!password.trim()) {
      setError("Please enter your password");
      return false;
    }

    setError("");
    return true;
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

  const login = async () => {
    if (!validateForm()) {
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const email = usernameToEmail(username.trim().toLowerCase());
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        if (error.message.includes('Invalid login')) {
          setError("Incorrect username or password.");
        } else if (error.message.includes('Email not confirmed')) {
          setError("Please confirm your email before signing in.");
        } else {
          setError(error.message);
        }
        setIsLoading(false);
        return;
      }
      // App.js onAuthStateChange handles navigation automatically
    } catch (err) {
      setError("Login failed. Please check your connection and try again.");
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {Platform.OS === 'ios' ? (
        <KeyboardAvoidingView 
          style={styles.keyboardAvoid}
          behavior="padding"
          keyboardVerticalOffset={60}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {renderContent()}
          </ScrollView>
        </KeyboardAvoidingView>
      ) : (
        <ScrollView 
          style={styles.scrollViewAndroid}
          contentContainerStyle={styles.scrollContentAndroid}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {renderContent()}
        </ScrollView>
      )}
    </View>
  );

  function renderContent() {
    return (
      <>
        <View style={styles.header}>
          <Text style={styles.title}>Login Here</Text>
        </View>

        <View style={styles.formCard}>
          {error ? (
            <View style={styles.errorContainer}>
              <SvgIcon name="warning" size={20} color="#DC2626" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.inputContainer}>
            <View style={styles.inputLabelContainer}>
              <SvgIcon name="user" size={16} color="#ffffff" style={styles.inputIcon} />
              <Text style={styles.inputLabel}>Username</Text>
            </View>
            <TextInput
              placeholder="Enter your username"
              style={styles.input}
              value={username}
              autoCapitalize="none"
              onChangeText={(text) => {
                setUsername(text);
                if (error) setError("");
              }}
              placeholderTextColor="rgba(255,255,255,0.6)"
              editable={!isLoading}
              maxLength={20}
            />
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputLabelContainer}>
              <SvgIcon name="lock" size={16} color="#ffffff" style={styles.inputIcon} />
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
                placeholderTextColor="rgba(255,255,255,0.6)"
                editable={!isLoading}
                onSubmitEditing={login}
                returnKeyType="go"
              />
              <TouchableOpacity 
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                <SvgIcon name="eye" size={22} color={showPassword ? "#ffffff" : "rgba(255,255,255,0.5)"} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.loginButton,
              isLoading && styles.loginButtonDisabled,
              (!username.trim() || !password.trim()) && styles.loginButtonDisabled
            ]}
            onPress={login}
            disabled={isLoading || !username.trim() || !password.trim()}
            activeOpacity={0.9}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>Sign In</Text>
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
        </View>

        <View style={styles.signupSection}>
          <Text style={styles.signupText}>New to REMI? </Text>
          <TouchableOpacity 
            onPress={() => navigation.navigate("Signup")}
            disabled={isLoading}
          >
            <Text style={styles.signupLink}>Create an account</Text>
          </TouchableOpacity>
        </View>

      </>
    );
  }
}
