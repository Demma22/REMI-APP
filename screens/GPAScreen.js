import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from 'react-native';

export default function GPAScreen() {
  const [course, setCourse] = useState('');
  const [credit, setCredit] = useState('');
  const [grade, setGrade] = useState('');
  const [courses, setCourses] = useState([]);
  const [gpa, setGpa] = useState(null);

  const gradePoints = {
    'A': 5.0, 'B+': 4.5, 'B': 4.0,
    'C+': 3.5, 'C': 3.0, 'D': 2.0, 'F': 0.0
  };

  const addCourse = () => {
    if (!course || !credit || !grade) return;
    const newCourse = { course, credit: parseFloat(credit), grade };
    setCourses([...courses, newCourse]);
    setCourse('');
    setCredit('');
    setGrade('');
  };

  const calculateGPA = () => {
    if (courses.length === 0) return;
    let totalUnits = 0;
    let totalPoints = 0;

    courses.forEach(c => {
      totalUnits += c.credit;
      totalPoints += c.credit * gradePoints[c.grade];
    });

    const result = (totalPoints / totalUnits).toFixed(2);
    setGpa(result);
  };

  const reset = () => {
    setCourses([]);
    setGpa(null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📊 GPA Calculator</Text>

      <TextInput
        style={styles.input}
        placeholder="Course Name"
        value={course}
        onChangeText={setCourse}
      />

      <TextInput
        style={styles.input}
        placeholder="Credit Units"
        keyboardType="numeric"
        value={credit}
        onChangeText={setCredit}
      />

      <TextInput
        style={styles.input}
        placeholder="Grade (A, B+, B, C+, C, D, F)"
        value={grade}
        onChangeText={setGrade}
      />

      <TouchableOpacity style={styles.addButton} onPress={addCourse}>
        <Text style={styles.buttonText}>➕ Add Course</Text>
      </TouchableOpacity>

      <FlatList
        data={courses}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <Text style={styles.courseItem}>
            {item.course} — {item.credit} CU — {item.grade}
          </Text>
        )}
      />

      <TouchableOpacity style={styles.calcButton} onPress={calculateGPA}>
        <Text style={styles.buttonText}>🧮 Calculate GPA</Text>
      </TouchableOpacity>

      {gpa && (
        <View style={styles.resultBox}>
          <Text style={styles.resultText}>Your GPA is {gpa}</Text>
        </View>
      )}

      <TouchableOpacity style={styles.resetButton} onPress={reset}>
        <Text style={styles.buttonText}>🔄 Reset</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', padding: 20, backgroundColor: '#fafafa' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 15 },
  input: {
    width: '90%', borderWidth: 1, borderColor: '#ccc', borderRadius: 8,
    padding: 10, marginVertical: 5, backgroundColor: '#fff'
  },
  addButton: {
    backgroundColor: '#4a90e2', padding: 10, borderRadius: 8, width: '90%', alignItems: 'center', marginVertical: 8
  },
  calcButton: {
    backgroundColor: '#34c759', padding: 10, borderRadius: 8, width: '90%', alignItems: 'center', marginVertical: 8
  },
  resetButton: {
    backgroundColor: '#ff3b30', padding: 10, borderRadius: 8, width: '90%', alignItems: 'center', marginVertical: 8
  },
  buttonText: { color: 'white', fontWeight: 'bold' },
  courseItem: { fontSize: 16, marginVertical: 4, color: '#333' },
  resultBox: {
    backgroundColor: '#e6f7ff', padding: 15, borderRadius: 10, marginVertical: 10, width: '90%', alignItems: 'center'
  },
  resultText: { fontSize: 18, fontWeight: 'bold', color: '#007aff' },
});
