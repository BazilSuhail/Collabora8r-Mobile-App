import Slider from '@react-native-community/slider';
import BottomSheet from 'entity-bottom-sheet';
import {
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const ProgressModal = ({
    visible,
    tempProgress,
    setTempProgress,
    tempStatus,
    setTempStatus,
    tempPriority,
    setTempPriority,
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

                {/* Status and Priority Selector - Row Layout */}
                <View className="mb-8">
                    <Text className="text-base font-semibold text-gray-900 mb-4">Task Details</Text>
                    <View className="flex-row" style={{ gap: 12 }}>
                        {/* Status Selector */}
                        <View className="flex-1">
                            <Text className="text-sm font-medium text-gray-700 mb-3">Status</Text>
                            <View style={{gap:12}}>
                                {['Not Started', 'In Progress', 'Completed'].map((statusOption) => {
                                    const isSelected = tempStatus === statusOption;
                                    const statusColor = getStatusColor(statusOption);
                                    return (
                                        <TouchableOpacity
                                            key={statusOption}
                                            onPress={() => setTempStatus(statusOption)}
                                            className={`p-3 rounded-xl flex-row items-center ${isSelected 
                                                ? `${statusColor.bg.replace('100', '50')} border-${statusColor.text.replace('text-', '')}` 
                                                : 'border-[1px] bg-gray-50 border-gray-200'
                                            }`}
                                        >
                                            <MaterialCommunityIcons
                                                name={statusColor.icon}
                                                size={18}
                                                color={statusColor.iconColor}
                                            />
                                            <Text
                                                className={`font-medium ml-2 text-sm ${isSelected ? statusColor.text : 'text-gray-700'}`}
                                                numberOfLines={1}
                                            >
                                                {statusOption}
                                            </Text>
                                            {isSelected && (
                                                <View className="ml-auto">
                                                    <Ionicons name="checkmark-circle" size={18} color={statusColor.iconColor} />
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>

                        {/* Priority Selector */}
                        <View className="flex-1">
                            <Text className="text-sm font-medium text-gray-700 mb-3">Priority</Text>
                            <View style={{gap:12}}>
                                {['Low', 'Medium', 'High'].map((priorityOption) => {
                                    const isSelected = tempPriority === priorityOption;
                                    const priorityColor = getStatusColor(priorityOption);
                                    return (
                                        <TouchableOpacity
                                            key={priorityOption}
                                            onPress={() => setTempPriority(priorityOption)}
                                            className={`p-3 rounded-xl flex-row items-center ${isSelected 
                                                ? `${priorityColor.bg.replace('100', '50')}` 
                                                : 'border-[1px] bg-gray-50 border-gray-200'
                                            }`}
                                        >
                                            <AntDesign
                                                name={priorityColor.icon}
                                                size={16}
                                                color={priorityColor.iconColor}
                                            />
                                            <Text
                                                className={`font-medium ml-2 text-sm ${isSelected ? priorityColor.text : 'text-gray-700'}`}
                                                numberOfLines={1}
                                            >
                                                {priorityOption}
                                            </Text>
                                            {isSelected && (
                                                <View className="ml-auto">
                                                    <Ionicons name="checkmark-circle" size={18} color={priorityColor.iconColor} />
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>
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