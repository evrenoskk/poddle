import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Redirect, Stack, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppProvider, useApp } from "@/context/AppContext";
import { PodleLogo } from "@/components/PodleLogo";
import { setBaseUrl } from "@workspace/api-client-react";

SplashScreen.preventAutoHideAsync();

if (process.env.EXPO_PUBLIC_DOMAIN) {
  setBaseUrl(`https://${process.env.EXPO_PUBLIC_DOMAIN}`);
}

const queryClient = new QueryClient();

function PulseBox({ w, h, r = 12, delay = 0 }: { w: number | string; h: number; r?: number; delay?: number }) {
  const opacity = useRef(new Animated.Value(0.25)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.5, duration: 800, delay, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.25, duration: 800, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);
  return <Animated.View style={{ width: w as any, height: h, borderRadius: r, backgroundColor: "rgba(255,255,255,0.15)", opacity }} />;
}

function LoadingSplash() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, []);

  return (
    <View style={splashStyles.root}>
      <LinearGradient colors={["#0f172a", "#1e3a8a", "#2563eb"]} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
      <Animated.View style={[splashStyles.content, { opacity: fadeAnim }]}>
        <PodleLogo size={72} />
        <View style={{ height: 16 }} />
        <PulseBox w={100} h={24} r={6} />
        <View style={{ height: 32 }} />
        <View style={splashStyles.card}>
          <PulseBox w={140} h={18} r={6} />
          <View style={{ height: 6 }} />
          <PulseBox w={180} h={12} r={4} delay={100} />
          <View style={{ height: 20 }} />
          <PulseBox w="100%" h={50} r={14} delay={200} />
          <View style={{ height: 12 }} />
          <PulseBox w="100%" h={50} r={14} delay={300} />
          <View style={{ height: 16 }} />
          <PulseBox w="100%" h={52} r={16} delay={400} />
        </View>
      </Animated.View>
    </View>
  );
}

const splashStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0f172a" },
  content: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 20 },
  card: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
});

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, isAuthLoaded } = useApp();
  const segments = useSegments();

  const inAuthGroup = segments[0] === "(tabs)";

  if (!isAuthLoaded) {
    return <LoadingSplash />;
  }

  if (!user && inAuthGroup) {
    return <Redirect href="/login" />;
  }

  if (user && (segments[0] === "login" || segments[0] === "signup")) {
    return <Redirect href="/(tabs)" />;
  }

  return <>{children}</>;
}

function RootLayoutNav() {
  return (
    <AuthGate>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false, animation: "fade" }} />
        <Stack.Screen name="signup" options={{ headerShown: false, animation: "slide_from_bottom" }} />
      </Stack>
    </AuthGate>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return <LoadingSplash />;
  }

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AppProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <RootLayoutNav />
            </GestureHandlerRootView>
          </AppProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
