import { StyleSheet, Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF", // Back to white background
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollViewAndroid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  scrollContentAndroid: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    paddingTop: 20,
  },
  title: {
    fontSize: 32,
    marginTop: 120,
    fontWeight: "800",
    color: "#383940", // Dark text for white bg
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: "#64748B", // Secondary text color
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  formCard: {
    backgroundColor: "#535FFD", // Purple card
    borderRadius: 15,
    padding: 24,
    marginBottom: 32,
    shadowColor: "#535FFD",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 5,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FECACA',
    gap: 12,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF", // White text for purple card
  },
  inputIcon: {
    color: "#FFFFFF", // White icon
    opacity: 0.9,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    color: "#FFFFFF",
  },
  usernameHintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
    marginLeft: 4,
  },
  usernameHint: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)", // Semi-transparent white
  },
  hintIcon: {
    color: "rgba(255,255,255,0.7)",
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    color: "#FFFFFF",
    paddingRight: 60,
  },
  eyeButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  loginButton: {
    backgroundColor: "#FDAC1B",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonDisabled: {
    backgroundColor: "#FDAC1B",
    shadowColor: "transparent",
  },
  loginButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  dividerText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontWeight: '500',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  googleButtonText: {
    color: '#383940',
    fontSize: 15,
    fontWeight: '600',
  },
  signupSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  signupText: {
    color: "#64748B",
    fontSize: 16,
  },
  signupLink: {
    color: "#535FFD",
    fontSize: 16,
    fontWeight: "700",
  },
});