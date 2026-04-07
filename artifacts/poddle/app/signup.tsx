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

export default function SignupScreen() {
  const { signup } = useAppContext();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  const emailRef = useRef<TextInput>(null);
  const passRef = useRef<TextInput>(null);
  const pass2Ref = useRef<TextInput>(null);
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

  async function handleSignup() {
    if (!email.trim() || !password) {
      setError("E-posta ve şifre gereklidir.");
      shake();
      return;
    }
    if (password.length < 6) {
      setError("Şifre en az 6 karakter olmalıdır.");
      shake();
      return;
    }
    if (password !== password2) {
      setError("Şifreler birbiriyle eşleşmiyor.");
      shake();
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await signup(email.trim(), password, name.trim());
      router.replace("/(tabs)");
    } catch (e: any) {
      setError(e.message || "Kayıt başarısız.");
      shake();
    } finally {
      setLoading(false);
    }
  }

  const safeTop = insets.top + (Platform.OS === "web" ? 0 : 16);

  function inputBox(field: string) {
    return [styles.inputBox, focused === field && styles.inputBoxFocused];
  }

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={["#0f172a", "#1e3a8a", "#2563eb"]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.decorCircle1, { top: safeTop + 60 }]} />
      <View style={[styles.decorCircle2, { top: safeTop + 10 }]} />

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
          {/* Back button */}
          <TouchableOpacity
            style={[styles.backBtn, { top: safeTop + 12 }]}
            onPress={() => router.back()}
          >
            <Feather name="arrow-left" size={20} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>

          {/* Hero */}
          <View style={[styles.hero, { paddingTop: safeTop + 52 }]}>
            <Text style={styles.brandName}>Poddle</Text>
            <Text style={styles.brandSub}>Hesabını oluştur, ücretsiz başla</Text>
          </View>

          {/* Card */}
          <Animated.View style={[styles.card, { transform: [{ translateX: shakeAnim }] }]}>
            <Text style={styles.cardTitle}>Kayıt Ol</Text>

            {error ? (
              <View style={styles.errorRow}>
                <Feather name="alert-circle" size={14} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Free badge */}
            <View style={styles.freeBadge}>
              <View style={styles.freeIconBox}>
                <Feather name="gift" size={14} color="#2563eb" />
              </View>
              <Text style={styles.freeText}>5 ücretsiz AI danışma sorusu ile başla</Text>
            </View>

            {/* Name */}
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Ad Soyad</Text>
              <View style={inputBox("name")}>
                <Feather name="user" size={16} color={focused === "name" ? "#2563eb" : "#9CA3AF"} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Adın Soyadın"
                  placeholderTextColor="#C4C4CC"
                  value={name}
                  onChangeText={(t) => { setName(t); setError(null); }}
                  autoCapitalize="words"
                  returnKeyType="next"
                  onSubmitEditing={() => emailRef.current?.focus()}
                  onFocus={() => setFocused("name")}
                  onBlur={() => setFocused(null)}
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>E-posta</Text>
              <View style={inputBox("email")}>
                <Feather name="mail" size={16} color={focused === "email" ? "#2563eb" : "#9CA3AF"} style={styles.inputIcon} />
                <TextInput
                  ref={emailRef}
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
                  onFocus={() => setFocused("email")}
                  onBlur={() => setFocused(null)}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Şifre</Text>
              <View style={inputBox("pass")}>
                <Feather name="lock" size={16} color={focused === "pass" ? "#2563eb" : "#9CA3AF"} style={styles.inputIcon} />
                <TextInput
                  ref={passRef}
                  style={[styles.input, { flex: 1 }]}
                  placeholder="En az 6 karakter"
                  placeholderTextColor="#C4C4CC"
                  value={password}
                  onChangeText={(t) => { setPassword(t); setError(null); }}
                  secureTextEntry={!showPass}
                  returnKeyType="next"
                  onSubmitEditing={() => pass2Ref.current?.focus()}
                  onFocus={() => setFocused("pass")}
                  onBlur={() => setFocused(null)}
                />
                <TouchableOpacity
                  onPress={() => setShowPass((v) => !v)}
                  style={styles.eyeBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Feather name={showPass ? "eye" : "eye-off"} size={17} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password */}
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Şifre Tekrar</Text>
              <View style={inputBox("pass2")}>
                <Feather name="lock" size={16} color={focused === "pass2" ? "#2563eb" : "#9CA3AF"} style={styles.inputIcon} />
                <TextInput
                  ref={pass2Ref}
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Şifreni tekrar gir"
                  placeholderTextColor="#C4C4CC"
                  value={password2}
                  onChangeText={(t) => { setPassword2(t); setError(null); }}
                  secureTextEntry={!showPass}
                  returnKeyType="done"
                  onSubmitEditing={handleSignup}
                  onFocus={() => setFocused("pass2")}
                  onBlur={() => setFocused(null)}
                />
              </View>
            </View>

            {/* Signup button */}
            <TouchableOpacity
              onPress={handleSignup}
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
                  <>
                    <Text style={styles.btnText}>Kayıt Ol</Text>
                    <Feather name="arrow-right" size={18} color="#fff" style={{ marginLeft: 8 }} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Login link */}
            <TouchableOpacity
              onPress={() => router.push("/login")}
              style={styles.loginLink}
              activeOpacity={0.7}
            >
              <Text style={styles.loginLinkText}>
                Zaten hesabın var mı?{" "}
                <Text style={styles.loginLinkBold}>Giriş Yap</Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>

          <Text style={[styles.terms, { paddingBottom: insets.bottom + 24 }]}>
            Kayıt olarak{" "}
            <Text style={styles.termsLink}>Kullanım Koşulları</Text>
            {" "}ve{" "}
            <Text style={styles.termsLink}>Gizlilik Politikası</Text>
            {"'nı kabul etmiş sayılırsınız."}
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
  backBtn: {
    position: "absolute",
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  hero: {
    alignItems: "center",
    paddingBottom: 28,
  },
  brandName: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.5,
    fontFamily: "Inter_700Bold",
    marginBottom: 6,
  },
  brandSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
    fontFamily: "Inter_400Regular",
  },
  card: {
    marginHorizontal: 20,
    backgroundColor: "#ffffff",
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 40,
    elevation: 16,
  },
  cardTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: "#0f172a",
    marginBottom: 16,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "#FEF2F2",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
    borderLeftWidth: 3,
    borderLeftColor: "#EF4444",
  },
  errorText: {
    color: "#DC2626",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  freeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  freeIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },
  freeText: {
    fontSize: 12.5,
    color: "#1d4ed8",
    fontFamily: "Inter_500Medium",
    flex: 1,
  },
  fieldWrap: {
    marginBottom: 13,
  },
  fieldLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: "#475569",
    marginBottom: 7,
    letterSpacing: 0.5,
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
    height: 50,
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
    marginTop: 6,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  btn: {
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    flexDirection: "row",
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.3,
  },
  loginLink: {
    alignItems: "center",
    marginTop: 18,
  },
  loginLinkText: {
    fontSize: 14,
    color: "#64748B",
    fontFamily: "Inter_400Regular",
  },
  loginLinkBold: {
    color: "#2563eb",
    fontFamily: "Inter_700Bold",
  },
  terms: {
    textAlign: "center",
    fontSize: 11,
    color: "rgba(255,255,255,0.35)",
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
    marginTop: 20,
    paddingHorizontal: 32,
  },
  termsLink: {
    color: "rgba(255,255,255,0.55)",
    textDecorationLine: "underline",
  },
});
