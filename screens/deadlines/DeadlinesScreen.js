import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, TouchableOpacity, ScrollView, RefreshControl, StyleSheet,
} from "react-native";
import Animated from "react-native-reanimated";
import { getUserData } from "../../services/userDataService";
import NavigationBar from "../../components/NavigationBar";
import SvgIcon from "../../components/SvgIcon";
import ScreenHeader from "../../components/ScreenHeader";
import AddDeadlineSheet from "../../components/AddDeadlineSheet";
import { useTheme } from "../../contexts/ThemeContext";
import { getStyles } from "./DeadlinesScreen.styles";

const PURPLE = "#535FFD";
const RED = "#D32F2F";
const DAY_ABBR = ["SUN", "MON", "TUES", "WED", "THURS", "FRI", "SAT"];

const formatCardDate = (isoString) => {
  const d = new Date(isoString);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(2);
  return `${dd}/${mm}/${yy}`;
};

const getDaysLeft = (isoString) => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(isoString);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
};

export default function DeadlinesScreen({ navigation }) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const sheetRef = useRef(null);

  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
    const focus = navigation.addListener("focus", loadData);
    return focus;
  }, [navigation]);

  const loadData = async () => {
    try {
      setLoading(true);
      const userData = await getUserData();
      if (userData) {
        const sorted = (userData.exams || []).sort(
          (a, b) => new Date(a.date) - new Date(b.date)
        );
        setExams(sorted);
      }
    } catch (e) {
      console.error("Error loading deadlines:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => { setRefreshing(true); loadData(); };

  const addBtn = (
    <TouchableOpacity
      onPress={() => sheetRef.current?.open()}
      style={ds.addHeaderBtn}
      activeOpacity={0.8}
    >
      <SvgIcon name="plus" size={18} color="#FFFFFF" />
    </TouchableOpacity>
  );

  const renderCard = (exam, index) => {
    const daysLeft = getDaysLeft(exam.date);
    const isUrgent = daysLeft >= 0 && daysLeft <= 3;
    const isPast = daysLeft < 0;
    const cardColor = isPast ? "#555555" : isUrgent ? RED : PURPLE;
    const d = new Date(exam.date);
    const dayAbbr = DAY_ABBR[d.getDay()];
    const dateStr = formatCardDate(exam.date);

    return (
      <View key={exam.id || index} style={[styles.card, { backgroundColor: cardColor }]}>
        <View style={styles.cardLeft}>
          <Text style={styles.cardName} numberOfLines={1}>{exam.name}</Text>
          {exam.start ? <Text style={styles.cardTime}>{exam.start}</Text> : null}
          {exam.room ? <Text style={styles.cardRoom}>{exam.room}</Text> : null}
        </View>
        <View style={styles.cardRight}>
          <View style={styles.cardDateBlock}>
            <Text style={styles.cardDayAbbr}>{dayAbbr}</Text>
            <Text style={styles.cardDate}>{dateStr}</Text>
          </View>
          {isUrgent && (
            <View style={styles.daysLeftBadge}>
              <Text style={styles.daysLeftText}>
                {daysLeft === 0 ? "TODAY" : `${daysLeft} DAY${daysLeft === 1 ? "" : "S"} LEFT`}
              </Text>
            </View>
          )}
          {isPast && (
            <View style={[styles.daysLeftBadge, styles.pastBadge]}>
              <Text style={styles.daysLeftText}>PAST</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Deadlines"
        onBackPress={() => navigation.goBack()}
        rightElement={addBtn}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[PURPLE]} />
        }
      >
        <View style={styles.content}>
          {exams.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No deadlines yet</Text>
              <Text style={styles.emptySubText}>Add your first deadline to get started</Text>
            </View>
          ) : (
            exams.map((exam, i) => renderCard(exam, i))
          )}
        </View>
        <View style={styles.bottomSpacing} />
      </ScrollView>

      <NavigationBar />

      <AddDeadlineSheet ref={sheetRef} onSaved={loadData} />
    </View>
  );
}

const ds = StyleSheet.create({
  addHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#535FFD",
    justifyContent: "center",
    alignItems: "center",
  },
});
