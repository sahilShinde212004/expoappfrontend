import '../global.css';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator } from 'react-native';

export default function RootLayout() {
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const router = useRouter();

  useEffect(() => {
    AsyncStorage.getItem('token').then(token => {
      if (!token) {
        setLoading(false);
        return;
      }
      fetch('https://railway.com/project/a5774716-4a09-4ffa-8e3f-2951a7ec2fa5?environmentId=19399239-9a05-4cf0-8ae6-cbcf8aa5f722/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        if (res.ok) setAuthed(true);
        else {
          AsyncStorage.removeItem('token');
          AsyncStorage.removeItem('user');
        }
      })
      .catch(() => setAuthed(true))
      .finally(() => setLoading(false));
    });
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#090c0a', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
      </Stack>
    </>
  );
}
