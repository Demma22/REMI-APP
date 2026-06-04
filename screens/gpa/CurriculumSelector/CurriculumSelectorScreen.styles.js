// screens/gpa/CurriculumSelector/CurriculumSelectorScreen.styles.js
import { StyleSheet } from "react-native";

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
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  introCard: {
    alignItems: "center",
    backgroundColor: theme.colors.card,
    padding: 24,
    borderRadius: 15,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  introTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    marginTop: 12,
    marginBottom: 8,
  },
  introText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  curriculumCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  curriculumCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.mode === 'dark' 
      ? 'rgba(121, 134, 255, 0.1)' 
      : 'rgba(83, 95, 253, 0.05)',
  },
  curriculumHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  curriculumIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: theme.colors.backgroundTertiary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  curriculumInfo: {
    flex: 1,
  },
  curriculumName: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  curriculumNameSelected: {
    color: theme.colors.primary,
  },
  curriculumCountry: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  curriculumScale: {
    fontSize: 12,
    color: theme.colors.textTertiary,
  },
  checkIcon: {
    marginLeft: 8,
  },
  infoButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  infoButtonText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 40,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    borderRadius: 15,
    padding: 20,
    width: "85%",
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  modalBody: {
    maxHeight: 400,
  },
  modalCountry: {
    fontSize: 14,
    marginBottom: 8,
  },
  modalDesc: {
    fontSize: 12,
    marginBottom: 16,
    lineHeight: 18,
  },
  gradeTable: {
    marginTop: 8,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  gradeTableHeader: {
    flexDirection: "row",
    backgroundColor: theme.colors.primaryLight,
    padding: 10,
  },
  gradeTableHeaderText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    textAlign: "center",
  },
  gradeRow: {
    flexDirection: "row",
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  gradeRowText: {
    flex: 1,
    fontSize: 12,
    color: theme.colors.textPrimary,
    textAlign: "center",
  },
  modalClose: {
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
  },
  modalCloseText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});