// screens/gpa/CurriculumSelector/CurriculumSelectorScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  Alert,
} from "react-native";
import { auth, db } from "../../../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import NavigationBar from "../../../components/NavigationBar";
import SvgIcon from "../../../components/SvgIcon";
import { useTheme } from "../../../contexts/ThemeContext";
import { getStyles } from "./CurriculumSelectorScreen.styles";
import { getAllCountries, GRADING_SCALES } from "../../../utils/gradingScales";

export default function CurriculumSelectorScreen({ navigation }) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  
  const [selectedCurriculum, setSelectedCurriculum] = useState("uganda");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [selectedScale, setSelectedScale] = useState(null);
  
  const curriculums = getAllCountries();

  useEffect(() => {
    loadUserCurriculum();
  }, []);

  const loadUserCurriculum = async () => {
    try {
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        if (data.selected_curriculum) {
          setSelectedCurriculum(data.selected_curriculum);
        }
      }
    } catch (error) {
      console.error("Error loading curriculum:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      await setDoc(userDocRef, { 
        selected_curriculum: selectedCurriculum,
        grading_scale: GRADING_SCALES[selectedCurriculum]
      }, { merge: true });
      
      Alert.alert(
        "Success", 
        `Grading system updated to ${GRADING_SCALES[selectedCurriculum].name}`,
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to save curriculum");
    } finally {
      setSaving(false);
    }
  };

  const showScaleDetails = (curriculumId) => {
    setSelectedScale(GRADING_SCALES[curriculumId]);
    setShowInfoModal(true);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <SvgIcon name="arrow-back" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Curriculum</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
        <NavigationBar />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <SvgIcon name="arrow-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Curriculum</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.introCard}>
          <SvgIcon name="graduation-cap" size={48} color={theme.colors.primary} />
          <Text style={styles.introTitle}>Choose Your Grading System</Text>
          <Text style={styles.introText}>
            Select the grading scale used by your institution for accurate GPA calculations
          </Text>
        </View>

        {curriculums.map((curriculum) => {
          const isSelected = selectedCurriculum === curriculum.id;
          const scale = GRADING_SCALES[curriculum.id];
          
          return (
            <TouchableOpacity
              key={curriculum.id}
              style={[
                styles.curriculumCard,
                isSelected && styles.curriculumCardSelected
              ]}
              onPress={() => setSelectedCurriculum(curriculum.id)}
            >
              <View style={styles.curriculumHeader}>
                <View style={styles.curriculumIcon}>
                  <SvgIcon 
                    name="flag" 
                    size={24} 
                    color={isSelected ? theme.colors.primary : theme.colors.textSecondary} 
                  />
                </View>
                <View style={styles.curriculumInfo}>
                  <Text style={[
                    styles.curriculumName,
                    isSelected && styles.curriculumNameSelected
                  ]}>
                    {scale.name}
                  </Text>
                  <Text style={styles.curriculumCountry}>{scale.country}</Text>
                  <Text style={styles.curriculumScale}>Scale: {scale.scale}</Text>
                </View>
                {isSelected && (
                  <View style={styles.checkIcon}>
                    <SvgIcon name="check-circle" size={24} color={theme.colors.primary} />
                  </View>
                )}
              </View>
              
              <TouchableOpacity 
                style={styles.infoButton}
                onPress={() => showScaleDetails(curriculum.id)}
              >
                <SvgIcon name="info" size={16} color={theme.colors.textSecondary} />
                <Text style={styles.infoButtonText}>View grading scale</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity 
          style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <SvgIcon name="save" size={20} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Save Curriculum</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Info Modal */}
      <Modal
        visible={showInfoModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowInfoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>
                {selectedScale?.name} - Grading Scale
              </Text>
              <TouchableOpacity onPress={() => setShowInfoModal(false)}>
                <SvgIcon name="close" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <Text style={[styles.modalCountry, { color: theme.colors.textSecondary }]}>
                {selectedScale?.country}
              </Text>
              <Text style={[styles.modalDesc, { color: theme.colors.textTertiary }]}>
                {selectedScale?.description}
              </Text>
              
              <View style={styles.gradeTable}>
                <View style={styles.gradeTableHeader}>
                  <Text style={styles.gradeTableHeaderText}>Marks (%)</Text>
                  <Text style={styles.gradeTableHeaderText}>Grade</Text>
                  <Text style={styles.gradeTableHeaderText}>Points</Text>
                </View>
                
                {selectedScale?.id === 'uganda' && (
                  <>
                    <View style={styles.gradeRow}><Text style={styles.gradeRowText}>80-100</Text><Text style={styles.gradeRowText}>A</Text><Text style={styles.gradeRowText}>5.0</Text></View>
                    <View style={styles.gradeRow}><Text style={styles.gradeRowText}>75-79</Text><Text style={styles.gradeRowText}>A-</Text><Text style={styles.gradeRowText}>4.5</Text></View>
                    <View style={styles.gradeRow}><Text style={styles.gradeRowText}>70-74</Text><Text style={styles.gradeRowText}>B+</Text><Text style={styles.gradeRowText}>4.0</Text></View>
                    <View style={styles.gradeRow}><Text style={styles.gradeRowText}>65-69</Text><Text style={styles.gradeRowText}>B</Text><Text style={styles.gradeRowText}>3.5</Text></View>
                    <View style={styles.gradeRow}><Text style={styles.gradeRowText}>60-64</Text><Text style={styles.gradeRowText}>B-</Text><Text style={styles.gradeRowText}>3.0</Text></View>
                    <View style={styles.gradeRow}><Text style={styles.gradeRowText}>55-59</Text><Text style={styles.gradeRowText}>C+</Text><Text style={styles.gradeRowText}>2.5</Text></View>
                    <View style={styles.gradeRow}><Text style={styles.gradeRowText}>50-54</Text><Text style={styles.gradeRowText}>C</Text><Text style={styles.gradeRowText}>2.0</Text></View>
                    <View style={styles.gradeRow}><Text style={styles.gradeRowText}>0-49</Text><Text style={styles.gradeRowText}>F</Text><Text style={styles.gradeRowText}>0.0</Text></View>
                  </>
                )}
                
                {selectedScale?.id === 'usa' && (
                  <>
                    <View style={styles.gradeRow}><Text style={styles.gradeRowText}>90-100</Text><Text style={styles.gradeRowText}>A</Text><Text style={styles.gradeRowText}>4.0</Text></View>
                    <View style={styles.gradeRow}><Text style={styles.gradeRowText}>80-89</Text><Text style={styles.gradeRowText}>B</Text><Text style={styles.gradeRowText}>3.0</Text></View>
                    <View style={styles.gradeRow}><Text style={styles.gradeRowText}>70-79</Text><Text style={styles.gradeRowText}>C</Text><Text style={styles.gradeRowText}>2.0</Text></View>
                    <View style={styles.gradeRow}><Text style={styles.gradeRowText}>60-69</Text><Text style={styles.gradeRowText}>D</Text><Text style={styles.gradeRowText}>1.0</Text></View>
                    <View style={styles.gradeRow}><Text style={styles.gradeRowText}>0-59</Text><Text style={styles.gradeRowText}>F</Text><Text style={styles.gradeRowText}>0.0</Text></View>
                  </>
                )}
              </View>
            </ScrollView>
            
            <TouchableOpacity
              style={[styles.modalClose, { backgroundColor: theme.colors.primary }]}
              onPress={() => setShowInfoModal(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <NavigationBar />
    </View>
  );
}
