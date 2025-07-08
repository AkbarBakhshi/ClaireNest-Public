import { TaskType } from "@/interfaces";

export const NAV_THEME = {
  light: {
    background: "hsl(0 0% 98%)", // background
    border: "hsl(210 14% 89%)", // border
    card: "hsl(0 0% 100%)", // card
    notification: "hsl(0 84% 64%)", // destructive
    primary: "hsl(192 52% 54%)", // primary
    text: "hsl(202 28% 23%)", // foreground
  },
  dark: {
    background: "hsl(210 15% 8%)", // background
    border: "hsl(210 12% 20%)", // border
    card: "hsl(210 12% 12%)", // card
    notification: "hsl(0 84% 50%)", // destructive
    primary: "hsl(192 52% 44%)", // primary
    text: "hsl(0 0% 90%)", // foreground
  },
};

export const TASK_TYPES: { value: TaskType; label: string; icon: string }[] = [
  { value: "babysitting", label: "Babysitting", icon: "happy-outline" },
  { value: "meal", label: "Prepare a Meal", icon: "restaurant-outline" },
  { value: "groceries", label: "Pick Up Groceries", icon: "cart-outline" },
  { value: "childcare", label: "Help with Children", icon: "people-outline" },
  { value: "other", label: "Other Help", icon: "heart-outline" },
];