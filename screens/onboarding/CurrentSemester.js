import React, { useState, useRef, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  Animated,
  ScrollView,
  Alert,
  Platform,
  SafeAreaView 
} from "react-native";
import { CommonActions } from '@react-navigation/native'; // For programmatic navigation

// Firestore imports
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../../firebase";

export default function CurrentSemester({ navigation, route }) {
  const { nick, course, semesters } = route.params || {}; // Added fallback for undefined params
  const [current, setCurrent] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false); // Track navigation state
  
  // Use useRef for animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Start animations on mount
  useEffect(() => {
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

  // Handle Android back button press
  useEffect(() => {
    let unsubscribe;
    
    if (Platform.OS === 'android') {
      unsubscribe = navigation.addListener('beforeRemove', (e) => {
        // Allow all programmatic navigation (replace, reset, navigate)
        if (e.data.action.type === 'REPLACE' || 
            e.data.action.type === 'RESET' || 
            e.data.action.type === 'NAVIGATE') {
          return; // Allow navigation to proceed
        }
        
        // Only prevent user-triggered back navigation
        if (!isNavigating) {
          e.preventDefault();
          Alert.alert(
            "Complete Onboarding",
            "Please complete your semester selection before going back.",
            [
              { 
                text: "Stay", 
                style: "cancel",
                onPress: () => {} 
              },
              { 
                text: "Go Back", 
                style: "destructive",
                onPress: () => {
                  navigation.navigate("Semesters");
                }
              }
            ]
          );
        }
      });
    }
    
    // Cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [navigation, isNavigating]);

  const saveCurrentSemesterAndProceed = async () => {
    if (!current) {
      Alert.alert(
        "Select Semester",
        "Please select your current semester to continue.",
        [{ text: "OK" }]
      );
      return;
    }

    // Prevent multiple clicks
    if (isNavigating) return;
    
    setIsNavigating(true);

    try {
      // Ensure auth.currentUser exists
      if (!auth.currentUser) {
        Alert.alert("Error", "Please sign in again");
        navigation.replace("Signup");
        setIsNavigating(false);
        return;
      }

      // Save current semester to Firestore
      await setDoc(
        doc(db, "users", auth.currentUser.uid),
        {
          current_semester: current,
          onboarding_completed: true,
          updatedAt: new Date(),
        },
        { merge: true }
      );

      console.log("✅ Current semester saved to Firestore");

      // Use reset for more reliable navigation on both platforms
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Home' }],
        })
      );
      
    } catch (error) {
      console.error("Firestore Error:", error);
      setIsNavigating(false);
      Alert.alert(
        "Error", 
        "Failed to save your selection. Please try again."
      );
    }
  };

  // Add null check for semesters
  if (!semesters || semesters < 1) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Semester data not available</Text>
          <TouchableOpacity 
            style={styles.errorButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Back Button */}
      <View style={[
        styles.header,
        Platform.OS === 'android' && styles.headerAndroid
      ]}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.backBtn} 
            onPress={() => {
              if (!isNavigating) {
                navigation.navigate("Semesters");
              }
            }}
            activeOpacity={0.7}
            disabled={isNavigating}
          >
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>CURRENT SEMESTER</Text>
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
          <Text style={[
            styles.title,
            Platform.OS === 'android' && styles.titleAndroid
          ]}>
            Which semester are you in?
          </Text>
          <Text style={[
            styles.subtitle,
            Platform.OS === 'android' && styles.subtitleAndroid
          ]}>
            Select your current semester from the options below
          </Text>
        </View>

        {/* Semester Selection */}
        <View style={styles.selectionSection}>
          <ScrollView 
            style={styles.semestersScroll}
            showsVerticalScrollIndicator={Platform.OS === 'ios'}
            contentContainerStyle={[
              styles.semestersContainer,
              Platform.OS === 'android' && styles.semestersContainerAndroid
            ]}
            removeClippedSubviews={Platform.OS === 'android'}
            keyboardShouldPersistTaps="handled"
          >
            {semesters > 0 ? (
              [...Array(semesters)].map((_, i) => {
                const semesterNum = i + 1;
                const isSelected = current === semesterNum;
                
                return (
                  <TouchableOpacity
                    key={semesterNum}
                    style={[
                      styles.semesterCard,
                      isSelected && styles.semesterCardSelected,
                      Platform.OS === 'android' && styles.semesterCardAndroid
                    ]}
                    onPress={() => !isNavigating && setCurrent(semesterNum)}
                    activeOpacity={0.7}
                    disabled={isNavigating}
                  >
                    <View style={styles.semesterContent}>
                      <View style={[
                        styles.semesterNumber,
                        isSelected && styles.semesterNumberSelected
                      ]}>
                        <Text style={[
                          styles.semesterNumberText,
                          isSelected && styles.semesterNumberTextSelected
                        ]}>
                          {semesterNum}
                        </Text>
                      </View>
                      <View style={styles.semesterInfo}>
                        <Text style={[
                          styles.semesterTitle,
                          isSelected && styles.semesterTitleSelected
                        ]}>
                          Semester {semesterNum}
                        </Text>
                        <Text style={styles.semesterSubtitle}>
                          {semesterNum === 1 && "First semester"}
                          {semesterNum === semesters && "Final semester"}
                          {semesterNum > 1 && semesterNum < semesters && "Continuing"}
                        </Text>
                      </View>
                    </View>
                    
                    {isSelected && (
                      <View style={[
                        styles.selectedIndicator,
                        Platform.OS === 'android' && styles.selectedIndicatorAndroid
                      ]}>
                        <Text style={styles.selectedIndicatorText}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No semesters available</Text>
              </View>
            )}
          </ScrollView>
        </View>

        {/* Action Button */}
        <View style={styles.buttonSection}>
          <TouchableOpacity 
            style={[
              styles.nextButton,
              current ? styles.nextButtonActive : styles.nextButtonDisabled,
              Platform.OS === 'android' && styles.nextButtonAndroid,
              isNavigating && styles.nextButtonLoading
            ]}
            onPress={saveCurrentSemesterAndProceed}
            disabled={!current || isNavigating}
            activeOpacity={0.8}
          >
            {isNavigating ? (
              <Text style={[
                styles.nextButtonText,
                Platform.OS === 'android' && styles.nextButtonTextAndroid
              ]}>
                Saving...
              </Text>
            ) : (
              <Text style={[
                styles.nextButtonText,
                Platform.OS === 'android' && styles.nextButtonTextAndroid
              ]}>
                Complete Setup
              </Text>
            )}
          </TouchableOpacity>
          
          {Platform.OS === 'android' && !current && !isNavigating && (
            <Text style={styles.androidHint}>
              Tap a semester to select
            </Text>
          )}
          
          {Platform.OS === 'android' && isNavigating && (
            <Text style={styles.androidLoadingText}>
              Completing setup...
            </Text>
          )}
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  // Android-specific safe area handling
  headerAndroid: {
    paddingTop: Platform.OS === 'android' ? 40 : 60,
  },
  // Error state styles
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorButton: {
    backgroundColor: '#535FFD',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Android-specific text adjustments
  titleAndroid: {
    fontSize: 24,
    lineHeight: 32,
  },
  subtitleAndroid: {
    fontSize: 14,
    lineHeight: 20,
  },
  // Android-specific scroll view adjustments
  semestersContainerAndroid: {
    paddingBottom: 30,
  },
  // Android-specific card adjustments
  semesterCardAndroid: {
    marginBottom: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  semesterCardSelected: {
    borderColor: "#535FFD",
    backgroundColor: "#F0F9FF",
    shadowColor: "#535FFD",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: Platform.OS === 'android' ? 8 : 3,
  },
  // Android-specific selected indicator
  selectedIndicatorAndroid: {
    elevation: 3,
  },
  // Android-specific button adjustments
  nextButtonAndroid: {
    elevation: 4,
    borderRadius: 12,
  },
  nextButtonLoading: {
    backgroundColor: "#8B93FF",
  },
  nextButtonTextAndroid: {
    fontSize: 16,
  },
  // Android hint text
  androidHint: {
    textAlign: 'center',
    color: '#64748B',
    fontSize: 14,
    marginTop: 10,
  },
  androidLoadingText: {
    textAlign: 'center',
    color: '#535FFD',
    fontSize: 14,
    marginTop: 10,
    fontStyle: 'italic',
  },
  // Empty state
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#94A3B8',
  },
  // Original styles
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
    marginTop: 30,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: "#64748B",
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  selectionSection: {
    flex: 1,
    marginBottom: 40,
  },
  semestersScroll: {
    flex: 1,
  },
  semestersContainer: {
    paddingBottom: 20,
  },
  semesterCard: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 2,
    borderColor: "transparent",
  },
  semesterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  semesterNumber: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#F1F5F9",
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  semesterNumberSelected: {
    backgroundColor: "#535FFD",
  },
  semesterNumberText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#64748B",
  },
  semesterNumberTextSelected: {
    color: "#FFFFFF",
  },
  semesterInfo: {
    flex: 1,
  },
  semesterTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#383940",
    marginBottom: 4,
  },
  semesterTitleSelected: {
    color: "#535FFD",
  },
  semesterSubtitle: {
    fontSize: 14,
    color: "#64748B",
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#10B981",
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedIndicatorText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  buttonSection: {
    marginBottom: 40,
  },
  nextButton: {
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonActive: {
    backgroundColor: "#535FFD",
    shadowColor: "#535FFD",
    shadowOpacity: 0.3,
  },
  nextButtonDisabled: {
    backgroundColor: "#E2E8F0",
  },
  nextButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
});