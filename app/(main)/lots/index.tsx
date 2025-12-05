// app/(main)/lots/index.tsx

import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useState } from "react";
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
// Ruta de importación de supabase (sube tres niveles)
import { supabase } from "../../../lib/supabase";

interface Lote {
    id: string;
    cliente_id: string;
    clientes: { nombre: string; empresa: string } | null; 
    nombre_lote: string;
    superficie_ha: number;
    latitud: number | null;
    longitud: number | null;
    cultivo: string | null;
    created_at: string;
}

export default function LotsScreen() {
    const [lotes, setLotes] = useState<Lote[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useFocusEffect(
        React.useCallback(() => {
            fetchLotes();
        }, [])
    );

    const fetchLotes = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("lotes")
                .select("*, clientes(nombre, empresa)")
                .order("nombre_lote", { ascending: true });

            if (error) {
                console.error("Error fetching lotes:", error);
                Alert.alert("Error", "No se pudieron cargar los lotes");
            } else {
                setLotes(data as Lote[] || []);
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
        fetchLotes();
    };

    const normalizeText = (text: string) => {
        if (!text) return '';
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    };

    const filteredLotes = lotes.filter((lote: any) => {
        const query = normalizeText(searchQuery);
        const clienteNombre = lote.clientes?.nombre || '';
        return (
            normalizeText(lote.nombre_lote).includes(query) ||
            normalizeText(clienteNombre).includes(query) ||
            (lote.cultivo && normalizeText(lote.cultivo).includes(query))
        );
    });

    const handleLotPress = (lote: Lote) => {
        // Navegación a la pantalla de edición de lotes (ruta aislada)
        router.push({
            pathname: "/lot-detail/[id]",
            params: { id: lote.id },
        });
    };

    const renderLote = ({ item }: { item: Lote }) => (
        <TouchableOpacity
            style={styles.loteItem}
            onPress={() => handleLotPress(item)}
            activeOpacity={0.7}
        >
            <View style={styles.loteContent}>
                <View style={styles.loteMain}>
                    <Text style={styles.loteNombre}>{item.nombre_lote} ({item.superficie_ha.toFixed(2)} ha)</Text>
                    <Text style={styles.loteCliente}>Empresa: {item.clientes?.empresa || 'N/A'}</Text>
                </View>
                <View style={styles.loteDetails}>
                    {item.cultivo && (
                        <View style={styles.detailRow}>
                            <Text style={styles.detailIcon}>🌱</Text>
                            <Text style={styles.detailText}>Cultivo: {item.cultivo}</Text>
                        </View>
                    )}
                    {(item.latitud && item.longitud) && (
                        <View style={styles.detailRow}>
                            <Text style={styles.detailIcon}>🗺️</Text>
                            <Text style={styles.detailText}>Coordenadas</Text>
                        </View>
                    )}
                </View>
            </View>
            <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#4caf50" />
                <Text style={styles.loadingText}>Cargando lotes...</Text>
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
                <Text style={styles.headerTitle}>Lotes (Campos)</Text>
                <View style={styles.headerRight}>
                    <Text style={styles.loteCount}>{lotes.length}</Text>
                </View>
            </View>

            {/* Buscador */}
            {lotes.length > 0 && (
                <View style={styles.searchContainer}>
                    <Text style={styles.searchIcon}>🔍</Text>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar por lote, cliente o cultivo..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                     {searchQuery.length > 0 && (
                        <TouchableOpacity
                            onPress={() => setSearchQuery("")}
                            style={styles.clearButton}
                        >
                            <Text style={styles.clearButtonText}>✕</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {/* Lista */}
            {lotes.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>🗺️</Text>
                    <Text style={styles.emptyText}>No hay lotes registrados</Text>
                    <Text style={styles.emptySubtext}>
                        Tocá el botón "+" para agregar el primero
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filteredLotes}
                    renderItem={renderLote}
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

            {/* Botón Flotante */}
            <TouchableOpacity
                style={styles.fab}
                // 🚀 CORRECCIÓN DEL FAB: Usamos la ruta lógica más corta para 'new'.
                onPress={() => router.push("/lot-create/new")}
                activeOpacity={0.8}
            >
                <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>
        </View>
    );
}

// *** Estilos (usamos los estilos existentes de Clientes, solo renombramos para claridad) ***
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f5f5",
    },
    centerContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f5f5f5",
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: "#666",
    },

    // Header (Ajustado para LOTES)
    header: {
        backgroundColor: "#4caf50",
        paddingTop: 50,
        paddingBottom: 16,
        paddingHorizontal: 20,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    backButton: {
        padding: 8,
    },
    backButtonText: {
        color: "white",
        fontSize: 24,
        fontWeight: "600",
    },
    headerTitle: {
        color: "white",
        fontSize: 22,
        fontWeight: "bold",
        flex: 1,
        textAlign: "center",
    },
    headerRight: {
        backgroundColor: "rgba(255,255,255,0.3)",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    loteCount: {
        color: "white",
        fontSize: 14,
        fontWeight: "bold",
    },

    // Lista 
    listContent: {
        padding: 12,
    },
    loteItem: {
        backgroundColor: "white",
        marginBottom: 8,
        borderRadius: 12,
        padding: 16,
        flexDirection: "row",
        alignItems: "center",
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    loteContent: {
        flex: 1,
    },
    loteMain: {
        marginBottom: 8,
    },
    loteNombre: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#1b5e20",
        marginBottom: 2,
    },
    loteCliente: {
        fontSize: 14,
        color: "#666",
        fontWeight: "500",
    },
    loteDetails: {
        gap: 4,
    },
    detailRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    detailIcon: {
        fontSize: 12,
        marginRight: 6,
    },
    detailText: {
        fontSize: 12,
        color: "#888",
    },
    chevron: {
        fontSize: 32,
        color: "#ccc",
        marginLeft: 8,
    },

    // Empty State
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 40,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 16,
        opacity: 0.3,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: "600",
        color: "#666",
        marginBottom: 8,
        textAlign: "center",
    },
    emptySubtext: {
        fontSize: 14,
        color: "#999",
        textAlign: "center",
    },

    // FAB (Floating Action Button)
    fab: {
        position: "absolute",
        bottom: 24,
        right: 24,
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: "#4caf50",
        justifyContent: "center",
        alignItems: "center",
        elevation: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
    },
    fabText: {
        color: "white",
        fontSize: 32,
        fontWeight: "300",
    },
    searchContainer: {
        backgroundColor: 'white',
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 12,
        marginTop: 12,
        marginBottom: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    searchIcon: { 
        fontSize: 18,
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    clearButton: {
        padding: 4,
    },
    clearButtonText: {
        fontSize: 20,
        color: '#999',
    },
});