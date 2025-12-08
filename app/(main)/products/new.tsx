import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet,
    Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { supabase } from '../../../lib/supabase';

export default function NewProductScreen() {
    const [nombre, setNombre] = useState('');
    const [marca, setMarca] = useState('');
    const [composicion, setComposicion] = useState('');
    const [tipo, setTipo] = useState(''); // Herbicida, Insecticida...
    const [unidad, setUnidad] = useState('lts'); // Default lts
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!nombre.trim()) return Alert.alert("Error", "El nombre es obligatorio");

        setLoading(true);
        try {
            const { error } = await supabase.from('productos').insert({
                nombre: nombre.trim(),
                marca: marca.trim() || null,
                composicion: composicion.trim() || null,
                tipo: tipo.trim() || null,
                unidad_medida: unidad.trim(),
                activo: true
            });

            if (error) throw error;

            Alert.alert("✅ Producto Creado", "Se agregó al catálogo.", [
                { text: "OK", onPress: () => router.back() }
            ]);
        } catch (error: any) {
            Alert.alert("Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}><Text style={styles.headerBtn}>Cancelar</Text></TouchableOpacity>
                <Text style={styles.headerTitle}>Nuevo Producto</Text>
                <TouchableOpacity onPress={handleSave} disabled={loading}>
                    {loading ? <ActivityIndicator color="white"/> : <Text style={styles.headerBtnBold}>Guardar</Text>}
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.form}>
                <Text style={styles.label}>Nombre Comercial *</Text>
                <TextInput style={styles.input} placeholder="Ej: Glifosato Premium" value={nombre} onChangeText={setNombre} />

                <Text style={styles.label}>Marca / Laboratorio</Text>
                <TextInput style={styles.input} placeholder="Ej: Bayer, Syngenta..." value={marca} onChangeText={setMarca} />

                <Text style={styles.label}>Composición / Principio Activo</Text>
                <TextInput style={styles.input} placeholder="Ej: Glifosato 64%" value={composicion} onChangeText={setComposicion} />

                <View style={styles.row}>
                    <View style={{flex: 1, marginRight: 10}}>
                        <Text style={styles.label}>Tipo</Text>
                        <TextInput style={styles.input} placeholder="Ej: Herbicida" value={tipo} onChangeText={setTipo} />
                    </View>
                    <View style={{flex: 1}}>
                        <Text style={styles.label}>Unidad de Medida</Text>
                        <TextInput style={styles.input} placeholder="Ej: lts, kg, cc" value={unidad} onChangeText={setUnidad} autoCapitalize="none" />
                    </View>
                </View>

                <Text style={styles.hint}>* El precio se carga al momento de emitir receta o actualizar costos.</Text>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    header: { backgroundColor: '#4caf50', paddingTop: 50, paddingBottom: 15, paddingHorizontal: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    headerBtn: { color: 'white', fontSize: 16 },
    headerBtnBold: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    
    form: { padding: 20 },
    label: { fontSize: 14, fontWeight: 'bold', color: '#333', marginTop: 15, marginBottom: 5 },
    input: { backgroundColor: 'white', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16 },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    hint: { marginTop: 20, color: '#888', fontStyle: 'italic', fontSize: 12 }
});