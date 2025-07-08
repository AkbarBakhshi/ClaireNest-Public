import { ScrollView, View } from "react-native";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function InvitePage() {
  return (
    <SafeAreaView className="flex-1 px-4 bg-background justify-between flex-col">
      <ScrollView className="flex-1">
        <View className="flex flex-col items-center justify-center px-4 mt-6">
          <View className="w-full gap-8">
            <View className="text-center gap-4">
              <Text
                className="text-3xl tracking-tight"
                style={{ fontFamily: "Quicksand_700Bold" }}
              >
                Connect with Your Support Circle
              </Text>
              <Text className="text-lg text-muted-foreground">
                Invite your family and friends or start supporting a family.
              </Text>
            </View>

            <View className="grid gap-8">
              {/* Parents Section */}
              <View className="bg-card rounded-xl border p-6 shadow-sm">
                <View className="gap-4">
                  <Text
                    className="text-2xl text-primary"
                    style={{ fontFamily: "Quicksand_700Bold" }}
                  >
                    For Parents
                  </Text>
                  <View className="gap-3 text-muted-foreground">
                    <Text>
                      Share your invite link with trusted family and friends.
                      When they tap it, they&apos;ll be redirected back to the
                      app and connected to your support circle.
                    </Text>
                    <Text>
                      You&apos;ll get a notification when someone joins, and
                      you&apos;ll need to approve them before they can view or
                      claim your requests. This keeps your circle secure and
                      trusted.
                    </Text>
                  </View>
                </View>
              </View>

              {/* Supporters Section */}
              <View className="bg-card rounded-xl border p-6 shadow-sm">
                <View className="gap-4">
                  <Text
                    className="text-2xl text-primary"
                    style={{ fontFamily: "Quicksand_700Bold" }}
                  >
                    For Supporters
                  </Text>
                  <View className="gap-3 text-muted-foreground">
                    <Text>
                      Ask your family to share their invite link with you. When
                      you tap the link, you&apos;ll be redirected back to the
                      app and automatically connected to their support circle.
                    </Text>
                    <Text>
                      The family will be notified and must approve your request
                      to join their circle before you can access and claim their
                      tasks.
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
          <Link href="/" className="mt-2" asChild>
            <Button
              variant="link"
              style={({ pressed }) =>
                pressed ? { opacity: 0.75 } : { elevation: 2 }
              }
            >
              <Text className="text-lg">Go to home screen</Text>
            </Button>
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
