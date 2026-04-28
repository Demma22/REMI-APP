// screens/ChatScreen.js
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Platform,
  LayoutAnimation,
  UIManager,
  Keyboard,
  Alert,
  Dimensions,
} from "react-native";
import { auth, db } from "../../firebase";
import { doc, getDoc, collection, addDoc, query, orderBy, getDocs, deleteDoc, serverTimestamp } from "firebase/firestore";
import SvgIcon from "../../components/SvgIcon";
import { useTheme } from '../../contexts/ThemeContext';
import * as Clipboard from 'expo-clipboard';
import { getStyles } from './ChatScreen.styles';

const { height: screenHeight } = Dimensions.get("window");

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function ChatScreen({ navigation }) {
  if (!auth.currentUser) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Not logged in</Text>
      </View>
    );
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
  
  const { theme } = useTheme();
  const styles = getStyles(theme);

  // Card Components defined inside the main component so they have access to styles and theme
  const LectureCard = ({ lecture, index }) => {
    return (
      <View style={[styles.lectureCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <View style={styles.lectureHeader}>
          <View style={[styles.lectureNumber, { backgroundColor: theme.colors.primaryLight }]}>
            <Text style={[styles.lectureNumberText, { color: theme.colors.primary }]}>{index + 1}</Text>
          </View>
          <Text style={[styles.lectureName, { color: theme.colors.textPrimary }]} numberOfLines={2}>{lecture.name}</Text>
        </View>
        
        <View style={styles.lectureDetails}>
          <View style={styles.detailRow}>
            <SvgIcon name="calendar" size={14} color={theme.colors.textSecondary} />
            <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>{lecture.day || "Not specified"}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <SvgIcon name="clock" size={14} color={theme.colors.textSecondary} />
            <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
              {lecture.start} {lecture.end ? `- ${lecture.end}` : ""}
            </Text>
          </View>
          
          {lecture.lecturer && lecture.lecturer !== "" && (
            <View style={styles.detailRow}>
              <SvgIcon name="user" size={14} color={theme.colors.textSecondary} />
              <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>👨‍🏫 {lecture.lecturer}</Text>
            </View>
          )}
          
          {lecture.room && lecture.room !== "" && (
            <View style={styles.detailRow}>
              <SvgIcon name="location" size={14} color={theme.colors.textSecondary} />
              <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>📍 Room {lecture.room}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const ExamCard = ({ exam, index }) => {
    let examDate;
    try {
      examDate = exam.date?.toDate ? exam.date.toDate() : new Date(exam.date);
    } catch (e) {
      examDate = new Date();
    }
    const formattedDate = examDate.toLocaleDateString();
    
    return (
      <View style={[styles.examCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <View style={styles.examHeader}>
          <View style={[styles.examNumber, { backgroundColor: theme.colors.dangerLight }]}>
            <Text style={[styles.examNumberText, { color: theme.colors.danger }]}>{index + 1}</Text>
          </View>
          <Text style={[styles.examName, { color: theme.colors.textPrimary }]} numberOfLines={2}>{exam.name}</Text>
        </View>
        
        <View style={styles.examDetails}>
          <View style={styles.detailRow}>
            <SvgIcon name="calendar" size={14} color={theme.colors.textSecondary} />
            <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>{formattedDate}</Text>
          </View>
          
          {exam.start && (
            <View style={styles.detailRow}>
              <SvgIcon name="clock" size={14} color={theme.colors.textSecondary} />
              <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>⏰ {exam.start}</Text>
            </View>
          )}
          
          {exam.room && (
            <View style={styles.detailRow}>
              <SvgIcon name="location" size={14} color={theme.colors.textSecondary} />
              <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>📍 Room {exam.room}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const GPACard = ({ gpaData }) => {
    return (
      <View style={[styles.gpaCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <View style={styles.gpaHeader}>
          <SvgIcon name="chart-line" size={20} color={theme.colors.primary} />
          <Text style={[styles.gpaTitle, { color: theme.colors.textPrimary }]}>Your GPA</Text>
        </View>
        
        <View style={styles.gpaValueContainer}>
          <Text style={[styles.gpaValue, { color: theme.colors.primary }]}>{gpaData.gpa || "N/A"}</Text>
          {gpaData.totalCredits > 0 && (
            <Text style={[styles.gpaCredits, { color: theme.colors.textSecondary }]}>
              Total Credits: {gpaData.totalCredits}
            </Text>
          )}
        </View>
        
        {gpaData.summary && (
          <Text style={[styles.gpaSummary, { color: theme.colors.textSecondary }]}>{gpaData.summary}</Text>
        )}
      </View>
    );
  };

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
      console.error("Error loading user data:", error);
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
      console.error("Error loading chat history:", error);
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
      console.error("Error saving message:", error);
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

  const addMessage = async (text, sender, structuredData = null) => {
    const msg = { 
      id: Date.now().toString(), 
      text: text || "", 
      sender,
    };
    
    if (structuredData) {
      msg.structuredData = structuredData;
      msg.isStructured = true;
    }
    
    setMessages((prev) => [...prev, msg]);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    setTimeout(() => {
      scrollToEnd();
    }, 200);
    
    if (sender === "user" && text) {
      await saveChatMessage(text, true);
    } else if (sender === "remi" && text) {
      await saveChatMessage(text, false);
    }
  };

  const typeResponse = async (fullText) => {
    if (!fullText) {
      addMessage("Sorry, I couldn't process that request.", "remi");
      return;
    }

    const id = Date.now().toString();
    setMessages((prev) => [...prev, { id, text: "", sender: "remi" }]);
    
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
      const token = await currentUser.getIdToken();

      const res = await fetch("https://ai-backend-yl4w.onrender.com/ask", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ query: text }),
      });
      
      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }
      
      const json = await res.json();
      
      // Handle different response types
      if (json.type === "lecture_list" && json.data?.lectures?.length > 0) {
        if (json.data.summary) {
          await addMessage(json.data.summary, "remi");
        }
        await addMessage("", "remi", {
          type: "lecture_list",
          data: json.data
        });
      } 
      else if (json.type === "exam_list" && json.data?.exams?.length > 0) {
        if (json.data.summary) {
          await addMessage(json.data.summary, "remi");
        }
        await addMessage("", "remi", {
          type: "exam_list",
          data: json.data
        });
      }
      else if (json.type === "gpa_card" && json.data?.gpa) {
        await addMessage("", "remi", {
          type: "gpa_card",
          data: json.data
        });
      }
      else if (json.type === "text") {
        await typeResponse(json.text || "I'm here to help!");
      }
      else {
        await typeResponse("I'm here to help with your academic questions!");
      }
    } catch (error) {
      console.error("Chat error:", error);
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

  const handleCopyText = async (text) => {
    if (!text) return;
    try {
      await Clipboard.setStringAsync(text);
      Alert.alert("Copied", "Text copied to clipboard");
    } catch (error) {
      Alert.alert("Error", "Failed to copy text");
    }
  };

  const handleMessageLongPress = (text) => {
    if (!text) return;
    Alert.alert(
      "Copy Text",
      "Do you want to copy this text?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Copy", 
          onPress: () => handleCopyText(text) 
        },
      ]
    );
  };

  const handleInputFocus = () => {
    setTimeout(() => scrollToEnd(), 300);
  };

  const hasMessages = messages.length > 0;
  const contentHeight = screenHeight - (keyboardVisible ? keyboardHeight : 0) - 180;

  const renderMessageItem = ({ item }) => (
    <TouchableOpacity
      onLongPress={() => handleMessageLongPress(item.text)}
      activeOpacity={0.9}
      delayLongPress={500}
    >
      <View
        style={[
          styles.bubble,
          item.sender === "user" ? styles.userBubble : styles.remiBubble,
          item.isStructured && styles.structuredBubble
        ]}
      >
        {item.sender === "remi" && !item.isStructured && (
          <View style={[styles.remiAvatar, { backgroundColor: theme.colors.primaryLight }]}>
            <SvgIcon name="robot" size={16} color={theme.colors.primary} />
          </View>
        )}
        
        {item.isStructured ? (
          <View style={{ flex: 1 }}>
            {item.text && item.text !== "" && (
              <Text style={[styles.remiText, { marginBottom: 8 }]}>{item.text}</Text>
            )}
            {item.structuredData?.type === "lecture_list" && (
              <View>
                {item.structuredData.data?.lectures?.map((lecture, idx) => (
                  <LectureCard key={idx} lecture={lecture} index={idx} />
                ))}
              </View>
            )}
            {item.structuredData?.type === "exam_list" && (
              <View>
                {item.structuredData.data?.exams?.map((exam, idx) => (
                  <ExamCard key={idx} exam={exam} index={idx} />
                ))}
              </View>
            )}
            {item.structuredData?.type === "gpa_card" && (
              <GPACard gpaData={item.structuredData.data} />
            )}
          </View>
        ) : (
          <Text style={item.sender === "user" ? styles.userText : styles.remiText}>
            {item.text}
          </Text>
        )}
        
        {item.sender === "user" && (
          <View style={[styles.userAvatar, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
            <SvgIcon name="user" size={16} color="white" />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

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
          <View style={styles.headerTitleContainer}>
            <SvgIcon name="robot" size={24} color={theme.colors.primary} style={styles.headerIcon} />
            <Text style={styles.headerTitle}>REMI</Text>
          </View>
          {hasMessages && (
            <TouchableOpacity onPress={handleClearChat} style={[styles.clearButton, { backgroundColor: theme.mode === 'dark' ? 'rgba(255, 159, 77, 0.2)' : 'rgba(247, 133, 34, 0.1)' }]}>
              <SvgIcon name="trash" size={16} color={theme.colors.secondary} />
              <Text style={[styles.clearButtonText, { color: theme.colors.secondary }]}> Clear</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Main Content */}
      <View style={[styles.content, { height: contentHeight }]}>
        {!hasMessages ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: theme.colors.primaryLight }]}>
              <SvgIcon name="message" size={32} color={theme.colors.primary} />
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
            renderItem={renderMessageItem}
            onContentSizeChange={() => scrollToEnd(false)}
            onLayout={() => scrollToEnd(false)}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Thinking dots indicator */}
      {loading && (
        <View style={[
          styles.thinkingDotsContainer,
          { bottom: keyboardHeight + 70 }
        ]}>
          <View style={styles.thinkingDotsBubble}>
            <SvgIcon name="robot" size={16} color={theme.colors.primary} style={styles.thinkingRobot} />
            <Text style={[styles.thinkingDotsText, { color: theme.colors.primary }]}>{thinkingDots}</Text>
          </View>
        </View>
      )}

      {/* Input Bar */}
      <View style={[
        styles.inputBar, 
        { 
          bottom: keyboardHeight,
          marginBottom: 0,
          backgroundColor: theme.colors.backgroundSecondary,
          borderTopColor: theme.colors.border,
        }
      ]}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Message Remi..."
          style={styles.input}
          returnKeyType="send"
          onSubmitEditing={send}
          placeholderTextColor={theme.colors.textTertiary}
          multiline={true}
          maxLength={500}
          onFocus={handleInputFocus}
        />

        <TouchableOpacity 
          onPress={send} 
          style={[
            styles.sendBtn,
            { backgroundColor: input.trim() ? theme.colors.primary : theme.colors.textTertiary },
            !input.trim() && styles.sendBtnDisabled
          ]}
          disabled={!input.trim()}
        >
          <SvgIcon name="send" size={18} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
