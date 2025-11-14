<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
import { View, Text, Button, TextInput, FlatList, StyleSheet } from 'react-native';
import * as Speech from 'expo-speech';
import { saveTimetable, getTimetable } from './services/storageService';
import dayjs from 'dayjs';

export default function App() {
  const [input, setInput] = useState('');
  const [timetable, setTimetable] = useState([]);

  // Load saved timetable on startup
  useEffect(() => {
    (async () => {
      const data = await getTimetable();
      setTimetable(data);
    })();
  }, []);

  const handleCommand = async () => {
    const command = input.toLowerCase();

    if (command.startsWith('add lecture')) {
      // Example: "add lecture maths 10am b12"
      const parts = command.split(' ');
      const subject = parts[2];
      const time = parts[3];
      const room = parts[4] || 'unknown';

      const newLecture = { subject, time, room };
      const updated = [...timetable, newLecture];
      setTimetable(updated);
      await saveTimetable(updated);

      Speech.speak(`Added ${subject} lecture at ${time} in room ${room}`);
    }

    else if (command.includes('next lecture')) {
      if (timetable.length === 0) {
        Speech.speak('You have no lectures saved yet.');
      } else {
        const next = timetable[0];
        Speech.speak(`Your next lecture is ${next.subject} at ${next.time} in room ${next.room}`);
      }
    }

    else if (command.includes('show lectures')) {
      if (timetable.length === 0) {
        Speech.speak('You have no lectures saved.');
      } else {
        Speech.speak(`You have ${timetable.length} lectures.`);
      }
    }

    else {
      Speech.speak(`I didn’t understand. Try saying: add lecture maths 10am b12.`);
    }

    setInput('');
  };
=======
import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './screens/HomeScreen';
import InteractScreen from './screens/InteractScreen';
import TimetableScreen from './screens/TimetableScreen';
import GPAScreen from './screens/GPAScreen';

const Stack = createStackNavigator();
>>>>>>> interact-updates

export default function App() {
  return (
<<<<<<< HEAD
    <View style={styles.container}>
      <Text style={styles.title}>📅 REMI Academic Assistant</Text>

      <TextInput
        style={styles.input}
        placeholder="Type your command..."
        value={input}
        onChangeText={setInput}
      />
      <Button title="Send Command" onPress={handleCommand} />

      <FlatList
        style={{ marginTop: 20 }}
        data={timetable}
        keyExtractor={(item, i) => i.toString()}
        renderItem={({ item }) => (
          <Text>{`${item.subject} - ${item.time} - Room ${item.room}`}</Text>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  input: { width: '90%', borderWidth: 1, borderColor: '#ccc', borderRadius: 10, padding: 10, marginBottom: 15, backgroundColor: '#f9f9f9' },
});
=======
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Interact" component={InteractScreen} />
        <Stack.Screen name="Calculate GPA" component={GPAScreen} />
        <Stack.Screen name="Add Timetable" component={TimetableScreen} />
        
      </Stack.Navigator>
    </NavigationContainer>
  );
}
>>>>>>> interact-updates
