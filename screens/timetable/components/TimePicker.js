// screens/timetable/components/TimePicker.js
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
} from "react-native";
import SvgIcon from "../../../components/SvgIcon";

const hours = Array.from({ length: 12 }, (_, i) => i + 1);
const minutes = ["00", "15", "30", "45"];
const periods = ["AM", "PM"];

export default function TimePicker({
  hour,
  minute,
  period,
  onHourChange,
  onMinuteChange,
  onPeriodChange,
  onClose,
  theme,
  styles,
}) {
  const [activePicker, setActivePicker] = useState("hour"); // hour, minute, period

  const renderHourItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.pickerItem,
        hour === item && styles.pickerItemSelected,
      ]}
      onPress={() => onHourChange(item)}
    >
      <Text
        style={[
          styles.pickerItemText,
          hour === item && styles.pickerItemTextSelected,
        ]}
      >
        {item}
      </Text>
    </TouchableOpacity>
  );

  const renderMinuteItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.pickerItem,
        minute === item && styles.pickerItemSelected,
      ]}
      onPress={() => onMinuteChange(item)}
    >
      <Text
        style={[
          styles.pickerItemText,
          minute === item && styles.pickerItemTextSelected,
        ]}
      >
        {item}
      </Text>
    </TouchableOpacity>
  );

  const renderPeriodItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.pickerItem,
        period === item && styles.pickerItemSelected,
      ]}
      onPress={() => onPeriodChange(item)}
    >
      <Text
        style={[
          styles.pickerItemText,
          period === item && styles.pickerItemTextSelected,
        ]}
      >
        {item}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.timePickerContainer}>
      <View style={[styles.timePickerContent, { backgroundColor: theme.colors.card }]}>
        <View style={styles.timePickerHeader}>
          <Text style={[styles.timePickerTitle, { color: theme.colors.textPrimary }]}>
            Select Time
          </Text>
          <TouchableOpacity onPress={onClose}>
            <SvgIcon name="close" size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.timePickerColumns}>
          {/* Hour Column */}
          <View style={styles.timePickerColumn}>
            <Text style={[styles.timePickerColumnLabel, { color: theme.colors.textSecondary }]}>
              Hour
            </Text>
            <FlatList
              data={hours}
              renderItem={renderHourItem}
              keyExtractor={(item) => item.toString()}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.pickerList}
              getItemLayout={(data, index) => ({
                length: 50,
                offset: 50 * index,
                index,
              })}
              initialScrollIndex={hour - 1}
            />
          </View>

          {/* Minute Column */}
          <View style={styles.timePickerColumn}>
            <Text style={[styles.timePickerColumnLabel, { color: theme.colors.textSecondary }]}>
              Minute
            </Text>
            <FlatList
              data={minutes}
              renderItem={renderMinuteItem}
              keyExtractor={(item) => item}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.pickerList}
              initialScrollIndex={minutes.indexOf(minute)}
            />
          </View>

          {/* Period Column */}
          <View style={styles.timePickerColumn}>
            <Text style={[styles.timePickerColumnLabel, { color: theme.colors.textSecondary }]}>
              AM/PM
            </Text>
            <FlatList
              data={periods}
              renderItem={renderPeriodItem}
              keyExtractor={(item) => item}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.pickerList}
              initialScrollIndex={periods.indexOf(period)}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.timePickerConfirmBtn, { backgroundColor: theme.colors.primary }]}
          onPress={onClose}
        >
          <Text style={styles.timePickerConfirmText}>Confirm</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}