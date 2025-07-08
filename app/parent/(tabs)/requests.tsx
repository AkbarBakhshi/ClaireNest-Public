import {
  View,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Platform,
} from "react-native";
import { Text } from "@/components/ui/text";
import {
  CalendarBody,
  CalendarContainer,
  CalendarHeader,
  DeepPartial,
  PackedEvent,
  ThemeConfigs,
} from "@howljs/calendar-kit";
import { SafeAreaView } from "react-native-safe-area-context";
import { cn, isDateInRange, mapHelpRequestsToEvents } from "@/lib/utils";
import { useCallback, useEffect, useState, useMemo } from "react";
import { NAV_THEME } from "@/lib/constants";
import { useColorScheme } from "@/lib/useColorScheme";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppReduxHooks";
import {
  fetchRequests,
  selectFetchedDates,
  selectRequestError,
  selectRequestLoading,
  selectRequests,
} from "@/features/request/requestSlice";
import { selectUserData } from "@/features/user/userSlice";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "@/lib/icons/AlertTriangle";
import { Soup } from "@/lib/icons/Soup";
import { ShoppingCart } from "@/lib/icons/ShoppingCart";
import { Baby } from "@/lib/icons/Baby";
import { HandHelping } from "@/lib/icons/HandHelping";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link, router } from "expo-router";
import { TaskType } from "@/interfaces";
import { Clock } from "@/lib/icons/Clock";

import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInDown,
  SlideInRight,
  useAnimatedStyle,
  withTiming,
  useSharedValue,
  interpolate,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { LayoutList } from "@/lib/icons/LayoutList";
import { Plus } from "@/lib/icons/Plus";
import { HelpRequest } from "@/interfaces";
import React from "react";
import EmailVerifiedBanner from "@/components/email-verified-banner";

