import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;

export type AuthUser = {
  id: number;
  email: string;
  name: string;
  plan: "free" | "pay_per_question" | "monthly" | "pro_plus";
  freeQuestionsUsed: number;
};

export type Pet = {
  id: number;
  name: string;
  species: string;
  breed: string;
  age: number;
  weight: number;
  gender: "male" | "female";
  imageUri?: string | null;
  status: string;
};

export type Task = {
  id: string;
  petId: string;
  type: "vaccination" | "grooming" | "checkup" | "medication" | "other";
  title: string;
  description: string;
  dueDate: string;
  completed: boolean;
  completedAt?: string;
  reminderSet: boolean;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  mediaUri?: string;
  mediaType?: "image" | "video";
  timestamp: string;
};

export type ChatSession = {
  id: number;
  petId: number;
  title: string;
  icon: string;
  createdAt: string;
  updatedAt: string;
};

export type Subscription = {
  plan: "free" | "pay_per_question" | "monthly" | "pro_plus";
  freeQuestionsUsed: number;
  freeQuestionsTotal: number;
};

export type HealthLog = {
  id: number;
  petId: number;
  logType: string;
  value: string;
  notes: string;
  loggedAt: string;
};

type AppContextType = {
  user: AuthUser | null;
  authToken: string | null;
  isAuthLoaded: boolean;
  pets: Pet[];
  activePetId: number | null;
  tasks: Task[];
  messages: ChatMessage[];
  sessions: ChatSession[];
  activeSessionId: number | null;
  healthLogs: HealthLog[];
  subscription: Subscription;
  isLoaded: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  addPet: (pet: Omit<Pet, "id">) => Promise<void>;
  updatePet: (pet: Pet) => Promise<void>;
  deletePet: (id: number) => Promise<void>;
  setActivePetId: (id: number | null) => void;
  addTask: (task: Task) => void;
  updateTask: (task: Task) => void;
  deleteTask: (id: string) => void;
  clearAllTasks: () => void;
  addMessage: (message: ChatMessage) => void;
  updateMessage: (id: string, content: string) => void;
  clearMessages: () => void;
  fetchSessions: (petId: number) => Promise<void>;
  createSession: (petId: number, title: string, icon: string) => Promise<ChatSession>;
  deleteSession: (id: number) => Promise<void>;
  updateSessionTitle: (id: number, title: string) => Promise<void>;
  setActiveSessionId: (id: number | null) => void;
  addHealthLog: (petId: number, logType: string, value: string, notes: string) => Promise<void>;
  deleteHealthLog: (id: number) => Promise<void>;
  fetchHealthLogs: (petId: number) => Promise<void>;
  canAskQuestion: () => boolean;
  useQuestion: () => void;
  refreshPets: () => Promise<void>;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  ACTIVE_PET: "@poddle_active_pet",
  TASKS: "@poddle_tasks",
  SUBSCRIPTION: "@poddle_subscription",
  AUTH_TOKEN: "@poddle_auth_token",
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isAuthLoaded, setIsAuthLoaded] = useState(false);

  const [pets, setPets] = useState<Pet[]>([]);
  const [activePetId, setActivePetIdState] = useState<number | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [healthLogs, setHealthLogs] = useState<HealthLog[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionIdState] = useState<number | null>(null);
  const sessionMessagesRef = useRef<Record<number, ChatMessage[]>>({});
  const [sessionMessages, setSessionMessages] = useState<Record<number, ChatMessage[]>>({});

  const messages: ChatMessage[] =
    activeSessionId !== null ? (sessionMessages[activeSessionId] ?? []) : [];

  const subscription: Subscription = {
    plan: user?.plan ?? "free",
    freeQuestionsUsed: user?.freeQuestionsUsed ?? 0,
    freeQuestionsTotal: 5,
  };

  function authHeaders(token?: string | null) {
    const t = token ?? authToken;
    return t ? { Authorization: `Bearer ${t}` } : {};
  }

  const fetchPets = useCallback(
    async (token?: string | null) => {
      try {
        const resp = await fetch(`${API_BASE}/api/pets`, {
          headers: authHeaders(token),
        });
        if (resp.ok) {
          const data = await resp.json();
          setPets(data);
          if (data.length > 0) {
            setActivePetIdState((prev) => {
              if (prev == null) {
                const firstId = data[0].id;
                AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_PET, String(firstId));
                return firstId;
              }
              return prev;
            });
          }
        }
      } catch {
        // offline
      }
    },
    [authToken]
  );

  const fetchHealthLogs = useCallback(
    async (petId: number) => {
      try {
        const resp = await fetch(`${API_BASE}/api/health-logs/${petId}`, {
          headers: authHeaders(),
        });
        if (resp.ok) {
          const data = await resp.json();
          setHealthLogs(data);
        }
      } catch {
        // offline
      }
    },
    [authToken]
  );

  const fetchSessions = useCallback(
    async (petId: number) => {
      try {
        const resp = await fetch(`${API_BASE}/api/chat-sessions?petId=${petId}`, {
          headers: authHeaders(),
        });
        if (resp.ok) {
          const data = await resp.json();
          setSessions(data);
        }
      } catch {
        // offline
      }
    },
    [authToken]
  );

  useEffect(() => {
    (async () => {
      try {
        const storedToken = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        if (storedToken) {
          const resp = await fetch(`${API_BASE}/api/auth/me`, {
            headers: { Authorization: `Bearer ${storedToken}` },
          });
          if (resp.ok) {
            const { user: u } = await resp.json();
            setUser(u);
            setAuthToken(storedToken);
          } else {
            await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
          }
        }
      } catch {
        // offline
      } finally {
        setIsAuthLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!isAuthLoaded) return;
    (async () => {
      try {
        const [activePetData, tasksData] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_PET),
          AsyncStorage.getItem(STORAGE_KEYS.TASKS),
        ]);

        if (activePetData) setActivePetIdState(parseInt(activePetData));
        if (tasksData) setTasks(JSON.parse(tasksData));

        if (authToken) await fetchPets(authToken);
      } finally {
        setIsLoaded(true);
      }
    })();
  }, [isAuthLoaded, authToken]);

  useEffect(() => {
    if (activePetId != null) {
      fetchHealthLogs(activePetId);
      fetchSessions(activePetId);
    } else {
      setHealthLogs([]);
      setSessions([]);
    }
    setActiveSessionIdState(null);
  }, [activePetId, fetchHealthLogs, fetchSessions]);

  const persistTasks = useCallback(async (newTasks: Task[]) => {
    await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(newTasks));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const resp = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || "Giriş başarısız.");
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, data.token);
    setAuthToken(data.token);
    setUser(data.user);
  }, []);

  const signup = useCallback(async (email: string, password: string, name?: string) => {
    const resp = await fetch(`${API_BASE}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || "Kayıt başarısız.");
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, data.token);
    setAuthToken(data.token);
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.multiRemove([STORAGE_KEYS.AUTH_TOKEN, STORAGE_KEYS.ACTIVE_PET]);
    setAuthToken(null);
    setUser(null);
    setPets([]);
    setActivePetIdState(null);
    setSessions([]);
    setSessionMessages({});
    setHealthLogs([]);
    setTasks([]);
  }, []);

  const addPet = useCallback(
    async (pet: Omit<Pet, "id">) => {
      const resp = await fetch(`${API_BASE}/api/pets`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(pet),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error((err as any).error || "Kayıt hatası");
      }
      const newPet: Pet = await resp.json();
      setPets((prev) => [...prev, newPet]);
      setActivePetIdState(newPet.id);
      AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_PET, String(newPet.id));
    },
    [authToken]
  );

  const updatePet = useCallback(
    async (pet: Pet) => {
      const resp = await fetch(`${API_BASE}/api/pets/${pet.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(pet),
      });
      if (resp.ok) {
        const updated: Pet = await resp.json();
        setPets((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      }
    },
    [authToken]
  );

  const deletePet = useCallback(
    async (id: number) => {
      await fetch(`${API_BASE}/api/pets/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      setPets((prev) => prev.filter((p) => p.id !== id));
    },
    [authToken]
  );

  const setActivePetId = useCallback((id: number | null) => {
    setActivePetIdState(id);
    if (id != null) AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_PET, String(id));
    else AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_PET);
  }, []);

  const addTask = useCallback(
    (task: Task) => {
      setTasks((prev) => {
        const next = [...prev, task];
        persistTasks(next);
        return next;
      });
    },
    [persistTasks]
  );

  const updateTask = useCallback(
    (task: Task) => {
      setTasks((prev) => {
        const next = prev.map((t) => (t.id === task.id ? task : t));
        persistTasks(next);
        return next;
      });
    },
    [persistTasks]
  );

  const deleteTask = useCallback(
    (id: string) => {
      setTasks((prev) => {
        const next = prev.filter((t) => t.id !== id);
        persistTasks(next);
        return next;
      });
    },
    [persistTasks]
  );

  const clearAllTasks = useCallback(() => {
    setTasks([]);
    AsyncStorage.removeItem(STORAGE_KEYS.TASKS);
  }, []);

  const addMessage = useCallback(
    (message: ChatMessage) => {
      if (activeSessionId === null) return;
      const sid = activeSessionId;
      setSessionMessages((prev) => {
        const existing = prev[sid] ?? [];
        const next = [...existing, message];
        if (next.length > 100) next.splice(0, next.length - 100);
        return { ...prev, [sid]: next };
      });
    },
    [activeSessionId]
  );

  const updateMessage = useCallback(
    (id: string, content: string) => {
      if (activeSessionId === null) return;
      const sid = activeSessionId;
      setSessionMessages((prev) => {
        const existing = prev[sid] ?? [];
        return {
          ...prev,
          [sid]: existing.map((m) => (m.id === id ? { ...m, content } : m)),
        };
      });
    },
    [activeSessionId]
  );

  const clearMessages = useCallback(() => {
    if (activeSessionId === null) return;
    const sid = activeSessionId;
    setSessionMessages((prev) => ({ ...prev, [sid]: [] }));
  }, [activeSessionId]);

  const createSession = useCallback(
    async (petId: number, title: string, icon: string): Promise<ChatSession> => {
      const resp = await fetch(`${API_BASE}/api/chat-sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ petId, title, icon }),
      });
      if (!resp.ok) throw new Error("Oturum oluşturulamadı");
      const session: ChatSession = await resp.json();
      setSessions((prev) => [session, ...prev]);
      return session;
    },
    [authToken]
  );

  const deleteSession = useCallback(
    async (id: number) => {
      await fetch(`${API_BASE}/api/chat-sessions/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      setSessions((prev) => prev.filter((s) => s.id !== id));
      if (activeSessionId === id) setActiveSessionIdState(null);
      setSessionMessages((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    },
    [activeSessionId, authToken]
  );

  const updateSessionTitle = useCallback(
    async (id: number, title: string) => {
      await fetch(`${API_BASE}/api/chat-sessions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ title }),
      });
      setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, title } : s)));
    },
    [authToken]
  );

  const setActiveSessionId = useCallback((id: number | null) => {
    setActiveSessionIdState(id);
  }, []);

  const addHealthLog = useCallback(
    async (petId: number, logType: string, value: string, notes: string) => {
      const resp = await fetch(`${API_BASE}/api/health-logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ petId, logType, value, notes }),
      });
      if (resp.ok) {
        const newLog: HealthLog = await resp.json();
        setHealthLogs((prev) => [newLog, ...prev]);
      }
    },
    [authToken]
  );

  const deleteHealthLog = useCallback(
    async (id: number) => {
      await fetch(`${API_BASE}/api/health-logs/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      setHealthLogs((prev) => prev.filter((l) => l.id !== id));
    },
    [authToken]
  );

  const canAskQuestion = useCallback(() => {
    if (!user) return false;
    if (user.plan === "pro_plus" || user.plan === "monthly") return true;
    if (user.plan === "pay_per_question") return true;
    return user.freeQuestionsUsed < 5;
  }, [user]);

  const useQuestion = useCallback(() => {
    if (user?.plan === "free") {
      setUser((prev) => prev ? { ...prev, freeQuestionsUsed: prev.freeQuestionsUsed + 1 } : prev);
    }
  }, [user?.plan]);

  return (
    <AppContext.Provider
      value={{
        user,
        authToken,
        isAuthLoaded,
        pets,
        activePetId,
        tasks,
        messages,
        sessions,
        activeSessionId,
        healthLogs,
        subscription,
        isLoaded,
        login,
        signup,
        logout,
        addPet,
        updatePet,
        deletePet,
        setActivePetId,
        addTask,
        updateTask,
        deleteTask,
        clearAllTasks,
        addMessage,
        updateMessage,
        clearMessages,
        fetchSessions,
        createSession,
        deleteSession,
        updateSessionTitle,
        setActiveSessionId,
        addHealthLog,
        deleteHealthLog,
        fetchHealthLogs,
        canAskQuestion,
        useQuestion,
        refreshPets: fetchPets,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}

export const useAppContext = useApp;
