import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { Task } from "@/context/AppContext";

type Props = {
  task: Task;
  onToggle: (task: Task) => void;
  onDelete: (id: string) => void;
};

function getTaskIcon(type: Task["type"], color: string) {
  switch (type) {
    case "vaccination":
      return <MaterialCommunityIcons name="needle" size={20} color={color} />;
    case "grooming":
      return <MaterialCommunityIcons name="content-cut" size={20} color={color} />;
    case "checkup":
      return <Feather name="heart" size={20} color={color} />;
    case "medication":
      return <MaterialCommunityIcons name="pill" size={20} color={color} />;
    default:
      return <Feather name="check-circle" size={20} color={color} />;
  }
}

function getTaskColor(type: Task["type"]) {
  switch (type) {
    case "vaccination": return "#2563EB";
    case "grooming": return "#10B981";
    case "checkup": return "#EC4899";
    case "medication": return "#F59E0B";
    default: return "#6366F1";
  }
}

function getTaskBg(type: Task["type"]) {
  switch (type) {
    case "vaccination": return "#DBEAFE";
    case "grooming": return "#D1FAE5";
    case "checkup": return "#FCE7F3";
    case "medication": return "#FEF3C7";
    default: return "#EDE9FE";
  }
}

function getDueDateLabel(dueDate: string) {
  if (!dueDate) return "—";
  const due = new Date(dueDate.includes("T") ? dueDate : dueDate + "T00:00:00");
  if (isNaN(due.getTime())) return "—";
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diff = Math.round((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return "Gecikti";
  if (diff === 0) return "Bugün";
  if (diff === 1) return "Yarın";
  if (diff < 7) return `${diff} gün sonra`;
  return due.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

export function TaskCard({ task, onToggle, onDelete }: Props) {
  const colors = useColors();
  const taskColor = getTaskColor(task.type);
  const taskBg = getTaskBg(task.type);
  const dueMs = task.dueDate ? new Date(task.dueDate.includes("T") ? task.dueDate : task.dueDate + "T00:00:00").getTime() : NaN;
  const isOverdue = !isNaN(dueMs) && dueMs < Date.now() && !task.completed;
  const isToday = getDueDateLabel(task.dueDate) === "Bugün";

  const handleToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onToggle(task);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.iconBox, { backgroundColor: taskBg }]}>
        {getTaskIcon(task.type, taskColor)}
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.foreground, textDecorationLine: task.completed ? "line-through" : "none" }]}>
          {task.title}
        </Text>
        <Text style={[styles.desc, { color: colors.mutedForeground }]} numberOfLines={1}>
          {task.description}
        </Text>
      </View>

      <View style={styles.right}>
        <View style={[
          styles.badge,
          {
            backgroundColor: isOverdue ? "#FEE2E2" : isToday ? "#D1FAE5" : "#F1F5F9",
          }
        ]}>
          <Text style={[
            styles.badgeText,
            { color: isOverdue ? "#EF4444" : isToday ? "#10B981" : "#64748B" }
          ]}>
            {getDueDateLabel(task.dueDate)}
          </Text>
        </View>

        <TouchableOpacity onPress={handleToggle} style={styles.checkBtn}>
          <View style={[
            styles.check,
            {
              borderColor: task.completed ? taskColor : colors.border,
              backgroundColor: task.completed ? taskColor : "transparent",
            }
          ]}>
            {task.completed && <Feather name="check" size={12} color="#fff" />}
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  desc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  right: {
    alignItems: "flex-end",
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  checkBtn: {
    padding: 2,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
});
