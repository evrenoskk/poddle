import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  Modal,
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

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelectPlan: (plan: "pay_per_question" | "monthly") => void;
};

export function SubscriptionModal({ visible, onClose, onSelectPlan }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { subscription } = useApp();

  const handleSelect = (plan: "pay_per_question" | "monthly") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSelectPlan(plan);
  };

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
              backgroundColor: colors.card,
              paddingBottom:
                insets.bottom + (Platform.OS === "web" ? 34 : 0) + 16,
            },
          ]}
        >
          <View style={styles.handle} />

          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: colors.foreground }]}>
                Poddle Premium
              </Text>
              <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                {subscription.freeQuestionsTotal - subscription.freeQuestionsUsed} ücretsiz sorunuz kaldı
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={[styles.planCard, { backgroundColor: "#EFF6FF", borderColor: colors.primary }]}>
              <View style={styles.planHeader}>
                <View style={[styles.planBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.planBadgeText}>Esnek</Text>
                </View>
                <View style={styles.planPriceRow}>
                  <Text style={[styles.planPrice, { color: colors.foreground }]}>$0.50</Text>
                  <Text style={[styles.planPricePer, { color: colors.mutedForeground }]}> / soru</Text>
                </View>
              </View>
              <Text style={[styles.planName, { color: colors.foreground }]}>
                Soru Basına Ode
              </Text>
              <Text style={[styles.planDesc, { color: colors.mutedForeground }]}>
                İhtiyacın olduğunda tek bir soru sor. Abonelik yok.
              </Text>
              {["AI veteriner danismanligini", "Gorsel & video analizi", "Her cihazda gecerli"].map((f) => (
                <View key={f} style={styles.featureRow}>
                  <Feather name="check" size={14} color={colors.primary} />
                  <Text style={[styles.featureText, { color: colors.foreground }]}>{f}</Text>
                </View>
              ))}
              <TouchableOpacity
                style={[styles.planBtn, { backgroundColor: colors.primary }]}
                onPress={() => handleSelect("pay_per_question")}
                activeOpacity={0.85}
              >
                <Text style={[styles.planBtnText, { color: "#fff" }]}>Soru Satın Al</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.planCard, { backgroundColor: "#D1FAE5", borderColor: colors.accent, marginTop: 12 }]}>
              <View style={styles.planHeader}>
                <View style={[styles.planBadge, { backgroundColor: colors.accent }]}>
                  <Text style={styles.planBadgeText}>En Populer</Text>
                </View>
                <View style={styles.planPriceRow}>
                  <Text style={[styles.planPrice, { color: colors.foreground }]}>$9.99</Text>
                  <Text style={[styles.planPricePer, { color: colors.mutedForeground }]}> / ay</Text>
                </View>
              </View>
              <Text style={[styles.planName, { color: colors.foreground }]}>
                Aylik Abonelik
              </Text>
              <Text style={[styles.planDesc, { color: colors.mutedForeground }]}>
                Sinirsiz AI danismanlik + tum premium ozellikler.
              </Text>
              {[
                "Sinirsiz AI soru",
                "Gorsel & video analizi",
                "Randevu takibi",
                "Asi & grooming programi",
                "Yakin veteriner bul",
                "Online randevu al",
              ].map((f) => (
                <View key={f} style={styles.featureRow}>
                  <Feather name="check" size={14} color={colors.accent} />
                  <Text style={[styles.featureText, { color: colors.foreground }]}>{f}</Text>
                </View>
              ))}
              <TouchableOpacity
                style={[styles.planBtn, { backgroundColor: colors.accent }]}
                onPress={() => handleSelect("monthly")}
                activeOpacity={0.85}
              >
                <Text style={[styles.planBtnText, { color: "#fff" }]}>Abonelik Baslat</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
              Poddle AI bir veteriner danismani gibi hareket eder, teşhis koymaz.
              Ciddi durumlarda mutlaka bir veterinere başvurunuz.
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    maxHeight: "90%",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E2E8F0",
    alignSelf: "center",
    marginBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  subtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  planCard: {
    borderRadius: 18,
    borderWidth: 2,
    padding: 16,
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  planBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  planBadgeText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  planPriceRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  planPrice: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
  },
  planPricePer: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  planName: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  planDesc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginBottom: 12,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  featureText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  planBtn: {
    marginTop: 14,
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  planBtnText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  disclaimer: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginTop: 16,
    lineHeight: 16,
    paddingHorizontal: 8,
  },
});
