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
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../../firebase";
import { doc, getDoc, query, collection, where, getDocs } from "firebase/firestore";
import SvgIcon from "../../../components/SvgIcon";
import { usernameToEmail, validateUsernameFormat } from "../../../utils/usernameHelper";
import { styles } from './LoginScreen.styles';

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
          routes: [{ name: 'SplashIntro' }],
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
              placeholderTextColor="#94A3B8"
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

      </>
    );
  }
}
