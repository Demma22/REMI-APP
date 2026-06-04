// screens/onboarding/OnboardingScreen.styles.js
import { StyleSheet, Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

export const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: theme.colors.backgroundSecondary,
  },
  skipButton: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  progressContainer: {
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  content: {
    padding: 24,
  },
  questionText: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    marginBottom: 24,
    lineHeight: 36,
  },
  multiHint: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 20,
  },
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: 15,
    padding: 16,
    borderWidth: 2,
    borderColor: theme.colors.border,
    gap: 12,
  },
  optionCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },
  optionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionTextContainer: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  optionLabelSelected: {
    color: theme.colors.primary,
  },
  optionDescription: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInput: {
    backgroundColor: theme.colors.card,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: 15,
    padding: 18,
    fontSize: 18,
    color: theme.colors.textPrimary,
    marginBottom: 24,
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stepIndicator: {
    paddingVertical: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  stepText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  skipButtonBottom: {
    marginTop: 20,
    alignItems: 'center',
    padding: 12,
},
  skipTextBottom: {
    fontSize: 14,
    fontWeight: '500',
},
});