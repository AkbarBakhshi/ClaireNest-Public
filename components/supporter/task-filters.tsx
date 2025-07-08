import React, { forwardRef, useCallback } from "react";
import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { H1 } from "@/components/ui/typography";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { NAV_THEME } from "@/lib/constants";
import { useColorScheme } from "@/lib/useColorScheme";

interface TaskFiltersProps {
  urgencyFilter: string[];
  typeFilter: string[];
  parentFilter: string[];
  onToggleFilter: (
    filter: string,
    setFilter: (value: string[]) => void,
    currentFilters: string[]
  ) => void;
  setUrgencyFilter: (value: string[]) => void;
  setTypeFilter: (value: string[]) => void;
  setParentFilter: (value: string[]) => void;
  onClearFilters: () => void;
  onApplyFilters: () => void;
  approvedFamilies?: any[];
  snapPoints: string[];
}

export const TaskFilters = forwardRef<BottomSheetModal, TaskFiltersProps>(
  (
    {
      urgencyFilter,
      typeFilter,
      parentFilter,
      onToggleFilter,
      setUrgencyFilter,
      setTypeFilter,
      setParentFilter,
      onClearFilters,
      onApplyFilters,
      approvedFamilies = [],
      snapPoints,
    },
    ref
  ) => {
    const { colorScheme } = useColorScheme();

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          pressBehavior={"close"}
        />
      ),
      []
    );

    return (
      <BottomSheetModal
        ref={ref}
        index={3}
        snapPoints={snapPoints}
        enableDynamicSizing={true}
        backdropComponent={renderBackdrop}
        backgroundStyle={{
          backgroundColor: NAV_THEME[colorScheme].background,
        }}
      >
        <BottomSheetView className="bg-background">
          <View className="flex-col mt-4 px-9 justify-center w-full bg-background">
            <H1 className="text-4xl mb-4" style={{fontFamily: "Quicksand_700Bold"}}>Filter Tasks</H1>
            <View className="flex-row items-start justify-between w-full">
              <View>
                <Text
                  className="text-lg mb-3"
                  style={{ fontFamily: "Quicksand_700Bold" }}
                >
                  Filter by urgency
                </Text>
                {["low", "medium", "high"].map((urgency, index) => (
                  <View
                    key={urgency}
                    className="flex-row items-center gap-2 mb-2"
                  >
                    <Checkbox
                      id={`urgency-filter-${index}`}
                      checked={urgencyFilter.includes(urgency)}
                      onCheckedChange={() =>
                        onToggleFilter(
                          urgency,
                          setUrgencyFilter,
                          urgencyFilter
                        )
                      }
                    />
                    <Label
                      nativeID={`urgency-filter-${index}`}
                      className="capitalize"
                    >
                      {urgency}
                    </Label>
                  </View>
                ))}
              </View>
              <View>
                <Text
                  className="text-lg mb-3"
                  style={{ fontFamily: "Quicksand_700Bold" }}
                >
                  Filter by type
                </Text>
                {["meal", "groceries", "babysitting", "childcare", "other"].map(
                  (type, index) => (
                    <View
                      key={type}
                      className="flex-row items-center gap-2 mb-2"
                    >
                      <Checkbox
                        id={`type-filter-${index}`}
                        checked={typeFilter.includes(type)}
                        onCheckedChange={() =>
                          onToggleFilter(type, setTypeFilter, typeFilter)
                        }
                      />
                      <Label
                        nativeID={`type-filter-${index}`}
                        className="capitalize"
                      >
                        {type}
                      </Label>
                    </View>
                  )
                )}
              </View>
            </View>

            {approvedFamilies.length > 0 && (
              <>
                <Text
                  className="text-lg mb-3"
                  style={{ fontFamily: "Quicksand_700Bold" }}
                >
                  Filter by family
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {approvedFamilies.map((family, index) => (
                    <View
                      key={family.userId}
                      className="flex-row items-center gap-2 mb-2"
                    >
                      <Checkbox
                        id={`parent-filter-${index}`}
                        checked={parentFilter.includes(family.userId)}
                        onCheckedChange={() =>
                          onToggleFilter(
                            family.userId,
                            setParentFilter,
                            parentFilter
                          )
                        }
                      />
                      <Label nativeID={`parent-filter-${index}`}>
                        {family.displayName
                          ? family.displayName
                          : family.firstName && family.lastName
                          ? family.firstName + " " + family.lastName
                          : family.firstName
                          ? family.firstName
                          : family.lastName
                          ? family.lastName
                          : "Unknown Family"}
                      </Label>
                    </View>
                  ))}
                </View>
              </>
            )}

            <View className="flex-row mt-4">
              <Button
                onPress={onClearFilters}
                variant="outline"
                className="flex-1 mr-2"
              >
                <Text>Clear Filters</Text>
              </Button>
              <Button onPress={onApplyFilters} className="flex-1 ml-2">
                <Text className="text-white">Apply Filters</Text>
              </Button>
            </View>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    );
  }
);

TaskFilters.displayName = "TaskFilters"; 