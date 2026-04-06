import React from "react";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";
import { View } from "react-native";

type Props = {
  size?: number;
  rounded?: boolean;
};

export function PodleLogo({ size = 48, rounded = true }: Props) {
  const r = rounded ? size * 0.26 : 0;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: r,
        overflow: "hidden",
        shadowColor: "#2563EB",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 8,
      }}
    >
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#2563EB" />
            <Stop offset="1" stopColor="#7C3AED" />
          </LinearGradient>
          <RadialGradient id="glow" cx="50%" cy="40%" r="55%">
            <Stop offset="0" stopColor="#60A5FA" stopOpacity="0.6" />
            <Stop offset="1" stopColor="#2563EB" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* Background */}
        <Rect width="100" height="100" fill="url(#bg)" />
        <Rect width="100" height="100" fill="url(#glow)" />

        {/* Paw print - main pad */}
        <Ellipse cx="50" cy="62" rx="18" ry="14" fill="white" opacity="0.97" />

        {/* Toe beans */}
        <Ellipse cx="32" cy="47" rx="8" ry="9.5" fill="white" opacity="0.97" />
        <Ellipse cx="43" cy="41" rx="7.5" ry="9" fill="white" opacity="0.97" />
        <Ellipse cx="57" cy="41" rx="7.5" ry="9" fill="white" opacity="0.97" />
        <Ellipse cx="68" cy="47" rx="8" ry="9.5" fill="white" opacity="0.97" />

        {/* Inner details on main pad */}
        <Ellipse cx="50" cy="62" rx="10" ry="7" fill="#C7D7FF" opacity="0.45" />

        {/* Inner details on toe beans */}
        <Ellipse cx="32" cy="47" rx="4.5" ry="5.5" fill="#C7D7FF" opacity="0.35" />
        <Ellipse cx="43" cy="41" rx="4" ry="5" fill="#C7D7FF" opacity="0.35" />
        <Ellipse cx="57" cy="41" rx="4" ry="5" fill="#C7D7FF" opacity="0.35" />
        <Ellipse cx="68" cy="47" rx="4.5" ry="5.5" fill="#C7D7FF" opacity="0.35" />
      </Svg>
    </View>
  );
}

export function PodleLogoSmall({ size = 36 }: { size?: number }) {
  return <PodleLogo size={size} rounded />;
}
