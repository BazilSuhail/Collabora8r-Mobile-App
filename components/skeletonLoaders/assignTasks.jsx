// AssignTasksSkeletonLoader.jsx
import { View, ScrollView, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';

const AssignTasksSkeletonLoader = () => {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      className="flex-1 bg-gray-100"
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingBottom: insets.bottom + 8,
        paddingHorizontal: 16
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Project Header Skeleton */}
      <View className="bg-white rounded-2xl px-4 py-6 mb-5">
        <View className="flex-row justify-between items-start">
          <View className="flex-row items-center flex-1">
            <View className="w-16 h-[60px] bg-gray-200 rounded-2xl justify-center items-center mr-4 animate-pulse" />
            <View className="flex-1">
              <View className="h-6 bg-gray-200 rounded w-3/4 mb-2 animate-pulse" />
              <View className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
            </View>
          </View>
        </View>
      </View>

      {/* Create Task Button Skeleton */}
      <View className="bg-gray-200 flex-row items-center justify-center py-3 px-6 rounded-xl mb-6 animate-pulse">
        <View className="w-4 h-4 bg-gray-300 rounded-full mr-2" />
        <View className="h-4 bg-gray-300 rounded w-32 animate-pulse" />
      </View>

      {/* Tasks Section Header Skeleton */}
      <View className="flex-row bg-white rounded-xl p-4 items-center mb-4">
        <View className="w-6 h-6 bg-gray-200 rounded-full animate-pulse" />
        <View className="h-5 bg-gray-200 rounded w-32 ml-2 animate-pulse" />
        <View className="h-5 bg-gray-200 rounded-full w-16 ml-auto animate-pulse" />
      </View>

      {/* Task Cards Skeleton */}
      {[1, 2, 3].map((item) => (
        <View key={item} className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100">
          {/* Task Header Skeleton */}
          <View className="flex-row items-start justify-between mb-3">
            <View className="flex-1">
              <View className="h-5 bg-gray-200 rounded w-3/4 mb-2 animate-pulse" />
              <View className="h-4 bg-gray-200 rounded w-full mb-1 animate-pulse" />
              <View className="h-4 bg-gray-200 rounded w-5/6 animate-pulse" />
            </View>

            {/* Actions Skeleton */}
            <View className="flex-row items-center ml-4" style={{ gap: 12 }}>
              <View className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse" />
              <View className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse" />
            </View>
          </View>

          {/* Task Details Skeleton */}
          <View className="flex-row items-center justify-between mb-3" style={{ gap: 8 }}>
            <View className="flex-row items-center px-2 py-1 rounded-full bg-gray-100">
              <View className="w-4 h-4 bg-gray-200 rounded-full animate-pulse" />
              <View className="h-3 bg-gray-200 rounded w-12 ml-1 animate-pulse" />
            </View>

            <View className="flex-row items-center px-2 py-1 rounded-full bg-gray-100">
              <View className="w-4 h-4 bg-gray-200 rounded-full animate-pulse" />
              <View className="h-3 bg-gray-200 rounded w-16 ml-1 animate-pulse" />
            </View>
          </View>

          {/* Assignee and Due Date Skeleton */}
          <View className="flex-row items-center pt-3 border-t border-gray-100">
            <View className="flex-row items-center flex-1">
              <View className="w-8 h-8 bg-gray-200 rounded-full mr-3 animate-pulse" />
              <View>
                <View className="h-4 bg-gray-200 rounded w-24 mb-1 animate-pulse" />
                <View className="h-3 bg-gray-200 rounded w-32 animate-pulse" />
              </View>
            </View>

            <View className="flex-row items-center">
              <View className="w-3 h-3 bg-gray-200 rounded-full mr-1 animate-pulse" />
              <View className="h-3 bg-gray-200 rounded w-20 animate-pulse" />
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

export default AssignTasksSkeletonLoader;