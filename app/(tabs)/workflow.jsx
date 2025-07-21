import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  Modal,
  FlatList,
  StatusBar,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  MaterialCommunityIcons,
  Feather,
  AntDesign
} from '@expo/vector-icons';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import config from '@/config/config';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const STATUS_TYPES = ['Not Started', 'In Progress', 'Completed'];

const STATUS_CONFIG = {
  'Not Started': {
    color: '#3B82F6',
    bgColor: '#EFF6FF',
    borderColor: '#DBEAFE',
    icon: 'play-circle-outline',
    lightColor: '#F0F9FF'
  },
  'In Progress': {
    color: '#F59E0B',
    bgColor: '#FFFBEB',
    borderColor: '#FEF3C7',
    icon: 'clock-outline',
    lightColor: '#FFFEF7'
  },
  'Completed': {
    color: '#10B981',
    bgColor: '#ECFDF5',
    borderColor: '#D1FAE5',
    icon: 'check-circle-outline',
    lightColor: '#F0FDF4'
  }
};

const DraggableTaskCard = React.memo(({
  task,
  onPress,
  onDragStart,
  onDragEnd,
  onDrop,
  dropZones,
  isDragging: globalDragging,
  draggedTaskId,
  activeDropZone
}) => {
  const statusConfig = STATUS_CONFIG[task.status] || STATUS_CONFIG['Not Started'];

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const zIndex = useSharedValue(1);

  const isDragging = draggedTaskId === task._id;

  const formatDate = useCallback((dateValue) => {
    if (!dateValue) return 'No due date';
    const date = new Date(dateValue.$date || dateValue);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }, []);

  const truncateTitle = useCallback((title, maxLength = 25) => {
    if (!title) return 'Untitled Task';
    return title.length > maxLength ? `${title.slice(0, maxLength)}...` : title;
  }, []);

  const findDropZone = useCallback((x, y) => {
    'worklet';
    const padding = 20; // Added padding for forgiving hitbox
    for (const status of STATUS_TYPES) {
      const zone = dropZones[status];
      if (zone && x >= (zone.x - padding) && x <= (zone.x + zone.width + padding) &&
        y >= (zone.y - padding) && y <= (zone.y + zone.height + padding)) {
        return status;
      }
    }
    return null;
  }, [dropZones]);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      runOnJS(onDragStart)(task);
      scale.value = withSpring(1.05, { damping: 15 });
      opacity.value = withTiming(0.9, { duration: 200 });
      zIndex.value = 999;
    })
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
      const absoluteX = event.absoluteX;
      const absoluteY = event.absoluteY;
      const currentDropZone = findDropZone(absoluteX, absoluteY);
      if (currentDropZone) {
        runOnJS(activeDropZone)(currentDropZone);
      } else {
        runOnJS(activeDropZone)(null);
      }
    })
    .onEnd((event) => {
      const absoluteX = event.absoluteX;
      const absoluteY = event.absoluteY;
      const targetStatus = findDropZone(absoluteX, absoluteY);
      translateX.value = withSpring(0, { damping: 15 });
      translateY.value = withSpring(0, { damping: 15 });
      scale.value = withSpring(1, { damping: 15 });
      opacity.value = withTiming(1, { duration: 200 });
      zIndex.value = 1;
      runOnJS(onDragEnd)();
      if (targetStatus && targetStatus !== task.status) {
        runOnJS(onDrop)(task, targetStatus);
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
      opacity: opacity.value,
      zIndex: zIndex.value,
      elevation: isDragging ? 999 : 2,
    };
  });

  const containerStyle = useAnimatedStyle(() => {
    return {
      shadowOpacity: interpolate(
        scale.value,
        [1, 1.05],
        [0.05, 0.25],
        'clamp'
      ),
      shadowRadius: interpolate(
        scale.value,
        [1, 1.05],
        [3, 12],
        'clamp'
      ),
    };
  });

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[containerStyle, { marginBottom: 12 }]}>
        <Animated.View style={animatedStyle}>
          <TouchableOpacity
            onPress={() => !globalDragging && onPress(task)}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
            }}
            activeOpacity={globalDragging ? 1 : 0.7}
          >
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center flex-1">
                <View
                  className="w-8 h-8 rounded-full items-center justify-center mr-3"
                  style={{ backgroundColor: statusConfig.bgColor }}
                >
                  <MaterialCommunityIcons
                    name="format-list-checks"
                    size={16}
                    color={statusConfig.color}
                  />
                </View>
                <Text className="text-gray-800 font-semibold text-base flex-1">
                  {truncateTitle(task.title)}
                </Text>
              </View>
              <View className="flex-row items-center">
                <MaterialCommunityIcons
                  name="drag"
                  size={16}
                  color="#9CA3AF"
                  style={{ marginRight: 8 }}
                />
                <Feather name="chevron-right" size={16} color="#9CA3AF" />
              </View>
            </View>
            <View className="flex-row items-center mb-3">
              <Feather name="calendar" size={14} color="#6B7280" />
              <Text className="text-gray-600 text-sm ml-2">
                {formatDate(task.dueDate)}
              </Text>
            </View>
            <View className="flex-row justify-between items-center">
              <View
                className="px-3 py-1.5 rounded-full"
                style={{ backgroundColor: statusConfig.lightColor }}
              >
                <Text
                  className="text-xs font-medium"
                  style={{ color: statusConfig.color }}
                >
                  {task.projectName || 'No Project'}
                </Text>
              </View>
              <View className="flex-row items-center">
                <MaterialCommunityIcons
                  name={statusConfig.icon}
                  size={16}
                  color={statusConfig.color}
                />
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
});

