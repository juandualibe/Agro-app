// app/(main)/lots/_layout.tsx

import { Stack } from 'expo-router';
import React from 'react';

export default function LotsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* 1. index.tsx (Lista de lotes) */}
      <Stack.Screen name="index" /> 
      
      {/* 2. new.tsx (Crear nuevo lote) */}
      <Stack.Screen name="new" />
      
      {/* 3. [id].tsx (Editar lote específico) */}
      <Stack.Screen name="[id]" />
    </Stack>
  );
}