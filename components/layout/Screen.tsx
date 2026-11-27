import { ReactNode, memo } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOnlyus } from '@/hooks/useOnlyus';
import { spacing } from '@/constants/theme';
import { Notice } from '@/components/ui/Controls';
interface ScreenProps { children: ReactNode; tab?: boolean; scroll?: boolean; }
export const Screen = memo(function Screen({ children, tab = false, scroll = true }: ScreenProps) {
  const { colors, error } = useOnlyus();
  const content = <View style={[styles.content, !scroll ? styles.root : null]}><Notice message={error} />{children}</View>;
  return <SafeAreaView edges={tab ? ['top'] : ['top', 'bottom']} style={[styles.root, { backgroundColor: colors.background }]}><KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>{scroll ? <ScrollView style={styles.root} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>{content}</ScrollView> : content}</KeyboardAvoidingView></SafeAreaView>;
});
interface HeadingProps { eyebrow?: string; title: string; subtitle?: string; }
export const Heading = memo(function Heading({ eyebrow, title, subtitle }: HeadingProps) { const { colors } = useOnlyus(); return <View style={styles.heading}>{eyebrow ? <Text style={[styles.eyebrow, { color: colors.primary }]}>{eyebrow}</Text> : null}<Text style={[styles.title, { color: colors.text }]}>{title}</Text>{subtitle ? <Text style={[styles.subtitle, { color: colors.subtle }]}>{subtitle}</Text> : null}</View>; });
export function LoadingScreen() { const { colors } = useOnlyus(); return <SafeAreaView style={[styles.loading, { backgroundColor: colors.background }]}><ActivityIndicator color={colors.primary} size="large" /><Text style={[styles.subtitle, { color: colors.subtle }]}>Menyiapkan ruang kalian…</Text></SafeAreaView>; }
const styles = StyleSheet.create({ root: { flex: 1 }, scroll: { flexGrow: 1 }, content: { width: '100%', maxWidth: 960, alignSelf: 'center', padding: spacing.md, paddingBottom: spacing.lg, gap: spacing.md }, heading: { gap: spacing.xs }, eyebrow: { fontSize: 12, letterSpacing: 2.5, fontWeight: '700' }, title: { fontSize: 30, fontWeight: '700', letterSpacing: -.7, includeFontPadding: false }, subtitle: { fontSize: 16, lineHeight: 26 }, loading: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.sm } });
