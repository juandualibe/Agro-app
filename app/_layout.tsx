import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // Ocultar todos los headers por defecto
        contentStyle: { backgroundColor: '#f5f5f5' },
      }}
    />
  );
}