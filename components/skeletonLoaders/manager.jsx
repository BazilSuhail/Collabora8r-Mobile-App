// ManagerSkeletonLoader.jsx
import { ScrollView, View } from 'react-native';

const ManagerSkeletonLoader = () => {
  return (
    <ScrollView className="flex-1 bg-white px-4 py-5">
      {/* Header Skeleton */}
      <View className="mx-1 pb-4 mb-4 flex-row items-center justify-between border-b-[2px] border-gray-200">
        <View className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
        <View className="w-20 h-6 bg-gray-200 rounded-full animate-pulse" />
      </View>

      {/* Project Cards Skeleton */}
      {[1, 2, 3].map((item) => (
        <View
          key={item}
          className="w-full bg-white border-2 border-gray-200 rounded-2xl overflow-hidden mb-4"
        >
          {/* Project Header Skeleton */}
          <View className="relative w-full h-[150px] bg-gray-200 animate-pulse">
            <View className="absolute h-[150px] pt-5 inset-0 w-full px-[18px] z-10">
              {/* Project Name and Status */}
              <View className="flex-row items-start justify-between">
                <View className="flex-1">
                  <View className="h-5 bg-gray-300 rounded w-3/4 mb-2 animate-pulse" />
                  <View className="h-3 bg-gray-300 rounded w-24 animate-pulse" />
                </View>

                {/* Creator Info Skeleton */}
                <View className="items-center ml-3">
                  <View className="w-10 h-10 bg-gray-300 rounded-full animate-pulse" />
                  <View className="h-3 bg-gray-300 rounded w-16 mt-2 animate-pulse" />
                </View>
              </View>

              {/* Stats Skeleton */}
              <View className="flex-row mt-5 items-center mb-2">
                <View className="w-3 h-3 bg-gray-300 rounded animate-pulse" />
                <View className="ml-2 h-3 bg-gray-300 rounded w-16 animate-pulse" />
                <View className="ml-2 h-3 bg-gray-300 rounded w-12 animate-pulse" />
              </View>
              <View className="flex-row items-center">
                <View className="w-3 h-3 bg-gray-300 rounded animate-pulse" />
                <View className="ml-2 h-3 bg-gray-300 rounded w-16 animate-pulse" />
                <View className="ml-2 h-3 bg-gray-300 rounded w-12 animate-pulse" />
              </View>
            </View>
          </View>

          {/* Project Details Card Skeleton */}
          <View className="flex-row p-4 w-full items-center justify-between">
            <View className="flex-row items-center">
              <View className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
              <View className="ml-3">
                <View className="h-4 bg-gray-200 rounded w-24 mb-1 animate-pulse" />
                <View className="h-3 bg-gray-200 rounded w-32 animate-pulse" />
              </View>
            </View>

            <View className="flex-row items-center">
              <View className="w-16 h-5 bg-gray-200 rounded-full animate-pulse" />
              <View className="w-4 h-4 bg-gray-200 rounded ml-2 animate-pulse" />
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

export default ManagerSkeletonLoader;