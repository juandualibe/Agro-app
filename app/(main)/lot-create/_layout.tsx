import { Stack } from 'expo-router';

export default function LotCreateLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Solo definimos lo que existe: new */}
      <Stack.Screen name="new" /> 
      
      {/* Si tenías un 'index' aquí borralo, porque esta carpeta solo tiene 'new.tsx' */}
    </Stack>
  );
}