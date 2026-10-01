import React from 'react';
import { View, Image, Text, StyleSheet, TouchableOpacity, ImageSourcePropType } from 'react-native';

// Define the props interface
interface CircularIconProps {
  icon: ImageSourcePropType;
  title: string;
  onPress: () => void;
  size?: number;
  iconSize?: number;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
}

const CircularIcon: React.FC<CircularIconProps> = ({ 
  icon, 
  title, 
  onPress, 
  size = 80, 
  iconSize = 40,
  backgroundColor = '#ffffff',
  borderColor = '#3949AB',
  textColor = '#3949AB'
}) => {
  return (
    <TouchableOpacity onPress={onPress} style={styles.container}>
      <View style={[
        styles.circle, 
        { 
          width: size, 
          height: size, 
          borderColor: borderColor, 
          backgroundColor: backgroundColor 
        }
      ]}>
        <Image 
          source={icon} 
          style={{ width: iconSize, height: iconSize }}
          resizeMode="contain"
        />
      </View>
      <Text style={[styles.title, { color: textColor }]}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    // alignItems: 'center',
    // justifyContent: 'center',
    margin: 10,
    width: 100,
  },
  circle: {
    borderRadius: 50,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default CircularIcon;