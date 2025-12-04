// app/(main)/lots/new.tsx

import { router } from 'expo-router';
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
import { supabase } from '../../../lib/supabase';

// Definición básica de Cliente para el selector
interface Cliente {
    id: string;
    nombre: string;
    empresa: string;
}

export default function NewLotScreen() {
    // 1. ESTADOS PRINCIPALES
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [clienteSeleccionadoId, setClienteSeleccionadoId] = useState<string | null>(null);
    const [nombreLote, setNombreLote] = useState('');
    const [superficie, setSuperficie] = useState(''); // Manejado como string para input decimal
    const [latitud, setLatitud] = useState('');
    const [longitud, setLongitud] = useState('');
    const [cultivo, setCultivo] = useState('');
    const [comentarios, setComentarios] = useState('');

    const [loading, setLoading] = useState(false);
    const [fetchingClientes, setFetchingClientes] = useState(true);

    // 2. CARGA INICIAL: Obtener la lista de clientes para el selector
    useEffect(() => {
        fetchClientes();
    }, []);

    const fetchClientes = async () => {
        try {
            const { data, error } = await supabase
                .from('clientes')
                .select('id, nombre, empresa')
                .order('nombre', { ascending: true });

            if (error) {
                console.error('Error cargando clientes:', error);
                Alert.alert('Error', 'No se pudieron cargar los clientes base.');
            } else {
                setClientes(data || []);
            }
        } catch (err) {
            console.error('Error:', err);
        } finally {
            setFetchingClientes(false);
        }
    };

    // 3. FUNCIÓN DE GUARDADO
    const handleSave = async () => {
        // Validación
        if (!clienteSeleccionadoId || !nombreLote.trim() || !superficie || isNaN(parseFloat(superficie))) {
            Alert.alert('Error', 'Cliente, Nombre de Lote y Superficie son obligatorios.');
            return;
        }

        const superficieNum = parseFloat(superficie);

        try {
            setLoading(true);

            const { error } = await supabase
                .from('lotes')
                .insert([
                    {
                        cliente_id: clienteSeleccionadoId,
                        nombre_lote: nombreLote.trim(),
                        superficie_ha: superficieNum,
                        latitud: latitud ? parseFloat(latitud) : null,
                        longitud: longitud ? parseFloat(longitud) : null,
                        cultivo: cultivo.trim() || null,
                        comentarios: comentarios.trim() || null,
                    },
                ]);

            if (error) {
                console.error('Error al guardar lote:', error);
                Alert.alert('Error', 'No se pudo guardar el lote: ' + error.message);
            } else {
                Alert.alert('✅ Lote Guardado', `${nombreLote} fue agregado exitosamente.`, [
                    { text: 'OK', onPress: () => router.back() },
                ]);
            }
        } catch (err) {
            console.error('Error:', err);
            Alert.alert('Error', 'Ocurrió un error inesperado al guardar.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        router.back();
    };
    
    // Encuentra el nombre del cliente seleccionado para mostrarlo en el input
    const clienteNombreDisplay = clientes.find(c => c.id === clienteSeleccionadoId)?.nombre || 'Seleccionar Cliente';

    if (fetchingClientes) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4caf50" />
                <Text style={styles.loadingText}>Cargando datos base...</Text>
            </View>
        );
    }
    
    if (clientes.length === 0) {
         return (
            <View style={styles.loadingContainer}>
                <Text style={[styles.loadingText, { color: '#f44336' }]}>
                    ⚠️ No hay clientes
                </Text>
                <Text style={styles.emptySubtext}>
                    Debe crear al menos un cliente antes de poder crear un lote.
                </Text>
            </View>
        );
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
                <Text style={styles.headerTitle}>Nuevo Lote</Text>
                <TouchableOpacity
                    style={[styles.headerButton, styles.saveButton]}
                    onPress={handleSave}
                    disabled={loading}
                >
                    {loading ? (
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
                {/* Selector de Cliente (Aquí usarías un modal o un picker real) */}
                <View style={styles.fieldContainer}>
                    <Text style={styles.label}>
                        Cliente <Text style={styles.required}>*</Text>
                    </Text>
                    <TouchableOpacity 
                        style={styles.pickerInput}
                        // 💡 Aquí necesitarás navegar a una pantalla de selección de cliente
                        // Por ahora, solo simula la selección:
                        onPress={() => Alert.alert('Selector de Clientes', 'Implementar navegación a /clients/selector')}
                    >
                        <Text style={styles.pickerText}>{clienteNombreDisplay}</Text>
                        <Text style={styles.pickerIcon}>▼</Text>
                    </TouchableOpacity>
                </View>

                {/* Nombre del Lote */}
                <View style={styles.fieldContainer}>
                    <Text style={styles.label}>
                        Nombre del Lote <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ej: Lote 15, El Bajo"
                        value={nombreLote}
                        onChangeText={setNombreLote}
                        autoCapitalize="words"
                        autoCorrect={false}
                    />
                </View>
                
                {/* Superficie (Hectáreas) */}
                <View style={styles.fieldContainer}>
                    <Text style={styles.label}>
                        Superficie (ha) <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ej: 49.00"
                        value={superficie}
                        onChangeText={setSuperficie}
                        keyboardType="numeric"
                    />
                </View>
                
                {/* Cultivo */}
                <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Cultivo / Diagnóstico</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ej: Trigo, Maíz, Barbecho Químico..."
                        value={cultivo}
                        onChangeText={setCultivo}
                        autoCapitalize="words"
                    />
                </View>

                {/* Latitud y Longitud */}
                <View style={styles.coordContainer}>
                    <View style={styles.halfField}>
                        <Text style={styles.label}>Latitud</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="-28.615712"
                            value={latitud}
                            onChangeText={setLatitud}
                            keyboardType="numeric"
                        />
                    </View>
                    <View style={styles.halfField}>
                        <Text style={styles.label}>Longitud</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="-62.341989"
                            value={longitud}
                            onChangeText={setLongitud}
                            keyboardType="numeric"
                        />
                    </View>
                </View>

                {/* Comentarios */}
                <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Comentarios</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Notas adicionales sobre el lote o mantenimiento"
                        value={comentarios}
                        onChangeText={setComentarios}
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                    />
                </View>
                
                <Text style={styles.helperText}>* Campos obligatorios</Text>
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
        padding: 20,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 18,
        fontWeight: '600',
        color: '#666',
    },
    emptySubtext: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        marginTop: 8,
    },
    // Header (copiado de Clientes)
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
    coordContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        gap: 16,
    },
    halfField: {
        flex: 1,
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
    pickerInput: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    pickerText: {
        fontSize: 16,
        color: '#333',
    },
    pickerIcon: {
        fontSize: 14,
        color: '#999',
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