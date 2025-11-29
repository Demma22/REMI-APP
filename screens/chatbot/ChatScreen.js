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
import { doc, getDoc, setDoc, collection, addDoc, query, orderBy, limit, getDocs, deleteDoc, serverTimestamp } from "firebase/firestore";

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
  const [isTyping, setIsTyping] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const flatRef = useRef();
  const inputRef = useRef();

  // Simple dots animation state
  const [dots, setDots] = useState("");

  // Animated dots that cycle every 400ms - FIXED LOGIC
  useEffect(() => {
    let interval;
    if (loading) { // Changed from (loading || isTyping) to just (loading)
      console.log("🔄 Starting dots animation");
      interval = setInterval(() => {
        setDots(prev => {
          if (prev === "...") return "";
          if (prev === "..") return "...";
          if (prev === ".") return "..";
          return ".";
        });
      }, 400);
    } else {
      console.log("🛑 Stopping dots animation");
      setDots("");
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loading]); // Only depend on loading state

  // Keyboard listeners
  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        setKeyboardVisible(true);
        setTimeout(() => scrollToEnd(), 100);
      }
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
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

  // Load chat history on mount
  useEffect(() => {
    loadChatHistory();
  }, []);

  // Load entire chat history from Firestore (no limit)
  const loadChatHistory = async () => {
    try {
      const chatRef = collection(db, "users", auth.currentUser.uid, "chat_history");
      const q = query(chatRef, orderBy("timestamp", "asc"));
      const querySnapshot = await getDocs(q);
      
      const chatMessages = querySnapshot.docs.map(doc => ({
        id: doc.id,
        text: doc.data().message,
        sender: doc.data().isUser ? "user" : "remi",
        timestamp: doc.data().timestamp?.toDate()
      }));

      setMessages(chatMessages);
    } catch (error) {
      console.log("Error loading chat history:", error);
    }
  };

  // Save message to Firestore
  const saveChatMessage = async (message, isUser) => {
    try {
      const chatRef = collection(db, "users", auth.currentUser.uid, "chat_history");
      
      await addDoc(chatRef, {
        message,
        isUser,
        timestamp: serverTimestamp()
      });
      
    } catch (error) {
      console.log('Error saving chat message:', error);
      throw error;
    }
  };

  // Clear all chat history
  const clearChatHistory = async () => {
    try {
      const chatRef = collection(db, "users", auth.currentUser.uid, "chat_history");
      const querySnapshot = await getDocs(chatRef);
      
      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      setMessages([]);
      console.log('✅ Chat history cleared');
    } catch (error) {
      console.log('Error clearing chat history:', error);
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
    
    // Save to Firestore for user messages
    if (sender === "user") {
      await saveChatMessage(text, true);
    }
  };

  const typeResponse = async (fullText) => {
    if (!fullText) {
      addMessage("Sorry, got an invalid reply from the server.", "remi");
      return;
    }

    setIsTyping(true);

    const id = Date.now().toString();
    setMessages((p) => [...p, { id, text: "", sender: "remi" }]);
    
    // Scroll immediately when starting to type
    scrollToEnd();

    let i = 0;
    const speed = 18;
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
        
        // Scroll continuously while typing
        if (i % 3 === 0) {
          scrollToEnd(false);
        }

        if (i >= fullText.length) {
          clearInterval(interval);
          resolve();
        }
      }, speed);
    });

    // Final scroll to ensure we're at the bottom
    scrollToEnd();
    setIsTyping(false);

    // Save Remi's response to Firestore
    await saveChatMessage(fullText, false);
  };

  const send = async () => {
    const text = input.trim();
    if (!text) return;

    // Get current user
    const currentUser = auth.currentUser;
    if (!currentUser) {
      Alert.alert("Error", "You need to be logged in to chat with REMI");
      return;
    }

    await addMessage(text, "user");
    setInput("");
    setLoading(true); // This should trigger the thinking indicator immediately

    console.log("📤 Sending message to REMI:", {
      userId: currentUser.uid,
      query: text
    });

    // Get timetable data for context
    let timetable = {};
    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        timetable = userData.timetable || {};
        console.log("📅 Loaded timetable data:", Object.keys(timetable));
      }
    } catch (error) {
      console.log("Error loading timetable:", error);
    }

    try {
      const requestBody = {
        userId: currentUser.uid,
        query: text,
        timetable: timetable
      };

      console.log("🔄 Sending request to server:", requestBody);

      const res = await fetch("http://192.168.1.64/ask", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(requestBody),
      });
      
      console.log("📥 Received response status:", res.status);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error("❌ Server error response:", errorText);
        throw new Error(`Server error: ${res.status}`);
      }
      
      const json = await res.json();
      console.log("✅ Server response received");
      
      // Check if the response has an answer
      if (json.answer) {
        await typeResponse(json.answer);
      } else if (json.error) {
        await typeResponse(`Sorry, there was an error: ${json.error}`);
      } else {
        await typeResponse("Sorry, I couldn't get a proper response from the server.");
      }
    } catch (error) {
      console.log("❌ Network error:", error);
      await typeResponse("Sorry, I'm having trouble connecting to REMI right now. Please check your connection and try again.");
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
    // Scroll to end when input is focused
    setTimeout(() => scrollToEnd(), 300);
  };

  const hasMessages = messages.length > 0;

  // Calculate content height based on keyboard visibility
  const contentHeight = screenHeight - (keyboardVisible ? keyboardHeight : 0) - 180;

  return (
    <View style={styles.container}>
      {/* Modern Header */}
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

      {/* MAIN CONTENT - Dynamic height based on keyboard */}
      <View style={[styles.content, { height: contentHeight }]}>
        {!hasMessages ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Text style={styles.emptyIconText}>💬</Text>
            </View>
            <Text style={styles.emptyTitle}>What would you like to ask today?</Text>
            <Text style={styles.emptySubtitle}>
              Ask about classes • friends • academics • timetable • GPA
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
            maintainVisibleContentPosition={{
              minIndexForVisible: 0,
            }}
          />
        )}
      </View>

      {/* Thinking Indicator - Show during entire loading phase */}
      {loading && (
        <View style={styles.thinkingContainer}>
          <View style={styles.thinkingBubble}>
            <ActivityIndicator size="small" color="#535FFD" />
            <Text style={styles.thinkingText}>
              Remi is thinking
              <Text style={styles.dots}>
                {dots}
              </Text>
            </Text>
          </View>
        </View>
      )}

      {/* INPUT BAR - Smaller vertical height */}
      <View style={[styles.inputBar, { bottom: keyboardHeight }]}>
        <TextInput
          ref={inputRef}
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

  // Thinking Indicator with Animated Dots
  thinkingContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  thinkingBubble: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 20,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    maxWidth: "80%",
  },
  thinkingText: { 
    color: "#64748B", 
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "500",
  },
  dots: {
    color: "#535FFD",
    fontWeight: "bold",
  },

  // Input Bar Styles - Smaller vertical height
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
    minHeight: 60,
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

  // Message Bubble Styles
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