// app/(main)/profile/index.tsx

import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet,
    Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { supabase } from '../../../lib/supabase';

export default function ProfileScreen() {
    const [nombre, setNombre] = useState('');
    const [matricula, setMatricula] = useState('');
    const [telefono, setTelefono] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [perfilId, setPerfilId] = useState<string | null>(null);

    useEffect(() => {
        fetchPerfil();
    }, []);

    const fetchPerfil = async () => {
        try {
            // Traemos el primer perfil que encontremos (el que creamos con SQL)
            const { data, error } = await supabase.from('perfiles').select('*').limit(1).single();
            
            if (data) {
                setNombre(data.nombre_completo || '');
                setMatricula(data.matricula || '');
                setTelefono(data.telefono || '');
                setPerfilId(data.id);
            }
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('perfiles')
                .update({
                    nombre_completo: nombre,
                    matricula: matricula,
                    telefono: telefono
                })
                .eq('id', perfilId); // Actualizamos ese ID único

            if (error) throw error;
            Alert.alert("✅ Datos Guardados", "Tus próximas recetas saldrán con esta firma.", [
                { text: "OK", onPress: () => router.back() }
            ]);
        } catch (error: any) {
            Alert.alert("Error", error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <View style={styles.center}><ActivityIndicator color="#4caf50" size="large"/></View>;

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}><Text style={styles.backText}>‹ Volver</Text></TouchableOpacity>
                <Text style={styles.title}>Mis Datos Profesionales</Text>
                <View style={{width: 60}}/>
            </View>

            <ScrollView contentContainerStyle={styles.form}>
                <View style={styles.card}>
                    <Text style={styles.info}>
                        Estos datos se usarán para firmar automáticamente las recetas y el PDF.
                    </Text>

                    <Text style={styles.label}>Nombre y Apellido (Ingeniero)</Text>
                    <TextInput style={styles.input} value={nombre} onChangeText={setNombre} placeholder="Ej: Ing. Juan Dualibe"/>

                    <Text style={styles.label}>Matrícula Profesional</Text>
                    <TextInput style={styles.input} value={matricula} onChangeText={setMatricula} placeholder="Ej: MP 12345"/>

                    <Text style={styles.label}>Teléfono de Contacto</Text>
                    <TextInput style={styles.input} value={telefono} onChangeText={setTelefono} keyboardType="phone-pad" placeholder="+54 9 ..."/>
                </View>

                <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
                    {saving ? <ActivityIndicator color="white"/> : <Text style={styles.saveText}>GUARDAR DATOS</Text>}
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { backgroundColor: '#4caf50', paddingTop: 50, paddingBottom: 15, paddingHorizontal: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    title: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    backText: { color: 'white', fontSize: 16 },
    form: { padding: 20 },
    card: { backgroundColor: 'white', padding: 20, borderRadius: 12, elevation: 2, marginBottom: 20 },
    info: { color: '#666', marginBottom: 20, fontSize: 14, textAlign: 'center', backgroundColor: '#e8f5e9', padding: 10, borderRadius: 8 },
    label: { fontWeight: 'bold', color: '#333', marginTop: 15, marginBottom: 5 },
    input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: '#fafafa' },
    saveButton: { backgroundColor: '#1b5e20', padding: 15, borderRadius: 12, alignItems: 'center' },
    saveText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});