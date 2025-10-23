import React, { useState } from 'react';
import { View, Text, Button, TextInput, StyleSheet } from 'react-native';
import * as Speech from 'expo-speech';

export default function App() {
  const [input, setInput] = useState('');

  const handleCommand = () => {
    const command = input.toLowerCase();
    if (command.includes('hello remi')) {
      Speech.speak('Hello, how can I help you today?');
    } else {
      Speech.speak(`You said: ${command}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎙️ Remi Academic Assistant</Text>
      <TextInput
        style={styles.input}
        placeholder="Type your command..."
        value={input}
        onChangeText={setInput}
      />
      <Button title="Send Command" onPress={handleCommand} />
      <Text style={styles.text}>Command: {input}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '90%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  text: {
    marginTop: 15,
    fontSize: 16,
    color: '#333',
  },
});
