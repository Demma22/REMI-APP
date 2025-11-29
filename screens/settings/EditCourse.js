import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity,
  Alert,
  Animated
} from "react-native";

import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../../firebase";

export default function EditCourse({ navigation }) {
  const [course, setCourse] = useState("");
  const [originalCourse, setOriginalCourse] = useState("");
  const [isValid, setIsValid] = useState(false);
  const [isTouched, setIsTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(30);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userDocRef = doc(db, "users", auth.currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const currentCourse = userData.course || "";
          
          setCourse(currentCourse);
          setOriginalCourse(currentCourse);
          validateCourse(currentCourse);
        }
      } catch (error) {
        console.log("Error loading user data:", error);
        Alert.alert("Error", "Could not load your course information");
      }
    };

    loadUserData();

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const validateCourse = (text) => {
    setCourse(text);
    setIsTouched(true);
    
    const trimmedText = text.trim();
    const isValidLength = trimmedText.length >= 3 && trimmedText.length <= 50;
    const notEmpty = trimmedText.length > 0;
    
    setIsValid(isValidLength && notEmpty);
  };

  const saveCourse = async () => {
    if (!isValid) {
      Alert.alert(
        "Invalid Course Name",
        "Please enter a course between 3–50 characters."
      );
      return;
    }

    const trimmedCourse = course.trim();

    // Check if course actually changed
    if (trimmedCourse === originalCourse) {
      Alert.alert("No Changes", "Your course name hasn't changed.");
      return;
    }

    setLoading(true);

    try {
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        course: trimmedCourse,
        updatedAt: new Date(),
      });

      Alert.alert(
        "Success", 
        "Your course has been updated!",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
      
    } catch (error) {
      console.error("Firestore Error:", error);
      Alert.alert("Error", "Failed to save your course. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  const getValidationMessage = () => {
    if (!isTouched || course.trim().length === 0) return null;
    
    const trimmed = course.trim();
    
    if (trimmed.length < 3) return "Course must be at least 3 characters";
    if (trimmed.length > 50) return "Course must be 50 characters or less";
    
    return "Looks good!";
  };

  const getValidationColor = () => {
    if (!isTouched || course.trim().length === 0) return "#64748B";
    return isValid ? "#10B981" : "#EF4444";
  };

  const hasChanges = course.trim() !== originalCourse;

  return (
    <View style={styles.container}>
      {/* Background Design */}
      <View style={styles.background}>
        <View style={[styles.circle, styles.circle1]} />
        <View style={[styles.circle, styles.circle2]} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.backBtn} 
            onPress={handleCancel}
          >
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>EDIT COURSE</Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        {/* Header Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Update Your Course</Text>
          <Text style={styles.subtitle}>
            Change your course or program name
          </Text>

          {originalCourse && (
            <View style={styles.currentInfo}>
              <Text style={styles.currentLabel}>Current course:</Text>
              <Text style={styles.currentCourse}>{originalCourse}</Text>
            </View>
          )}
        </View>

        {/* Input Section */}
        <View style={styles.inputSection}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Course Name</Text>
            <TextInput
              style={[
                styles.input,
                isTouched && {
                  borderColor: getValidationColor(),
                  backgroundColor: isValid ? "#F0F9FF" : "#FFFFFF"
                }
              ]}
              placeholder="e.g., Computer Science, Business Administration..."
              placeholderTextColor="#94A3B8"
              value={course}
              onChangeText={validateCourse}
              autoCapitalize="words"
              autoCorrect={false}
              maxLength={50}
              returnKeyType="done"
            />

            <View style={styles.counterContainer}>
              <Text style={styles.counterText}>{course.length}/50</Text>
            </View>
          </View>

          {isTouched && course.trim().length > 0 && (
            <View style={styles.validationContainer}>
              <Text style={[styles.validationText, { color: getValidationColor() }]}>
                {getValidationMessage()}
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonSection}>
          <TouchableOpacity 
            style={[
              styles.saveButton,
              hasChanges && isValid ? styles.saveButtonActive : styles.saveButtonDisabled
            ]}
            onPress={saveCourse}
            disabled={!hasChanges || !isValid || loading}
          >
            <Text style={styles.saveButtonText}>
              {loading ? "Saving..." : "Save Changes"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={handleCancel}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  background: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  circle: {
    position: 'absolute',
    borderRadius: 500,
  },
  circle1: {
    top: -100,
    right: -100,
    width: 250,
    height: 250,
    backgroundColor: 'rgba(83, 95, 253, 0.08)',
  },
  circle2: {
    bottom: -150,
    left: -100,
    width: 300,
    height: 300,
    backgroundColor: 'rgba(247, 133, 34, 0.06)',
  },
  header: {
    backgroundColor: "#FFFFFF",
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FAFAFA",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  backText: { 
    fontSize: 24, 
    color: "#535FFD", 
    fontWeight: "300",
    lineHeight: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#383940",
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  titleSection: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#383940",
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: "#64748B",
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  currentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "rgba(83, 95, 253, 0.1)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  currentLabel: {
    fontSize: 14,
    color: "#535FFD",
    fontWeight: "600",
    marginRight: 8,
  },
  currentCourse: {
    fontSize: 14,
    color: "#535FFD",
    fontWeight: "700",
  },
  inputSection: {
    marginBottom: 40,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#383940",
    marginBottom: 12,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#F1F5F9",
    padding: 18,
    borderRadius: 16,
    fontSize: 18,
    color: "#383940",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  counterContainer: {
    position: 'absolute',
    top: 18,
    right: 18,
  },
  counterText: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: '500',
  },
  validationContainer: {
    marginTop: 12,
  },
  validationText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  buttonSection: {
    marginBottom: 40,
  },
  saveButton: {
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonActive: {
    backgroundColor: "#535FFD",
    shadowColor: "#535FFD",
    shadowOpacity: 0.3,
  },
  saveButtonDisabled: {
    backgroundColor: "#E2E8F0",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  cancelButton: {
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E2E8F0",
    backgroundColor: "transparent",
  },
  cancelButtonText: {
    color: "#64748B",
    fontSize: 16,
    fontWeight: "600",
  },
});