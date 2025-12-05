import { Stack } from 'expo-router';
import React from 'react';

export default function ClientsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Redireccionador */}
      <Stack.Screen name="index" /> 
      
      {/* Lista real */}
      <Stack.Screen name="list" /> 
      
      {/* Crear Cliente */}
      <Stack.Screen name="new" />
      
      {/* 🗑️ ELIMINADO: <Stack.Screen name="[id]" /> (Ya no vive aquí) */}
    </Stack>
  );
}