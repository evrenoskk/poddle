import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  Platform,
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
import { PodleLogo } from "@/components/PodleLogo";
import { SharedHeader } from "@/components/SharedHeader";

const SPECIES_ICON: Record<string, string> = {
  Köpek: "dog",
  Kedi: "cat",
  Kuş: "bird",
  Tavşan: "rabbit",
  Diğer: "paw",
};

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
    { icon: "activity", label: "Sağlık", color: "#10B981", bg: "#D1FAE5", route: "/health" as const },
    { icon: "message-circle", label: "Poddle AI", color: "#7C3AED", bg: "#EDE9FE", route: "/chat" as const },
    { icon: "calendar", label: "Randevu", color: "#F59E0B", bg: "#FEF3C7", route: "/health" as const },
    { icon: "heart", label: "Hayvanlarım", color: "#2563EB", bg: "#DBEAFE", route: "/profile" as const },
  ];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Günaydın" : hour < 18 ? "İyi günler" : "İyi akşamlar";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomInset + 80 }}
      >
        <SharedHeader
          title={`${greeting} 👋`}
          subtitle="Poddle"
          rightContent={
            <TouchableOpacity style={styles.notifBtn}>
              <Feather name="bell" size={18} color="#fff" />
              <View style={styles.notifDot} />
            </TouchableOpacity>
          }
        >
          {activePet && (
            <View style={styles.headerPetBadge}>
              <View style={[styles.headerPetDot, { backgroundColor: "#10B981" }]} />
              <Text style={styles.headerPetText}>{activePet.name} — {activePet.status}</Text>
            </View>
          )}
        </SharedHeader>

        <View style={styles.content}>
          {/* Hero Pet Card */}
          {activePet ? (
            <TouchableOpacity
              activeOpacity={0.92}
              onPress={() => router.push("/profile")}
              style={styles.petHeroWrapper}
            >
              <LinearGradient
                colors={["#1E3A8A", "#2563EB"]}
                style={styles.petHeroCard}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.petHeroDecor} />
                <View style={styles.petHeroLeft}>
                  <View style={styles.petHeroStatusRow}>
                    <View style={styles.petHeroStatusDot} />
                    <Text style={styles.petHeroStatus}>{activePet.status}</Text>
                  </View>
                  <Text style={styles.petHeroName}>{activePet.name}</Text>
                  <Text style={styles.petHeroBreed}>{activePet.breed}</Text>
                  <View style={styles.petHeroStats}>
                    <View style={styles.petHeroStat}>
                      <Text style={styles.petHeroStatVal}>{activePet.age}</Text>
                      <Text style={styles.petHeroStatLbl}>yaş</Text>
                    </View>
                    <View style={styles.petHeroStatDivider} />
                    <View style={styles.petHeroStat}>
                      <Text style={styles.petHeroStatVal}>{activePet.weight}</Text>
                      <Text style={styles.petHeroStatLbl}>kg</Text>
                    </View>
                    <View style={styles.petHeroStatDivider} />
                    <View style={styles.petHeroStat}>
                      <Text style={styles.petHeroStatVal}>{activePet.gender === "male" ? "♂" : "♀"}</Text>
                      <Text style={styles.petHeroStatLbl}>{activePet.gender === "male" ? "erkek" : "dişi"}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.petHeroBtn}
                    onPress={() => router.push("/profile")}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.petHeroBtnText}>Profili Görüntüle</Text>
                    <Feather name="arrow-right" size={14} color="#2563EB" />
                  </TouchableOpacity>
                </View>
                <View style={styles.petHeroRight}>
                  {activePet.imageUri ? (
                    <Image
                      source={{ uri: activePet.imageUri }}
                      style={styles.petHeroImage}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={styles.petHeroImagePlaceholder}>
                      <MaterialCommunityIcons
                        name={(SPECIES_ICON[activePet.species] ?? "paw") as any}
                        size={52}
                        color="rgba(255,255,255,0.9)"
                      />
                    </View>
                  )}
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => router.push("/profile")}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={["#2563EB", "#7C3AED"]}
                style={styles.addPetCard}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <View style={styles.addPetIconWrap}>
                  <Feather name="plus" size={28} color="#2563EB" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.addPetTitle}>İlk evcil hayvanınızı ekleyin</Text>
                  <Text style={styles.addPetSub}>Sağlık takibine hemen başlayın</Text>
                </View>
                <Feather name="chevron-right" size={22} color="rgba(255,255,255,0.7)" />
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Quick Actions Grid */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Hızlı Erişim</Text>
            <View style={styles.quickGrid}>
              {quickActions.map((a) => (
                <TouchableOpacity
                  key={a.label}
                  style={[styles.quickCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    router.push(a.route);
                  }}
                  activeOpacity={0.82}
                >
                  <View style={[styles.quickIconBox, { backgroundColor: a.bg }]}>
                    <Feather name={a.icon as any} size={20} color={a.color} />
                  </View>
                  <Text style={[styles.quickLabel, { color: colors.foreground }]}>{a.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Upcoming Tasks */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Yaklaşan Görevler</Text>
              <TouchableOpacity
                onPress={() => router.push("/health")}
                style={[styles.seeAllBtn, { backgroundColor: colors.primaryLight }]}
              >
                <Text style={[styles.seeAllText, { color: colors.primary }]}>Tümünü gör</Text>
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
              <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.emptyIconBox, { backgroundColor: colors.primaryLight }]}>
                  <Feather name="check-circle" size={22} color={colors.primary} />
                </View>
                <Text style={[styles.emptyText, { color: colors.foreground }]}>
                  {activePet ? "Yaklaşan görev yok" : "Önce bir evcil hayvan ekleyin"}
                </Text>
                <Text style={[styles.emptySubText, { color: colors.mutedForeground }]}>
                  {activePet ? "Tebrikler! Her şey güncel 🎉" : "Profil sekmesinden ekleyebilirsiniz"}
                </Text>
              </View>
            )}
          </View>

          {/* AI CTA Card */}
          <TouchableOpacity activeOpacity={0.9} onPress={() => router.push("/chat")}>
            <LinearGradient
              colors={["#7C3AED", "#4F46E5", "#2563EB"]}
              style={styles.aiCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.aiCardDecor} />
              <View style={styles.aiCardLeft}>
                <View style={styles.aiCardBadge}>
                  <Text style={styles.aiCardBadgeText}>AI</Text>
                </View>
                <Text style={styles.aiCardTitle}>Poddle'a Sor</Text>
                <Text style={styles.aiCardSub}>{dailyTip}</Text>
                <View style={styles.aiCardBtn}>
                  <Text style={styles.aiCardBtnText}>Sohbet Başlat</Text>
                  <Feather name="arrow-right" size={13} color="#7C3AED" />
                </View>
              </View>
              <View style={styles.aiCardIcon}>
                <MaterialCommunityIcons name="robot-excited" size={52} color="rgba(255,255,255,0.9)" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  notifBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  notifDot: {
    position: "absolute",
    top: 9,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#EF4444",
    borderWidth: 1.5,
    borderColor: "#2563EB",
  },
  headerPetBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 14,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  headerPetDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  headerPetText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "rgba(255,255,255,0.92)",
  },
  content: {
    padding: 16,
    gap: 0,
  },
  petHeroWrapper: {
    marginBottom: 16,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#1E40AF",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  petHeroCard: {
    flexDirection: "row",
    padding: 20,
    alignItems: "center",
    overflow: "hidden",
  },
  petHeroDecor: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.05)",
    top: -60,
    right: 60,
  },
  petHeroLeft: {
    flex: 1,
    gap: 6,
  },
  petHeroStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  petHeroStatusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#10B981",
  },
  petHeroStatus: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: "#6EE7B7",
    letterSpacing: 0.5,
  },
  petHeroName: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: -0.5,
  },
  petHeroBreed: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.65)",
  },
  petHeroStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 4,
  },
  petHeroStat: {
    alignItems: "center",
  },
  petHeroStatVal: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  petHeroStatLbl: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.55)",
  },
  petHeroStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  petHeroBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    backgroundColor: "#fff",
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  petHeroBtnText: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    color: "#2563EB",
  },
  petHeroRight: {},
  petHeroImage: {
    width: 110,
    height: 110,
    borderRadius: 20,
    marginLeft: 12,
  },
  petHeroImagePlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 20,
    marginLeft: 12,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  addPetCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderRadius: 22,
    gap: 14,
    marginBottom: 16,
  },
  addPetIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  addPetTitle: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    marginBottom: 2,
  },
  addPetSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.7)",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  seeAllBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  seeAllText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  quickCard: {
    width: "47%",
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
  },
  quickIconBox: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  quickLabel: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  emptyCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
    alignItems: "center",
    gap: 8,
  },
  emptyIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  emptySubText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  aiCard: {
    borderRadius: 24,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  aiCardDecor: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.06)",
    top: -40,
    right: 30,
  },
  aiCardLeft: {
    flex: 1,
    gap: 6,
  },
  aiCardBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  aiCardBadgeText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: 1,
  },
  aiCardTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  aiCardSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.7)",
    maxWidth: "85%",
    lineHeight: 17,
  },
  aiCardBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fff",
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 4,
  },
  aiCardBtnText: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    color: "#7C3AED",
  },
  aiCardIcon: {
    marginLeft: 8,
  },
});
