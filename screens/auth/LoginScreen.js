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
import { doc, getDoc, query, collection, where, getDocs } from "firebase/firestore";
import SvgIcon from "../../components/SvgIcon";
import { usernameToEmail, validateUsernameFormat } from "../../utils/usernameHelper";

const { height } = Dimensions.get("window");

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const getFirebaseEmail = async (input) => {
    const usernameValidation = validateUsernameFormat(input);
    
    if (usernameValidation.valid) {
      return usernameToEmail(input);
    } else {
      if (input.includes('@')) {
        return input;
      }
      return usernameToEmail(input);
    }
  };

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
      return false;
    }
  };

  const findUserByUsername = async (usernameInput) => {
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("username", "==", usernameInput.trim().toLowerCase()));
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      return false;
    }
  };

  const login = async () => {
    if (!validateForm()) {
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const firebaseEmail = await getFirebaseEmail(username);
      const cleanUsername = username.trim().toLowerCase();
      
      const userCredential = await signInWithEmailAndPassword(auth, firebaseEmail, password);
      const user = userCredential.user;
      
      const isOnboardingCompleted = await checkOnboardingStatus(user.uid);
      
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
      const userExists = await findUserByUsername(username);
      
      switch (error.code) {
        case 'auth/invalid-email':
          setError("Invalid username format");
          break;
        case 'auth/user-disabled':
          setError("This account has been disabled");
          break;
        case 'auth/user-not-found':
          if (userExists) {
            setError("Incorrect password for this username");
          } else {
            setError("No account found with this username");
          }
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
        case 'auth/invalid-credential':
          setError("Invalid login credentials. Please try again.");
          break;
        default:
          setError("Login failed. Please check your credentials and try again.");
      }
      
      setIsLoading(false);
      return;
    }
    
    setIsLoading(false);
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
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>
            Sign in to continue your academic journey
          </Text>
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
              <SvgIcon name="user" size={16} color="#64748B" style={styles.inputIcon} />
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
              placeholderTextColor="#94A3B8"
              editable={!isLoading}
              maxLength={20}
            />
            <View style={styles.usernameHintContainer}>
              <SvgIcon name="info" size={14} color="#94A3B8" style={styles.hintIcon} />
              <Text style={styles.usernameHint}>
                Use the username you created
              </Text>
            </View>
          </View>

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
                editable={!isLoading}
                onSubmitEditing={login}
                returnKeyType="go"
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

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Product of the @SND group</Text>
          <View style={styles.dividerLine} />
        </View>
      </>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollViewAndroid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  scrollContentAndroid: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    paddingTop: 20,
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
  loginButton: {
    backgroundColor: "#535FFD",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
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
});