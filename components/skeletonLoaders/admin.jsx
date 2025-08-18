// SkeletonLoader.jsx
import { View, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SkeletonCard = () => (
  <View className="bg-white rounded-2xl overflow-hidden mb-4 shadow-sm border-[2px] border-gray-100">
    {/* Header with image */}
    <View className="relative h-44 w-full rounded-t-2xl bg-gray-200 animate-pulse">
      {/* Top row */}
      <View className="absolute top-4 left-4 right-4">
        <View className="flex-row items-center">
          <View className="w-9 h-9 bg-gray-300 rounded-[50px] animate-pulse" />
          <View className="ml-2 h-5 bg-gray-300 rounded w-3/4 animate-pulse" />
        </View> 
      </View>
      
      {/* Bottom info box */}
      <View className="absolute bottom-4 left-4 right-4 bg-gray-300/20 px-4 py-3 rounded-[12px]">
        <View className="h-4 bg-gray-300 rounded w-1/3 animate-pulse mb-2" />
        <View className="h-3 bg-gray-300 rounded w-1/2 animate-pulse" />
      </View>
    </View>

    {/* Stats section */}
    <View className="px-5 pt-5">
      <View className="flex-row flex-wrap justify-between">
        <View className="bg-gray-100 p-3 w-[48%] rounded-xl mb-4 animate-pulse">
          <View className="flex-row items-center">
            <View className="w-4 h-4 bg-gray-300 rounded animate-pulse" />
            <View className="ml-2 h-4 bg-gray-300 rounded w-1/2 animate-pulse" />
          </View>
        </View>
        <View className="bg-gray-100 p-3 w-[48%] rounded-xl mb-4 animate-pulse">
          <View className="flex-row items-center">
            <View className="w-4 h-4 bg-gray-300 rounded animate-pulse" />
            <View className="ml-2 h-4 bg-gray-300 rounded w-1/2 animate-pulse" />
          </View>
        </View>
      </View>

      {/* Action buttons */}
      <View className="flex-row w-full mb-4">
        <View className="flex-1 bg-gray-100 p-3 rounded-xl mr-2 animate-pulse">
          <View className="flex-row items-center">
            <View className="w-4 h-4 bg-gray-300 rounded animate-pulse" />
            <View className="ml-3 h-3 bg-gray-300 rounded w-2/3 animate-pulse" />
          </View>
        </View>
        <View className="flex-1 bg-gray-100 p-3 rounded-xl ml-2 animate-pulse">
          <View className="flex-row items-center">
            <View className="w-4 h-4 bg-gray-300 rounded animate-pulse" />
            <View className="ml-3 h-3 bg-gray-300 rounded w-2/3 animate-pulse" />
          </View>
        </View>
      </View>
    </View>

    {/* Manager assignment */}
    <View className="px-5 pb-4">
      <View className="bg-gray-100 p-4 rounded-xl animate-pulse">
        <View className="flex-row items-center justify-center">
          <View className="w-5 h-5 bg-gray-300 rounded animate-pulse" />
          <View className="ml-2 h-4 bg-gray-300 rounded w-1/3 animate-pulse" />
        </View>
      </View>
    </View>
  </View>
);

const AdminSkeletonLoader = () => {
  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="mx-6 py-4 flex-row items-center justify-between border-b-[2px] border-gray-200">
        <View className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
        <View className="w-20 h-6 bg-gray-200 rounded-full animate-pulse" />
      </View>

      {/* Project list */}
      <FlatList
        data={[1, 2, 3]} // Show 3 skeleton cards
        keyExtractor={(item) => item.toString()}
        contentContainerStyle={{ paddingHorizontal: 15, paddingTop: 16 }}
        renderItem={() => <SkeletonCard />}
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Action Button */}
      <View className="absolute bg-gray-200 w-14 h-14 border border-gray-300 rounded-[12px] right-5 bottom-5 animate-pulse" />
    </View>
  );
};

export default AdminSkeletonLoader;