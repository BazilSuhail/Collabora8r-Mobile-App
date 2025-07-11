// MultiDropZonesDraggable.js
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import {
  GestureDetector,
  Gesture,
} from 'react-native-gesture-handler';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const DROP_ZONES = [
  {
    id: 1,
    x: 40,
    y: 100,
    width: SCREEN_WIDTH - 80,
    height: 100,
    color: '#dbeafe',
    hoverColor: '#bfdbfe',
    borderColor: '#3b82f6',
    activeBorder: '#1d4ed8',
  },
  {
    id: 2,
    x: 40,
    y: 250,
    width: SCREEN_WIDTH - 80,
    height: 100,
    color: '#f0fdf4',
    hoverColor: '#bbf7d0',
    borderColor: '#22c55e',
    activeBorder: '#15803d',
  },
  {
    id: 3,
    x: 40,
    y: 400,
    width: SCREEN_WIDTH - 80,
    height: 100,
    color: '#faf5ff',
    hoverColor: '#e9d5ff',
    borderColor: '#a855f7',
    activeBorder: '#6b21a8',
  },
];

export default function MultiDropZonesDraggable() {
  const boxSize = 100;

  const translateX = useSharedValue(100);
  const translateY = useSharedValue(600);
  const offsetX = useSharedValue(translateX.value);
  const offsetY = useSharedValue(translateY.value);

  const hoveredZone = useSharedValue(0);
  const currentZone = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      offsetX.value = translateX.value;
      offsetY.value = translateY.value;
    })
    .onUpdate((event) => {
      translateX.value = offsetX.value + event.translationX;
      translateY.value = offsetY.value + event.translationY;

      const centerX = translateX.value + boxSize / 2;
      const centerY = translateY.value + boxSize / 2;

      let zoneFound = 0;
      for (let zone of DROP_ZONES) {
        if (
          centerX >= zone.x &&
          centerX <= zone.x + zone.width &&
          centerY >= zone.y &&
          centerY <= zone.y + zone.height
        ) {
          zoneFound = zone.id;
          break;
        }
      }

      hoveredZone.value = zoneFound;
    })
    .onEnd(() => {
      const centerX = translateX.value + boxSize / 2;
      const centerY = translateY.value + boxSize / 2;

      let droppedZone = null;
      for (let zone of DROP_ZONES) {
        if (
          centerX >= zone.x &&
          centerX <= zone.x + zone.width &&
          centerY >= zone.y &&
          centerY <= zone.y + zone.height
        ) {
          droppedZone = zone;
          break;
        }
      }

      if (droppedZone) {
        const centerZoneX = droppedZone.x + droppedZone.width / 2 - boxSize / 2;
        const centerZoneY = droppedZone.y + droppedZone.height / 2 - boxSize / 2;

        translateX.value = withSpring(centerZoneX);
        translateY.value = withSpring(centerZoneY);
        currentZone.value = droppedZone.id;
      }

      offsetX.value = translateX.value;
      offsetY.value = translateY.value;
      hoveredZone.value = 0;
    });

  const boxStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  const getZoneStyle = (zone) =>
    useAnimatedStyle(() => {
      const isHover = hoveredZone.value === zone.id;
      const isActive = currentZone.value === zone.id;

      return {
        backgroundColor: isHover
          ? zone.hoverColor
          : zone.color,
        borderColor: isHover || isActive
          ? zone.activeBorder
          : zone.borderColor,
        transform: [{ scale: withSpring(isHover ? 1.03 : 1) }],
      };
    });

  return (
    <View style={styles.container}>
      {DROP_ZONES.map((zone) => {
        const animatedZoneStyle = getZoneStyle(zone);
        return (
          <Animated.View
            key={zone.id}
            style={[
              styles.dropZone,
              {
                left: zone.x,
                top: zone.y,
                width: zone.width,
                height: zone.height,
              },
              animatedZoneStyle,
            ]}
          >
            <Text style={styles.zoneLabel}>Zone {zone.id}</Text>
          </Animated.View>
        );
      })}

      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.box, boxStyle]}>
          <Text style={styles.emoji}>📦</Text>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  dropZone: {
    position: 'absolute',
    borderWidth: 3,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoneLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  box: {
    position: 'absolute',
    width: 100,
    height: 100,
    backgroundColor: '#f97316',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 32,
  },
});
