// app/(main)/clients/index.tsx
import { Redirect } from 'expo-router';

export default function ClientsRoot() {
  // 🚀 Redirige a la pantalla de lista que ahora se llama 'list.tsx'
  return <Redirect href="/clients/list" />; 
}