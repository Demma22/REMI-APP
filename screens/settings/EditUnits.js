import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated
} from "react-native";

import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../../firebase";

export default function EditUnits({ navigation }) {
  const [units, setUnits] = useState({});
  const [totalSemesters, setTotalSemesters] = useState(0);
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
          const total = userData.total_semesters || 0;
          const userUnits = userData.units || {};
          
          setTotalSemesters(total);
          setUnits(userUnits);
        }
      } catch (error) {
        console.log("Error loading user data:", error);
        Alert.alert("Error", "Could not load your course units");
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

  const updateUnit = (semester, unitIndex, value) => {
    const copy = { ...units };
    if (!copy[semester]) copy[semester] = [];
    copy[semester][unitIndex] = value;
    setUnits(copy);
  };

  const addUnit = (semester) => {
    const copy = { ...units };
    if (!copy[semester]) copy[semester] = [];
    copy[semester].push("");
    setUnits(copy);
  };

  const removeUnit = (semester, unitIndex) => {
    const copy = { ...units };
    if (copy[semester] && copy[semester].length > 1) {
      copy[semester].splice(unitIndex, 1);
      setUnits(copy);
    }
  };

  const saveUnits = async () => {
    setLoading(true);

    try {
      // Clean empty units
      const cleanedUnits = {};
      Object.keys(units).forEach(semester => {
        const nonEmptyUnits = units[semester].filter(unit => unit.trim() !== "");
        if (nonEmptyUnits.length > 0) {
          cleanedUnits[semester] = nonEmptyUnits;
        }
      });

      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        units: cleanedUnits,
        updatedAt: new Date(),
      });

      Alert.alert(
        "Success", 
        "Your course units have been updated!",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
      
    } catch (error) {
      console.error("Firestore Error:", error);
      Alert.alert("Error", "Failed to save course units. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

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
          <Text style={styles.headerTitle}>EDIT COURSE UNITS</Text>
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
          <Text style={styles.title}>Manage Your Course Units</Text>
          <Text style={styles.subtitle}>
            Update your course units for each semester. Add, edit, or remove courses as needed.
          </Text>
        </View>

        {/* Semester Units */}
        <ScrollView 
          style={styles.unitsScroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.unitsContainer}
        >
          {totalSemesters > 0 ? (
            [...Array(totalSemesters)].map((_, i) => {
              const semesterNum = (i + 1).toString();
              const semesterUnits = units[semesterNum] || [""];
              
              return (
                <View key={semesterNum} style={styles.semesterCard}>
                  <View style={styles.semesterHeader}>
                    <Text style={styles.semesterTitle}>Semester {semesterNum}</Text>
                    <View style={styles.courseCount}>
                      <Text style={styles.courseCountText}>
                        {semesterUnits.filter(unit => unit.trim() !== "").length} courses
                      </Text>
                    </View>
                  </View>

                  <View style={styles.coursesList}>
                    {semesterUnits.map((unit, unitIndex) => (
                      <View key={unitIndex} style={styles.inputRow}>
                        <TextInput
                          style={styles.input}
                          placeholder={`Course ${unitIndex + 1}`}
                          value={unit}
                          onChangeText={(v) => updateUnit(semesterNum, unitIndex, v)}
                          placeholderTextColor="#94A3B8"
                        />
                        {semesterUnits.length > 1 && (
                          <TouchableOpacity 
                            style={styles.removeBtn}
                            onPress={() => removeUnit(semesterNum, unitIndex)}
                          >
                            <Text style={styles.removeBtnText}>×</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    ))}
                  </View>

                  <TouchableOpacity 
                    style={styles.addBtn} 
                    onPress={() => addUnit(semesterNum)}
                  >
                    <Text style={styles.addBtnText}>+ Add Course</Text>
                  </TouchableOpacity>
                </View>
              );
            })
          ) : (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>
                No semester data found. Please complete your profile first.
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.buttonSection}>
          <TouchableOpacity 
            style={[
              styles.saveButton,
              styles.saveButtonActive
            ]}
            onPress={saveUnits}
            disabled={loading}
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
    marginBottom: 30,
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
  },
  unitsScroll: {
    flex: 1,
  },
  unitsContainer: {
    paddingBottom: 20,
  },
  noDataContainer: {
    alignItems: 'center',
    padding: 40,
  },
  noDataText: {
    fontSize: 16,
    color: "#64748B",
    textAlign: 'center',
    lineHeight: 22,
  },
  semesterCard: {
    backgroundColor: "#FFFFFF",
    padding: 24,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  semesterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  semesterTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#383940",
  },
  courseCount: {
    backgroundColor: "rgba(83, 95, 253, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  courseCountText: {
    color: "#535FFD",
    fontSize: 12,
    fontWeight: "600",
  },
  coursesList: {
    gap: 12,
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: "#FAFAFA",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    color: "#383940",
  },
  removeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  removeBtnText: {
    color: "#DC2626",
    fontSize: 18,
    fontWeight: "700",
  },
  addBtn: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#535FFD",
    borderStyle: "dashed",
  },
  addBtnText: {
    color: "#535FFD",
    fontSize: 14,
    fontWeight: "600",
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