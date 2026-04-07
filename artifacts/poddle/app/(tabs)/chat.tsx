import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useRef, useState } from "react";
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
} from "react-native";
import Markdown from "react-native-markdown-display";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
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

function MessageBubble({ msg, colors }: { msg: Msg; colors: ReturnType<typeof useColors> }) {
  const isUser = msg.role === "user";

  const markdownStyles = {
    body: { color: colors.foreground, fontSize: 14.5, lineHeight: 22 },
    heading1: { color: colors.foreground, fontSize: 17, fontWeight: "700" as const, marginBottom: 6, marginTop: 4 },
    heading2: { color: colors.foreground, fontSize: 15.5, fontWeight: "700" as const, marginBottom: 4, marginTop: 8 },
    heading3: { color: colors.primary, fontSize: 14, fontWeight: "700" as const, marginBottom: 2, marginTop: 6 },
    strong: { fontWeight: "700" as const, color: colors.foreground },
    em: { fontStyle: "italic" as const },
    bullet_list: { marginTop: 4, marginBottom: 4 },
    ordered_list: { marginTop: 4, marginBottom: 4 },
    list_item: { marginBottom: 3 },
    bullet_list_icon: { color: colors.primary, marginTop: 6 },
    blockquote: {
      backgroundColor: "rgba(239, 68, 68, 0.08)",
      borderLeftColor: "#ef4444",
      borderLeftWidth: 3,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 4,
      marginVertical: 6,
    },
    code_inline: {
      backgroundColor: colors.primaryLight,
      color: colors.primary,
      paddingHorizontal: 4,
      paddingVertical: 1,
      borderRadius: 3,
      fontSize: 13,
    },
    fence: {
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 10,
      marginVertical: 6,
    },
    hr: { backgroundColor: colors.border, height: 1, marginVertical: 8 },
  };

  return (
    <View style={[styles.msgRow, isUser ? styles.msgRowUser : styles.msgRowAssistant]}>
      {!isUser && (
        <View style={[styles.aiAvatar, { backgroundColor: colors.primary }]}>
          <MaterialCommunityIcons name="robot-happy-outline" size={17} color="#fff" />
        </View>
      )}
      <View style={{ maxWidth: "82%", gap: 4 }}>
        {msg.mediaUri && (
          <Image
            source={{ uri: msg.mediaUri }}
            style={styles.msgImage}
            contentFit="cover"
          />
        )}
        <View
          style={[
            styles.bubble,
            isUser
              ? { backgroundColor: colors.primary }
              : { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
          ]}
        >
          {isUser ? (
            <Text style={[styles.bubbleText, { color: "#fff" }]}>{msg.content}</Text>
          ) : (
            <Markdown style={markdownStyles}>{msg.content}</Markdown>
          )}
        </View>
        <Text style={[styles.msgTime, { color: colors.mutedForeground, textAlign: isUser ? "right" : "left" }]}>
          {new Date(msg.timestamp).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
        </Text>
      </View>
    </View>
  );
}

export default function ChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { messages, addMessage, updateMessage, clearMessages, subscription, canAskQuestion, useQuestion, pets, activePetId, healthLogs } = useApp();
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<{ uri: string; type: "image" | "video" } | null>(null);
  const [showSub, setShowSub] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const TAB_BAR_HEIGHT = Platform.OS === "web" ? 84 : 66;
  const topInset = insets.top + (Platform.OS === "web" ? 67 : 0);
  const bottomInset = TAB_BAR_HEIGHT;

  const activePet = pets.find((p) => p.id === activePetId) ?? pets[0];

  const pickMedia = async (mediaType: "image" | "video") => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: mediaType === "image"
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

    try {
      let petContext = activePet
        ? `Evcil hayvan: ${activePet.name}, Tür: ${activePet.species}, Irk: ${activePet.breed}, Yaş: ${activePet.age}, Kilo: ${activePet.weight}kg, Cinsiyet: ${activePet.gender === "male" ? "Erkek" : "Dişi"}, Durum: ${activePet.status}.`
        : "";

      if (activePet && healthLogs.length > 0) {
        const recent = healthLogs.slice(0, 15);
        const logLines = recent.map((log) => {
          const date = new Date(log.loggedAt);
          const diffDays = Math.floor((Date.now() - date.getTime()) / 86400000);
          const dateLabel = diffDays === 0 ? "bugün" : diffDays === 1 ? "dün" : `${diffDays} gün önce`;
          return `  - ${dateLabel}: [${log.logType}] ${log.value}${log.notes ? ` — ${log.notes}` : ""}`;
        }).join("\n");
        petContext += `\n\nSon sağlık kayıtları (kronolojik):\n${logLines}`;
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
          const reader = new FileReader();
          imageBase64 = await new Promise<string>((resolve) => {
            reader.onloadend = () => {
              const result = reader.result as string;
              resolve(result.split(",")[1]);
            };
            reader.readAsDataURL(blob);
          });
        } catch {
          // ignore image encoding errors
        }
      }

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

      if (!response.ok) throw new Error("API hatası");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Stream alınamadı");

      const decoder = new TextDecoder();
      let fullContent = "";

      const streamingMsgId = Date.now().toString() + "stream";
      const streamingMsg: Msg = {
        id: streamingMsgId,
        role: "assistant",
        content: "▍",
        timestamp: new Date().toISOString(),
      };
      addMessage(streamingMsg);

      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const raw = line.slice(6).trim();
            if (!raw) continue;
            try {
              const parsed = JSON.parse(raw);
              if (parsed.content) {
                fullContent += parsed.content;
                updateMessage(streamingMsgId, fullContent + "▍");
              }
            } catch {
              // ignore parse errors
            }
          }
        }
      }

      const finalMsg: Msg = {
        id: streamingMsgId,
        role: "assistant",
        content: fullContent || "Üzgünüm, şu anda yanıt veremiyorum.",
        timestamp: new Date().toISOString(),
      };
      addMessage(finalMsg);
    } catch (err) {
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
  }, [text, selectedMedia, canAskQuestion, useQuestion, addMessage, messages, activePet, healthLogs]);

  const questionsLeft =
    subscription.plan === "monthly"
      ? "∞"
      : subscription.plan === "pay_per_question"
      ? "∞"
      : `${Math.max(0, subscription.freeQuestionsTotal - subscription.freeQuestionsUsed)}`;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.primary, "#1d4ed8"]}
        style={[styles.header, { paddingTop: topInset + 12 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerInner}>
          <View style={styles.headerLeft}>
            <View style={[styles.aiIcon, { backgroundColor: "rgba(255,255,255,0.15)", overflow: "hidden" }]}>
              <PodleLogo size={40} rounded />
            </View>
            <View>
              <Text style={styles.headerTitle}>Poddle AI</Text>
              <Text style={styles.headerSub}>Veteriner Danışmanı</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <View style={[styles.quotaBadge, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
              <Text style={styles.quotaText}>{questionsLeft} soru</Text>
            </View>
            <TouchableOpacity onPress={clearMessages} style={styles.clearBtn}>
              <Feather name="refresh-ccw" size={18} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={[styles.disclaimer, { backgroundColor: "rgba(255,255,255,0.12)" }]}>
          <Feather name="info" size={12} color="rgba(255,255,255,0.9)" />
          <Text style={styles.disclaimerText}>
            Poddle bir veteriner danışmanıdır, tanı koymaz. Ciddi durumlarda veterinere başvurun.
          </Text>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "padding"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <FlatList
          ref={flatListRef}
          style={{ flex: 1 }}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MessageBubble msg={item} colors={colors} />}
          contentContainerStyle={[styles.msgList, { paddingBottom: 12 }]}
          inverted={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={() => (
            <View style={styles.emptyChat}>
              <View style={[styles.emptyChatIcon, { overflow: "hidden" }]}>
                <PodleLogo size={80} rounded />
              </View>
              <Text style={[styles.emptyChatTitle, { color: colors.foreground }]}>
                Merhaba! Ben Poddle
              </Text>
              <Text style={[styles.emptyChatDesc, { color: colors.mutedForeground }]}>
                Evcil hayvanınız hakkında bana soru sorabilirsiniz. Fotoğraf veya video yükleyerek durumunu analiz etmemi isteyebilirsiniz.
              </Text>
              {activePet && (
                <View style={[styles.petContext, { backgroundColor: colors.primaryLight }]}>
                  <Text style={[styles.petContextText, { color: colors.primary }]}>
                    {activePet.name} için hazırım
                  </Text>
                </View>
              )}
            </View>
          )}
          ListFooterComponent={isSending ? (
            <View style={[styles.msgRow, styles.msgRowAssistant]}>
              <View style={[styles.aiAvatar, { backgroundColor: colors.primary }]}>
                <MaterialCommunityIcons name="robot-happy-outline" size={17} color="#fff" />
              </View>
              <View style={[styles.bubble, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            </View>
          ) : null}
        />

        {selectedMedia && (
          <View style={[styles.mediaPreview, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
            <Image
              source={{ uri: selectedMedia.uri }}
              style={styles.mediaThumb}
              contentFit="cover"
            />
            <Text style={[styles.mediaLabel, { color: colors.foreground }]}>
              {selectedMedia.type === "image" ? "Fotoğraf seçildi" : "Video seçildi"}
            </Text>
            <TouchableOpacity onPress={() => setSelectedMedia(null)}>
              <Feather name="x-circle" size={22} color={colors.destructive} />
            </TouchableOpacity>
          </View>
        )}

        <View style={[styles.inputBar, {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          paddingBottom: bottomInset + 8,
        }]}>
          <TouchableOpacity onPress={() => pickMedia("image")} style={[styles.attachBtn, { backgroundColor: colors.primaryLight }]}>
            <Feather name="image" size={20} color={colors.primary} />
          </TouchableOpacity>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
            placeholder="Sorunuzu yazın..."
            placeholderTextColor={colors.mutedForeground}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            onPress={sendMessage}
            disabled={isSending || (!text.trim() && !selectedMedia)}
            style={[
              styles.sendBtn,
              { backgroundColor: (text.trim() || selectedMedia) && !isSending ? colors.primary : colors.muted },
            ]}
            activeOpacity={0.85}
          >
            <Feather name="send" size={18} color={(text.trim() || selectedMedia) && !isSending ? "#fff" : colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <SubscriptionModal
        visible={showSub}
        onClose={() => setShowSub(false)}
        onSelectPlan={(plan) => {
          // In production, integrate RevenueCat here
          setShowSub(false);
          Alert.alert("Teşekkürler!", `${plan === "monthly" ? "Aylık abonelik" : "Soru satın alma"} yakında aktif olacak.`);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    gap: 10,
  },
  headerInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  aiIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  headerSub: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.7)",
  },
  quotaBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  quotaText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  clearBtn: {
    padding: 4,
  },
  disclaimer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  disclaimerText: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.9)",
    flex: 1,
    lineHeight: 14,
  },
  msgList: {
    padding: 14,
    gap: 6,
  },
  msgRow: {
    flexDirection: "row",
    marginBottom: 8,
    alignItems: "flex-end",
    gap: 8,
  },
  msgRowUser: {
    justifyContent: "flex-end",
  },
  msgRowAssistant: {
    justifyContent: "flex-start",
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    maxWidth: "90%",
  },
  bubbleText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  msgTime: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
  },
  msgImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
  },
  emptyChat: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyChatIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emptyChatTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  emptyChatDesc: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  petContext: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 4,
  },
  petContextText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  mediaPreview: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderTopWidth: 1,
    gap: 10,
  },
  mediaThumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
  },
  mediaLabel: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 8,
  },
  attachBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  input: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    maxHeight: 120,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
});
