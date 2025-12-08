// app/(main)/recipes/list.tsx

import { router, useFocusEffect } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator, FlatList, RefreshControl, StyleSheet,
    Text, TouchableOpacity, View
} from 'react-native';
import { supabase } from '../../../lib/supabase';

interface RecetaResumen {
    id: string;
    numero_receta: number;
    fecha_emision: string;
    cliente: { nombre: string; empresa: string } | null; // Join con clientes
    estado: string;
}

export default function RecipeListScreen() {
    const [recetas, setRecetas] = useState<RecetaResumen[]>([]);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        React.useCallback(() => {
            fetchRecetas();
        }, [])
    );

    const fetchRecetas = async () => {
        try {
            setLoading(true);
            // Traemos recetas y el nombre del cliente asociado
            const { data, error } = await supabase
                .from('recetas')
                .select(`
                    id, 
                    numero_receta, 
                    fecha_emision, 
                    estado,
                    cliente:clientes (nombre, empresa)
                `)
                .order('created_at', { ascending: false }); // Las nuevas primero

            if (error) throw error;
            
            // Mapeamos para ajustar la estructura si es necesario
            const formattedData = data?.map((item: any) => ({
                id: item.id,
                numero_receta: item.numero_receta,
                fecha_emision: item.fecha_emision,
                cliente: item.cliente, // Supabase devuelve el objeto join acá
                estado: item.estado
            })) || [];

            setRecetas(formattedData);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handlePressReceta = (id: string) => {
        // Aquí iremos al detalle (donde se hace el PDF)
        router.push({
            pathname: '/(main)/recipes/[id]',
            params: { id }
        });
    };

    const renderItem = ({ item }: { item: RecetaResumen }) => (
        <TouchableOpacity style={styles.card} onPress={() => handlePressReceta(item.id)}>
            <View style={styles.cardHeader}>
                <Text style={styles.recetaNum}>Receta #{item.numero_receta}</Text>
                <Text style={styles.date}>{new Date(item.fecha_emision).toLocaleDateString()}</Text>
            </View>
            <View style={styles.cardBody}>
                <Text style={styles.clientName}>{item.cliente?.nombre || 'Cliente Desconocido'}</Text>
                <Text style={styles.clientCompany}>{item.cliente?.empresa}</Text>
            </View>
            <View style={styles.cardFooter}>
                <Text style={[
                    styles.statusBadge, 
                    item.estado === 'Cerrada' ? styles.statusClosed : styles.statusOpen
                ]}>
                    {item.estado || 'Abierta'}
                </Text>
                <Text style={styles.chevron}>Ver Detalle ›</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Text style={styles.backText}>‹ Volver</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Historial de Recetas</Text>
                <View style={{width: 60}}/> 
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#4caf50" style={{marginTop: 50}} />
            ) : (
                <FlatList
                    data={recetas}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchRecetas} colors={['#4caf50']}/>}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Text style={styles.emptyText}>No hay recetas emitidas aún.</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    header: { backgroundColor: '#4caf50', paddingTop: 50, paddingBottom: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15 },
    backBtn: { padding: 5 },
    backText: { color: 'white', fontSize: 16 },
    title: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    
    list: { padding: 15 },
    card: { backgroundColor: 'white', borderRadius: 10, padding: 15, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: {width:0, height:1} },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    recetaNum: { fontWeight: 'bold', fontSize: 16, color: '#333' },
    date: { color: '#888', fontSize: 14 },
    cardBody: { marginBottom: 10 },
    clientName: { fontSize: 16, color: '#2e7d32', fontWeight: '600' },
    clientCompany: { fontSize: 14, color: '#666' },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 10 },
    statusBadge: { fontSize: 12, fontWeight: 'bold', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, overflow: 'hidden' },
    statusOpen: { backgroundColor: '#e8f5e9', color: '#2e7d32' }, // Verde claro
    statusClosed: { backgroundColor: '#ffebee', color: '#c62828' }, // Rojo claro
    chevron: { color: '#4caf50', fontWeight: 'bold' },
    
    empty: { alignItems: 'center', marginTop: 50 },
    emptyText: { color: '#999', fontSize: 16 }
});