import { useState } from 'react';
import { FontAwesome5, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { 
    Modal, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    View, 
    ScrollView,
    StatusBar,
    SafeAreaView 
} from 'react-native';

const TaskModal = ({
    isOpen,
    onClose,
    onSubmit,
    newTask,
    users,
    handleChange,
    editingTaskId,
}) => {
    const [showStatusPicker, setShowStatusPicker] = useState(false);
    const [showPriorityPicker, setShowPriorityPicker] = useState(false);
    const [showUserPicker, setShowUserPicker] = useState(false);

    if (!isOpen) return null;

    const statusOptions = [
        { label: 'Not Started', value: 'Not Started', icon: 'radio-button-unchecked', color: '#6B7280' },
        { label: 'In Progress', value: 'In Progress', icon: 'sync', color: '#2563EB' },
        { label: 'Completed', value: 'Completed', icon: 'check-circle', color: '#059669' },
    ];

    const priorityOptions = [
        { label: 'Low', value: 'Low', icon: 'keyboard-arrow-down', color: '#059669' },
        { label: 'Medium', value: 'Medium', icon: 'remove', color: '#D97706' },
        { label: 'High', value: 'High', icon: 'keyboard-arrow-up', color: '#DC2626' },
    ];

    const handleStatusSelect = (value) => {
        handleChange('status', value);
        setShowStatusPicker(false);
    };

    const handlePrioritySelect = (value) => {
        handleChange('priority', value);
        setShowPriorityPicker(false);
    };

    const handleUserSelect = (value) => {
        handleChange('assignedTo', value);
        setShowUserPicker(false);
    };

    const getSelectedUser = () => {
        return users.find(user => user._id === newTask.assignedTo);
    };

    const getStatusDisplay = () => {
        const status = statusOptions.find(s => s.value === newTask.status);
        return status || statusOptions[0];
    };

    const getPriorityDisplay = () => {
        const priority = priorityOptions.find(p => p.value === newTask.priority);
        return priority || priorityOptions[1];
    };

    const CustomPicker = ({ options, selectedValue, onSelect, placeholder, show, setShow }) => (
        <View className="relative">
            <TouchableOpacity
                className="border border-gray-300 rounded-lg px-3 py-3 bg-white flex-row items-center justify-between"
                onPress={() => setShow(!show)}
            >
                <Text className={`text-sm ${selectedValue ? 'text-gray-800' : 'text-gray-500'}`}>
                    {selectedValue || placeholder}
                </Text>
                <MaterialIcons 
                    name={show ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                    size={20} 
                    color="#6B7280" 
                />
            </TouchableOpacity>
            
            {show && (
                <View className="absolute top-14 left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
                    {options.map((option) => (
                        <TouchableOpacity
                            key={option.value}
                            className="px-3 py-3 border-b border-gray-100 flex-row items-center"
                            onPress={() => onSelect(option.value)}
                        >
                            {option.icon && (
                                <MaterialIcons 
                                    name={option.icon} 
                                    size={18} 
                                    color={option.color} 
                                    style={{ marginRight: 8 }}
                                />
                            )}
                            <Text className="text-sm text-gray-800">{option.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    );

    return (
        <Modal visible={isOpen} transparent={true} animationType="fade">
            <StatusBar backgroundColor="rgba(0,0,0,0.6)" barStyle="light-content" />
            <SafeAreaView className="flex-1 bg-black/60">
                <View className="flex-1 justify-center items-center px-4">
                    <View className="bg-white w-full max-w-md rounded-2xl shadow-2xl">
                        {/* Header */}
                        <View className="px-6 py-4 border-b border-gray-100">
                            <View className="flex-row items-center justify-between">
                                <View className="flex-row items-center">
                                    <View className="bg-blue-100 p-2 rounded-full mr-3">
                                        <MaterialIcons 
                                            name={editingTaskId ? "edit" : "add-task"} 
                                            size={20} 
                                            color="#3B82F6" 
                                        />
                                    </View>
                                    <Text className="text-xl font-bold text-gray-800">
                                        {editingTaskId ? 'Edit Task' : 'Create New Task'}
                                    </Text>
                                </View>
                                <TouchableOpacity 
                                    className="p-2 bg-gray-100 rounded-full"
                                    onPress={onClose}
                                >
                                    <MaterialIcons name="close" size={20} color="#6B7280" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Form Content */}
                        <ScrollView className="px-6 py-4" showsVerticalScrollIndicator={false}>
                            {/* Task Title */}
                            <View className="mb-4">
                                <View className="flex-row items-center mb-2">
                                    <MaterialIcons name="title" size={18} color="#4B5563" />
                                    <Text className="text-sm font-semibold text-gray-700 ml-2">Task Title</Text>
                                </View>
                                <TextInput
                                    className="border border-gray-300 rounded-lg px-3 py-3 text-sm bg-white"
                                    value={newTask.title}
                                    onChangeText={(text) => handleChange('title', text)}
                                    placeholder="Enter a descriptive task title"
                                    placeholderTextColor="#9CA3AF"
                                />
                            </View>

                            {/* Status and Priority Row */}
                            <View className="flex-row space-x-3 mb-4">
                                <View className="flex-1">
                                    <View className="flex-row items-center mb-2">
                                        <MaterialIcons name="info-outline" size={18} color="#4B5563" />
                                        <Text className="text-sm font-semibold text-gray-700 ml-2">Status</Text>
                                    </View>
                                    <CustomPicker
                                        options={statusOptions}
                                        selectedValue={getStatusDisplay().label}
                                        onSelect={handleStatusSelect}
                                        placeholder="Select status"
                                        show={showStatusPicker}
                                        setShow={setShowStatusPicker}
                                    />
                                </View>

                                <View className="flex-1">
                                    <View className="flex-row items-center mb-2">
                                        <MaterialIcons name="flag" size={18} color="#4B5563" />
                                        <Text className="text-sm font-semibold text-gray-700 ml-2">Priority</Text>
                                    </View>
                                    <CustomPicker
                                        options={priorityOptions}
                                        selectedValue={getPriorityDisplay().label}
                                        onSelect={handlePrioritySelect}
                                        placeholder="Select priority"
                                        show={showPriorityPicker}
                                        setShow={setShowPriorityPicker}
                                    />
                                </View>
                            </View>

                            {/* Due Date and Assignee Row */}
                            <View className="flex-row space-x-3 mb-4">
                                <View className="flex-1">
                                    <View className="flex-row items-center mb-2">
                                        <MaterialIcons name="schedule" size={18} color="#4B5563" />
                                        <Text className="text-sm font-semibold text-gray-700 ml-2">Due Date</Text>
                                    </View>
                                    <TextInput
                                        className="border border-gray-300 rounded-lg px-3 py-3 text-sm bg-white"
                                        value={newTask.dueDate}
                                        placeholder="YYYY-MM-DD"
                                        placeholderTextColor="#9CA3AF"
                                        onChangeText={(text) => handleChange('dueDate', text)}
                                    />
                                </View>

                                <View className="flex-1">
                                    <View className="flex-row items-center mb-2">
                                        <MaterialIcons name="person" size={18} color="#4B5563" />
                                        <Text className="text-sm font-semibold text-gray-700 ml-2">Assign To</Text>
                                    </View>
                                    <CustomPicker
                                        options={users.map(user => ({ label: user.name || user.email, value: user._id }))}
                                        selectedValue={getSelectedUser()?.name || getSelectedUser()?.email}
                                        onSelect={handleUserSelect}
                                        placeholder="Select team member"
                                        show={showUserPicker}
                                        setShow={setShowUserPicker}
                                    />
                                </View>
                            </View>

                            {/* Description */}
                            <View className="mb-6">
                                <View className="flex-row items-center mb-2">
                                    <MaterialIcons name="description" size={18} color="#4B5563" />
                                    <Text className="text-sm font-semibold text-gray-700 ml-2">Description</Text>
                                </View>
                                <TextInput
                                    className="border border-gray-300 rounded-lg px-3 py-3 text-sm bg-white"
                                    style={{ height: 100, textAlignVertical: 'top' }}
                                    value={newTask.description}
                                    placeholder="Provide detailed task guidelines and requirements..."
                                    placeholderTextColor="#9CA3AF"
                                    multiline
                                    numberOfLines={4}
                                    onChangeText={(text) => handleChange('description', text)}
                                />
                            </View>
                        </ScrollView>

                        {/* Footer Actions */}
                        <View className="px-6 py-4 border-t border-gray-100">
                            <View className="flex-row space-x-3">
                                <TouchableOpacity
                                    className="flex-1 bg-gray-100 py-3 rounded-lg flex-row items-center justify-center"
                                    onPress={onClose}
                                >
                                    <MaterialIcons name="close" size={18} color="#6B7280" />
                                    <Text className="text-gray-700 font-semibold ml-2">Cancel</Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity
                                    className="flex-1 bg-blue-600 py-3 rounded-lg flex-row items-center justify-center shadow-sm"
                                    onPress={onSubmit}
                                >
                                    <MaterialIcons 
                                        name={editingTaskId ? "check" : "add"} 
                                        size={18} 
                                        color="#FFFFFF" 
                                    />
                                    <Text className="text-white font-semibold ml-2">
                                        {editingTaskId ? 'Update Task' : 'Create Task'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
            </SafeAreaView>
        </Modal>
    );
};

export default TaskModal;