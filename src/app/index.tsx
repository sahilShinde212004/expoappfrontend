import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, Redirect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import Svg, { Path, Rect, Circle, Line, Polyline, Polygon } from 'react-native-svg';

const curriculumData = {
  "Semester VII - ECOMP":  ["Cloud Computing", "Artificial Intelligence", "Big Data"],
  "Semester VIII - ECOMP": ["Machine Learning", "Internet of Things", "Cyber Security"],
  "Semester VI - ECOMP":   ["Microprocessors", "Signal Processing", "Control Systems"],
};

export default function Dashboard() {
  const router = useRouter();
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle', 'recording', 'paused', 'stopped'
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [showClassModal, setShowClassModal] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const timerRef = useRef<any>(null);

  const [isReady, setIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('token').then(token => {
      setIsAuthenticated(!!token);
      setIsReady(true);
    });
  }, []);

  useEffect(() => {
    if (status === 'recording') {
      timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

  if (!isReady) {
    return (
      <View style={{ flex: 1, backgroundColor: '#090c0a', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  async function handleLogout() {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    router.replace('/login');
  }

  async function handleStartRecording() {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status === 'granted') {
        await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
        const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
        setRecording(recording);
        setElapsed(0);
        setStatus('recording');
      } else {
        Alert.alert('Permission needed', 'Please grant microphone permissions.');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to start recording.');
    }
  }

  async function handlePause() {
    if (recording) {
      await recording.pauseAsync();
      setStatus('paused');
    }
  }

  async function handleResume() {
    if (recording) {
      await recording.startAsync();
      setStatus('recording');
    }
  }

  async function handleStop() {
    if (recording) {
      setStatus('stopped');
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecordingUri(uri);
      setRecording(null);
    }
  }

  async function handleUpload() {
    if (!recordingUri) return;
    setUploading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const formData = new FormData();
      formData.append('audio', { uri: recordingUri, name: 'lecture.m4a', type: 'audio/m4a' } as any);
      formData.append('className', selectedClass);
      formData.append('subjectName', selectedSubject);

      const res = await fetch('https://railway.com/project/a5774716-4a09-4ffa-8e3f-2951a7ec2fa5?environmentId=19399239-9a05-4cf0-8ae6-cbcf8aa5f722/api/upload-lecture', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      
      setUploadSuccess(true);
    } catch (error) {
      Alert.alert('Upload Error', error instanceof Error ? error.message : String(error));
    } finally {
      setUploading(false);
    }
  }

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');
  const subjects = selectedClass ? curriculumData[selectedClass as keyof typeof curriculumData] : [];
  const canRecord = selectedClass && selectedSubject;

  const StatusBadge = () => {
    if (status === 'idle') return <View className="px-3 py-1 rounded-full border bg-orange-50 border-orange-200"><Text className="text-orange-600 text-xs">Ready</Text></View>;
    if (status === 'recording') return <View className="px-3 py-1 rounded-full border bg-red-50 border-red-200"><Text className="text-red-500 font-semibold text-xs">● Live</Text></View>;
    if (status === 'paused') return <View className="px-3 py-1 rounded-full border bg-amber-50 border-amber-200"><Text className="text-amber-600 font-semibold text-xs">⏸ Paused</Text></View>;
    if (status === 'stopped') return <View className="px-3 py-1 rounded-full border bg-green-50 border-green-200"><Text className="text-green-600 font-semibold text-xs">✓ Saved</Text></View>;
    return null;
  };

  return (
    <View className="flex-1 bg-slate-50">
      <LinearGradient colors={['#f97316', '#f59e0b']} start={{x:0, y:0}} end={{x:1, y:0}} className="pt-10 pb-4 px-5 z-50">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <View className="w-9 h-9 rounded-xl bg-white/20 items-center justify-center">
              <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <Path d="M22 10v6M2 10l10-5 10 5-10 5z"/><Path d="M6 12v5c3 3 9 3 12 0v-5"/>
              </Svg>
            </View>
            <View>
              <Text className="text-base font-bold text-white leading-tight">Edu Connect</Text>
              <Text className="text-xs text-white/70">Teacher Portal</Text>
            </View>
          </View>
          <View className="flex-row items-center gap-3">
            <StatusBadge />
            <TouchableOpacity onPress={handleLogout} className="w-8 h-8 rounded-full bg-white/20 items-center justify-center">
              <Text className="text-white text-xs font-bold">T</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* @ts-ignore */}
      <ScrollView contentContainerClassName="p-4 items-center pb-10">
        <View className="w-full max-w-lg gap-5">
          <View className="items-center mb-2">
            <View className="px-4 py-1.5 rounded-full bg-orange-50 border border-orange-200 mb-3">
              <Text className="text-orange-600 text-xs font-semibold tracking-wider">AI LECTURE STUDIO</Text>
            </View>
            <Text className="text-2xl font-extrabold text-slate-900 text-center leading-snug">
              Record your lecture.
            </Text>
            <Text className="text-2xl font-extrabold text-orange-500 text-center leading-snug">
              Let AI handle the rest.
            </Text>
            <Text className="mt-2 text-sm text-slate-500 text-center">Select your class and subject, then hit record.</Text>
          </View>

          <View className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <LinearGradient colors={['#f97316', '#f59e0b']} start={{x:0, y:0}} end={{x:1, y:0}} className="px-6 py-4 flex-row items-center gap-3">
              <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <Rect x="2" y="3" width="20" height="14" rx="2"/><Path d="M8 21h8M12 17v4"/>
              </Svg>
              <Text className="text-white font-semibold text-sm">Session Setup</Text>
            </LinearGradient>
            
            <View className="p-6 gap-5">
              <View>
                <View className="flex-row items-center gap-2 mb-2">
                  <View className="w-5 h-5 rounded-full bg-orange-500 items-center justify-center">
                    <Text className="text-white text-xs font-bold">1</Text>
                  </View>
                  <Text className="text-xs font-semibold text-orange-600 tracking-wider">SELECT CLASS</Text>
                </View>
                <TouchableOpacity 
                  onPress={() => setShowClassModal(true)} disabled={status !== 'idle' && status !== 'stopped'}
                  className={`w-full rounded-xl border px-4 py-3.5 flex-row items-center justify-between ${status !== 'idle' && status !== 'stopped' ? 'border-slate-200 bg-slate-50' : 'border-slate-200 bg-white'}`}
                >
                  <Text className={selectedClass ? 'text-slate-800' : 'text-slate-400'}>{selectedClass || '— Choose a semester —'}</Text>
                  <Svg width="16" height="16" viewBox="0 0 16 16" fill="none"><Path d="M4 6l4 4 4-4" stroke="#64748b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></Svg>
                </TouchableOpacity>
              </View>

              <View className="border-t border-dashed border-slate-100" />

              <View>
                <View className="flex-row items-center gap-2 mb-2">
                  <View className={`w-5 h-5 rounded-full items-center justify-center ${selectedClass ? 'bg-orange-500' : 'bg-slate-300'}`}>
                    <Text className="text-white text-xs font-bold">2</Text>
                  </View>
                  <Text className={`text-xs font-semibold tracking-wider ${selectedClass ? 'text-orange-600' : 'text-slate-400'}`}>SELECT SUBJECT</Text>
                </View>
                <TouchableOpacity 
                  onPress={() => setShowSubjectModal(true)} disabled={!selectedClass || (status !== 'idle' && status !== 'stopped')}
                  className={`w-full rounded-xl border px-4 py-3.5 flex-row items-center justify-between ${!selectedClass || (status !== 'idle' && status !== 'stopped') ? 'border-slate-200 bg-slate-50' : 'border-slate-200 bg-white'}`}
                >
                  <Text className={selectedSubject ? 'text-slate-800' : 'text-slate-400'}>{selectedSubject || (selectedClass ? '— Choose a subject —' : '— Select class first —')}</Text>
                  <Svg width="16" height="16" viewBox="0 0 16 16" fill="none"><Path d="M4 6l4 4 4-4" stroke="#64748b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></Svg>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <View className={`px-6 py-4 flex-row items-center gap-3 ${status === 'recording' ? 'bg-red-500' : status === 'paused' ? 'bg-amber-500' : status === 'stopped' ? 'bg-green-500' : 'bg-slate-700'}`}>
              <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <Path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><Path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/>
              </Svg>
              <Text className="text-white font-semibold text-sm">Recording Controls</Text>
              {(status === 'recording' || status === 'paused') && (
                <View className="ml-auto flex-row items-center gap-2 bg-white/20 rounded-full px-3 py-1">
                  <View className={`w-2 h-2 rounded-full ${status === 'recording' ? 'bg-white' : 'bg-amber-200'}`} />
                  <Text className="text-white text-xs font-bold">{mm}:{ss}</Text>
                </View>
              )}
            </View>
            
            <View className="p-6">
              {status === 'idle' && (
                <TouchableOpacity 
                  onPress={handleStartRecording} disabled={!canRecord}
                  className={`w-full flex-row items-center justify-center gap-3 px-6 py-4 rounded-xl ${canRecord ? 'bg-orange-500' : 'bg-slate-100'}`}
                >
                  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={canRecord ? "white" : "#94a3b8"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><Path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/>
                  </Svg>
                  <Text className={`${canRecord ? 'text-white' : 'text-slate-400'} font-bold text-base`}>Start Lecture Recording</Text>
                </TouchableOpacity>
              )}

              {(status === 'recording' || status === 'paused') && (
                <View className="gap-4">
                  <Text className={`text-center font-semibold ${status === 'recording' ? 'text-red-500' : 'text-amber-600'}`}>{status === 'recording' ? 'Recording…' : 'Paused'}</Text>
                  <View className="flex-row gap-3">
                    {status === 'recording' ? (
                      <TouchableOpacity onPress={handlePause} className="flex-1 flex-row items-center justify-center gap-2 py-3.5 rounded-xl bg-amber-50 border border-amber-200">
                        <Svg width="16" height="16" viewBox="0 0 24 24" fill="#d97706"><Rect x="6" y="4" width="4" height="16"/><Rect x="14" y="4" width="4" height="16"/></Svg>
                        <Text className="text-amber-600 font-semibold">Pause</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity onPress={handleResume} className="flex-1 flex-row items-center justify-center gap-2 py-3.5 rounded-xl bg-green-50 border border-green-200">
                        <Svg width="16" height="16" viewBox="0 0 24 24" fill="#16a34a"><Polygon points="5 3 19 12 5 21 5 3"/></Svg>
                        <Text className="text-green-600 font-semibold">Resume</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={handleStop} className="flex-1 flex-row items-center justify-center gap-2 py-3.5 rounded-xl bg-red-500">
                      <Svg width="14" height="14" viewBox="0 0 24 24" fill="white"><Rect x="3" y="3" width="18" height="18" rx="2"/></Svg>
                      <Text className="text-white font-semibold">Stop</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {status === 'stopped' && (
                <View className="gap-4">
                  <View className="items-center py-4">
                    <View className="w-16 h-16 rounded-full bg-green-50 border-2 border-green-200 items-center justify-center mb-4">
                      <Svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><Polyline points="20 6 9 17 4 12"/></Svg>
                    </View>
                    <Text className="text-xl font-bold text-slate-900">Successfully Recorded!</Text>
                  </View>

                  {!uploadSuccess ? (
                    <TouchableOpacity onPress={handleUpload} disabled={uploading} className="w-full bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex-row items-center gap-3">
                      <View className="w-8 h-8 rounded-lg bg-blue-200 items-center justify-center">
                        {uploading ? <ActivityIndicator color="#1d4ed8" /> : <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><Polyline points="17 8 12 3 7 8"/><Line x1="12" y1="3" x2="12" y2="15"/></Svg>}
                      </View>
                      <View>
                        <Text className="text-blue-800 font-semibold">{uploading ? 'Uploading to Cloud...' : 'Upload to Cloud'}</Text>
                      </View>
                    </TouchableOpacity>
                  ) : (
                    <View className="w-full bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex-row items-center gap-3">
                      <View className="w-8 h-8 rounded-lg bg-green-200 items-center justify-center">
                        <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Polyline points="20 6 9 17 4 12"/></Svg>
                      </View>
                      <Text className="text-green-800 font-semibold">Uploaded successfully!</Text>
                    </View>
                  )}

                  <TouchableOpacity onPress={() => { setStatus('idle'); setUploadSuccess(false); setRecordingUri(null); }} className="w-full py-3.5 rounded-xl bg-slate-50 border border-slate-200 items-center mt-2">
                    <Text className="text-slate-600 font-semibold">Record Another Lecture</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Class Modal */}
      <Modal visible={showClassModal} transparent animationType="fade">
        <View className="flex-1 bg-black/50 justify-center p-5">
          <View className="bg-white rounded-2xl p-5">
            <Text className="text-lg font-bold mb-4">Select Class</Text>
            {Object.keys(curriculumData).map(cls => (
              <TouchableOpacity key={cls} className="py-3.5 border-b border-slate-100" onPress={() => { setSelectedClass(cls); setSelectedSubject(''); setShowClassModal(false); }}>
                <Text className="text-slate-800 text-base">{cls}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity className="bg-orange-500 py-3.5 rounded-xl items-center mt-4" onPress={() => setShowClassModal(false)}>
              <Text className="text-white font-bold">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Subject Modal */}
      <Modal visible={showSubjectModal} transparent animationType="fade">
        <View className="flex-1 bg-black/50 justify-center p-5">
          <View className="bg-white rounded-2xl p-5">
            <Text className="text-lg font-bold mb-4">Select Subject</Text>
            {subjects.map((sub: string) => (
              <TouchableOpacity key={sub} className="py-3.5 border-b border-slate-100" onPress={() => { setSelectedSubject(sub); setShowSubjectModal(false); }}>
                <Text className="text-slate-800 text-base">{sub}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity className="bg-orange-500 py-3.5 rounded-xl items-center mt-4" onPress={() => setShowSubjectModal(false)}>
              <Text className="text-white font-bold">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
