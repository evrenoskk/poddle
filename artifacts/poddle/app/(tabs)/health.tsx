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
import { useApp, Task, HealthLog } from "@/context/AppContext";
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

type LogType = {
  type: string;
  label: string;
  icon: string;
  color: string;
  bg: string;
  placeholder: string;
  unit: string;
};

const LOG_TYPES: LogType[] = [
  { type: "weight", label: "Kilo", icon: "trending-up", color: "#2563EB", bg: "#DBEAFE", placeholder: "Örn: 12.5", unit: "kg" },
  { type: "temperature", label: "Ateş", icon: "thermometer", color: "#EF4444", bg: "#FEE2E2", placeholder: "Örn: 38.5", unit: "°C" },
  { type: "symptom", label: "Belirti", icon: "alert-circle", color: "#F59E0B", bg: "#FEF3C7", placeholder: "Örn: öksürük, iştahsızlık...", unit: "" },
  { type: "medication", label: "İlaç", icon: "package", color: "#7C3AED", bg: "#EDE9FE", placeholder: "Örn: Amoksisilin 250mg", unit: "" },
  { type: "feeding", label: "Beslenme", icon: "coffee", color: "#10B981", bg: "#D1FAE5", placeholder: "Örn: 200g kuru mama", unit: "" },
  { type: "note", label: "Not", icon: "file-text", color: "#6366F1", bg: "#E0E7FF", placeholder: "Genel not veya gözlem...", unit: "" },
];

function getLogMeta(logType: string): LogType {
  return LOG_TYPES.find((l) => l.type === logType) ?? LOG_TYPES[5];
}

function formatLogDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Az önce";
  if (diffMins < 60) return `${diffMins} dk önce`;
  if (diffHours < 24) return `${diffHours} saat önce`;
  if (diffDays === 1) return "Dün";
  if (diffDays < 7) return `${diffDays} gün önce`;
  return date.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

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
    setTitle(""); setDesc(""); setDueDate(""); setTaskType("vaccination");
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalSheet, { backgroundColor: colors.card, paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 16 }]}>
          <View style={styles.handle} />
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Görev Ekle</Text>
            <TouchableOpacity onPress={onClose}><Feather name="x" size={22} color={colors.mutedForeground} /></TouchableOpacity>
          </View>
          <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>Tür</Text>
          <View style={styles.typeRow}>
            {TASK_TYPES.map((t) => (
              <TouchableOpacity
                key={t.type}
                onPress={() => setTaskType(t.type)}
                style={[styles.typeChip, { borderColor: t.color, backgroundColor: taskType === t.type ? t.color : "transparent" }]}
              >
                <Text style={[styles.typeChipText, { color: taskType === t.type ? "#fff" : t.color }]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>Başlık *</Text>
          <TextInput style={[styles.textInput, { borderColor: colors.border, backgroundColor: colors.background, color: colors.foreground }]} placeholder="Örn: Kuduz aşısı" placeholderTextColor={colors.mutedForeground} value={title} onChangeText={setTitle} />
          <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>Açıklama</Text>
          <TextInput style={[styles.textInput, { borderColor: colors.border, backgroundColor: colors.background, color: colors.foreground }]} placeholder="Notlar..." placeholderTextColor={colors.mutedForeground} value={desc} onChangeText={setDesc} />
          <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>Tarih (YYYY-MM-DD)</Text>
          <TextInput style={[styles.textInput, { borderColor: colors.border, backgroundColor: colors.background, color: colors.foreground }]} placeholder="2025-12-31" placeholderTextColor={colors.mutedForeground} value={dueDate} onChangeText={setDueDate} />
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={handleAdd} activeOpacity={0.85}>
            <Text style={styles.addBtnText}>Görevi Ekle</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function AddLogModal({
  visible,
  onClose,
  petId,
  onSuccess,
}: {
  visible: boolean;
  onClose: () => void;
  petId: number;
  onSuccess: () => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addHealthLog } = useApp();
  const [logType, setLogType] = useState("symptom");
  const [value, setValue] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const meta = getLogMeta(logType);

  const handleSave = async () => {
    if (!value.trim()) {
      Alert.alert("Hata", "Lütfen bir değer girin.");
      return;
    }
    setSaving(true);
    try {
      await addHealthLog(petId, logType, value.trim() + (meta.unit ? " " + meta.unit : ""), notes.trim());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setValue(""); setNotes(""); setLogType("symptom");
      onSuccess();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalSheet, { backgroundColor: colors.card, paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 16 }]}>
          <View style={styles.handle} />
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Sağlık Kaydı Ekle</Text>
            <TouchableOpacity onPress={onClose}><Feather name="x" size={22} color={colors.mutedForeground} /></TouchableOpacity>
          </View>

          <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>Kayıt Türü</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
            <View style={{ flexDirection: "row", gap: 8, paddingBottom: 4 }}>
              {LOG_TYPES.map((lt) => (
                <TouchableOpacity
                  key={lt.type}
                  onPress={() => { setLogType(lt.type); setValue(""); }}
                  style={[
                    styles.logTypeChip,
                    {
                      backgroundColor: logType === lt.type ? lt.color : lt.bg,
                      borderColor: lt.color,
                    },
                  ]}
                >
                  <Feather name={lt.icon as any} size={14} color={logType === lt.type ? "#fff" : lt.color} />
                  <Text style={[styles.logTypeChipText, { color: logType === lt.type ? "#fff" : lt.color }]}>{lt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>
            {meta.label} {meta.unit ? `(${meta.unit})` : ""}
          </Text>
          <TextInput
            style={[styles.textInput, { borderColor: colors.border, backgroundColor: colors.background, color: colors.foreground }]}
            placeholder={meta.placeholder}
            placeholderTextColor={colors.mutedForeground}
            value={value}
            onChangeText={setValue}
            keyboardType={["weight", "temperature"].includes(logType) ? "decimal-pad" : "default"}
          />

          <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>Ek Notlar (isteğe bağlı)</Text>
          <TextInput
            style={[styles.textInput, { borderColor: colors.border, backgroundColor: colors.background, color: colors.foreground, minHeight: 60 }]}
            placeholder="Ek bilgi veya gözlem..."
            placeholderTextColor={colors.mutedForeground}
            value={notes}
            onChangeText={setNotes}
            multiline
          />

          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: saving ? colors.mutedForeground : meta.color }]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            <Text style={styles.addBtnText}>{saving ? "Kaydediliyor..." : "Kaydet"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function HealthLogItem({ log, colors, onDelete }: { log: HealthLog; colors: ReturnType<typeof useColors>; onDelete: (id: number) => void }) {
  const meta = getLogMeta(log.logType);
  return (
    <View style={[styles.logItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.logIcon, { backgroundColor: meta.bg }]}>
        <Feather name={meta.icon as any} size={18} color={meta.color} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={[styles.logLabel, { color: meta.color }]}>{meta.label}</Text>
          <Text style={[styles.logTime, { color: colors.mutedForeground }]}>{formatLogDate(log.loggedAt)}</Text>
        </View>
        <Text style={[styles.logValue, { color: colors.foreground }]}>{log.value}</Text>
        {!!log.notes && (
          <Text style={[styles.logNotes, { color: colors.mutedForeground }]}>{log.notes}</Text>
        )}
      </View>
      <TouchableOpacity
        onPress={() => Alert.alert("Sil", "Bu kaydı silmek istiyor musunuz?", [
          { text: "İptal", style: "cancel" },
          { text: "Sil", style: "destructive", onPress: () => onDelete(log.id) },
        ])}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Feather name="trash-2" size={15} color={colors.mutedForeground} />
      </TouchableOpacity>
    </View>
  );
}

const VETS = [
  { id: "1", name: "Acıbadem Veteriner Kliniği", address: "Kadıköy, Istanbul", phone: "0216 123 4567", rating: 4.8 },
  { id: "2", name: "Bostancı Hayvan Hastanesi", address: "Bostancı, Istanbul", phone: "0216 987 6543", rating: 4.6 },
  { id: "3", name: "Florya Veteriner Merkezi", address: "Florya, Istanbul", phone: "0212 456 7890", rating: 4.9 },
];

type ActiveTab = "logs" | "tasks" | "vets";

export default function HealthScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { tasks, updateTask, deleteTask, pets, activePetId, healthLogs, deleteHealthLog, fetchHealthLogs } = useApp();
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddLog, setShowAddLog] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>("logs");

  const topInset = insets.top + (Platform.OS === "web" ? 67 : 0);
  const bottomInset = Platform.OS === "web" ? 84 : 66;

  const activePet = pets.find((p) => p.id === activePetId) ?? pets[0];
  const petTasks = tasks.filter((t) => t.petId === String(activePet?.id ?? ""));
  const pendingTasks = petTasks.filter((t) => !t.completed);
  const completedTasks = petTasks.filter((t) => t.completed);

  const recentLogs = healthLogs.slice(0, 30);

  const activityScore = activePet
    ? Math.min(
        100,
        10 +
          Math.min(recentLogs.length, 10) * 3 +
          pendingTasks.length * 2 +
          completedTasks.length * 12 +
          (recentLogs.length > 0 && recentLogs[0]?.loggedAt
            ? (Date.now() - new Date(recentLogs[0].loggedAt).getTime() < 86400000 * 2 ? 10 : 0)
            : 0)
      )
    : 0;
  const displayScore = activityScore;

  const tabs: { key: ActiveTab; label: string; icon: string }[] = [
    { key: "logs", label: "Günlük", icon: "activity" },
    { key: "tasks", label: "Görevler", icon: "check-square" },
    { key: "vets", label: "Veterinerler", icon: "map-pin" },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.primary, "#1d4ed8"]}
        style={[styles.header, { paddingTop: topInset + 12 }]}
      >
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Sağlık Takibi</Text>
          {activePet && (
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity
                style={[styles.headerBtn, { backgroundColor: "rgba(255,255,255,0.2)" }]}
                onPress={() => setShowAddLog(true)}
              >
                <Feather name="plus" size={18} color="#fff" />
                <Text style={styles.headerBtnText}>Kayıt</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.headerBtn, { backgroundColor: "rgba(255,255,255,0.15)" }]}
                onPress={() => setShowAddTask(true)}
              >
                <Feather name="clock" size={18} color="#fff" />
                <Text style={styles.headerBtnText}>Görev</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomInset + 20 }}
      >
        {activePet ? (
          <>
            <View style={styles.scoreSection}>
              <HealthScoreRing score={recentLogs.length === 0 && completedTasks.length === 0 ? 78 : displayScore} size={160} />
              <Text style={[styles.scorePetName, { color: colors.foreground }]}>
                {activePet.name}'nin Bakım Aktivitesi
              </Text>
              {recentLogs.length > 0 && (
                <View style={[styles.lastLogBadge, { backgroundColor: colors.primaryLight }]}>
                  <Feather name="activity" size={12} color={colors.primary} />
                  <Text style={[styles.lastLogText, { color: colors.primary }]}>
                    Son kayıt: {formatLogDate(recentLogs[0].loggedAt)}
                  </Text>
                </View>
              )}
            </View>

            {/* Quick stats */}
            <View style={[styles.statsRow, { paddingHorizontal: 16, marginBottom: 16 }]}>
              {[
                { label: "Kayıt", value: String(recentLogs.length), icon: "activity", color: "#2563EB", bg: "#DBEAFE" },
                { label: "Görev", value: String(pendingTasks.length), icon: "clock", color: "#F59E0B", bg: "#FEF3C7" },
                { label: "Tamamlanan", value: String(completedTasks.length), icon: "check-circle", color: "#10B981", bg: "#D1FAE5" },
              ].map((stat) => (
                <View key={stat.label} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.statIcon, { backgroundColor: stat.bg }]}>
                    <Feather name={stat.icon as any} size={16} color={stat.color} />
                  </View>
                  <Text style={[styles.statValue, { color: colors.foreground }]}>{stat.value}</Text>
                  <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{stat.label}</Text>
                </View>
              ))}
            </View>

            {/* Tab bar */}
            <View style={[styles.tabRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {tabs.map((tab) => (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.tabItem, activeTab === tab.key && { backgroundColor: colors.primary, borderRadius: 10 }]}
                  onPress={() => setActiveTab(tab.key)}
                >
                  <Feather name={tab.icon as any} size={13} color={activeTab === tab.key ? "#fff" : colors.mutedForeground} />
                  <Text style={[styles.tabText, { color: activeTab === tab.key ? "#fff" : colors.mutedForeground }]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.sectionPadded}>
              {activeTab === "logs" && (
                <>
                  {recentLogs.length === 0 ? (
                    <TouchableOpacity
                      style={[styles.emptyBox, { borderColor: colors.border }]}
                      onPress={() => setShowAddLog(true)}
                    >
                      <Feather name="plus-circle" size={32} color={colors.primary} />
                      <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                        Henüz kayıt yok. İlk sağlık kaydını ekleyin.{"\n"}Kilo, belirti, ilaç, notlar...
                      </Text>
                      <View style={[styles.emptyAddBtn, { backgroundColor: colors.primaryLight }]}>
                        <Text style={[styles.emptyAddBtnText, { color: colors.primary }]}>Kayıt Ekle</Text>
                      </View>
                    </TouchableOpacity>
                  ) : (
                    <>
                      {recentLogs.map((log) => (
                        <HealthLogItem
                          key={log.id}
                          log={log}
                          colors={colors}
                          onDelete={deleteHealthLog}
                        />
                      ))}
                    </>
                  )}
                </>
              )}

              {activeTab === "tasks" && (
                <>
                  {pendingTasks.length === 0 && completedTasks.length === 0 && (
                    <TouchableOpacity
                      style={[styles.emptyBox, { borderColor: colors.border }]}
                      onPress={() => setShowAddTask(true)}
                    >
                      <Feather name="check-circle" size={32} color={colors.mutedForeground} />
                      <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                        Görev yok. Aşı, ilaç ve kontrol randevularını takip edin.
                      </Text>
                    </TouchableOpacity>
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
              )}

              {activeTab === "vets" && (
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
        <>
          <AddTaskModal visible={showAddTask} onClose={() => setShowAddTask(false)} petId={String(activePet.id)} />
          <AddLogModal
            visible={showAddLog}
            onClose={() => setShowAddLog(false)}
            petId={activePet.id}
            onSuccess={() => fetchHealthLogs(activePet.id)}
          />
        </>
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
  headerTitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#fff" },
  headerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  headerBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#fff" },
  scoreSection: { alignItems: "center", paddingVertical: 24, gap: 10 },
  scorePetName: { fontSize: 16, fontFamily: "Inter_600SemiBold", marginTop: 8 },
  lastLogBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  lastLogText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1,
    alignItems: "center",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  statValue: { fontSize: 20, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  sectionPadded: { paddingHorizontal: 16, marginBottom: 8 },
  tabRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    marginBottom: 16,
  },
  tabItem: { flex: 1, paddingVertical: 9, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 5 },
  tabText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  logItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  logIcon: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center", marginTop: 2 },
  logLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  logTime: { fontSize: 11, fontFamily: "Inter_400Regular" },
  logValue: { fontSize: 14.5, fontFamily: "Inter_600SemiBold" },
  logNotes: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2, lineHeight: 18 },
  emptyBox: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 28,
    alignItems: "center",
    gap: 12,
    borderStyle: "dashed",
  },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  emptyAddBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, marginTop: 4 },
  emptyAddBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  completedTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginTop: 12, marginBottom: 8, letterSpacing: 0.5 },
  vetTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 12, letterSpacing: 0.5 },
  vetCard: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 10, gap: 12 },
  vetIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  vetInfo: { flex: 1, gap: 3 },
  vetName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  vetAddr: { fontSize: 12, fontFamily: "Inter_400Regular" },
  vetRatingRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  vetRating: { fontSize: 12, fontFamily: "Inter_500Medium" },
  appointBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  appointBtnText: { fontSize: 12, fontFamily: "Inter_700Bold", color: "#fff" },
  noPetBox: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 16, paddingHorizontal: 32 },
  noPetText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  addPetBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14 },
  addPetBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff" },
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#E2E8F0", alignSelf: "center", marginBottom: 16 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  inputLabel: { fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 6, marginTop: 12 },
  typeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  typeChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5 },
  typeChipText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  logTypeChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5 },
  logTypeChipText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  textInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, fontFamily: "Inter_400Regular" },
  addBtn: { marginTop: 20, padding: 14, borderRadius: 14, alignItems: "center" },
  addBtnText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff" },
});
