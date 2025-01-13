import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { FontAwesome5, FontAwesome } from '@expo/vector-icons';

const TaskModal = ({
    isOpen,
    onClose,
    onSubmit,
    newTask,
    users,
    handleChange,
    editingTaskId,
}) => {
    if (!isOpen) return null;

    return (
        <Modal visible={isOpen} transparent={true} animationType="none">
            <View className='flex-1 justify-center items-center bg-black/60'>
                <View style={styles.modalContainer}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Text style={styles.closeButtonText}>&times;</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>
                        {editingTaskId ? 'Edit Task' : 'Create New Task'}
                    </Text>
                    <View style={styles.divider} />
                    <View style={styles.form}>
                        <View>
                            <View style={styles.labelContainer}>
                                <FontAwesome5 name="subscript" size={15} color="#4B5563" />
                                <Text style={styles.label}>Title</Text>
                            </View>
                            <TextInput
                                style={styles.input}
                                value={newTask.title}
                                onChangeText={(text) => handleChange('title', text)}
                                placeholder="Enter task title"
                            />
                        </View>

                        <View style={styles.row}>
                            <View style={styles.field}>
                                <View style={styles.labelContainer}>
                                    <FontAwesome5 name="info-circle" size={15} color="#4B5563" />
                                    <Text style={styles.label}>Status</Text>
                                </View>
                                <Picker
                                    selectedValue={newTask.status}
                                    onValueChange={(value) =>
                                        handleChange('status', value)
                                    }
                                    style={styles.picker}
                                >
                                    <Picker.Item label="Not Started" value="Not Started" />
                                    <Picker.Item label="In Progress" value="In Progress" />
                                </Picker>
                            </View>

                            <View style={styles.field}>
                                <View style={styles.labelContainer}>
                                    <FontAwesome5 name="flag" size={15} color="#4B5563" />
                                    <Text style={styles.label}>Priority</Text>
                                </View>
                                <Picker
                                    selectedValue={newTask.priority}
                                    onValueChange={(value) =>
                                        handleChange('priority', value)
                                    }
                                    mode="dialog"
                                >
                                    <Picker.Item label="Low" value="Low" />
                                    <Picker.Item label="Medium" value="Medium" />
                                    <Picker.Item label="High" value="High" />
                                </Picker>
                            </View>
                        </View>

                        <View style={styles.row}>
                            <View style={styles.field}>
                                <View style={styles.labelContainer}>
                                    <FontAwesome5 name="calendar-alt" size={15} color="#4B5563" />
                                    <Text style={styles.label}>Due Date</Text>
                                </View>
                                <TextInput
                                    style={styles.input}
                                    value={newTask.dueDate}
                                    placeholder="YYYY-MM-DD"
                                    onChangeText={(text) =>
                                        handleChange('dueDate', text)
                                    }
                                />
                            </View>

                            <View style={styles.field}>
                                <View style={styles.labelContainer}>
                                    <FontAwesome5 name="user-friends" size={15} color="#4B5563" />
                                    <Text style={styles.label}>Select Member</Text>
                                </View>
                                <Picker
                                    selectedValue={newTask.assignedTo}
                                    onValueChange={(value) =>
                                        handleChange('assignedTo', value)
                                    }
                                    style={styles.picker}
                                >
                                    <Picker.Item label="Select Member" value="" />
                                    {users.map((user) => (
                                        <Picker.Item
                                            key={user._id}
                                            label={user.email}
                                            value={user._id}
                                        />
                                    ))}
                                </Picker>
                            </View>
                        </View>

                        <View>
                            <View style={styles.labelContainer}>
                                <FontAwesome5 name="file-alt" size={15} color="#4B5563" />
                                <Text style={styles.label}>Guidelines</Text>
                            </View>
                            <TextInput
                                style={[styles.input, styles.textarea]}
                                value={newTask.description}
                                placeholder="Enter task guidelines"
                                multiline
                                numberOfLines={4}
                                onChangeText={(text) =>
                                    handleChange('description', text)
                                }
                            />
                        </View>

                        <TouchableOpacity
                            style={styles.submitButton}
                            onPress={onSubmit}
                        >
                            <FontAwesome5
                                name="check-circle"
                                size={18}
                                color="#FFFFFF"
                                style={styles.submitIcon}
                            />
                            <Text style={styles.submitText}>
                                {editingTaskId ? 'Update Task' : 'Create Task'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        backgroundColor: '#FFFFFF',
        width: '90%',
        borderRadius: 10,
        padding: 16,
        position: 'relative',
    },
    closeButton: {
        position: 'absolute',
        top: 10,
        right: 10,
    },
    closeButtonText: {
        fontSize: 28,
        color: '#4B5563',
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
        color: '#4B5563',
    },
    divider: {
        height: 2,
        backgroundColor: '#E5E7EB',
        marginVertical: 10,
    },
    form: {
        marginTop: 10,
    },
    labelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    label: {
        marginLeft: 5,
        fontSize: 13,
        fontWeight: '600',
        color: '#4B5563',
    },
    input: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 5,
        padding: 8,
        fontSize: 14,
        marginBottom: 10,
    },
    textarea: {
        height: 80,
        textAlignVertical: 'top',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    field: {
        width: '48%',
    },
    picker: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 5,
        padding: 8,
        fontSize: 14,
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#275CA2',
        padding: 10,
        borderRadius: 5,
        justifyContent: 'center',
    },
    submitIcon: {
        marginRight: 5,
    },
    submitText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
});

export default TaskModal;
