import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../../lib/supabase';

export default function NewClientScreen() {
  const [nombre, setNombre] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [establecimiento, setEstablecimiento] = useState('');
  const [contacto, setContacto] = useState('');
  const [email, setEmail] = useState('');
  const [direccion, setDireccion] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    // Validaciones
    if (!nombre. trim()) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return;
    }

    if (!empresa.trim()) {
      Alert.alert('Error', 'La empresa es obligatoria');
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('clientes')
        .insert([
          {
            nombre: nombre.trim(),
            empresa: empresa.trim(),
            establecimiento: establecimiento.trim() || null,
            contacto: contacto.trim() || null,
            email: email.trim() || null,
            direccion: direccion.trim() || null,
          },
        ])
        .select();

      if (error) {
        console.error('Error al guardar:', error);
        Alert.alert('Error', 'No se pudo guardar el cliente');
      } else {
        Alert.alert(
          '✅ Cliente Guardado',
          `${nombre} fue agregado exitosamente`,
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      }
    } catch (err) {
      console.error('Error:', err);
      Alert.alert('Error', 'Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (nombre || empresa || establecimiento || contacto || email || direccion) {
      Alert.alert(
        'Cancelar',
        '¿Seguro que querés salir?  Los datos no se guardarán.',
        [
          { text: 'No', style: 'cancel' },
          { text: 'Sí, salir', onPress: () => router.back(), style: 'destructive' },
        ]
      );
    } else {
      router.back();
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={handleCancel}>
          <Text style={styles.headerButtonText}>Cancelar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nuevo Cliente</Text>
        <TouchableOpacity
          style={[styles.headerButton, styles.saveButton]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles. saveButtonText}>Guardar</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Formulario */}
      <ScrollView
        style={styles.form}
        contentContainerStyle={styles.formContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Nombre */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>
            Nombre <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Juan Pérez"
            value={nombre}
            onChangeText={setNombre}
            autoCapitalize="words"
            autoCorrect={false}
          />
        </View>

        {/* Empresa */}
        <View style={styles.fieldContainer}>
          <Text style={styles. label}>
            Empresa <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Agropecuaria San José"
            value={empresa}
            onChangeText={setEmpresa}
            autoCapitalize="words"
          />
        </View>

        {/* Establecimiento */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Establecimiento</Text>
          <TextInput
            style={styles. input}
            placeholder="Ej: Campo Las Rosas"
            value={establecimiento}
            onChangeText={setEstablecimiento}
            autoCapitalize="words"
          />
        </View>

        {/* Contacto */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Teléfono</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: +54 9 351 123 4567"
            value={contacto}
            onChangeText={setContacto}
            keyboardType="phone-pad"
          />
        </View>

        {/* Email */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: cliente@ejemplo.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Dirección */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Dirección</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Ej: Ruta 9 km 48, Córdoba"
            value={direccion}
            onChangeText={setDireccion}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <Text style={styles.helperText}>
          * Campos obligatorios
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  // Header
  header: {
    backgroundColor: '#4caf50',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 80,
  },
  headerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  saveButton: {
    alignItems: 'flex-end',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },

  // Formulario
  form: {
    flex: 1,
  },
  formContent: {
    padding: 20,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  required: {
    color: '#f44336',
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    minHeight: 80,
    paddingTop: 12,
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    fontStyle: 'italic',
  },
});