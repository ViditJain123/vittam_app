import { useAuth } from '@/app/context/AuthContext';
import { Colors } from '@/app/utils/Colors';
import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { Platform } from 'react-native';

export default function TabLayout() {
  const { user } = useAuth();

  // Protect authenticated routes
  if (!user) {
    return <Redirect href="/auth/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: 'absolute',
          },
          default: {},
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <TabIcon name="home" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <TabIcon name="account" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}


interface TabIconProps {
  name: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  size: number;
}

function TabIcon({ name, color, size }: TabIconProps) {
  return (
    <MaterialCommunityIcons name={name} color={color} size={size} />
  );
}
