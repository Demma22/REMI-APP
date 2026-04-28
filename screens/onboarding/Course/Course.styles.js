import { StyleSheet, Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

export const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  // Header styling - Like ProfileScreen but adapted
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
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 120,
  },
  titleSection: {
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: theme.colors.textPrimary,
    marginBottom: 12,
    marginTop: 100,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  inputSection: {
    marginBottom: 40,
  },
  inputContainer: {
    position: 'relative',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.textPrimary,
    marginBottom: 12,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#F1F5F9",
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    color: "#383940",
    paddingRight: 70,
  },
  counterContainer: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
  counterText: {
    fontSize: 14,
    color: "#94A3B8",
    fontWeight: '500',
  },
  validationContainer: {
    marginTop: 12,
    paddingHorizontal: 4,
  },
  validationText: {
    fontSize: 14,
    fontWeight: '500',
  },
  spacer: {
    flex: 1,
    minHeight: 20,
  },
  buttonSection: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    backgroundColor: "#FFFFFF",
  },
  nextButton: {
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
  },
  nextButtonActive: {
    backgroundColor: "#535FFD",
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