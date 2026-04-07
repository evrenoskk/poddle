import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState, useMemo } from "react";
import {
  Alert,
  Linking,
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
import { SharedHeader } from "@/components/SharedHeader";
import { TaskCard } from "@/components/TaskCard";

const VETS = [
  { id: "1", name: "Acıbadem Veteriner Kliniği", address: "Kadıköy, Istanbul", phone: "0216 123 4567", rating: 4.8 },
  { id: "2", name: "Bostancı Hayvan Hastanesi", address: "Bostancı, Istanbul", phone: "0216 987 6543", rating: 4.6 },
  { id: "3", name: "Florya Veteriner Merkezi", address: "Florya, Istanbul", phone: "0212 456 7890", rating: 4.9 },
];

type SubTab = "pending" | "completed" | "appointments";

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  return { daysInMonth, offset };
}

function formatDateKey(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

const MONTH_NAMES = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];
const DAY_NAMES = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

function RescheduleModal({
  visible,
  task,
  onClose,
  onSave,
  colors,
}: {
  visible: boolean;
  task: Task | null;
  onClose: () => void;
  onSave: (task: Task, newDate: string) => void;
  colors: ReturnType<typeof useColors>;
}) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const { daysInMonth, offset } = getMonthDays(viewYear, viewMonth);
  const todayKey = formatDateKey(now.getFullYear(), now.getMonth(), now.getDate());

  React.useEffect(() => {
    if (visible) {
      setSelectedDay(null);
      const n = new Date();
      setViewYear(n.getFullYear());
      setViewMonth(n.getMonth());
    }
  }, [visible]);

  const handleSave = () => {
    if (!task || selectedDay === null) return;
    const newDate = formatDateKey(viewYear, viewMonth, selectedDay);
    onSave(task, newDate);
    setSelectedDay(null);
    onClose();
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={reschedStyles.overlay}>
        <View style={[reschedStyles.sheet, { backgroundColor: colors.background }]}>
          <View style={reschedStyles.handle} />
          <View style={reschedStyles.headerRow}>
            <Text style={[reschedStyles.title, { color: colors.foreground }]}>Tarih Değiştir</Text>
            <TouchableOpacity onPress={onClose} style={[reschedStyles.closeBtn, { backgroundColor: colors.muted }]}>
              <Feather name="x" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          {task && (
            <View style={[reschedStyles.taskPreview, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[reschedStyles.taskTitle, { color: colors.foreground }]}>{task.title}</Text>
              <Text style={[reschedStyles.taskDesc, { color: colors.mutedForeground }]}>{task.description}</Text>
            </View>
          )}

          <View style={[reschedStyles.calBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={reschedStyles.calNav}>
              <TouchableOpacity onPress={prevMonth}><Feather name="chevron-left" size={20} color={colors.foreground} /></TouchableOpacity>
              <Text style={[reschedStyles.calMonth, { color: colors.foreground }]}>{MONTH_NAMES[viewMonth]} {viewYear}</Text>
              <TouchableOpacity onPress={nextMonth}><Feather name="chevron-right" size={20} color={colors.foreground} /></TouchableOpacity>
            </View>
            <View style={reschedStyles.dayNamesRow}>
              {DAY_NAMES.map((d) => (
                <Text key={d} style={[reschedStyles.dayName, { color: colors.mutedForeground }]}>{d}</Text>
              ))}
            </View>
            <View style={reschedStyles.daysGrid}>
              {Array.from({ length: offset }).map((_, i) => <View key={`e-${i}`} style={reschedStyles.dayCell} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const key = formatDateKey(viewYear, viewMonth, day);
                const isToday = key === todayKey;
                const isSelected = selectedDay === day;
                return (
                  <TouchableOpacity
                    key={day}
                    style={[
                      reschedStyles.dayCell,
                      isSelected && { backgroundColor: colors.primary, borderRadius: 10 },
                      isToday && !isSelected && { backgroundColor: colors.primaryLight, borderRadius: 10 },
                    ]}
                    onPress={() => setSelectedDay(day)}
                  >
                    <Text style={[reschedStyles.dayText, { color: isSelected ? "#fff" : isToday ? colors.primary : colors.foreground }]}>
                      {day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <TouchableOpacity
            style={[reschedStyles.saveBtn, { backgroundColor: selectedDay ? colors.primary : colors.muted }]}
            onPress={handleSave}
            disabled={!selectedDay}
          >
            <Feather name="calendar" size={16} color={selectedDay ? "#fff" : colors.mutedForeground} />
            <Text style={[reschedStyles.saveBtnText, { color: selectedDay ? "#fff" : colors.mutedForeground }]}>
              {selectedDay
                ? `${selectedDay} ${MONTH_NAMES[viewMonth]} tarihine taşı`
                : "Bir tarih seç"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function CalendarScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { tasks, updateTask, deleteTask, pets, activePetId } = useApp();
  const [subTab, setSubTab] = useState<SubTab>("pending");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [rescheduleTask, setRescheduleTask] = useState<Task | null>(null);

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const bottomInset = Platform.OS === "web" ? 84 : 66;
  const activePet = pets.find((p) => p.id === activePetId) ?? pets[0];
  const petTasks = tasks.filter((t) => t.petId === String(activePet?.id ?? ""));

  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    petTasks.forEach((t) => {
      if (!t.dueDate) return;
      const key = t.dueDate.slice(0, 10);
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    return map;
  }, [petTasks]);

  const { daysInMonth, offset } = getMonthDays(viewYear, viewMonth);
  const todayKey = formatDateKey(now.getFullYear(), now.getMonth(), now.getDate());

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };
  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const selectedTasks = selectedDate ? (tasksByDate[selectedDate] || []) : [];
  const pendingTasks = petTasks.filter((t) => !t.completed);
  const completedTasks = petTasks.filter((t) => t.completed);

  const handleReschedule = (task: Task, newDate: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    updateTask({ ...task, dueDate: newDate });
  };

  const handleToggleComplete = (task: Task) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    updateTask({ ...task, completed: !task.completed, completedAt: !task.completed ? new Date().toISOString() : undefined });
  };

  const confirmDelete = (id: string, title: string) => {
    if (Platform.OS === "web") {
      if (confirm(`"${title}" görevini kalıcı olarak silmek istediğine emin misin?`)) {
        deleteTask(id);
      }
    } else {
      Alert.alert("Görevi Sil", `"${title}" görevini kalıcı olarak silmek istediğine emin misin?`, [
        { text: "İptal", style: "cancel" },
        { text: "Sil", style: "destructive", onPress: () => deleteTask(id) },
      ]);
    }
  };

  const findNearbyVets = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Konum izni gerekli", "Yakın veterinerleri bulmak için konum izni verin.");
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = loc.coords;
      const query = encodeURIComponent("veteriner kliniği");
      const mapsUrl = Platform.OS === "ios"
        ? `maps://maps.apple.com/?q=${query}&ll=${latitude},${longitude}&z=14`
        : `geo:${latitude},${longitude}?q=${query}`;
      const fallbackUrl = `https://www.google.com/maps/search/${query}/@${latitude},${longitude},14z`;
      const canOpen = await Linking.canOpenURL(mapsUrl);
      await Linking.openURL(canOpen ? mapsUrl : fallbackUrl);
    } catch {
      Alert.alert("Hata", "Konum alınamadı.");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SharedHeader
        title="Takvim"
        subtitle={activePet ? `${activePet.name} — ${pendingTasks.length} bekleyen görev` : undefined}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomInset + 20 }}
      >
        {activePet ? (
          <>
            <View style={[styles.calendarBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.calendarNav}>
                <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
                  <Feather name="chevron-left" size={20} color={colors.foreground} />
                </TouchableOpacity>
                <Text style={[styles.monthTitle, { color: colors.foreground }]}>
                  {MONTH_NAMES[viewMonth]} {viewYear}
                </Text>
                <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
                  <Feather name="chevron-right" size={20} color={colors.foreground} />
                </TouchableOpacity>
              </View>

              <View style={styles.dayNamesRow}>
                {DAY_NAMES.map((d) => (
                  <Text key={d} style={[styles.dayName, { color: colors.mutedForeground }]}>{d}</Text>
                ))}
              </View>

              <View style={styles.daysGrid}>
                {Array.from({ length: offset }).map((_, i) => (
                  <View key={`empty-${i}`} style={styles.dayCell} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const key = formatDateKey(viewYear, viewMonth, day);
                  const isToday = key === todayKey;
                  const hasTasks = !!tasksByDate[key]?.length;
                  const isSelected = key === selectedDate;
                  const hasUnfinished = tasksByDate[key]?.some((t) => !t.completed);
                  return (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.dayCell,
                        isSelected && { backgroundColor: colors.primary, borderRadius: 10 },
                        isToday && !isSelected && { backgroundColor: colors.primaryLight, borderRadius: 10 },
                      ]}
                      onPress={() => setSelectedDate(isSelected ? null : key)}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          { color: isSelected ? "#fff" : isToday ? colors.primary : colors.foreground },
                        ]}
                      >
                        {day}
                      </Text>
                      {hasTasks && (
                        <View
                          style={[
                            styles.dayDot,
                            { backgroundColor: isSelected ? "#fff" : hasUnfinished ? "#F59E0B" : "#10B981" },
                          ]}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {selectedDate && (
              <View style={styles.selectedSection}>
                <Text style={[styles.selectedTitle, { color: colors.foreground }]}>
                  {new Date(selectedDate + "T00:00:00").toLocaleDateString("tr-TR", {
                    day: "numeric",
                    month: "long",
                    weekday: "long",
                  })}
                </Text>
                {selectedTasks.length === 0 ? (
                  <View style={[styles.emptyDay, { borderColor: colors.border }]}>
                    <Feather name="check-circle" size={24} color={colors.mutedForeground} />
                    <Text style={[styles.emptyDayText, { color: colors.mutedForeground }]}>Bu tarihte görev yok</Text>
                  </View>
                ) : (
                  selectedTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onToggle={handleToggleComplete}
                      onDelete={(id) => confirmDelete(id, task.title)}
                      onReschedule={() => setRescheduleTask(task)}
                    />
                  ))
                )}
              </View>
            )}

            <View style={[styles.subTabRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {([
                { key: "pending" as SubTab, label: "Bekleyen", icon: "clock", count: pendingTasks.length },
                { key: "completed" as SubTab, label: "Tamamlanan", icon: "check-circle", count: completedTasks.length },
                { key: "appointments" as SubTab, label: "Randevular", icon: "map-pin" },
              ]).map((tab) => (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.subTabItem, subTab === tab.key && { backgroundColor: colors.primary, borderRadius: 10 }]}
                  onPress={() => setSubTab(tab.key)}
                >
                  <Feather name={tab.icon as any} size={13} color={subTab === tab.key ? "#fff" : colors.mutedForeground} />
                  <Text style={[styles.subTabText, { color: subTab === tab.key ? "#fff" : colors.mutedForeground }]}>
                    {tab.label}
                  </Text>
                  {tab.count !== undefined && tab.count > 0 && (
                    <View style={[styles.tabBadge, { backgroundColor: subTab === tab.key ? "rgba(255,255,255,0.3)" : colors.primary + "20" }]}>
                      <Text style={[styles.tabBadgeText, { color: subTab === tab.key ? "#fff" : colors.primary }]}>{tab.count}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.listSection}>
              {subTab === "pending" && (
                <>
                  {pendingTasks.length === 0 && (
                    <View style={[styles.emptyBox, { borderColor: colors.border }]}>
                      <View style={[styles.emptyIconCircle, { backgroundColor: colors.primaryLight }]}>
                        <Feather name="check-circle" size={28} color={colors.primary} />
                      </View>
                      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Tüm görevler tamamlandı!</Text>
                      <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                        AI sohbetten yeni görev oluşturabilirsin.
                      </Text>
                    </View>
                  )}
                  {pendingTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onToggle={handleToggleComplete}
                      onDelete={(id) => confirmDelete(id, task.title)}
                      onReschedule={() => setRescheduleTask(task)}
                    />
                  ))}
                </>
              )}

              {subTab === "completed" && (
                <>
                  {completedTasks.length === 0 && (
                    <View style={[styles.emptyBox, { borderColor: colors.border }]}>
                      <View style={[styles.emptyIconCircle, { backgroundColor: "#D1FAE520" }]}>
                        <Feather name="inbox" size={28} color={colors.mutedForeground} />
                      </View>
                      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Tamamlanan görev yok</Text>
                      <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                        Görevleri tamamladıkça burada görünecek.
                      </Text>
                    </View>
                  )}
                  {completedTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onToggle={handleToggleComplete}
                      onDelete={(id) => confirmDelete(id, task.title)}
                      onReschedule={() => setRescheduleTask(task)}
                      showDeleteButton
                    />
                  ))}
                </>
              )}

              {subTab === "appointments" && (
                <>
                  <TouchableOpacity
                    style={[styles.findVetBtn, { backgroundColor: colors.primary }]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      findNearbyVets();
                    }}
                  >
                    <Feather name="navigation" size={16} color="#fff" />
                    <Text style={styles.findVetBtnText}>Yakınımdaki Veterinerleri Bul</Text>
                  </TouchableOpacity>

                  <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Önerilen Klinikler</Text>
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
              Takvim için önce bir evcil hayvan ekleyin.
            </Text>
          </View>
        )}
      </ScrollView>

      <RescheduleModal
        visible={!!rescheduleTask}
        task={rescheduleTask}
        onClose={() => setRescheduleTask(null)}
        onSave={handleReschedule}
        colors={colors}
      />
    </View>
  );
}

const reschedStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 10, paddingBottom: 30,
    maxHeight: "85%",
  },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: "#D1D5DB", alignSelf: "center", marginBottom: 14 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  title: { fontSize: 18, fontFamily: "Inter_700Bold" },
  closeBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: "center", alignItems: "center" },
  taskPreview: { padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 16 },
  taskTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 3 },
  taskDesc: { fontSize: 12, fontFamily: "Inter_400Regular" },
  calBox: { borderRadius: 16, borderWidth: 1, padding: 12, marginBottom: 16 },
  calNav: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  calMonth: { fontSize: 15, fontFamily: "Inter_700Bold" },
  dayNamesRow: { flexDirection: "row", marginBottom: 4 },
  dayName: { flex: 1, textAlign: "center", fontSize: 11, fontFamily: "Inter_600SemiBold" },
  daysGrid: { flexDirection: "row", flexWrap: "wrap" },
  dayCell: { width: "14.28%", alignItems: "center", paddingVertical: 6 },
  dayText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  saveBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    paddingVertical: 14, borderRadius: 14,
  },
  saveBtnText: { fontSize: 15, fontFamily: "Inter_700Bold" },
});

