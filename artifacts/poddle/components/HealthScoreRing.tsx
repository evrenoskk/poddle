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
  if (score >= 70) return "#10B981";
  if (score >= 40) return "#F59E0B";
  return "#94A3B8";
}

function getScoreLabel(score: number) {
  if (score >= 70) return "Takip Düzenli";
  if (score >= 40) return "Takip Orta";
  if (score > 0) return "Takip Başlangıç";
  return "Kayıt Bekleniyor";
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
    <View style={[styles.container, { width: size, height: size + 28 }]}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.border}
          strokeWidth={10}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={scoreColor}
          strokeWidth={10}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          animatedProps={animatedProps}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>

      <View style={[styles.center, { width: size, height: size }]}>
        <View style={styles.scoreRow}>
          <Text style={[styles.score, { color: colors.foreground }]}>
            {score}
          </Text>
          <Text style={[styles.outOf, { color: colors.mutedForeground }]}>
            /100
          </Text>
        </View>
        <Text style={[styles.label, { color: colors.mutedForeground }]}>
          AKTİFLİK
        </Text>
      </View>

      <View style={[styles.badge, { backgroundColor: `${scoreColor}18` }]}>
        <View style={[styles.badgeDot, { backgroundColor: scoreColor }]} />
        <Text style={[styles.badgeText, { color: scoreColor }]}>
          {getScoreLabel(score)}
        </Text>
      </View>

      <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
        Kayıt düzenliliğinize göre hesaplanır
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "flex-start",
  },
  center: {
    position: "absolute",
    top: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  score: {
    fontSize: 38,
    fontFamily: "Inter_700Bold",
    lineHeight: 42,
  },
  outOf: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    marginBottom: 4,
    marginLeft: 2,
  },
  label: {
    fontSize: 9,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 2,
    marginTop: 2,
  },
  badge: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  disclaimer: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    marginTop: 5,
    opacity: 0.7,
  },
});
