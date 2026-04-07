import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Linking } from "react-native";
import React, { useCallback, useRef, useState, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";
import Markdown from "react-native-markdown-display";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useApp, ChatSession, ChatMessage, Task } from "@/context/AppContext";
import { SubscriptionModal } from "@/components/SubscriptionModal";
import { PodleLogo } from "@/components/PodleLogo";
import { fetch } from "expo/fetch";

const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;

type MsgRole = "user" | "assistant";
interface Msg {
  id: string;
  role: MsgRole;
  content: string;
  mediaUri?: string;
  mediaType?: "image" | "video";
  timestamp: string;
}

interface ParsedTask {
  title: string;
  date: string;
  description: string;
  type: Task["type"];
}

interface VetAppointment {
  urgency: "acil" | "bu_hafta" | "rutin";
  reason: string;
}

function parseVetAppointment(raw: string): { clean: string; vet: VetAppointment | null } {
  const vetRegex = /\[VET_RANDEVU:([^:\]]+):([^\]]+)\]/;
  const match = vetRegex.exec(raw);
  if (!match) return { clean: raw, vet: null };
  const vet: VetAppointment = {
    urgency: (match[1].trim() as VetAppointment["urgency"]) || "rutin",
    reason: match[2].trim(),
  };
  const clean = raw.replace(vetRegex, "").trim();
  return { clean, vet };
}

function suggestedDate(urgency: VetAppointment["urgency"]): string {
  const d = new Date();
  if (urgency === "acil") {
    // today
  } else if (urgency === "bu_hafta") {
    d.setDate(d.getDate() + 3);
  } else {
    d.setDate(d.getDate() + 14);
  }
  return d.toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function suggestedDateShort(urgency: VetAppointment["urgency"]): string {
  const d = new Date();
  if (urgency === "acil") {
    // today
  } else if (urgency === "bu_hafta") {
    d.setDate(d.getDate() + 3);
  } else {
    d.setDate(d.getDate() + 14);
  }
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function parseTasksFromContent(raw: string): { clean: string; tasks: ParsedTask[] } {
  const tasks: ParsedTask[] = [];
  const taskRegex = /\[GÖREV:([^:\]]+):([^:\]]+):([^:\]]+):([^\]]+)\]/g;
  let match;
  while ((match = taskRegex.exec(raw)) !== null) {
    tasks.push({
      title: match[1].trim(),
      date: match[2].trim(),
      description: match[3].trim(),
      type: (match[4].trim() as Task["type"]) || "other",
    });
  }
  const clean = raw.replace(taskRegex, "").trim();
  return { clean, tasks };
}

function parseAllMarkers(raw: string): { clean: string; tasks: ParsedTask[]; vet: VetAppointment | null } {
  const { clean: afterVet, vet } = parseVetAppointment(raw);
  const { clean, tasks } = parseTasksFromContent(afterVet);
  return { clean, tasks, vet };
}

