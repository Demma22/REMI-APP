import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './screens/HomeScreen';
import InteractScreen from './screens/InteractScreen';
import TimetableScreen from './screens/TimetableScreen';
import GPAScreen from './screens/GPAScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
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
