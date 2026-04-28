// screens/timetable/components/ActivityTypeSelector.js
import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";

export default function ActivityTypeSelector({
  selectedType,
  onSelectType,
  activityTypes,
  theme,
  styles,
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>Activity Type</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeContainer}>
        {activityTypes.map((type) => (
          <TouchableOpacity
            key={type.id}
            style={[
              styles.typeButton,
              selectedType === type.id && { backgroundColor: type.color },
            ]}
            onPress={() => onSelectType(type.id)}
          >
            <Text
              style={[
                styles.typeButtonText,
                selectedType === type.id && styles.typeButtonTextSelected,
              ]}
            >
              {type.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}