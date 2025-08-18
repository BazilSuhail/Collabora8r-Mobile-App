// JoinedSkeletonLoader.jsx
import { View, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const JoinedSkeletonLoader = () => {
  return (
    <View className="flex-1">
      <ScrollView
        className="flex-1 px-3 py-4 bg-gray-100"
        showsVerticalScrollIndicator={false}
      >
        {/* Header Skeleton */}
        <View className="border-b border-gray-100 px-3 py-4 mb-8">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-gray-200 rounded-full items-center justify-center animate-pulse" />
              <View className="ml-3">
                <View className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
                <View className="h-3 bg-gray-200 rounded w-32 mt-2 animate-pulse" />
              </View>
            </View>
            <View className="w-20 h-6 bg-gray-200 rounded-full animate-pulse" />
          </View>
        </View>

        {/* Project Cards Skeleton */}
        {[1, 2, 3,4].map((item) => (
          <View
            key={item}
            className="bg-white rounded-2xl mb-2 border border-gray-200 overflow-hidden"
          >
            <View className="relative h-[148px] w-full bg-gray-200 animate-pulse">
              {/* Content Overlay Skeleton */}
              <View className="absolute inset-0 p-5">
                {/* Top Section */}
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <View className="h-6 bg-gray-300 rounded w-3/4 mb-2 animate-pulse" />
                    <View className="h-3 bg-gray-300 rounded w-24 animate-pulse" />
                  </View>

                  {/* Creator Info Skeleton */}
                  <View className="items-center ml-3">
                    <View className="w-12 h-12 bg-gray-300 rounded-full animate-pulse" />
                    <View className="h-3 bg-gray-300 rounded w-16 mt-2 animate-pulse" />
                  </View>
                </View>

                {/* Bottom Section */}
                <View className="flex-row items-end mt-7 justify-between">
                  <View className="flex-row">
                    {/* Team Count Skeleton */}
                    <View className="flex-row items-center">
                      <View className="bg-gray-300 rounded-full p-[6px] animate-pulse">
                        <View className="w-3 h-3 bg-gray-400 rounded-full" />
                      </View>
                      <View className="h-4 bg-gray-300 rounded w-8 ml-1 animate-pulse" />
                    </View>

                    {/* Task Count Skeleton */}
                    <View className="flex-row items-center ml-3">
                      <View className="bg-gray-300 rounded-full p-[6px] animate-pulse">
                        <View className="w-3 h-3 bg-gray-400 rounded-full" />
                      </View>
                      <View className="h-4 bg-gray-300 rounded w-8 ml-1 animate-pulse" />
                    </View>
                  </View>

                  {/* Action Indicator Skeleton */}
                  <View className="bg-gray-300 rounded-full p-2 animate-pulse">
                    <View className="w-4 h-4 bg-gray-400 rounded-full" />
                  </View>
                </View>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default JoinedSkeletonLoader;