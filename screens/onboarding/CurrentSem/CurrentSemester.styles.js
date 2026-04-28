import { StyleSheet, Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

export const styles = StyleSheet.create({
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