import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { TaskCard } from "@/components/TaskCard";
import { PawIcon } from "@/components/PawIcon";

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { pets, activePetId, tasks, updateTask, deleteTask } = useApp();

  const activePet = pets.find((p) => p.id === activePetId) ?? pets[0];
  const upcomingTasks = tasks
    .filter((t) => !t.completed && t.petId === String(activePet?.id ?? ""))
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 3);

  const topInset = insets.top + (Platform.OS === "web" ? 67 : 0);
  const bottomInset = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  const tips = [
    "Evcil hayvanınızı bol su içirmeyi unutmayın!",
    "Düzenli tırnak kesimi önemlidir.",
    "Günde 30 dk yürüyüş enerjisini dengeler.",
    "Diş sağlığı genel sağlığı etkiler.",
  ];
  const dailyTip = tips[new Date().getDay() % tips.length];

  const quickActions = [
    { icon: "user", label: "Evcil\nHayvanlarım", route: "/profile" as const },
    { icon: "calendar", label: "Randevular", route: "/health" as const },
    { icon: "book-open", label: "Kaynaklar", route: "/health" as const },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomInset + 80 }}
      >
        {/* Header */}
        <LinearGradient
          colors={[colors.primary, "#1d4ed8"]}
          style={[styles.header, { paddingTop: topInset + 16 }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <View style={[styles.avatar, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
                <PawIcon size={22} color="#fff" />
              </View>
              <View>
                <Text style={styles.headerGreeting}>Hoş geldiniz!</Text>
                <Text style={styles.headerTitle}>Poddle</Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.notifBtn, { backgroundColor: "rgba(255,255,255,0.15)" }]}
            >
              <Feather name="bell" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* Active Pet Card */}
          {activePet ? (
            <TouchableOpacity
              style={[styles.petHero, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push("/profile")}
              activeOpacity={0.9}
            >
              <View style={styles.petHeroLeft}>
                <View style={styles.statusRow}>
                  <View style={[styles.statusDot, { backgroundColor: colors.accent }]} />
                  <Text style={[styles.statusText, { color: colors.mutedForeground }]}>
                    {activePet.status.toUpperCase()}
                  </Text>
                </View>
                <Text style={[styles.petName, { color: colors.foreground }]}>{activePet.name}</Text>
                <Text style={[styles.petBreed, { color: colors.mutedForeground }]}>
                  {activePet.breed} · {activePet.age} yaş
                </Text>
                <TouchableOpacity
                  style={[styles.viewProfileBtn, { backgroundColor: colors.primary }]}
                  onPress={() => router.push("/profile")}
                  activeOpacity={0.85}
                >
                  <Text style={styles.viewProfileText}>Profili Gör</Text>
                  <Feather name="arrow-right" size={14} color="#fff" />
                </TouchableOpacity>
              </View>
              {activePet.imageUri ? (
                <Image
                  source={{ uri: activePet.imageUri }}
                  style={styles.petHeroImage}
                  contentFit="cover"
                />
              ) : (
                <View style={[styles.petHeroImagePlaceholder, { backgroundColor: colors.primaryLight }]}>
                  <MaterialCommunityIcons name="dog" size={48} color={colors.primary} />
                </View>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.addPetCard, { backgroundColor: colors.primary }]}
              onPress={() => router.push("/profile")}
              activeOpacity={0.85}
            >
              <Feather name="plus-circle" size={28} color="#fff" />
              <Text style={styles.addPetText}>İlk evcil hayvanınızı ekleyin</Text>
              <Text style={styles.addPetSubtext}>Poddle ile bakımını kolaylaştırın</Text>
            </TouchableOpacity>
          )}

          {/* Upcoming Tasks */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Yaklaşan Görevler</Text>
              <TouchableOpacity onPress={() => router.push("/health")}>
                <Text style={[styles.sectionLink, { color: colors.primary }]}>Tümü</Text>
              </TouchableOpacity>
            </View>
            {upcomingTasks.length > 0 ? (
              upcomingTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggle={(t) => updateTask({ ...t, completed: !t.completed })}
                  onDelete={deleteTask}
                />
              ))
            ) : (
              <View style={[styles.emptyTasks, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name="check-circle" size={28} color={colors.mutedForeground} />
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  {activePet ? "Yaklaşan görev yok" : "Önce bir evcil hayvan ekleyin"}
                </Text>
              </View>
            )}
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Hızlı Eylemler</Text>
            <View style={styles.quickActions}>
              {quickActions.map((action) => (
                <TouchableOpacity
                  key={action.label}
                  style={[styles.quickAction, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    router.push(action.route);
                  }}
                  activeOpacity={0.8}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: colors.primaryLight }]}>
                    <Feather name={action.icon as any} size={22} color={colors.primary} />
                  </View>
                  <Text style={[styles.quickActionLabel, { color: colors.foreground }]}>
                    {action.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Daily Tip */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => router.push("/chat")}
          >
            <LinearGradient
              colors={[colors.primary, "#1d4ed8"]}
              style={styles.tipCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.tipPawBg}>
                <PawIcon size={80} color="rgba(255,255,255,0.08)" />
              </View>
              <Text style={styles.tipLabel}>Poddle'dan Günlük İpucu</Text>
              <Text style={styles.tipText}>{dailyTip}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  headerGreeting: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    fontFamily: "Inter_400Regular",
  },
  headerTitle: {
    fontSize: 22,
    color: "#fff",
    fontFamily: "Inter_700Bold",
  },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: 16,
    gap: 4,
  },
  petHero: {
    flexDirection: "row",
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    overflow: "hidden",
    alignItems: "center",
  },
  petHeroLeft: {
    flex: 1,
    gap: 6,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
  },
  petName: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  petBreed: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  viewProfileBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  viewProfileText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  petHeroImage: {
    width: 100,
    height: 100,
    borderRadius: 14,
    marginLeft: 12,
  },
  petHeroImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 14,
    marginLeft: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  addPetCard: {
    padding: 20,
    borderRadius: 20,
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  addPetText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  addPetSubtext: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.75)",
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  sectionLink: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  emptyTasks: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 20,
    alignItems: "center",
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  quickActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  quickAction: {
    flex: 1,
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  quickActionIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
  tipCard: {
    borderRadius: 20,
    padding: 20,
    overflow: "hidden",
    marginTop: 4,
  },
  tipPawBg: {
    position: "absolute",
    right: -10,
    bottom: -10,
  },
  tipLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.7)",
    marginBottom: 4,
  },
  tipText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    maxWidth: "80%",
  },
});
