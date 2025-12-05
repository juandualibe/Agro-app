import { Stack } from 'expo-router';
import React from 'react';

export default function LotsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* La lista de lotes */}
      <Stack.Screen name="index" /> 
      
      {/* 🗑️ ELIMINADO: name="new" (Ahora está en lot-create) */}
      {/* 🗑️ ELIMINADO: name="[id]" (Ahora está en lot-detail) */}
    </Stack>
  );
}