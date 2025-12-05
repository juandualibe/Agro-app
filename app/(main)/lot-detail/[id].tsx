// app/(main)/lot-detail/[id].tsx

import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView,
    StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { supabase } from '../../../lib/supabase';

// Helper para prevenir errores de routing con 'index'
const isValidUUID = (str: string | null | undefined): boolean => {
    if (!str) return false;
    return str.length >= 5 && str !== 'index' && str !== 'new'; 
};

export default function EditLotScreen() { 
    const { id: lotId } = useLocalSearchParams() as { id: string };

    // ESTADOS ESPECÍFICOS DE LOTE
    const [nombreLote, setNombreLote] = useState('');
    const [superficie, setSuperficie] = useState('');
    const [cultivo, setCultivo] = useState('');
    const [latitud, setLatitud] = useState('');
    const [longitud, setLongitud] = useState('');
    const [comentarios, setComentarios] = useState('');
    
    // Estado del cliente (solo para mostrar)
    const [clienteNombre, setClienteNombre] = useState('Cargando...'); 

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isValidUUID(lotId)) {
            fetchLot(); 
        } else {
            setLoading(false);
            console.warn(`Ruta dinámica cargada sin un ID válido: ${lotId}`);
        }
    }, [lotId]);

    const fetchLot = async () => {
        if (!isValidUUID(lotId)) return; 

        try {
            // BUSCAMOS EN LA TABLA LOTES y traemos el nombre del cliente
            const { data, error } = await supabase
                .from('lotes')
                // ⚠️ Se usa 'clientes(nombre)' para hacer un JOIN implícito.
                .select('*, clientes(nombre)') 
                .eq('id', lotId)
                .single();

            if (error) {
                console.error('Error al cargar lote (DB):', error);
                Alert.alert('Error', 'No se pudo cargar el lote.');
                router.back();
            } else if (data) {
                // Mapeo de estados
                setNombreLote(data.nombre_lote || '');
                // Convertimos el decimal a string
                setSuperficie(data.superficie_ha ? String(data.superficie_ha) : ''); 
                setCultivo(data.cultivo || '');
                setLatitud(data.latitud ? String(data.latitud) : '');
                setLongitud(data.longitud ? String(data.longitud) : '');
                setComentarios(data.comentarios || '');
                setClienteNombre(data.clientes?.nombre || 'N/A'); 
            }
        } catch (err) {
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!nombreLote.trim() || !superficie || isNaN(parseFloat(superficie))) {
            Alert.alert('Error', 'Nombre de Lote y Superficie son obligatorios.');
            return;
        }

        try {
            setSaving(true);
            
            // Actualizar la tabla LOTES
            const { error } = await supabase
                .from('lotes')
                .update({
                    nombre_lote: nombreLote.trim(),
                    superficie_ha: parseFloat(superficie),
                    cultivo: cultivo.trim() || null,
                    latitud: latitud ? parseFloat(latitud) : null,
                    longitud: longitud ? parseFloat(longitud) : null,
                    comentarios: comentarios.trim() || null,
                })
                .eq('id', lotId);

            if (error) {
                console.error('Error al actualizar:', error);
                Alert.alert('Error', 'No se pudo actualizar el lote');
            } else {
                Alert.alert('✅ Lote Actualizado', `${nombreLote} fue actualizado.`, [
                    { text: 'OK', onPress: () => router.back() },
                ]);
            }
        } catch (err) {
            console.error('Error:', err);
        } finally {
            setSaving(false);
        }
    };
    
    const handleCancel = () => { router.back(); };
    // Pendiente: handleDelete y confirmDelete (usa la lógica de clientes)

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4caf50" />
                <Text style={styles.loadingText}>Cargando lote...</Text>
            </View>
        );
    }
    
    // Manejo de errores de navegación
    if (!isValidUUID(lotId)) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={[styles.loadingText, { color: '#f44336' }]}>⚠️ Error de URL</Text>
                <Text style={{ marginTop: 10, color: '#999', fontSize: 14, textAlign: 'center' }}>
                    Identificador de lote no válido.
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
                <Text style={styles.headerTitle}>Editar Lote</Text>
                <TouchableOpacity
                    style={[styles.headerButton, styles.saveButton]}
                    onPress={handleSave}
                    disabled={saving}
                >
                    {saving ? ( <ActivityIndicator size="small" color="white" /> ) : (
                        <Text style={styles.saveButtonText}>Guardar</Text> )}
                </TouchableOpacity>
            </View>

            {/* Formulario */}
            <ScrollView style={styles.form} contentContainerStyle={styles.formContent} >
                {/* Cliente (Solo Lectura) */}
                <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Cliente Asociado</Text>
                    <Text style={styles.displayInput}>{clienteNombre}</Text> 
                </View>

                {/* Nombre del Lote */}
                <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Nombre del Lote</Text>
                    <TextInput style={styles.input} value={nombreLote} onChangeText={setNombreLote} />
                </View>

                {/* Superficie (ha) */}
                <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Superficie (ha)</Text>
                    <TextInput style={styles.input} value={superficie} onChangeText={setSuperficie} keyboardType="numeric" />
                </View>
                
                {/* Cultivo */}
                <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Cultivo / Diagnóstico</Text>
                    <TextInput style={styles.input} value={cultivo} onChangeText={setCultivo} />
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
                    <TextInput style={[styles.input, styles.textArea]} value={comentarios} onChangeText={setComentarios} multiline />
                </View>
                
                <Text style={styles.helperText}>* Campos obligatorios</Text>

                {/* Pendiente: Botón Eliminar */}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
    loadingText: { marginTop: 12, fontSize: 16, color: '#666' },

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
    headerButton: { paddingVertical: 8, paddingHorizontal: 12, minWidth: 80 },
    headerButtonText: { color: 'white', fontSize: 16, fontWeight: '500' },
    saveButton: { alignItems: 'flex-end' },
    saveButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    headerTitle: { color: 'white', fontSize: 20, fontWeight: 'bold', flex: 1, textAlign: 'center' },

    // Formulario
    form: { flex: 1 },
    formContent: { padding: 20 },
    fieldContainer: { marginBottom: 20 },
    
    // Nuevos estilos de coordenadas
    coordContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        gap: 16,
    },
    halfField: {
        flex: 1,
    },
    
    label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
    required: { color: '#f44336' },
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
    // 🚀 ESTILO FALTANTE AGREGADO
    displayInput: { 
        backgroundColor: '#f0f0f0', 
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: '#666', 
        fontWeight: '600',
    },
    textArea: { minHeight: 80, paddingTop: 12 },
    helperText: { fontSize: 12, color: '#999', marginTop: 8, marginBottom: 24, fontStyle: 'italic' },
    
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