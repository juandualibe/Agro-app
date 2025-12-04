// app/(main)/client-detail/_layout.tsx

import { Stack } from 'expo-router';

export default function ClientDetailLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Solo contiene la ruta dinámica. */}
      <Stack.Screen name="[id]" /> 
    </Stack>
  );
}