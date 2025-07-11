import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const ProjectTasks = ({ creator, tasks }) => {
  const router = useRouter();

  const handleTaskClick = (taskId) => {
    console.log("task id is " + creator)
    const makeRoute = taskId + "-" + creator;
    const taskDetails = makeRoute.toString();
    console.log(taskDetails);
    router.push(`/${taskDetails}`);
  };

  const statusStyles = {
    NotStarted: { color: '#2563EB', backgroundColor: '#BFDBFE' },
    Completed: { color: '#16A34A', backgroundColor: '#DCFCE7', borderColor: '#16A34A' },
    InProgress: { color: '#D97706', backgroundColor: '#FEF3C7' },
  };

  return (
    <View style={styles.container}>
      {tasks.length === 0 ? (
        <Text style={styles.noTasksText}>No tasks found for this project.</Text>
      ) : (
        <View>
          <View style={styles.taskSummary}>
            <Text style={styles.totalTasksLabel}>Total Tasks:</Text>
            <Text style={styles.totalTasksCount}>{tasks.length}</Text>
          </View>
          <ScrollView>
            {tasks.map((item) => {
              const { task, user } = item;
              const taskStatusStyle =
                task.status === 'Not Started'
                  ? statusStyles.NotStarted
                  : task.status === 'Completed'
                    ? statusStyles.Completed
                    : statusStyles.InProgress;

              return (
                <TouchableOpacity
                  key={task._id}
                  onPress={() => handleTaskClick(task._id)}
                  style={styles.taskContainer}
                >
                  <View style={styles.taskHeader}>
                    <View style={styles.taskTitleContainer}>
                      <FontAwesome5
                        name="clipboard-list"
                        size={24}
                        color="white"
                        style={styles.taskIcon}
                      />
                      <View style={styles.taskTitle}>
                        <Text style={styles.taskTitleText}>{task.title}</Text>
                        <Text style={[styles.taskStatus, taskStatusStyle]}>{task.priority}</Text>
                      </View>
                    </View>
                    <View>
                      <View style={styles.dueDateContainer}>
                        <Text style={styles.dueLabel}>Due:</Text>
                        <Text style={styles.dueDate}>
                          {new Date(task.dueDate.$date || task.dueDate).toLocaleDateString()}
                        </Text>
                      </View>
                      <View style={styles.assignedToContainer}>
                        <Text style={styles.assignedLabel}>Assigned to:</Text>
                        <Text style={styles.assignedName}>{user.name}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.divider}></View>
                  <View style={styles.taskFooter}>
                    <FontAwesome
                      name="comments"
                      size={18}
                      color="#6B7280"
                      style={styles.commentIcon}
                    />
                    <Text style={styles.commentText}>
                      {task.comments.length}{' '}
                      {task.comments.length === 1 ? 'Comment' : 'Comments'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 15 },
  noTasksText: { textAlign: 'center', color: '#9CA3AF', fontSize: 16 },
  taskSummary: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  totalTasksLabel: { color: '#6B7280', fontWeight: '600', fontSize: 16 },
  totalTasksCount: { color: '#111827', fontWeight: '700', fontSize: 16, marginLeft: 5 },
  taskContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 1,
  },
  taskHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  taskTitleContainer: { flexDirection: 'row', alignItems: 'center' },
  taskIcon: { backgroundColor: '#6B7280', padding: 10, borderRadius: 50 },
  taskTitle: { marginLeft: 10 },
  taskTitleText: { fontSize: 16, fontWeight: '600', marginBottom: 5 },
  taskStatus: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 15,
    overflow: 'hidden',
  },
  dueDateContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  dueLabel: { color: '#EF4444', fontWeight: '600', fontSize: 14 },
  dueDate: { color: '#111827', fontSize: 14 },
  assignedToContainer: { flexDirection: 'row', alignItems: 'center' },
  assignedLabel: { color: '#2563EB', fontWeight: '600', fontSize: 14 },
  assignedName: { color: '#1E40AF', fontWeight: '500', fontSize: 14 },
  divider: { height: 2, backgroundColor: '#E5E7EB', marginVertical: 10 },
  taskFooter: { flexDirection: 'row', alignItems: 'center' },
  commentIcon: { marginRight: 8 },
  commentText: { color: '#6B7280', fontSize: 14 },
});

export default ProjectTasks;
