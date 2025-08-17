import { View, ScrollView } from "react-native";

const HomeLoader = () => {
  return (
    <ScrollView showsVerticalScrollIndicator={false} className="bg-gray-100 flex-1">
      <View className="px-4 pt-6 pb-8">
        {/* Header Skeleton */}
        <View className="relative h-40 rounded-t-2xl rounded-b-md overflow-hidden mb-3 bg-gray-200 animate-pulse" />
        
        {/* Overview Section Skeleton */}
        <View className="mb-6">
          {/* Top Row */}
          <View className="flex-row justify-between mb-4">
            {/* Time Tracked Skeleton */}
            <View className="flex-1 mr-2">
              <View className="bg-white rounded-lg p-6 items-start relative">
                <View className="absolute top-2 right-2 bg-gray-200 rounded-full w-5 h-5 animate-pulse" />
                <View className="w-8 h-8 bg-gray-200 rounded-lg mb-3 animate-pulse" />
                <View className="w-12 h-6 bg-gray-200 rounded mb-1 animate-pulse" />
                <View className="w-20 h-3 bg-gray-200 rounded animate-pulse" />
              </View>
            </View>

            {/* Projects Finished Skeleton */}
            <View className="flex-1 ml-2">
              <View className="bg-white rounded-lg p-6 items-start">
                <View className="absolute top-3 right-3 bg-gray-200 rounded-full w-4 h-4 animate-pulse" />
                <View className="w-8 h-8 bg-gray-200 rounded-lg mb-3 animate-pulse" />
                <View className="w-12 h-6 bg-gray-200 rounded mb-1 animate-pulse" />
                <View className="w-24 h-3 bg-gray-200 rounded animate-pulse" />
              </View>
            </View>
          </View>

          {/* Bottom Row */}
          <View className="flex-row justify-between">
            {/* Total Revenue Skeleton */}
            <View className="flex-1 mr-2">
              <View className="bg-white rounded-lg p-6 items-start">
                <View className="absolute top-3 right-3 bg-gray-200 rounded-full w-4 h-4 animate-pulse" />
                <View className="w-8 h-8 bg-gray-200 rounded-lg mb-3 animate-pulse" />
                <View className="w-12 h-6 bg-gray-200 rounded mb-1 animate-pulse" />
                <View className="w-24 h-3 bg-gray-200 rounded animate-pulse" />
              </View>
            </View>

            {/* Total Members Skeleton */}
            <View className="flex-1 ml-2">
              <View className="bg-white rounded-lg p-6 items-start">
                <View className="absolute top-3 right-3 bg-gray-200 rounded-full w-4 h-4 animate-pulse" />
                <View className="w-8 h-8 bg-gray-200 rounded-lg mb-3 animate-pulse" />
                <View className="w-12 h-6 bg-gray-200 rounded mb-1 animate-pulse" />
                <View className="w-24 h-3 bg-gray-200 rounded animate-pulse" />
              </View>
            </View>
          </View>
        </View>

        {/* Task Statistics Skeleton */}
        <View className="mb-6">
          <View className="bg-white rounded-xl p-4">
            <View className="flex-row justify-between" style={{ gap: 12 }}>
              {[1, 2, 3].map((item) => (
                <View key={item} className="flex-1 items-center">
                  <View className="w-full h-24 bg-gray-100 rounded-xl items-center justify-center relative p-2 animate-pulse">
                    <View className="absolute -top-1 -right-1 w-6 h-6 bg-gray-200 rounded-full animate-pulse" />
                    <View className="w-12 h-12 bg-gray-200 rounded-lg mb-1 animate-pulse" />
                    <View className="w-16 h-3 bg-gray-200 rounded animate-pulse" />
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Status Filter Skeleton */}
        <View className="mb-6">
          <View className="flex-row px-1" style={{ gap: 8 }}>
            {[1, 2, 3, 4].map((item) => (
              <View 
                key={item} 
                className="flex-row items-center px-4 py-2.5 rounded-lg bg-white animate-pulse"
              >
                <View className="w-14 h-4 bg-gray-200 rounded" />
              </View>
            ))}
          </View>
        </View>

        {/* To-do List Section Skeleton */}
        <View className="min-h-[400px]">
          <View className="flex-row items-center justify-between mb-3">
            <View className="w-24 h-6 bg-gray-200 rounded animate-pulse" />
            <View className="w-16 h-4 bg-gray-200 rounded animate-pulse" />
          </View>
          
          <View className="]" style={{ gap: 12 }}>
            {[1, 2, 3, 4, 5].map((item) => (
              <View 
                key={item} 
                className="bg-white rounded-xl p-4 animate-pulse"
              >
                <View className="flex-row items-start">
                  <View className="w-10 h-10 rounded-lg bg-gray-200 mr-3 animate-pulse" />
                  <View className="flex-1">
                    <View className="w-3/4 h-4 bg-gray-200 rounded mb-2 animate-pulse" />
                    <View className="flex-row items-center justify-between mb-2">
                      <View className="w-16 h-6 bg-gray-200 rounded-full animate-pulse" />
                      <View className="w-20 h-3 bg-gray-200 rounded animate-pulse" />
                    </View>
                    <View className="w-full h-2 bg-gray-200 rounded-full mb-1 animate-pulse" />
                    <View className="w-12 h-3 bg-gray-200 rounded animate-pulse" />
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default HomeLoader;