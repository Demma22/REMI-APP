// components/ImageScanningOverlay.js
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Animated,
  Easing,
  Dimensions,
  ImageBackground,
} from 'react-native';
import SvgIcon from './SvgIcon';

const { width, height } = Dimensions.get('window');

export default function ImageScanningOverlay({ imageUri, theme, onComplete }) {
  const [scanProgress, setScanProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState(0);
  
  // Animation values
  const scanLineY = useRef(new Animated.Value(0)).current;
  const dotPositions = useRef([
    new Animated.Value(0), new Animated.Value(0), new Animated.Value(0),
    new Animated.Value(0), new Animated.Value(0), new Animated.Value(0),
    new Animated.Value(0), new Animated.Value(0)
  ]).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  const messages = [
    { text: "Capturing image...", emoji: "📸", duration: 1500 },
    { text: "Analyzing document layout...", emoji: "🔍", duration: 2000 },
    { text: "Detecting text areas...", emoji: "📝", duration: 2000 },
    { text: "Reading course names...", emoji: "📚", duration: 2500 },
    { text: "Extracting IA marks...", emoji: "📊", duration: 2000 },
    { text: "Extracting UE marks...", emoji: "🎯", duration: 2000 },
    { text: "Calculating percentages...", emoji: "💯", duration: 2000 },
    { text: "Converting to grade points...", emoji: "🔄", duration: 2000 },
    { text: "Almost done! Finalizing GPA...", emoji: "⚡", duration: 2000 },
  ];
  
  useEffect(() => {
    // Animate scanning line
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineY, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scanLineY, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
    
    // Animate popping dots (staggered)
    dotPositions.forEach((dot, index) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            delay: index * 150,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
    
    // Pulse animation for the scanner icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
    
    // Progress bar animation
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 18000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
    
    // Rotate through messages
    let messageIndex = 0;
    const messageInterval = setInterval(() => {
      messageIndex++;
      if (messageIndex < messages.length) {
        setCurrentMessage(messageIndex);
        setScanProgress((messageIndex + 1) / messages.length);
      } else {
        clearInterval(messageInterval);
        if (onComplete) setTimeout(onComplete, 500);
      }
    }, messages[0]?.duration || 2000);
    
    return () => clearInterval(messageInterval);
  }, []);
  
  
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });
  
  const currentMsg = messages[currentMessage] || messages[0];
  
  return (
    <View style={styles.overlayContainer}>
      <ImageBackground 
        source={{ uri: imageUri }} 
        style={styles.imageBackground}
        imageStyle={styles.imageStyle}
      >
        {/* Dark overlay for better visibility */}
        <View style={[styles.darkOverlay, { backgroundColor: 'rgba(0,0,0,0.7)' }]} />
        
        {/* Scanning Line */}
        <Animated.View 
          style={[
            styles.scanLine,
            { 
              backgroundColor: theme.colors.primary,
              transform: [{ translateY: scanLineTranslate }]
            }
          ]} 
        />
        
        {/* Animated Dot Grid - Popping effect */}
        <View style={styles.dotGrid}>
          {[...Array(8)].map((_, i) => {
            const scale = dotPositions[i]?.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0.3, 1.5, 0.3],
            });
            const opacity = dotPositions[i]?.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0, 1, 0],
            });
            
            return (
              <Animated.View
                key={i}
                style={[
                  styles.scanDot,
                  {
                    backgroundColor: theme.colors.primary,
                    transform: [{ scale: scale || 1 }],
                    opacity: opacity || 0,
                    top: 30 + (i % 4) * 60,
                    left: 30 + Math.floor(i / 2) * 80,
                  }
                ]}
              />
            );
          })}
        </View>
        
        {/* Center Scanner Icon with Pulse */}
        <Animated.View 
          style={[
            styles.centerScanner,
            { transform: [{ scale: pulseAnim }] }
          ]}
        >
          <View style={[styles.scannerCircle, { backgroundColor: theme.colors.primary + '40' }]}>
            <SvgIcon name="scan" size={50} color={theme.colors.primary} />
          </View>
        </Animated.View>
        
        {/* Progress Bar - Bottom */}
        <View style={styles.progressSection}>
          <View style={[styles.progressBarContainer, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <Animated.View 
              style={[
                styles.progressFill, 
                { 
                  backgroundColor: theme.colors.primary,
                  width: progressWidth
                }
              ]} 
            />
          </View>
          
          {/* Current Status Message */}
          <View style={styles.statusContainer}>
            <Text style={styles.statusEmoji}>{currentMsg.emoji}</Text>
            <Text style={[styles.statusText, { color: '#FFFFFF' }]}>
              {currentMsg.text}
            </Text>
          </View>
          
          {/* Wait instruction */}
          <View style={styles.waitContainer}>
            <SvgIcon name="clock" size={16} color="rgba(255,255,255,0.7)" />
            <Text style={styles.waitText}>
              Please wait while AI analyzes your document...
            </Text>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = {
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  },
  imageBackground: {
    width: '100%',
    height: '100%',
  },
  imageStyle: {
    resizeMode: 'cover',
  },
  darkOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    opacity: 0.8,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 5,
  },
  dotGrid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scanDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  centerScanner: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  progressSection: {
    position: 'absolute',
    bottom: 60,
    left: 20,
    right: 20,
  },
  progressBarContainer: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 12,
  },
  statusEmoji: {
    fontSize: 24,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  waitContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  waitText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
};