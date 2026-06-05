import React from 'react';
import { ViewStyle } from 'react-native';
import Animated, {
  FadeInUp,
  FadeInRight,
  FadeIn,
} from 'react-native-reanimated';

interface AnimatedCardProps {
  children: React.ReactNode;
  delay?: number;
  index?: number;
  style?: ViewStyle | ViewStyle[];
  direction?: 'up' | 'right' | 'none';
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  index = 0,
  delay = 0,
  style,
  direction = 'up',
}) => {
  const stagger = delay + index * 55; // 55ms between each card

  let enteringAnim;
  if (direction === 'up') {
    enteringAnim = FadeInUp.delay(stagger).springify().damping(18).stiffness(200);
  } else if (direction === 'right') {
    enteringAnim = FadeInRight.delay(stagger).springify().damping(18).stiffness(200);
  } else {
    enteringAnim = FadeIn.delay(stagger).duration(400);
  }

  return (
    <Animated.View style={style} entering={enteringAnim}>
      {children}
    </Animated.View>
  );
};
