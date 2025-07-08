import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { CheckCircle } from "@/lib/icons/CheckCircle";
import { CircleX } from "@/lib/icons/CircleX";
import { CircleAlert } from "@/lib/icons/CircleAlert";
import Toast from "react-native-toast-message";

const CustomToast = () => {
  const toastConfig = {
    success: (internalState: any) => (
      <View
        style={{ width: "90%" }}
        className="flex-row items-center justify-between gap-2 rounded-xl px-4 py-2 bg-background border"
      >
        <CheckCircle color="green" />
        <View style={{ width: "90%" }}>
          <Text style={{ fontFamily: "Quicksand_700Bold", color: "green" }}>
            {internalState.text1}
          </Text>
          <Text style={{ fontFamily: "Quicksand_400Regular" }}>
            {internalState.text2}
          </Text>
        </View>
      </View>
    ),
    error: (internalState: any) => (
      <View
        style={{ width: "90%" }}
        className="flex-row items-center justify-between gap-2 rounded-xl px-4 py-2 bg-background border"
      >
        <CircleX color="red" />
        <View style={{ width: "90%" }}>
          <Text style={{ fontFamily: "Quicksand_700Bold", color: "red" }}>
            {internalState.text1}
          </Text>
          <Text style={{ fontFamily: "Quicksand_400Regular" }}>
            {internalState.text2}
          </Text>
        </View>
      </View>
    ),
    info: (internalState: any) => (
      <View
        style={{ width: "90%" }}
        className="flex-row items-center justify-between gap-2 rounded-xl px-4 py-2 bg-background border"
      >
        <CircleAlert color="orange" />
        <View style={{ width: "90%" }}>
          <Text style={{ fontFamily: "Quicksand_700Bold", color: "orange" }}>
            {internalState.text1}
          </Text>
          <Text style={{ fontFamily: "Quicksand_400Regular" }}>
            {internalState.text2}
          </Text>
        </View>
      </View>
    ),
  };
  return <Toast config={toastConfig} />;
};

export default CustomToast;
