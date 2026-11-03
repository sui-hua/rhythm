import { Tabs } from 'expo-router'
import { BarChart3, Calendar, CircleDot, Compass, User } from 'lucide-react-native'

// 底部标签布局：按设计稿五个标签，zinc 中性配色，选中态为黑色
export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#18181b',
        tabBarInactiveTintColor: '#a1a1aa',
        tabBarStyle: { backgroundColor: '#ffffff', borderTopColor: '#e4e4e7' },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' }
      }}
    >
      <Tabs.Screen
        name="day"
        options={{ title: '时序', tabBarIcon: ({ color }) => <Calendar size={22} strokeWidth={2} color={color} /> }}
      />
      <Tabs.Screen
        name="habits"
        options={{ title: '习惯', tabBarIcon: ({ color }) => <CircleDot size={22} strokeWidth={2} color={color} /> }}
      />
      <Tabs.Screen
        name="direction"
        options={{ title: '所向', tabBarIcon: ({ color }) => <Compass size={22} strokeWidth={2} color={color} /> }}
      />
      <Tabs.Screen
        name="summary"
        options={{ title: '总结', tabBarIcon: ({ color }) => <BarChart3 size={22} strokeWidth={2} color={color} /> }}
      />
      <Tabs.Screen
        name="me"
        options={{ title: '我的', tabBarIcon: ({ color }) => <User size={22} strokeWidth={2} color={color} /> }}
      />
    </Tabs>
  )
}
