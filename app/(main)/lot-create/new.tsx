// app/(main)/lot-create/new.tsx

import { useFocusEffect } from '@react-navigation/native';
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
import { supabase } from '../../../lib/supabase';

interface Cliente {
    id: string;
    nombre: string;
    empresa: string;
}

export default function NewLotScreen() {
    // 1. ESTADOS
    const { clienteId: urlClienteId, clienteNombre: urlClienteNombre } = useLocalSearchParams() as { 
        clienteId: string | undefined; 
        clienteNombre: string | undefined; 
    };

    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [clienteSeleccionadoId, setClienteSeleccionadoId] = useState<string | null>(null);
    const [clienteSeleccionadoNombre, setClienteSeleccionadoNombre] = useState<string | null>(null);
    
    const [nombreLote, setNombreLote] = useState('');
    const [superficie, setSuperficie] = useState('');
    const [latitud, setLatitud] = useState('');
    const [longitud, setLongitud] = useState('');
    const [cultivo, setCultivo] = useState('');
    const [comentarios, setComentarios] = useState('');

    const [loading, setLoading] = useState(false);
    const [fetchingClientes, setFetchingClientes] = useState(true);

    // 2. EFECTO: Capturar datos del selector
    useFocusEffect(
        React.useCallback(() => {
            if (urlClienteId && urlClienteNombre) {
                setClienteSeleccionadoId(urlClienteId);
                setClienteSeleccionadoNombre(urlClienteNombre);
                // Limpiamos params para evitar re-lecturas
                router.setParams({ clienteId: undefined, clienteNombre: undefined });
            }
        }, [urlClienteId, urlClienteNombre])
    );
    
    // 3. CARGA INICIAL
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
                Alert.alert('Error', 'No se pudieron cargar los clientes.');
            } else {
                setClientes(data || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setFetchingClientes(false);
        }
    };

    const handleOpenClientSelector = () => {
        router.push({ pathname: "/(main)/client-select" });
    };

    // 4. GUARDAR (CON LA SOLUCIÓN DEL HISTORIAL)
    const handleSave = async () => {
        if (!clienteSeleccionadoId || !nombreLote.trim() || !superficie || isNaN(parseFloat(superficie))) {
            Alert.alert('Error', 'Cliente, Nombre y Superficie son obligatorios.');
            return;
        }

        try {
            setLoading(true);
            const { error } = await supabase
                .from('lotes')
                .insert([{
                    cliente_id: clienteSeleccionadoId,
                    nombre_lote: nombreLote.trim(),
                    superficie_ha: parseFloat(superficie),
                    latitud: latitud ? parseFloat(latitud) : null,
                    longitud: longitud ? parseFloat(longitud) : null,
                    cultivo: cultivo.trim() || null,
                    comentarios: comentarios.trim() || null,
                }]);

            if (error) {
                Alert.alert('Error', error.message);
            } else {
                Alert.alert('✅ Lote Guardado', `${nombreLote} creado exitosamente.`, [
                    { 
                        text: 'OK', 
                        onPress: () => {
                            // 🚀 LA SOLUCIÓN NUCLEAR:
                            // 1. dismissAll() borra todo el historial y te lleva al Inicio (Home).
                            // 2. push() te lleva a la lista de lotes limpia.
                            // Resultado: Al dar "Atrás" desde la lista, vas al Home.
                            router.dismissAll();
                            setTimeout(() => {
                                router.push('/(main)/lots');
                            }, 100); 
                        } 
                    },
                ]);
            }
        } catch (err) {
            Alert.alert('Error', 'Ocurrió un error inesperado.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => router.back();
    
    const clienteNombreDisplay = clienteSeleccionadoNombre || 'Seleccionar Cliente';

    // Renders de Carga y Vacío
    if (fetchingClientes) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4caf50" />
                <Text style={styles.loadingText}>Preparando...</Text>
            </View>
        );
    }
    
    if (clientes.length === 0) {
         return (
            <View style={styles.loadingContainer}>
                <Text style={[styles.loadingText, { color: '#f44336' }]}>⚠️ Sin Clientes</Text>
                <Text style={styles.emptySubtext}>Necesitas clientes para crear lotes.</Text>
                <TouchableOpacity onPress={() => router.push('/(main)/clients/new')} style={styles.createClientButton}>
                    <Text style={styles.createClientButtonText}>Crear Cliente</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // RENDER PRINCIPAL
    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerButton} onPress={handleCancel}>
                    <Text style={styles.headerButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Nuevo Lote</Text>
                <TouchableOpacity style={[styles.headerButton, styles.saveButton]} onPress={handleSave} disabled={loading}>
                    {loading ? <ActivityIndicator size="small" color="white" /> : <Text style={styles.saveButtonText}>Guardar</Text>}
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.form} contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
                {/* Cliente */}
                <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Cliente <Text style={styles.required}>*</Text></Text>
                    <TouchableOpacity style={styles.pickerInput} onPress={handleOpenClientSelector}>
                        <Text style={[styles.pickerText, !clienteSeleccionadoId && { color: '#999' }]}>{clienteNombreDisplay}</Text>
                        <Text style={styles.pickerIcon}>▼</Text>
                    </TouchableOpacity>
                </View>

                {/* Nombre */}
                <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Nombre del Lote <Text style={styles.required}>*</Text></Text>
                    <TextInput style={styles.input} placeholder="Ej: Lote 15, El Bajo" value={nombreLote} onChangeText={setNombreLote} autoCapitalize="words"/>
                </View>
                
                {/* Superficie */}
                <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Superficie (ha) <Text style={styles.required}>*</Text></Text>
                    <TextInput style={styles.input} placeholder="Ej: 49.00" value={superficie} onChangeText={setSuperficie} keyboardType="numeric"/>
                </View>
                
                {/* Cultivo */}
                <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Cultivo / Diagnóstico</Text>
                    <TextInput style={styles.input} placeholder="Ej: Trigo, Maíz..." value={cultivo} onChangeText={setCultivo} autoCapitalize="words"/>
                </View>

                {/* Coordenadas */}
                <View style={styles.coordContainer}>
                    <View style={styles.halfField}>
                        <Text style={styles.label}>Latitud</Text>
                        <TextInput style={styles.input} placeholder="-28.xxx" value={latitud} onChangeText={setLatitud} keyboardType="numeric"/>
                    </View>
                    <View style={styles.halfField}>
                        <Text style={styles.label}>Longitud</Text>
                        <TextInput style={styles.input} placeholder="-62.xxx" value={longitud} onChangeText={setLongitud} keyboardType="numeric"/>
                    </View>
                </View>

                {/* Comentarios */}
                <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Comentarios</Text>
                    <TextInput style={[styles.input, styles.textArea]} placeholder="Notas adicionales..." value={comentarios} onChangeText={setComentarios} multiline numberOfLines={3} textAlignVertical="top"/>
                </View>
                
                <Text style={styles.helperText}>* Campos obligatorios</Text>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5', padding: 20 },
    loadingText: { marginTop: 12, fontSize: 18, fontWeight: '600', color: '#666' },
    emptySubtext: { fontSize: 14, color: '#999', textAlign: 'center', marginTop: 8 },
    createClientButton: { marginTop: 20, backgroundColor: '#1b5e20', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8 },
    createClientButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    header: { backgroundColor: '#4caf50', paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', elevation: 4 },
    headerButton: { paddingVertical: 8, paddingHorizontal: 12, minWidth: 80 },
    headerButtonText: { color: 'white', fontSize: 16, fontWeight: '500' },
    saveButton: { alignItems: 'flex-end' },
    saveButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    headerTitle: { color: 'white', fontSize: 20, fontWeight: 'bold', flex: 1, textAlign: 'center' },
    form: { flex: 1 },
    formContent: { padding: 20 },
    fieldContainer: { marginBottom: 20 },
    coordContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, gap: 16 },
    halfField: { flex: 1 },
    label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
    required: { color: '#f44336' },
    input: { backgroundColor: 'white', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#333' },
    pickerInput: { backgroundColor: 'white', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    pickerText: { fontSize: 16, color: '#333' },
    pickerIcon: { fontSize: 14, color: '#999' },
    textArea: { minHeight: 80, paddingTop: 12 },
    helperText: { fontSize: 12, color: '#999', marginTop: 8, fontStyle: 'italic' },
});