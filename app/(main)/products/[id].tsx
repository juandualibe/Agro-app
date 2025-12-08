import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet,
    Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { supabase } from '../../../lib/supabase';

export default function EditProductScreen() {
    const { id } = useLocalSearchParams();
    
    const [nombre, setNombre] = useState('');
    const [marca, setMarca] = useState('');
    const [composicion, setComposicion] = useState('');
    const [tipo, setTipo] = useState('');
    const [unidad, setUnidad] = useState('');
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (id) fetchProducto();
    }, [id]);

    const fetchProducto = async () => {
        try {
            const { data, error } = await supabase.from('productos').select('*').eq('id', id).single();
            if (error) throw error;
            if (data) {
                setNombre(data.nombre);
                setMarca(data.marca || '');
                setComposicion(data.composicion || '');
                setTipo(data.tipo || '');
                setUnidad(data.unidad_medida || '');
            }
        } catch (error) {
            Alert.alert("Error", "No se pudo cargar el producto");
            router.back();
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async () => {
        if (!nombre.trim()) return Alert.alert("Error", "El nombre es obligatorio");
        setSaving(true);
        try {
            const { error } = await supabase
                .from('productos')
                .update({
                    nombre, marca, composicion, tipo, unidad_medida: unidad
                })
                .eq('id', id);

            if (error) throw error;
            Alert.alert("✅ Actualizado", "Producto modificado correctamente", [{ text: "OK", onPress: () => router.back() }]);
        } catch (error: any) {
            Alert.alert("Error", error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = () => {
        Alert.alert(
            "Eliminar Producto",
            "¿Estás seguro? Se archivará y no aparecerá en nuevas recetas, pero se mantendrá en el historial.",
            [
                { text: "Cancelar", style: "cancel" },
                { 
                    text: "Eliminar", 
                    style: "destructive", 
                    onPress: async () => {
                        // BORRADO LÓGICO (Más seguro para sistemas de gestión)
                        const { error } = await supabase.from('productos').update({ activo: false }).eq('id', id);
                        if (error) Alert.alert("Error", error.message);
                        else router.back();
                    }
                }
            ]
        );
    };

    if (loading) return <View style={styles.center}><ActivityIndicator color="#4caf50"/></View>;

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}><Text style={styles.headerBtn}>Cancelar</Text></TouchableOpacity>
                <Text style={styles.headerTitle}>Editar Producto</Text>
                <TouchableOpacity onPress={handleUpdate} disabled={saving}>
                    {saving ? <ActivityIndicator color="white"/> : <Text style={styles.headerBtnBold}>Guardar</Text>}
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.form}>
                <Text style={styles.label}>Nombre Comercial</Text>
                <TextInput style={styles.input} value={nombre} onChangeText={setNombre} />

                <Text style={styles.label}>Marca / Laboratorio</Text>
                <TextInput style={styles.input} value={marca} onChangeText={setMarca} />

                <Text style={styles.label}>Composición</Text>
                <TextInput style={styles.input} value={composicion} onChangeText={setComposicion} />

                <View style={styles.row}>
                    <View style={{flex: 1, marginRight: 10}}>
                        <Text style={styles.label}>Tipo</Text>
                        <TextInput style={styles.input} value={tipo} onChangeText={setTipo} />
                    </View>
                    <View style={{flex: 1}}>
                        <Text style={styles.label}>Unidad</Text>
                        <TextInput style={styles.input} value={unidad} onChangeText={setUnidad} />
                    </View>
                </View>

                {/* BOTÓN ELIMINAR */}
                <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
                    <Text style={styles.deleteText}>🗑️ Eliminar / Archivar Producto</Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { backgroundColor: '#4caf50', paddingTop: 50, paddingBottom: 15, paddingHorizontal: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    headerBtn: { color: 'white', fontSize: 16 },
    headerBtnBold: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    form: { padding: 20 },
    label: { fontSize: 14, fontWeight: 'bold', color: '#333', marginTop: 15, marginBottom: 5 },
    input: { backgroundColor: 'white', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16 },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    deleteBtn: { marginTop: 40, backgroundColor: '#ffebee', padding: 15, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#ffcdd2' },
    deleteText: { color: '#c62828', fontWeight: 'bold', fontSize: 16 }
});