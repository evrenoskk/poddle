import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { Pet } from "@/context/AppContext";

type Props = {
  pet: Pet;
  isActive?: boolean;
  onPress: () => void;
};

export function PetCard({ pet, isActive, onPress }: Props) {
  const colors = useColors();

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: isActive ? colors.primary : colors.border,
          borderWidth: isActive ? 2 : 1,
        },
      ]}
      activeOpacity={0.8}
    >
      <View style={[styles.imageContainer, { backgroundColor: colors.primaryLight }]}>
        {pet.imageUri ? (
          <Image
            source={{ uri: pet.imageUri }}
            style={styles.image}
            contentFit="cover"
          />
        ) : (
          <Feather name="camera" size={28} color={colors.primary} />
        )}
      </View>

      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: colors.foreground }]}>{pet.name}</Text>
          {isActive && (
            <View style={[styles.activeDot, { backgroundColor: colors.accent }]} />
          )}
        </View>
        <Text style={[styles.breed, { color: colors.mutedForeground }]}>
          {pet.breed} · {pet.age} yaş
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: colors.primaryLight }]}>
          <View style={[styles.statusDot, { backgroundColor: colors.accent }]} />
          <Text style={[styles.statusText, { color: colors.primary }]}>{pet.status}</Text>
        </View>
      </View>

      <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    gap: 12,
    marginBottom: 10,
  },
  imageContainer: {
    width: 60,
    height: 60,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  image: {
    width: 60,
    height: 60,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  name: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  breed: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
});