const DropZoneSection = React.memo(({
  status,
  tasks,
  onTaskPress,
  onLayout,
  isDropTarget,
  isDragging,
  onDragStart,
  onDragEnd,
  onDrop,
  dropZones,
  draggedTaskId,
  activeDropZone
}) => {
  const statusConfig = STATUS_CONFIG[status];

  const backgroundOpacity = useSharedValue(1);
  const borderWidth = useSharedValue(1);

  useEffect(() => {
    if (isDropTarget && isDragging) {
      backgroundOpacity.value = withTiming(0.95, { duration: 200 });
      borderWidth.value = withTiming(3, { duration: 200 });
    } else {
      backgroundOpacity.value = withTiming(1, { duration: 200 });
      borderWidth.value = withTiming(1, { duration: 200 });
    }
  }, [isDropTarget, isDragging]);

  const animatedHeaderStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: statusConfig.bgColor,
      opacity: backgroundOpacity.value,
      borderWidth: borderWidth.value,
      borderColor: isDropTarget && isDragging ? statusConfig.color : statusConfig.borderColor,
    };
  });

  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: '#FAFAFA',
      opacity: backgroundOpacity.value,
      borderWidth: borderWidth.value,
      borderColor: isDropTarget && isDragging ? statusConfig.color : statusConfig.borderColor,
    };
  });

  const renderItem = useCallback(({ item }) => (
    <DraggableTaskCard
      task={item}
      onPress={onTaskPress}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDrop={onDrop}
      dropZones={dropZones}
      isDragging={isDragging}
      draggedTaskId={draggedTaskId}
      activeDropZone={activeDropZone}
    />
  ), [onTaskPress, onDragStart, onDragEnd, onDrop, dropZones, isDragging, draggedTaskId, activeDropZone]);

  const keyExtractor = useCallback((item) => item._id, []);

  return (
    <View
      className="mb-6"
      onLayout={(event) => {
        const { x, y, width, height } = event.nativeEvent.layout;
        onLayout(status, {
          x: Math.round(x),
          y: Math.round(y),
          width: Math.round(width),
          height: Math.round(height)
        });
      }}
    >
      <Animated.View
        className="flex-row items-center justify-between p-4 rounded-t-xl border-l-4"
        style={[
          {
            borderLeftColor: statusConfig.color,
            borderBottomWidth: 0,
          },
          animatedHeaderStyle
        ]}
      >
        <View className="flex-row items-center">
          <MaterialCommunityIcons
            name={statusConfig.icon}
            size={20}
            color={statusConfig.color}
          />
          <Text
            className="text-lg font-semibold ml-3"
            style={{ color: statusConfig.color }}
          >
            {status}
          </Text>
          {isDropTarget && isDragging && (
            <View className="ml-2">
              <MaterialCommunityIcons
                name="target"
                size={16}
                color={statusConfig.color}
              />
            </View>
          )}
        </View>
        <View
          className="px-2.5 py-1 rounded-full"
          style={{ backgroundColor: statusConfig.color }}
        >
          <Text className="text-white text-xs font-medium">
            {tasks.length}
          </Text>
        </View>
      </Animated.View>
      <Animated.View
        className="p-4 rounded-b-xl border border-t-0"
        style={[
          {
            minHeight: 120,
          },
          animatedContainerStyle
        ]}
      >
        {isDragging && isDropTarget && (
          <Animated.View
            className="absolute inset-0 rounded-b-xl border-2 border-dashed"
            style={{
              borderColor: statusConfig.color,
              backgroundColor: statusConfig.lightColor + '40',
            }}
          >
            <View className="flex-1 items-center justify-center">
              <MaterialCommunityIcons
                name="plus-circle-outline"
                size={32}
                color={statusConfig.color}
              />
              <Text
                className="text-sm font-medium mt-2"
                style={{ color: statusConfig.color }}
              >
                Drop task here
              </Text>
            </View>
          </Animated.View>
        )}
        {tasks.length > 0 ? (
          <FlatList
            data={tasks}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
            extraData={isDragging}
          />
        ) : (
          <View className="py-8 items-center">
            <MaterialCommunityIcons
              name="inbox-outline"
              size={32}
              color="#9CA3AF"
            />
            <Text className="text-gray-500 text-sm mt-2">
              No tasks in {status.toLowerCase()}
            </Text>
          </View>
        )}
      </Animated.View>
    </View>
  );
});

