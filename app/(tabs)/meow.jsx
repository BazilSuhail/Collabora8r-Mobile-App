import { Component } from "react";
import { Image, Text, View } from "react-native";

export default class Meow extends Component {
  render() {
    return (
      <View className="flex-1 w-full p-8 items-center">
        <View className="w-[250px] h-[250px]">
          <Image
            source={require("@/assets/placeholders/noTasks.png")}
            className="w-full h-full"
            resizeMode="contain" // ensures it scales inside without cropping
          />
        </View>

        <Text className="text-gray-500 mt-5 text-[15px] font-medium mb-2">
          No tasks found
        </Text>
        <Text className="text-gray-400 text-[12px] w-[220px] text-center">
          Try adjusting your filters or create a new task to get started.
        </Text>
      </View>
    );
  }
}
