import { StyleSheet, Dimensions } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  // Header — matches HomeScreen formula: insets.top + 12, paddingBottom: 14
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 14,
    backgroundColor: theme.colors.background,
  },
  profileBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.backgroundTertiary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },

  // Profile Card
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingVertical: 8,
  },
  avatarWrapper: {
    position: "relative",
    marginRight: 18,
  },
  profileImage: {
    width: 76,
    height: 76,
    borderRadius: 38,
  },
  onlineDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#22C55E",
    borderWidth: 2,
    borderColor: theme.colors.background,
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 38,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  profileInfo: {
    flex: 1,
  },
  profileNameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  profileName: {
    fontSize: 22,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    marginRight: 8,
  },
  editNameBtn: {
    padding: 2,
  },
  profileEmail: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },

  // Quote
  quoteSection: {
    marginBottom: 20,
    position: "relative",
  },
  quoteDecorIcon: {
    position: "absolute",
    top: -20,
    right: -20,
    zIndex: 10,
  },
  quoteHeader: {
    backgroundColor: "#111111",
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 20,
  },
  quoteHeaderText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  quoteBody: {
    backgroundColor: "#111111",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  quoteText: {
    flex: 1,
    fontSize: 14,
    color: "#CCCCCC",
    lineHeight: 20,
  },

  // Account Information
  accountSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.textSecondary,
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  accountCard: {
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 4,
  },
  accountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.15)",
  },
  accountLabel: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
  },
  accountValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  // Logout
  logoutButton: {
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: theme.colors.danger,
    backgroundColor: "transparent",
  },
  logoutButtonText: {
    color: theme.colors.danger,
    fontSize: 16,
    fontWeight: "700",
  },

  // View Photo Modal
  photoModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  photoModalClose: {
    position: "absolute",
    top: 56,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  photoModalImage: {
    width: SCREEN_WIDTH - 40,
    height: SCREEN_WIDTH - 40,
    borderRadius: 20,
  },

  // Edit Quote Modal
  quoteModalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  quoteModalSheet: {
    backgroundColor: theme.colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  quoteModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    marginBottom: 16,
  },
  quoteInput: {
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: theme.colors.textPrimary,
    minHeight: 100,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  quoteCharCount: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: "right",
    marginTop: 6,
    marginBottom: 20,
  },
  quoteModalActions: {
    flexDirection: "row",
    gap: 12,
  },
  quoteModalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 50,
    alignItems: "center",
  },
  quoteModalCancelBtn: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  quoteModalSaveBtn: {},
  quoteModalBtnText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
