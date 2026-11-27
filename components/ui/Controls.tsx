import { memo, ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useOnlyus } from '@/hooks/useOnlyus';
import { spacing, contrastText } from '@/constants/theme';
interface ButtonProps { title: string; onPress: () => void; loading?: boolean; variant?: 'primary' | 'secondary' | 'danger'; disabled?: boolean; icon?: keyof typeof Feather.glyphMap; }
export const Button = memo(function Button({ title, onPress, loading = false, variant = 'primary', disabled = false, icon }: ButtonProps) {
  const { colors } = useOnlyus(); const fill = variant === 'primary' ? colors.button : variant === 'danger' ? colors.danger : colors.secondary;
  const text = variant === 'primary' ? colors.onButton : contrastText(fill);
  return <Pressable accessibilityRole="button" accessibilityLabel={title} disabled={loading || disabled} onPress={onPress} style={({ pressed }) => [styles.button, { backgroundColor: fill, opacity: disabled || loading ? .55 : pressed ? .75 : 1, transform: [{ scale: pressed ? .98 : 1 }] }]}>{loading ? <ActivityIndicator color={text} /> : <>{icon ? <Feather name={icon} size={18} color={text} /> : null}<Text style={[styles.buttonText, { color: text }]}>{title}</Text></>}</Pressable>;
});
interface InputProps extends TextInputProps { label: string; }
export const Input = memo(function Input({ label, ...props }: InputProps) { const { colors } = useOnlyus(); return <View style={styles.inputWrap}><Text style={[styles.label, { color: colors.text }]}>{label}</Text><TextInput {...props} accessibilityLabel={label} placeholderTextColor={colors.subtle} style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }, props.style]} /></View>; });
interface CardProps { children: ReactNode; }
export const Card = memo(function Card({ children }: CardProps) { const { colors } = useOnlyus(); return <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>{children}</View>; });
interface NoticeProps { message: string; success?: boolean; }
export const Notice = memo(function Notice({ message, success = false }: NoticeProps) { const { colors } = useOnlyus(); if (!message) return null; return <View accessibilityRole="alert" style={[styles.notice, { borderColor: success ? colors.success : colors.danger, backgroundColor: colors.surface }]}><Feather name={success ? 'check-circle' : 'alert-circle'} size={20} color={success ? colors.success : colors.danger} /><Text style={[styles.noticeText, { color: colors.text }]}>{message}</Text></View>; });
const styles = StyleSheet.create({ button: { minHeight: 52, borderRadius: 18, paddingHorizontal: spacing.sm, paddingVertical: spacing.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs }, buttonText: { fontSize: 16, fontWeight: '600', includeFontPadding: false }, inputWrap: { gap: spacing.xs }, label: { fontSize: 16, fontWeight: '500' }, input: { minHeight: 54, borderWidth: 1, borderRadius: 16, paddingHorizontal: spacing.sm, fontSize: 16, includeFontPadding: false }, card: { borderRadius: 24, borderWidth: 1, padding: spacing.md, gap: spacing.sm }, notice: { borderWidth: 1, padding: spacing.sm, borderRadius: 16, flexDirection: 'row', gap: spacing.xs, alignItems: 'flex-start' }, noticeText: { flex: 1, fontSize: 16, lineHeight: 25 } });
