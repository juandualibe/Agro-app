// app/(main)/product-select/index.tsx

import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { supabase } from "../../../lib/supabase";

interface Producto {
    id: string;
    nombre: string;
    composicion: string;
    unidad_medida: string;
    marca: string;
}

export default function ProductSelectorScreen() {
    const [productos, setProductos] = useState<Producto[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => { fetchProductos(); }, []);

    const fetchProductos = async () => {
        try {
            const { data, error } = await supabase
                .from("productos")
                .select("*")
                .eq('activo', true) // Solo traemos los activos
                .order("nombre", { ascending: true });

            if (error) throw error;
            setProductos(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (prod: Producto) => {
        // 🚀 TRUCO: Navegamos hacia la receta (que ya está abierta en el historial)
        // pasándole los datos del producto nuevo como parámetros.
        router.navigate({
            pathname: "/(main)/recipes/new",
            params: { 
                selectedProductId: prod.id, 
                selectedProductName: prod.nombre,
                selectedProductUnit: prod.unidad_medida 
            }
        });
    };

    // Filtro simple local
    const filtered = productos.filter(p => 
        p.nombre.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (p.composicion && p.composicion.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}><Text style={styles.backText}>Cancelar</Text></TouchableOpacity>
                <Text style={styles.title}>Seleccionar Producto</Text>
                <View style={{width: 60}} />
            </View>
            
            <View style={styles.searchBox}>
                <TextInput 
                    placeholder="Buscar por nombre o principio activo..." 
                    style={styles.input} 
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {loading ? <ActivityIndicator size="large" color="#4caf50" style={{marginTop: 20}} /> : (
                <FlatList
                    data={filtered}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => (
                        <TouchableOpacity style={styles.item} onPress={() => handleSelect(item)}>
                            <View>
                                <Text style={styles.itemName}>{item.nombre}</Text>
                                <Text style={styles.itemSub}>{item.composicion} • {item.marca}</Text>
                            </View>
                            <Text style={styles.chevron}>+</Text>
                        </TouchableOpacity>
                    )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    header: { backgroundColor: '#4caf50', paddingTop: 50, padding: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    title: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    backText: { color: 'white', fontSize: 16 },
    searchBox: { padding: 10, backgroundColor: 'white' },
    input: { backgroundColor: '#f0f0f0', padding: 10, borderRadius: 8, fontSize: 16 },
    item: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee', backgroundColor: 'white', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    itemName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    itemSub: { fontSize: 12, color: '#666', marginTop: 2 },
    chevron: { fontSize: 24, color: '#4caf50', fontWeight: 'bold' }
});