// TaskDetailsSkeletonLoader.jsx
import { View, ScrollView, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

const TaskDetailsSkeletonLoader = () => {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-gray-100 px-4 pt-2">
      <ScrollView
        contentContainerStyle={{ 
          paddingTop: insets.top + 8, 
          paddingBottom: insets.bottom + 65 
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Task Header Skeleton */}
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

        {/* Task Description Skeleton */}
        <View className="bg-white rounded-2xl p-5 mb-6">
          <View className="flex-row items-center mb-4">
            <View className="w-10 h-10 bg-gray-200 rounded-full justify-center items-center mr-3 animate-pulse" />
            <View className="h-5 bg-gray-200 rounded w-32 animate-pulse" />
          </View>
          
          <View className="mb-5" style={{gap:6}}>
            <View className="h-4 bg-gray-200 rounded w-full animate-pulse" />
            <View className="h-4 bg-gray-200 rounded w-5/6 animate-pulse" />
            <View className="h-4 bg-gray-200 rounded w-4/6 animate-pulse" />
          </View>

          <View className="h-[2px] my-5 w-full bg-gray-100"></View>

          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="w-8 h-8 bg-gray-200 rounded-lg items-center justify-center mr-3 animate-pulse" />
              <View>
                <View className="h-3 bg-gray-200 rounded w-16 mb-1 animate-pulse" />
                <View className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
              </View>
            </View>

            <View className="flex-row items-center mr-2">
              <View className="w-8 h-8 bg-gray-200 rounded-lg items-center justify-center mr-3 animate-pulse" />
              <View>
                <View className="h-3 bg-gray-200 rounded w-16 mb-1 animate-pulse" />
                <View className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
              </View>
            </View>
          </View>
        </View>

        {/* Progress Section Skeleton */}
        <View className="bg-white rounded-3xl mb-6">
          <View className="px-6 py-4">
            <View className="flex-row mb-5 items-center justify-between">
              <View className="flex-row items-center">
                <View className="w-8 h-8 bg-gray-200 rounded-full justify-center items-center mr-3 animate-pulse" />
                <View className="h-5 bg-gray-200 rounded w-24 animate-pulse" />
              </View>
              <View className="w-20 h-8 bg-gray-200 rounded-2xl animate-pulse" />
            </View>
          </View>

          <View className="px-6 pb-5">
            <View className="flex-row items-center justify-between mb-5">
              {/* Progress Circle Skeleton */}
              <View className="w-28 h-28 rounded-full bg-gray-200 animate-pulse" />

              {/* Stats Cards Skeleton */}
              <View className="flex-1 ml-6" style={{ gap: 10 }}>
                <View className="rounded-2xl px-4 py-2 flex-row items-center bg-gray-100">
                  <View className="w-10 h-10 bg-gray-200 rounded-xl animate-pulse" />
                  <View className="ml-3 flex-1">
                    <View className="h-3 bg-gray-200 rounded w-16 mb-1 animate-pulse" />
                    <View className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
                  </View>
                </View>

                <View className="rounded-2xl px-4 py-2 flex-row items-center bg-gray-100">
                  <View className="w-10 h-10 bg-gray-200 rounded-xl animate-pulse" />
                  <View className="ml-3 flex-1">
                    <View className="h-3 bg-gray-200 rounded w-16 mb-1 animate-pulse" />
                    <View className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
                  </View>
                </View>
              </View>
            </View>

            <View className="bg-gray-200 rounded-full h-[2px] mb-4 animate-pulse" />

            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse" />
                <View className="h-3 bg-gray-200 rounded w-24 ml-2 animate-pulse" />
              </View>

              <View className="flex-row items-center">
                <View className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse" />
                <View className="h-3 bg-gray-200 rounded w-20 ml-2 animate-pulse" />
              </View>
            </View>
          </View>
        </View>

        {/* Comments Section Skeleton */}
        <View className="py-6" style={{gap:6}}>
          <View className="flex-row items-center ml-1 mb-4">
            <View className="w-5 h-5 bg-gray-200 rounded-full animate-pulse" />
            <View className="h-5 bg-gray-200 rounded w-32 ml-2 animate-pulse" />
          </View>

          {/* Comment Cards Skeleton */}
          {[1, 2, 3].map((item) => (
            <View key={item} className="bg-white rounded-2xl p-4 mb-2">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center flex-1">
                  <View className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
                  <View className="ml-3 flex-1">
                    <View className="h-4 bg-gray-200 rounded w-24 mb-1 animate-pulse" />
                    <View className="h-3 bg-gray-200 rounded w-32 animate-pulse" />
                  </View>
                </View>
                <View className="flex-row " style={{gap:6}}>
                  <View className="w-6 h-6 bg-gray-200 rounded-full animate-pulse" />
                  <View className="w-6 h-6 bg-gray-200 rounded-full animate-pulse" />
                </View>
              </View>
              <View style={{gap:6}}>
                <View className="h-4 bg-gray-200 rounded w-full animate-pulse" />
                <View className="h-4 bg-gray-200 rounded w-5/6 animate-pulse" />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Fixed Comment Input Skeleton */}
      <View
        className="absolute bottom-0 left-0 right-0 rounded-t-[32px] bg-blue-50 pt-6 px-4 pb-4"
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        <View className="flex-row items-center " style={{gap:6}}>
          <View className="flex-1">
            <View className="bg-white rounded-xl h-12 animate-pulse" />
          </View>
          <View className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse" />
        </View>
      </View>
    </View>
  );
};

export default TaskDetailsSkeletonLoader;