const styles = StyleSheet.create({
  container: { flex: 1 },

  calendarBox: {
    margin: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  calendarNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  monthTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  dayNamesRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  dayName: {
    flex: 1,
    textAlign: "center",
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: "14.28%",
    alignItems: "center",
    paddingVertical: 6,
    gap: 2,
  },
  dayText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  dayDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },

  selectedSection: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  selectedTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 10,
  },
  emptyDay: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 20,
    alignItems: "center",
    gap: 8,
    borderStyle: "dashed",
  },
  emptyDayText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },

  subTabRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    marginBottom: 16,
  },
  subTabItem: {
    flex: 1,
    paddingVertical: 9,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 5,
  },
  subTabText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  tabBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  tabBadgeText: { fontSize: 10, fontFamily: "Inter_700Bold" },

  listSection: {
    paddingHorizontal: 16,
  },

  emptyBox: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 28,
    alignItems: "center",
    gap: 10,
    borderStyle: "dashed",
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  emptyText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },

  findVetBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 16,
  },
  findVetBtnText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },

  sectionLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 10,
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
  vetInfo: { flex: 1, gap: 3 },
  vetName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  vetAddr: { fontSize: 12, fontFamily: "Inter_400Regular" },
  vetRatingRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  vetRating: { fontSize: 12, fontFamily: "Inter_500Medium" },
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
});