function VetAppointmentCard({
  vet,
  colors,
  onSaveTask,
}: {
  vet: VetAppointment;
  colors: ReturnType<typeof useColors>;
  onSaveTask?: (task: ParsedTask) => void;
}) {
  const [step, setStep] = useState<"idle" | "locating" | "done">("idle");
  const [locationError, setLocationError] = useState(false);
  const [saved, setSaved] = useState(false);

  const urgencyConfig = {
    acil: { label: "Acil — Bugün", icon: "alert-circle" as const, color: "#EF4444", bg: "#FEF2F2", border: "#FCA5A5" },
    bu_hafta: { label: "Bu Hafta İçinde", icon: "clock" as const, color: "#F59E0B", bg: "#FFFBEB", border: "#FCD34D" },
    rutin: { label: "Rutin Kontrol", icon: "calendar" as const, color: "#10B981", bg: "#F0FDF4", border: "#6EE7B7" },
  };
  const cfg = urgencyConfig[vet.urgency];
  const dateStr = suggestedDate(vet.urgency);
  const dateShort = suggestedDateShort(vet.urgency);

  const findNearbyVets = async () => {
    setStep("locating");
    setLocationError(false);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationError(true);
        setStep("idle");
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
      setStep("done");
    } catch {
      setLocationError(true);
      setStep("idle");
    }
  };

  const handleSaveTask = () => {
    if (saved || !onSaveTask) return;
    onSaveTask({
      title: `Veteriner Randevusu`,
      date: dateShort,
      description: vet.reason,
      type: "checkup",
    });
    setSaved(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <View style={[vetStyles.card, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
      {/* Header with urgency + date */}
      <View style={vetStyles.header}>
        <View style={[vetStyles.urgencyBadge, { backgroundColor: cfg.color + "18", borderColor: cfg.color + "40" }]}>
          <Feather name={cfg.icon} size={13} color={cfg.color} />
          <Text style={[vetStyles.urgencyText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </View>

      {/* Reason */}
      <Text style={[vetStyles.reason, { color: "#374151" }]}>{vet.reason}</Text>

      {/* Info rows */}
      <View style={vetStyles.infoSection}>
        <View style={vetStyles.infoRow}>
          <Feather name="calendar" size={14} color="#6B7280" />
          <Text style={vetStyles.infoLabel}>Önerilen Tarih:</Text>
          <Text style={vetStyles.infoValue}>{dateStr}</Text>
        </View>
        <View style={vetStyles.infoRow}>
          <Feather name="map-pin" size={14} color="#6B7280" />
          <Text style={vetStyles.infoLabel}>Konum:</Text>
          <Text style={vetStyles.infoValue}>En yakın veteriner kliniği</Text>
        </View>
        <View style={vetStyles.infoRow}>
          <Feather name="file-text" size={14} color="#6B7280" />
          <Text style={vetStyles.infoLabel}>İşlem:</Text>
          <Text style={[vetStyles.infoValue, { flex: 1 }]} numberOfLines={2}>{vet.reason}</Text>
        </View>
      </View>

      {locationError && (
        <Text style={vetStyles.errorText}>Konum erişimi reddedildi. Aşağıdan haritadan arayabilirsin.</Text>
      )}

      {/* Buttons */}
      <View style={vetStyles.btns}>
        <TouchableOpacity
          style={[vetStyles.primaryBtn, { backgroundColor: colors.primary }]}
          onPress={findNearbyVets}
          disabled={step === "locating"}
        >
          {step === "locating" ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Feather name="map-pin" size={15} color="#fff" />
              <Text style={vetStyles.primaryBtnText}>
                {step === "done" ? "Haritayı Aç" : "Yakın Klinikleri Bul"}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            vetStyles.secondaryBtn,
            {
              borderColor: saved ? "#10B981" + "60" : cfg.color + "40",
              backgroundColor: saved ? "#10B981" + "10" : "transparent",
            },
          ]}
          onPress={handleSaveTask}
          disabled={saved}
        >
          <Feather name={saved ? "check" : "bookmark"} size={14} color={saved ? "#10B981" : cfg.color} />
          <Text style={[vetStyles.secondaryBtnText, { color: saved ? "#10B981" : cfg.color }]}>
            {saved ? "Görev Kaydedildi" : "Görev Olarak Kaydet"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const vetStyles = StyleSheet.create({
  card: {
    marginTop: 10,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    gap: 10,
  },
  header: { flexDirection: "row", alignItems: "center" },
  urgencyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  urgencyText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  reason: { fontSize: 13, fontFamily: "Inter_500Medium", lineHeight: 19 },
  infoSection: { gap: 6, paddingVertical: 4 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  infoLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#6B7280" },
  infoValue: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#374151" },
  errorText: { fontSize: 11, color: "#EF4444", fontFamily: "Inter_400Regular" },
  btns: { flexDirection: "row", gap: 8 },
  primaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  primaryBtnText: { color: "#fff", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  secondaryBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
});

function typeIcon(type: Task["type"]): string {
  switch (type) {
    case "vaccination": return "shield";
    case "grooming": return "scissors";
    case "checkup": return "activity";
    case "medication": return "plus-circle";
    default: return "calendar";
  }
}

function typeColor(type: Task["type"]): string {
  switch (type) {
    case "vaccination": return "#10B981";
    case "grooming": return "#8B5CF6";
    case "checkup": return "#3B82F6";
    case "medication": return "#F59E0B";
    default: return "#6B7280";
  }
}

function typeLabel(type: Task["type"]): string {
  switch (type) {
    case "vaccination": return "Aşı";
    case "grooming": return "Bakım";
    case "checkup": return "Kontrol";
    case "medication": return "İlaç";
    default: return "Diğer";
  }
}

function sessionIcon(icon: string | null | undefined): string {
  return icon || "message-circle";
}

function formatSessionDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return "Bugün";
  if (diff === 1) return "Dün";
  if (diff < 7) return `${diff} gün önce`;
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

function TypingIndicator({ colors }: { colors: ReturnType<typeof useColors> }) {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(600 - delay),
        ])
      ).start();

    animate(dot1, 0);
    animate(dot2, 200);
    animate(dot3, 400);
  }, []);

  const dotStyle = (anim: Animated.Value) => ({
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.primary,
    opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }],
  });

  return (
    <View style={{ flexDirection: "row", gap: 4, padding: 4 }}>
      <Animated.View style={dotStyle(dot1)} />
      <Animated.View style={dotStyle(dot2)} />
      <Animated.View style={dotStyle(dot3)} />
    </View>
  );
}

function MessageBubble({
  msg,
  colors,
  activePetId,
  addTask,
}: {
  msg: Msg;
  colors: ReturnType<typeof useColors>;
  activePetId: number | null;
  addTask: (t: Task) => void;
}) {
  const isUser = msg.role === "user";
  const { clean, tasks, vet } = parseAllMarkers(msg.content);
  const [addedTasks, setAddedTasks] = useState<Set<number>>(new Set());
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(6)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start();
  }, []);

  const isStreaming = clean === "▍" || (clean.endsWith("▍") && clean.length < 3);
  const displayText = clean.endsWith("▍") ? clean.slice(0, -1) : clean;

  const markdownStyles = {
    body: { color: isUser ? "#fff" : colors.foreground, fontSize: 14.5, lineHeight: 22, fontFamily: "Inter_400Regular" },
    heading1: { color: isUser ? "#fff" : colors.foreground, fontSize: 17, fontWeight: "700" as const, marginBottom: 6, marginTop: 4 },
    heading2: { color: isUser ? "#fff" : colors.foreground, fontSize: 15.5, fontWeight: "700" as const, marginBottom: 4, marginTop: 8 },
    heading3: { color: isUser ? "rgba(255,255,255,0.8)" : colors.primary, fontSize: 14, fontWeight: "700" as const, marginBottom: 2, marginTop: 6 },
    strong: { fontWeight: "700" as const, color: isUser ? "#fff" : colors.foreground },
    em: { fontStyle: "italic" as const },
    bullet_list: { marginTop: 4, marginBottom: 4 },
    ordered_list: { marginTop: 4, marginBottom: 4 },
    list_item: { marginBottom: 3 },
    blockquote: {
      backgroundColor: isUser ? "rgba(255,255,255,0.15)" : "#FEF2F2",
      borderLeftColor: isUser ? "rgba(255,255,255,0.5)" : "#EF4444",
      borderLeftWidth: 3,
      paddingHorizontal: 10,
      paddingVertical: 6,
      marginVertical: 6,
      borderRadius: 4,
    },
    code_inline: {
      backgroundColor: isUser ? "rgba(255,255,255,0.2)" : colors.muted,
      color: isUser ? "#fff" : colors.primary,
      paddingHorizontal: 4,
      borderRadius: 3,
      fontSize: 13,
    },
  };

  const handleAddTask = (task: ParsedTask, idx: number) => {
    if (!activePetId) return;
    const newTask: Task = {
      id: Date.now().toString() + idx,
      petId: String(activePetId),
      type: task.type,
      title: task.title,
      description: task.description,
      dueDate: task.date,
      completed: false,
      reminderSet: false,
    };
    addTask(newTask);
    setAddedTasks((prev) => new Set(prev).add(idx));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  if (isUser) {
    return (
      <Animated.View style={[styles.userMsgRow, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {msg.mediaUri && (
          <Image source={{ uri: msg.mediaUri }} style={styles.msgImage} contentFit="cover" />
        )}
        <LinearGradient
          colors={["#3B82F6", "#1d4ed8"]}
          style={styles.userBubble}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.userText}>{displayText}</Text>
        </LinearGradient>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.aiBubbleWrapper, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.aiAvatarRow}>
        <LinearGradient colors={[colors.primary, "#1d4ed8"]} style={styles.aiAvatar}>
          <PodleLogo size={14} />
        </LinearGradient>
        <Text style={[styles.aiName, { color: colors.mutedForeground }]}>Poddle AI</Text>
        <Text style={[styles.msgTime, { color: colors.mutedForeground }]}>
          {new Date(msg.timestamp).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
        </Text>
      </View>

      <View style={[styles.aiBubble, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {isStreaming ? (
          <TypingIndicator colors={colors} />
        ) : (
          <Markdown style={markdownStyles}>{displayText}</Markdown>
        )}
      </View>

      {vet && !isStreaming && (
        <VetAppointmentCard
          vet={vet}
          colors={colors}
          onSaveTask={(parsed) => {
            const task: Task = {
              id: Date.now().toString(),
              petId: String(activePetId ?? ""),
              type: parsed.type,
              title: parsed.title,
              description: parsed.description,
              dueDate: parsed.date,
              completed: false,
              reminderSet: false,
            };
            addTask(task);
          }}
        />
      )}

      {tasks.length > 0 && !isStreaming && (
        <View style={styles.taskSuggestionsContainer}>
          {tasks.map((task, idx) => {
            const added = addedTasks.has(idx);
            const color = typeColor(task.type);
            return (
              <View key={idx} style={[styles.taskSuggestion, { backgroundColor: colors.card, borderColor: color + "50" }]}>
                <View style={[styles.taskSuggestIcon, { backgroundColor: color + "15" }]}>
                  <Feather name={typeIcon(task.type) as any} size={14} color={color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.taskSuggestTitle, { color: colors.foreground }]}>{task.title}</Text>
                  <Text style={[styles.taskSuggestDate, { color: colors.mutedForeground }]}>
                    {typeLabel(task.type)} · {task.date}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.taskSuggestBtn,
                    { backgroundColor: added ? "#10B98120" : color + "20", borderColor: added ? "#10B981" : color },
                  ]}
                  onPress={() => !added && handleAddTask(task, idx)}
                  disabled={added}
                >
                  <Feather name={added ? "check" : "plus"} size={13} color={added ? "#10B981" : color} />
                  <Text style={[styles.taskSuggestBtnText, { color: added ? "#10B981" : color }]}>
                    {added ? "Eklendi" : "Ekle"}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}
    </Animated.View>
  );
}

const SESSION_ICONS = [
  { icon: "message-circle", label: "Genel", color: "#3B82F6" },
  { icon: "shield", label: "Aşı", color: "#10B981" },
  { icon: "scissors", label: "Bakım", color: "#8B5CF6" },
  { icon: "activity", label: "Sağlık", color: "#F59E0B" },
  { icon: "calendar", label: "Randevu", color: "#EF4444" },
  { icon: "coffee", label: "Beslenme", color: "#F97316" },
];

const QUICK_SUGGESTIONS = [
  { text: "Aşı takvimi oluştur 💉", icon: "shield" },
  { text: "Tüy dökülmesi neden olur?", icon: "help-circle" },
  { text: "Beslenme önerisi ver 🍖", icon: "coffee" },
  { text: "Egzersiz programı yap 🐾", icon: "activity" },
];

function SessionListView({
  colors,
  insets,
  petName,
  sessions,
  onSelectSession,
  onNewSession,
  onDeleteSession,
}: {
  colors: ReturnType<typeof useColors>;
  insets: ReturnType<typeof useSafeAreaInsets>;
  petName: string;
  sessions: ChatSession[];
  onSelectSession: (session: ChatSession) => void;
  onNewSession: (title: string, icon: string) => void;
  onDeleteSession: (id: number) => void;
}) {
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("message-circle");
  const TAB_BAR_HEIGHT = Platform.OS === "web" ? 84 : 66;
  const topInset = insets.top + (Platform.OS === "web" ? 67 : 0);

  const handleCreate = () => {
    const title = newTitle.trim() || "Yeni Sohbet";
    onNewSession(title, selectedIcon);
    setNewTitle("");
    setSelectedIcon("message-circle");
    setShowNew(false);
  };

  const confirmDelete = (id: number, title: string) => {
    Alert.alert("Sohbeti Sil", `"${title}" sohbetini silmek istediğinden emin misin?`, [
      { text: "İptal", style: "cancel" },
      { text: "Sil", style: "destructive", onPress: () => onDeleteSession(id) },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.primary, "#1d4ed8"]}
        style={[styles.sessionHeader, { paddingTop: topInset + 12 }]}
      >
        <View style={styles.sessionHeaderRow}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={styles.sessionLogoBox}>
              <PodleLogo size={22} />
            </View>
            <View>
              <Text style={styles.sessionHeaderTitle}>Poddle AI</Text>
              <Text style={styles.sessionHeaderSub}>{petName} için veteriner danışman</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.newSessionBtn}
            onPress={() => setShowNew(!showNew)}
          >
            <Feather name={showNew ? "x" : "plus"} size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        {showNew && (
          <View style={styles.newSessionForm}>
            <TextInput
              style={[styles.newSessionInput, { backgroundColor: "rgba(255,255,255,0.15)", color: "#fff" }]}
              placeholder="Sohbet başlığı (ör: Aşı Takibi)"
              placeholderTextColor="rgba(255,255,255,0.55)"
              value={newTitle}
              onChangeText={setNewTitle}
              maxLength={60}
              autoFocus
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.iconPicker}>
              {SESSION_ICONS.map((item) => (
                <TouchableOpacity
                  key={item.icon}
                  style={[
                    styles.iconOption,
                    {
                      backgroundColor: selectedIcon === item.icon ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.08)",
                      borderColor: selectedIcon === item.icon ? "rgba(255,255,255,0.8)" : "transparent",
                    },
                  ]}
                  onPress={() => setSelectedIcon(item.icon)}
                >
                  <Feather name={item.icon as any} size={16} color="#fff" />
                  <Text style={styles.iconLabel}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.createBtn} onPress={handleCreate}>
              <Feather name="message-circle" size={16} color="#1d4ed8" />
              <Text style={styles.createBtnText}>Sohbet Oluştur</Text>
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_HEIGHT + 16 }}
        showsVerticalScrollIndicator={false}
      >
        {sessions.length === 0 ? (
          <View style={styles.emptyState}>
            <LinearGradient colors={[colors.primary + "20", colors.primary + "05"]} style={styles.emptyIconBg}>
              <PodleLogo size={40} />
            </LinearGradient>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              Sohbet başlatmaya hazır mısın?
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
              {petName} hakkında soru sor, fotoğraf paylaş{"\n"}veya bakım planı oluştur.
            </Text>
            <TouchableOpacity
              style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
              onPress={() => setShowNew(true)}
            >
              <Feather name="plus" size={16} color="#fff" />
              <Text style={styles.emptyBtnText}>İlk Sohbeti Başlat</Text>
            </TouchableOpacity>

            <View style={styles.featureList}>
              {[
                { icon: "camera", label: "Fotoğraf Analizi", desc: "Semptom fotoğrafı yükle, AI değerlendirir" },
                { icon: "calendar", label: "Bakım Planı", desc: "Aşı ve bakım takvimleri oluştur" },
                { icon: "activity", label: "Sağlık Takibi", desc: "Günlük sağlık verilerini kaydet" },
              ].map((f) => (
                <View key={f.icon} style={[styles.featureItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.featureIcon, { backgroundColor: colors.primaryLight }]}>
                    <Feather name={f.icon as any} size={16} color={colors.primary} />
                  </View>
                  <View>
                    <Text style={[styles.featureLabel, { color: colors.foreground }]}>{f.label}</Text>
                    <Text style={[styles.featureDesc, { color: colors.mutedForeground }]}>{f.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <>
            {sessions.map((session) => {
              const iconData = SESSION_ICONS.find((i) => i.icon === session.icon) || SESSION_ICONS[0];
              return (
                <TouchableOpacity
                  key={session.id}
                  style={[styles.sessionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => onSelectSession(session)}
                  onLongPress={() => confirmDelete(session.id, session.title)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.sessionCardIcon, { backgroundColor: iconData.color + "18" }]}>
                    <Feather name={session.icon as any} size={20} color={iconData.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.sessionCardTitle, { color: colors.foreground }]} numberOfLines={1}>
                      {session.title}
                    </Text>
                    <Text style={[styles.sessionCardDate, { color: colors.mutedForeground }]}>
                      {formatSessionDate(session.updatedAt)}
                    </Text>
                  </View>
                  <View style={[styles.sessionCardArrow, { backgroundColor: colors.muted }]}>
                    <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function ChatView({
  colors,
  insets,
  session,
  onBack,
}: {
  colors: ReturnType<typeof useColors>;
  insets: ReturnType<typeof useSafeAreaInsets>;
  session: ChatSession;
  onBack: () => void;
}) {
  const {
    messages,
    addMessage,
    updateMessage,
    clearMessages,
    subscription,
    canAskQuestion,
    useQuestion,
    pets,
    activePetId,
    healthLogs,
    addTask,
    updateSessionTitle,
  } = useApp();

  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<{
    uri: string;
    type: "image" | "video";
  } | null>(null);
  const [showSub, setShowSub] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const titleUpdatedRef = useRef(false);

  const TAB_BAR_HEIGHT = Platform.OS === "web" ? 84 : 66;
  const topInset = insets.top + (Platform.OS === "web" ? 67 : 0);

  const activePet = pets.find((p) => p.id === activePetId) ?? pets[0];

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const pickMedia = async (mediaType: "image" | "video") => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes:
        mediaType === "image"
          ? ImagePicker.MediaTypeOptions.Images
          : ImagePicker.MediaTypeOptions.Videos,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setSelectedMedia({ uri: result.assets[0].uri, type: mediaType });
    }
  };

  const sendMessageWithText = useCallback(async (messageText: string, mediaForSend?: { uri: string; type: "image" | "video" } | null) => {
    const trimmed = messageText.trim();
    if (!trimmed && !mediaForSend) return;
    if (!canAskQuestion()) {
      setShowSub(true);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    useQuestion();

    const userMsg: Msg = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      role: "user",
      content: trimmed || (mediaForSend?.type === "image" ? "[Fotoğraf gönderildi]" : "[Video gönderildi]"),
      mediaUri: mediaForSend?.uri,
      mediaType: mediaForSend?.type,
      timestamp: new Date().toISOString(),
    };
    addMessage(userMsg);
    setText("");
    setSelectedMedia(null);
    setIsSending(true);

    if (!titleUpdatedRef.current && messages.length === 0 && trimmed) {
      titleUpdatedRef.current = true;
      const autoTitle = trimmed.length > 45 ? trimmed.slice(0, 45) + "…" : trimmed;
      updateSessionTitle(session.id, autoTitle);
    }

    try {
      let petContext = activePet
        ? `Evcil hayvan: ${activePet.name}, Tür: ${activePet.species}, Irk: ${activePet.breed}, Yaş: ${activePet.age}, Kilo: ${activePet.weight}kg, Cinsiyet: ${activePet.gender === "male" ? "Erkek" : "Dişi"}, Durum: ${activePet.status}.`
        : "";

      if (activePet && healthLogs.length > 0) {
        const recent = healthLogs.slice(0, 15);
        const logLines = recent
          .map((log) => {
            const date = new Date(log.loggedAt);
            const diffDays = Math.floor((Date.now() - date.getTime()) / 86400000);
            const dateLabel = diffDays === 0 ? "bugün" : diffDays === 1 ? "dün" : `${diffDays} gün önce`;
            return `  - ${dateLabel}: [${log.logType}] ${log.value}${log.notes ? ` — ${log.notes}` : ""}`;
          })
          .join("\n");
        petContext += `\n\nSon sağlık kayıtları:\n${logLines}`;
      }

      const historyMsgs = messages.slice(-14).map((m) => ({
        role: m.role,
        content: parseAllMarkers(m.content).clean,
      }));

      let imageBase64: string | undefined;
      if (mediaForSend?.type === "image" && mediaForSend.uri) {
        try {
          const resp = await globalThis.fetch(mediaForSend.uri);
          const blob = await resp.blob();
          imageBase64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } catch {
          // skip image
        }
      }

      const aiMsgId = Date.now().toString() + Math.random().toString(36).substr(2, 5);
      const aiMsg: Msg = {
        id: aiMsgId,
        role: "assistant",
        content: "▍",
        timestamp: new Date().toISOString(),
      };
      addMessage(aiMsg);

      const response = await fetch(`${API_BASE}/api/poddle/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          petContext,
          history: historyMsgs,
          imageBase64,
        }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6).trim();
              if (data === "[DONE]") break;
              try {
                const parsed = JSON.parse(data);
                if (parsed.text) {
                  accumulated += parsed.text;
                  updateMessage(aiMsgId, accumulated + "▍");
                }
              } catch {
                // skip
              }
            }
          }
        }
      }

      updateMessage(aiMsgId, accumulated || "Yanıt alınamadı.");
    } catch {
      const errMsg: Msg = {
        id: Date.now().toString() + "err",
        role: "assistant",
        content: "Bağlantı hatası oluştu. Lütfen tekrar deneyin.",
        timestamp: new Date().toISOString(),
      };
      addMessage(errMsg);
    } finally {
      setIsSending(false);
    }
  }, [
    canAskQuestion,
    useQuestion,
    addMessage,
    messages,
    activePet,
    healthLogs,
    updateMessage,
    updateSessionTitle,
    session.id,
  ]);

  const sendMessage = useCallback(() => {
    sendMessageWithText(text, selectedMedia);
  }, [text, selectedMedia, sendMessageWithText]);

  const questionsLeft =
    subscription.plan === "monthly"
      ? "∞"
      : subscription.plan === "pay_per_question"
      ? "∞"
      : String(Math.max(0, subscription.freeQuestionsTotal - subscription.freeQuestionsUsed));

  const iconData = SESSION_ICONS.find((i) => i.icon === session.icon) || SESSION_ICONS[0];
  const hasContent = text.trim().length > 0 || selectedMedia !== null;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <LinearGradient
        colors={[colors.primary, "#1d4ed8"]}
        style={[styles.chatHeader, { paddingTop: topInset + 8 }]}
      >
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Feather name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>

        <View style={[styles.chatHeaderIconBg, { backgroundColor: iconData.color + "35" }]}>
          <Feather name={session.icon as any} size={16} color="#fff" />
        </View>

        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.chatHeaderTitle} numberOfLines={1}>
            {session.title}
          </Text>
          <View style={styles.onlineBadge}>
            <View style={styles.onlineDot} />
            <Text style={styles.chatHeaderSub}>
              {activePet ? `${activePet.name} · AI Aktif` : "AI Aktif"}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.clearBtn}
          onPress={() =>
            Alert.alert("Sohbeti Temizle", "Bu sohbetin mesajlarını silmek istiyor musun?", [
              { text: "İptal", style: "cancel" },
              { text: "Temizle", style: "destructive", onPress: () => { clearMessages(); titleUpdatedRef.current = false; } },
            ])
          }
        >
          <Feather name="trash-2" size={16} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
      </LinearGradient>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: TAB_BAR_HEIGHT + 90,
          flexGrow: 1,
        }}
        ListEmptyComponent={
          <View style={styles.welcomeContainer}>
            <LinearGradient
              colors={[colors.primary + "25", colors.primary + "08"]}
              style={styles.welcomeAvatarBg}
            >
              <LinearGradient colors={[colors.primary, "#1d4ed8"]} style={styles.welcomeAvatar}>
                <PodleLogo size={36} />
              </LinearGradient>
            </LinearGradient>

            <Text style={[styles.welcomeTitle, { color: colors.foreground }]}>
              Merhaba! Ben Poddle 🐾
            </Text>
            <Text style={[styles.welcomeDesc, { color: colors.mutedForeground }]}>
              {activePet
                ? `${activePet.name} hakkında her şeyi sorabilirsin.\nFotoğraf yükleyebilir, bakım planı yapabiliriz.`
                : "Evcil hayvanın hakkında soru sor, fotoğraf paylaş veya bakım planı oluşturalım."}
            </Text>

            <Text style={[styles.suggestLabel, { color: colors.mutedForeground }]}>Hızlı Sorular</Text>
            <View style={styles.quickChips}>
              {QUICK_SUGGESTIONS.map((s) => (
                <TouchableOpacity
                  key={s.text}
                  style={[styles.quickChip, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => sendMessageWithText(s.text)}
                  activeOpacity={0.75}
                >
                  <Feather name={s.icon as any} size={14} color={colors.primary} />
                  <Text style={[styles.quickChipText, { color: colors.foreground }]}>{s.text}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <MessageBubble
            msg={item}
            colors={colors}
            activePetId={activePetId}
            addTask={addTask}
          />
        )}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />

      <View
        style={[
          styles.inputBar,
          {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            paddingBottom: Math.max(insets.bottom + 4, TAB_BAR_HEIGHT - 20),
          },
        ]}
      >
        {selectedMedia && (
          <View style={styles.selectedMediaContainer}>
            <Image source={{ uri: selectedMedia.uri }} style={styles.selectedMediaPreview} contentFit="cover" />
            <TouchableOpacity style={styles.removeMedia} onPress={() => setSelectedMedia(null)}>
              <Feather name="x" size={11} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.inputRow}>
          <TouchableOpacity
            style={[styles.mediaBtn, { backgroundColor: colors.muted }]}
            onPress={() => pickMedia("image")}
          >
            <Feather name="image" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>

          <TextInput
            style={[
              styles.textInput,
              { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border },
            ]}
            placeholder="Bir şey sor…"
            placeholderTextColor={colors.mutedForeground}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={1000}
          />

          <TouchableOpacity
            style={[styles.sendBtn, { opacity: isSending ? 0.7 : 1 }]}
            onPress={sendMessage}
            disabled={isSending || !hasContent}
          >
            <LinearGradient
              colors={hasContent ? [colors.primary, "#1d4ed8"] : [colors.muted, colors.muted]}
              style={styles.sendBtnGradient}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Feather
                  name="send"
                  size={17}
                  color={hasContent ? "#fff" : colors.mutedForeground}
                />
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.inputFooter}>
          <Text style={[styles.questionsLeft, { color: colors.mutedForeground }]}>
            {questionsLeft === "∞" ? "✨ Sınırsız soru" : `${questionsLeft} soru hakkın kaldı`}
          </Text>
          {subscription.plan === "free" && (
            <TouchableOpacity onPress={() => setShowSub(true)}>
              <Text style={[styles.upgradeLink, { color: colors.primary }]}>Premium'a geç →</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <SubscriptionModal
        visible={showSub}
        onClose={() => setShowSub(false)}
        onSelectPlan={() => setShowSub(false)}
      />
    </KeyboardAvoidingView>
  );
}

export default function ChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    pets,
    activePetId,
    sessions,
    activeSessionId,
    setActiveSessionId,
    createSession,
    deleteSession,
    fetchSessions,
  } = useApp();

  const activePet = pets.find((p) => p.id === activePetId) ?? pets[0];

  const handleSelectSession = useCallback(
    (session: ChatSession) => setActiveSessionId(session.id),
    [setActiveSessionId]
  );

  const handleNewSession = useCallback(
    async (title: string, icon: string) => {
      if (!activePetId) return;
      try {
        const session = await createSession(activePetId, title, icon);
        setActiveSessionId(session.id);
      } catch {
        Alert.alert("Hata", "Sohbet oluşturulamadı.");
      }
    },
    [activePetId, createSession, setActiveSessionId]
  );

  const handleDeleteSession = useCallback(
    async (id: number) => await deleteSession(id),
    [deleteSession]
  );

  const handleBack = useCallback(() => {
    setActiveSessionId(null);
    if (activePetId) fetchSessions(activePetId);
  }, [setActiveSessionId, activePetId, fetchSessions]);

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  if (!activePet) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center", padding: 32 }]}>
        <LinearGradient colors={[colors.primaryLight, colors.background]} style={styles.noPetIconBg}>
          <Feather name="alert-circle" size={40} color={colors.primary} />
        </LinearGradient>
        <Text style={[styles.emptyTitle, { color: colors.foreground, marginTop: 16, textAlign: "center" }]}>
          Evcil hayvan bulunamadı
        </Text>
        <Text style={[styles.emptyDesc, { color: colors.mutedForeground, textAlign: "center" }]}>
          Önce "Hayvanlarım" sekmesinden bir hayvan ekle.
        </Text>
      </View>
    );
  }

  if (activeSession) {
    return (
      <ChatView colors={colors} insets={insets} session={activeSession} onBack={handleBack} />
    );
  }

  return (
    <SessionListView
      colors={colors}
      insets={insets}
      petName={activePet.name}
      sessions={sessions}
      onSelectSession={handleSelectSession}
      onNewSession={handleNewSession}
      onDeleteSession={handleDeleteSession}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  sessionHeader: { paddingHorizontal: 20, paddingBottom: 18 },
  sessionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sessionLogoBox: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center", alignItems: "center",
  },
  sessionHeaderTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#fff" },
  sessionHeaderSub: { fontSize: 12, color: "rgba(255,255,255,0.65)", fontFamily: "Inter_400Regular", marginTop: 1 },
  newSessionBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center", alignItems: "center",
  },
  newSessionForm: { marginTop: 16, gap: 10 },
  newSessionInput: {
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 15, fontFamily: "Inter_400Regular",
  },
  iconPicker: { flexDirection: "row" },
  iconOption: {
    alignItems: "center", paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 12, marginRight: 8, borderWidth: 1.5, gap: 4,
  },
  iconLabel: { color: "#fff", fontSize: 10, fontFamily: "Inter_600SemiBold" },
  createBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#fff", borderRadius: 14, paddingVertical: 11,
  },
  createBtnText: { color: "#1d4ed8", fontSize: 15, fontFamily: "Inter_700Bold" },

  sessionCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 10,
  },
  sessionCardIcon: { width: 46, height: 46, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  sessionCardTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  sessionCardDate: { fontSize: 12, fontFamily: "Inter_400Regular" },
  sessionCardArrow: { width: 30, height: 30, borderRadius: 10, justifyContent: "center", alignItems: "center" },

  emptyState: { flex: 1, alignItems: "center", paddingTop: 40, paddingHorizontal: 16 },
  emptyIconBg: { width: 100, height: 100, borderRadius: 50, justifyContent: "center", alignItems: "center", marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 8, textAlign: "center" },
  emptyDesc: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  emptyBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginTop: 20, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14,
  },
  emptyBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  featureList: { width: "100%", marginTop: 24, gap: 10 },
  featureItem: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 12, borderRadius: 14, borderWidth: 1,
  },
  featureIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  featureLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  featureDesc: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },

  noPetIconBg: { width: 90, height: 90, borderRadius: 45, justifyContent: "center", alignItems: "center" },

  chatHeader: {
    paddingHorizontal: 16, paddingBottom: 14,
    flexDirection: "row", alignItems: "center", gap: 8,
  },
  backBtn: { padding: 4 },
  chatHeaderIconBg: { width: 34, height: 34, borderRadius: 11, justifyContent: "center", alignItems: "center" },
  chatHeaderTitle: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff" },
  onlineBadge: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#6EE7B7" },
  chatHeaderSub: { fontSize: 11, color: "rgba(255,255,255,0.7)", fontFamily: "Inter_400Regular" },
  clearBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.12)", justifyContent: "center", alignItems: "center" },

  userMsgRow: { alignItems: "flex-end", marginBottom: 14 },
  userBubble: { maxWidth: "78%", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, borderBottomRightRadius: 5 },
  userText: { color: "#fff", fontSize: 14.5, fontFamily: "Inter_400Regular", lineHeight: 22 },
  msgImage: { width: 200, height: 150, borderRadius: 14, marginBottom: 6 },

  aiBubbleWrapper: { marginBottom: 18 },
  aiAvatarRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  aiAvatar: { width: 26, height: 26, borderRadius: 13, justifyContent: "center", alignItems: "center" },
  aiName: { fontSize: 12, fontFamily: "Inter_700Bold" },
  msgTime: { fontSize: 10, fontFamily: "Inter_400Regular", marginLeft: "auto" },
  aiBubble: {
    maxWidth: "90%", paddingHorizontal: 14, paddingVertical: 12,
    borderRadius: 18, borderTopLeftRadius: 5, borderWidth: 1,
  },

  taskSuggestionsContainer: { marginTop: 10, gap: 8 },
  taskSuggestion: {
    flexDirection: "row", alignItems: "center", padding: 11,
    borderRadius: 14, borderWidth: 1.5, gap: 10,
  },
  taskSuggestIcon: { width: 34, height: 34, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  taskSuggestTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 1 },
  taskSuggestDate: { fontSize: 11, fontFamily: "Inter_400Regular" },
  taskSuggestBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 9, borderWidth: 1,
  },
  taskSuggestBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },

  welcomeContainer: { flex: 1, alignItems: "center", paddingTop: 32, paddingHorizontal: 20 },
  welcomeAvatarBg: { width: 100, height: 100, borderRadius: 50, justifyContent: "center", alignItems: "center", marginBottom: 20 },
  welcomeAvatar: { width: 76, height: 76, borderRadius: 38, justifyContent: "center", alignItems: "center" },
  welcomeTitle: { fontSize: 22, fontFamily: "Inter_700Bold", marginBottom: 8, textAlign: "center" },
  welcomeDesc: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22, marginBottom: 24 },
  suggestLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, marginBottom: 10, alignSelf: "flex-start" },
  quickChips: { width: "100%", gap: 8 },
  quickChip: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14, borderWidth: 1,
  },
  quickChipText: { fontSize: 14, fontFamily: "Inter_500Medium", flex: 1 },

  inputBar: { borderTopWidth: 1, paddingHorizontal: 12, paddingTop: 10 },
  selectedMediaContainer: { marginBottom: 8, position: "relative", alignSelf: "flex-start" },
  selectedMediaPreview: { width: 56, height: 56, borderRadius: 10 },
  removeMedia: {
    position: "absolute", top: -4, right: -4,
    backgroundColor: "#EF4444", borderRadius: 10,
    width: 18, height: 18, justifyContent: "center", alignItems: "center",
  },
  inputRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  mediaBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  textInput: {
    flex: 1, borderRadius: 22, borderWidth: 1,
    paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 15, maxHeight: 120, fontFamily: "Inter_400Regular",
  },
  sendBtn: { width: 42, height: 42, borderRadius: 21, overflow: "hidden" },
  sendBtnGradient: { flex: 1, justifyContent: "center", alignItems: "center" },
  inputFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 6, paddingHorizontal: 4 },
  questionsLeft: { fontSize: 11, fontFamily: "Inter_400Regular" },
  upgradeLink: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
});
