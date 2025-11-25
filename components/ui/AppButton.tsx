// components/ui/AppButton.tsx
import React from 'react';
import {
  GestureResponderEvent,
  Insets,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { theme } from '../../styles/theme';

type Props = {
  title: string;
  onPress?: (e: GestureResponderEvent) => void;
  variant?: 'primary' | 'danger' | 'link';
  style?: ViewStyle | ViewStyle[];
  accessibilityLabel?: string;
};

const defaultHitSlop: Insets = { top: 10, bottom: 10, left: 8, right: 8 };

export default function AppButton({
  title,
  onPress,
  variant = 'primary',
  style,
  accessibilityLabel,
}: Props) {
  const boxStyle: ViewStyle =
    variant === 'primary'
      ? styles.primary
      : variant === 'danger'
      ? styles.danger
      : styles.link;

  const labelStyle: TextStyle =
    variant === 'primary' || variant === 'danger' ? styles.labelLight : styles.labelLink;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.base, boxStyle, style]}
      accessibilityLabel={accessibilityLabel ?? title}
      activeOpacity={0.8}
      hitSlop={defaultHitSlop}
    >
      <Text style={labelStyle}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    color:'#000',
  },
  primary: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  danger: {
    backgroundColor: theme.colors.danger,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  // Link variant: simple outlined button so it looks like a button (not plain text)
  link: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  labelLight: {
    color: '#fff',
    fontWeight: '600' as TextStyle['fontWeight'],
    fontFamily: theme.fonts.medium,
  },
  labelLink: {
    color: theme.colors.primary,
    fontWeight: '600' as TextStyle['fontWeight'],
    fontFamily: theme.fonts.medium,
  },
});