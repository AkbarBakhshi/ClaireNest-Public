import { FlatList } from "react-native";
import TaskCard from "./task-card";
import { HelpRequest } from "@/interfaces";

export default function TaskList({
  tasks,
  onClaim,
  isLoading,
  onAbandon,
  showOverdueBadge,
}: {
  tasks: HelpRequest[];
  onClaim?: (task: HelpRequest) => void;
  isLoading: boolean;
  onAbandon?: (task: HelpRequest) => void;
  showOverdueBadge?: boolean;
}) {
  return (
    <FlatList
      data={tasks}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TaskCard 
          task={item} 
          onClaim={onClaim} 
          isLoading={isLoading} 
          onAbandon={onAbandon} 
          showOverdueBadge={showOverdueBadge}
        />
      )}
      contentContainerStyle={{ paddingBottom: 80 }}
    />
  );
}
