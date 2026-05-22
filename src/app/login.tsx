import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Line } from 'react-native-svg';

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><Circle cx="12" cy="12" r="3"/>
    </Svg>
  ) : (
    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><Path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><Line x1="1" y1="1" x2="23" y2="23"/>
    </Svg>
  );
}

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'forgot'
  const router = useRouter();

  async function handleSubmit() {
    setError('');
    if (!email) { setError('Please enter your email.'); return; }
    if (mode !== 'forgot' && !password) { setError('Please enter your password.'); return; }
    
    setLoading(true);
    try {
      if (mode === 'login' || mode === 'signup') {
        const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/signup';
        const payload = mode === 'signup' ? { name, email, password } : { email, password };
        
        const res = await fetch(`https://app-backend-qhnr.onrender.com${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Something went wrong');
        
        await AsyncStorage.setItem('token', data.token);
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        
        router.replace('/');
      } else {
        setTimeout(() => {
          setLoading(false);
          setMode('login');
          Alert.alert('Success', 'Reset link sent!');
        }, 1000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  const titles = {
    login:  { head: 'Welcome back',     sub: "Don't have an account?",   link: 'Sign up',    next: 'signup' },
    signup: { head: 'Create account',   sub: 'Already have an account?', link: 'Log in',     next: 'login'  },
    forgot: { head: 'Reset password',   sub: 'Remembered it?',           link: 'Back to login', next: 'login' },
  };
  const t = titles[mode as keyof typeof titles];

  return (
    <View className="flex-1 bg-[#0d1009]">
      {/* @ts-ignore */}
      <ScrollView contentContainerClassName="flex-1 justify-center px-5 py-12" keyboardShouldPersistTaps="handled">
        <View className="w-full max-w-md mx-auto">
          
          <View className="bg-[#141a10]/80 border border-white/10 rounded-2xl p-8">
            <View className="flex-row items-center gap-2 mb-8">
              <LinearGradient
                colors={['#f97316', '#d97706']}
                start={{x: 0, y: 0}} end={{x: 1, y: 1}}
                className="w-8 h-8 rounded-xl items-center justify-center"
              >
                <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                  <Path d="M6 12v5c3 3 9 3 12 0v-5"/>
                </Svg>
              </LinearGradient>
              <Text className="text-white font-bold text-base">Edu Connect</Text>
            </View>

            <Text className="text-white font-bold text-3xl mb-1">{t.head}</Text>
            
            <View className="flex-row flex-wrap mb-7">
              <Text className="text-slate-400 text-sm">{t.sub} </Text>
              <TouchableOpacity onPress={() => { setMode(t.next); setError(''); }}>
                <Text className="text-orange-400 font-medium">{t.link}</Text>
              </TouchableOpacity>
            </View>

            {error ? (
              <View className="mb-4 flex-row items-center gap-2 px-4 py-3 rounded-xl bg-red-900/30 border border-red-500/30">
                <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2">
                  <Circle cx="12" cy="12" r="10"/><Line x1="12" y1="8" x2="12" y2="12"/><Line x1="12" y1="16" x2="12.01" y2="16"/>
                </Svg>
                <Text className="text-red-400 text-sm flex-1">{error}</Text>
              </View>
            ) : null}

            <View className="flex-col gap-4">
              {mode === 'signup' && (
                <TextInput
                  className="w-full bg-[#1e2618] border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm"
                  placeholder="Full name"
                  placeholderTextColor="#64748b"
                  value={name}
                  onChangeText={setName}
                />
              )}

              <TextInput
                className="w-full bg-[#1e2618] border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm"
                placeholder="Email"
                placeholderTextColor="#64748b"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />

              {mode !== 'forgot' && (
                <View className="relative justify-center">
                  <TextInput
                    className="w-full bg-[#1e2618] border border-white/10 rounded-xl px-4 py-3.5 pr-12 text-white text-sm"
                    placeholder="Enter password"
                    placeholderTextColor="#64748b"
                    secureTextEntry={!showPass}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPass(!showPass)}
                    className="absolute right-4"
                  >
                    <EyeIcon open={showPass} />
                  </TouchableOpacity>
                </View>
              )}

              {mode === 'login' && (
                <View className="flex-row justify-end mt-[-4]">
                  <TouchableOpacity onPress={() => { setMode('forgot'); setError(''); }}>
                    <Text className="text-sm text-slate-400">Forgot password?</Text>
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity
                onPress={handleSubmit}
                disabled={loading}
                className="w-full mt-2 overflow-hidden rounded-xl"
              >
                <LinearGradient
                  colors={['#f97316', '#f59e0b']}
                  start={{x: 0, y: 0}} end={{x: 1, y: 0}}
                  className="w-full py-3.5 items-center justify-center flex-row gap-2"
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text className="text-white font-semibold text-base">
                      {mode === 'login' ? 'Login' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <Text className="mt-6 text-center text-xs text-slate-600">
              By continuing, you agree to our Terms and Privacy Policy
            </Text>
          </View>

          <Text className="text-center mt-6 text-xs text-slate-600">
            Edu Connect · AI-Powered LMS · Final Year Project
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