const StatusModal = React.memo(({
  isVisible,
  selectedTask,
  onStatusChange,
  onClose
}) => {
  const renderStatusOption = useCallback((statusOption) => {
    const statusConfig = STATUS_CONFIG[statusOption];
    const isCurrentStatus = selectedTask?.status === statusOption;

    return (
      <TouchableOpacity
        key={statusOption}
        onPress={() => onStatusChange(statusOption)}
        className={`flex-row items-center p-4 ${isCurrentStatus ? 'bg-gray-50' : ''}`}
        style={{
          borderBottomWidth: 1,
          borderBottomColor: '#F3F4F6'
        }}
      >
        <MaterialCommunityIcons
          name={statusConfig.icon}
          size={20}
          color={statusConfig.color}
        />
        <Text className="text-gray-800 text-base ml-3 flex-1">
          {statusOption}
        </Text>
        {isCurrentStatus && (
          <AntDesign name="check" size={16} color="#10B981" />
        )}
      </TouchableOpacity>
    );
  }, [selectedTask, onStatusChange]);

  return (
    <Modal
      visible={isVisible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <StatusBar backgroundColor="#00000066" barStyle="dark-content" />
      <View className="w-screen h-screen justify-end bg-black/40">
        <View className="bg-white rounded-t-3xl">
          <View className="flex-row items-center justify-between p-6 border-b border-gray-100">
            <Text className="text-xl font-semibold text-gray-800">
              Update Task Status
            </Text>
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
            >
              <Feather name="x" size={18} color="#6B7280" />
            </TouchableOpacity>
          </View>
          {selectedTask && (
            <View className="px-6 py-4 bg-gray-50 border-b border-gray-100">
              <Text className="text-gray-800 font-medium text-base mb-1">
                {selectedTask.title || 'Untitled Task'}
              </Text>
              <Text className="text-gray-600 text-sm">
                {selectedTask.projectName || 'No Project'}
              </Text>
            </View>
          )}
          <View className="pb-8">
            {STATUS_TYPES.map(renderStatusOption)}
          </View>
        </View>
      </View>
    </Modal>
  );
});

const Workflow = () => {
  const insets = useSafeAreaInsets();
  const [tasks, setTasks] = useState({
    'Not Started': [],
    'In Progress': [],
    'Completed': [],
  });
  const [selectedTask, setSelectedTask] = useState(null);
  const [updatedTasks, setUpdatedTasks] = useState({});
  const [isModalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedTask, setDraggedTask] = useState(null);
  const [dropZones, setDropZones] = useState({});
  const [currentDropTarget, setCurrentDropTarget] = useState(null);
  const scrollOffsetY = useSharedValue(0);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('No token found, please sign in again.');
      const response = await axios.get(
        `${config.VITE_REACT_APP_API_BASE_URL}/overview/assigned-tasks`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const initialTasks = STATUS_TYPES.reduce((acc, status) => {
        acc[status] = response.data.tasks.filter((task) => task.status === status);
        return acc;
      }, {});
      setTasks(initialTasks);
    } catch (err) {
      Alert.alert('Error', err.message || 'Error fetching tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleDropZoneLayout = useCallback((status, layout) => {
    setTimeout(() => {
      setDropZones(prev => ({
        ...prev,
        [status]: {
          x: Math.round(layout.x),
          y: Math.round(layout.y + insets.top),
          width: Math.round(layout.width),
          height: Math.round(layout.height)
        }
      }));
    }, 100);
  }, [insets.top]);

  const handleDragStart = useCallback((task) => {
    setIsDragging(true);
    setDraggedTask(task);
  }, []);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    setDraggedTask(null);
    setCurrentDropTarget(null);
  }, []);

  const handleTaskDrop = useCallback((task, targetStatus) => {
    if (task.status === targetStatus) return;
    setTasks(prev => {
      const oldStatus = task.status;
      const updatedTask = { ...task, status: targetStatus };
      return {
        ...prev,
        [oldStatus]: prev[oldStatus].filter(t => t._id !== task._id),
        [targetStatus]: [...(prev[targetStatus] || []), updatedTask],
      };
    });
    setUpdatedTasks(prev => ({
      ...prev,
      [task._id]: targetStatus,
    }));
  }, []);

  const handleActiveDropZone = useCallback((status) => {
    setCurrentDropTarget(status);
  }, []);

  const handleScroll = useCallback((event) => {
    scrollOffsetY.value = event.nativeEvent.contentOffset.y;
  }, []);

  const openStatusModal = useCallback((task) => {
    setSelectedTask(task);
    setModalVisible(true);
  }, []);

  const changeTaskStatus = useCallback((newStatus) => {
    if (!selectedTask) return;
    setTasks((prev) => {
      const oldStatus = selectedTask.status;
      const updatedTask = { ...selectedTask, status: newStatus };
      return {
        ...prev,
        [oldStatus]: prev[oldStatus].filter((t) => t._id !== selectedTask._id),
        [newStatus]: [...(prev[newStatus] || []), updatedTask],
      };
    });
    setUpdatedTasks((prev) => ({
      ...prev,
      [selectedTask._id]: newStatus,
    }));
    setModalVisible(false);
    setSelectedTask(null);
  }, [selectedTask]);

  const confirmUpdate = useCallback(async () => {
    if (Object.keys(updatedTasks).length === 0) {
      Alert.alert('Info', 'No tasks to update.');
      return;
    }
    const updates = Object.entries(updatedTasks).map(([taskId, newStatus]) => ({
      id: taskId,
      status: newStatus,
    }));
    try {
      await axios.patch(
        `${config.VITE_REACT_APP_API_BASE_URL}/projecttasks/tasks/update`,
        { updates }
      );
      Alert.alert('Success', 'Tasks updated successfully.');
      setUpdatedTasks({});
    } catch (error) {
      Alert.alert('Error', 'Error updating tasks');
    }
  }, [updatedTasks]);

  const closeModal = useCallback(() => {
    setModalVisible(false);
    setSelectedTask(null);
  }, []);

  const hasUpdates = useMemo(() => Object.keys(updatedTasks).length > 0, [updatedTasks]);

  const totalTasks = useMemo(() =>
    STATUS_TYPES.reduce((total, status) => total + (tasks[status]?.length || 0), 0),
    [tasks]
  );

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <MaterialCommunityIcons name="loading" size={32} color="#3B82F6" />
        <Text className="text-gray-600 mt-2">Loading tasks...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50" style={{ position: 'relative' }}>
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: insets.bottom + (hasUpdates ? 80 : 0) }}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!isDragging}
        nestedScrollEnabled={true}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View className="py-6">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-xl bg-blue-500 items-center justify-center mr-3">
                <MaterialCommunityIcons name="view-dashboard" size={20} color="white" />
              </View>
              <View>
                <Text className="text-2xl font-bold text-gray-800">
                  Task Workflow
                </Text>
                <Text className="text-gray-600 text-sm">
                  Drag tasks between columns or tap to edit
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={fetchTasks} className="p-2" disabled={isDragging}>
              <Feather name="refresh-cw" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mt-4">
            <View className="flex-row justify-between">
              <View className="items-center">
                <Text className="text-2xl font-bold text-blue-600">
                  {tasks['Not Started']?.length || 0}
                </Text>
                <Text className="text-gray-600 text-xs">Pending</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-amber-600">
                  {tasks['In Progress']?.length || 0}
                </Text>
                <Text className="text-gray-600 text-xs">Active</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-green-600">
                  {tasks['Completed']?.length || 0}
                </Text>
                <Text className="text-gray-600 text-xs">Done</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-gray-800">
                  {totalTasks}
                </Text>
                <Text className="text-gray-600 text-xs">Total</Text>
              </View>
            </View>
          </View>
        </View>
        {STATUS_TYPES.map((status) => (
          <DropZoneSection
            key={status}
            status={status}
            tasks={tasks[status] || []}
            onTaskPress={openStatusModal}
            onLayout={handleDropZoneLayout}
            isDropTarget={currentDropTarget === status}
            isDragging={isDragging}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDrop={handleTaskDrop}
            dropZones={dropZones}
            draggedTaskId={draggedTask?._id}
            activeDropZone={handleActiveDropZone}
          />
        ))}
      </ScrollView>
      {hasUpdates && (
        <View className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
          <TouchableOpacity
            onPress={confirmUpdate}
            className="bg-blue-600 rounded-xl py-4 flex-row items-center justify-center"
            style={{
              shadowColor: '#3B82F6',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            <AntDesign name="check" size={18} color="white" />
            <Text className="text-white font-semibold text-base ml-2">
              Save Changes ({Object.keys(updatedTasks).length})
            </Text>
          </TouchableOpacity>
        </View>
      )}
      <StatusModal
        isVisible={isModalVisible}
        selectedTask={selectedTask}
        onStatusChange={changeTaskStatus}
        onClose={closeModal}
      />
    </View>
  );
};

export default Workflow;