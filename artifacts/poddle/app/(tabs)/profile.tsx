import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
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
import { useApp, Pet } from "@/context/AppContext";
import { PawIcon } from "@/components/PawIcon";

function AddPetModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addPet, setActivePetId } = useApp();
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("Köpek");
  const [breed, setBreed] = useState("");
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [imageUri, setImageUri] = useState<string | undefined>();

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleAdd = () => {
    if (!name.trim()) {
      Alert.alert("Hata", "İsim gereklidir.");
      return;
    }
    const newPet: Pet = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      name: name.trim(),
      species,
      breed: breed.trim() || species,
      age: parseInt(age) || 1,
      weight: parseFloat(weight) || 5,
      gender,
      imageUri,
      status: "Mutlu",
    };
    addPet(newPet);
    setActivePetId(newPet.id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setName("");
    setSpecies("Köpek");
    setBreed("");
    setAge("");
    setWeight("");
    setGender("male");
    setImageUri(undefined);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <ScrollView>
          <View
            style={[
              styles.modalSheet,
              {
                backgroundColor: colors.card,
                paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 20,
                marginTop: insets.top + (Platform.OS === "web" ? 67 : 0) + 40,
              },
            ]}
          >
            <View style={styles.handle} />
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>Evcil Hayvan Ekle</Text>
              <TouchableOpacity onPress={onClose}>
                <Feather name="x" size={22} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={pickImage} style={styles.imagePickerBtn} activeOpacity={0.8}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.pickedImage} contentFit="cover" />
              ) : (
                <View style={[styles.imagePlaceholder, { backgroundColor: colors.primaryLight }]}>
                  <Feather name="camera" size={28} color={colors.primary} />
                  <Text style={[styles.imagePickerText, { color: colors.primary }]}>Fotoğraf ekle</Text>
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
            <View style={styles.chipRow}>
              {["Köpek", "Kedi", "Kuş", "Tavşan", "Diğer"].map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setSpecies(s)}
                  style={[
                    styles.chip,
                    { borderColor: colors.primary, backgroundColor: species === s ? colors.primary : "transparent" },
                  ]}
                >
                  <Text style={[styles.chipText, { color: species === s ? "#fff" : colors.primary }]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>

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
                style={[styles.chip, { borderColor: "#2563EB", backgroundColor: gender === "male" ? "#2563EB" : "transparent" }]}
              >
                <Text style={[styles.chipText, { color: gender === "male" ? "#fff" : "#2563EB" }]}>Erkek</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setGender("female")}
                style={[styles.chip, { borderColor: "#EC4899", backgroundColor: gender === "female" ? "#EC4899" : "transparent" }]}
              >
                <Text style={[styles.chipText, { color: gender === "female" ? "#fff" : "#EC4899" }]}>Dişi</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={handleAdd} activeOpacity={0.85}>
              <Text style={styles.addBtnText}>Ekle</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { pets, activePetId, setActivePetId, deletePet, subscription } = useApp();
  const [showAddPet, setShowAddPet] = useState(false);

  const topInset = insets.top + (Platform.OS === "web" ? 67 : 0);
  const bottomInset = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  const planLabel =
    subscription.plan === "monthly"
      ? "Aylık Premium"
      : subscription.plan === "pay_per_question"
      ? "Soru Başına"
      : "Ücretsiz";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.primary, "#1d4ed8"]}
        style={[styles.header, { paddingTop: topInset + 12 }]}
      >
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Profil</Text>
          <TouchableOpacity
            style={[styles.addPetHeaderBtn, { backgroundColor: "rgba(255,255,255,0.2)" }]}
            onPress={() => setShowAddPet(true)}
          >
            <Feather name="plus" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: bottomInset + 80 }}
      >
        {/* Subscription Info */}
        <View style={[styles.subCard, { backgroundColor: colors.primary }]}>
          <LinearGradient
            colors={[colors.primary, "#1d4ed8"]}
            style={styles.subCardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.subInfo}>
              <View style={[styles.subIconBox, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
                <PawIcon size={20} color="#fff" />
              </View>
              <View>
                <Text style={styles.subPlan}>{planLabel}</Text>
                <Text style={styles.subDetail}>
                  {subscription.plan === "free"
                    ? `${subscription.freeQuestionsTotal - subscription.freeQuestionsUsed}/${subscription.freeQuestionsTotal} soru kaldı`
                    : "Sınırsız AI danışmanlık"}
                </Text>
              </View>
            </View>
            {subscription.plan === "free" && (
              <View style={[styles.upgradeBar, { backgroundColor: "rgba(255,255,255,0.1)" }]}>
                <View
                  style={[
                    styles.upgradeBarFill,
                    {
                      width: `${((subscription.freeQuestionsTotal - subscription.freeQuestionsUsed) / subscription.freeQuestionsTotal) * 100}%`,
                      backgroundColor: "rgba(255,255,255,0.7)",
                    },
                  ]}
                />
              </View>
            )}
          </LinearGradient>
        </View>

        {/* Pets List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Evcil Hayvanlarım</Text>
            <TouchableOpacity onPress={() => setShowAddPet(true)}>
              <Text style={[styles.sectionLink, { color: colors.primary }]}>+ Ekle</Text>
            </TouchableOpacity>
          </View>

          {pets.length === 0 ? (
            <TouchableOpacity
              style={[styles.emptyPets, { borderColor: colors.border }]}
              onPress={() => setShowAddPet(true)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="dog" size={44} color={colors.mutedForeground} />
              <Text style={[styles.emptyPetsText, { color: colors.mutedForeground }]}>
                Henüz evcil hayvan yok. Eklemek için dokun.
              </Text>
            </TouchableOpacity>
          ) : (
            pets.map((pet) => (
              <TouchableOpacity
                key={pet.id}
                style={[
                  styles.petItem,
                  {
                    backgroundColor: colors.card,
                    borderColor: activePetId === pet.id ? colors.primary : colors.border,
                    borderWidth: activePetId === pet.id ? 2 : 1,
                  },
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setActivePetId(pet.id);
                }}
                activeOpacity={0.9}
              >
                <View style={[styles.petAvatar, { backgroundColor: colors.primaryLight }]}>
                  {pet.imageUri ? (
                    <Image source={{ uri: pet.imageUri }} style={styles.petAvatarImage} contentFit="cover" />
                  ) : (
                    <MaterialCommunityIcons name="dog" size={28} color={colors.primary} />
                  )}
                </View>
                <View style={styles.petDetails}>
                  <View style={styles.petNameRow}>
                    <Text style={[styles.petName, { color: colors.foreground }]}>{pet.name}</Text>
                    {activePetId === pet.id && (
                      <View style={[styles.activeBadge, { backgroundColor: colors.accent }]}>
                        <Text style={styles.activeBadgeText}>Aktif</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.petBreed, { color: colors.mutedForeground }]}>
                    {pet.species} · {pet.breed} · {pet.age} yaş · {pet.weight}kg
                  </Text>
                  <Text style={[styles.petGender, { color: colors.mutedForeground }]}>
                    {pet.gender === "male" ? "Erkek" : "Dişi"}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    Alert.alert("Sil", `${pet.name}'i silmek istediğinize emin misiniz?`, [
                      { text: "İptal", style: "cancel" },
                      {
                        text: "Sil",
                        style: "destructive",
                        onPress: () => {
                          deletePet(pet.id);
                          if (activePetId === pet.id) setActivePetId(null);
                        },
                      },
                    ]);
                  }}
                  style={styles.deleteBtn}
                >
                  <Feather name="trash-2" size={18} color={colors.destructive} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* App Info */}
        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.infoTitle, { color: colors.foreground }]}>Poddle Hakkında</Text>
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
            Poddle, evcil hayvanlarınızın sağlığını takip etmenize yardımcı olan bir AI veteriner danışmanıdır.
            Tanı koymaz; sadece bilgi ve rehberlik sunar. Ciddi sağlık sorunlarında mutlaka bir veterinere
            başvurunuz.
          </Text>
          <View style={[styles.infoDivider, { backgroundColor: colors.border }]} />
          <Text style={[styles.infoVersion, { color: colors.mutedForeground }]}>Poddle v1.0.0</Text>
        </View>
      </ScrollView>

      <AddPetModal visible={showAddPet} onClose={() => setShowAddPet(false)} />
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
  addPetHeaderBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  subCard: {
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 20,
  },
  subCardGradient: {
    padding: 16,
    gap: 12,
  },
  subInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  subIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  subPlan: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  subDetail: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.75)",
    marginTop: 2,
  },
  upgradeBar: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  upgradeBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  sectionLink: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  emptyPets: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    gap: 12,
    borderStyle: "dashed",
  },
  emptyPetsText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  petItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    gap: 12,
  },
  petAvatar: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  petAvatarImage: {
    width: 52,
    height: 52,
  },
  petDetails: {
    flex: 1,
    gap: 3,
  },
  petNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  petName: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },
  activeBadgeText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  petBreed: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  petGender: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  deleteBtn: {
    padding: 6,
  },
  infoCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  infoText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  infoDivider: {
    height: 1,
    marginVertical: 4,
  },
  infoVersion: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    flex: 1,
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
  imagePickerBtn: {
    alignSelf: "center",
    marginBottom: 8,
  },
  pickedImage: {
    width: 100,
    height: 100,
    borderRadius: 20,
  },
  imagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  imagePickerText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  inputLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginBottom: 6,
    marginTop: 12,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  chipText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  twoCol: {
    flexDirection: "row",
    gap: 12,
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
