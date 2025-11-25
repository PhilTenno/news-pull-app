// components/ui/Button.tsx
import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
} from 'react-native';
import { buttonStyles, buttonTextStyles } from '../../styles/Button'; // ← neuer Import

type Props = {
  className?: string;          // z. B. "btn primary"
  onPress?: () => void;
  children: React.ReactNode;   // Text‑Inhalt
};

export default function Button({ className = 'btn', onPress, children }: Props) {
  const classes = className.split(/\s+/).filter(Boolean);

  // Basis‑Style aus allen Klassen zusammenführen
  const baseStyle: ViewStyle = StyleSheet.flatten(
    classes.map((c) => buttonStyles[c] ?? {})
  );

  // Text‑Style (je nach Klasse)
  const textStyle: TextStyle = StyleSheet.flatten(
    classes.map((c) => buttonTextStyles[c] ?? {})
  );

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        baseStyle,
        pressed && { transform: [{ scale: 0.9 }] },   // .onPress‑Effekt
      ]}
    >
      <Text style={textStyle}>{children}</Text>
    </Pressable>
  );
}