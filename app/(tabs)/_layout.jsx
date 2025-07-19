import { Drawer } from 'expo-router/drawer';
import { View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

function CustomDrawerContent(props) {
  // Dummy project data
  const projects = [
    { id: 1, name: 'Mobile App', color: '#FF6B6B' },
    { id: 2, name: 'Website Redesign', color: '#4ECDC4' },
    { id: 3, name: 'E-commerce Platform', color: '#45B7D1' },
    { id: 4, name: 'Marketing Campaign', color: '#96CEB4' },
    { id: 5, name: 'Data Analytics', color: '#FECA57' },
    { id: 6, name: 'Social Media Tool', color: '#FF9FF3' },
    { id: 7, name: 'AI Assistant', color: '#A8E6CF' },
    { id: 8, name: 'Cloud Infrastructure', color: '#FFB3E6' },
    { id: 9, name: 'Security Audit', color: '#C7CEEA' },
    { id: 10, name: 'User Research', color: '#FFD93D' },
  ];

  const handleLogout = () => {
    // Add your logout logic here
    console.log('Logout pressed');
    // Example: router.replace('/login');
  };

  const handleProjectPress = (project) => {
    console.log('Project pressed:', project.name);
    // Add navigation to project details
  };

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ flex: 1 }}>
      {/* Profile Section */}
      <View className="flex-row items-center p-5 bg-gray-50 mt-3">
        <Image
          source={{
            uri: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face&auto=format',
          }}
          className="w-15 h-15 rounded-full mr-4"
        />
        <View className="flex-1">
          <Text className="text-lg font-bold text-gray-800 mb-1">John Doe</Text>
          <Text className="text-sm text-gray-600">john.doe@example.com</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} className="p-2 rounded-full bg-red-100">
          <Ionicons name="log-out-outline" size={24} color="#e74c3c" />
        </TouchableOpacity>
      </View>

      <View className="h-px bg-gray-300 my-3" />

      {/* Navigation Items */}
      <View className="flex-1 pt-3">
        <DrawerItem
          label="Home"
          onPress={() => router.push('/')}
          icon={({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          )}
          labelStyle={{ fontSize: 16, color: '#333', marginLeft: -16 }}
        />
        <DrawerItem
          label="Admin"
          onPress={() => router.push('/admin')}
          icon={({ color, size }) => (
            <Ionicons name="shield-outline" size={size} color={color} />
          )}
          labelStyle={{ fontSize: 16, color: '#333', marginLeft: -16 }}
        />
        <DrawerItem
          label="Joined"
          onPress={() => router.push('/joined')}
          icon={({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          )}
          labelStyle={{ fontSize: 16, color: '#333', marginLeft: -16 }}
        />
        <DrawerItem
          label="Manager"
          onPress={() => router.push('/manager')}
          icon={({ color, size }) => (
            <Ionicons name="briefcase-outline" size={size} color={color} />
          )}
          labelStyle={{ fontSize: 16, color: '#333', marginLeft: -16 }}
        />
        <DrawerItem
          label="Workflow"
          onPress={() => router.push('/workflow')}
          icon={({ color, size }) => (
            <Ionicons name="git-branch-outline" size={size} color={color} />
          )}
          labelStyle={{ fontSize: 16, color: '#333', marginLeft: -16 }}
        />
      </View>

      {/* Projects Section */}
      <View className="px-5 py-3">
        <Text className="text-base font-semibold text-gray-800 mb-4 ml-1">Projects</Text>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          className="max-h-80"
          nestedScrollEnabled={true}
        >
          {projects.map((project) => (
            <TouchableOpacity
              key={project.id}
              className="flex-row items-center py-3 px-1"
              onPress={() => handleProjectPress(project)}
            >
              <View 
                className="w-10 h-10 rounded-full justify-center items-center mr-4"
                style={{ backgroundColor: project.color }}
              >
                <Text className="text-base font-bold text-white">
                  {project.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text className="text-sm text-gray-800 flex-1">{project.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </DrawerContentScrollView>
  );
}

export default function TabsLayout() {
  return (
    <Drawer
      drawerContent={CustomDrawerContent}
      screenOptions={{
        headerStyle: { backgroundColor: '#f5f5f5' },
        headerTintColor: '#333',
        drawerStyle: { backgroundColor: '#fff' },
      }}
    >
      <Drawer.Screen name="index" options={{ drawerLabel: 'Home', headerTitle: 'Home' }} />
      <Drawer.Screen name="admin" options={{ drawerLabel: 'Admin', headerTitle: 'Admin' }} />
      <Drawer.Screen name="joined" options={{ drawerLabel: 'Joined', headerTitle: 'Joined' }} />
      <Drawer.Screen name="manager" options={{ drawerLabel: 'Manager', headerTitle: 'Manager' }} />
      <Drawer.Screen name="profile" options={{ drawerLabel: 'Profile', headerTitle: 'Profile' }} />
      <Drawer.Screen name="workflow" options={{ drawerLabel: 'Workflow', headerTitle: 'Workflow' }} />
    </Drawer>
  );
}