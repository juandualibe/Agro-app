// app/(main)/clients/_layout.tsx

import { Stack, useSegments } from 'expo-router';
import React from 'react';

// Función para verificar si el segmento actual es el ID dinámico
const isEditingRoute = (segments: string[]) => {
    // Busca si hay un segmento que parezca una ruta dinámica pero no sea 'list' o 'new'
    // La lógica de Expo Router intentará que el segmento después de /clients/ sea el [id]
    // Si el tercer segmento (índice 2) es 'index', o es un valor que no es 'new' o 'list', lo consideramos el ID
    const segment = segments[2];
    return segment && segment !== 'list' && segment !== 'new';
};

export default function ClientsLayout() {
  const segments = useSegments();
  const showEditScreen = isEditingRoute(segments);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* 1. index (Redirecciona a list) */}
      <Stack.Screen name="index" /> 
      
      {/* 2. list (La lista real de clientes) */}
      <Stack.Screen name="list" /> 
      
      {/* 3. new (Crear Cliente) */}
      <Stack.Screen name="new" />
      
      {/* 🛑 EXCLUIMOS CONDICIONALMENTE LA PANTALLA [id] 
         SI NO ESTAMOS EN EL MODO EDICIÓN REAL */}
      {showEditScreen ? (
        <Stack.Screen name="[id]" />
      ) : null}
      
    </Stack>
  );
}