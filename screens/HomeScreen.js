import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎓 Welcome to Remi</Text>
      <Text style={styles.subtitle}>Your personal academic assistant</Text>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Add Timetable')}>
        <Text style={styles.buttonText}>🕒 Add Timetable</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Interact')}>
        <Text style={styles.buttonText}>💬 Interact</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Calculate GPA')}>
        <Text style={styles.buttonText}>📊 Calculate GPA</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fafafa' },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 10 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 30 },
  button: { backgroundColor: '#4a90e2', padding: 15, borderRadius: 10, marginVertical: 10, width: '70%' },
  buttonText: { color: 'white', fontSize: 16, textAlign: 'center' },
});
