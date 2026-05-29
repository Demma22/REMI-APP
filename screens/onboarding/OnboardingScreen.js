// screens/onboarding/OnboardingScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { getUserData, saveUserData, getCurrentUserInfo } from '../../services/userDataService';
import { useTheme } from '../../contexts/ThemeContext';
import SvgIcon from '../../components/SvgIcon';
import { getStyles } from './OnboardingScreen.styles';
import { OnboardingSkeleton } from '../../components/SkeletonLoader';

// Question configurations with custom icons
const questions = [
  {
    id: 'heardFrom',
    question: 'How did you hear about REMI?',
    type: 'single',
    options: [
      { id: 'family_friend', label: 'Friends & Family', icon: 'friends' },
      { id: 'social_media', label: 'Social Media', icon: 'media' },
      { id: 'snd_studio', label: 'SND Studio Website', icon: 'web' },
      { id: 'app_store', label: 'App Store', icon: 'app' },
      { id: 'other', label: 'Other', icon: 'other' },
    ],
  },
  {
    id: 'purpose',
    question: 'What do you want to use REMI for?',
    type: 'multi',
    maxSelections: 2,
    options: [
      { id: 'productivity', label: 'Productivity', icon: 'productive', description: 'Get more done daily' },
      { id: 'habit_tracking', label: 'Habit tracking', icon: 'habit', description: 'Build better routines' },
      { id: 'time_management', label: 'Time management', icon: 'time', description: 'Master your schedule' },
      { id: 'focus', label: 'Focus', icon: 'focus', description: 'Reduce distractions' },
    ],
  },
  {
    id: 'studyStage',
    question: 'What stage are you in?',
    type: 'single',
    options: [
      { id: 'high_school', label: 'High School', icon: 'highschool' },
      { id: 'undergraduate', label: 'Undergraduate', icon: 'undergraduate' },
      { id: 'graduate', label: 'Graduate', icon: 'graduate' },
      { id: 'professional', label: 'Professional', icon: 'professional' },
      { id: 'not_studying', label: 'Not studying', icon: 'nonstudent' },
    ],
  },
  {
    id: 'nickname',
    question: 'What should we call you?',
    type: 'text',
    placeholder: 'Enter your nickname',
    required: true,
  },
  {
    id: 'ageRange',
    question: 'Age range (optional)',
    type: 'single',
    optional: true,
    options: [
      { id: 'under_18', label: 'Under 18' },
      { id: '18_24', label: '18-24' },
      { id: '25_34', label: '25-34' },
      { id: '35_44', label: '35-44' },
      { id: '45_plus', label: '45+' },
    ],
  },
];

