import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppContext } from "@/context/AppContext";

function PawIcon({ size = 40 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontSize: size * 0.72, lineHeight: size }}>🐾</Text>
    </View>
  );
}

export default function LoginScreen() {
  const { login } = useAppContext();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);
  const passRef = useRef<TextInput>(null);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  function shake() {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 40, useNativeDriver: true }),
    ]).start();
  }

  async function handleLogin() {
    if (!email.trim() || !password) {
      setError("E-posta ve şifre gereklidir.");
      shake();
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await login(email.trim(), password);
      router.replace("/(tabs)");
    } catch (e: any) {
      setError(e.message || "Giriş başarısız.");
      shake();
    } finally {
      setLoading(false);
    }
  }

  const safeTop = insets.top + (Platform.OS === "web" ? 0 : 20);

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={["#0f172a", "#1e3a8a", "#2563eb"]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative circles */}
      <View style={[styles.decorCircle1, { top: safeTop + 80 }]} />
      <View style={[styles.decorCircle2, { top: safeTop + 20 }]} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Hero section */}
          <View style={[styles.hero, { paddingTop: safeTop + 48 }]}>
            <View style={styles.logoWrap}>
              <LinearGradient
                colors={["rgba(255,255,255,0.25)", "rgba(255,255,255,0.08)"]}
                style={styles.logoGlass}
              >
                <PawIcon size={38} />
              </LinearGradient>
            </View>
            <Text style={styles.brandName}>Poddle</Text>
            <Text style={styles.brandSub}>AI destekli evcil hayvan asistanın</Text>
          </View>

          {/* Card */}
          <Animated.View style={[styles.card, { transform: [{ translateX: shakeAnim }] }]}>
            <Text style={styles.cardTitle}>Hoş geldin</Text>
            <Text style={styles.cardSub}>Hesabına giriş yap</Text>

            {error ? (
              <View style={styles.errorRow}>
                <Feather name="alert-circle" size={14} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Email */}
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>E-posta</Text>
              <View style={[styles.inputBox, emailFocused && styles.inputBoxFocused]}>
                <Feather name="mail" size={16} color={emailFocused ? "#2563eb" : "#9CA3AF"} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="ornek@email.com"
                  placeholderTextColor="#C4C4CC"
                  value={email}
                  onChangeText={(t) => { setEmail(t); setError(null); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  onSubmitEditing={() => passRef.current?.focus()}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Şifre</Text>
              <View style={[styles.inputBox, passFocused && styles.inputBoxFocused]}>
                <Feather name="lock" size={16} color={passFocused ? "#2563eb" : "#9CA3AF"} style={styles.inputIcon} />
                <TextInput
                  ref={passRef}
                  style={[styles.input, { flex: 1 }]}
                  placeholder="••••••••"
                  placeholderTextColor="#C4C4CC"
                  value={password}
                  onChangeText={(t) => { setPassword(t); setError(null); }}
                  secureTextEntry={!showPass}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                  onFocus={() => setPassFocused(true)}
                  onBlur={() => setPassFocused(false)}
                />
                <TouchableOpacity
                  onPress={() => setShowPass((v) => !v)}
                  style={styles.eyeBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Feather
                    name={showPass ? "eye" : "eye-off"}
                    size={17}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Login button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.88}
              style={styles.btnWrap}
            >
              <LinearGradient
                colors={["#2563eb", "#1d4ed8"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.btn}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.btnText}>Giriş Yap</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ya da</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Sign up */}
            <TouchableOpacity
              onPress={() => router.push("/signup")}
              style={styles.secondaryBtn}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryBtnText}>Hesap Oluştur</Text>
            </TouchableOpacity>
          </Animated.View>

          <Text style={[styles.terms, { paddingBottom: insets.bottom + 24 }]}>
            Giriş yaparak{" "}
            <Text style={styles.termsLink}>Kullanım Koşulları</Text>
            {" "}ve{" "}
            <Text style={styles.termsLink}>Gizlilik Politikası</Text>
            {"\n"}kabul edilmiş sayılırsınız.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  decorCircle1: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(59,130,246,0.12)",
    right: -80,
  },
  decorCircle2: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(99,102,241,0.10)",
    left: -40,
  },
  hero: {
    alignItems: "center",
    paddingBottom: 32,
  },
  logoWrap: {
    marginBottom: 20,
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 10,
  },
  logoGlass: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  brandName: {
    fontSize: 34,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.8,
    fontFamily: "Inter_700Bold",
    marginBottom: 6,
  },
  brandSub: {
    fontSize: 14,
    color: "rgba(255,255,255,0.55)",
    fontFamily: "Inter_400Regular",
    letterSpacing: 0.1,
  },
  card: {
    marginHorizontal: 20,
    backgroundColor: "#ffffff",
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 40,
    elevation: 16,
  },
  cardTitle: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: "#0f172a",
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 14,
    color: "#94A3B8",
    fontFamily: "Inter_400Regular",
    marginBottom: 24,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "#FEF2F2",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: "#EF4444",
  },
  errorText: {
    color: "#DC2626",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  fieldWrap: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "#475569",
    marginBottom: 8,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 14,
    paddingVertical: 0,
    height: 52,
  },
  inputBoxFocused: {
    borderColor: "#2563eb",
    backgroundColor: "#EFF6FF",
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#0f172a",
    fontFamily: "Inter_400Regular",
    height: "100%",
  },
  eyeBtn: {
    padding: 4,
    marginLeft: 8,
  },
  btnWrap: {
    marginTop: 8,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  btn: {
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.3,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E2E8F0",
  },
  dividerText: {
    fontSize: 12,
    color: "#94A3B8",
    fontFamily: "Inter_400Regular",
  },
  secondaryBtn: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
  },
  secondaryBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#334155",
  },
  terms: {
    textAlign: "center",
    fontSize: 11,
    color: "rgba(255,255,255,0.35)",
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
    marginTop: 24,
    paddingHorizontal: 32,
  },
  termsLink: {
    color: "rgba(255,255,255,0.55)",
    textDecorationLine: "underline",
  },
});
