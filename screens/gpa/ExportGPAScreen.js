// screens/ExportGPAScreen.js
import React, { useState, useEffect, useRef } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  PermissionsAndroid
} from "react-native";

// Add separate import for WebView
import WebView from 'react-native-webview';

// Expo packages for PDF generation
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { EncodingType, documentDirectory, readAsStringAsync, writeAsStringAsync } from 'expo-file-system';

import { auth, db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";
import NavigationBar from "../../components/NavigationBar";
import SvgIcon from "../../components/SvgIcon";
import { useTheme } from '../../contexts/ThemeContext';

export default function ExportGPAScreen({ navigation }) {
  const { theme } = useTheme();
  
  if (!auth.currentUser) {
    return <Text style={styles.center}>Not logged in</Text>;
  }

  const [userData, setUserData] = useState(null);
  const [gpaData, setGpaData] = useState({});
  const [selectedSemesters, setSelectedSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [showWebView, setShowWebView] = useState(false);
  const [htmlContent, setHtmlContent] = useState("");
  const [pdfUri, setPdfUri] = useState("");
  
  const webViewRef = useRef(null);

  useEffect(() => { 
    loadGPA();
    const focus = navigation.addListener("focus", loadGPA);
    return focus;
  }, []);

  const requestStoragePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const apiLevel = Platform.Version;
        if (apiLevel >= 33) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
            {
              title: "Storage Permission Required",
              message: "App needs access to your storage to download PDF files",
              buttonNeutral: "Ask Me Later",
              buttonNegative: "Cancel",
              buttonPositive: "OK"
            }
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        } else {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
            {
              title: "Storage Permission Required",
              message: "App needs access to your storage to download PDF files",
              buttonNeutral: "Ask Me Later",
              buttonNegative: "Cancel",
              buttonPositive: "OK"
            }
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
      } catch (err) {
        return false;
      }
    }
    return true;
  };

  const loadGPA = async () => {
    try {
      setLoading(true);
      
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserData(data);
        
        const loadedGpaData = data.gpa_data || {};
        setGpaData(loadedGpaData);
        
        setSelectedSemesters([]);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load GPA data");
    } finally {
      setLoading(false);
    }
  };

  const toggleSemesterSelection = (semesterKey) => {
    setSelectedSemesters(prev => {
      if (prev.includes(semesterKey)) {
        return prev.filter(key => key !== semesterKey);
      } else {
        return [...prev, semesterKey];
      }
    });
  };

  const deselectAll = () => {
    setSelectedSemesters([]);
  };

  const selectAll = () => {
    const allSemesters = Object.keys(gpaData).filter(key => 
      gpaData[key]?.gpa && !isNaN(parseFloat(gpaData[key].gpa))
    );
    setSelectedSemesters(allSemesters);
  };

  const getOverallGPA = () => {
    if (selectedSemesters.length === 0) return null;
    
    const validGpas = selectedSemesters
      .map(key => parseFloat(gpaData[key]?.gpa || 0))
      .filter(gpa => !isNaN(gpa) && gpa > 0);
    
    if (validGpas.length === 0) return null;
    
    const sum = validGpas.reduce((total, gpa) => total + gpa, 0);
    return (sum / validGpas.length).toFixed(2);
  };

  const getGradeLetterFromGPA = (gpa) => {
    const numericGPA = parseFloat(gpa);
    if (isNaN(numericGPA)) return "N/A";
    
    if (numericGPA >= 4.5) return "A";
    if (numericGPA >= 4.0) return "A-";
    if (numericGPA >= 3.5) return "B+";
    if (numericGPA >= 3.0) return "B";
    if (numericGPA >= 2.5) return "B-";
    if (numericGPA >= 2.0) return "C+";
    if (numericGPA >= 1.5) return "C";
    return "F";
  };

  const getPerformanceRemark = (gpa) => {
    const numericGPA = parseFloat(gpa);
    if (isNaN(numericGPA)) return "Not Available";
    
    if (numericGPA >= 4.5) return "First Class Honors";
    if (numericGPA >= 4.0) return "Second Class Upper";
    if (numericGPA >= 3.0) return "Second Class Lower";
    if (numericGPA >= 2.0) return "Pass";
    return "Fail";
  };

  const generatePDFHTML = () => {
    const studentName = userData?.full_name || userData?.nickname || "Student";
    const course = userData?.course || "Not Specified";
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const overallGPA = getOverallGPA();
    
    let totalCredits = 0;
    let totalQualityPoints = 0;
    let totalCourses = 0;

    selectedSemesters.forEach(key => {
      const semesterData = gpaData[key];
      if (semesterData) {
        totalCredits += semesterData.totalCreditUnits || 0;
        totalQualityPoints += semesterData.totalQualityPoints || 0;
        totalCourses += semesterData.courses?.length || 0;
      }
    });

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 40px;
            color: #333;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px;
          }
          .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 3px solid #535FFD;
            padding-bottom: 20px;
          }
          .title {
            font-size: 28px;
            font-weight: bold;
            color: #535FFD;
            margin-bottom: 10px;
          }
          .student-info {
            margin-bottom: 30px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
          }
          .summary-card {
            background: #e3f2fd;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
            text-align: center;
          }
          .overall-gpa {
            font-size: 42px;
            font-weight: bold;
            color: #535FFD;
            margin: 10px 0;
          }
          .grade {
            font-size: 24px;
            color: #4caf50;
            font-weight: bold;
            margin: 10px 0;
          }
          .summary-info {
            display: flex;
            justify-content: space-around;
            margin-top: 15px;
            font-size: 14px;
            color: #555;
          }
          .semester-section {
            margin-bottom: 30px;
            page-break-inside: avoid;
          }
          .semester-header {
            background: #535FFD;
            color: white;
            padding: 12px;
            border-radius: 6px 6px 0 0;
            font-size: 18px;
            font-weight: bold;
          }
          .semester-summary {
            background: #f0f2ff;
            padding: 15px;
            text-align: center;
            font-size: 16px;
            color: #535FFD;
            border-bottom: 1px solid #ddd;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            font-size: 14px;
          }
          th {
            background: #f8f9fa;
            padding: 12px;
            text-align: left;
            border-bottom: 2px solid #dee2e6;
            font-weight: 600;
          }
          td {
            padding: 12px;
            border-bottom: 1px solid #dee2e6;
          }
          tr:nth-child(even) {
            background: #f8f9fa;
          }
          .no-data {
            text-align: center;
            color: #6c757d;
            font-style: italic;
            padding: 40px;
          }
          @media print {
            body {
              margin: 0;
              padding: 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">GPA REPORT</div>
        </div>

        <div class="student-info">
          <div class="info-row">
            <div><strong>Student Name:</strong> ${studentName}</div>
            <div><strong>Date Generated:</strong> ${currentDate}</div>
          </div>
          <div class="info-row">
            <div><strong>Course Program:</strong> ${course}</div>
          </div>
        </div>

        ${overallGPA ? `
          <div class="summary-card">
            <h2>Academic Summary</h2>
            <div class="overall-gpa">${overallGPA}</div>
            <div class="grade">${getGradeLetterFromGPA(overallGPA)} - ${getPerformanceRemark(overallGPA)}</div>
            <div class="summary-info">
              <span>${selectedSemesters.length} Semester${selectedSemesters.length !== 1 ? 's' : ''}</span>
              <span>${totalCourses} Courses</span>
              <span>${totalCredits.toFixed(1)} Credits</span>
            </div>
          </div>
        ` : ''}

        ${selectedSemesters.length > 0 ? selectedSemesters.map(key => {
          const semesterData = gpaData[key];
          if (!semesterData) return '';
          
          const semesterNum = key.replace('semester', '');
          
          return `
            <div class="semester-section">
              <div class="semester-header">SEMESTER ${semesterNum} - GPA: ${semesterData.gpa.toFixed(2)}</div>
              <div class="semester-summary">
                Grade: ${getGradeLetterFromGPA(semesterData.gpa)} | 
                Credit Units: ${semesterData.totalCreditUnits.toFixed(1)} | 
                Quality Points: ${semesterData.totalQualityPoints.toFixed(2)}
              </div>
              
              ${semesterData.courses && semesterData.courses.length > 0 ? `
                <table>
                  <thead>
                    <tr>
                      <th>Course</th>
                      <th>Marks (%)</th>
                      <th>Grade</th>
                      <th>Credit Units</th>
                      <th>Grade Points</th>
                      <th>Quality Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${semesterData.courses.map(course => `
                      <tr>
                        <td>${course.name}</td>
                        <td>${course.marks.toFixed(1)}</td>
                        <td>${course.grade}</td>
                        <td>${course.creditUnits.toFixed(1)}</td>
                        <td>${course.gradePoints.toFixed(1)}</td>
                        <td>${(course.creditUnits * course.gradePoints).toFixed(2)}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              ` : '<div class="no-data">No course data available</div>'}
            </div>
          `;
        }).join('') : '<div class="no-data">No semesters selected for export</div>'}
      </body>
      </html>
    `;
    
    return html;
  };

  const exportToPDF = async () => {
    if (selectedSemesters.length === 0) {
      Alert.alert("No Selection", "Please select at least one semester to export.");
      return;
    }

    try {
      setExporting(true);
      
      const html = generatePDFHTML();
      
      const { uri } = await Print.printToFileAsync({
        html: html,
        base64: false,
      });
      
      setPdfUri(uri);
      setHtmlContent(html);
      
      showDownloadOptions(uri);
      
    } catch (error) {
      Alert.alert(
        "Export Failed",
        "Could not generate report. Please try again."
      );
    } finally {
      setExporting(false);
    }
  };

  const showDownloadOptions = (uri) => {
    Alert.alert(
      "Report Generated Successfully",
      "Choose what you'd like to do with the report:",
      [
        { 
          text: "View Report", 
          onPress: () => setShowWebView(true)
        },
        { 
          text: "Share/Download Report", 
          onPress: () => sharePDF(uri)
        },
        { 
          text: "Print", 
          onPress: () => printPDF()
        },
        { 
          text: "Cancel", 
          style: "cancel" 
        }
      ]
    );
  };

  const downloadPDFToDevice = async (uri) => {
    try {
      if (Platform.OS === 'android') {
        const hasPermission = await requestStoragePermission();
        if (!hasPermission) {
          Alert.alert(
            "Permission Required",
            "Storage permission is required to download files.",
            [{ text: "OK" }]
          );
          return;
        }
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `GPA_Report_${timestamp}.pdf`;
      
      const documentsDir = documentDirectory;
      const destinationUri = `${documentsDir}${fileName}`;
      
      const fileContent = await readAsStringAsync(uri, {
        encoding: EncodingType.Base64,
      });
      
      await writeAsStringAsync(destinationUri, fileContent, {
        encoding: EncodingType.Base64,
      });
      
      Alert.alert(
        "Download Complete",
        `Report saved successfully!\n\nFile: ${fileName}`,
        [
          { 
            text: "Share File", 
            onPress: () => sharePDF(destinationUri)
          },
          { text: "OK", style: "default" }
        ]
      );
      
    } catch (error) {
      Alert.alert(
        "Download Failed",
        "Could not save the file. Please use the Share option to save it to your preferred location.",
        [{ text: "OK" }]
      );
    }
  };

  const sharePDF = async (uri) => {
    try {
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert("Sharing not available", "Sharing is not available on this device.");
        return;
      }
      
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Share GPA Report',
        UTI: 'com.adobe.pdf'
      });
      
    } catch (error) {
      Alert.alert("Sharing Error", "Could not share the file. Please try again.");
    }
  };

  const printPDF = async () => {
    try {
      const html = generatePDFHTML();
      await Print.printAsync({
        html: html,
      });
    } catch (error) {
      Alert.alert("Print Error", "Could not print the document.");
    }
  };

  const handleWebViewMessage = () => {
    // Handle WebView messages if needed
  };

  const styles = getStyles(theme);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity 
              style={styles.backBtn} 
              onPress={() => navigation.goBack()}
            >
              <SvgIcon name="arrow-back" size={20} color={theme.colors.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>EXPORT GPA</Text>
            <View style={styles.headerSpacer} />
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading your GPA data...</Text>
        </View>
        <NavigationBar />
      </View>
    );
  }

  const availableSemesters = Object.keys(gpaData).filter(key => 
    gpaData[key]?.gpa && !isNaN(parseFloat(gpaData[key].gpa))
  );

  if (showWebView) {
    return (
      <View style={styles.container}>
        <View style={styles.webViewHeader}>
          <TouchableOpacity 
            style={styles.webViewBackBtn}
            onPress={() => setShowWebView(false)}
          >
            <SvgIcon name="arrow-back" size={20} color={theme.colors.primary} />
            <Text style={styles.webViewBackText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.webViewTitle}>GPA Report</Text>
          <View style={styles.webViewActions}>
            <TouchableOpacity 
              style={styles.webViewActionButton}
              onPress={() => pdfUri && sharePDF(pdfUri)}
            >
              <SvgIcon name="share" size={18} color={theme.colors.primary} />
              <Text style={styles.webViewActionText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <WebView
          ref={webViewRef}
          source={{ html: htmlContent }}
          style={styles.webView}
          onMessage={handleWebViewMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={true}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.backBtn} 
            onPress={() => navigation.goBack()}
          >
            <SvgIcon name="arrow-back" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>EXPORT GPA</Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Semester Selection - Moved to top */}
        <View style={styles.semestersSection}>
          <Text style={styles.sectionTitle}>Select Semesters to Export</Text>
          
          {availableSemesters.length > 0 ? (
            <View>
              <TouchableOpacity 
                style={styles.selectAllButton}
                onPress={selectAll}
              >
                <Text style={styles.selectAllText}>Select All Semesters</Text>
              </TouchableOpacity>
              
              {availableSemesters.map((semesterKey) => {
                const semesterData = gpaData[semesterKey];
                const semesterNum = semesterKey.replace('semester', '');
                const isSelected = selectedSemesters.includes(semesterKey);
                
                return (
                  <TouchableOpacity 
                    key={semesterKey}
                    style={[
                      styles.semesterCard,
                      isSelected && styles.semesterCardSelected
                    ]}
                    onPress={() => toggleSemesterSelection(semesterKey)}
                  >
                    <View style={styles.semesterHeader}>
                      <View style={styles.semesterCheck}>
                        {isSelected ? (
                          <SvgIcon name="check-circle" size={24} color={theme.colors.primary} />
                        ) : (
                          <SvgIcon name="checkbox-blank-circle-outline" size={24} color={theme.colors.border} />
                        )}
                      </View>
                      <View style={styles.semesterInfo}>
                        <Text style={[
                          styles.semesterName,
                          isSelected && styles.semesterNameSelected
                        ]}>
                          Semester {semesterNum}
                        </Text>
                        <Text style={styles.courseCount}>
                          {semesterData?.courses?.length || 0} courses | 
                          {semesterData?.totalCreditUnits?.toFixed(1) || '0.0'} credits
                        </Text>
                      </View>
                      
                      <View style={styles.semesterGPA}>
                        <Text style={[
                          styles.gpaValue,
                          isSelected && styles.gpaValueSelected
                        ]}>
                          {semesterData?.gpa?.toFixed(2) || '0.00'}
                        </Text>
                        <Text style={styles.gpaLabel}>GPA</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIcon, { backgroundColor: theme.colors.primaryLight }]}>
                <SvgIcon name="file-document" size={32} color={theme.colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>No GPA Data Available</Text>
              <Text style={styles.emptySubtitle}>
                Calculate your GPA first to generate reports
              </Text>
              <TouchableOpacity 
                style={[styles.navigateButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => navigation.navigate("GPACalculation")}
              >
                <Text style={styles.navigateButtonText}>Calculate GPA</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Deselect All Button */}
        {selectedSemesters.length > 0 && (
          <TouchableOpacity 
            style={[styles.deselectButton, { backgroundColor: theme.colors.error + '20' }]}
            onPress={deselectAll}
          >
            <SvgIcon name="close-circle" size={16} color={theme.colors.error} />
            <Text style={[styles.deselectButtonText, { color: theme.colors.error }]}>
              Deselect All ({selectedSemesters.length})
            </Text>
          </TouchableOpacity>
        )}

        {/* Export Button */}
        {availableSemesters.length > 0 && (
          <TouchableOpacity 
            style={[
              styles.exportButton,
              selectedSemesters.length === 0 && styles.exportButtonDisabled,
              { backgroundColor: theme.colors.primary }
            ]}
            onPress={exportToPDF}
            disabled={selectedSemesters.length === 0 || exporting}
          >
            {exporting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <SvgIcon name="download" size={20} color="#FFFFFF" />
                <Text style={styles.exportButtonText}>
                  Generate Report
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Summary Card - Moved to bottom */}
        {selectedSemesters.length > 0 && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Export Summary</Text>
            <View style={styles.summaryContent}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Selected Semesters:</Text>
                <Text style={styles.summaryValue}>{selectedSemesters.length}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Overall GPA:</Text>
                <Text style={[styles.summaryValue, { color: theme.colors.primary }]}>
                  {getOverallGPA() || "N/A"}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Courses:</Text>
                <Text style={styles.summaryValue}>
                  {selectedSemesters.reduce((total, key) => 
                    total + (gpaData[key]?.courses?.length || 0), 0
                  )}
                </Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      <NavigationBar />
    </View>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  webViewHeader: {
    backgroundColor: theme.colors.backgroundSecondary,
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  webViewBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
  },
  webViewBackText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: "600",
  },
  webViewTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    textAlign: "center",
    flex: 1,
  },
  webViewActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  webViewActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
  },
  webViewActionText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: "600",
  },
  webView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    backgroundColor: theme.colors.backgroundSecondary,
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: theme.colors.shadow,
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
    backgroundColor: theme.colors.background,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: theme.colors.textPrimary,
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },
  semestersSection: {
    paddingHorizontal: 24,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    marginBottom: 20,
  },
  selectAllButton: {
    backgroundColor: theme.colors.primaryLight,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  selectAllText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  semesterCard: {
    backgroundColor: theme.colors.card,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  semesterCardSelected: {
    backgroundColor: theme.mode === 'dark' ? 'rgba(83, 95, 253, 0.1)' : '#F0F9FF',
  },
  semesterHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  semesterCheck: {
    marginRight: 12,
  },
  semesterInfo: {
    flex: 1,
  },
  semesterName: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  semesterNameSelected: {
    color: theme.colors.primary,
  },
  courseCount: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  semesterGPA: {
    alignItems: "flex-end",
  },
  gpaValue: {
    fontSize: 24,
    fontWeight: "800",
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  gpaValueSelected: {
    color: theme.colors.primary,
  },
  gpaLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: "600",
  },
  deselectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    marginHorizontal: 24,
    marginBottom: 20,
  },
  deselectButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  exportButton: {
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  exportButtonDisabled: {
    opacity: 0.5,
  },
  exportButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  summaryCard: {
    backgroundColor: theme.colors.card,
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 20,
    borderRadius: 20,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    marginBottom: 16,
  },
  summaryContent: {
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: "500",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.textPrimary,
  },
  infoCard: {
    backgroundColor: theme.colors.card,
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 20,
    borderRadius: 20,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    marginBottom: 16,
  },
  infoList: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  emptyState: {
    backgroundColor: theme.colors.card,
    padding: 40,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  navigateButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
  },
  navigateButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  bottomSpacing: {
    height: 20,
  },
});