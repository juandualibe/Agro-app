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
import { supabase } from "../lib/supabase";

interface Cliente {
  id: string;
  nombre: string;
  empresa: string;
  establecimiento: string;
  contacto: string;
  email: string;
  created_at: string;
}

export default function ClientsScreen() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useFocusEffect(
    React.useCallback(() => {
      fetchClientes();
    }, [])
  );

  const fetchClientes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("clientes")
        .select("*")
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
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ''); // Elimina acentos
  };

  const filteredClientes = clientes.filter((cliente) => {
  const query = normalizeText(searchQuery);
  return (
    normalizeText(cliente.nombre).includes(query) ||
    normalizeText(cliente.empresa).includes(query) ||
    (cliente.establecimiento && normalizeText(cliente.establecimiento).includes(query))
  );
});

  const handleClientPress = (cliente: Cliente) => {
    router.push(`/edit-client?id=${cliente.id}`);
  };

  const renderCliente = ({ item }: { item: Cliente }) => (
    <TouchableOpacity
      style={styles.clienteItem}
      onPress={() => handleClientPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.clienteContent}>
        <View style={styles.clienteMain}>
          <Text style={styles.clienteNombre}>{item.nombre}</Text>
          <Text style={styles.clienteEmpresa}>{item.empresa}</Text>
        </View>
        <View style={styles.clienteDetails}>
          {item.contacto && (
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>📱</Text>
              <Text style={styles.detailText}>{item.contacto}</Text>
            </View>
          )}
          {item.establecimiento && (
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>📍</Text>
              <Text style={styles.detailText}>{item.establecimiento}</Text>
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
        <Text style={styles.headerTitle}>Clientes</Text>
        <View style={styles.headerRight}>
          <Text style={styles.clientCount}>{clientes.length}</Text>
        </View>
      </View>

      {/* Buscador */}
      {clientes.length > 0 && (
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre, empresa o establecimiento..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery. length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
            >
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Lista */}
      {clientes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>👥</Text>
          <Text style={styles.emptyText}>No hay clientes registrados</Text>
          <Text style={styles.emptySubtext}>
            Tocá el botón "+" para agregar el primero
          </Text>
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

      {/* Botón Flotante */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/new-client")}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

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

  // Header
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
  clientCount: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },

  // Lista
  listContent: {
    padding: 12,
  },
  clienteItem: {
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
  clienteContent: {
    flex: 1,
  },
  clienteMain: {
    marginBottom: 8,
  },
  clienteNombre: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1b5e20",
    marginBottom: 2,
  },
  clienteEmpresa: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  clienteDetails: {
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