export default function OnboardingScreen({ navigation }) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingUserData, setLoadingUserData] = useState(true);
  const [selectedMultiOptions, setSelectedMultiOptions] = useState([]);
  const [textValue, setTextValue] = useState('');
  const [existingAnswers, setExistingAnswers] = useState({});
  
  // Track which questions are already answered (for resume functionality)
  const [answeredQuestions, setAnsweredQuestions] = useState({});

  // Load existing user data to resume onboarding
  useEffect(() => {
    loadExistingUserData();
  }, []);

  const loadExistingUserData = async () => {
    try {
      const userInfo = await getCurrentUserInfo();
      if (!userInfo) {
        setLoadingUserData(false);
        return;
      }

      const userData = await getUserData();

      if (userData) {
        const existing = {};
        
        // Check which questions already have answers
        if (userData.heardFrom) existing.heardFrom = userData.heardFrom;
        if (userData.purpose && userData.purpose.length > 0) existing.purpose = userData.purpose;
        if (userData.studyStage) existing.studyStage = userData.studyStage;
        if (userData.nickname) existing.nickname = userData.nickname;
        if (userData.ageRange) existing.ageRange = userData.ageRange;
        
        setExistingAnswers(existing);
        setAnswers(existing);
        
        // Find first unanswered question
        let firstUnansweredIndex = -1;
        for (let i = 0; i < questions.length; i++) {
          const question = questions[i];
          let isAnswered = false;
          
          if (question.id === 'heardFrom' && existing.heardFrom) isAnswered = true;
          else if (question.id === 'purpose' && existing.purpose?.length > 0) isAnswered = true;
          else if (question.id === 'studyStage' && existing.studyStage) isAnswered = true;
          else if (question.id === 'nickname' && existing.nickname) isAnswered = true;
          else if (question.id === 'ageRange' && existing.ageRange) isAnswered = true;
          
          if (!isAnswered) {
            firstUnansweredIndex = i;
            break;
          }
        }
        
        // If all questions are answered, go to home
        if (firstUnansweredIndex === -1) {
          navigation.replace('Home');
          return;
        }
        
        setCurrentQuestionIndex(firstUnansweredIndex);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoadingUserData(false);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const isMultiSelect = currentQuestion.type === 'multi';
  const isTextQuestion = currentQuestion.type === 'text';

  // Reset values when question changes
  useEffect(() => {
    if (!loadingUserData) {
      if (isMultiSelect) {
        const savedAnswers = answers[currentQuestion.id] || [];
        setSelectedMultiOptions(savedAnswers);
      }
      if (isTextQuestion) {
        const savedText = answers[currentQuestion.id] || '';
        setTextValue(savedText);
      }
    }
  }, [currentQuestionIndex, currentQuestion.id, isMultiSelect, isTextQuestion, answers, loadingUserData]);

  const handleSingleSelect = (optionId) => {
    const newAnswers = { ...answers, [currentQuestion.id]: optionId };
    setAnswers(newAnswers);
    goToNextQuestion();
  };

  const handleMultiSelect = (optionId) => {
    let newSelection;
    if (selectedMultiOptions.includes(optionId)) {
      newSelection = selectedMultiOptions.filter(id => id !== optionId);
    } else {
      if (selectedMultiOptions.length >= currentQuestion.maxSelections) {
        Alert.alert('Maximum reached', `You can select up to ${currentQuestion.maxSelections} options`);
        return;
      }
      newSelection = [...selectedMultiOptions, optionId];
    }
    setSelectedMultiOptions(newSelection);
  };

  const handleMultiSubmit = () => {
    if (selectedMultiOptions.length === 0) {
      Alert.alert('Selection required', 'Please select at least one option');
      return;
    }
    const newAnswers = { ...answers, [currentQuestion.id]: selectedMultiOptions };
    setAnswers(newAnswers);
    goToNextQuestion();
  };

  const handleTextSubmit = () => {
    if (currentQuestion.required && !textValue.trim()) {
      Alert.alert('Required', 'Please enter your nickname');
      return;
    }
    const newAnswers = { ...answers, [currentQuestion.id]: textValue.trim() };
    setAnswers(newAnswers);
    goToNextQuestion();
  };

  const handleSkip = () => {
    if (currentQuestion.id === 'ageRange') {
      const newAnswers = { ...answers, [currentQuestion.id]: null };
      setAnswers(newAnswers);
    }
    goToNextQuestion();
  };

  const goToNextQuestion = () => {
    if (isLastQuestion) {
      completeOnboarding();
    } else {
      // Find the next unanswered question
      let nextIndex = currentQuestionIndex + 1;
      for (let i = nextIndex; i < questions.length; i++) {
        const question = questions[i];
        let isAnswered = false;
        
        if (question.id === 'heardFrom' && answers.heardFrom) isAnswered = true;
        else if (question.id === 'purpose' && answers.purpose?.length > 0) isAnswered = true;
        else if (question.id === 'studyStage' && answers.studyStage) isAnswered = true;
        else if (question.id === 'nickname' && answers.nickname) isAnswered = true;
        else if (question.id === 'ageRange' && answers.ageRange) isAnswered = true;
        
        if (!isAnswered) {
          setCurrentQuestionIndex(i);
          return;
        }
      }
      // If all remaining are answered, complete onboarding
      completeOnboarding();
    }
  };

  const completeOnboarding = async () => {
    setLoading(true);

    try {
      const userInfo = await getCurrentUserInfo();
      if (!userInfo) {
        Alert.alert('Error', 'Not logged in');
        return;
      }

      const finalAnswers = { ...existingAnswers, ...answers };

      const onboardingData = {
        heardFrom: finalAnswers.heardFrom || null,
        purpose: finalAnswers.purpose || [],
        studyStage: finalAnswers.studyStage || null,
        nickname: finalAnswers.nickname || '',
        ageRange: finalAnswers.ageRange || null,
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
      };

      await saveUserData(onboardingData);

      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
      
    } catch (error) {
      console.error('Onboarding error:', error);
      Alert.alert('Error', 'Failed to save your preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderProgressBar = () => {
    const answeredCount = Object.keys(answers).filter(key => {
      const val = answers[key];
      return val !== undefined && val !== null && (Array.isArray(val) ? val.length > 0 : val !== '');
    }).length;
    
    const totalQuestions = questions.length;
    const progress = (answeredCount / totalQuestions) * 100;
    
    return (
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${progress}%`, backgroundColor: theme.colors.primary }]} />
      </View>
    );
  };

  const renderIcon = (iconName, color = theme.colors.primary) => {
    return <SvgIcon name={iconName} size={24} color={color} />;
  };

  const renderQuestionContent = () => {
    if (currentQuestion.type === 'single') {
      const isAgeQuestion = currentQuestion.id === 'ageRange';
      
      return (
        <>
          <Text style={styles.questionText}>{currentQuestion.question}</Text>
          <View style={styles.optionsContainer}>
            {currentQuestion.options.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionCard,
                  answers[currentQuestion.id] === option.id && styles.optionCardSelected,
                ]}
                onPress={() => handleSingleSelect(option.id)}
              >
                {!isAgeQuestion && option.icon && (
                  <View style={styles.optionIconContainer}>
                    {renderIcon(option.icon, answers[currentQuestion.id] === option.id ? theme.colors.primary : theme.colors.textSecondary)}
                  </View>
                )}
                <View style={styles.optionTextContainer}>
                  <Text style={[
                    styles.optionLabel,
                    answers[currentQuestion.id] === option.id && styles.optionLabelSelected
                  ]}>
                    {option.label}
                  </Text>
                  {option.description && (
                    <Text style={styles.optionDescription}>{option.description}</Text>
                  )}
                </View>
                {answers[currentQuestion.id] === option.id && (
                  <View style={styles.checkmark}>
                    <SvgIcon name="check" size={16} color={theme.colors.primary} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
          {currentQuestion.optional && (
            <TouchableOpacity style={styles.skipButtonBottom} onPress={handleSkip}>
              <Text style={[styles.skipTextBottom, { color: theme.colors.textSecondary }]}>Skip this question</Text>
            </TouchableOpacity>
          )}
        </>
      );
    }

    if (currentQuestion.type === 'multi') {
      return (
        <>
          <Text style={styles.questionText}>{currentQuestion.question}</Text>
          <Text style={styles.multiHint}>Select up to {currentQuestion.maxSelections}</Text>
          <View style={styles.optionsContainer}>
            {currentQuestion.options.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionCard,
                  selectedMultiOptions.includes(option.id) && styles.optionCardSelected,
                ]}
                onPress={() => handleMultiSelect(option.id)}
              >
                {option.icon && (
                  <View style={styles.optionIconContainer}>
                    {renderIcon(option.icon, selectedMultiOptions.includes(option.id) ? theme.colors.primary : theme.colors.textSecondary)}
                  </View>
                )}
                <View style={styles.optionTextContainer}>
                  <Text style={[
                    styles.optionLabel,
                    selectedMultiOptions.includes(option.id) && styles.optionLabelSelected
                  ]}>
                    {option.label}
                  </Text>
                  {option.description && (
                    <Text style={styles.optionDescription}>{option.description}</Text>
                  )}
                </View>
                {selectedMultiOptions.includes(option.id) && (
                  <View style={styles.checkmark}>
                    <SvgIcon name="check" size={16} color={theme.colors.primary} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleMultiSubmit}
          >
            <Text style={styles.submitButtonText}>Continue</Text>
          </TouchableOpacity>
        </>
      );
    }

    if (currentQuestion.type === 'text') {
      return (
        <>
          <Text style={styles.questionText}>{currentQuestion.question}</Text>
          <TextInput
            style={styles.textInput}
            value={textValue}
            onChangeText={setTextValue}
            placeholder={currentQuestion.placeholder}
            placeholderTextColor={theme.colors.textTertiary}
            autoFocus={true}
            maxLength={30}
          />
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleTextSubmit}
          >
            <Text style={styles.submitButtonText}>Continue</Text>
          </TouchableOpacity>
        </>
      );
    }

    return null;
  };

  if (loadingUserData) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <OnboardingSkeleton />
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Saving your preferences...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.skipButton} onPress={completeOnboarding}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
        {renderProgressBar()}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {renderQuestionContent()}
        </View>
      </ScrollView>

      <View style={styles.stepIndicator}>
        <Text style={styles.stepText}>
          Complete your profile
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}