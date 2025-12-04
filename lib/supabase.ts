import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

// 🔑 TUS CREDENCIALES DE SUPABASE
const supabaseUrl = 'https://lquwbhlsbcmovmvclkmp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxdXdiaGxzYmNtb3ZtdmNsa21wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NTU1MzgsImV4cCI6MjA4MDQzMTUzOH0.jIwB3dtlJl31iL9u8t1KJZctN8iLWrZgaLpubVhZQsU';

// 📡 Crear el cliente de Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});