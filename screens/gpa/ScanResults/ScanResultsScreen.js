// screens/gpa/ScanResults/ScanResultsScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  ImageBackground,
  Animated,
  Dimensions,
} from 'react-native';
import { auth, db } from '../../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useTheme } from '../../../contexts/ThemeContext';
import SvgIcon from '../../../components/SvgIcon';
import NavigationBar from '../../../components/NavigationBar';
import { pickAndScanResultsWithUri, takePhotoAndScanResultsWithUri } from '../../../utils/smartResultsScanner';
import { getAllCountries, GRADING_SCALES } from '../../../utils/gradingScales';
import { getStyles } from './ScanResultsScreen.styles';

const { width, height } = Dimensions.get('window');

export default function ScanResultsScreen({ navigation }) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  
  const [saving, setSaving] = useState(false);
  const [scanStage, setScanStage] = useState('idle'); // idle, loading, scanning, confirming
  const [selectedCurriculum, setSelectedCurriculum] = useState(null);
  const [showCurriculumModal, setShowCurriculumModal] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [userSemesters, setUserSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [showSemesterModal, setShowSemesterModal] = useState(false);
  const [userCourses, setUserCourses] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [capturedImageUri, setCapturedImageUri] = useState(null);
  
  // Animation values
  const scanLineY = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  
  // Store the scan result before showing animation
  const pendingScanResult = useRef(null);
  
  const curriculums = getAllCountries();
  
  const scanningMessages = [
    { text: "Analyzing document layout...", duration: 1500 },
    { text: "Detecting text areas...", duration: 1500 },
    { text: "Reading course names...", duration: 1500 },
    { text: "Extracting marks...", duration: 1500 },
    { text: "Calculating percentages...", duration: 1500 },
    { text: "Converting to grade points...", duration: 1500 },
    { text: "Finalizing GPA...", duration: 1500 },
  ];

  useEffect(() => {
    loadUserData();
  }, []);

  const startScanningAnimations = () => {
    // Reset animations
    scanLineY.setValue(0);
    pulseAnim.setValue(1);
    progressAnim.setValue(0);
    setCurrentMessageIndex(0);
    
    // Animate scanning line
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineY, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineY, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
    
    // Pulse animation for scanner icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ])
    ).start();
    
    // Progress bar animation
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 10500,
      useNativeDriver: false,
    }).start();
    
    // Rotate through messages
    let messageIndex = 0;
    const messageInterval = setInterval(() => {
      messageIndex++;
      if (messageIndex < scanningMessages.length) {
        setCurrentMessageIndex(messageIndex);
      } else {
        clearInterval(messageInterval);
      }
    }, 1500);
    
    return () => clearInterval(messageInterval);
  };

  const loadUserData = async () => {
    try {
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        if (data.selected_curriculum) {
          setSelectedCurriculum(data.selected_curriculum);
        }
        
        const units = data.units || {};
        const semesters = Object.keys(units).sort((a, b) => parseInt(a) - parseInt(b));
        setUserSemesters(semesters);
        
        const allCourses = [];
        Object.keys(units).forEach(sem => {
          units[sem].forEach(course => {
            allCourses.push({
              name: course,
              semester: sem
            });
          });
        });
        setUserCourses(allCourses);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const handleScan = async (isCamera = false) => {
    if (!selectedCurriculum) {
      Alert.alert('Select Grading System', 'Please select a grading system first.');
      setShowCurriculumModal(true);
      return;
    }
    
    setErrorMessage('');
    
    // Show loading state immediately
    setScanStage('loading');
    
    try {
      let result;
      let imageUri;
      
      // Get the image and scan result
      if (isCamera) {
        const response = await takePhotoAndScanResultsWithUri(selectedCurriculum);
        imageUri = response.uri;
        result = response.scanResult;
      } else {
        const response = await pickAndScanResultsWithUri(selectedCurriculum);
        imageUri = response.uri;
        result = response.scanResult;
      }
      
      if (!imageUri) {
        // User cancelled
        setScanStage('idle');
        return;
      }
      
      // Store the result for later
      pendingScanResult.current = result;
      
      // Set the image and start animation immediately
      setCapturedImageUri(imageUri);
      setScanStage('scanning');
      startScanningAnimations();
      
      // Wait for animation to complete, then show results
      setTimeout(() => {
        if (pendingScanResult.current && pendingScanResult.current.success && 
            pendingScanResult.current.results && pendingScanResult.current.results.length > 0) {
          setScannedData(pendingScanResult.current);
          setScanStage('confirming');
          pendingScanResult.current = null;
        } else {
          setScanStage('idle');
          setCapturedImageUri(null);
          Alert.alert('No Results Found', pendingScanResult.current?.error || 'Could not detect course results. Please try with a clearer image.');
          pendingScanResult.current = null;
        }
      }, 10500);
      
    } catch (error) {
      console.error('Scan error:', error);
      Alert.alert('Scan Failed', error.message || 'Failed to scan. Please try again.');
      setErrorMessage(error.message);
      setScanStage('idle');
      setCapturedImageUri(null);
      pendingScanResult.current = null;
    }
  };

  const handleSave = async () => {
    if (!selectedSemester) {
      Alert.alert('Select Semester', 'Please select which semester these results belong to.');
      setShowSemesterModal(true);
      return;
    }
    
    setSaving(true);
    try {
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      let existingGpaData = {};
      if (userDoc.exists && userDoc.data().gpa_data) {
        existingGpaData = userDoc.data().gpa_data;
      }
      
      const semesterKey = `semester${selectedSemester}`;
      const scale = GRADING_SCALES[selectedCurriculum];
      
      const coursesData = scannedData.results.map(course => {
        const marks = course.percentage || course.marks || 0;
        const credits = course.credits || 3;
        const gradePoint = course.gradePoint || scale.getGradePoint(marks);
        const gradeLetter = course.gradeLetter || scale.getGradeLetter(marks);
        const qualityPoints = credits * gradePoint;
        
        return {
          name: course.name || "Unknown Course",
          marks: parseFloat(marks),
          grade: gradeLetter,
          creditUnits: parseFloat(credits),
          gradePoints: parseFloat(gradePoint),
          qualityPoints: parseFloat(qualityPoints)
        };
      });
      
      const gpaData = {
        semester: semesterKey,
        semesterNumber: parseInt(selectedSemester),
        gpa: scannedData.gpa,
        totalCreditUnits: scannedData.totalCredits,
        totalQualityPoints: scannedData.totalQualityPoints,
        courses: coursesData,
        scannedAt: new Date().toISOString(),
        scannedVia: "ocr_ai"
      };
      
      existingGpaData[semesterKey] = gpaData;
      
      await setDoc(userDocRef, { gpa_data: existingGpaData }, { merge: true });
      
      Alert.alert(
        'Success!', 
        `GPA ${scannedData.gpa} saved for Semester ${selectedSemester}\n\nClassification: ${scannedData.classification}`,
        [
          { 
            text: 'View GPA', 
            onPress: () => navigation.replace('GPA') 
          }
        ]
      );
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save results: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRescan = () => {
    setScanStage('idle');
    setScannedData(null);
    setSelectedSemester(null);
    setErrorMessage('');
    setCapturedImageUri(null);
    setCurrentMessageIndex(0);
    progressAnim.setValue(0);
    pendingScanResult.current = null;
  };

  const formatSemesterName = (semesterNum) => {
    return `Semester ${semesterNum}`;
  };

  const getSelectedCurriculumName = () => {
    if (!selectedCurriculum) return 'Select Grading System';
    const scale = GRADING_SCALES[selectedCurriculum];
    return scale?.name || 'Select Grading System';
  };

  const scanLineTranslate = scanLineY.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 200],
  });
  
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });
  
  const currentMsg = scanningMessages[currentMessageIndex] || scanningMessages[0];

  // LOADING STATE - Show while waiting for image picker result
  if (scanStage === 'loading') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingTitle}>Wait a moment</Text>
        <Text style={styles.loadingSubtitle}>Processing your selection...</Text>
      </View>
    );
  }

  // SCANNING OVERLAY - Show the image with animation while processing
  if (scanStage === 'scanning' && capturedImageUri) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <ImageBackground 
          source={{ uri: capturedImageUri }} 
          style={styles.scanImageBackground}
          imageStyle={styles.scanImageStyle}
          resizeMode="contain"
        >
          {/* Dark overlay */}
          <View style={[styles.scanDarkOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]} />
          
          {/* Scanning Line */}
          <Animated.View 
            style={[
              styles.scanLine,
              { 
                backgroundColor: theme.colors.primary,
                transform: [{ translateY: scanLineTranslate }],
                top: '30%',
              }
            ]} 
          />
          
          {/* Center Scanner Icon with Pulse */}
          <Animated.View 
            style={[
              styles.centerScanner,
              { transform: [{ scale: pulseAnim }] }
            ]}
          >
            <View style={[styles.scannerCircle, { backgroundColor: theme.colors.primary + '40', borderColor: theme.colors.primary }]}>
              <SvgIcon name="scan" size={40} color={theme.colors.primary} />
            </View>
          </Animated.View>
          
          {/* Bottom Progress Section */}
          <View style={styles.scanProgressSection}>
            <View style={[styles.scanProgressBarContainer, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Animated.View 
                style={[
                  styles.scanProgressFill, 
                  { 
                    backgroundColor: theme.colors.primary,
                    width: progressWidth
                  }
                ]} 
              />
            </View>
            
            <View style={styles.scanStatusContainer}>
              <Text style={[styles.scanStatusText, { color: '#FFFFFF' }]}>
                {currentMsg.text}
              </Text>
            </View>
            
            <View style={styles.scanWaitContainer}>
              <Text style={styles.scanWaitText}>
                Please wait while AI analyzes your document...
              </Text>
            </View>
          </View>
        </ImageBackground>
      </View>
    );
  }

  // CONFIRMING SCREEN - Show results after scan
  if (scanStage === 'confirming' && scannedData) {
    const scale = GRADING_SCALES[selectedCurriculum];
    
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleRescan} style={styles.backBtn}>
            <SvgIcon name="arrow-back" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan Results</Text>
          <View style={styles.headerSpacer} />
        </View>
        
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* GPA Summary Card */}
          <View style={[styles.gpaSummaryCard, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.gpaSummaryTitle}>CALCULATED GPA</Text>
            <Text style={styles.gpaSummaryValue}>{scannedData.gpa}</Text>
            <Text style={styles.gpaSummaryClassification}>{scannedData.classification}</Text>
            <View style={styles.gpaSummaryStats}>
              <View style={styles.gpaStat}>
                <Text style={styles.gpaStatValue}>{scannedData.results.length}</Text>
                <Text style={styles.gpaStatLabel}>Courses</Text>
              </View>
              <View style={styles.gpaStat}>
                <Text style={styles.gpaStatValue}>{scannedData.totalCredits}</Text>
                <Text style={styles.gpaStatLabel}>Credits</Text>
              </View>
              <View style={styles.gpaStat}>
                <Text style={styles.gpaStatValue}>{scannedData.totalQualityPoints.toFixed(2)}</Text>
                <Text style={styles.gpaStatLabel}>Quality Points</Text>
              </View>
            </View>
          </View>
          
          {/* Curriculum Info */}
          <View style={styles.curriculumInfo}>
            <Text style={styles.curriculumInfoText}>
              Using: {scale?.name || selectedCurriculum || 'Uganda'} grading system
            </Text>
          </View>
          
          {/* Semester Selection */}
          <TouchableOpacity 
            style={styles.semesterSelector}
            onPress={() => setShowSemesterModal(true)}
          >
            <Text style={styles.semesterSelectorText}>
              {selectedSemester ? formatSemesterName(selectedSemester) : 'Select Semester'}
            </Text>
            <SvgIcon name="chevron-down" size={16} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          
          {/* Courses List */}
          <Text style={styles.sectionTitle}>Detected Courses</Text>
          
          {scannedData.results.map((course, idx) => {
            const marks = course.percentage || course.marks || 0;
            const credits = course.credits || 3;
            const gradePoint = course.gradePoint || scale.getGradePoint(marks);
            const gradeLetter = course.gradeLetter || scale.getGradeLetter(marks);
            
            return (
              <View key={idx} style={styles.courseCard}>
                <View style={styles.courseHeader}>
                  <Text style={styles.courseName}>{course.name}</Text>
                  <View style={styles.courseBadge}>
                    <Text style={styles.courseBadgeText}>{gradeLetter}</Text>
                  </View>
                </View>
                
                <View style={styles.courseDetails}>
                  <View style={styles.courseDetail}>
                    <Text style={styles.courseDetailLabel}>Total Marks</Text>
                    <Text style={styles.courseDetailValue}>
                      {course.totalMarks || Math.round(marks)} / {course.maxMarks || 100}
                    </Text>
                  </View>
                  <View style={styles.courseDetail}>
                    <Text style={styles.courseDetailLabel}>Percentage</Text>
                    <Text style={styles.courseDetailValue}>{marks.toFixed(1)}%</Text>
                  </View>
                  <View style={styles.courseDetail}>
                    <Text style={styles.courseDetailLabel}>Grade Points</Text>
                    <Text style={styles.courseDetailValue}>{gradePoint.toFixed(1)}</Text>
                  </View>
                  <View style={styles.courseDetail}>
                    <Text style={styles.courseDetailLabel}>Credits</Text>
                    <Text style={styles.courseDetailValue}>{credits}</Text>
                  </View>
                  {course.iaMarks !== undefined && course.iaMarks !== null && (
                    <View style={styles.courseDetail}>
                      <Text style={styles.courseDetailLabel}>IA Marks</Text>
                      <Text style={styles.courseDetailValue}>{course.iaMarks}</Text>
                    </View>
                  )}
                  {course.ueMarks !== undefined && course.ueMarks !== null && (
                    <View style={styles.courseDetail}>
                      <Text style={styles.courseDetailLabel}>UE Marks</Text>
                      <Text style={styles.courseDetailValue}>{course.ueMarks}</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
          
          {/* Save Button */}
          <TouchableOpacity 
            style={[styles.saveButton, { backgroundColor: theme.colors.secondary }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>
                Save to Semester {selectedSemester || '?'}
              </Text>
            )}
          </TouchableOpacity>
          
          
          <View style={styles.bottomSpacing} />
        </ScrollView>
        
        {/* Semester Selection Modal */}
        <Modal
          visible={showSemesterModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowSemesterModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>
                Select Semester
              </Text>
              <ScrollView style={styles.modalList}>
                {userSemesters.map((semesterNum) => (
                  <TouchableOpacity
                    key={semesterNum}
                    style={[
                      styles.modalItem,
                      selectedSemester === semesterNum && styles.modalItemSelected
                    ]}
                    onPress={() => {
                      setSelectedSemester(semesterNum);
                      setShowSemesterModal(false);
                    }}
                  >
                    <Text style={[
                      styles.modalItemText,
                      selectedSemester === semesterNum && styles.modalItemTextSelected
                    ]}>
                      Semester {semesterNum}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity
                style={[styles.modalClose, { backgroundColor: theme.colors.backgroundTertiary }]}
                onPress={() => setShowSemesterModal(false)}
              >
                <Text style={styles.modalCloseText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        
        <NavigationBar />
      </View>
    );
  }

  // INITIAL SCREEN - Show grading system selector and scan buttons
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <SvgIcon name="arrow-back" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan Results</Text>
        <View style={styles.headerSpacer} />
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.introCard}>
          <SvgIcon name="scan" size={68} color={theme.colors.primary} />
          <Text style={styles.introTitle}>Smart Results Scanner</Text>
          <Text style={styles.introText}>
            Take a photo or upload an image of your exam results or transcript.
            AI will extract marks and calculate your GPA automatically.
          </Text>
        </View>
        
        {errorMessage !== '' && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}
        
        {/* Grading System Selector */}
        <View style={styles.curriculumSection}>
          <Text style={styles.curriculumLabel}>Grading System *</Text>
          <TouchableOpacity 
            style={[styles.curriculumButton, !selectedCurriculum && styles.curriculumButtonEmpty]}
            onPress={() => setShowCurriculumModal(true)}
          >
            <Text style={[styles.curriculumButtonText, !selectedCurriculum && styles.curriculumButtonTextEmpty]}>
              {getSelectedCurriculumName()}
            </Text>
            <SvgIcon name="chevron-down" size={16} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={[styles.cameraButton, !selectedCurriculum && styles.buttonDisabled]} 
          onPress={() => handleScan(true)}
        >
          <Text style={styles.buttonText}>Take Photo</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.galleryButton, !selectedCurriculum && styles.buttonDisabled]} 
          onPress={() => handleScan(false)}
        >
          <Text style={styles.buttonText}>Choose from Gallery</Text>
        </TouchableOpacity>
        
        <View style={styles.tipCard}>
          <Text style={styles.tipText}>
            Tip: Ensure clear, well-lit image. Include course names and marks for best results.
          </Text>
        </View>
        
        <View style={styles.bottomSpacing} />
      </ScrollView>
      
      {/* Curriculum Selection Modal */}
      <Modal
        visible={showCurriculumModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCurriculumModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>
              Select Grading System
            </Text>
            <ScrollView style={styles.modalList}>
              {curriculums.map((curr) => (
                <TouchableOpacity
                  key={curr.id}
                  style={[
                    styles.modalItem,
                    selectedCurriculum === curr.id && styles.modalItemSelected
                  ]}
                  onPress={() => {
                    setSelectedCurriculum(curr.id);
                    setShowCurriculumModal(false);
                  }}
                >
                  <Text style={[
                    styles.modalItemText,
                    selectedCurriculum === curr.id && styles.modalItemTextSelected
                  ]}>
                    {curr.name}
                  </Text>
                  <Text style={styles.modalItemSubtext}>{curr.country}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={[styles.modalClose, { backgroundColor: theme.colors.backgroundTertiary }]}
              onPress={() => setShowCurriculumModal(false)}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      <NavigationBar />
    </View>
  );
}