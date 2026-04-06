import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type Pet = {
  id: string;
  name: string;
  species: string;
  breed: string;
  age: number;
  weight: number;
  gender: "male" | "female";
  imageUri?: string;
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

type AppContextType = {
  pets: Pet[];
  activePetId: string | null;
  tasks: Task[];
  messages: ChatMessage[];
  subscription: Subscription;
  isLoaded: boolean;
  addPet: (pet: Pet) => void;
  updatePet: (pet: Pet) => void;
  deletePet: (id: string) => void;
  setActivePetId: (id: string | null) => void;
  addTask: (task: Task) => void;
  updateTask: (task: Task) => void;
  deleteTask: (id: string) => void;
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
  canAskQuestion: () => boolean;
  useQuestion: () => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PETS: "@poddle_pets",
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
  const [activePetId, setActivePetIdState] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [subscription, setSubscription] =
    useState<Subscription>(defaultSubscription);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [petsData, activePetData, tasksData, messagesData, subData] =
          await Promise.all([
            AsyncStorage.getItem(STORAGE_KEYS.PETS),
            AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_PET),
            AsyncStorage.getItem(STORAGE_KEYS.TASKS),
            AsyncStorage.getItem(STORAGE_KEYS.MESSAGES),
            AsyncStorage.getItem(STORAGE_KEYS.SUBSCRIPTION),
          ]);

        if (petsData) setPets(JSON.parse(petsData));
        if (activePetData) setActivePetIdState(activePetData);
        if (tasksData) setTasks(JSON.parse(tasksData));
        if (messagesData) setMessages(JSON.parse(messagesData));
        if (subData) setSubscription(JSON.parse(subData));
      } finally {
        setIsLoaded(true);
      }
    })();
  }, []);

  const persistPets = useCallback(async (newPets: Pet[]) => {
    await AsyncStorage.setItem(STORAGE_KEYS.PETS, JSON.stringify(newPets));
  }, []);

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
    (pet: Pet) => {
      setPets((prev) => {
        const next = [...prev, pet];
        persistPets(next);
        return next;
      });
    },
    [persistPets]
  );

  const updatePet = useCallback(
    (pet: Pet) => {
      setPets((prev) => {
        const next = prev.map((p) => (p.id === pet.id ? pet : p));
        persistPets(next);
        return next;
      });
    },
    [persistPets]
  );

  const deletePet = useCallback(
    (id: string) => {
      setPets((prev) => {
        const next = prev.filter((p) => p.id !== id);
        persistPets(next);
        return next;
      });
    },
    [persistPets]
  );

  const setActivePetId = useCallback((id: string | null) => {
    setActivePetIdState(id);
    if (id) AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_PET, id);
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

  const clearMessages = useCallback(() => {
    setMessages([]);
    AsyncStorage.removeItem(STORAGE_KEYS.MESSAGES);
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
        clearMessages,
        canAskQuestion,
        useQuestion,
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
