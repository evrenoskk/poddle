import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;

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

export type Subscription = {
  plan: "free" | "pay_per_question" | "monthly";
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
  pets: Pet[];
  activePetId: number | null;
  tasks: Task[];
  messages: ChatMessage[];
  healthLogs: HealthLog[];
  subscription: Subscription;
  isLoaded: boolean;
  addPet: (pet: Omit<Pet, "id">) => Promise<void>;
  updatePet: (pet: Pet) => Promise<void>;
  deletePet: (id: number) => Promise<void>;
  setActivePetId: (id: number | null) => void;
  addTask: (task: Task) => void;
  updateTask: (task: Task) => void;
  deleteTask: (id: string) => void;
  addMessage: (message: ChatMessage) => void;
  updateMessage: (id: string, content: string) => void;
  clearMessages: () => void;
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
  MESSAGES: "@poddle_messages",
  SUBSCRIPTION: "@poddle_subscription",
};

const defaultSubscription: Subscription = {
  plan: "free",
  freeQuestionsUsed: 0,
  freeQuestionsTotal: 5,
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [pets, setPets] = useState<Pet[]>([]);
  const [activePetId, setActivePetIdState] = useState<number | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [healthLogs, setHealthLogs] = useState<HealthLog[]>([]);
  const [subscription, setSubscription] =
    useState<Subscription>(defaultSubscription);
  const [isLoaded, setIsLoaded] = useState(false);

  const fetchPets = useCallback(async () => {
    try {
      const resp = await fetch(`${API_BASE}/api/pets`);
      if (resp.ok) {
        const data = await resp.json();
        setPets(data);
      }
    } catch {
      // offline - keep current pets
    }
  }, []);

  const fetchHealthLogs = useCallback(async (petId: number) => {
    try {
      const resp = await fetch(`${API_BASE}/api/health-logs/${petId}`);
      if (resp.ok) {
        const data = await resp.json();
        setHealthLogs(data);
      }
    } catch {
      // offline - keep current logs
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [activePetData, tasksData, messagesData, subData] =
          await Promise.all([
            AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_PET),
            AsyncStorage.getItem(STORAGE_KEYS.TASKS),
            AsyncStorage.getItem(STORAGE_KEYS.MESSAGES),
            AsyncStorage.getItem(STORAGE_KEYS.SUBSCRIPTION),
          ]);

        if (activePetData) setActivePetIdState(parseInt(activePetData));
        if (tasksData) setTasks(JSON.parse(tasksData));
        if (messagesData) setMessages(JSON.parse(messagesData));
        if (subData) setSubscription(JSON.parse(subData));

        await fetchPets();
      } finally {
        setIsLoaded(true);
      }
    })();
  }, [fetchPets]);

  // Fetch health logs when active pet changes
  useEffect(() => {
    if (activePetId != null) fetchHealthLogs(activePetId);
    else setHealthLogs([]);
  }, [activePetId, fetchHealthLogs]);

  const persistTasks = useCallback(async (newTasks: Task[]) => {
    await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(newTasks));
  }, []);

  const persistMessages = useCallback(async (newMessages: ChatMessage[]) => {
    await AsyncStorage.setItem(
      STORAGE_KEYS.MESSAGES,
      JSON.stringify(newMessages)
    );
  }, []);

  const persistSubscription = useCallback(async (newSub: Subscription) => {
    await AsyncStorage.setItem(
      STORAGE_KEYS.SUBSCRIPTION,
      JSON.stringify(newSub)
    );
  }, []);

  const addPet = useCallback(
    async (pet: Omit<Pet, "id">) => {
      const resp = await fetch(`${API_BASE}/api/pets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: pet.name,
          species: pet.species,
          breed: pet.breed,
          age: pet.age,
          weight: pet.weight,
          gender: pet.gender,
          imageUri: pet.imageUri ?? null,
          status: pet.status,
        }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || "Kayıt hatası");
      }
      const newPet: Pet = await resp.json();
      setPets((prev) => [...prev, newPet]);
      setActivePetIdState(newPet.id);
      AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_PET, String(newPet.id));
    },
    []
  );

  const updatePet = useCallback(async (pet: Pet) => {
    const resp = await fetch(`${API_BASE}/api/pets/${pet.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pet),
    });
    if (resp.ok) {
      const updated: Pet = await resp.json();
      setPets((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    }
  }, []);

  const deletePet = useCallback(async (id: number) => {
    await fetch(`${API_BASE}/api/pets/${id}`, { method: "DELETE" });
    setPets((prev) => prev.filter((p) => p.id !== id));
  }, []);

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

  const addMessage = useCallback(
    (message: ChatMessage) => {
      setMessages((prev) => {
        const next = [...prev, message];
        if (next.length > 100) next.splice(0, next.length - 100);
        persistMessages(next);
        return next;
      });
    },
    [persistMessages]
  );

  const updateMessage = useCallback(
    (id: string, content: string) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, content } : m))
      );
    },
    []
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    AsyncStorage.removeItem(STORAGE_KEYS.MESSAGES);
  }, []);

  const addHealthLog = useCallback(
    async (petId: number, logType: string, value: string, notes: string) => {
      const resp = await fetch(`${API_BASE}/api/health-logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ petId, logType, value, notes }),
      });
      if (resp.ok) {
        const newLog: HealthLog = await resp.json();
        setHealthLogs((prev) => [newLog, ...prev]);
      }
    },
    []
  );

  const deleteHealthLog = useCallback(async (id: number) => {
    await fetch(`${API_BASE}/api/health-logs/${id}`, { method: "DELETE" });
    setHealthLogs((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const canAskQuestion = useCallback(() => {
    if (subscription.plan === "monthly") return true;
    if (subscription.plan === "pay_per_question") return true;
    return subscription.freeQuestionsUsed < subscription.freeQuestionsTotal;
  }, [subscription]);

  const useQuestion = useCallback(() => {
    if (subscription.plan === "free") {
      setSubscription((prev) => {
        const next = {
          ...prev,
          freeQuestionsUsed: prev.freeQuestionsUsed + 1,
        };
        persistSubscription(next);
        return next;
      });
    }
  }, [subscription.plan, persistSubscription]);

  return (
    <AppContext.Provider
      value={{
        pets,
        activePetId,
        tasks,
        messages,
        healthLogs,
        subscription,
        isLoaded,
        addPet,
        updatePet,
        deletePet,
        setActivePetId,
        addTask,
        updateTask,
        deleteTask,
        addMessage,
        updateMessage,
        clearMessages,
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
