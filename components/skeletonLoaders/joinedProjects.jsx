// JoinProjectSkeletonLoader.jsx
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const JoinProjectSkeletonLoader = () => {
    const insets = useSafeAreaInsets();

    return (
        <View className="flex-1 bg-gray-50 relative">
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                    paddingTop: 16,
                    paddingBottom: insets.bottom + 55,
                    paddingHorizontal: 16
                }}
            >
                {/* Project Header Skeleton */}
                <View className="rounded-2xl mb-2 overflow-hidden">
                    <View className="relative h-[148px] mb-3 w-full bg-gray-200 rounded-[12px] animate-pulse" />
                </View>

                {/* Project Description Skeleton */}
                <View className="bg-white border border-gray-200 rounded-2xl p-5 mb-4">
                    <View className="flex-row items-center mb-4">
                        <View className="w-10 h-10 bg-gray-200 rounded-full justify-center items-center mr-3 animate-pulse" />
                        <View className="h-5 bg-gray-200 rounded w-40 animate-pulse" />
                    </View>
                    <View style={{ gap: 6 }}>
                        <View className="h-4 bg-gray-200 rounded w-full animate-pulse" />
                        <View className="h-4 bg-gray-200 rounded w-5/6 animate-pulse" />
                        <View className="h-4 bg-gray-200 rounded w-4/6 animate-pulse" />
                    </View>
                </View>

                {/* Project Manager Skeleton */}
                <View className="bg-white border border-gray-200 rounded-2xl p-5 mb-4">
                    <View className="flex-row items-center mb-4">
                        <View className="w-10 h-10 bg-gray-200 rounded-full justify-center items-center mr-3 animate-pulse" />
                        <View className="h-5 bg-gray-200 rounded w-40 animate-pulse" />
                    </View>
                    <View className="rounded-xl p-4 border bg-gray-100 border-gray-200">
                        <View className="flex-row items-center">
                            <View className="w-9 h-9 bg-gray-200 rounded-full justify-center items-center mr-3 animate-pulse" />
                            <View className="flex-1 ml-1">
                                <View className="h-4 bg-gray-200 rounded w-32 mb-2 animate-pulse" />
                                <View className="flex-row items-center mt-[2px]">
                                    <View className="w-2 h-2 bg-gray-200 rounded-full mr-2 animate-pulse" />
                                    <View className="h-3 bg-gray-200 rounded w-16 animate-pulse" />
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Stats Cards Skeleton */}
                <View className="bg-white border border-gray-200 rounded-2xl p-5 mb-4">
                    <View className="flex-row items-center" style={{ gap: 20 }}>
                        <View className="flex-row items-center">
                            <View className="w-12 h-12 bg-gray-200 rounded-full items-center justify-center mr-3 animate-pulse" />
                            <View>
                                <View className="h-4 bg-gray-200 rounded w-8 mb-1 animate-pulse" />
                                <View className="h-3 bg-gray-200 rounded w-16 animate-pulse" />
                            </View>
                        </View>
                        <View className="flex-row items-center">
                            <View className="w-12 h-12 bg-gray-200 rounded-full items-center justify-center mr-3 animate-pulse" />
                            <View>
                                <View className="h-4 bg-gray-200 rounded w-8 mb-1 animate-pulse" />
                                <View className="h-3 bg-gray-200 rounded w-16 animate-pulse" />
                            </View>
                        </View>
                    </View>
                </View>

                {/* Tasks Header Skeleton */}
                <View className="mb-4 border border-gray-200 bg-white p-4 rounded-2xl flex-row justify-between items-center">
                    <View className="flex-row items-center">
                        <View className="w-12 h-12 bg-gray-200 rounded-xl items-center justify-center mr-4 animate-pulse" />
                        <View>
                            <View className="h-5 bg-gray-200 rounded w-24 mb-1 animate-pulse" />
                            <View className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
                        </View>
                    </View>
                    <View className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
                </View>

                {/* Task Cards Skeleton */}
                {[1, 2, 3].map((item) => (
                    <View key={item} className="bg-gray-100 rounded-2xl p-5 mb-4 border border-gray-200">
                        <View className="flex-row items-start justify-between mb-4">
                            <View className="flex-row items-center flex-1">
                                <View className="w-14 h-14 bg-gray-200 rounded-xl items-center justify-center mr-4 animate-pulse" />
                                <View className="flex-1">
                                    <View className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse" />
                                    <View className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
                                </View>
                            </View>
                        </View>
                        <View style={{ gap: 6 }}>
                            <View className="flex-row items-center justify-between">
                                <View className="flex-row items-center flex-1">
                                    <View className="w-8 h-8 bg-gray-200 rounded-lg items-center justify-center mr-3 animate-pulse" />
                                    <View>
                                        <View className="h-3 bg-gray-200 rounded w-16 mb-1 animate-pulse" />
                                        <View className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
                                    </View>
                                </View>
                                <View className="flex-row items-center flex-1">
                                    <View className="w-8 h-8 bg-gray-200 rounded-lg items-center justify-center mr-3 animate-pulse" />
                                    <View>
                                        <View className="h-3 bg-gray-200 rounded w-16 mb-1 animate-pulse" />
                                        <View className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
                                    </View>
                                </View>
                            </View>
                            <View className="h-px bg-white my-3" />
                            <View className="flex-row items-center justify-between">
                                <View className="flex-row items-center">
                                    <View className="w-8 h-8 bg-gray-200 rounded-lg items-center justify-center mr-3 animate-pulse" />
                                    <View className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
                                </View>
                                <View className="flex-row items-center">
                                    <View className="h-6 bg-gray-200 rounded-full w-16 mr-2 animate-pulse" />
                                    <View className="h-6 bg-gray-200 rounded-full w-16 animate-pulse" />
                                </View>
                            </View>
                        </View>
                    </View>
                ))}
            </ScrollView>

            {/* Custom Tab Bar - Fixed at bottom */}
            <View
                className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100"
                style={{ paddingBottom: insets.bottom }}
            >
                <View className="flex-row items-center justify-around px-4 pt-3">
                    {/* All Tasks Tab */}
                    <View className="flex-1 items-center pt-2">
                        <View className="items-center">
                            <View className="w-6 h-6 bg-gray-200 rounded-full animate-pulse" />
                            <View className="h-3 bg-gray-200 rounded w-12 mt-1 animate-pulse" />
                        </View>
                    </View>

                    {/* My Tasks Tab */}
                    <View className="flex-1 items-center pt-2">
                        <View className="items-center">
                            <View className="w-6 h-6 bg-gray-200 rounded-full animate-pulse" />
                            <View className="h-3 bg-gray-200 rounded w-12 mt-1 animate-pulse" />
                        </View>
                    </View>

                    {/* Team Tab */}
                    <View className="flex-1 items-center pt-2">
                        <View className="items-center">
                            <View className="w-6 h-6 bg-gray-200 rounded-full animate-pulse" />
                            <View className="h-3 bg-gray-200 rounded w-12 mt-1 animate-pulse" />
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );
};

export default JoinProjectSkeletonLoader;