import { View, ScrollView, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; 

const AdminProjectSkeletonLoader = () => {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ 
        paddingTop: insets.top,
        paddingBottom: insets.bottom 
      }}
      className="flex-1 bg-gray-100 px-4 pt-5"
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

      {/* Project Description Skeleton */}
      <View className="bg-white rounded-2xl p-5 mb-4">
        <View className="flex-row items-center mb-4">
          <View className="w-10 h-10 bg-gray-200 rounded-full justify-center items-center mr-3 animate-pulse" />
          <View className="h-5 bg-gray-200 rounded w-40 animate-pulse" />
        </View>
        <View style={{gap:6}}>
          <View className="h-4 bg-gray-200 rounded w-full animate-pulse" />
          <View className="h-4 bg-gray-200 rounded w-5/6 animate-pulse" />
          <View className="h-4 bg-gray-200 rounded w-4/6 animate-pulse" />
        </View>
      </View>

      {/* Add Team Member Skeleton */}
      <View className="bg-white rounded-2xl p-5 mb-4">
        <View className="flex-row items-center mb-4">
          <View className="w-10 h-10 bg-gray-200 rounded-full justify-center items-center mr-3 animate-pulse" />
          <View className="h-5 bg-gray-200 rounded w-40 animate-pulse" />
        </View>

        <View className="mb-4">
          <View className="flex-row items-center border-2 border-gray-200 rounded-xl px-3 py-2">
            <View className="w-5 h-5 bg-gray-200 rounded-full animate-pulse" />
            <View className="flex-1 ml-3">
              <View className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
            </View>
            <View className="w-20 h-8 bg-gray-200 rounded-lg ml-2 animate-pulse" />
          </View>
        </View>

        {/* Search Result Skeleton */}
        <View className="bg-gray-50 rounded-xl p-4 border border-gray-200 flex-row justify-between items-center">
          <View className="flex-row items-center flex-1">
            <View className="w-12 h-12 bg-gray-200 rounded-full mr-3 animate-pulse" />
            <View className="flex-1">
              <View className="h-4 bg-gray-200 rounded w-32 mb-2 animate-pulse" />
              <View className="h-3 bg-gray-200 rounded w-40 animate-pulse" />
            </View>
          </View>
          <View className="w-16 h-8 bg-gray-200 rounded-lg animate-pulse" />
        </View>
      </View>

      {/* Project Manager Skeleton */}
      <View className="bg-white rounded-2xl p-5 mb-4">
        <View className="flex-row items-center mb-4">
          <View className="w-10 h-10 bg-gray-200 rounded-full justify-center items-center mr-3 animate-pulse" />
          <View className="h-5 bg-gray-200 rounded w-40 animate-pulse" />
        </View>

        <View className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <View className="flex-row items-center">
            <View className="w-12 h-12 bg-gray-200 rounded-full justify-center items-center mr-3 animate-pulse" />
            <View className="flex-1">
              <View className="h-4 bg-gray-200 rounded w-32 mb-2 animate-pulse" />
              <View className="flex-row items-center mt-1">
                <View className="w-2 h-2 bg-gray-200 rounded-full mr-2 animate-pulse" />
                <View className="h-3 bg-gray-200 rounded w-16 animate-pulse" />
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Team Members Skeleton */}
      <View className="bg-white rounded-2xl p-5 mb-4">
        <View className="flex-row justify-between items-center mb-4">
          <View className="flex-row items-center">
            <View className="w-10 h-10 bg-gray-200 rounded-full justify-center items-center mr-3 animate-pulse" />
            <View className="h-5 bg-gray-200 rounded w-32 animate-pulse" />
          </View>
          <View className="w-20 h-6 bg-gray-200 rounded-full animate-pulse" />
        </View>

        {/* Team Member Items Skeleton */}
        {[1, 2, 3].map((item) => (
          <View key={item} className="bg-gray-50 mb-2 rounded-xl p-4 border border-gray-200 flex-row justify-between items-center">
            <View className="flex-row items-center flex-1">
              <View className="w-12 h-12 bg-gray-200 rounded-full mr-3 animate-pulse" />
              <View className="flex-1">
                <View className="h-4 bg-gray-200 rounded w-32 mb-2 animate-pulse" />
                <View className="h-3 bg-gray-200 rounded w-40 animate-pulse" />
              </View>
            </View>
            <View className="w-3 h-3 bg-gray-200 rounded-full animate-pulse" />
          </View>
        ))}
      </View>

      {/* Project Tasks Skeleton */}
      <View className="bg-white rounded-2xl p-5 mb-5">
        <View className="flex-row justify-between items-center mb-4">
          <View className="flex-row items-center">
            <View className="w-10 h-10 bg-gray-200 rounded-full justify-center items-center mr-3 animate-pulse" />
            <View className="h-5 bg-gray-200 rounded w-32 animate-pulse" />
          </View>
          <View className="w-20 h-6 bg-gray-200 rounded-full animate-pulse" />
        </View>

        {/* Task Items Skeleton */}
        {[1, 2, 3].map((item) => (
          <View key={item} className="bg-gray-50 mb-2 rounded-xl p-4 border border-gray-200">
            <View className="flex-row justify-between items-start">
              <View className="flex-1">
                <View className="h-4 bg-gray-200 rounded w-3/4 mb-3 animate-pulse" />
                <View className="flex-row items-center" style={{ gap: 12 }}>
                  <View className="h-6 bg-gray-200 rounded-full w-16 animate-pulse" />
                  <View className="flex-row items-center">
                    <View className="w-3 h-3 bg-gray-200 rounded-full mr-1 animate-pulse" />
                    <View className="h-3 bg-gray-200 rounded w-24 animate-pulse" />
                  </View>
                </View>
              </View>
              <View className="w-8 h-8 bg-gray-200 rounded-full justify-center items-center animate-pulse" />
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

export default AdminProjectSkeletonLoader;