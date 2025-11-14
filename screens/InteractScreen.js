import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function InteractScreen() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);

  const API_URL = 'http://192.168.1.111:8000/student';

  const addMessage = (text, sender) => {
    setMessages(prev => [...prev, { text, sender, id: Date.now().toString() }]);
  };

  const typeResponse = (text) => {
    let index = 0;
    const interval = setInterval(() => {
      setMessages(prev => {
        const newMsgs = [...prev];
        const last = newMsgs[newMsgs.length - 1];
        newMsgs[newMsgs.length - 1] = { ...last, text: text.slice(0, index) };
        return newMsgs;
      });
      index++;
      if (index > text.length) clearInterval(interval);
    }, 20);
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const text = input.trim();
    addMessage(text, 'user');
    setInput('');
    setLoading(true);

    try {
      // 🧠 Process Query
      const lower = text.toLowerCase();

      // 1️⃣ Greeting
      if (lower.includes('hello') || lower.includes('hi')) {
        const msg = "👋 Hello! I’m Remi — your academic assistant. Ask me about your classes or other students.";
        addMessage('', 'remi');
        typeResponse(msg);
        if (voiceMode) Speech.speak(msg);
        setLoading(false);
        return;
      }

      // 2️⃣ Check Timetable
      const data = await AsyncStorage.getItem('timetable');
      if (data) {
        const timetable = JSON.parse(data);
        const isTimeQuery = lower.includes('when') || lower.includes('next');
        const isClassQuery = lower.includes('class') || lower.includes('lecture') || lower.includes('course');

        if (isTimeQuery || isClassQuery) {
          const match = timetable.find(item =>
            lower.includes(item.course.toLowerCase()) ||
            lower.includes(item.lecturer.toLowerCase())
          );

          let msg;
          if (match) {
            msg = `${match.course} is taught by ${match.lecturer} in ${match.room} at ${match.time}.`;
          } else if (isTimeQuery) {
            msg = timetable.length
              ? `Your next lecture is ${timetable[0].course} at ${timetable[0].time} in ${timetable[0].room}.`
              : "You don't have any classes added yet.";
          } else {
            msg = "I couldn’t find that class. Please add it in your timetable.";
          }

          addMessage('', 'remi');
          typeResponse(msg);
          if (voiceMode) Speech.speak(msg);
          setLoading(false);
          return;
        }
      }

      // 3️⃣ Fallback to backend model
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      const dataRes = await res.json();
      addMessage('', 'remi');
      typeResponse(dataRes.response);
      if (voiceMode) Speech.speak(dataRes.response);

    } catch (error) {
      console.log('Fetch error:', error);
      addMessage('Sorry, something went wrong.', 'remi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <FlatList
        data={messages}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={[styles.messageBox, item.sender === 'user' ? styles.userMsg : styles.remiMsg]}>
            <Text style={styles.messageText}>{item.text}</Text>
          </View>
        )}
        contentContainerStyle={{ padding: 15 }}
      />

      {loading && <ActivityIndicator size="small" color="#4a90e2" />}

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Type your message..."
          value={input}
          onChangeText={setInput}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f2' },
  messageBox: {
    padding: 10, borderRadius: 10, marginVertical: 5, maxWidth: '80%',
  },
  userMsg: {
    alignSelf: 'flex-end', backgroundColor: '#4a90e2',
  },
  remiMsg: {
    alignSelf: 'flex-start', backgroundColor: '#e0e0e0',
  },
  messageText: { color: '#000' },
  inputBar: {
    flexDirection: 'row', alignItems: 'center',
    padding: 10, backgroundColor: '#fff',
    borderTopWidth: 1, borderColor: '#ddd',
  },
  input: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 20, padding: 8, marginRight: 10, backgroundColor: '#fff' },
  sendBtn: {
    backgroundColor: '#4a90e2',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
  },
});
