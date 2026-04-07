import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  Alert,
  Modal,
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
import { PodleLogo } from "@/components/PodleLogo";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function UserProfileModal({ visible, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { subscription, pets, user, logout, tasks, clearAllTasks } = useApp();

  const planLabel =
    subscription.plan === "pro_plus"
      ? "Pro Plus ✦"
      : subscription.plan === "monthly"
      ? "Aylık Premium"
      : subscription.plan === "pay_per_question"
      ? "Soru Başına"
      : "Ücretsiz Plan";

  const planColor =
    subscription.plan === "pro_plus"
      ? "#F59E0B"
      : subscription.plan === "monthly"
      ? "#10B981"
      : subscription.plan === "pay_per_question"
      ? "#8B5CF6"
      : "#6B7280";

  async function doLogout() {
    onClose();
    await logout();
    router.replace("/login");
  }

  function handleLogout() {
    if (Platform.OS === "web") {
      if (confirm("Hesabından çıkmak istediğine emin misin?")) {
        doLogout();
      }
    } else {
      Alert.alert("Çıkış Yap", "Hesabından çıkmak istediğine emin misin?", [
        { text: "İptal", style: "cancel" },
        { text: "Çıkış Yap", style: "destructive", onPress: doLogout },
      ]);
    }
  }

  function handleClearTasks() {
    if (Platform.OS === "web") {
      if (confirm("Tüm görevler silinecek. Emin misin?")) {
        clearAllTasks();
      }
    } else {
      Alert.alert("Görevleri Temizle", "Tüm görevler silinecek. Emin misin?", [
        { text: "İptal", style: "cancel" },
        { text: "Temizle", style: "destructive", onPress: clearAllTasks },
      ]);
    }
  }

  const settingGroups = [
    {
      title: "Uygulama",
      items: [
        { icon: "bell", label: "Bildirimler", value: "Açık" },
        { icon: "moon", label: "Karanlık Mod", value: "Otomatik" },
        { icon: "globe", label: "Dil", value: "Türkçe" },
      ],
    },
    {
      title: "Hesap",
      items: [
        { icon: "shield", label: "Gizlilik Politikası", value: "" },
        { icon: "file-text", label: "Kullanım Koşulları", value: "" },
        { icon: "help-circle", label: "Yardım & Destek", value: "" },
      ],
    },
    {
      title: "Hakkında",
      items: [
        { icon: "info", label: "Uygulama Sürümü", value: "1.0.0" },
        { icon: "star", label: "Uygulamayı Puanla", value: "" },
      ],
    },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.background,
              paddingBottom: insets.bottom + (Platform.OS === "web" ? 20 : 0) + 20,
              marginTop: insets.top + (Platform.OS === "web" ? 67 : 0) + 20,
            },
          ]}
        >
          <View style={styles.handle} />

          <View style={styles.closeRow}>
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Profil & Ayarlar</Text>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.muted }]}>
              <Feather name="x" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <LinearGradient
              colors={[colors.primary, "#1d4ed8"]}
              style={styles.profileCard}
            >
              <View style={styles.avatarCircle}>
                <PodleLogo size={32} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.profileName}>{user?.name || "Poddle Kullanıcısı"}</Text>
                <Text style={styles.profileSub}>{user?.email || ""}</Text>
                <Text style={[styles.profileSub, { marginTop: 1 }]}>{pets.length} evcil hayvan</Text>
              </View>
              <View style={[styles.planBadge, { backgroundColor: planColor + "30", borderColor: planColor }]}>
                <Text style={[styles.planBadgeText, { color: "#fff" }]}>{planLabel}</Text>
              </View>
            </LinearGradient>

            {subscription.plan === "free" && (
              <View style={[styles.upgradeCard, { backgroundColor: colors.primaryLight, borderColor: colors.primary + "30" }]}>
                <Feather name="zap" size={18} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.upgradeTitle, { color: colors.primary }]}>Premium'a Geç</Text>
                  <Text style={[styles.upgradeDesc, { color: colors.primary }]}>
                    Sınırsız AI danışmanlık, öncelikli destek
                  </Text>
                </View>
                <Feather name="chevron-right" size={16} color={colors.primary} />
              </View>
            )}

            {settingGroups.map((group) => (
              <View key={group.title} style={styles.settingGroup}>
                <Text style={[styles.groupTitle, { color: colors.mutedForeground }]}>{group.title.toUpperCase()}</Text>
                <View style={[styles.groupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  {group.items.map((item, idx) => (
                    <TouchableOpacity
                      key={item.label}
                      style={[
                        styles.settingRow,
                        idx < group.items.length - 1 && { borderBottomWidth: 0.5, borderBottomColor: colors.border },
                      ]}
                    >
                      <View style={[styles.settingIconBox, { backgroundColor: colors.primaryLight }]}>
                        <Feather name={item.icon as any} size={15} color={colors.primary} />
                      </View>
                      <Text style={[styles.settingLabel, { color: colors.foreground }]}>{item.label}</Text>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        {item.value ? (
                          <Text style={[styles.settingValue, { color: colors.mutedForeground }]}>{item.value}</Text>
                        ) : null}
                        <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}

            {tasks.length > 0 && (
              <TouchableOpacity
                style={[styles.signOutBtn, { borderColor: "#F59E0B40", backgroundColor: "#FFFBEB", marginBottom: 10 }]}
                onPress={handleClearTasks}
              >
                <Feather name="trash-2" size={16} color="#F59E0B" />
                <Text style={[styles.signOutText, { color: "#F59E0B" }]}>Tüm Görevleri Temizle ({tasks.length})</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.signOutBtn, { borderColor: "#EF4444" + "40", backgroundColor: "#FEF2F2" }]}
              onPress={handleLogout}
            >
              <Feather name="log-out" size={16} color="#EF4444" />
              <Text style={[styles.signOutText, { color: "#EF4444" }]}>Çıkış Yap</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  sheet: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D1D5DB",
    alignSelf: "center",
    marginBottom: 14,
  },
  closeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  sheetTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  closeBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: "center", alignItems: "center" },

  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 16,
    marginBottom: 14,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  profileName: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff" },
  profileSub: { fontSize: 12, color: "rgba(255,255,255,0.7)", fontFamily: "Inter_400Regular", marginTop: 2 },
  planBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  planBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },

  upgradeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 20,
  },
  upgradeTitle: { fontSize: 14, fontFamily: "Inter_700Bold" },
  upgradeDesc: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1, opacity: 0.8 },

  settingGroup: { marginBottom: 20 },
  groupTitle: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1, marginBottom: 8 },
  groupCard: { borderRadius: 14, borderWidth: 0.5, overflow: "hidden" },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  settingIconBox: { width: 30, height: 30, borderRadius: 8, justifyContent: "center", alignItems: "center" },
  settingLabel: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium" },
  settingValue: { fontSize: 13, fontFamily: "Inter_400Regular" },

  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  signOutText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
});
