import { Tabs } from 'expo-router/js-tabs';

import { TabBar } from '@/components/tab-bar';

export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Bugün' }} />
      <Tabs.Screen name="body" options={{ title: 'Vücut' }} />
      <Tabs.Screen name="trend" options={{ title: 'Trend' }} />
      <Tabs.Screen name="coach" options={{ title: 'Koç' }} />
      <Tabs.Screen name="me" options={{ title: 'Ben' }} />
    </Tabs>
  );
}
