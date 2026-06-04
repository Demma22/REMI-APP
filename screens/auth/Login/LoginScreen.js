import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Image,
  KeyboardAvoidingView, Platform, Alert,
  ActivityIndicator, ScrollView, Dimensions,
} from "react-native";
import { Svg, Path } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../../../supabase";
import { usernameToEmail } from "../../../utils/usernameHelper";
import { signInWithGoogle } from "../../../utils/googleAuth";

const { height } = Dimensions.get("window");
const HEADER_H = height * 0.32;

export default function LoginScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const login = async () => {
    if (!username.trim()) { setError("Please enter your username"); return; }
    if (username.trim().length < 3) { setError("Username must be at least 3 characters"); return; }
    if (!password.trim()) { setError("Please enter your password"); return; }

    setError(""); setIsLoading(true);
    try {
      const email = usernameToEmail(username.trim().toLowerCase());
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) {
        if (authError.message.includes("Invalid login") || authError.message.includes("invalid_credentials")) {
          setError("Incorrect username or password.");
        } else if (authError.message.includes("Email not confirmed")) {
          setError("Please confirm your email before signing in.");
        } else if (authError.status === 429 || authError.message.includes("Too many requests")) {
          setError("Too many attempts. Please wait before trying again.");
        } else {
          setError("Login failed. Please check your details.");
        }
        setIsLoading(false);
        return;
      }
      // Keep spinner — onAuthStateChange unmounts this component when it navigates.
      setTimeout(() => setIsLoading(false), 10000);
    } catch {
      setError("Connection error. Please try again.");
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(""); setIsLoading(true);
    try {
      await signInWithGoogle();
      setTimeout(() => setIsLoading(false), 10000);
    } catch (err) {
      setError(err.message || "Google sign-in failed. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.imgHeader, { height: HEADER_H, paddingTop: insets.top + 20 }]}>
        <Image source={require("../../../assets/remiwhite.png")} style={styles.logo} resizeMode="contain" />
        <Text style={styles.logoLabel}>Remi</Text>
      </View>

      {/* Card */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          style={styles.card}
          contentContainerStyle={[styles.cardInner, { paddingBottom: Math.max(insets.bottom, 16) + 24 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={16} color="#666666" />
          </TouchableOpacity>

          <Text style={styles.title}>Welcome Back</Text>

          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorTxt}>{error}</Text>
            </View>
          )}

          <TextInput
            style={styles.input}
            placeholder="Enter Username"
            placeholderTextColor="#C0C0C0"
            value={username}
            autoCapitalize="none"
            onChangeText={t => { setUsername(t); if (error) setError(""); }}
            editable={!isLoading}
            maxLength={20}
          />

          <View style={styles.pwdRow}>
            <TextInput
              style={[styles.input, { marginBottom: 0, paddingRight: 54 }]}
              placeholder="Enter Password"
              placeholderTextColor="#C0C0C0"
              value={password}
              secureTextEntry={!showPassword}
              onChangeText={t => { setPassword(t); if (error) setError(""); }}
              editable={!isLoading}
              maxLength={128}
              onSubmitEditing={login}
              returnKeyType="go"
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(v => !v)}>
              <Ionicons name={showPassword ? "eye" : "eye-off"} size={20} color="#BBBBBB" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.mainBtn, { marginTop: 20 }, (isLoading || !username.trim() || !password.trim()) && styles.mainBtnDim]}
            onPress={login}
            disabled={isLoading || !username.trim() || !password.trim()}
            activeOpacity={0.9}
          >
            {isLoading
              ? <ActivityIndicator size="small" color="#FFFFFF" />
              : <Text style={styles.mainBtnTxt}>Log in</Text>
            }
          </TouchableOpacity>

          {/* Social sign-in for returning Google/Apple users */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerTxt}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleSignIn} disabled={isLoading} activeOpacity={0.9}>
            <Svg width={18} height={18} viewBox="0 0 24 24">
              <Path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <Path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <Path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <Path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </Svg>
            <Text style={styles.googleTxt}>Continue with Google</Text>
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
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FFFFFF" },
  imgHeader: {
    alignItems: "center", justifyContent: "center",
    backgroundColor: "#535FFD",
  },
  logo: { width: 58, height: 58 },
  logoLabel: {
    color: "#FFFFFF", fontSize: 17, fontWeight: "600",
    marginTop: 8, letterSpacing: 0.3,
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
  title: { fontSize: 26, fontWeight: "800", color: "#1A1A1A", marginBottom: 24 },
  errorBox: {
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  errorTxt: { color: "#DC2626", fontSize: 13, fontWeight: "500" },
  input: {
    backgroundColor: "#F2F2F2",
    borderRadius: 50,
    paddingHorizontal: 22,
    paddingVertical: 16,
    fontSize: 15,
    color: "#1A1A1A",
    marginBottom: 14,
  },
  pwdRow: { position: "relative" },
  eyeBtn: {
    position: "absolute",
    right: 18, top: 0, bottom: 0,
    justifyContent: "center",
  },
  mainBtn: {
    backgroundColor: "#111111",
    borderRadius: 50,
    paddingVertical: 17,
    alignItems: "center",
  },
  mainBtnDim: { opacity: 0.45 },
  mainBtnTxt: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
    gap: 12,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#EBEBEB" },
  dividerTxt: { color: "#AAAAAA", fontSize: 13, fontWeight: "500" },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#535FFD",
    borderRadius: 50,
    paddingVertical: 17,
    gap: 10,
    marginBottom: 14,
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
});
