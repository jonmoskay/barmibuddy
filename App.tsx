import React, { useEffect, useState, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { storage } from './src/storage';
import { Role } from './src/types';
import { colors } from './src/theme';
import Onboarding from './src/screens/Onboarding';
import StudentHome from './src/screens/StudentHome';
import TeacherHome from './src/screens/TeacherHome';
import ParentHome from './src/screens/ParentHome';
import LessonScreen from './src/screens/Lesson';
import PitchPractice from './src/screens/PitchPractice';
import Settings from './src/screens/Settings';

const Stack = createNativeStackNavigator();

function Root({ navigation }: any) {
  const [ready, setReady] = useState(false);
  const [role, setRole] = useState<Role | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const refresh = useCallback(async () => {
    const [r, p] = await Promise.all([storage.getRole(), storage.getProfile()]);
    setRole(p ? r : null);
    setReady(true);
  }, []);

  useEffect(() => {
    const unsub = navigation.addListener('focus', refresh);
    refresh();
    return unsub;
  }, [navigation, refresh, reloadKey]);

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.text} />
      </View>
    );
  }

  if (!role) return <Onboarding onDone={() => setReloadKey(k => k + 1)} />;
  if (role === 'student') return <StudentHome navigation={navigation} />;
  if (role === 'teacher') return <TeacherHome navigation={navigation} />;
  return <ParentHome navigation={navigation} />;
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <NavigationContainer
      theme={{
        dark: true,
        colors: {
          background: colors.bg,
          card: colors.card,
          text: colors.text,
          primary: colors.primary,
          border: colors.border,
          notification: colors.primary,
        },
        fonts: {
          regular: { fontFamily: 'System', fontWeight: '400' },
          medium: { fontFamily: 'System', fontWeight: '500' },
          bold: { fontFamily: 'System', fontWeight: '700' },
          heavy: { fontFamily: 'System', fontWeight: '900' },
        },
      }}
    >
      <StatusBar style="light" />
      <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: colors.bg }, headerTintColor: colors.text, headerTitle: '' }}>
        <Stack.Screen name="Root" component={Root} options={{ headerShown: false }} />
        <Stack.Screen name="Lesson" component={LessonScreen} />
        <Stack.Screen name="PitchPractice" component={PitchPractice} options={{ title: 'Sing-along' }} />
        <Stack.Screen name="Settings" component={Settings} />
      </Stack.Navigator>
    </NavigationContainer>
    </GestureHandlerRootView>
  );
}
