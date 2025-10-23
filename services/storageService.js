import AsyncStorage from '@react-native-async-storage/async-storage';

export const saveTimetable = async (timetable) => {
  try {
    await AsyncStorage.setItem('timetable', JSON.stringify(timetable));
  } catch (error) {
    console.error('Error saving timetable:', error);
  }
};

export const getTimetable = async () => {
  try {
    const data = await AsyncStorage.getItem('timetable');
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading timetable:', error);
    return [];
  }
};
