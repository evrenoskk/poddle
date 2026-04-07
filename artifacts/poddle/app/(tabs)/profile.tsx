import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  ActivityIndicator,
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
import { useApp, Pet } from "@/context/AppContext";
import { UserProfileModal } from "@/components/UserProfileModal";

const SPECIES_EMOJI: Record<string, string> = {
  Köpek: "🐕",
  Kedi: "🐈",
  Kuş: "🐦",
  Tavşan: "🐰",
  Diğer: "🐾",
};

const STATUS_OPTIONS = ["Mutlu", "Aktif", "Hasta", "Toparlanıyor", "Stresli"];

function AddEditPetModal({
  visible,
  onClose,
  editPet,
}: {
  visible: boolean;
  onClose: () => void;
  editPet?: Pet | null;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addPet, updatePet } = useApp();

  const [name, setName] = useState(editPet?.name || "");
  const [species, setSpecies] = useState(editPet?.species || "Köpek");
  const [breed, setBreed] = useState(editPet?.breed || "");
  const [age, setAge] = useState(editPet ? String(editPet.age) : "");
  const [weight, setWeight] = useState(editPet ? String(editPet.weight) : "");
  const [gender, setGender] = useState<"male" | "female">(editPet?.gender || "male");
  const [status, setStatus] = useState(editPet?.status || "Mutlu");
  const [imageUri, setImageUri] = useState<string | undefined>(editPet?.imageUri ?? undefined);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (editPet) {
      setName(editPet.name);
      setSpecies(editPet.species);
      setBreed(editPet.breed);
      setAge(String(editPet.age));
      setWeight(String(editPet.weight));
      setGender(editPet.gender);
      setStatus(editPet.status);
      setImageUri(editPet.imageUri ?? undefined);
    } else {
      setName(""); setSpecies("Köpek"); setBreed(""); setAge(""); setWeight(""); setGender("male"); setStatus("Mutlu"); setImageUri(undefined);
    }
  }, [editPet, visible]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled && result.assets[0]) setImageUri(result.assets[0].uri);
  };

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert("Hata", "İsim gereklidir."); return; }
    setSaving(true);
    try {
      const petData = {
        name: name.trim(),
        species,
        breed: breed.trim() || species,
        age: parseInt(age) || 1,
        weight: parseFloat(weight) || 5,
        gender,
        imageUri: imageUri ?? null,
        status,
      };
      if (editPet) {
        await updatePet({ ...editPet, ...petData });
      } else {
        await addPet(petData);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onClose();
    } catch (err: any) {
      Alert.alert("Hata", err.message || "Kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <ScrollView keyboardShouldPersistTaps="handled">
          <View
            style={[
              styles.modalSheet,
              {
                backgroundColor: colors.card,
                paddingBottom: insets.bottom + 20,
                marginTop: insets.top + (Platform.OS === "web" ? 67 : 0) + 30,
              },
            ]}
          >
            <View style={styles.handle} />
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                {editPet ? "Profili Düzenle" : "Evcil Hayvan Ekle"}
              </Text>
              <TouchableOpacity onPress={onClose} disabled={saving}>
                <Feather name="x" size={22} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={pickImage} style={styles.imagePickerBtn} activeOpacity={0.8}>
              {imageUri ? (
                <View style={styles.pickedImageWrapper}>
                  <Image source={{ uri: imageUri }} style={styles.pickedImage} contentFit="cover" />
                  <View style={styles.cameraOverlay}>
                    <Feather name="camera" size={18} color="#fff" />
                  </View>
                </View>
              ) : (
                <View style={[styles.imagePlaceholder, { backgroundColor: colors.primaryLight }]}>
                  <Feather name="camera" size={28} color={colors.primary} />
                  <Text style={[styles.imagePickerText, { color: colors.primary }]}>Fotoğraf Ekle</Text>
                </View>
              )}
            </TouchableOpacity>

            <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>İsim *</Text>
            <TextInput
              style={[styles.textInput, { borderColor: colors.border, backgroundColor: colors.background, color: colors.foreground }]}
              placeholder="Buddy"
              placeholderTextColor={colors.mutedForeground}
              value={name}
              onChangeText={setName}
            />

            <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>Tür</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              {["Köpek", "Kedi", "Kuş", "Tavşan", "Diğer"].map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setSpecies(s)}
                  style={[
                    styles.chip,
                    { borderColor: colors.primary, backgroundColor: species === s ? colors.primary : "transparent", marginRight: 8 },
                  ]}
                >
                  <Text style={{ fontSize: 16 }}>{SPECIES_EMOJI[s]}</Text>
                  <Text style={[styles.chipText, { color: species === s ? "#fff" : colors.primary }]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>Irk</Text>
            <TextInput
              style={[styles.textInput, { borderColor: colors.border, backgroundColor: colors.background, color: colors.foreground }]}
              placeholder="Golden Retriever"
              placeholderTextColor={colors.mutedForeground}
              value={breed}
              onChangeText={setBreed}
            />

            <View style={styles.twoCol}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>Yaş</Text>
                <TextInput
                  style={[styles.textInput, { borderColor: colors.border, backgroundColor: colors.background, color: colors.foreground }]}
                  placeholder="3"
                  placeholderTextColor={colors.mutedForeground}
                  value={age}
                  onChangeText={setAge}
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>Kilo (kg)</Text>
                <TextInput
                  style={[styles.textInput, { borderColor: colors.border, backgroundColor: colors.background, color: colors.foreground }]}
                  placeholder="15"
                  placeholderTextColor={colors.mutedForeground}
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>Cinsiyet</Text>
            <View style={styles.chipRow}>
              <TouchableOpacity
                onPress={() => setGender("male")}
                style={[styles.chip, { borderColor: "#2563EB", backgroundColor: gender === "male" ? "#2563EB" : "transparent", flex: 1, justifyContent: "center" }]}
              >
                <Text style={{ fontSize: 16 }}>♂</Text>
                <Text style={[styles.chipText, { color: gender === "male" ? "#fff" : "#2563EB" }]}>Erkek</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setGender("female")}
                style={[styles.chip, { borderColor: "#EC4899", backgroundColor: gender === "female" ? "#EC4899" : "transparent", flex: 1, justifyContent: "center" }]}
              >
                <Text style={{ fontSize: 16 }}>♀</Text>
                <Text style={[styles.chipText, { color: gender === "female" ? "#fff" : "#EC4899" }]}>Dişi</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>Durum</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              {STATUS_OPTIONS.map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setStatus(s)}
                  style={[
                    styles.chip,
                    { borderColor: colors.primary, backgroundColor: status === s ? colors.primary : "transparent", marginRight: 8 },
                  ]}
                >
                  <Text style={[styles.chipText, { color: status === s ? "#fff" : colors.primary }]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: saving ? colors.mutedForeground : colors.primary }]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.addBtnText}>{editPet ? "Kaydet" : "Ekle"}</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

function PetCard({
  pet,
  isActive,
  onPress,
  colors,
}: {
  pet: Pet;
  isActive: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.petCard,
        {
          backgroundColor: colors.card,
          borderColor: isActive ? colors.primary : colors.border,
          borderWidth: isActive ? 2 : 1,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {pet.imageUri ? (
        <Image source={{ uri: pet.imageUri }} style={styles.petCardImage} contentFit="cover" />
      ) : (
        <View style={[styles.petCardImagePlaceholder, { backgroundColor: colors.primaryLight }]}>
          <Text style={styles.petCardEmoji}>{SPECIES_EMOJI[pet.species] || "🐾"}</Text>
        </View>
      )}
      {isActive && (
        <View style={[styles.activeIndicator, { backgroundColor: colors.primary }]}>
          <Feather name="check" size={10} color="#fff" />
        </View>
      )}
      <View style={styles.petCardInfo}>
        <Text style={[styles.petCardName, { color: colors.foreground }]} numberOfLines={1}>
          {pet.name}
        </Text>
        <Text style={[styles.petCardBreed, { color: colors.mutedForeground }]} numberOfLines={1}>
          {pet.breed || pet.species}
        </Text>
        <View style={[styles.statusDot, { backgroundColor: pet.status === "Hasta" ? "#EF4444" : "#10B981" }]} />
      </View>
    </TouchableOpacity>
  );
}

function PetDetailView({
  pet,
  onBack,
  onEdit,
  colors,
  insets,
  topInset,
}: {
  pet: Pet;
  onBack: () => void;
  onEdit: () => void;
  colors: ReturnType<typeof useColors>;
  insets: ReturnType<typeof useSafeAreaInsets>;
  topInset: number;
}) {
  const { tasks, healthLogs, setActivePetId, activePetId, deletePet } = useApp();
  const TAB_BAR_HEIGHT = Platform.OS === "web" ? 84 : 66;
  const petTasks = tasks.filter((t) => t.petId === String(pet.id));
  const completedTasks = petTasks.filter((t) => t.completed).length;
  const pendingTasks = petTasks.filter((t) => !t.completed).length;
  const petLogs = healthLogs.filter((l) => l.petId === pet.id);
  const isActive = activePetId === pet.id;

  const stats = [
    { label: "Yaş", value: `${pet.age} yaş`, icon: "calendar" },
    { label: "Kilo", value: `${pet.weight} kg`, icon: "activity" },
    { label: "Cinsiyet", value: pet.gender === "male" ? "Erkek" : "Dişi", icon: "user" },
  ];

  const handleDelete = () => {
    Alert.alert(
      `${pet.name}'i Sil`,
      "Bu hayvanı ve tüm verilerini kalıcı olarak silmek istediğine emin misin?",
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            await deletePet(pet.id);
            onBack();
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + 20 }}
    >
      <LinearGradient
        colors={[colors.primary, "#1d4ed8"]}
        style={[styles.detailHeader, { paddingTop: topInset + 8 }]}
      >
        <View style={styles.detailHeaderRow}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onEdit}
            style={[styles.editBtn, { backgroundColor: "rgba(255,255,255,0.2)" }]}
          >
            <Feather name="edit-2" size={16} color="#fff" />
            <Text style={styles.editBtnText}>Düzenle</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.detailHero}>
          {pet.imageUri ? (
            <Image source={{ uri: pet.imageUri }} style={styles.detailAvatar} contentFit="cover" />
          ) : (
            <View style={[styles.detailAvatarPlaceholder, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
              <Text style={styles.detailAvatarEmoji}>{SPECIES_EMOJI[pet.species] || "🐾"}</Text>
            </View>
          )}
          <Text style={styles.detailName}>{pet.name}</Text>
          <Text style={styles.detailBreed}>{pet.breed || pet.species} · {pet.species}</Text>
          <View style={styles.detailStatusBadge}>
            <View style={[styles.detailStatusDot, { backgroundColor: pet.status === "Hasta" ? "#FCA5A5" : "#6EE7B7" }]} />
            <Text style={styles.detailStatusText}>{pet.status}</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={{ paddingHorizontal: 16, marginTop: -20 }}>
        {!isActive && (
          <TouchableOpacity
            style={[styles.setActiveBtn, { backgroundColor: colors.primary }]}
            onPress={() => setActivePetId(pet.id)}
          >
            <MaterialCommunityIcons name="paw" size={16} color="#fff" />
            <Text style={styles.setActiveBtnText}>Aktif Hayvan Olarak Seç</Text>
          </TouchableOpacity>
        )}
        {isActive && (
          <View style={[styles.setActiveBtn, { backgroundColor: "#10B981" }]}>
            <Feather name="check-circle" size={16} color="#fff" />
            <Text style={styles.setActiveBtnText}>Aktif Hayvan</Text>
          </View>
        )}

        <View style={styles.statsRow}>
          {stats.map((stat) => (
            <View key={stat.label} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name={stat.icon as any} size={16} color={colors.primary} />
              <Text style={[styles.statValue, { color: colors.foreground }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Özet</Text>
        <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {[
            { icon: "check-square", label: "Tamamlanan Görev", value: String(completedTasks), color: "#10B981" },
            { icon: "clock", label: "Bekleyen Görev", value: String(pendingTasks), color: "#F59E0B" },
            { icon: "activity", label: "Sağlık Kaydı", value: String(petLogs.length), color: "#3B82F6" },
          ].map((item, idx) => (
            <View
              key={item.label}
              style={[
                styles.summaryRow,
                idx < 2 && { borderBottomWidth: 0.5, borderBottomColor: colors.border },
              ]}
            >
              <View style={[styles.summaryIcon, { backgroundColor: item.color + "15" }]}>
                <Feather name={item.icon as any} size={16} color={item.color} />
              </View>
              <Text style={[styles.summaryLabel, { color: colors.foreground }]}>{item.label}</Text>
              <Text style={[styles.summaryValue, { color: item.color }]}>{item.value}</Text>
            </View>
          ))}
        </View>

        {petLogs.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Son Kayıtlar</Text>
            <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {petLogs.slice(0, 3).map((log, idx) => {
                const diffDays = Math.floor((Date.now() - new Date(log.loggedAt).getTime()) / 86400000);
                const dateLabel = diffDays === 0 ? "Bugün" : diffDays === 1 ? "Dün" : `${diffDays} gün önce`;
                return (
                  <View
                    key={log.id}
                    style={[styles.summaryRow, idx < Math.min(2, petLogs.length - 1) && { borderBottomWidth: 0.5, borderBottomColor: colors.border }]}
                  >
                    <View style={[styles.summaryIcon, { backgroundColor: colors.primaryLight }]}>
                      <Feather name="activity" size={14} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.summaryLabel, { color: colors.foreground }]}>{log.value}</Text>
                      <Text style={[styles.summaryDate, { color: colors.mutedForeground }]}>{log.logType} · {dateLabel}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}

        <TouchableOpacity style={[styles.deleteBtn, { borderColor: "#EF444440", backgroundColor: "#FEF2F2" }]} onPress={handleDelete}>
          <Feather name="trash-2" size={16} color="#EF4444" />
          <Text style={[styles.deleteBtnText, { color: "#EF4444" }]}>{pet.name}'i Sil</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

export default function PetLibraryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { pets, activePetId } = useApp();

  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [showAddEdit, setShowAddEdit] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [showUserProfile, setShowUserProfile] = useState(false);

  const topInset = insets.top + (Platform.OS === "web" ? 67 : 0);
  const TAB_BAR_HEIGHT = Platform.OS === "web" ? 84 : 66;

  const handleEdit = () => {
    setEditingPet(selectedPet);
    setShowAddEdit(true);
  };

  const handleAddNew = () => {
    setEditingPet(null);
    setShowAddEdit(true);
  };

  if (selectedPet) {
    const latestPet = pets.find((p) => p.id === selectedPet.id) || selectedPet;
    return (
      <>
        <PetDetailView
          pet={latestPet}
          onBack={() => setSelectedPet(null)}
          onEdit={handleEdit}
          colors={colors}
          insets={insets}
          topInset={topInset}
        />
        <AddEditPetModal
          visible={showAddEdit}
          onClose={() => { setShowAddEdit(false); setEditingPet(null); }}
          editPet={editingPet}
        />
      </>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.primary, "#1d4ed8"]}
        style={[styles.header, { paddingTop: topInset + 12 }]}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Evcil Hayvanlarım</Text>
            <Text style={styles.headerSub}>{pets.length} hayvan kayıtlı</Text>
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity
              style={[styles.headerIconBtn, { backgroundColor: "rgba(255,255,255,0.15)" }]}
              onPress={() => setShowUserProfile(true)}
            >
              <Feather name="user" size={18} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.headerIconBtn, { backgroundColor: "rgba(255,255,255,0.2)" }]}
              onPress={handleAddNew}
            >
              <Feather name="plus" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_HEIGHT + 20 }}
      >
        {pets.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🐾</Text>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Henüz hayvan eklenmedi</Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
              İlk evcil hayvanını ekleyerek başla
            </Text>
            <TouchableOpacity
              style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
              onPress={handleAddNew}
            >
              <Feather name="plus" size={16} color="#fff" />
              <Text style={styles.emptyBtnText}>Hayvan Ekle</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.petGrid}>
            {pets.map((pet) => (
              <PetCard
                key={pet.id}
                pet={pet}
                isActive={activePetId === pet.id}
                onPress={() => setSelectedPet(pet)}
                colors={colors}
              />
            ))}
            <TouchableOpacity
              style={[styles.addPetCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={handleAddNew}
            >
              <View style={[styles.addPetIcon, { backgroundColor: colors.primaryLight }]}>
                <Feather name="plus" size={24} color={colors.primary} />
              </View>
              <Text style={[styles.addPetLabel, { color: colors.primary }]}>Yeni Ekle</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <AddEditPetModal
        visible={showAddEdit}
        onClose={() => { setShowAddEdit(false); setEditingPet(null); }}
        editPet={editingPet}
      />

      <UserProfileModal
        visible={showUserProfile}
        onClose={() => setShowUserProfile(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 10 },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: "#D1D5DB", alignSelf: "center", marginBottom: 14 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },

  imagePickerBtn: { alignSelf: "center", marginBottom: 20 },
  pickedImageWrapper: { position: "relative" },
  pickedImage: { width: 100, height: 100, borderRadius: 50 },
  cameraOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
  },
  imagePlaceholder: { width: 100, height: 100, borderRadius: 50, justifyContent: "center", alignItems: "center", gap: 4 },
  imagePickerText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },

  inputLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", marginBottom: 6 },
  textInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, fontFamily: "Inter_400Regular", marginBottom: 14 },
  twoCol: { flexDirection: "row", gap: 12 },
  chipRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  chip: { flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  chipText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  addBtn: { borderRadius: 14, paddingVertical: 14, alignItems: "center", marginTop: 8 },
  addBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },

  header: { paddingHorizontal: 20, paddingBottom: 16 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerTitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#fff" },
  headerSub: { fontSize: 12, color: "rgba(255,255,255,0.7)", fontFamily: "Inter_400Regular", marginTop: 2 },
  headerIconBtn: { width: 38, height: 38, borderRadius: 19, justifyContent: "center", alignItems: "center" },

  petGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  petCard: {
    width: "47%",
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
  },
  petCardImage: { width: "100%", height: 130 },
  petCardImagePlaceholder: { width: "100%", height: 130, justifyContent: "center", alignItems: "center" },
  petCardEmoji: { fontSize: 48 },
  activeIndicator: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },
  petCardInfo: { padding: 10, position: "relative" },
  petCardName: { fontSize: 15, fontFamily: "Inter_700Bold" },
  petCardBreed: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  statusDot: { position: "absolute", top: 12, right: 10, width: 8, height: 8, borderRadius: 4 },

  addPetCard: {
    width: "47%",
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: "dashed",
    height: 167,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  addPetIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: "center", alignItems: "center" },
  addPetLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },

  emptyState: { alignItems: "center", paddingTop: 60 },
  emptyEmoji: { fontSize: 60, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 8 },
  emptyDesc: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  emptyBtn: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 24, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14 },
  emptyBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },

  detailHeader: { paddingHorizontal: 20, paddingBottom: 40 },
  detailHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  backBtn: { padding: 4 },
  editBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  editBtnText: { color: "#fff", fontSize: 13, fontFamily: "Inter_600SemiBold" },

  detailHero: { alignItems: "center", gap: 8, paddingBottom: 10 },
  detailAvatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: "rgba(255,255,255,0.4)" },
  detailAvatarPlaceholder: { width: 100, height: 100, borderRadius: 50, justifyContent: "center", alignItems: "center" },
  detailAvatarEmoji: { fontSize: 50 },
  detailName: { fontSize: 28, fontFamily: "Inter_700Bold", color: "#fff", marginTop: 4 },
  detailBreed: { fontSize: 14, color: "rgba(255,255,255,0.8)", fontFamily: "Inter_400Regular" },
  detailStatusBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  detailStatusDot: { width: 8, height: 8, borderRadius: 4 },
  detailStatusText: { color: "#fff", fontSize: 12, fontFamily: "Inter_600SemiBold" },

  setActiveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 12, borderRadius: 14, marginBottom: 16 },
  setActiveBtnText: { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold" },

  statsRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  statCard: { flex: 1, alignItems: "center", padding: 12, borderRadius: 14, borderWidth: 1, gap: 4 },
  statValue: { fontSize: 14, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },

  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 10 },
  summaryCard: { borderRadius: 14, borderWidth: 1, marginBottom: 20, overflow: "hidden" },
  summaryRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 13 },
  summaryIcon: { width: 34, height: 34, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  summaryLabel: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium" },
  summaryValue: { fontSize: 16, fontFamily: "Inter_700Bold" },
  summaryDate: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },

  deleteBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 10 },
  deleteBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
});
