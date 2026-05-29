import React, { useState, useRef } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, Image,
  ImageBackground, Linking, Animated, Dimensions,
  KeyboardAvoidingView, Platform, ScrollView, TextInput,
  ActivityIndicator, Alert,
} from "react-native";
import { Svg, Path } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../../supabase";
import { usernameToEmail, validateUsernameFormat } from "../../utils/usernameHelper";
import { signInWithGoogle } from "../../utils/googleAuth";

const { height: SCREEN_H } = Dimensions.get("window");
const SHEET_H = SCREEN_H * 0.76;

const GoogleLogo = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24">
    <Path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <Path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <Path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <Path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </Svg>
);

export default function SplashIntro({ navigation }) {
  const insets = useSafeAreaInsets();

  // Sheet animation
  const sheetAnim = useRef(new Animated.Value(SHEET_H)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const [activeSheet, setActiveSheet] = useState(null); // null | 'signup' | 'login'

  // Signup state
  const [signupStep, setSignupStep] = useState("method");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [signupError, setSignupError] = useState("");
  const [signupLoading, setSignupLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");

  // Login state
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [showLoginPwd, setShowLoginPwd] = useState(false);

  // ── Sheet controls ──────────────────────────────────────────────
  const openSheet = (type) => {
    setActiveSheet(type);
    Animated.parallel([
      Animated.spring(sheetAnim, { toValue: 0, useNativeDriver: true, tension: 60, friction: 12 }),
      Animated.timing(backdropAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
    ]).start();
  };

  const closeSheet = () => {
    Animated.parallel([
      Animated.spring(sheetAnim, { toValue: SHEET_H, useNativeDriver: true, tension: 60, friction: 12 }),
      Animated.timing(backdropAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(() => {
      setActiveSheet(null);
      setSignupStep("method");
      setUsername(""); setPassword(""); setConfirmPassword("");
      setSignupError(""); setUsernameError(""); setPasswordError(""); setConfirmError("");
      setLoginUsername(""); setLoginPassword(""); setLoginError("");
    });
  };

  // ── Signup validation ───────────────────────────────────────────
  const validateUsernameInput = (v) => {
    const res = validateUsernameFormat(v);
    if (!res.valid && v.length > 0) { setUsernameError(res.error); return false; }
    setUsernameError(""); return true;
  };

  const validatePasswordInput = (v) => {
    if (!v.length) { setPasswordError(""); return true; }
    if (v.length < 8) { setPasswordError("At least 8 characters"); return false; }
    if (!/[A-Z]/.test(v)) { setPasswordError("Include one uppercase letter"); return false; }
    if (!/[0-9]/.test(v)) { setPasswordError("Include one number"); return false; }
    setPasswordError(""); return true;
  };

  const validateConfirm = (v) => {
    if (v.length && password !== v) { setConfirmError("Passwords do not match"); return false; }
    setConfirmError(""); return true;
  };

  const isSignupFormValid = () => {
    const res = validateUsernameFormat(username);
    return (
      res.valid && username.trim() && password.trim() && confirmPassword.trim() &&
      password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password) &&
      password === confirmPassword
    );
  };

  // ── Signup auth ─────────────────────────────────────────────────
  const handleGoogleSignup = async () => {
    setSignupError(""); setSignupLoading(true);
    try {
      const result = await signInWithGoogle();
      if (!result) return;
      navigation.reset({ index: 0, routes: [{ name: result.onboardingCompleted ? "Home" : "Onboarding" }] });
    } catch (err) {
      setSignupError(err.message || "Google sign-in failed. Please try again.");
    } finally {
      setSignupLoading(false);
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
    const v = validateUsernameFormat(username);
    if (!v.valid) { setSignupError(v.error); return; }
    if (await checkUsernameExists(username)) { setSignupError("Username already taken. Please choose another."); return; }
    if (password.length < 8) { setSignupError("Password must be at least 8 characters"); return; }
    if (!/[A-Z]/.test(password)) { setSignupError("Password must contain an uppercase letter"); return; }
    if (!/[0-9]/.test(password)) { setSignupError("Password must contain a number"); return; }
    if (password !== confirmPassword) { setSignupError("Passwords do not match"); return; }

    setSignupError(""); setSignupLoading(true);
    try {
      const email = usernameToEmail(username.trim().toLowerCase());
      const { data, error: authError } = await supabase.auth.signUp({ email, password });
      if (authError) {
        setSignupError(authError.message.includes("already registered") ? "Username already taken." : authError.message);
        setSignupLoading(false); return;
      }
      await supabase.from("profiles").update({ username: username.trim().toLowerCase() }).eq("id", data.user.id);
      // App.js onAuthStateChange handles navigation
    } catch {
      setSignupError("Failed to create account. Please try again.");
      setSignupLoading(false);
    }
  };

  // ── Login auth ──────────────────────────────────────────────────
  const login = async () => {
    if (!loginUsername.trim()) { setLoginError("Please enter your username"); return; }
    if (loginUsername.trim().length < 3) { setLoginError("Username must be at least 3 characters"); return; }
    if (!loginPassword.trim()) { setLoginError("Please enter your password"); return; }

    setLoginError(""); setLoginLoading(true);
    try {
      const email = usernameToEmail(loginUsername.trim().toLowerCase());
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password: loginPassword });
      if (authError) {
        if (authError.message.includes("Invalid login") || authError.message.includes("invalid_credentials")) {
          setLoginError("Incorrect username or password.");
        } else if (authError.message.includes("Email not confirmed")) {
          setLoginError("Please confirm your email before signing in.");
        } else if (authError.status === 429 || authError.message.includes("Too many requests")) {
          setLoginError("Too many attempts. Please wait before trying again.");
        } else {
          setLoginError("Login failed. Please check your details.");
        }
        setLoginLoading(false); return;
      }
      // App.js onAuthStateChange handles navigation
    } catch {
      setLoginError("Connection error. Please try again.");
      setLoginLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoginError(""); setLoginLoading(true);
    try {
      const result = await signInWithGoogle();
      if (!result) return;
      navigation.reset({ index: 0, routes: [{ name: result.onboardingCompleted ? "Home" : "Onboarding" }] });
    } catch (err) {
      setLoginError(err.message || "Google sign-in failed. Please try again.");
    } finally {
      setLoginLoading(false);
    }
  };

  // ── Sheet content ───────────────────────────────────────────────
  const renderSignupSheet = () =>
    signupStep === "method" ? (
      <ScrollView contentContainerStyle={s.sheetInner} showsVerticalScrollIndicator={false}>
        <View style={s.handle} />
        <TouchableOpacity style={s.closeBtn} onPress={closeSheet}>
          <Ionicons name="close" size={16} color="#666666" />
        </TouchableOpacity>
        <Text style={s.title}>
          {"Create your "}
          <Text style={{ color: "#535FFD" }}>Account</Text>
        </Text>
        <Text style={s.subtitle}>Choose a method</Text>

        {!!signupError && <View style={s.errBox}><Text style={s.errTxt}>{signupError}</Text></View>}

        <TouchableOpacity style={s.usernameBtn} onPress={() => setSignupStep("form")} activeOpacity={0.8}>
          <Text style={s.usernameBtnTxt}>Continue with Username</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.googleBtn} onPress={handleGoogleSignup} disabled={signupLoading} activeOpacity={0.9}>
          {signupLoading
            ? <ActivityIndicator size="small" color="#FFFFFF" />
            : <><GoogleLogo /><Text style={s.googleTxt}>Continue with Google</Text></>
          }
        </TouchableOpacity>

        <TouchableOpacity style={s.appleBtn} onPress={() => Alert.alert("Coming Soon", "Apple Sign-In will be available soon.")} activeOpacity={0.9}>
          <Ionicons name="logo-apple" size={20} color="#FFFFFF" />
          <Text style={s.appleTxt}>Continue with Apple</Text>
        </TouchableOpacity>
      </ScrollView>
    ) : (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={s.sheetInner} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={s.handle} />
          <TouchableOpacity style={s.closeBtn} onPress={() => setSignupStep("method")}>
            <Ionicons name="close" size={16} color="#666666" />
          </TouchableOpacity>
          <Text style={s.title}>
            {"Create your "}
            <Text style={{ color: "#535FFD" }}>Account</Text>
          </Text>

          {!!signupError && <View style={s.errBox}><Text style={s.errTxt}>{signupError}</Text></View>}

          <TextInput
            style={[s.input, !!usernameError && s.inputErr]}
            placeholder="Enter Username"
            placeholderTextColor="#C0C0C0"
            value={username}
            autoCapitalize="none"
            onChangeText={t => { setUsername(t); validateUsernameInput(t); if (signupError) setSignupError(""); }}
            editable={!signupLoading}
            maxLength={20}
          />
          {!!usernameError && <Text style={s.fieldErr}>{usernameError}</Text>}

          <View style={s.pwdRow}>
            <TextInput
              style={[s.input, { marginBottom: 0, paddingRight: 54 }, !!passwordError && s.inputErr]}
              placeholder="Enter Password"
              placeholderTextColor="#C0C0C0"
              value={password}
              secureTextEntry={!showPassword}
              onChangeText={t => { setPassword(t); validatePasswordInput(t); if (signupError) setSignupError(""); }}
              editable={!signupLoading}
              maxLength={128}
              autoComplete="password-new"
            />
            <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPassword(v => !v)}>
              <Ionicons name={showPassword ? "eye" : "eye-off"} size={20} color="#BBBBBB" />
            </TouchableOpacity>
          </View>
          {!!passwordError && <Text style={[s.fieldErr, { marginTop: 6 }]}>{passwordError}</Text>}

          <View style={[s.pwdRow, { marginTop: 14 }]}>
            <TextInput
              style={[s.input, { marginBottom: 0, paddingRight: 54 }, !!confirmError && s.inputErr]}
              placeholder="Confirm Password"
              placeholderTextColor="#C0C0C0"
              value={confirmPassword}
              secureTextEntry={!showConfirm}
              onChangeText={t => { setConfirmPassword(t); validateConfirm(t); if (signupError) setSignupError(""); }}
              editable={!signupLoading}
              maxLength={128}
            />
            <TouchableOpacity style={s.eyeBtn} onPress={() => setShowConfirm(v => !v)}>
              <Ionicons name={showConfirm ? "eye" : "eye-off"} size={20} color="#BBBBBB" />
            </TouchableOpacity>
          </View>
          {!!confirmError && <Text style={[s.fieldErr, { marginTop: 6 }]}>{confirmError}</Text>}
          {password && confirmPassword && !confirmError && password === confirmPassword && (
            <Text style={s.matchTxt}>✓  Passwords match</Text>
          )}

          <TouchableOpacity
            style={[s.mainBtn, { marginTop: 22 }, (!isSignupFormValid() || signupLoading) && s.mainBtnDim]}
            onPress={signup}
            disabled={!isSignupFormValid() || signupLoading}
            activeOpacity={0.9}
          >
            {signupLoading
              ? <ActivityIndicator size="small" color="#FFFFFF" />
              : <Text style={s.mainBtnTxt}>Create Account</Text>
            }
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );

  const renderLoginSheet = () => (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={s.sheetInner} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={s.handle} />
        <TouchableOpacity style={s.closeBtn} onPress={closeSheet}>
          <Ionicons name="close" size={16} color="#666666" />
        </TouchableOpacity>
        <Text style={s.title}>Welcome Back</Text>

        {!!loginError && <View style={s.errBox}><Text style={s.errTxt}>{loginError}</Text></View>}

        <TextInput
          style={s.input}
          placeholder="Enter Username"
          placeholderTextColor="#C0C0C0"
          value={loginUsername}
          autoCapitalize="none"
          onChangeText={t => { setLoginUsername(t); if (loginError) setLoginError(""); }}
          editable={!loginLoading}
          maxLength={20}
        />

        <View style={s.pwdRow}>
          <TextInput
            style={[s.input, { marginBottom: 0, paddingRight: 54 }]}
            placeholder="Enter Password"
            placeholderTextColor="#C0C0C0"
            value={loginPassword}
            secureTextEntry={!showLoginPwd}
            onChangeText={t => { setLoginPassword(t); if (loginError) setLoginError(""); }}
            editable={!loginLoading}
            maxLength={128}
            onSubmitEditing={login}
            returnKeyType="go"
          />
          <TouchableOpacity style={s.eyeBtn} onPress={() => setShowLoginPwd(v => !v)}>
            <Ionicons name={showLoginPwd ? "eye" : "eye-off"} size={20} color="#BBBBBB" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[s.mainBtn, { marginTop: 20 }, (loginLoading || !loginUsername.trim() || !loginPassword.trim()) && s.mainBtnDim]}
          onPress={login}
          disabled={loginLoading || !loginUsername.trim() || !loginPassword.trim()}
          activeOpacity={0.9}
        >
          {loginLoading
            ? <ActivityIndicator size="small" color="#FFFFFF" />
            : <Text style={s.mainBtnTxt}>Log in</Text>
          }
        </TouchableOpacity>

        <View style={s.divider}>
          <View style={s.dividerLine} />
          <Text style={s.dividerTxt}>or</Text>
          <View style={s.dividerLine} />
        </View>

        <TouchableOpacity style={s.googleBtn} onPress={handleGoogleLogin} disabled={loginLoading} activeOpacity={0.9}>
          <GoogleLogo />
          <Text style={s.googleTxt}>Continue with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.appleBtn} onPress={() => Alert.alert("Coming Soon", "Apple Sign-In will be available soon.")} activeOpacity={0.9}>
          <Ionicons name="logo-apple" size={20} color="#FFFFFF" />
          <Text style={s.appleTxt}>Continue with Apple</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  // ── Render ──────────────────────────────────────────────────────
  return (
    <View style={s.root}>
      <ImageBackground
        source={require("../../assets/welcome-page.png")}
        style={s.bg}
        resizeMode="cover"
      >
        <View style={s.overlay} />

        <View style={[s.logoArea, { paddingTop: insets.top + 24 }]}>
          <Image source={require("../../assets/remiwhite.png")} style={s.logo} resizeMode="contain" />
          <Text style={s.logoLabel}>Remi</Text>
        </View>

        <View style={[s.bottom, { paddingBottom: Math.max(insets.bottom, 16) + 16 }]}>
          <Text style={s.headline}>Your Personal{"\n"}Assistant</Text>

          <TouchableOpacity style={s.primaryBtn} onPress={() => openSheet("signup")} activeOpacity={0.9}>
            <Text style={s.primaryBtnTxt}>Get Started</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.secondaryBtn} onPress={() => openSheet("login")} activeOpacity={0.9}>
            <Text style={s.secondaryBtnTxt}>I already have an account</Text>
          </TouchableOpacity>

          <Text style={s.terms}>
            {"By proceeding to use Remi you agree to our "}
            <Text style={s.termsLink} onPress={() => Linking.openURL("https://sndstudio-ug.com/terms")}>terms of use</Text>
            {" and acknowledge that you have read our "}
            <Text style={s.termsLink} onPress={() => Linking.openURL("https://sndstudio-ug.com/privacy")}>privacy policy</Text>
          </Text>
        </View>
      </ImageBackground>

      {/* Backdrop — tap to dismiss */}
      <Animated.View
        style={[s.backdrop, { opacity: backdropAnim }]}
        pointerEvents={activeSheet ? "auto" : "none"}
      >
        <TouchableOpacity style={{ flex: 1 }} onPress={closeSheet} activeOpacity={1} />
      </Animated.View>

      {/* Bottom sheet */}
      <Animated.View
        style={[
          s.sheet,
          { paddingBottom: Math.max(insets.bottom, 16), transform: [{ translateY: sheetAnim }] },
        ]}
        pointerEvents={activeSheet ? "auto" : "none"}
      >
        {activeSheet === "signup"
          ? renderSignupSheet()
          : activeSheet === "login"
            ? renderLoginSheet()
            : null}
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#141650" }, // visible while image loads
  bg: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10, 12, 55, 0.74)",
  },
  logoArea: { flex: 1, alignItems: "center", justifyContent: "center" },
  logo: { width: 64, height: 64 },
  logoLabel: { color: "#FFFFFF", fontSize: 18, fontWeight: "600", marginTop: 10, letterSpacing: 0.4 },
  bottom: { paddingHorizontal: 24 },
  headline: { color: "#FFFFFF", fontSize: 36, fontWeight: "800", lineHeight: 46, marginBottom: 30 },
  primaryBtn: {
    backgroundColor: "#FFFFFF", borderRadius: 50,
    paddingVertical: 17, alignItems: "center", marginBottom: 14,
  },
  primaryBtnTxt: { color: "#1A1A1A", fontSize: 16, fontWeight: "700" },
  secondaryBtn: {
    backgroundColor: "#535FFD", borderRadius: 50,
    paddingVertical: 17, alignItems: "center", marginBottom: 22,
  },
  secondaryBtnTxt: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  terms: { color: "rgba(255,255,255,0.55)", fontSize: 11, textAlign: "center", lineHeight: 17, paddingHorizontal: 8 },
  termsLink: { color: "#FFFFFF", fontWeight: "700" },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.52)",
    zIndex: 10,
  },
  sheet: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    height: SHEET_H,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    zIndex: 20,
    overflow: "hidden",
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: "#E0E0E0",
    alignSelf: "center",
    marginBottom: 14,
  },
  sheetInner: { paddingHorizontal: 24, paddingTop: 14, paddingBottom: 28 },
  closeBtn: {
    alignSelf: "flex-end", width: 30, height: 30, borderRadius: 15,
    backgroundColor: "#F0F0F0", alignItems: "center", justifyContent: "center", marginBottom: 18,
  },
  title: { fontSize: 26, fontWeight: "800", color: "#1A1A1A", marginBottom: 6 },
  subtitle: { fontSize: 14, color: "#AAAAAA", marginBottom: 24 },
  errBox: {
    backgroundColor: "#FEF2F2", borderRadius: 12, padding: 14,
    marginBottom: 16, borderWidth: 1, borderColor: "#FECACA",
  },
  errTxt: { color: "#DC2626", fontSize: 13, fontWeight: "500" },

  usernameBtn: {
    backgroundColor: "rgba(83, 95, 253, 0.12)", borderRadius: 50,
    paddingVertical: 17, alignItems: "center", marginBottom: 14,
  },
  usernameBtnTxt: { color: "#535FFD", fontSize: 15, fontWeight: "600" },
  googleBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: "#535FFD", borderRadius: 50, paddingVertical: 17,
    gap: 10, marginBottom: 14, minHeight: 54,
  },
  googleTxt: { color: "#FFFFFF", fontSize: 15, fontWeight: "600" },
  appleBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: "#111111", borderRadius: 50, paddingVertical: 17, gap: 10,
  },
  appleTxt: { color: "#FFFFFF", fontSize: 15, fontWeight: "600" },

  input: {
    backgroundColor: "#F2F2F2", borderRadius: 50,
    paddingHorizontal: 22, paddingVertical: 16,
    fontSize: 15, color: "#1A1A1A", marginBottom: 14,
  },
  inputErr: { borderWidth: 1.5, borderColor: "#FECACA" },
  pwdRow: { position: "relative" },
  eyeBtn: { position: "absolute", right: 18, top: 0, bottom: 0, justifyContent: "center" },
  fieldErr: { color: "#EF4444", fontSize: 12, marginBottom: 10, paddingLeft: 8 },
  matchTxt: { color: "#10B981", fontSize: 12, marginBottom: 4, marginTop: 6, paddingLeft: 8 },
  mainBtn: {
    backgroundColor: "#111111", borderRadius: 50,
    paddingVertical: 17, alignItems: "center",
  },
  mainBtnDim: { opacity: 0.45 },
  mainBtnTxt: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  divider: { flexDirection: "row", alignItems: "center", marginVertical: 20, gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#EBEBEB" },
  dividerTxt: { color: "#AAAAAA", fontSize: 13, fontWeight: "500" },
});
