import React, { useState, useRef, useEffect } from "react";
import { 
  View, 
  Text,
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
import { auth, db } from "../../../firebase";
import { styles } from './CurrentSemester.styles';

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
                  navigation.navigate("Units");
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


      // Use reset for more reliable navigation on both platforms
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Home' }],
        })
      );
      
    } catch (error) {
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
