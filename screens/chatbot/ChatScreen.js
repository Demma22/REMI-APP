// screens/ChatScreen.js
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  LayoutAnimation,
  UIManager,
  Keyboard,
  Alert,
  Dimensions,
} from "react-native";
import { auth, db } from "../../firebase";
import { doc, getDoc, collection, addDoc, query, orderBy, getDocs, deleteDoc, serverTimestamp } from "firebase/firestore";

const { height: screenHeight } = Dimensions.get("window");

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function ChatScreen({ navigation }) {
  if (!auth.currentUser) {
    return <Text>Not logged in</Text>;
  }

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [userData, setUserData] = useState(null);
  const flatRef = useRef();
  
  const [thinkingDots, setThinkingDots] = useState("");
  const dotsIntervalRef = useRef(null);

  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        setKeyboardVisible(true);
        setTimeout(() => scrollToEnd(), 100);
      }
    );
    const hideSubscription = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
        setKeyboardVisible(false);
      }
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  useEffect(() => {
    if (dotsIntervalRef.current) {
      clearInterval(dotsIntervalRef.current);
    }

    if (loading) {
      setThinkingDots("");
      
      dotsIntervalRef.current = setInterval(() => {
        setThinkingDots(prev => {
          if (prev === "...") return "";
          if (prev === "..") return "...";
          if (prev === ".") return "..";
          return ".";
        });
      }, 400);
    } else {
      setThinkingDots("");
    }

    return () => {
      if (dotsIntervalRef.current) {
        clearInterval(dotsIntervalRef.current);
        dotsIntervalRef.current = null;
      }
    };
  }, [loading]);

  useEffect(() => {
    loadUserData();
    loadChatHistory();
  }, []);

  const loadUserData = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const userDocRef = doc(db, "users", currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      }
    } catch (error) {
      // Continue without user data
    }
  };

  const loadChatHistory = async () => {
    try {
      const chatRef = collection(db, "users", auth.currentUser.uid, "chat_history");
      const q = query(chatRef, orderBy("timestamp", "asc"));
      const querySnapshot = await getDocs(q);
      
      const chatMessages = querySnapshot.docs.map(doc => ({
        id: doc.id,
        text: doc.data().message,
        sender: doc.data().isUser ? "user" : "remi",
      }));

      setMessages(chatMessages);
    } catch (error) {
      // Continue without chat history
    }
  };

  const saveChatMessage = async (message, isUser) => {
    try {
      const chatRef = collection(db, "users", auth.currentUser.uid, "chat_history");
      
      await addDoc(chatRef, {
        message,
        isUser,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      // Continue without saving
    }
  };

  const clearChatHistory = async () => {
    try {
      const chatRef = collection(db, "users", auth.currentUser.uid, "chat_history");
      const querySnapshot = await getDocs(chatRef);
      
      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      setMessages([]);
    } catch (error) {
      Alert.alert("Error", "Could not clear chat history");
    }
  };

  const scrollToEnd = (animated = true) => {
    setTimeout(() => {
      if (flatRef.current && messages.length > 0) {
        flatRef.current.scrollToEnd({ animated });
      }
    }, 150);
  };

  const addMessage = async (text, sender, id = null) => {
    const msg = { id: id || Date.now().toString(), text, sender };
    setMessages((prev) => [...prev, msg]);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    setTimeout(() => {
      scrollToEnd();
    }, 200);
    
    if (sender === "user") {
      await saveChatMessage(text, true);
    }
  };

  const typeResponse = async (fullText) => {
    if (!fullText) {
      addMessage("Sorry, I couldn't process that request.", "remi");
      return;
    }

    const id = Date.now().toString();
    setMessages((p) => [...p, { id, text: "", sender: "remi" }]);
    
    scrollToEnd();

    let i = 0;
    const speed = 20;
    await new Promise((resolve) => {
      const interval = setInterval(() => {
        i++;
        setMessages((prev) => {
          const copy = [...prev];
          const index = copy.findIndex((m) => m.id === id);
          if (index !== -1) {
            copy[index].text = fullText.slice(0, i);
          }
          return copy;
        });
        
        if (i % 3 === 0) {
          scrollToEnd(false);
        }

        if (i >= fullText.length) {
          clearInterval(interval);
          resolve();
        }
      }, speed);
    });

    scrollToEnd();
    await saveChatMessage(fullText, false);
  };

  const shouldFetchDataFromDB = (text) => {
    const lowerText = text.toLowerCase().trim();
    
    const simpleGreetings = [
      'hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening',
      'how are you', 'what\'s up', 'sup', 'yo',
      'thanks', 'thank you', 'thank', 'bye', 'goodbye', 'see you',
      'who are you', 'what can you do', 'help',
      'hi remi', 'hello remi', 'hey remi', 'good morning remi'
    ];

    if (simpleGreetings.some(greeting => lowerText.includes(greeting))) {
      return false;
    }

    const needsDataKeywords = [
      'my', 'me', 'i have', 'my class', 'my lecture', 'my schedule',
      'when is my', 'where is my', 'what is my', 'do i have',
      'timetable', 'schedule', 'class today', 'lecture today',
      'exam', 'exams', 'gpa', 'grade', 'grades', 'semester',
      'room', 'lecturer', 'professor', 'course', 'unit',
      'today', 'tomorrow', 'monday', 'tuesday', 'wednesday', 
      'thursday', 'friday', 'saturday', 'sunday',
      'next class', 'next lecture', 'this week',
      'assignment', 'homework', 'project', 'deadline', 'test'
    ];

    return needsDataKeywords.some(keyword => lowerText.includes(keyword));
  };

  const getContextData = async (queryText) => {
    if (!shouldFetchDataFromDB(queryText) || !userData) {
      return {};
    }
    
    const contextData = { basicInfo: {} };
    
    contextData.basicInfo = {
      nickname: userData.nickname || "Student",
      course: userData.course || "Not specified",
      currentSemester: userData.current_semester || 1
    };

    const lowerText = queryText.toLowerCase();
    
    if (lowerText.includes('timetable') || 
        lowerText.includes('schedule') ||
        lowerText.includes('class') ||
        lowerText.includes('lecture') ||
        lowerText.includes('today') ||
        lowerText.includes('tomorrow') ||
        lowerText.match(/(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/)) {
      contextData.timetable = userData.timetable || {};
    }

    if (lowerText.includes('gpa') || lowerText.includes('grade')) {
      contextData.gpa_data = userData.gpa_data || {};
    }

    if (lowerText.includes('course') || lowerText.includes('unit')) {
      contextData.units = userData.units || {};
    }

    if (lowerText.includes('exam') || lowerText.includes('test')) {
      contextData.exams = userData.exams || {};
    }

    return contextData;
  };

const send = async () => {
  const text = input.trim();
  if (!text) return;

  const currentUser = auth.currentUser;
  if (!currentUser) {
    Alert.alert("Error", "You need to be logged in");
    return;
  }

  await addMessage(text, "user");
  setInput("");
  setLoading(true);

  try {
    // Get Firebase authentication token
    const token = await currentUser.getIdToken();
    
    const contextData = await getContextData(text);

    const requestBody = {
      query: text,
      context: contextData
    };

    const res = await fetch("https://ai-backend-yl4w.onrender.com/ask", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(requestBody),
    });
    
    if (!res.ok) {
      throw new Error(`Server error: ${res.status}`);
    }
    
    const json = await res.json();
    
    if (json.answer) {
      await typeResponse(json.answer);
    } else if (json.error) {
      await typeResponse(`I encountered an error: ${json.error}`);
    } else {
      await typeResponse("I'm here to help with your academic questions!");
    }
  } catch (error) {
    await typeResponse("I'm having connection issues. Please check your internet and try again.");
  }

  setLoading(false);
};

  const handleClearChat = () => {
    Alert.alert(
      "Clear Chat History",
      "Are you sure you want to clear all chat history?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Clear", 
          style: "destructive", 
          onPress: clearChatHistory 
        },
      ]
    );
  };

  const handleInputFocus = () => {
    setTimeout(() => scrollToEnd(), 300);
  };

  const hasMessages = messages.length > 0;
  const contentHeight = screenHeight - (keyboardVisible ? keyboardHeight : 0) - 180;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.backBtn} 
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>REMI</Text>
          {hasMessages && (
            <TouchableOpacity onPress={handleClearChat} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Main Content */}
      <View style={[styles.content, { height: contentHeight }]}>
        {!hasMessages ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Text style={styles.emptyIconText}>💬</Text>
            </View>
            <Text style={styles.emptyTitle}>What would you like to ask today?</Text>
            <Text style={styles.emptySubtitle}>
              Ask about classes • timetable • GPA • exams • study help
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesContainer}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.bubble,
                  item.sender === "user" ? styles.userBubble : styles.remiBubble,
                ]}
              >
                <Text style={item.sender === "user" ? styles.userText : styles.remiText}>
                  {item.text}
                </Text>
              </View>
            )}
            onContentSizeChange={() => scrollToEnd(false)}
            onLayout={() => scrollToEnd(false)}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Simple thinking dots indicator - positioned above input */}
      {loading && (
        <View style={[
          styles.thinkingDotsContainer,
          { bottom: keyboardHeight + 70 } // Position above input bar
        ]}>
          <View style={styles.thinkingDotsBubble}>
            <ActivityIndicator size="small" color="#535FFD" style={styles.thinkingIndicator} />
            <Text style={styles.thinkingDotsText}>{thinkingDots}</Text>
          </View>
        </View>
      )}

      {/* Input Bar - Simple implementation without KeyboardAvoidingView pushing it */}
      <View style={[
        styles.inputBar, 
        { 
          bottom: keyboardHeight,
          marginBottom: 0 // No extra margin
        }
      ]}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Message Remi..."
          style={styles.input}
          returnKeyType="send"
          onSubmitEditing={send}
          placeholderTextColor="#94A3B8"
          multiline={true}
          maxLength={500}
          onFocus={handleInputFocus}
        />

        <TouchableOpacity 
          onPress={send} 
          style={[
            styles.sendBtn,
            !input.trim() && styles.sendBtnDisabled
          ]}
          disabled={!input.trim()}
        >
          <Text style={styles.sendBtnText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  header: {
    backgroundColor: "#FFFFFF",
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FAFAFA",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  backText: { 
    fontSize: 24, 
    color: "#535FFD", 
    fontWeight: "300",
    lineHeight: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#383940",
    textAlign: "center",
  },
  clearButton: {
    backgroundColor: "rgba(247, 133, 34, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  clearButtonText: {
    color: "#F78522",
    fontSize: 14,
    fontWeight: "600",
  },
  content: {
    padding: 16,
  },
  messagesContainer: {
    paddingBottom: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 40,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(83, 95, 253, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyIconText: {
    fontSize: 32,
  },
  emptyTitle: { 
    fontSize: 20, 
    fontWeight: "700", 
    color: "#383940",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: { 
    color: "#64748B", 
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 16,
  },

  // Simple thinking dots - just dots animation
  thinkingDotsContainer: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
  },
  thinkingDotsBubble: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  thinkingIndicator: {
    marginRight: 8,
  },
  thinkingDotsText: {
    color: "#535FFD",
    fontSize: 18,
    fontWeight: "bold",
    width: 30,
  },

  // Input Bar - Simple implementation
  inputBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 80,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#FAFAFA",
    fontSize: 16,
    color: "#383940",
    textAlignVertical: "center",
    marginRight: 12,
  },
  sendBtn: {
    backgroundColor: "#535FFD",
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#535FFD",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  sendBtnDisabled: {
    backgroundColor: "#94A3B8",
    shadowColor: "#94A3B8",
  },
  sendBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  // Message Bubbles
  bubble: {
    padding: 16,
    borderRadius: 20,
    marginVertical: 6,
    maxWidth: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userBubble: {
    backgroundColor: "#535FFD",
    alignSelf: "flex-end",
    borderBottomRightRadius: 6,
  },
  remiBubble: {
    backgroundColor: "#FFFFFF",
    alignSelf: "flex-start",
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  userText: { 
    color: "#fff",
    fontSize: 16,
    lineHeight: 20,
  },
  remiText: { 
    color: "#383940",
    fontSize: 16,
    lineHeight: 20,
  },
});