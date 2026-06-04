// screens/gpa/ScanResults/ScanResultsScreen.styles.js
import { StyleSheet, Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");

export const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: theme.colors.backgroundSecondary,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
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
  },
  headerSpacer: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.background,
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.textPrimary,
    marginTop: 20,
  },
  loadingSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  introCard: {
    alignItems: "center",
    backgroundColor: theme.colors.card,
    padding: 32,
    borderRadius: 15,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  introTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  introText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  errorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: theme.colors.dangerLight,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.danger,
  },
  curriculumSection: {
    marginBottom: 20,
  },
  curriculumLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  curriculumButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: 16,
  },
  curriculumButtonEmpty: {
    borderColor: theme.colors.danger,
    backgroundColor: theme.colors.dangerLight + '20',
  },
  curriculumButtonText: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  curriculumButtonTextEmpty: {
    color: theme.colors.textSecondary,
  },
  cameraButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  galleryButton: {
    backgroundColor: theme.colors.secondary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  tipCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: theme.colors.primaryLight,
    padding: 16,
    borderRadius: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 16,
  },
  
  // GPA Summary Card Styles
  gpaSummaryCard: {
    padding: 24,
    borderRadius: 15,
    alignItems: "center",
    marginBottom: 20,
  },
  gpaSummaryTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    opacity: 0.9,
  },
  gpaSummaryValue: {
    color: "#FFFFFF",
    fontSize: 48,
    fontWeight: "900",
    marginBottom: 8,
  },
  gpaSummaryClassification: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 16,
  },
  gpaSummaryStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: 8,
  },
  gpaStat: {
    alignItems: "center",
  },
  gpaStatValue: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  gpaStatLabel: {
    color: "#FFFFFF",
    fontSize: 11,
    opacity: 0.8,
    marginTop: 4,
  },
  
  // Curriculum Info Styles
  curriculumInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: theme.colors.primaryLight,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  curriculumInfoText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  
  // Semester Selector Styles
  semesterSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  semesterSelectorText: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  
  // Section Title
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    marginBottom: 16,
  },
  
  // Course Card Styles
  courseCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  courseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  courseName: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    flex: 1,
  },
  courseBadge: {
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  courseBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  courseDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  courseDetail: {
    flex: 1,
    minWidth: 80,
  },
  courseDetailLabel: {
    fontSize: 11,
    color: theme.colors.textTertiary,
    marginBottom: 4,
  },
  courseDetailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.textPrimary,
  },
  
  // Save Button Styles
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 12,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  
  // Rescan Button
  rescanButton: {
    alignItems: "center",
    paddingVertical: 12,
    marginBottom: 40,
  },
  rescanButtonText: {
    fontSize: 14,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "60%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
    textAlign: "center",
  },
  modalList: {
    maxHeight: 300,
  },
  modalItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  modalItemSelected: {
    backgroundColor: theme.colors.primary + '20',
  },
  modalItemText: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    fontWeight: "500",
  },
  modalItemTextSelected: {
    color: theme.colors.primary,
    fontWeight: "700",
  },
  modalItemSubtext: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  modalClose: {
    padding: 16,
    borderRadius: 15,
    alignItems: "center",
    marginTop: 16,
  },
  modalCloseText: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: "600",
  },
  
  // ============================================
  // SCANNING OVERLAY STYLES
  // ============================================
  
  // Image Background for Scanning Overlay
  scanImageBackground: {
    width: '100%',
    height: '100%',
  },
  scanImageStyle: {
    resizeMode: 'cover',
  },
  
  // Dark Overlay for better text visibility
  scanDarkOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  
  // Animated Scanning Line
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    opacity: 0.8,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 5,
    zIndex: 10,
  },
  
  // Center Scanner Icon with Pulse Animation
  centerScanner: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 15,
  },
  scannerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  
  // Bottom Progress Section
  scanProgressSection: {
    position: 'absolute',
    bottom: 80,
    left: 24,
    right: 24,
    zIndex: 20,
  },
  
  // Progress Bar
  scanProgressBarContainer: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 20,
  },
  scanProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  
  // Status Message Container
  scanStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
  },
  scanStatusEmoji: {
    fontSize: 28,
  },
  scanStatusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  
  // Wait Instruction
  scanWaitContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  scanWaitText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  
  // Bottom Spacing
  bottomSpacing: {
    height: 120,
  },
});