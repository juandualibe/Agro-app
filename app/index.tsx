// app/index.tsx

import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';

export default function HomeScreen() {
    const [clientes, setClientes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // 📡 Traer clientes de Supabase
    useEffect(() => {
        fetchClientes();
    }, []);

    const fetchClientes = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('clientes')
                .select('*');

            if (error) {
                console.error('Error fetching clientes:', error);
                Alert.alert('Error', 'No se pudieron cargar los clientes');
            } else {
                setClientes(data || []);
                console.log('Clientes cargados:', data);
            }
        } catch (err) {
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleNewRecipe = () => {
        Alert.alert('🎉 Nueva Receta', '¡Proximamente podrás crear recetas!');
    };

    const handleViewRecipes = () => {
        Alert.alert('📋 Ver Recetas', 'Aquí verás el historial de recetas');
    };

    const handleClients = () => {
    // 🚀 CORRECCIÓN DEFINITIVA: Omitimos /index.
    // La ruta al módulo principal debe ser la carpeta (o la carpeta del grupo).
    router.push('/(main)/clients'); 
};

    const handleLots = () => {
        Alert.alert('🗺️ Lotes', 'Gestión de lotes próximamente');
    };

    const handleProducts = () => {
        Alert.alert('📦 Productos', 'Catálogo de productos fitosanitarios');
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.header}>
                <Text style={styles.logo}>🌾</Text>
                <Text style={styles.title}>AgroReceta</Text>
                <Text style={styles.subtitle}>Recetas Fitosanitarias Profesionales</Text>

                {loading ? (
                    <ActivityIndicator size="small" color="#4caf50" style={{ marginTop: 10 }} />
                ) : (
                    <Text style={styles.dbStatus}>
                        ✅ Conectado a Supabase ({clientes.length} clientes)
                    </Text>
                )}
            </View>

            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.primaryButton} onPress={handleNewRecipe}>
                    <Text style={styles.buttonIcon}>📝</Text>
                    <Text style={styles.primaryButtonText}>Nueva Receta</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.secondaryButton} onPress={handleViewRecipes}>
                    <Text style={styles.buttonIcon}>📋</Text>
                    <Text style={styles.secondaryButtonText}>Ver Recetas</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.secondaryButton} onPress={handleClients}>
                    <Text style={styles.buttonIcon}>👥</Text>
                    <Text style={styles.secondaryButtonText}>Clientes</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.secondaryButton} onPress={handleLots}>
                    <Text style={styles.buttonIcon}>🗺️</Text>
                    <Text style={styles.secondaryButtonText}>Lotes</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.secondaryButton} onPress={handleProducts}>
                    <Text style={styles.buttonIcon}>📦</Text>
                    <Text style={styles.secondaryButtonText}>Productos</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.footer}>
                <Text style={styles.version}>v1.0.0 - Beta</Text>
                <Text style={styles.author}>Desarrollado por Juan Dualibe</Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: '#e8f5e9',
        alignItems: 'center',
        paddingVertical: 40,
        paddingHorizontal: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
        marginTop: 20,
    },
    logo: {
        fontSize: 64,
        marginBottom: 10,
    },
    title: {
        fontSize: 40,
        fontWeight: 'bold',
        color: '#1b5e20',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#558b2f',
        textAlign: 'center',
        paddingHorizontal: 30,
    },
    dbStatus: {
        fontSize: 12,
        color: '#2e7d32',
        marginTop: 10,
        fontWeight: '600',
    },
    buttonContainer: {
        width: '100%',
        maxWidth: 400,
        gap: 12,
    },
    primaryButton: {
        backgroundColor: '#4caf50',
        paddingVertical: 20,
        paddingHorizontal: 30,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    primaryButtonText: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    secondaryButton: {
        backgroundColor: 'white',
        paddingVertical: 16,
        paddingHorizontal: 30,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#4caf50',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    secondaryButtonText: {
        color: '#2d5016',
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 10,
    },
    buttonIcon: {
        fontSize: 24,
    },
    footer: {
        marginTop: 50,
        alignItems: 'center',
    },
    version: {
        color: '#888',
        fontSize: 12,
        marginBottom: 4,
    },
    author: {
        color: '#666',
        fontSize: 12,
    },
});