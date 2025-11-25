// components/ui/smallbutton.tsx
import { smallButton } from '@/styles/Button';
import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { Text, TouchableOpacity } from 'react-native';

export type SmallButtonProps = {
  title?: string;
  onPress?: () => void;
  iconName?: React.ComponentProps<typeof Ionicons>['name'];
};

export const SmallButton: React.FC<SmallButtonProps> = ({
  title,
  onPress,
  iconName,
}) => {
  const isIconOnly = !title && !!iconName;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        smallButton.smallButtonBase,
        isIconOnly ? smallButton.smallButtonIconOnly : smallButton.smallButtonText,
      ]}
      activeOpacity={0.8}
    >
      {iconName && (
        <Ionicons
          name={iconName}
          size={16}
          color="#b0b3d2"
          style={{marginInlineEnd:4}}
        />
      )}
      {title && (
        <Text style={smallButton.smallButtonLink}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};