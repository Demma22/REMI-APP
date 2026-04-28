import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
} from "react-native";
import SvgIcon from "../../../components/SvgIcon";

const LectureForm = ({
  index,
  lecture,
  coursesForSemester,
  showCourseDropdown,
  onUpdateEntry,
  onShowCourseDropdown,
  saving,
  preparingNotifications,
  theme,
  styles,
}) => {
  const isDisabled = saving || preparingNotifications;

  return (
    <View style={styles.lectureCard}>
      <View style={styles.lectureHeader}>
        <View style={styles.lectureHeaderLeft}>
          <View style={[styles.lectureNumber, { backgroundColor: theme.colors.primaryLight }]}>
            <Text style={[styles.lectureNumberText, { color: theme.colors.primary }]}>#{index + 1}</Text>
          </View>
          <Text style={styles.lectureTitle}>
            Lecture {index + 1}
          </Text>
        </View>
        {coursesForSemester.length === 0 && (
          <Text style={styles.warningText}>No courses</Text>
        )}
      </View>

      {/* Course Selection Dropdown */}
      <Text style={styles.inputLabel}>Course *</Text>
      <TouchableOpacity
        style={[
          styles.courseDropdownButton,
          !lecture.name && styles.courseDropdownButtonEmpty,
          showCourseDropdown === index && styles.courseDropdownButtonActive,
          isDisabled && styles.dropdownDisabled
        ]}
        onPress={() => {
          if (coursesForSemester.length > 0 && !isDisabled) {
            onShowCourseDropdown(index);
          }
        }}
        disabled={coursesForSemester.length === 0 || isDisabled}
      >
        <SvgIcon name="book" size={16} color={theme.colors.textSecondary} />
        <Text style={[
          styles.courseDropdownButtonText,
          !lecture.name && styles.courseDropdownButtonTextEmpty
        ]}>
          {lecture.name || "Select a course"}
        </Text>
        <SvgIcon name="chevron-down" size={14} color={theme.colors.textSecondary} />
      </TouchableOpacity>

      {/* Time Inputs Row */}
      <View style={styles.timeRow}>
        <View style={styles.timeInputContainer}>
          <Text style={styles.inputLabel}>Start Time *</Text>
          <View style={[styles.timeInputWrapper, isDisabled && styles.inputDisabled]}>
            <SvgIcon name="clock" size={16} color={theme.colors.textSecondary} />
            <TextInput 
              style={styles.timeInput} 
              value={lecture.start} 
              onChangeText={(v) => onUpdateEntry(index, "start", v)}
              placeholder="9:00 AM"
              placeholderTextColor={theme.colors.textPlaceholder}
              editable={!isDisabled}
            />
          </View>
          <Text style={[styles.timeHint, { color: theme.colors.textTertiary }]}>Format: 9:00 AM</Text>
        </View>
        
        <View style={styles.timeInputContainer}>
          <Text style={styles.inputLabel}>End Time *</Text>
          <View style={[styles.timeInputWrapper, isDisabled && styles.inputDisabled]}>
            <SvgIcon name="clock" size={16} color={theme.colors.textSecondary} />
            <TextInput 
              style={styles.timeInput} 
              value={lecture.end} 
              onChangeText={(v) => onUpdateEntry(index, "end", v)}
              placeholder="10:00 AM"
              placeholderTextColor={theme.colors.textPlaceholder}
              editable={!isDisabled}
            />
          </View>
          <Text style={[styles.timeHint, { color: theme.colors.textTertiary }]}>Format: 10:00 AM</Text>
        </View>
      </View>

      {/* Lecturer Input */}
      <Text style={styles.inputLabel}>Lecturer</Text>
      <View style={[styles.inputWrapper, isDisabled && styles.inputDisabled]}>
        <SvgIcon name="user" size={16} color={theme.colors.textSecondary} />
        <TextInput 
          style={styles.input} 
          value={lecture.lecturer} 
          onChangeText={(v) => onUpdateEntry(index, "lecturer", v)}
          placeholder="Enter lecturer name"
          placeholderTextColor={theme.colors.textPlaceholder}
          editable={!isDisabled}
        />
      </View>

      {/* Room Input */}
      <Text style={styles.inputLabel}>Room</Text>
      <View style={[styles.inputWrapper, isDisabled && styles.inputDisabled]}>
        <SvgIcon name="location" size={16} color={theme.colors.textSecondary} />
        <TextInput 
          style={styles.input} 
          value={lecture.room} 
          onChangeText={(v) => onUpdateEntry(index, "room", v)}
          placeholder="Enter room number"
          placeholderTextColor={theme.colors.textPlaceholder}
          editable={!isDisabled}
        />
      </View>
    </View>
  );
};

export default LectureForm;