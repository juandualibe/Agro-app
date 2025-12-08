import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator, FlatList, RefreshControl, StyleSheet,
    Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { supabase } from '../../../lib/supabase';

interface Producto {
    id: string;
    nombre: string;
    composicion: string;
    marca: string;
    unidad_medida: string;
    tipo: string;
}

export default function ProductsListScreen() {
    const [productos, setProductos] = useState<Producto[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useFocusEffect(
        React.useCallback(() => {
            fetchProductos();
        }, [])
    );

    const fetchProductos = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('productos')
                .select('*')
                .eq('activo', true) // Solo activos
                .order('nombre', { ascending: true });

            if (error) throw error;
            setProductos(data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const filteredParams = productos.filter(p => 
        p.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.composicion && p.composicion.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const renderItem = ({ item }: { item: Producto }) => (
        // 🚀 AHORA ES TOUCHABLE Y LLEVA AL DETALLE
        <TouchableOpacity 
            style={styles.card} 
            onPress={() => router.push({ pathname: '/(main)/products/[id]', params: { id: item.id } })}
        >
            <View style={styles.cardHeader}>
                <Text style={styles.name}>{item.nombre}</Text>
                <Text style={styles.badge}>{item.tipo || 'Insumo'}</Text>
            </View>
            <Text style={styles.composicion}>{item.composicion}</Text>
            <View style={styles.cardFooter}>
                <Text style={styles.brand}>{item.marca || 'Genérico'}</Text>
                <Text style={styles.unit}>Unidad: {item.unidad_medida}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Text style={styles.backText}>‹ Volver</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Catálogo de Productos</Text>
                <View style={{width: 60}} />
            </View>

            <View style={styles.searchBox}>
                <Text>🔍</Text>
                <TextInput 
                    style={styles.input} 
                    placeholder="Buscar producto..." 
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {loading ? <ActivityIndicator size="large" color="#4caf50" style={{marginTop: 20}} /> : (
                <FlatList
                    data={filteredParams}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchProductos} colors={['#4caf50']}/>}
                    ListEmptyComponent={<Text style={styles.empty}>No hay productos cargados.</Text>}
                />
            )}

            <TouchableOpacity style={styles.fab} onPress={() => router.push('/(main)/products/new')}>
                <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    header: { backgroundColor: '#4caf50', paddingTop: 50, paddingBottom: 15, paddingHorizontal: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    title: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    backBtn: { padding: 5 },
    backText: { color: 'white', fontSize: 16 },
    
    searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', margin: 15, paddingHorizontal: 15, borderRadius: 8, elevation: 2 },
    input: { flex: 1, paddingVertical: 12, paddingHorizontal: 10, fontSize: 16 },
    
    list: { paddingHorizontal: 15, paddingBottom: 80 },
    card: { backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 10, elevation: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
    name: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    badge: { fontSize: 10, backgroundColor: '#e8f5e9', color: '#2e7d32', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, overflow: 'hidden', fontWeight: 'bold' },
    composicion: { fontSize: 14, color: '#666', fontStyle: 'italic', marginBottom: 10 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 8 },
    brand: { fontSize: 12, color: '#888', fontWeight: 'bold' },
    unit: { fontSize: 12, color: '#888' },

    empty: { textAlign: 'center', marginTop: 50, color: '#999' },
    
    fab: { position: 'absolute', bottom: 20, right: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: '#4caf50', justifyContent: 'center', alignItems: 'center', elevation: 5 },
    fabText: { color: 'white', fontSize: 30, fontWeight: 'bold', marginTop: -2 }
});