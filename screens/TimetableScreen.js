import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TimetableScreen() {
  const [course, setCourse] = useState('');
  const [room, setRoom] = useState('');
  const [lecturer, setLecturer] = useState('');
  const [time, setTime] = useState('');
  const [timetable, setTimetable] = useState([]);

  useEffect(() => {
    loadTimetable();
  }, []);

  const loadTimetable = async () => {
    const data = await AsyncStorage.getItem('timetable');
    if (data) setTimetable(JSON.parse(data));
  };

  const saveTimetable = async (newTable) => {
    await AsyncStorage.setItem('timetable', JSON.stringify(newTable));
  };

  const addLecture = () => {
    if (!course || !room || !lecturer || !time) {
      Alert.alert('Missing Data', 'Please fill all fields.');
      return;
    }
    const newEntry = { course, room, lecturer, time };
    const newTable = [...timetable, newEntry];
    setTimetable(newTable);
    saveTimetable(newTable);
    setCourse(''); setRoom(''); setLecturer(''); setTime('');
  };

  const resetTimetable = async () => {
    await AsyncStorage.removeItem('timetable');
    setTimetable([]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🕒 Add Timetable</Text>

      <TextInput
        style={styles.input}
        placeholder="Course Name"
        value={course}
        onChangeText={setCourse}
      />
      <TextInput
        style={styles.input}
        placeholder="Room"
        value={room}
        onChangeText={setRoom}
      />
      <TextInput
        style={styles.input}
        placeholder="Lecturer Name"
        value={lecturer}
        onChangeText={setLecturer}
      />
      <TextInput
        style={styles.input}
        placeholder="Time (e.g., 9:00 AM - 10:30 AM)"
        value={time}
        onChangeText={setTime}
      />

      <TouchableOpacity style={styles.button} onPress={addLecture}>
        <Text style={styles.buttonText}>➕ Add Lecture</Text>
      </TouchableOpacity>

      <FlatList
        data={timetable}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.itemBox}>
            <Text style={styles.itemText}>
              {item.course} — {item.time}
            </Text>
            <Text style={styles.subText}>
              {item.room} • {item.lecturer}
            </Text>
          </View>
        )}
      />

      <TouchableOpacity style={styles.resetButton} onPress={resetTimetable}>
        <Text style={styles.buttonText}>🗑️ Clear All</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fafafa' },
  title: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 15 },
  input: {
    borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10,
    marginVertical: 5, backgroundColor: '#fff'
  },
  button: {
    backgroundColor: '#4a90e2', padding: 12, borderRadius: 8,
    alignItems: 'center', marginVertical: 10
  },
  resetButton: {
    backgroundColor: '#ff3b30', padding: 10, borderRadius: 8,
    alignItems: 'center', marginTop: 15
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  itemBox: {
    backgroundColor: '#fff', padding: 10, borderRadius: 8,
    marginVertical: 5, borderWidth: 1, borderColor: '#ddd'
  },
  itemText: { fontSize: 16, fontWeight: 'bold' },
  subText: { fontSize: 14, color: '#666' },
});
