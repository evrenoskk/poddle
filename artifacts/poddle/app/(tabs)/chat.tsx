import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useRef, useState, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
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
  const { clean, tasks } = parseTasksFromContent(msg.content);
  const [addedTasks, setAddedTasks] = useState<Set<number>>(new Set());

  const markdownStyles = {
    body: { color: colors.foreground, fontSize: 14.5, lineHeight: 22 },
    heading1: { color: colors.foreground, fontSize: 17, fontWeight: "700" as const, marginBottom: 6, marginTop: 4 },
    heading2: { color: colors.foreground, fontSize: 15.5, fontWeight: "700" as const, marginBottom: 4, marginTop: 8 },
    heading3: { color: colors.primary, fontSize: 14, fontWeight: "700" as const, marginBottom: 2, marginTop: 6 },
    strong: { fontWeight: "700" as const, color: colors.foreground },
    em: { fontStyle: "italic" as const },
    bullet_list: { marginTop: 4, marginBottom: 4 },
    ordered_list: { marginTop: 4, marginBottom: 4 },
    list_item: { marginBottom: 2 },
    blockquote: {
      backgroundColor: "#FEF2F2",
      borderLeftColor: "#EF4444",
      borderLeftWidth: 3,
      paddingHorizontal: 10,
      paddingVertical: 6,
      marginVertical: 6,
      borderRadius: 4,
    },
    code_inline: {
      backgroundColor: colors.muted,
      color: colors.primary,
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
      <View style={styles.userMsgRow}>
        {msg.mediaUri && (
          <Image source={{ uri: msg.mediaUri }} style={styles.msgImage} />
        )}
        <View style={[styles.userBubble, { backgroundColor: colors.primary }]}>
          <Text style={styles.userText}>{clean}</Text>
        </View>
      </View>
    );
  }

  const isStreaming = clean.endsWith("▍");
  const displayText = isStreaming ? clean.slice(0, -1) : clean;

  return (
    <View style={styles.aiBubbleWrapper}>
      <View style={styles.aiAvatarRow}>
        <View style={[styles.aiAvatar, { backgroundColor: colors.primaryLight }]}>
          <PodleLogo size={18} />
        </View>
        <Text style={[styles.aiName, { color: colors.mutedForeground }]}>Poddle AI</Text>
      </View>
      <View style={[styles.aiBubble, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Markdown style={markdownStyles}>{displayText}</Markdown>
        {isStreaming && (
          <Text style={{ color: colors.primary, fontSize: 16 }}>▍</Text>
        )}
      </View>

      {tasks.length > 0 && !isStreaming && (
        <View style={styles.taskSuggestionsContainer}>
          {tasks.map((task, idx) => {
            const added = addedTasks.has(idx);
            const color = typeColor(task.type);
            return (
              <View key={idx} style={[styles.taskSuggestion, { backgroundColor: colors.card, borderColor: color + "40" }]}>
                <View style={styles.taskSuggestInfo}>
                  <View style={[styles.taskSuggestIcon, { backgroundColor: color + "15" }]}>
                    <Feather name={typeIcon(task.type) as any} size={14} color={color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.taskSuggestTitle, { color: colors.foreground }]}>{task.title}</Text>
                    <Text style={[styles.taskSuggestDate, { color: colors.mutedForeground }]}>
                      {typeLabel(task.type)} · {task.date}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[
                    styles.taskSuggestBtn,
                    { backgroundColor: added ? "#10B98120" : color + "15" },
                  ]}
                  onPress={() => !added && handleAddTask(task, idx)}
                  disabled={added}
                >
                  <Feather name={added ? "check" : "plus"} size={14} color={added ? "#10B981" : color} />
                  <Text style={[styles.taskSuggestBtnText, { color: added ? "#10B981" : color }]}>
                    {added ? "Eklendi" : "Ekle"}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}
    </View>
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
          <View>
            <Text style={styles.sessionHeaderTitle}>Poddle AI</Text>
            <Text style={styles.sessionHeaderSub}>{petName}'nin Sohbetleri</Text>
          </View>
          <TouchableOpacity
            style={styles.newSessionBtn}
            onPress={() => setShowNew(!showNew)}
          >
            <Feather name={showNew ? "x" : "plus"} size={20} color="#fff" />
            {!showNew && <Text style={styles.newSessionBtnText}>Yeni</Text>}
          </TouchableOpacity>
        </View>

        {showNew && (
          <View style={styles.newSessionForm}>
            <TextInput
              style={[styles.newSessionInput, { backgroundColor: "rgba(255,255,255,0.15)", color: "#fff" }]}
              placeholder="Sohbet başlığı..."
              placeholderTextColor="rgba(255,255,255,0.6)"
              value={newTitle}
              onChangeText={setNewTitle}
              maxLength={60}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.iconPicker}>
              {SESSION_ICONS.map((item) => (
                <TouchableOpacity
                  key={item.icon}
                  style={[
                    styles.iconOption,
                    {
                      backgroundColor: selectedIcon === item.icon
                        ? "rgba(255,255,255,0.3)"
                        : "rgba(255,255,255,0.1)",
                      borderColor: selectedIcon === item.icon ? "#fff" : "transparent",
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
              <Text style={styles.createBtnText}>Oluştur</Text>
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
            <View style={[styles.emptyIcon, { backgroundColor: colors.primaryLight }]}>
              <PodleLogo size={36} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              Henüz sohbet yok
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
              {petName} ile yeni bir sohbet başlatarak{"\n"}AI veteriner danışmanından yardım al.
            </Text>
            <TouchableOpacity
              style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
              onPress={() => setShowNew(true)}
            >
              <Feather name="plus" size={16} color="#fff" />
              <Text style={styles.emptyBtnText}>İlk Sohbeti Başlat</Text>
            </TouchableOpacity>
          </View>
        ) : (
          sessions.map((session) => {
            const iconData = SESSION_ICONS.find((i) => i.icon === session.icon) || SESSION_ICONS[0];
            return (
              <TouchableOpacity
                key={session.id}
                style={[styles.sessionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => onSelectSession(session)}
                onLongPress={() => confirmDelete(session.id, session.title)}
              >
                <View style={[styles.sessionCardIcon, { backgroundColor: iconData.color + "15" }]}>
                  <Feather name={session.icon as any} size={20} color={iconData.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sessionCardTitle, { color: colors.foreground }]}>
                    {session.title}
                  </Text>
                  <Text style={[styles.sessionCardDate, { color: colors.mutedForeground }]}>
                    {formatSessionDate(session.updatedAt)}
                  </Text>
                </View>
                <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            );
          })
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

  const sendMessage = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed && !selectedMedia) return;
    if (!canAskQuestion()) {
      setShowSub(true);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    useQuestion();

    const userMsg: Msg = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      role: "user",
      content: trimmed || (selectedMedia?.type === "image" ? "[Fotoğraf gönderildi]" : "[Video gönderildi]"),
      mediaUri: selectedMedia?.uri,
      mediaType: selectedMedia?.type,
      timestamp: new Date().toISOString(),
    };
    addMessage(userMsg);
    setText("");
    const mediaForSend = selectedMedia;
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
            const dateLabel =
              diffDays === 0 ? "bugün" : diffDays === 1 ? "dün" : `${diffDays} gün önce`;
            return `  - ${dateLabel}: [${log.logType}] ${log.value}${log.notes ? ` — ${log.notes}` : ""}`;
          })
          .join("\n");
        petContext += `\n\nSon sağlık kayıtları:\n${logLines}`;
      }

      const historyMsgs = messages.slice(-8).map((m) => ({
        role: m.role,
        content: m.content,
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

      const aiMsgId =
        Date.now().toString() + Math.random().toString(36).substr(2, 5);
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
    text,
    selectedMedia,
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

  const questionsLeft =
    subscription.plan === "monthly"
      ? "∞"
      : subscription.plan === "pay_per_question"
      ? "∞"
      : String(
          Math.max(
            0,
            subscription.freeQuestionsTotal - subscription.freeQuestionsUsed
          )
        );

  const iconData =
    SESSION_ICONS.find((i) => i.icon === session.icon) || SESSION_ICONS[0];

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
        <View style={[styles.chatHeaderIcon, { backgroundColor: iconData.color + "30" }]}>
          <Feather name={session.icon as any} size={16} color="#fff" />
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.chatHeaderTitle} numberOfLines={1}>
            {session.title}
          </Text>
          {activePet && (
            <Text style={styles.chatHeaderSub}>{activePet.name} için AI danışman</Text>
          )}
        </View>
        <TouchableOpacity
          style={[styles.clearBtn, { backgroundColor: "rgba(255,255,255,0.15)" }]}
          onPress={() => {
            Alert.alert("Sohbeti Temizle", "Bu sohbetin mesajlarını silmek istiyor musun?", [
              { text: "İptal", style: "cancel" },
              {
                text: "Temizle",
                style: "destructive",
                onPress: () => {
                  clearMessages();
                  titleUpdatedRef.current = false;
                },
              },
            ]);
          }}
        >
          <Feather name="trash-2" size={16} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>
      </LinearGradient>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: TAB_BAR_HEIGHT + 80,
          flexGrow: 1,
        }}
        ListEmptyComponent={
          <View style={styles.welcomeContainer}>
            <View style={[styles.welcomeAvatar, { backgroundColor: colors.primaryLight }]}>
              <PodleLogo size={44} />
            </View>
            <Text style={[styles.welcomeTitle, { color: colors.foreground }]}>
              Merhaba! Ben Poddle 👋
            </Text>
            <Text style={[styles.welcomeDesc, { color: colors.mutedForeground }]}>
              {activePet
                ? `${activePet.name} hakkında soru sor, fotoğraf paylaş veya bakım planı oluşturalım.`
                : "Evcil hayvanın hakkında soru sor, fotoğraf paylaş veya bakım planı oluşturalım."}
            </Text>
            <View style={styles.quickChips}>
              {[
                "Aşı takvimi oluştur",
                "Tüy dökülmesi neden olur?",
                "Beslenme önerisi ver",
              ].map((chip) => (
                <TouchableOpacity
                  key={chip}
                  style={[styles.quickChip, { backgroundColor: colors.primaryLight, borderColor: colors.primary + "30" }]}
                  onPress={() => setText(chip)}
                >
                  <Text style={[styles.quickChipText, { color: colors.primary }]}>{chip}</Text>
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
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: false })
        }
      />

      <View
        style={[
          styles.inputBar,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            paddingBottom: Math.max(insets.bottom + 4, TAB_BAR_HEIGHT - 20),
          },
        ]}
      >
        {selectedMedia && (
          <View style={styles.selectedMediaContainer}>
            <Image source={{ uri: selectedMedia.uri }} style={styles.selectedMediaPreview} />
            <TouchableOpacity
              style={styles.removeMedia}
              onPress={() => setSelectedMedia(null)}
            >
              <Feather name="x" size={12} color="#fff" />
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
              { backgroundColor: colors.muted, color: colors.foreground },
            ]}
            placeholder="Mesajınızı yazın..."
            placeholderTextColor={colors.mutedForeground}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={1000}
            onSubmitEditing={sendMessage}
          />

          <TouchableOpacity
            style={[
              styles.sendBtn,
              {
                backgroundColor:
                  text.trim() || selectedMedia ? colors.primary : colors.muted,
              },
            ]}
            onPress={sendMessage}
            disabled={isSending || (!text.trim() && !selectedMedia)}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Feather
                name="send"
                size={18}
                color={text.trim() || selectedMedia ? "#fff" : colors.mutedForeground}
              />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.inputFooter}>
          <Text style={[styles.questionsLeft, { color: colors.mutedForeground }]}>
            {questionsLeft === "∞" ? "Sınırsız soru" : `${questionsLeft} soru hakkın kaldı`}
          </Text>
          <TouchableOpacity onPress={() => setShowSub(true)}>
            <Text style={[styles.upgradeLink, { color: colors.primary }]}>
              {subscription.plan === "free" ? "Yükselt" : ""}
            </Text>
          </TouchableOpacity>
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
    (session: ChatSession) => {
      setActiveSessionId(session.id);
    },
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
    async (id: number) => {
      await deleteSession(id);
    },
    [deleteSession]
  );

  const handleBack = useCallback(() => {
    setActiveSessionId(null);
    if (activePetId) fetchSessions(activePetId);
  }, [setActiveSessionId, activePetId, fetchSessions]);

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  if (!activePet) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <Feather name="alert-circle" size={40} color={colors.mutedForeground} />
        <Text style={[styles.emptyTitle, { color: colors.foreground, marginTop: 12 }]}>
          Evcil hayvan bulunamadı
        </Text>
        <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
          Önce profil sekmesinden bir hayvan ekle.
        </Text>
      </View>
    );
  }

  if (activeSession) {
    return (
      <ChatView
        colors={colors}
        insets={insets}
        session={activeSession}
        onBack={handleBack}
      />
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

  sessionHeader: { paddingHorizontal: 20, paddingBottom: 16 },
  sessionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sessionHeaderTitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#fff" },
  sessionHeaderSub: { fontSize: 13, color: "rgba(255,255,255,0.7)", fontFamily: "Inter_400Regular", marginTop: 2 },
  newSessionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  newSessionBtnText: { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  newSessionForm: { marginTop: 14, gap: 10 },
  newSessionInput: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  iconPicker: { flexDirection: "row" },
  iconOption: {
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1.5,
    gap: 4,
  },
  iconLabel: { color: "#fff", fontSize: 10, fontFamily: "Inter_600SemiBold" },
  createBtn: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  createBtnText: { color: "#1d4ed8", fontSize: 15, fontFamily: "Inter_700Bold" },

  sessionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  sessionCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  sessionCardTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  sessionCardDate: { fontSize: 12, fontFamily: "Inter_400Regular" },

  emptyState: { flex: 1, alignItems: "center", paddingTop: 60, paddingHorizontal: 20 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, justifyContent: "center", alignItems: "center", marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 8, textAlign: "center" },
  emptyDesc: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
  },
  emptyBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },

  chatHeader: { paddingHorizontal: 16, paddingBottom: 14, flexDirection: "row", alignItems: "center", gap: 8 },
  backBtn: { padding: 4 },
  chatHeaderIcon: { width: 32, height: 32, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  chatHeaderTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
  chatHeaderSub: { fontSize: 11, color: "rgba(255,255,255,0.7)", fontFamily: "Inter_400Regular" },
  clearBtn: { padding: 8, borderRadius: 10 },

  userMsgRow: { alignItems: "flex-end", marginBottom: 12 },
  userBubble: { maxWidth: "80%", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, borderBottomRightRadius: 4 },
  userText: { color: "#fff", fontSize: 14.5, fontFamily: "Inter_400Regular", lineHeight: 22 },
  msgImage: { width: 200, height: 150, borderRadius: 12, marginBottom: 4 },

  aiBubbleWrapper: { marginBottom: 16 },
  aiAvatarRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  aiAvatar: { width: 28, height: 28, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  aiName: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  aiBubble: {
    maxWidth: "90%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderTopLeftRadius: 4,
    borderWidth: 1,
  },

  taskSuggestionsContainer: { marginTop: 8, gap: 8 },
  taskSuggestion: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 10,
  },
  taskSuggestInfo: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  taskSuggestIcon: { width: 32, height: 32, borderRadius: 8, justifyContent: "center", alignItems: "center" },
  taskSuggestTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 1 },
  taskSuggestDate: { fontSize: 11, fontFamily: "Inter_400Regular" },
  taskSuggestBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  taskSuggestBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },

  welcomeContainer: { flex: 1, alignItems: "center", paddingTop: 40, paddingHorizontal: 20 },
  welcomeAvatar: { width: 80, height: 80, borderRadius: 40, justifyContent: "center", alignItems: "center", marginBottom: 16 },
  welcomeTitle: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 8, textAlign: "center" },
  welcomeDesc: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  quickChips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 20, justifyContent: "center" },
  quickChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  quickChipText: { fontSize: 13, fontFamily: "Inter_500Medium" },

  inputBar: { borderTopWidth: 1, paddingHorizontal: 12, paddingTop: 8 },
  selectedMediaContainer: { marginBottom: 8, position: "relative", alignSelf: "flex-start" },
  selectedMediaPreview: { width: 60, height: 60, borderRadius: 8 },
  removeMedia: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#EF4444",
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  inputRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  mediaBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  textInput: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 120,
    fontFamily: "Inter_400Regular",
  },
  sendBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  inputFooter: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, paddingHorizontal: 4 },
  questionsLeft: { fontSize: 11, fontFamily: "Inter_400Regular" },
  upgradeLink: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
});
