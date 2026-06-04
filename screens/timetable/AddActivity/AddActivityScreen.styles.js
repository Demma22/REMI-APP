// screens/timetable/AddActivityScreen.styles.js
import { StyleSheet, Dimensions } from "react-native";

const { width } = Dimensions.get("window");

export const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  wrap: { 
    flex: 1, 
  },
  scrollContent: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  centerText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },

  // Processing Overlay
  processingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  processingCard: {
    borderRadius: 15,
    padding: 32,
    alignItems: "center",
    width: "80%",
  },
  processingTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
  },
  processingText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 8,
  },

  // Header
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
    width: 44,
    height: 44,
    borderRadius: 15,
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
  placeholder: {
    width: 44,
  },

  // Content
  content: {
    padding: 24,
  },

  // Input Groups
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.card,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },

  // Dropdown
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: theme.colors.card,
  },
  dropdownButtonText: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.textPrimary,
  },

  // Time Picker
  timeRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  timeField: {
    flex: 1,
  },
  timePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: theme.colors.card,
  },
  timePickerText: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.textPrimary,
  },

  // Switch
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  switchLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  hintText: {
    fontSize: 12,
    color: theme.colors.textTertiary,
    marginBottom: 24,
  },

  // Save Button
  saveBtn: {
    backgroundColor: theme.colors.secondary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  saveBtnProcessing: {
    backgroundColor: theme.colors.primary,
    opacity: 0.7,
  },
  saveBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    borderRadius: 15,
    marginHorizontal: 20,
    maxHeight: "60%",
    width: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  dropdownList: {
    maxHeight: 300,
  },
  dropdownItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownItemSelected: {
    backgroundColor: theme.colors.primary + "10",
  },
  dropdownItemText: {
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  dropdownItemTextSelected: {
    color: theme.colors.secondary,
    fontWeight: "600",
  },

  bottomSpacing: {
    height: 80,
  },

  // Time Picker Modal Styles
  timePickerContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  timePickerContent: {
    width: "90%",
    borderRadius: 15,
    padding: 20,
  },
  timePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  timePickerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  timePickerColumns: {
    flexDirection: "row",
    justifyContent: "space-between",
    height: 200,
  },
  timePickerColumn: {
    flex: 1,
    alignItems: "center",
  },
  timePickerColumnLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  pickerList: {
    alignItems: "center",
  },
  pickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 2,
  },
  pickerItemSelected: {
    backgroundColor: theme.colors.primaryLight,
  },
  pickerItemText: {
    fontSize: 20,
    color: theme.colors.textPrimary,
  },
  pickerItemTextSelected: {
    color: theme.colors.primary,
    fontWeight: "700",
  },
  timePickerConfirmBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },
  timePickerConfirmText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  typeContainer: {
    flexDirection: "row",
    marginBottom: 4,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 15,
    marginRight: 8,
    backgroundColor: theme.colors.backgroundTertiary,
  },
  typeButtonText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  typeButtonTextSelected: {
    color: "#FFFFFF",
  },
});