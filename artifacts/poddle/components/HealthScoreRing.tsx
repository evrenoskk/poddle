import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";
import { useColors } from "@/hooks/useColors";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = {
  score: number;
  size?: number;
};

function getScoreColor(score: number) {
  if (score >= 80) return "#10B981";
  if (score >= 60) return "#F59E0B";
  return "#EF4444";
}

function getScoreLabel(score: number) {
  if (score >= 80) return "Genel Durum İyi";
  if (score >= 60) return "Genel Durum Orta";
  return "Dikkat Gerekli";
}

export function HealthScoreRing({ score, size = 160 }: Props) {
  const colors = useColors();
  const radius = (size - 24) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = useSharedValue(0);
  const scoreColor = getScoreColor(score);

  useEffect(() => {
    progress.value = withTiming(score / 100, { duration: 1200 });
  }, [score]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.border}
          strokeWidth={12}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={scoreColor}
          strokeWidth={12}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          animatedProps={animatedProps}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={styles.center}>
        <Text style={[styles.score, { color: colors.foreground }]}>{score}</Text>
        <Text style={[styles.outOf, { color: colors.mutedForeground }]}>/100</Text>
        <Text style={[styles.label, { color: colors.mutedForeground }]}>PUAN</Text>
      </View>
      <View style={[styles.badge, { backgroundColor: `${scoreColor}20` }]}>
        <View style={[styles.badgeDot, { backgroundColor: scoreColor }]} />
        <Text style={[styles.badgeText, { color: scoreColor }]}>
          {getScoreLabel(score)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  center: {
    position: "absolute",
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  score: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    lineHeight: 36,
  },
  outOf: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginTop: 8,
    marginLeft: 2,
  },
  label: {
    width: "100%",
    textAlign: "center",
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.5,
    marginTop: -4,
  },
  badge: {
    position: "absolute",
    bottom: -8,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
});
