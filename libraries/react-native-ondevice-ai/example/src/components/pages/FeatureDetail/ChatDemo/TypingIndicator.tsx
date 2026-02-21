import React, {useEffect, useRef} from 'react';
import {View, Animated, StyleSheet} from 'react-native';

export function TypingIndicator() {
  const animations = [
    useRef(new Animated.Value(0.5)).current,
    useRef(new Animated.Value(0.5)).current,
    useRef(new Animated.Value(0.5)).current,
  ];

  useEffect(() => {
    const animateDot = (anim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0.5,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      );
    };

    const animation = Animated.parallel([
      animateDot(animations[0], 0),
      animateDot(animations[1], 200),
      animateDot(animations[2], 400),
    ]);

    animation.start();

    return () => animation.stop();
  }, []);

  return (
    <View style={styles.container}>
      {animations.map((anim, index) => (
        <Animated.View
          key={index}
          style={[
            styles.dot,
            {
              transform: [{scale: anim}],
              opacity: anim,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 16,
    alignSelf: 'flex-start',
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#666',
  },
});
