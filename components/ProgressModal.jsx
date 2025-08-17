import Slider from '@react-native-community/slider';
import BottomSheet from 'entity-bottom-sheet';
import {
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const ProgressModal = ({
    visible,
    tempProgress,
    setTempProgress,
    tempStatus,
    setTempStatus,
    onClose,
    onSave,
    getStatusColor,
}) => {
    // Custom header component
    const CustomHeader = () => (
        <View className="flex-row items-center px-6 mb-4">
            <Text className="text-xl font-bold text-gray-900">Update Progress</Text>
        
        </View>
    );

    return (
        <BottomSheet
            visible={visible}
            onClose={onClose}
            header={<CustomHeader />}
            heightRatio={0.73}
        >
            <View className="flex-1 p-6">
                {/* Progress Display and Slider */}
                <View className="items-center mb-8">
                    <View className="bg-blue-50 rounded-full p-4 mb-4">
                        <Text className="text-4xl font-bold text-blue-600">{tempProgress}%</Text>
                    </View>
                    <View className="w-full px-4">
                        <Slider
                            style={{ width: '100%', height: 40 }}
                            minimumValue={0}
                            maximumValue={100}
                            step={1}
                            minimumTrackTintColor="#3B82F6"
                            maximumTrackTintColor="#E5E7EB"
                            thumbTintColor="#3B82F6"
                            value={tempProgress}
                            onValueChange={setTempProgress}
                        />
                        <View className="flex-row justify-between mt-2">
                            <Text className="text-sm text-gray-500">0%</Text>
                            <Text className="text-sm text-gray-500">100%</Text>
                        </View>
                    </View>
                </View>

                {/* Status Selector */}
                <View className="mb-8">
                    <Text className="text-base font-semibold text-gray-900 mb-4">Task Status</Text>
                    <View className="space-y-3">
                        {['Not Started', 'In Progress', 'Completed'].map((statusOption) => {
                            const isSelected = tempStatus === statusOption;
                            const statusColor = getStatusColor(statusOption);
                            return (
                                <TouchableOpacity
                                    key={statusOption}
                                    onPress={() => setTempStatus(statusOption)}
                                    className={`p-4 rounded-xl border-2 mb-2 flex-row items-center ${isSelected
                                            ? 'bg-blue-50 border-blue-500'
                                            : 'bg-gray-50 border-gray-200'
                                        }`}
                                >
                                    <Ionicons
                                        name={statusColor.icon}
                                        size={20}
                                        color={isSelected ? '#3B82F6' : '#6B7280'}
                                    />
                                    <Text
                                        className={`font-medium ml-3 ${isSelected ? 'text-blue-700' : 'text-gray-700'
                                            }`}
                                    >
                                        {statusOption}
                                    </Text>
                                    {isSelected && (
                                        <View className="ml-auto">
                                            <Ionicons name="checkmark-circle" size={20} color="#3B82F6" />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* Action Buttons */}
                <View className="flex-row" style={{ gap: 12 }}>
                    <TouchableOpacity
                        onPress={onClose}
                        className="bg-gray-200 px-6 py-3 rounded-xl flex-1 flex-row items-center justify-center"
                    >
                        <Ionicons name="close" size={20} color="#6B7280" />
                        <Text className="text-gray-700 font-semibold ml-2">Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={onSave}
                        className="bg-blue-500 px-6 py-3 rounded-xl flex-1 flex-row items-center justify-center shadow-sm"
                    >
                        <Ionicons name="checkmark" size={20} color="white" />
                        <Text className="text-white font-semibold ml-2">Save Changes</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </BottomSheet>
    );
};

export default ProgressModal;