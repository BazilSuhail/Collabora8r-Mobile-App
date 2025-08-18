// WorkflowSkeletonLoader.jsx
import { View, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const WorkflowSkeletonLoader = () => {
  const insets = useSafeAreaInsets();
  
  // Create array of skeleton items
  const skeletonTasks = Array(3).fill(0);
  const statusSections = ['Not Started', 'In Progress', 'Completed'];

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        <View className="py-6">
          {/* Header Skeleton */}
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-xl bg-gray-200 animate-pulse mr-3" />
              <View>
                <View className="h-6 bg-gray-200 rounded w-40 mb-2 animate-pulse" />
                <View className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
              </View>
            </View>
            <View className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
          </View>

          {/* Stats Card Skeleton */}
          <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mt-4">
            <View className="flex-row justify-between">
              {[1, 2, 3, 4].map((item) => (
                <View key={item} className="items-center">
                  <View className="h-8 bg-gray-200 rounded w-10 mb-1 animate-pulse" />
                  <View className="h-3 bg-gray-200 rounded w-12 animate-pulse" />
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Status Sections Skeleton */}
        {statusSections.map((status, index) => (
          <View key={index} className="mb-6">
            {/* Section Header Skeleton */}
            <View className="flex-row items-center justify-between p-4 rounded-t-xl bg-gray-100 border-l-4 border-gray-300">
              <View className="flex-row items-center">
                <View className="w-5 h-5 bg-gray-200 rounded-full animate-pulse mr-3" />
                <View className="h-5 bg-gray-200 rounded w-24 animate-pulse" />
              </View>
              <View className="w-8 h-5 bg-gray-200 rounded-full animate-pulse" />
            </View>

            {/* Section Content Skeleton */}
            <View className="p-4 rounded-b-xl bg-gray-50 border border-t-0 border-gray-200">
              {skeletonTasks.map((_, taskIndex) => (
                <View key={taskIndex} className="bg-white rounded-xl p-4 mb-3 animate-pulse">
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center flex-1">
                      <View className="w-8 h-8 rounded-full bg-gray-200 mr-3 animate-pulse" />
                      <View className="h-4 bg-gray-200 rounded flex-1 animate-pulse" />
                    </View>
                    <View className="flex-row">
                      <View className="w-4 h-4 bg-gray-200 rounded mr-2 animate-pulse" />
                      <View className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
                    </View>
                  </View>
                  <View className="flex-row items-center mb-3">
                    <View className="w-4 h-4 bg-gray-200 rounded mr-2 animate-pulse" />
                    <View className="h-3 bg-gray-200 rounded w-32 animate-pulse" />
                  </View>
                  <View className="flex-row justify-between items-center">
                    <View className="h-6 bg-gray-200 rounded-full w-20 animate-pulse" />
                    <View className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default WorkflowSkeletonLoader;