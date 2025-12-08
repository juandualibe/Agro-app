// app/(main)/client-select/index.tsx

import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { supabase } from "../../../lib/supabase";

interface Cliente {
    id: string;
    nombre: string;
    empresa: string;
    establecimiento: string;
}

export default function ClientSelectorScreen() {
    // 🧠 RECIBIMOS EL DATO "returnTo" (A DÓNDE VOLVER)
    const { returnTo } = useLocalSearchParams<{ returnTo: string }>();

    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => { fetchClientes(); }, []);

    const fetchClientes = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("clientes")
                .select("id, nombre, empresa, establecimiento")
                .order("nombre", { ascending: true });

            if (error) throw error;
            setClientes(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const normalizeText = (text: string) => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    const filteredClientes = clientes.filter((cliente) => {
        const query = normalizeText(searchQuery);
        return (
            normalizeText(cliente.nombre).includes(query) ||
            normalizeText(cliente.empresa).includes(query)
        );
    });

    const handleClientSelect = (cliente: Cliente) => {
        // 🚀 AQUÍ ESTÁ LA MAGIA:
        // Si nos dijeron a dónde volver, volvemos ahí. Si no, volvemos atrás por defecto.
        const destino = returnTo || ".."; 
        
        router.navigate({
            pathname: destino as any,
            params: { 
                clienteId: cliente.id, 
                clienteNombre: cliente.nombre 
            },
        });
    };

    const renderCliente = ({ item }: { item: Cliente }) => (
        <TouchableOpacity style={styles.clienteItem} onPress={() => handleClientSelect(item)}>
            <View style={styles.clienteContent}>
                <Text style={styles.clienteNombre}>{item.nombre}</Text>
                <Text style={styles.clienteEmpresa}>{item.empresa}</Text>
                {item.establecimiento && <Text style={styles.clienteEstablecimiento}>{item.establecimiento}</Text>}
            </View>
            <Text style={styles.chevron}>Seleccionar ›</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Text style={styles.backButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Seleccionar Cliente</Text>
                <View style={{width: 60}} />
            </View>

            <View style={styles.searchContainer}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Buscar cliente..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {loading ? <ActivityIndicator size="large" color="#4caf50" style={{marginTop: 20}} /> : (
                <FlatList
                    data={filteredClientes}
                    renderItem={renderCliente}
                    keyExtractor={(item) => item.id}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchClientes} colors={["#4caf50"]} />}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f5f5f5" },
    header: { backgroundColor: "#4caf50", paddingTop: 50, paddingBottom: 16, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    backButton: { padding: 8 },
    backButtonText: { color: "white", fontSize: 16 },
    headerTitle: { color: "white", fontSize: 18, fontWeight: "bold" },
    searchContainer: { backgroundColor: 'white', flexDirection: 'row', alignItems: 'center', margin: 12, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
    searchIcon: { fontSize: 18, marginRight: 8 },
    searchInput: { flex: 1, fontSize: 16, color: '#333' },
    clienteItem: { backgroundColor: "white", marginBottom: 8, borderRadius: 10, padding: 16, flexDirection: "row", alignItems: "center", marginHorizontal: 12 },
    clienteContent: { flex: 1 },
    clienteNombre: { fontSize: 16, fontWeight: "bold", color: "#1b5e20" },
    clienteEmpresa: { fontSize: 13, color: "#666" },
    clienteEstablecimiento: { fontSize: 13, color: "#888", fontStyle: 'italic' },
    chevron: { fontSize: 14, color: "#4caf50", fontWeight: 'bold' },
});