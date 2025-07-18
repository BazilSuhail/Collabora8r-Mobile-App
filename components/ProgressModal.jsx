import Slider from '@react-native-community/slider';
import { useEffect, useRef } from 'react';
import {
    Animated,
    Modal,
    StatusBar,
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
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(600)).current;

    useEffect(() => {
        if (!visible) {
            fadeAnim.setValue(0);
            slideAnim.setValue(600);
        }
    }, [visible]);

    const startAnimation = () => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const closeWithAnimation = () => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 500,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(() => {
            onClose();
        });
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onShow={startAnimation}
        >

            {visible && (
                <StatusBar backgroundColor="rgba(0,0,0,0.5)" barStyle="light-content" animated />
            )}
            <Animated.View
                style={{
                    flex: 1,
                    justifyContent: 'flex-end',
                    backgroundColor: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.5)'],
                    }),
                }}
            >
                <Animated.View
                    style={{
                        transform: [{ translateY: slideAnim }],
                    }}
                    className="bg-white rounded-t-3xl p-6 max-h-[80%]"
                >
                    {/* Header */}
                    <View className="flex-row items-center justify-between mb-6">
                        <Text className="text-xl font-bold text-gray-900">Update Progress</Text>
                        <TouchableOpacity onPress={closeWithAnimation}>
                            <Ionicons name="close" size={24} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

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
                    <View className="flex-row space-x-3">
                        <TouchableOpacity
                            onPress={closeWithAnimation}
                            className="bg-gray-200 px-6 py-3 mr-1 rounded-xl flex-1 flex-row items-center justify-center"
                        >
                            <Ionicons name="close" size={20} color="#6B7280" />
                            <Text className="text-gray-700 font-semibold ml-2">Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={onSave}
                            className="bg-blue-500 px-6 ml-1 rounded-xl flex-1 flex-row items-center justify-center shadow-sm"
                        >
                            <Ionicons name="checkmark" size={20} color="white" />
                            <Text className="text-white font-semibold ml-2">Save Changes</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
};

export default ProgressModal;
