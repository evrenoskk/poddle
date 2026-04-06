import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useApp, Task } from "@/context/AppContext";
import { TaskCard } from "@/components/TaskCard";
import { HealthScoreRing } from "@/components/HealthScoreRing";

type TaskType = Task["type"];

const TASK_TYPES: { type: TaskType; label: string; color: string }[] = [
  { type: "vaccination", label: "Aşı", color: "#2563EB" },
  { type: "grooming", label: "Grooming", color: "#10B981" },
  { type: "checkup", label: "Kontrol", color: "#EC4899" },
  { type: "medication", label: "İlaç", color: "#F59E0B" },
  { type: "other", label: "Diğer", color: "#6366F1" },
];

function AddTaskModal({ visible, onClose, petId }: { visible: boolean; onClose: () => void; petId: string }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addTask } = useApp();
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [taskType, setTaskType] = useState<TaskType>("vaccination");
  const [dueDate, setDueDate] = useState("");

  const handleAdd = () => {
    if (!title.trim()) {
      Alert.alert("Hata", "Görev başlığı gereklidir.");
      return;
    }
    const due = dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    addTask({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      petId,
      type: taskType,
      title: title.trim(),
      description: desc.trim(),
      dueDate: new Date(due).toISOString(),
      completed: false,
      reminderSet: false,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTitle("");
    setDesc("");
    setDueDate("");
    setTaskType("vaccination");
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalSheet, { backgroundColor: colors.card, paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 16 }]}>
          <View style={styles.handle} />
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Görev Ekle</Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={22} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>Tür</Text>
          <View style={styles.typeRow}>
            {TASK_TYPES.map((t) => (
              <TouchableOpacity
                key={t.type}
                onPress={() => setTaskType(t.type)}
                style={[
                  styles.typeChip,
                  { borderColor: t.color, backgroundColor: taskType === t.type ? t.color : "transparent" },
                ]}
              >
                <Text style={[styles.typeChipText, { color: taskType === t.type ? "#fff" : t.color }]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>Başlık *</Text>
          <TextInput
            style={[styles.textInput, { borderColor: colors.border, backgroundColor: colors.background, color: colors.foreground }]}
            placeholder="Örn: Kuduz aşısı"
            placeholderTextColor={colors.mutedForeground}
            value={title}
            onChangeText={setTitle}
          />

          <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>Açıklama</Text>
          <TextInput
            style={[styles.textInput, { borderColor: colors.border, backgroundColor: colors.background, color: colors.foreground }]}
            placeholder="Notlar..."
            placeholderTextColor={colors.mutedForeground}
            value={desc}
            onChangeText={setDesc}
          />

          <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>Tarih (YYYY-MM-DD)</Text>
          <TextInput
            style={[styles.textInput, { borderColor: colors.border, backgroundColor: colors.background, color: colors.foreground }]}
            placeholder="2025-12-31"
            placeholderTextColor={colors.mutedForeground}
            value={dueDate}
            onChangeText={setDueDate}
          />

          <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={handleAdd} activeOpacity={0.85}>
            <Text style={styles.addBtnText}>Görevi Ekle</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const VETS = [
  { id: "1", name: "Acıbadem Veteriner Kliniği", address: "Kadıköy, Istanbul", phone: "0216 123 4567", rating: 4.8 },
  { id: "2", name: "Bostancı Hayvan Hastanesi", address: "Bostancı, Istanbul", phone: "0216 987 6543", rating: 4.6 },
  { id: "3", name: "Florya Veteriner Merkezi", address: "Florya, Istanbul", phone: "0212 456 7890", rating: 4.9 },
];

export default function HealthScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { tasks, updateTask, deleteTask, pets, activePetId } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"tasks" | "vets">("tasks");

  const topInset = insets.top + (Platform.OS === "web" ? 67 : 0);
  const bottomInset = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  const activePet = pets.find((p) => p.id === activePetId) ?? pets[0];
  const petTasks = tasks.filter((t) => t.petId === String(activePet?.id ?? ""));
  const pendingTasks = petTasks.filter((t) => !t.completed);
  const completedTasks = petTasks.filter((t) => t.completed);

  const healthScore = activePet
    ? Math.max(40, 100 - pendingTasks.length * 8)
    : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.primary, "#1d4ed8"]}
        style={[styles.header, { paddingTop: topInset + 12 }]}
      >
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Sağlık Takibi</Text>
          {activePet && (
            <TouchableOpacity
              style={[styles.addTaskBtn, { backgroundColor: "rgba(255,255,255,0.2)" }]}
              onPress={() => setShowAddModal(true)}
            >
              <Feather name="plus" size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomInset + 80 }}
      >
        {activePet ? (
          <>
            <View style={styles.scoreSection}>
              <HealthScoreRing score={healthScore} size={180} />
              <Text style={[styles.scorePetName, { color: colors.foreground }]}>
                {activePet.name}'nin Sağlık Durumu
              </Text>
            </View>

            {/* Observations */}
            <View style={styles.sectionPadded}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Temel Gözlemler</Text>
              {[
                { icon: "eye", label: "Gözler", desc: "Aktif ve parlak gözükuyor.", color: "#2563EB", bg: "#DBEAFE" },
                { icon: "wind", label: "Aktivite", desc: "Enerji seviyesi normal.", color: "#10B981", bg: "#D1FAE5" },
                { icon: "shield", label: "Aşı Durumu", desc: `${completedTasks.filter(t => t.type === "vaccination").length} aşı tamamlandı`, color: "#F59E0B", bg: "#FEF3C7" },
              ].map((obs) => (
                <View key={obs.label} style={[styles.obsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.obsIcon, { backgroundColor: obs.bg }]}>
                    <Feather name={obs.icon as any} size={20} color={obs.color} />
                  </View>
                  <View>
                    <Text style={[styles.obsLabel, { color: colors.foreground }]}>{obs.label}</Text>
                    <Text style={[styles.obsDesc, { color: colors.mutedForeground }]}>{obs.desc}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Tabs */}
            <View style={[styles.tabRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {(["tasks", "vets"] as const).map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tabItem, activeTab === tab && { backgroundColor: colors.primary, borderRadius: 10 }]}
                  onPress={() => setActiveTab(tab)}
                >
                  <Text style={[styles.tabText, { color: activeTab === tab ? "#fff" : colors.mutedForeground }]}>
                    {tab === "tasks" ? "Görevler" : "Veterinerler"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.sectionPadded}>
              {activeTab === "tasks" ? (
                <>
                  {pendingTasks.length === 0 && completedTasks.length === 0 && (
                    <View style={[styles.emptyBox, { borderColor: colors.border }]}>
                      <Feather name="check-circle" size={32} color={colors.mutedForeground} />
                      <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Görev yok. Ekle butonu ile başlayın.</Text>
                    </View>
                  )}
                  {pendingTasks.map((task) => (
                    <TaskCard key={task.id} task={task} onToggle={(t) => updateTask({ ...t, completed: true })} onDelete={deleteTask} />
                  ))}
                  {completedTasks.length > 0 && (
                    <>
                      <Text style={[styles.completedTitle, { color: colors.mutedForeground }]}>Tamamlananlar</Text>
                      {completedTasks.map((task) => (
                        <TaskCard key={task.id} task={task} onToggle={(t) => updateTask({ ...t, completed: false })} onDelete={deleteTask} />
                      ))}
                    </>
                  )}
                </>
              ) : (
                <>
                  <Text style={[styles.vetTitle, { color: colors.mutedForeground }]}>Yakın Veterinerler</Text>
                  {VETS.map((vet) => (
                    <View key={vet.id} style={[styles.vetCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <View style={[styles.vetIcon, { backgroundColor: colors.primaryLight }]}>
                        <MaterialCommunityIcons name="hospital-building" size={24} color={colors.primary} />
                      </View>
                      <View style={styles.vetInfo}>
                        <Text style={[styles.vetName, { color: colors.foreground }]}>{vet.name}</Text>
                        <Text style={[styles.vetAddr, { color: colors.mutedForeground }]}>{vet.address}</Text>
                        <View style={styles.vetRatingRow}>
                          <Feather name="star" size={12} color="#F59E0B" />
                          <Text style={[styles.vetRating, { color: colors.mutedForeground }]}>{vet.rating}</Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={[styles.appointBtn, { backgroundColor: colors.primary }]}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                          Alert.alert("Randevu", `${vet.name} ile randevu talebi gönderildi.`);
                        }}
                      >
                        <Text style={styles.appointBtnText}>Randevu</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </>
              )}
            </View>
          </>
        ) : (
          <View style={styles.noPetBox}>
            <MaterialCommunityIcons name="dog" size={56} color={colors.mutedForeground} />
            <Text style={[styles.noPetText, { color: colors.mutedForeground }]}>
              Sağlık takibi için önce bir evcil hayvan ekleyin.
            </Text>
            <TouchableOpacity
              style={[styles.addPetBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push("/profile")}
            >
              <Text style={styles.addPetBtnText}>Evcil Hayvan Ekle</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {activePet && (
        <AddTaskModal
          visible={showAddModal}
          onClose={() => setShowAddModal(false)}
          petId={String(activePet.id)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  addTaskBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreSection: {
    alignItems: "center",
    paddingVertical: 28,
    gap: 12,
  },
  scorePetName: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    marginTop: 12,
  },
  sectionPadded: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    marginBottom: 12,
  },
  obsCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  obsIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  obsLabel: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  obsDesc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  tabRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    marginBottom: 16,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
  },
  tabText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  emptyBox: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 24,
    alignItems: "center",
    gap: 10,
    borderStyle: "dashed",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  completedTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    marginTop: 12,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  vetTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  vetCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    gap: 12,
  },
  vetIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  vetInfo: {
    flex: 1,
    gap: 3,
  },
  vetName: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  vetAddr: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  vetRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  vetRating: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  appointBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  appointBtnText: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  noPetBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 16,
    paddingHorizontal: 32,
  },
  noPetText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  addPetBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
  },
  addPetBtnText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E2E8F0",
    alignSelf: "center",
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  inputLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginBottom: 6,
    marginTop: 12,
  },
  typeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  typeChipText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  addBtn: {
    marginTop: 20,
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  addBtnText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
});
