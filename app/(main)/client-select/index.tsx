// app/(main)/client-select/index.tsx

import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { supabase } from "../../../lib/supabase";

interface Cliente {
    id: string;
    nombre: string;
    empresa: string;
    establecimiento: string;
}

export default function ClientSelectorScreen() {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchClientes();
    }, []);

    const fetchClientes = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("clientes")
                .select("id, nombre, empresa, establecimiento")
                .order("nombre", { ascending: true });

            if (error) {
                console.error("Error:", error);
                Alert.alert("Error", "No se pudieron cargar los clientes");
            } else {
                setClientes(data || []);
            }
        } catch (err) {
            console.error("Error:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchClientes();
    };

    const normalizeText = (text: string) => {
        return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    };

    const filteredClientes = clientes.filter((cliente) => {
        const query = normalizeText(searchQuery);
        return (
            normalizeText(cliente.nombre).includes(query) ||
            normalizeText(cliente.empresa).includes(query)
        );
    });

    // 🚀 FUNCIÓN CLAVE: Devuelve el cliente seleccionado
    const handleClientSelect = (cliente: Cliente) => {
        // 🚀 SOLUCIÓN:
        // No usamos router.back().
        // Navegamos explícitamente al formulario pasándole los datos en la URL.
        router.navigate({
            pathname: "/(main)/lot-create/new",
            params: { 
                clienteId: cliente.id, 
                clienteNombre: cliente.nombre 
            },
        });
    };

    const renderCliente = ({ item }: { item: Cliente }) => (
        <TouchableOpacity
            style={styles.clienteItem}
            onPress={() => handleClientSelect(item)}
            activeOpacity={0.7}
        >
            <View style={styles.clienteContent}>
                <Text style={styles.clienteNombre}>{item.nombre}</Text>
                <Text style={styles.clienteEmpresa}>{item.empresa}</Text>
                {item.establecimiento && (
                    <Text style={styles.clienteEstablecimiento}>Est.: {item.establecimiento}</Text>
                )}
            </View>
            <Text style={styles.chevron}>Seleccionar ›</Text>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#4caf50" />
                <Text style={styles.loadingText}>Cargando clientes...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Text style={styles.backButtonText}>‹ Atrás</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Seleccionar Cliente</Text>
                <Text style={styles.headerAction} onPress={() => router.push('/(main)/clients/new')}>
                    + Nuevo
                </Text>
            </View>

            {/* Buscador */}
            <View style={styles.searchContainer}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Buscar cliente..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoCapitalize="none"
                    autoCorrect={false}
                />
            </View>

            {/* Lista */}
            {clientes.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>👥</Text>
                    <Text style={styles.emptyText}>No hay clientes</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredClientes}
                    renderItem={renderCliente}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={["#4caf50"]}
                        />
                    }
                />
            )}
        </View>
    );
}

// ----------------------------------------------------
// Estilos (Reutilizando el tema verde de AgroReceta)
// ----------------------------------------------------
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f5f5f5" },
    centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
    loadingText: { marginTop: 12, fontSize: 16, color: "#666" },
    
    // Header
    header: {
        backgroundColor: "#4caf50",
        paddingTop: 50,
        paddingBottom: 16,
        paddingHorizontal: 20,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    backButton: { padding: 8 },
    backButtonText: { color: "white", fontSize: 16, fontWeight: "500" },
    headerTitle: { color: "white", fontSize: 20, fontWeight: "bold", flex: 1, textAlign: "center" },
    headerAction: { color: "white", fontSize: 14, fontWeight: "600", padding: 8, minWidth: 60, textAlign: 'right' },

    // Buscador
    searchContainer: {
        backgroundColor: 'white',
        flexDirection: 'row',
        alignItems: 'center',
        margin: 12,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        elevation: 1,
    },
    searchIcon: { fontSize: 18, marginRight: 8 },
    searchInput: { flex: 1, fontSize: 16, color: '#333' },

    // Lista
    listContent: { padding: 12 },
    clienteItem: {
        backgroundColor: "white",
        marginBottom: 8,
        borderRadius: 10,
        padding: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        elevation: 1,
    },
    clienteContent: { flex: 1 },
    clienteNombre: { fontSize: 16, fontWeight: "bold", color: "#1b5e20" },
    clienteEmpresa: { fontSize: 13, color: "#666" },
    clienteEstablecimiento: { fontSize: 13, color: "#888", fontStyle: 'italic' },
    chevron: { fontSize: 14, color: "#4caf50", fontWeight: 'bold', marginLeft: 10 },
    
    // Empty State
    emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
    emptyIcon: { fontSize: 64, marginBottom: 16, opacity: 0.3 },
    emptyText: { fontSize: 18, fontWeight: "600", color: "#666" },
});