import { Image, Text, View } from "react-native";

export default function EmptyState({ title, desc, imageSource, imageWidth = 200, imageHeight = 200 }) {
  return (
    <View className="flex-1 w-full p-8 items-center justify-center mb-5">
      <View className="w-[200px] h-[200px]" style={{ width: imageWidth, height: imageHeight }}>
        <Image
          source={imageSource}
          className="w-full h-full"
          resizeMode="contain"
        />
      </View>

      <Text className="text-gray-500 mt-5 text-[15px] font-medium mb-2">
        {title}
      </Text>

      {desc && (
        <Text className="text-gray-400 text-[12px] w-[200px] text-center">
          {desc}
        </Text>
      )}
    </View>
  );
}