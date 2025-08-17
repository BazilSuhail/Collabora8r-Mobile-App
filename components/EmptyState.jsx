import { Image, Text, View } from "react-native";

export default function EmptyState({ title, desc }) {
  return (
    <View className="flex-1 w-full p-8 items-center justify-center mb-5">
      <View className="w-[250px] h-[250px]">
        <Image
          source={require("@/assets/placeholders/noTasks.png")}
          className="w-full h-full"
          resizeMode="contain"
        />
      </View>

      <Text className="text-gray-500 mt-5 text-[15px] font-medium mb-2">
        {title}
      </Text>

      {desc && (
        <Text className="text-gray-400 text-[12px] w-[220px] text-center">
          {desc}
        </Text>
      )}
    </View>
  );
}
