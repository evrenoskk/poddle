import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { UserProfileModal } from "@/components/UserProfileModal";

type Props = {
  title: string;
  subtitle?: string;
  rightContent?: React.ReactNode;
  children?: React.ReactNode;
};

export function SharedHeader({ title, subtitle, rightContent, children }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [showProfile, setShowProfile] = useState(false);

  const topInset = insets.top + (Platform.OS === "web" ? 67 : 0);

  return (
    <>
      <LinearGradient
        colors={[colors.primary, "#1d4ed8"]}
        style={[styles.header, { paddingTop: topInset + 12 }]}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.profileBtn}
              onPress={() => setShowProfile(true)}
            >
              <Feather name="user" size={17} color="#fff" />
            </TouchableOpacity>
            <View style={styles.titleWrap}>
              <Text style={styles.title}>{title}</Text>
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
          </View>
          {rightContent && <View style={styles.headerRight}>{rightContent}</View>}
        </View>
        {children}
      </LinearGradient>

      <UserProfileModal
        visible={showProfile}
        onClose={() => setShowProfile(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  profileBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  titleWrap: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  subtitle: {
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