export default function RequestsScreen() {
  const dispatch = useAppDispatch();
  const firestoreUser = useAppSelector(selectUserData);
  const [viewMode, setViewMode] = useState<"calendar" | "list">("list");
  const [filter, setFilter] = useState<
    "all" | "open" | "claimed" | "completed" | "expired"
  >("all");
  const requests = useAppSelector(selectRequests);
  const loading = useAppSelector(selectRequestLoading);
  const error = useAppSelector(selectRequestError);
  const fetchedDates = useAppSelector(selectFetchedDates);
  const [refreshing, setRefreshing] = useState(false);
  const [filteredRequests, setFilteredRequests] = useState<HelpRequest[]>([]);
  const [olderRequestsLoaded, setOlderRequestsLoaded] = useState(false);
  const [loadedOlderCount, setLoadedOlderCount] = useState(0);
  const { colorScheme } = useColorScheme();

  // Calculate expired requests count
  const now = new Date();
  const expiredRequestsCount = requests.filter(
    (req) => req.startDateTime.toDate() < now && req.status === "open"
  ).length;

  const customTheme: DeepPartial<ThemeConfigs> = {
    // Your custom theme properties here
    colors: {
      background: NAV_THEME[colorScheme].background, // background
      border: NAV_THEME[colorScheme].border, // border
      text: NAV_THEME[colorScheme].text, // foreground
      surface: NAV_THEME[colorScheme].card, // card
      primary: NAV_THEME[colorScheme].primary, // primary
    },
    textStyle: {
      fontFamily: "Quicksand_500Medium",
    },
    hourTextStyle: {
      fontSize: 12,
      fontWeight: "bold",
      color: NAV_THEME[colorScheme].text,
      fontFamily: "Quicksand_500Medium",
    },
    dayName: {
      fontSize: 14,
      color: "#666666",
      fontFamily: "Quicksand_500Medium",
    },
    dayNumber: {
      fontSize: 16,
      fontWeight: "bold",
      fontFamily: "Quicksand_500Medium",
    },
    eventContainerStyle: {
      borderRadius: 4,
    },
    eventTitleStyle: {
      fontSize: 20,
      fontFamily: "Quicksand_500Medium",
    },
  };
  const renderEvent = useCallback(
    (event: PackedEvent) => (
      <View
        style={{
          width: "100%",
          height: "100%",
          padding: 4,
          backgroundColor: event.color,
        }}
      >
        {event.type === "meal" && <Soup color="white" size={20} />}
        {event.type === "grocery" && <ShoppingCart color="white" size={20} />}
        {event.type === "babysit" && <Baby color="white" size={20} />}
        {event.type === "custom" && <HandHelping color="white" size={20} />}
        <Text style={{ color: "white", fontSize: 10 }}>{event.title}</Text>
      </View>
    ),
    []
  );

  const getRequests = async (date: string, forceRefresh: boolean = false) => {
    try {
      if (
        !forceRefresh &&
        fetchedDates &&
        isDateInRange(date.split("T")[0], fetchedDates.start, fetchedDates.end)
      ) {
        console.log("Requests already fetched for this date range");
        return;
      }

      // Use a 45-day window: 15 days back and 30 days forward
      const lookbackDays = 15; // days to look back for expired requests
      const forwardDays = 30; // days to look forward for upcoming requests

      const dateObj = new Date(date);
      const fromDate = new Date(dateObj);
      fromDate.setDate(dateObj.getDate() - lookbackDays); // Look back 15 days
      const toDate = new Date(dateObj);
      toDate.setDate(dateObj.getDate() + forwardDays - 1); // Look forward 30 days

      await dispatch(
        fetchRequests({
          parentId: firestoreUser!.userId,
          from: fromDate.toISOString(),
          to: toDate.toISOString(),
        })
      );
    } catch (error) {
      console.error("Error fetching requests:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  useEffect(() => {
    getRequests(new Date().toISOString());
  }, []);

  useEffect(() => {
    if (filter === "all") {
      setFilteredRequests(requests);
    } else if (filter === "expired") {
      // Filter requests where startDateTime is before the current time and status is still "open"
      const now = new Date();
      setFilteredRequests(
        requests.filter((request) => {
          const startDate = request.startDateTime.toDate();
          return startDate < now && request.status === "open";
        })
      );
    } else {
      setFilteredRequests(
        requests.filter((request) => request.status === filter)
      );
    }
  }, [requests, filter]);

  // Reset older requests state when filter changes
  useEffect(() => {
    if (filter !== "expired") {
      setOlderRequestsLoaded(false);
      setLoadedOlderCount(0);
    }
  }, [filter]);

  const _onDateChanged = (date: string) => {
    getRequests(date);
  };

  const getRequestTypeIcon = (type: TaskType) => {
    switch (type) {
      case "meal":
        return <Soup size={20} color={NAV_THEME[colorScheme].primary} />;
      case "groceries":
        return (
          <ShoppingCart size={20} color={NAV_THEME[colorScheme].primary} />
        );
      case "babysitting":
        return <Baby size={20} color={NAV_THEME[colorScheme].primary} />;
      case "other":
        return <HandHelping size={20} color={NAV_THEME[colorScheme].primary} />;
      case "childcare":
        return <Baby size={20} color={NAV_THEME[colorScheme].primary} />;
      default:
        return null;
    }
  };

  const sortedRequests = useMemo(() => {
    const now = new Date();
    const requestsCopy = [...filteredRequests];

    if (filter === "expired") {
      // For expired filter, show most recently expired first
      return requestsCopy.sort((a, b) => {
        const startTimeA = a.startDateTime.toDate();
        const startTimeB = b.startDateTime.toDate();
        // Sort from newest to oldest expiration
        return startTimeB.getTime() - startTimeA.getTime();
      });
    } else {
      // For all other filters
      return requestsCopy.sort((a, b) => {
        const startTimeA = a.startDateTime.toDate();
        const startTimeB = b.startDateTime.toDate();
        const isExpiredA = startTimeA < now && a.status === "open";
        const isExpiredB = startTimeB < now && b.status === "open";

        // If one is expired and the other isn't, put the non-expired first
        if (isExpiredA && !isExpiredB) return 1;
        if (!isExpiredA && isExpiredB) return -1;

        // Otherwise sort by start time (ascending)
        return startTimeA.getTime() - startTimeB.getTime();
      });
    }
  }, [filteredRequests, filter]);

  const isAndroid = Platform.OS === "android";

  const AnimatedTaskCard = ({
    request,
    index,
  }: {
    request: HelpRequest;
    index: number;
  }) => {
    const now = new Date();
    const isExpired =
      request.startDateTime.toDate() < now && request.status === "open";

    const getDuration = (start: Date, end: Date) => {
      const duration = end.getTime() - start.getTime();
      const hours = Math.floor(duration / (1000 * 3600));
      const minutes = Math.floor((duration % (1000 * 3600)) / (1000 * 60));
      if (hours > 0) {
        if (minutes > 0) {
          return `${hours} hrs ${minutes} mins`;
        } else {
          return `${hours} hrs`;
        }
      } else {
        return `${minutes} mins`;
      }
    };

    return (
      <Animated.View entering={FadeInDown.duration(500)}>
        <Link key={request.id} href={`/parent/requests/${request.id}`}>
          <View className="w-full">
            <Card
              className={`p-4 mb-4 ${
                isExpired ? "border-dashed border-destructive/30" : ""
              }`}
              style={isExpired ? { opacity: 0.75 } : undefined}
            >
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center flex-1 mr-2 gap-2">
                  {getRequestTypeIcon(request.type)}
                  <Text
                    className={`text-lg ml-2 flex-1 ${
                      isExpired ? "text-muted-foreground" : ""
                    }`}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={{ fontFamily: "Quicksand_700Bold" }}
                  >
                    {request.title}
                  </Text>
                </View>
                {isExpired ? (
                  <Badge
                    variant="outline"
                    className="bg-destructive/10 border-destructive/30"
                  >
                    <Text className="text-sm text-destructive">Missed</Text>
                  </Badge>
                ) : (
                  <Badge
                    variant={request.status === "open" ? "outline" : "default"}
                  >
                    <Text className="text-sm capitalize">{request.status}</Text>
                  </Badge>
                )}
              </View>
              <View className="flex-row items-center mb-2">
                <Text
                  className={`text-sm ${
                    isExpired
                      ? "text-muted-foreground/70"
                      : "text-muted-foreground"
                  }`}
                >
                  {format(
                    request.startDateTime.toDate(),
                    "EEEE, MMMM d 'at' h:mm a"
                  )}
                </Text>
              </View>
              <View className="flex-row justify-between items-center">
                <View className="flex-row items-center gap-2">
                  <Text
                    className={`text-sm ${
                      isExpired
                        ? "text-muted-foreground/70"
                        : "text-muted-foreground"
                    }`}
                  >
                    {request.endDateTime
                      ? `Duration: ${getDuration(
                          request.startDateTime.toDate(),
                          request.endDateTime.toDate()
                        )}`
                      : ""}
                  </Text>
                </View>
                <Badge
                  variant={isExpired ? "outline" : "secondary"}
                  className={isExpired ? "border-muted-foreground/30" : ""}
                >
                  <Text
                    className={`text-sm capitalize ${
                      isExpired ? "text-muted-foreground/70" : ""
                    }`}
                  >
                    {request.urgency}
                  </Text>
                </Badge>
              </View>
            </Card>
          </View>
        </Link>
      </Animated.View>
    );
  };

  const renderEmptyState = () => (
    <Animated.View
      entering={FadeInUp.duration(800)}
      className="flex-1 items-center justify-center p-6"
    >
      <LayoutList size={64} color={NAV_THEME[colorScheme].primary} />
      <Text
        className="text-2xl text-primary mt-4 mb-2"
        style={{ fontFamily: "Quicksand_700Bold" }}
      >
        No Requests Yet
      </Text>
      {firestoreUser?.emailVerified ? (
        <>
          <Text
            className="text-muted-foreground text-center mb-6 text-lg"
            style={{ fontFamily: "Quicksand_500Medium" }}
          >
            Create a request to get help from your support network
          </Text>
          <Link href="/parent/requests/create-new" asChild>
            <Button className="w-full">
              <Text>Create a Request</Text>
            </Button>
          </Link>
        </>
      ) : (
        <EmailVerifiedBanner
          email={firestoreUser!.email!}
          alertTitle="Please verify your email to be able to create requests. Tap here for details."
        />
      )}
    </Animated.View>
  );

  const renderListView = () => (
    <FlatList
      data={sortedRequests}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <AnimatedTaskCard request={item} index={index} />
      )}
      contentContainerStyle={{ padding: 16, paddingTop: 0 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
            getRequests(fiveDaysAgo.toISOString(), true);
          }}
          colors={["#5C6BC0"]}
          tintColor="#5C6BC0"
        />
      }
      ListHeaderComponent={
        filter === "expired" ? (
          <Animated.View entering={FadeIn.duration(500)}>
            <View className="mb-4 px-3 py-2.5 bg-muted rounded-lg">
              <Text
                style={{ fontFamily: "Quicksand_500Medium" }}
                className="text-muted-foreground text-center"
              >
                Note: Only open requests from the past 15 days are considered
                missed and shown here.
              </Text>

              {olderRequestsLoaded && (
                <Text className="text-xs text-center mt-2 text-muted-foreground">
                  {loadedOlderCount > 0
                    ? `Found ${loadedOlderCount} additional missed ${
                        loadedOlderCount === 1 ? "request" : "requests"
                      }`
                    : "No additional missed requests found in the past 90 days"}
                </Text>
              )}
            </View>
          </Animated.View>
        ) : null
      }
      ListEmptyComponent={() => (
        <Animated.View
          entering={FadeIn.duration(500)}
          className="p-6 items-center justify-center"
        >
          {loading ? (
            <>
              <ActivityIndicator
                size="large"
                color={NAV_THEME[colorScheme].primary}
              />
              <Text className="text-center mt-4 text-muted-foreground">
                Loading requests...
              </Text>
            </>
          ) : (
            <>
              <Text
                className="text-center text-2xl"
                style={{ fontFamily: "Quicksand_700Bold" }}
              >
                {filter === "expired"
                  ? "No missed requests found"
                  : "No tasks match the selected filter"}
              </Text>
              {filter === "expired" && (
                <>
                  <Text
                    style={{ fontFamily: "Quicksand_500Medium" }}
                    className="text-center text-lg mt-2 text-muted-foreground"
                  >
                    Tasks that passed their start time without being claimed
                    will appear here
                  </Text>
                </>
              )}
            </>
          )}
        </Animated.View>
      )}
    />
  );

  return (
    <SafeAreaView className="flex-1 bg-background px-4">
      <View className="flex flex-row justify-between items-center px-4 pt-4 pb-2">
        <Text
          className="text-2xl text-foreground"
          style={{ fontFamily: "Quicksand_700Bold" }}
        >
          Help Requests
        </Text>
        <View className="flex-row items-center gap-2">
          {/* <Animated.View entering={FadeInDown.delay(400).duration(600)}>
            <Animated.View style={refreshButtonAnimatedStyle}>
              <TouchableOpacity
                style={styles.refreshButton}
                onPress={handleRefresh}
              >
                <Ionicons name="refresh" size={24} color="#4a6da7" />
              </TouchableOpacity>
            </Animated.View>
          </Animated.View> */}

          {firestoreUser?.emailVerified && (
            <Link href="/parent/requests/create-new" asChild>
              <Button className="rounded-full w-12 h-12">
                <Plus size={24} color={NAV_THEME[colorScheme].background} />
              </Button>
            </Link>
          )}
        </View>
      </View>
      {requests.length > 0 && (
        <Animated.View entering={FadeInDown.duration(600)}>
          <View className="px-4 pb-4">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {["all", "open", "claimed", "completed", "expired"].map(
                (filterOption, index) => (
                  <Animated.View
                    key={filterOption}
                    entering={SlideInRight.duration(400)}
                  >
                    <TouchableOpacity
                      className={cn(
                        "px-4 py-2 rounded-md bg-muted mr-2 flex-row items-center",
                        filter === filterOption && "bg-primary text-white",
                        filterOption === "expired" &&
                          filter !== "expired" &&
                          "bg-destructive/10 border border-destructive/20"
                      )}
                      onPress={() => setFilter(filterOption as any)}
                    >
                      {filterOption === "expired" && (
                        <Clock
                          size={14}
                          className="mr-1"
                          color={filter === "expired" ? "white" : "#ef4444"}
                        />
                      )}
                      <Text
                        className={cn(
                          "text-sm",
                          filter === filterOption && "text-white",
                          filterOption === "expired" &&
                            filter !== "expired" &&
                            "text-destructive"
                        )}
                      >
                        {filterOption === "expired"
                          ? "Missed"
                          : filterOption.charAt(0).toUpperCase() +
                            filterOption.slice(1)}
                        {filterOption === "expired" &&
                          expiredRequestsCount > 0 &&
                          ` (${expiredRequestsCount})`}
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                )
              )}
            </ScrollView>
          </View>
        </Animated.View>
      )}

      {error && (
        <View className="mx-2 mt-4">
          <Alert icon={AlertTriangle} variant="destructive">
            <AlertTitle>Error!</AlertTitle>
            <AlertDescription>
              Could not load requests. Please try again later!
            </AlertDescription>
          </Alert>
        </View>
      )}

      {viewMode === "calendar" ? (
        <CalendarContainer
          allowPinchToZoom={true}
          isLoading={loading}
          onDateChanged={_onDateChanged}
          theme={customTheme}
          numberOfDays={3}
          scrollByDay={false}
          minDate={format(new Date(), "yyyy-MM-dd")}
          events={mapHelpRequestsToEvents(requests)}
          onPressEvent={(event) => {
            router.push(`/parent/requests/${event.id}`);
          }}
        >
          <CalendarHeader />
          <CalendarBody renderEvent={renderEvent} />
        </CalendarContainer>
      ) : loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator
            size="large"
            color={NAV_THEME[colorScheme].primary}
          />
          <Text style={{ fontFamily: "Quicksand_700Bold" }}>
            Loading your tasks...
          </Text>
        </View>
      ) : requests.length > 0 ? (
        renderListView()
      ) : (
        renderEmptyState()
      )}
    </SafeAreaView>
  );
}
