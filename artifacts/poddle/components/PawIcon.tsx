import React from "react";
import Svg, { Circle, Path } from "react-native-svg";

type Props = {
  size?: number;
  color?: string;
};

export function PawIcon({ size = 24, color = "#2563EB" }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 18C12 18 6 14.5 6 10C6 7.79086 7.79086 6 10 6C10.9428 6 11.8086 6.33214 12.4857 6.88781C12.8188 7.16184 13.1812 7.16184 13.5143 6.88781C14.1914 6.33214 15.0572 6 16 6C18.2091 6 20 7.79086 20 10C20 14.5 14 18 14 18"
        fill={color}
        opacity={0.2}
      />
      <Circle cx="8.5" cy="7.5" r="1.5" fill={color} />
      <Circle cx="15.5" cy="7.5" r="1.5" fill={color} />
      <Circle cx="6" cy="11" r="1.5" fill={color} />
      <Circle cx="18" cy="11" r="1.5" fill={color} />
      <Path
        d="M12 20C9.5 20 5 16.5 5 11.5C5 9.5 6.5 8 8.5 8C9.5 8 10.4 8.4 11 9C11.5 9.5 12.5 9.5 13 9C13.6 8.4 14.5 8 15.5 8C17.5 8 19 9.5 19 11.5C19 16.5 14.5 20 12 20Z"
        fill={color}
      />
    </Svg>
  );
}
