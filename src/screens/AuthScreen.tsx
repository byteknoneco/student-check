import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { supabase } from '../lib/supabase';
import { theme } from '../theme';
import { UserRole } from '../types';

export function AuthScreen() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('parent');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!supabase) return;
    if (!email || !password || (isRegister && !fullName)) return Alert.alert('Eksik bilgi', 'Lütfen gerekli alanları doldurun.');
    try {
      setLoading(true);
      if (isRegister) {
        const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName, role } } });
        if (error) throw error;
        Alert.alert('Kayıt oluşturuldu', 'E-posta doğrulaması açıksa gelen kutunuzu kontrol edin.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error: any) {
      Alert.alert('İşlem başarısız', error.message ?? 'Bilinmeyen hata');
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.hero}>
        <Text style={styles.logo}>DersTakip<Text style={{ color: '#B9A7FF' }}>+</Text></Text>
        <Text style={styles.heroTitle}>Ders, gelişim ve iletişim tek yerde.</Text>
        <Text style={styles.heroSubtitle}>Öğretmen, öğrenci ve veliyi ortak veride buluşturan özel ders takip uygulaması.</Text>
      </View>
      <View style={styles.formCard}>
        <Text style={styles.formTitle}>{isRegister ? 'Hesap oluştur' : 'Giriş yap'}</Text>
        {isRegister ? (
          <>
            <TextInput value={fullName} onChangeText={setFullName} placeholder="Ad soyad" style={styles.input} placeholderTextColor="#8A90A2" />
            <View style={styles.roleRow}>
              {(['parent', 'student', 'teacher'] as UserRole[]).map((r) => (
                <Pressable key={r} onPress={() => setRole(r)} style={[styles.roleButton, role === r && styles.roleActive]}>
                  <Text style={[styles.roleText, role === r && styles.roleTextActive]}>{r === 'teacher' ? 'Öğretmen' : r === 'parent' ? 'Veli' : 'Öğrenci'}</Text>
                </Pressable>
              ))}
            </View>
          </>
        ) : null}
        <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="E-posta" style={styles.input} placeholderTextColor="#8A90A2" />
        <TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="Şifre" style={styles.input} placeholderTextColor="#8A90A2" />
        <Pressable onPress={submit} style={styles.primaryButton} disabled={loading}>
          {loading ? <ActivityIndicator color="white" /> : <Text style={styles.primaryButtonText}>{isRegister ? 'Kayıt ol' : 'Giriş yap'}</Text>}
        </Pressable>
        <Pressable onPress={() => setIsRegister((v) => !v)}><Text style={styles.switchText}>{isRegister ? 'Zaten hesabın var mı? Giriş yap' : 'Yeni misin? Hesap oluştur'}</Text></Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#171B31', justifyContent: 'flex-end' },
  hero: { paddingHorizontal: 26, paddingTop: 80, paddingBottom: 34 },
  logo: { color: 'white', fontWeight: '900', fontSize: 17 },
  heroTitle: { color: 'white', fontWeight: '900', fontSize: 34, lineHeight: 39, marginTop: 18, maxWidth: 340 },
  heroSubtitle: { color: '#ADB4CE', fontSize: 14, lineHeight: 21, marginTop: 12, maxWidth: 350 },
  formCard: { backgroundColor: theme.colors.background, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, gap: 12 },
  formTitle: { fontSize: 22, fontWeight: '900', color: theme.colors.text, marginBottom: 4 },
  input: { backgroundColor: 'white', borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, paddingHorizontal: 15, height: 52, color: theme.colors.text, fontWeight: '600' },
  roleRow: { flexDirection: 'row', gap: 8 },
  roleButton: { flex: 1, borderWidth: 1, borderColor: theme.colors.border, paddingVertical: 11, borderRadius: 12, alignItems: 'center' },
  roleActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  roleText: { color: theme.colors.textMuted, fontWeight: '800', fontSize: 12 },
  roleTextActive: { color: 'white' },
  primaryButton: { backgroundColor: theme.colors.primary, height: 54, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  primaryButtonText: { color: 'white', fontWeight: '900', fontSize: 15 },
  switchText: { color: theme.colors.primary, textAlign: 'center', fontWeight: '800', marginTop: 6, marginBottom: 10 },
});
