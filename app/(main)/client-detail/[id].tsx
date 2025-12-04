import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
// Asegúrate de que esta ruta de importación sea correcta:
import { supabase } from '../../../lib/supabase';

// Función auxiliar para validar un UUID simple y excluir nombres de ruta.
const isValidUUID = (str: string | null | undefined): boolean => {
    if (!str) return false;
    // Un UUID es una cadena larga de al menos 5 caracteres (suficiente para excluir 'index' y 'new').
    return str.length >= 5 && str !== 'index' && str !== 'new'; 
};

export default function EditClientScreen() {
    
    // Extraer el ID del parámetro de la ruta dinámica.
    const { id: clientId } = useLocalSearchParams() as { id: string };

    const [nombre, setNombre] = useState('');
    const [empresa, setEmpresa] = useState('');
    const [establecimiento, setEstablecimiento] = useState('');
    const [contacto, setContacto] = useState('');
    const [email, setEmail] = useState('');
    const [direccion, setDireccion] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        // 🚀 VERIFICACIÓN CRÍTICA: Solo intentar buscar datos si el ID es válido.
        if (isValidUUID(clientId)) {
            fetchCliente();
        } else {
            // Si el ID es inválido ("index" o undefined), NO hacemos fetch a Supabase.
            setLoading(false);
            console.warn(`Ruta dinámica cargada sin un ID válido: ${clientId}`);
        }
    }, [clientId]); 

    const fetchCliente = async () => {
        // Aseguramos la existencia y validez de clientId antes de la consulta
        if (!isValidUUID(clientId)) return; 

        try {
            const { data, error } = await supabase
                .from('clientes')
                .select('*')
                .eq('id', clientId) // Aquí es donde se generaba el error si clientId era "index"
                .single();

            if (error) {
                console.error('Error al cargar cliente (DB):', error);
                Alert.alert('Error', 'No se pudo cargar el cliente');
                router.back();
            } else if (data) {
                setNombre(data.nombre || '');
                setEmpresa(data.empresa || '');
                setEstablecimiento(data.establecimiento || '');
                setContacto(data.contacto || '');
                setEmail(data.email || '');
                setDireccion(data.direccion || '');
            }
        } catch (err) {
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        // ... (Validaciones) ...
        if (!nombre.trim()) {
            Alert.alert('Error', 'El nombre es obligatorio');
            return;
        }

        if (!empresa.trim()) {
            Alert.alert('Error', 'La empresa es obligatoria');
            return;
        }

        try {
            setSaving(true);

            const { error } = await supabase
                .from('clientes')
                .update({
                    nombre: nombre.trim(),
                    empresa: empresa.trim(),
                    establecimiento: establecimiento.trim() || null,
                    contacto: contacto.trim() || null,
                    email: email.trim() || null,
                    direccion: direccion.trim() || null,
                })
                .eq('id', clientId);

            if (error) {
                console.error('Error al actualizar:', error);
                Alert.alert('Error', 'No se pudo actualizar el cliente');
            } else {
                Alert.alert(
                    '✅ Cliente Actualizado',
                    `${nombre} fue actualizado exitosamente`,
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
            setSaving(false);
        }
    };

    const handleDelete = () => {
        Alert.alert(
            '⚠️ Eliminar Cliente',
            `¿Estás seguro de eliminar a ${nombre}?\n\nEsta acción no se puede deshacer.`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: confirmDelete,
                },
            ]
        );
    };

    const confirmDelete = async () => {
        try {
            setSaving(true);

            const { error } = await supabase
                .from('clientes')
                .delete()
                .eq('id', clientId);

            if (error) {
                console.error('Error al eliminar:', error);
                Alert.alert('Error', 'No se pudo eliminar el cliente');
            } else {
                Alert.alert(
                    '✅ Cliente Eliminado',
                    `${nombre} fue eliminado exitosamente`,
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
            setSaving(false);
        }
    };

    const handleCancel = () => {
        router.back();
    };

    // 🚀 Manejo del Loading y del error de routing
    const isInvalidRoutingId = !isValidUUID(clientId) && !loading;

    if (loading || isInvalidRoutingId) {
        if (isInvalidRoutingId) {
            // Este es el estado cuando el router monta el componente con un ID no válido ("index")
            return (
                <View style={styles.loadingContainer}>
                    <Text style={[styles.loadingText, { color: '#f44336' }]}>
                        ⚠️ Error Fatal de Navegación
                    </Text>
                    <Text style={{ marginTop: 10, color: '#999', fontSize: 14, textAlign: 'center' }}>
                        La URL no contiene un identificador de cliente válido.
                    </Text>
                    <Text style={{ marginTop: 5, color: '#999', fontSize: 12, textAlign: 'center' }}>
                        Parámetro recibido: **{clientId}**
                    </Text>
                </View>
            );
        }
        
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4caf50" />
                <Text style={styles.loadingText}>Cargando cliente...</Text>
            </View>
        );
    }
    
    // Si llegamos hasta aquí y el ID es inválido (y ya pasó el loading), 
    // deberíamos seguir mostrando el error, aunque el bloque de arriba ya lo maneja mejor.
    if (!isValidUUID(clientId)) {
        return <View style={styles.loadingContainer} />; // Renderizamos vacío para evitar doble render
    }

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
                <Text style={styles.headerTitle}>Editar Cliente</Text>
                <TouchableOpacity
                    style={[styles.headerButton, styles.saveButton]}
                    onPress={handleSave}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator size="small" color="white" />
                    ) : (
                        <Text style={styles.saveButtonText}>Guardar</Text>
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
                    <Text style={styles.label}>
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
                        style={styles.input}
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

                <Text style={styles.helperText}>* Campos obligatorios</Text>

                {/* Botón Eliminar */}
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={handleDelete}
                    disabled={saving}
                >
                    <Text style={styles.deleteButtonText}>🗑️ &nbsp;Eliminar Cliente</Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#666',
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
        marginBottom: 24,
        fontStyle: 'italic',
    },

    // Botón Eliminar
    deleteButton: {
        backgroundColor: '#ffebee',
        borderWidth: 2,
        borderColor: '#f44336',
        paddingVertical: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 40,
    },
    deleteButtonText: {
        color: '#c62828',
        fontSize: 16,
        fontWeight: 'bold',
    },
});