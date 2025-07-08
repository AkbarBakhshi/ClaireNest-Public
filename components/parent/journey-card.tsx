import React from "react";
import { Text } from "@/components/ui/text";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAppSelector } from "@/hooks/useAppReduxHooks";
import { selectUserData } from "@/features/user/userSlice";
import {
  parse,
  differenceInDays,
  differenceInYears,
  format,
  intervalToDuration,
} from "date-fns";
import { View } from "react-native";
import { Heart } from "@/lib/icons/Heart";
import { Button } from "@/components/ui/button";
import { Plus } from "@/lib/icons/Plus";
import { router } from "expo-router";

interface JourneyCardProps {
  encouragingMessage: string;
}

const JourneyCard: React.FC<JourneyCardProps> = ({ encouragingMessage }) => {
  const firestoreUser = useAppSelector(selectUserData);
  const children = firestoreUser?.children || [];

  const youngChildren = children.filter((child) => {
    const age = differenceInYears(
      new Date(),
      parse(child.birthdate, "EEE MMM dd, yyyy", new Date())
    );
    return age < 2;
  });

  const youngest = youngChildren.reduce((youngest, child) => {
    const birthDate = parse(child.birthdate, "EEE MMM dd, yyyy", new Date());
    const ageInDays = differenceInDays(new Date(), birthDate);
    return !youngest || ageInDays < youngest.ageInDays
      ? { ...child, ageInDays, birthDate }
      : youngest;
  }, null as null | { name: string; birthdate: string; ageInDays: number; birthDate: Date });

  const getChildNames = () => {
    if (!youngest) return null;

    const youngestAge = youngest.ageInDays;

    const sameBirthdayChildren = youngChildren.filter((child) => {
      const ageInDays = differenceInDays(
        new Date(),
        parse(child.birthdate, "EEE MMM dd, yyyy", new Date())
      );
      return ageInDays === youngestAge;
    });

    const names = sameBirthdayChildren.map((c) => c.name);

    if (names.length === 1) return names[0];
    if (names.length === 2) return `${names[0]} & ${names[1]}`;
    return `${names.slice(0, -1).join(", ")}, & ${names[names.length - 1]}`;
  };

  const formatDuration = (days: number, name?: string) => {
    if (days <= 0)
      return name ? `Just born today, ${name} 💗` : "Just born today 💗";

    const today = new Date();
    const birthdate = parse(
      youngest?.birthdate || "",
      "EEE MMM dd, yyyy",
      new Date()
    );

    const isBirthday =
      today.getDate() === birthdate.getDate() &&
      today.getMonth() === birthdate.getMonth();

    if (isBirthday) return `Happy Birthday ${name ? `to ${name}` : ""} 🎉`;

    const duration = intervalToDuration({
      start: birthdate,
      end: today,
    });

    const parts = [];
    if (duration.years)
      parts.push(`${duration.years} year${duration.years > 1 ? "s" : ""}`);
    if (duration.months)
      parts.push(`${duration.months} month${duration.months > 1 ? "s" : ""}`);
    if (duration.days)
      parts.push(`${duration.days} day${duration.days > 1 ? "s" : ""}`);

    return name
      ? `Celebrating ${parts.join(" & ")} with ${name} 💛`
      : `Celebrating ${parts.join(" & ")} of love 💛`;
  };

  return (
    <Card className="mt-6 bg-primary/5 border-primary/20">
      <CardHeader className="pb-2">
        <View className="flex-row items-center gap-2">
          <Heart className="text-primary" size={24} />
          <CardTitle className="text-primary text-2xl">
            Your Parenting Journey
          </CardTitle>
        </View>
      </CardHeader>
      <CardContent className="pt-0">
        {youngChildren.length > 0 && youngest ? (
          <View className="bg-primary/10 rounded-lg p-4">
            <Text
              className="text-primary text-lg text-center"
              style={{ fontFamily: "Quicksand_700Bold" }}
            >
              {formatDuration(youngest.ageInDays, getChildNames() || undefined)}
            </Text>
            <Text className="text-xs text-muted-foreground text-center mt-1">
              Born on {format(youngest.birthDate, "MMMM d, yyyy")}
            </Text>
            {youngChildren.length > 1 && (
              <Text className="text-muted-foreground text-center mt-2">
                ({youngChildren.length} little ones in their baby years)
              </Text>
            )}
          </View>
        ) : children.length === 0 ? (
          <View className="bg-primary/10 rounded-lg p-4 items-center">
            <Text className="text-muted-foreground text-center mb-4">
              No children added yet. Start your parenting journey by adding your
              child.
            </Text>
            <Button
              onPress={() => router.push("/parent/child-profile")}
              className="flex-row items-center"
            >
              <Plus size={20} className="mr-2" color="white" />
              <Text
                className="text-white"
                style={{ fontFamily: "Quicksand_700Bold" }}
              >
                Add Child
              </Text>
            </Button>
          </View>
        ) : null}
      </CardContent>
      <CardFooter className="pt-0">
        <View className="flex-1 items-center">
          <Text
            className="text-primary text-lg text-center"
            style={{ fontFamily: "Quicksand_700Bold" }}
          >
            {encouragingMessage}
          </Text>
        </View>
      </CardFooter>
    </Card>
  );
};

export default JourneyCard;