// screens/timetable/components/TimePicker.js
import React, { useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
} from "react-native";
import SvgIcon from "../../../components/SvgIcon";

const hours = Array.from({ length: 12 }, (_, i) => i + 1);
const minutes = ["00", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31", "32", "33", "34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46", "47", "48", "49", "50", "51", "52", "53", "54", "55", "56", "57", "58", "59"];
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
  const hourListRef = useRef(null);
  const minuteListRef = useRef(null);
  const periodListRef = useRef(null);

  // Get item layout for FlatList to enable smooth scrolling
  const getItemLayout = (data, index) => ({
    length: 50,
    offset: 50 * index,
    index,
  });

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

  // Get the index of current hour for initial scroll
  const getHourIndex = () => {
    const index = hours.indexOf(hour);
    return index !== -1 ? index : 0;
  };

  // Get the index of current minute for initial scroll
  const getMinuteIndex = () => {
    const index = minutes.indexOf(minute);
    return index !== -1 ? index : 0;
  };

  // Get the index of current period for initial scroll
  const getPeriodIndex = () => {
    const index = periods.indexOf(period);
    return index !== -1 ? index : 0;
  };

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
              ref={hourListRef}
              data={hours}
              renderItem={renderHourItem}
              keyExtractor={(item) => item.toString()}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.pickerList}
              getItemLayout={getItemLayout}
              initialScrollIndex={getHourIndex()}
              onScrollToIndexFailed={(info) => {
                // Fallback if scrolling to index fails
                const wait = new Promise(resolve => setTimeout(resolve, 500));
                wait.then(() => {
                  hourListRef.current?.scrollToIndex({ index: info.index, animated: true });
                });
              }}
            />
          </View>

          {/* Minute Column */}
          <View style={styles.timePickerColumn}>
            <Text style={[styles.timePickerColumnLabel, { color: theme.colors.textSecondary }]}>
              Minute
            </Text>
            <FlatList
              ref={minuteListRef}
              data={minutes}
              renderItem={renderMinuteItem}
              keyExtractor={(item) => item}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.pickerList}
              getItemLayout={getItemLayout}
              initialScrollIndex={getMinuteIndex()}
              onScrollToIndexFailed={(info) => {
                const wait = new Promise(resolve => setTimeout(resolve, 500));
                wait.then(() => {
                  minuteListRef.current?.scrollToIndex({ index: info.index, animated: true });
                });
              }}
            />
          </View>

          {/* Period Column */}
          <View style={styles.timePickerColumn}>
            <Text style={[styles.timePickerColumnLabel, { color: theme.colors.textSecondary }]}>
              AM/PM
            </Text>
            <FlatList
              ref={periodListRef}
              data={periods}
              renderItem={renderPeriodItem}
              keyExtractor={(item) => item}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.pickerList}
              getItemLayout={getItemLayout}
              initialScrollIndex={getPeriodIndex()}
              onScrollToIndexFailed={(info) => {
                const wait = new Promise(resolve => setTimeout(resolve, 500));
                wait.then(() => {
                  periodListRef.current?.scrollToIndex({ index: info.index, animated: true });
                });
              }}
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