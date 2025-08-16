import { MaterialIcons } from '@expo/vector-icons';
import BottomSheet from 'entity-bottom-sheet';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Dimensions,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const { height: screenHeight } = Dimensions.get('window');

const TaskModal = ({
  isOpen,
  onClose,
  onSubmit,
  newTask,
  users,
  handleChange,
  editingTaskId,
  loading = false,
  error = '',
  success = ''
}) => {
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);
  const [showUserPicker, setShowUserPicker] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Memoized options to prevent recreations
  const statusOptions = useMemo(() => [
    { label: 'Not Started', value: 'Not Started', icon: 'radio-button-unchecked', color: '#6B7280' },
    { label: 'In Progress', value: 'In Progress', icon: 'sync', color: '#2563EB' },
    { label: 'Completed', value: 'Completed', icon: 'check-circle', color: '#059669' },
  ], []);

  const priorityOptions = useMemo(() => [
    { label: 'Low', value: 'Low', icon: 'keyboard-arrow-down', color: '#059669' },
    { label: 'Medium', value: 'Medium', icon: 'remove', color: '#D97706' },
    { label: 'High', value: 'High', icon: 'keyboard-arrow-up', color: '#DC2626' },
  ], []);

  // Memoized user options
  const userOptions = useMemo(() =>
    users?.map(user => ({
      label: user.name || user.email,
      value: user._id
    })) || [],
    [users]
  );

  // Validation function - memoized
  const validateForm = useCallback(() => {
    const errors = {};

    if (!newTask?.title?.trim()) {
      errors.title = 'Task title is required';
    } else if (newTask.title.trim().length < 3) {
      errors.title = 'Title must be at least 3 characters';
    }

    if (!newTask?.description?.trim()) {
      errors.description = 'Task description is required';
    } else if (newTask.description.trim().length < 10) {
      errors.description = 'Description must be at least 10 characters';
    }

    if (newTask?.dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(newTask.dueDate)) {
      errors.dueDate = 'Please use YYYY-MM-DD format';
    }

    if (newTask?.dueDate) {
      const selectedDate = new Date(newTask.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        errors.dueDate = 'Due date cannot be in the past';
      }
    }

    // ✅ NEW: Force update of assignee when editing a task
    if (editingTaskId && !newTask?.assignedTo) {
      errors.assignedTo = 'Please update or confirm the assignee';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [newTask, editingTaskId]);

  // Reset pickers when modal closes
  useEffect(() => {
    if (!isOpen) {
      setShowStatusPicker(false);
      setShowPriorityPicker(false);
      setShowUserPicker(false);
      setValidationErrors({});
    }
  }, [isOpen]);

  // Optimized handlers with better performance
  const handleStatusSelect = useCallback((value) => {
    handleChange('status', value);
    setShowStatusPicker(false);
    if (validationErrors.status) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.status;
        return newErrors;
      });
    }
  }, [handleChange, validationErrors.status]);

  const handlePrioritySelect = useCallback((value) => {
    handleChange('priority', value);
    setShowPriorityPicker(false);
  }, [handleChange]);

  const handleUserSelect = useCallback((value) => {
    handleChange('assignedTo', value);
    setShowUserPicker(false);
  }, [handleChange]);

  const handleInputChange = useCallback((field, value) => {
    handleChange(field, value);
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [handleChange, validationErrors]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors before submitting.');
      return;
    }

    try {
      await onSubmit();
    } catch (error) {
      console.error('Submit error:', error);
    }
  }, [validateForm, onSubmit]);

  const handleClose = useCallback(() => {
    // Close all pickers first
    setShowStatusPicker(false);
    setShowPriorityPicker(false);
    setShowUserPicker(false);

    // Reset validation errors and call onClose
    setValidationErrors({});
    onClose();
  }, [onClose]);

  // FIXED: Better implementation for getting selected user
  const getSelectedUser = useCallback(() => {
    if (!newTask?.assignedTo) return null;

    // If assignedTo is an object (populated), return it directly
    if (typeof newTask.assignedTo === 'object' && (newTask.assignedTo._id || newTask.assignedTo.name)) {
      return newTask.assignedTo;
    }

    // If assignedTo is a string (ID), find the user from users array
    if (typeof newTask.assignedTo === 'string') {
      return users?.find(user => user._id === newTask.assignedTo);
    }

    return null;
  }, [users, newTask?.assignedTo]);

  // FIXED: Better implementation for getting selected user name
  const getSelectedUserName = useCallback(() => {
    const selectedUser = getSelectedUser();
    return selectedUser?.name || selectedUser?.email || '';
  }, [getSelectedUser]);

  const getStatusDisplay = useCallback(() => {
    const status = statusOptions.find(s => s.value === newTask?.status);
    return status || statusOptions[0];
  }, [statusOptions, newTask?.status]);

  const getPriorityDisplay = useCallback(() => {
    const priority = priorityOptions.find(p => p.value === newTask?.priority);
    return priority || priorityOptions[1];
  }, [priorityOptions, newTask?.priority]);

  // Memoized CustomPicker component with Tailwind CSS
  const CustomPicker = React.memo(({ options, selectedValue, onSelect, placeholder, show, setShow, error }) => (
    <View className="relative">
      <TouchableOpacity
        className={`border rounded-lg px-3 py-1.5 bg-white flex-row items-center justify-between ${error ? 'border-red-300' : 'border-gray-300'}`}
        onPress={() => setShow(!show)}
        disabled={loading}
        activeOpacity={0.7}
      >
        <Text className={`text-sm ${selectedValue ? 'text-gray-800' : 'text-gray-400'}`}>
          {selectedValue || placeholder}
        </Text>
        <MaterialIcons
          name={show ? "keyboard-arrow-up" : "keyboard-arrow-down"}
          size={20}
          color={error ? "#EF4444" : "#6B7280"}
        />
      </TouchableOpacity>

      {error && (
        <Text className="text-red-500 text-xs mt-1">{error}</Text>
      )}

      {show && (
        <View className="absolute top-10 left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-48">
          <ScrollView>
            {options.map((option, index) => (
              <TouchableOpacity
                key={option.value}
                className={`px-3 py-3 flex-row items-center ${index < options.length - 1 ? 'border-b border-gray-100' : ''}`}
                onPress={() => onSelect(option.value)}
                activeOpacity={0.7}
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
          </ScrollView>
        </View>
      )}
    </View>
  ));

  // Memoized message components with Tailwind CSS
  const ErrorMessage = React.memo(({ message }) => (
    message ? (
      <View className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex-row items-center">
        <MaterialIcons name="error-outline" size={20} color="#EF4444" />
        <Text className="text-red-700 text-sm ml-2 flex-1">{message}</Text>
      </View>
    ) : null
  ));

  const SuccessMessage = React.memo(({ message }) => (
    message ? (
      <View className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 flex-row items-center">
        <MaterialIcons name="check-circle-outline" size={20} color="#059669" />
        <Text className="text-green-700 text-sm ml-2 flex-1">{message}</Text>
      </View>
    ) : null
  ));

  // Custom header component
  const CustomHeader = () => (
    <View className="px-6 py-4 border-b border-gray-100">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View className="bg-blue-100 p-2 rounded-xl mr-3">
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
      </View>
    </View>
  );

  return (
    <BottomSheet
      visible={isOpen}
      onClose={handleClose}
      header={<CustomHeader />}
      heightRatio={error ? 0.88 :0.8}
    >
      <View className="">
        {/* Form Content */}
        <ScrollView
          className="px-6 py-4" 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Error/Success Messages */}
          <ErrorMessage message={error} />
          <SuccessMessage message={success} />

          {/* Task Title */}
          <View className="mb-4">
            <View className="flex-row items-center mb-2">
              <MaterialIcons name="title" size={18} color="#4B5563" />
              <Text className="text-sm font-semibold text-gray-700 ml-2">
                Task Title *
              </Text>
            </View>
            <TextInput
              className={`border rounded-lg px-3 py-3 text-sm bg-white ${validationErrors.title ? 'border-red-300' : 'border-gray-300'}`}
              value={newTask?.title || ''}
              onChangeText={(text) => handleInputChange('title', text)}
              placeholder="Enter a descriptive task title"
              placeholderTextColor="#9CA3AF"
              editable={!loading}
            />
            {validationErrors.title && (
              <Text className="text-red-500 text-xs mt-1">
                {validationErrors.title}
              </Text>
            )}
          </View>

          {/* Status and Priority Row */}
          <View className="flex-row mb-4">
            <View className="flex-1 mr-3">
              <View className="flex-row items-center mb-2">
                <MaterialIcons name="info-outline" size={18} color="#4B5563" />
                <Text className="text-sm font-semibold text-gray-700 ml-2">
                  Status
                </Text>
              </View>
              <CustomPicker
                options={statusOptions}
                selectedValue={getStatusDisplay().label}
                onSelect={handleStatusSelect}
                placeholder="Select status"
                show={showStatusPicker}
                setShow={setShowStatusPicker}
                error={validationErrors.status}
              />
            </View>

            <View className="flex-1">
              <View className="flex-row items-center mb-2">
                <MaterialIcons name="flag" size={18} color="#4B5563" />
                <Text className="text-sm font-semibold text-gray-700 ml-2">
                  Priority
                </Text>
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
          <View className="flex-row mb-4">
            <View className="flex-1 mr-3">
              <View className="flex-row items-center mb-2">
                <MaterialIcons name="schedule" size={18} color="#4B5563" />
                <Text className="text-sm font-semibold text-gray-700 ml-2">
                  Due Date
                </Text>
              </View>
              <TextInput
                className={`border rounded-lg px-3 py-2 text-xs bg-white ${validationErrors.dueDate ? 'border-red-300' : 'border-gray-300'}`}
                value={newTask?.dueDate || ''}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9CA3AF"
                onChangeText={(text) => handleInputChange('dueDate', text)}
                editable={!loading}
              />
              {validationErrors.dueDate && (
                <Text className="text-red-500 text-xs mt-1">
                  {validationErrors.dueDate}
                </Text>
              )}
            </View>

            <View className="flex-1">
              <View className="flex-row items-center mb-2">
                <MaterialIcons name="person" size={18} color="#4B5563" />
                <Text className="text-sm font-semibold text-gray-700 ml-2">
                  Assign To
                </Text>
              </View>
              <CustomPicker
                options={userOptions}
                selectedValue={getSelectedUserName()}
                onSelect={handleUserSelect}
                placeholder="Select team member"
                show={showUserPicker}
                setShow={setShowUserPicker}
              />
            </View>
          </View>

          {/* Description */}
          <View className="">
            <View className="flex-row items-center mb-2">
              <MaterialIcons name="description" size={18} color="#4B5563" />
              <Text className="text-sm font-semibold text-gray-700 ml-2">
                Description *
              </Text>
            </View>
            <TextInput
              className={`border rounded-lg px-4 text-sm bg-white ${validationErrors.description ? 'border-red-300' : 'border-gray-300'}`}
              style={{
                minHeight: 180,
                textAlignVertical: 'top'
              }}
              value={newTask?.description || ''}
              placeholder="Provide detailed task guidelines and requirements..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              onChangeText={(text) => handleInputChange('description', text)}
              editable={!loading}
            />
            {validationErrors.description && (
              <Text className="text-red-500 text-xs mt-1">
                {validationErrors.description}
              </Text>
            )}
          </View>
        </ScrollView>

        {/* Footer Actions */}
        <View style={{
          paddingHorizontal: 24,
          paddingVertical: 16,
          borderTopWidth: 1,
          borderTopColor: '#F3F4F6'
        }}>
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: '#F3F4F6',
                paddingVertical: 12,
                borderRadius: 8,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12
              }}
              onPress={handleClose}
              disabled={loading}
              activeOpacity={0.7}
            >
              <MaterialIcons name="close" size={18} color="#6B7280" />
              <Text style={{ color: '#374151', fontWeight: '600', marginLeft: 8 }}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: loading ? '#93C5FD' : '#2563EB',
                paddingVertical: 12,
                borderRadius: 8,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.7}
            >
              {loading ? (
                <MaterialIcons name="hourglass-empty" size={18} color="#FFFFFF" />
              ) : (
                <MaterialIcons
                  name={editingTaskId ? "check" : "add"}
                  size={18}
                  color="#FFFFFF"
                />
              )}
              <Text style={{ color: 'white', fontWeight: '600', marginLeft: 8 }}>
                {loading ? 'Processing...' : editingTaskId ? 'Update Task' : 'Create Task'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </BottomSheet>
  );
};

export default React.memo(TaskModal);