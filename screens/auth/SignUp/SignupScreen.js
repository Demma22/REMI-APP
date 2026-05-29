import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Image,
  ImageBackground, KeyboardAvoidingView, Platform, Alert,
  ActivityIndicator, ScrollView, Dimensions,
} from "react-native";
import { Svg, Path } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../../../supabase";
import { usernameToEmail, validateUsernameFormat } from "../../../utils/usernameHelper";
import { signInWithGoogle } from "../../../utils/googleAuth";

const { height } = Dimensions.get("window");
const HEADER_H = height * 0.42;

export default function SignupScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState("method"); // "method" | "form"

  // Form state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");

  // ── Inline validation ────────────────────────────────────────────
  const validateUsernameInput = (value) => {
    const v = validateUsernameFormat(value);
    if (!v.valid && value.length > 0) { setUsernameError(v.error); return false; }
    setUsernameError(""); return true;
  };

  const validatePasswordInput = (value) => {
    if (!value.length) { setPasswordError(""); return true; }
    if (value.length < 8) { setPasswordError("At least 8 characters"); return false; }
    if (!/[A-Z]/.test(value)) { setPasswordError("Include one uppercase letter"); return false; }
    if (!/[0-9]/.test(value)) { setPasswordError("Include one number"); return false; }
    setPasswordError(""); return true;
  };

  const validateConfirm = (value) => {
    if (value.length && password !== value) { setConfirmError("Passwords do not match"); return false; }
    setConfirmError(""); return true;
  };

  const isFormValid = () => {
    const v = validateUsernameFormat(username);
    return (
      v.valid && username.trim() && password.trim() && confirmPassword.trim() &&
      password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password) &&
      password === confirmPassword
    );
  };

  // ── Auth ─────────────────────────────────────────────────────────
  const handleGoogleSignIn = async () => {
    setError(""); setIsLoading(true);
    try {
      const result = await signInWithGoogle();
      if (!result) return;
      navigation.reset({ index: 0, routes: [{ name: result.onboardingCompleted ? "Home" : "Onboarding" }] });
    } catch (err) {
      setError(err.message || "Google sign-in failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const checkUsernameExists = async (u) => {
    try {
      const { data } = await supabase.from("profiles").select("id")
        .eq("username", u.trim().toLowerCase()).maybeSingle();
      return !!data;
    } catch { return false; }
  };

  const signup = async () => {
    const usernameV = validateUsernameFormat(username);
    if (!usernameV.valid) { setError(usernameV.error); return; }
    if (await checkUsernameExists(username)) { setError("Username already taken. Please choose another."); return; }
    if (!password.trim() || password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (!/[A-Z]/.test(password)) { setError("Password must contain an uppercase letter"); return; }
    if (!/[0-9]/.test(password)) { setError("Password must contain a number"); return; }
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }

    setError(""); setIsLoading(true);
    try {
      const email = usernameToEmail(username.trim().toLowerCase());
      const { data, error: authError } = await supabase.auth.signUp({ email, password });
      if (authError) {
        setError(authError.message.includes("already registered") ? "Username already taken." : authError.message);
        setIsLoading(false); return;
      }
      await supabase.from("profiles")
        .update({ username: username.trim().toLowerCase() })
        .eq("id", data.user.id);
      // App.js onAuthStateChange handles navigation
    } catch {
      setError("Failed to create account. Please try again.");
      setIsLoading(false);
    }
  };

  // ── Shared image header ──────────────────────────────────────────
  const imgHeader = (
    <ImageBackground
      source={require("../../../assets/welcome-page.png")}
      style={[styles.imgHeader, { height: HEADER_H, paddingTop: insets.top + 20 }]}
      resizeMode="cover"
    >
      <View style={styles.imgOverlay} />
      <Image source={require("../../../assets/remiwhite.png")} style={styles.logo} resizeMode="contain" />
      <Text style={styles.logoLabel}>Remi</Text>
    </ImageBackground>
  );

  // ── Method selection ─────────────────────────────────────────────
  if (step === "method") {
    return (
      <View style={styles.root}>
        {imgHeader}
        <ScrollView
          style={styles.card}
          contentContainerStyle={[styles.cardInner, { paddingBottom: Math.max(insets.bottom, 16) + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={16} color="#666666" />
          </TouchableOpacity>

          <Text style={styles.title}>
            {"Create your "}
            <Text style={{ color: "#535FFD" }}>Account</Text>
          </Text>
          <Text style={styles.subtitle}>Choose a method</Text>

          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorTxt}>{error}</Text>
            </View>
          )}

          <TouchableOpacity style={styles.usernameBtn} onPress={() => setStep("form")} activeOpacity={0.8}>
            <Text style={styles.usernameBtnTxt}>Continue with Username</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleSignIn} disabled={isLoading} activeOpacity={0.9}>
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Svg width={18} height={18} viewBox="0 0 24 24">
                  <Path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <Path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <Path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <Path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </Svg>
                <Text style={styles.googleTxt}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.appleBtn}
            onPress={() => Alert.alert("Coming Soon", "Apple Sign-In will be available soon.")}
            activeOpacity={0.9}
          >
            <Ionicons name="logo-apple" size={20} color="#FFFFFF" />
            <Text style={styles.appleTxt}>Continue with Apple</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ── Sign-up form ─────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      {imgHeader}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          style={styles.card}
          contentContainerStyle={[styles.cardInner, { paddingBottom: Math.max(insets.bottom, 16) + 24 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity style={styles.closeBtn} onPress={() => setStep("method")}>
            <Ionicons name="close" size={16} color="#666666" />
          </TouchableOpacity>

          <Text style={styles.title}>
            {"Create your "}
            <Text style={{ color: "#535FFD" }}>Account</Text>
          </Text>

          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorTxt}>{error}</Text>
            </View>
          )}

          {/* Username */}
          <TextInput
            style={[styles.input, !!usernameError && styles.inputErr]}
            placeholder="Enter Username"
            placeholderTextColor="#C0C0C0"
            value={username}
            autoCapitalize="none"
            onChangeText={t => { setUsername(t); validateUsernameInput(t); if (error) setError(""); }}
            editable={!isLoading}
            maxLength={20}
          />
          {!!usernameError && <Text style={styles.fieldErr}>{usernameError}</Text>}

          {/* Password */}
          <View style={styles.pwdRow}>
            <TextInput
              style={[styles.input, { marginBottom: 0, paddingRight: 54 }, !!passwordError && styles.inputErr]}
              placeholder="Enter Password"
              placeholderTextColor="#C0C0C0"
              value={password}
              secureTextEntry={!showPassword}
              onChangeText={t => { setPassword(t); validatePasswordInput(t); if (error) setError(""); }}
              editable={!isLoading}
              maxLength={128}
              autoComplete="password-new"
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(v => !v)}>
              <Ionicons name={showPassword ? "eye" : "eye-off"} size={20} color="#BBBBBB" />
            </TouchableOpacity>
          </View>
          {!!passwordError && <Text style={[styles.fieldErr, { marginTop: 6 }]}>{passwordError}</Text>}

          {/* Confirm Password */}
          <View style={[styles.pwdRow, { marginTop: 14 }]}>
            <TextInput
              style={[styles.input, { marginBottom: 0, paddingRight: 54 }, !!confirmError && styles.inputErr]}
              placeholder="Confirm Password"
              placeholderTextColor="#C0C0C0"
              value={confirmPassword}
              secureTextEntry={!showConfirm}
              onChangeText={t => { setConfirmPassword(t); validateConfirm(t); if (error) setError(""); }}
              editable={!isLoading}
              maxLength={128}
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowConfirm(v => !v)}>
              <Ionicons name={showConfirm ? "eye" : "eye-off"} size={20} color="#BBBBBB" />
            </TouchableOpacity>
          </View>
          {!!confirmError && <Text style={[styles.fieldErr, { marginTop: 6 }]}>{confirmError}</Text>}
          {password && confirmPassword && !confirmError && password === confirmPassword && (
            <Text style={styles.matchTxt}>✓  Passwords match</Text>
          )}

          <TouchableOpacity
            style={[styles.mainBtn, { marginTop: 22 }, (!isFormValid() || isLoading) && styles.mainBtnDim]}
            onPress={signup}
            disabled={!isFormValid() || isLoading}
            activeOpacity={0.9}
          >
            {isLoading
              ? <ActivityIndicator size="small" color="#FFFFFF" />
              : <Text style={styles.mainBtnTxt}>Create Account</Text>
            }
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FFFFFF" },
  imgHeader: { alignItems: "center", justifyContent: "center" },
  imgOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(52, 57, 172, 0.62)",
  },
  logo: { width: 58, height: 58, zIndex: 1 },
  logoLabel: {
    color: "#FFFFFF", fontSize: 17, fontWeight: "600",
    marginTop: 8, letterSpacing: 0.3, zIndex: 1,
  },
  card: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -24,
  },
  cardInner: { paddingHorizontal: 24, paddingTop: 20 },
  closeBtn: {
    alignSelf: "flex-end",
    width: 30, height: 30,
    borderRadius: 15,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  title: { fontSize: 26, fontWeight: "800", color: "#1A1A1A", marginBottom: 6 },
  subtitle: { fontSize: 14, color: "#AAAAAA", marginBottom: 24 },
  errorBox: {
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  errorTxt: { color: "#DC2626", fontSize: 13, fontWeight: "500" },

  // Method buttons
  usernameBtn: {
    backgroundColor: "rgba(83, 95, 253, 0.12)",
    borderRadius: 50,
    paddingVertical: 17,
    alignItems: "center",
    marginBottom: 14,
  },
  usernameBtnTxt: { color: "#535FFD", fontSize: 15, fontWeight: "600" },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#535FFD",
    borderRadius: 50,
    paddingVertical: 17,
    gap: 10,
    marginBottom: 14,
    minHeight: 54,
  },
  googleTxt: { color: "#FFFFFF", fontSize: 15, fontWeight: "600" },
  appleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111111",
    borderRadius: 50,
    paddingVertical: 17,
    gap: 10,
  },
  appleTxt: { color: "#FFFFFF", fontSize: 15, fontWeight: "600" },

  // Form inputs
  input: {
    backgroundColor: "#F2F2F2",
    borderRadius: 50,
    paddingHorizontal: 22,
    paddingVertical: 16,
    fontSize: 15,
    color: "#1A1A1A",
    marginBottom: 14,
  },
  inputErr: { borderWidth: 1.5, borderColor: "#FECACA" },
  pwdRow: { position: "relative" },
  eyeBtn: {
    position: "absolute",
    right: 18, top: 0, bottom: 0,
    justifyContent: "center",
  },
  fieldErr: { color: "#EF4444", fontSize: 12, marginBottom: 10, paddingLeft: 8 },
  matchTxt: { color: "#10B981", fontSize: 12, marginBottom: 4, marginTop: 6, paddingLeft: 8 },
  mainBtn: {
    backgroundColor: "#111111",
    borderRadius: 50,
    paddingVertical: 17,
    alignItems: "center",
  },
  mainBtnDim: { opacity: 0.45 },
  mainBtnTxt: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
});
