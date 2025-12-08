// app/(main)/recipes/new.tsx

import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { supabase } from "../../../lib/supabase";

// === INTERFACES ===
interface Lote {
  id: string;
  nombre_lote: string;
  superficie_ha: number;
}
interface Producto {
  id: string;
  nombre: string;
  composicion: string;
  unidad_medida: string;
  marca: string;
}
interface ProductoReceta {
  id: string;
  nombre: string;
  dosisHa: string;
  unidad: string;
}

export default function NewRecipeScreen() {
  // === ESTADOS DEL FORMULARIO ===
  const params = useLocalSearchParams();

  // Cliente y Lotes
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [clienteNombre, setClienteNombre] = useState<string | null>(null);
  const [lotesDisponibles, setLotesDisponibles] = useState<Lote[]>([]);
  const [lotesSeleccionados, setLotesSeleccionados] = useState<string[]>([]);
  const [totalHectareas, setTotalHectareas] = useState(0);
  const [loadingLotes, setLoadingLotes] = useState(false);
  const [asesorNombre, setAsesorNombre] = useState("");

  // Productos Agregados (La lista de la receta)
  const [productosAgregados, setProductosAgregados] = useState<
    ProductoReceta[]
  >([]);

  // Datos Generales
  const [diagnostico, setDiagnostico] = useState("");
  const [guardando, setGuardando] = useState(false);

  // === ESTADOS DEL SELECTOR DE PRODUCTOS (MODAL) ===
  const [modalVisible, setModalVisible] = useState(false);
  const [listaProductosBase, setListaProductosBase] = useState<Producto[]>([]);
  const [loadingProductos, setLoadingProductos] = useState(false);
  const [searchQueryProd, setSearchQueryProd] = useState("");

  // En un useEffect al principio
  useEffect(() => {
    const getAsesor = async () => {
      const { data } = await supabase
        .from("perfiles")
        .select("nombre_completo")
        .single();
      if (data?.nombre_completo) setAsesorNombre(data.nombre_completo);
    };
    getAsesor();
  }, []);

  // === EFECTO: RETORNO DEL CLIENTE ===
  useEffect(() => {
    if (params.clienteId && params.clienteNombre) {
      if (clienteId !== params.clienteId) {
        setLotesSeleccionados([]);
        setTotalHectareas(0);
        fetchLotesDelCliente(params.clienteId as string);
      }
      setClienteId(params.clienteId as string);
      setClienteNombre(params.clienteNombre as string);
      // Limpiamos params para que no moleste
      router.setParams({ clienteId: undefined, clienteNombre: undefined });
    }
  }, [params.clienteId]);

  // === FUNCIONES LÓGICAS DEL FORMULARIO ===

  const fetchLotesDelCliente = async (idCli: string) => {
    setLoadingLotes(true);
    const { data, error } = await supabase
      .from("lotes")
      .select("id, nombre_lote, superficie_ha")
      .eq("cliente_id", idCli);

    if (!error && data) setLotesDisponibles(data);
    setLoadingLotes(false);
  };

  const toggleLote = (lote: Lote) => {
    const isSelected = lotesSeleccionados.includes(lote.id);
    let nuevosSeleccionados;
    let nuevaSuperficie;

    if (isSelected) {
      nuevosSeleccionados = lotesSeleccionados.filter((id) => id !== lote.id);
      nuevaSuperficie = totalHectareas - lote.superficie_ha;
    } else {
      nuevosSeleccionados = [...lotesSeleccionados, lote.id];
      nuevaSuperficie = totalHectareas + lote.superficie_ha;
    }
    setLotesSeleccionados(nuevosSeleccionados);
    setTotalHectareas(parseFloat(nuevaSuperficie.toFixed(2)));
  };

  const updateDosis = (idProd: string, valor: string) => {
    const actualizados = productosAgregados.map((p) => {
      if (p.id === idProd) return { ...p, dosisHa: valor };
      return p;
    });
    setProductosAgregados(actualizados);
  };

  const borrarProducto = (idProd: string) => {
    setProductosAgregados(productosAgregados.filter((p) => p.id !== idProd));
  };

  // === FUNCIONES DEL MODAL DE PRODUCTOS ===

  const abrirSelectorProductos = async () => {
    setModalVisible(true);
    // Cargamos los productos si no estan cargados aun
    if (listaProductosBase.length === 0) {
      setLoadingProductos(true);
      const { data, error } = await supabase
        .from("productos")
        .select("*")
        .eq("activo", true)
        .order("nombre", { ascending: true });

      if (!error && data) setListaProductosBase(data);
      setLoadingProductos(false);
    }
  };

  const seleccionarProductoDesdeModal = (prod: Producto) => {
    const existe = productosAgregados.find((p) => p.id === prod.id);
    if (!existe) {
      const nuevoProd: ProductoReceta = {
        id: prod.id,
        nombre: prod.nombre,
        unidad: prod.unidad_medida,
        dosisHa: "",
      };
      setProductosAgregados([...productosAgregados, nuevoProd]);
    } else {
      Alert.alert("Aviso", "Este producto ya está en la lista.");
    }
    setModalVisible(false);
    setSearchQueryProd(""); // Limpiar busqueda
  };

  // Filtro para el modal
  const productosFiltrados = listaProductosBase.filter(
    (p) =>
      p.nombre.toLowerCase().includes(searchQueryProd.toLowerCase()) ||
      (p.composicion &&
        p.composicion.toLowerCase().includes(searchQueryProd.toLowerCase()))
  );

  // === GUARDADO FINAL ===
  const handleEmitirReceta = async () => {
    if (!clienteId)
      return Alert.alert("Falta Cliente", "Seleccione un cliente primero.");
    if (lotesSeleccionados.length === 0)
      return Alert.alert("Falta Lote", "Seleccione al menos un lote.");
    if (productosAgregados.length === 0)
      return Alert.alert("Falta Producto", "Agregue al menos un producto.");
    const dosisIncompletas = productosAgregados.some(
      (p) => !p.dosisHa || parseFloat(p.dosisHa) <= 0
    );
    if (dosisIncompletas)
      return Alert.alert("Dosis Inválida", "Verifique las dosis.");

    setGuardando(true);
    try {
      // 1. Cabecera
      const { data: receta, error: errReceta } = await supabase
        .from("recetas")
        .insert({
          cliente_id: clienteId,
          asesor_tecnico: asesorNombre || " ",
          fecha_emision: new Date().toISOString(),
          diagnostico: diagnostico,
          estado: "Abierta",
          tipo_aplicacion: "Terrestre",
        })
        .select()
        .single();

      if (errReceta) throw new Error(errReceta.message);
      const recetaId = receta.id;

      // 2. Lotes
      const insertLotes = lotesSeleccionados.map((lid) => {
        const loteData = lotesDisponibles.find((l) => l.id === lid);
        return {
          receta_id: recetaId,
          lote_id: lid,
          superficie_aplicar_ha: loteData?.superficie_ha || 0,
        };
      });
      await supabase.from("receta_lotes").insert(insertLotes);

      // 3. Productos
      const insertProductos = productosAgregados.map((prod, index) => {
        const dosis = parseFloat(prod.dosisHa) || 0;
        const total = dosis * totalHectareas;
        return {
          receta_id: recetaId,
          producto_id: prod.id,
          orden_mezcla: index + 1,
          dosis_por_ha: dosis,
          unidad_dosis: prod.unidad + "/ha",
          dosis_total: total,
          unidad_total: prod.unidad,
        };
      });
      await supabase.from("receta_productos").insert(insertProductos);

      Alert.alert("✅ Receta Emitida", "Se guardó correctamente.", [
        {
          text: "OK",
          onPress: () => {
            router.dismissAll();
            router.replace("/");
          },
        },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* --- HEADER --- */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.headerBtn}>Cancelar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nueva Receta</Text>
        <TouchableOpacity onPress={handleEmitirReceta} disabled={guardando}>
          {guardando ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.headerBtnBold}>EMITIR</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* 1. CLIENTE */}
        <View style={styles.card}>
          <Text style={styles.label}>1. Cliente</Text>
          <TouchableOpacity
            style={styles.selector}
            // Enviamos returnTo para que el cliente sepa volver
            onPress={() =>
              router.push({
                pathname: "/(main)/client-select",
                params: { returnTo: "/(main)/recipes/new" },
              })
            }
          >
            <Text
              style={[styles.selectorText, !clienteNombre && { color: "#999" }]}
            >
              {clienteNombre || "Seleccionar Cliente..."}
            </Text>
            <Text>▼</Text>
          </TouchableOpacity>
        </View>

        {/* 2. LOTES */}
        {clienteId && (
          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.label}>2. Lotes</Text>
              <View style={styles.totalBadgeContainer}>
                <Text style={styles.totalBadgeText}>
                  Total: {totalHectareas.toFixed(2)} ha
                </Text>
              </View>
            </View>

            {loadingLotes ? (
              <ActivityIndicator color="#4caf50" />
            ) : (
              <View style={styles.lotesGrid}>
                {lotesDisponibles.map((lote) => {
                  const isSelected = lotesSeleccionados.includes(lote.id);
                  return (
                    <TouchableOpacity
                      key={lote.id}
                      style={[
                        styles.loteChip,
                        isSelected && styles.loteChipSelected,
                      ]}
                      onPress={() => toggleLote(lote)}
                    >
                      <Text
                        style={[
                          styles.loteText,
                          isSelected && styles.loteTextSelected,
                        ]}
                      >
                        {lote.nombre_lote}
                      </Text>
                      <Text style={styles.loteSub}>
                        {lote.superficie_ha} ha
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                {lotesDisponibles.length === 0 && (
                  <Text style={styles.hint}>Sin lotes cargados.</Text>
                )}
              </View>
            )}
          </View>
        )}

        {/* 3. DIAGNÓSTICO */}
        <View style={styles.card}>
          <Text style={styles.label}>3. Diagnóstico</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Barbecho, Malezas..."
            value={diagnostico}
            onChangeText={setDiagnostico}
          />
        </View>

        {/* 4. PRODUCTOS */}
        <View style={[styles.card, { minHeight: 200 }]}>
          <View style={styles.rowBetween}>
            <Text style={styles.label}>4. Productos</Text>
            {/* BOTÓN QUE ABRE EL MODAL */}
            <TouchableOpacity onPress={abrirSelectorProductos}>
              <Text style={styles.addLink}>+ AGREGAR</Text>
            </TouchableOpacity>
          </View>

          {productosAgregados.length === 0 ? (
            <Text style={styles.hintCentrado}>
              Agregá productos para calcular
            </Text>
          ) : (
            productosAgregados.map((prod, index) => {
              const dosisNum = parseFloat(prod.dosisHa) || 0;
              const totalCalc = (dosisNum * totalHectareas).toFixed(2);
              return (
                <View key={index} style={styles.productRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.prodName}>{prod.nombre}</Text>
                    <Text style={styles.prodUnit}>{prod.unidad}</Text>
                  </View>
                  <View style={{ alignItems: "center", marginHorizontal: 10 }}>
                    <Text style={styles.miniLabel}>Dosis/Ha</Text>
                    <TextInput
                      style={styles.doseInput}
                      keyboardType="numeric"
                      placeholder="0.00"
                      value={prod.dosisHa}
                      onChangeText={(t) => updateDosis(prod.id, t)}
                    />
                  </View>
                  <View style={{ alignItems: "flex-end", width: 70 }}>
                    <Text style={styles.miniLabel}>Total</Text>
                    <Text style={styles.totalCalc}>{totalCalc}</Text>
                    <Text style={styles.miniUnit}>{prod.unidad}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => borrarProducto(prod.id)}
                    style={{ marginLeft: 15 }}
                  >
                    <Text
                      style={{
                        color: "#ef5350",
                        fontSize: 20,
                        fontWeight: "bold",
                      }}
                    >
                      ×
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* === MODAL SELECTOR DE PRODUCTOS === */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Producto</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.modalClose}>Cerrar</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalSearch}
              placeholder="Buscar producto..."
              value={searchQueryProd}
              onChangeText={setSearchQueryProd}
            />

            {loadingProductos ? (
              <ActivityIndicator style={{ marginTop: 20 }} color="#4caf50" />
            ) : (
              <FlatList
                data={productosFiltrados}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.modalItem}
                    onPress={() => seleccionarProductoDesdeModal(item)}
                  >
                    <Text style={styles.modalItemName}>{item.nombre}</Text>
                    <Text style={styles.modalItemSub}>{item.composicion}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f2f2f2" },
  header: {
    backgroundColor: "#4caf50",
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 4,
  },
  headerTitle: { color: "white", fontSize: 18, fontWeight: "bold" },
  headerBtn: { color: "white", fontSize: 16 },
  headerBtnBold: { color: "white", fontSize: 16, fontWeight: "bold" },

  scroll: { padding: 15 },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
  },
  label: { fontSize: 14, fontWeight: "bold", color: "#333", marginBottom: 8 },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  selector: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#fafafa",
  },
  selectorText: { fontSize: 16, color: "#333" },

  lotesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  loteChip: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    minWidth: "30%",
  },
  loteChipSelected: {
    backgroundColor: "#e8f5e9",
    borderColor: "#4caf50",
    borderWidth: 2,
  },
  loteText: { fontSize: 14, color: "#333", fontWeight: "500" },
  loteTextSelected: { color: "#2e7d32", fontWeight: "bold" },
  loteSub: { fontSize: 11, color: "#888", marginTop: 2 },

  totalBadgeContainer: {
    backgroundColor: "#2e7d32",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  totalBadgeText: { color: "white", fontWeight: "bold", fontSize: 12 },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    backgroundColor: "#fafafa",
  },
  hint: { color: "#999", fontStyle: "italic", fontSize: 14 },
  hintCentrado: {
    color: "#999",
    fontStyle: "italic",
    textAlign: "center",
    marginVertical: 10,
  },

  addLink: {
    color: "#4caf50",
    fontWeight: "bold",
    fontSize: 12,
    borderWidth: 1,
    borderColor: "#4caf50",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingVertical: 12,
  },
  prodName: { fontWeight: "bold", fontSize: 14, color: "#333" },
  prodUnit: { fontSize: 10, color: "#888" },
  miniLabel: { fontSize: 10, color: "#aaa", marginBottom: 2 },
  miniUnit: { fontSize: 10, color: "#aaa" },
  doseInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    width: 80,
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 16,
    backgroundColor: "white",
  },
  totalCalc: { fontSize: 16, fontWeight: "bold", color: "#2e7d32" },

  // ESTILOS DEL MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    height: "80%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: "#333" },
  modalClose: { color: "#4caf50", fontSize: 16, fontWeight: "bold" },
  modalSearch: {
    backgroundColor: "#f0f0f0",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  modalItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalItemName: { fontSize: 16, fontWeight: "bold", color: "#333" },
  modalItemSub: { fontSize: 12, color: "#666" },
});
