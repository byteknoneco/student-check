import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { redeemInvite } from '../services/appData';
import { theme } from '../theme';

export function InviteScreen({ onDone, onLogout }: { onDone: () => void; onLogout: () => void }) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (code.trim().length < 4) return;
    try {
      setBusy(true);
      await redeemInvite(code);
      Alert.alert('Bağlantı tamamlandı', 'Hesabınız öğrenci kaydıyla eşleştirildi.');
      onDone();
    } catch (error: any) { Alert.alert('Kod kullanılamadı', error.message ?? 'Davet kodu geçersiz.'); }
    finally { setBusy(false); }
  };
  return (
    <View style={styles.page}>
      <Text style={styles.brand}>DersTakip+</Text>
      <View style={styles.card}>
        <Text style={styles.emoji}>🔗</Text>
        <Text style={styles.title}>Hesabını eşleştir</Text>
        <Text style={styles.text}>Öğretmeninin verdiği davet kodunu gir. Böylece yalnızca sana bağlı ders ve gelişim bilgileri görünür.</Text>
        <TextInput value={code} onChangeText={(t) => setCode(t.toUpperCase())} autoCapitalize="characters" placeholder="Örn. AHMET-7K2P" style={styles.input} />
        <Pressable style={styles.button} onPress={submit}><Text style={styles.buttonText}>{busy ? 'Kontrol ediliyor...' : 'Kodu kullan'}</Text></Pressable>
        <Pressable onPress={onLogout}><Text style={styles.logout}>Çıkış yap</Text></Pressable>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.colors.background, padding: 22, justifyContent: 'center' },
  brand: { textAlign: 'center', color: theme.colors.text, fontWeight: '900', fontSize: 16, marginBottom: 18 },
  card: { backgroundColor: 'white', borderRadius: 24, padding: 24, alignItems: 'center', ...theme.shadow },
  emoji: { fontSize: 40 }, title: { fontSize: 24, fontWeight: '900', color: theme.colors.text, marginTop: 12 },
  text: { textAlign: 'center', color: theme.colors.textMuted, lineHeight: 20, marginTop: 10 },
  input: { width: '100%', marginTop: 20, height: 54, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, paddingHorizontal: 14, fontWeight: '900', letterSpacing: 1, textAlign: 'center' },
  button: { width: '100%', marginTop: 12, backgroundColor: theme.colors.primary, paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  buttonText: { color: 'white', fontWeight: '900' }, logout: { color: theme.colors.textMuted, fontWeight: '700', marginTop: 18 },
});
