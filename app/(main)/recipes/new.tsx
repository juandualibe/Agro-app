// app/(main)/recipes/new.tsx

import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator, Alert, FlatList, Modal, SafeAreaView, ScrollView, StyleSheet,
    Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { supabase } from '../../../lib/supabase';

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
    // PARAMETROS (Acá detectamos si es Edición)
    const params = useLocalSearchParams();
    const recipeIdToEdit = params.recipeId as string | undefined; // Si existe, editamos.

    // === ESTADOS ===
    
    // Cliente y Lotes
    const [clienteId, setClienteId] = useState<string | null>(null);
    const [clienteNombre, setClienteNombre] = useState<string | null>(null);
    const [lotesDisponibles, setLotesDisponibles] = useState<Lote[]>([]);
    const [lotesSeleccionados, setLotesSeleccionados] = useState<string[]>([]);
    const [totalHectareas, setTotalHectareas] = useState(0);
    const [loadingLotes, setLoadingLotes] = useState(false);

    // Productos
    const [productosAgregados, setProductosAgregados] = useState<ProductoReceta[]>([]);
    
    // Datos Generales
    const [diagnostico, setDiagnostico] = useState('');
    const [guardando, setGuardando] = useState(false);
    const [cargandoEdicion, setCargandoEdicion] = useState(false);
    const [asesorNombre, setAsesorNombre] = useState(''); // Nombre real del ingeniero

    // Modal Selector
    const [modalVisible, setModalVisible] = useState(false);
    const [listaProductosBase, setListaProductosBase] = useState<Producto[]>([]);
    const [loadingProductos, setLoadingProductos] = useState(false);
    const [searchQueryProd, setSearchQueryProd] = useState('');


    // === 1. CARGA INICIAL (Ingeniero y Modo Edición) ===
    useEffect(() => {
        // A. Cargar nombre del ingeniero (perfil)
        const fetchIngeniero = async () => {
            const { data } = await supabase.from('perfiles').select('nombre_completo').limit(1).single();
            if (data?.nombre_completo) setAsesorNombre(data.nombre_completo);
        };
        fetchIngeniero();

        // B. Si es EDICIÓN, cargar la receta completa
        if (recipeIdToEdit) {
            cargarDatosParaEditar(recipeIdToEdit);
        }
    }, [recipeIdToEdit]);


    // === LÓGICA DE HIDRATACIÓN (Cargar datos viejos) ===
    const cargarDatosParaEditar = async (id: string) => {
        setCargandoEdicion(true);
        try {
            // 1. Traer Receta + Lotes Usados + Productos Usados + Info Cliente
            const { data, error } = await supabase
                .from('recetas')
                .select(`
                    *,
                    cliente:clientes (id, nombre),
                    items_lotes:receta_lotes (lote_id, superficie_aplicar_ha),
                    items_productos:receta_productos (producto_id, dosis_por_ha, producto:productos(nombre, unidad_medida))
                `)
                .eq('id', id)
                .single();

            if (error) throw error;

            // 2. Llenar Estados Básicos
            setDiagnostico(data.diagnostico || '');
            setClienteId(data.cliente_id);
            setClienteNombre(data.cliente.nombre);

            // 3. Cargar los lotes disponibles de ese cliente (para poder mostrar la lista completa)
            await fetchLotesDelCliente(data.cliente_id);

            // 4. Marcar los lotes seleccionados
            const lotesIds = data.items_lotes.map((i: any) => i.lote_id);
            setLotesSeleccionados(lotesIds);
            
            // Calcular total ha (sumando lo guardado)
            const totalHa = data.items_lotes.reduce((acc: number, curr: any) => acc + curr.superficie_aplicar_ha, 0);
            setTotalHectareas(totalHa);

            // 5. Llenar Productos
            const prodsFormateados = data.items_productos.map((item: any) => ({
                id: item.producto_id,
                nombre: item.producto.nombre,
                dosisHa: String(item.dosis_por_ha), // Convertir a string para el input
                unidad: item.producto.unidad_medida
            }));
            setProductosAgregados(prodsFormateados);

        } catch (error) {
            Alert.alert("Error", "No se pudo cargar la receta para editar.");
            router.back();
        } finally {
            setCargandoEdicion(false);
        }
    };


    // === 2. DETECTOR DE CAMBIO DE CLIENTE (Solo si viene del selector) ===
    useEffect(() => {
        if (params.clienteId && params.clienteNombre) {
            // Si el cliente cambió respecto al que ya teníamos (importante para no borrar data al editar)
            if (clienteId !== params.clienteId) {
                setLotesSeleccionados([]);
                setTotalHectareas(0);
                fetchLotesDelCliente(params.clienteId as string);
            }
            setClienteId(params.clienteId as string);
            setClienteNombre(params.clienteNombre as string);
            router.setParams({ clienteId: undefined, clienteNombre: undefined });
        }
    }, [params.clienteId]);


    // === FUNCIONES LÓGICAS ===

    const fetchLotesDelCliente = async (idCli: string) => {
        setLoadingLotes(true);
        const { data, error } = await supabase
            .from('lotes')
            .select('id, nombre_lote, superficie_ha')
            .eq('cliente_id', idCli);
        
        if (!error && data) setLotesDisponibles(data);
        setLoadingLotes(false);
    };

    const toggleLote = (lote: Lote) => {
        const isSelected = lotesSeleccionados.includes(lote.id);
        let nuevosSeleccionados;
        let nuevaSuperficie;

        if (isSelected) {
            nuevosSeleccionados = lotesSeleccionados.filter(id => id !== lote.id);
            nuevaSuperficie = totalHectareas - lote.superficie_ha;
        } else {
            nuevosSeleccionados = [...lotesSeleccionados, lote.id];
            nuevaSuperficie = totalHectareas + lote.superficie_ha;
        }
        setLotesSeleccionados(nuevosSeleccionados);
        setTotalHectareas(parseFloat(nuevaSuperficie.toFixed(2))); 
    };

    const updateDosis = (idProd: string, valor: string) => {
        const actualizados = productosAgregados.map(p => {
            if (p.id === idProd) return { ...p, dosisHa: valor };
            return p;
        });
        setProductosAgregados(actualizados);
    };

    const borrarProducto = (idProd: string) => {
        setProductosAgregados(productosAgregados.filter(p => p.id !== idProd));
    };

    // === MODAL PRODUCTOS ===
    const abrirSelectorProductos = async () => {
        setModalVisible(true);
        if (listaProductosBase.length === 0) {
            setLoadingProductos(true);
            const { data } = await supabase.from("productos").select("*").eq('activo', true).order("nombre", { ascending: true });
            if (data) setListaProductosBase(data);
            setLoadingProductos(false);
        }
    };

    const seleccionarProductoDesdeModal = (prod: Producto) => {
        const existe = productosAgregados.find(p => p.id === prod.id);
        if (!existe) {
            setProductosAgregados([...productosAgregados, {
                id: prod.id,
                nombre: prod.nombre,
                unidad: prod.unidad_medida,
                dosisHa: '',
            }]);
        } else {
            Alert.alert("Aviso", "Este producto ya está en la lista.");
        }
        setModalVisible(false);
        setSearchQueryProd('');
    };

    const productosFiltrados = listaProductosBase.filter(p => 
        p.nombre.toLowerCase().includes(searchQueryProd.toLowerCase()) || 
        (p.composicion && p.composicion.toLowerCase().includes(searchQueryProd.toLowerCase()))
    );


    // === GUARDADO FINAL (INTELIGENTE: UPDATE O INSERT) ===
    const handleGuardarReceta = async () => {
        if (!clienteId) return Alert.alert("Falta Cliente", "Seleccione un cliente.");
        if (lotesSeleccionados.length === 0) return Alert.alert("Falta Lote", "Seleccione lotes.");
        if (productosAgregados.length === 0) return Alert.alert("Falta Producto", "Agregue productos.");
        
        const dosisIncompletas = productosAgregados.some(p => !p.dosisHa || parseFloat(p.dosisHa) <= 0);
        if (dosisIncompletas) return Alert.alert("Dosis Inválida", "Verifique las dosis > 0.");

        setGuardando(true);
        try {
            let recetaId = recipeIdToEdit;

            // 1. CABECERA (Crear o Actualizar)
            const datosCabecera = {
                cliente_id: clienteId,
                asesor_tecnico: asesorNombre || "Ingeniero Pendiente",
                // Si es edición, NO tocamos la fecha de emisión original, si es nueva sí.
                ...(recipeIdToEdit ? {} : { fecha_emision: new Date().toISOString() }),
                diagnostico: diagnostico,
            };

            if (recipeIdToEdit) {
                // UPDATE
                const { error } = await supabase.from('recetas').update(datosCabecera).eq('id', recipeIdToEdit);
                if (error) throw error;
                
                // Limpieza de relaciones viejas (Estrategia: Borrar y re-insertar es más seguro)
                await supabase.from('receta_lotes').delete().eq('receta_id', recipeIdToEdit);
                await supabase.from('receta_productos').delete().eq('receta_id', recipeIdToEdit);
            } else {
                // INSERT
                const { data, error } = await supabase.from('recetas').insert(datosCabecera).select().single();
                if (error) throw error;
                recetaId = data.id;
            }

            // 2. INSERTAR LOTES (Nuevos o Re-insertados)
            const insertLotes = lotesSeleccionados.map(lid => {
                const loteData = lotesDisponibles.find(l => l.id === lid);
                return {
                    receta_id: recetaId,
                    lote_id: lid,
                    superficie_aplicar_ha: loteData?.superficie_ha || 0
                };
            });
            await supabase.from('receta_lotes').insert(insertLotes);

            // 3. INSERTAR PRODUCTOS (Nuevos o Re-insertados)
            const insertProductos = productosAgregados.map((prod, index) => {
                const dosis = parseFloat(prod.dosisHa);
                const total = dosis * totalHectareas;
                return {
                    receta_id: recetaId,
                    producto_id: prod.id,
                    orden_mezcla: index + 1,
                    dosis_por_ha: dosis,
                    unidad_dosis: prod.unidad + '/ha',
                    dosis_total: total,
                    unidad_total: prod.unidad
                };
            });
            await supabase.from('receta_productos').insert(insertProductos);

            // FIN
            Alert.alert(
                recipeIdToEdit ? "✅ Receta Actualizada" : "✅ Receta Emitida", 
                "Los cambios se guardaron correctamente.", 
                [{ 
                    text: "OK", 
                    onPress: () => { 
                        router.dismissAll(); 
                        router.replace('/'); 
                    } 
                }]
            );

        } catch (error: any) {
            Alert.alert("Error", error.message);
        } finally {
            setGuardando(false);
        }
    };

    if (cargandoEdicion) {
        return <View style={styles.center}><ActivityIndicator size="large" color="#4caf50"/><Text style={{marginTop:10}}>Cargando datos...</Text></View>;
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}><Text style={styles.headerBtn}>Cancelar</Text></TouchableOpacity>
                <Text style={styles.headerTitle}>{recipeIdToEdit ? 'Editar Receta' : 'Nueva Receta'}</Text>
                <TouchableOpacity onPress={handleGuardarReceta} disabled={guardando}>
                    {guardando ? <ActivityIndicator color="white"/> : <Text style={styles.headerBtnBold}>GUARDAR</Text>}
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scroll}>
                
                {/* 1. CLIENTE */}
                <View style={styles.card}>
                    <Text style={styles.label}>1. Cliente</Text>
                    <TouchableOpacity 
                        style={styles.selector} 
                        onPress={() => router.push({ pathname: '/(main)/client-select', params: { returnTo: '/(main)/recipes/new' } })}
                    >
                        <Text style={[styles.selectorText, !clienteNombre && {color: '#999'}]}>
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
                                <Text style={styles.totalBadgeText}>Total: {totalHectareas.toFixed(2)} ha</Text>
                            </View>
                        </View>
                        
                        {loadingLotes ? <ActivityIndicator color="#4caf50" /> : (
                            <View style={styles.lotesGrid}>
                                {lotesDisponibles.map(lote => {
                                    const isSelected = lotesSeleccionados.includes(lote.id);
                                    return (
                                        <TouchableOpacity 
                                            key={lote.id} 
                                            style={[styles.loteChip, isSelected && styles.loteChipSelected]}
                                            onPress={() => toggleLote(lote)}
                                        >
                                            <Text style={[styles.loteText, isSelected && styles.loteTextSelected]}>{lote.nombre_lote}</Text>
                                            <Text style={styles.loteSub}>{lote.superficie_ha} ha</Text>
                                        </TouchableOpacity>
                                    )
                                })}
                                {lotesDisponibles.length === 0 && <Text style={styles.hint}>Sin lotes cargados.</Text>}
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
                <View style={[styles.card, {minHeight: 200}]}>
                    <View style={styles.rowBetween}>
                        <Text style={styles.label}>4. Productos</Text>
                        <TouchableOpacity onPress={abrirSelectorProductos}>
                            <Text style={styles.addLink}>+ AGREGAR</Text>
                        </TouchableOpacity>
                    </View>

                    {productosAgregados.length === 0 ? (
                        <Text style={styles.hintCentrado}>Agregá productos para calcular</Text>
                    ) : (
                        productosAgregados.map((prod, index) => {
                            const dosisNum = parseFloat(prod.dosisHa) || 0;
                            const totalCalc = (dosisNum * totalHectareas).toFixed(2);
                            return (
                                <View key={index} style={styles.productRow}>
                                    <View style={{flex: 1}}>
                                        <Text style={styles.prodName}>{prod.nombre}</Text>
                                        <Text style={styles.prodUnit}>{prod.unidad}</Text>
                                    </View>
                                    <View style={{alignItems: 'center', marginHorizontal: 10}}>
                                        <Text style={styles.miniLabel}>Dosis/Ha</Text>
                                        <TextInput 
                                            style={styles.doseInput}
                                            keyboardType="numeric"
                                            placeholder="0.00"
                                            value={prod.dosisHa}
                                            onChangeText={(t) => updateDosis(prod.id, t)}
                                        />
                                    </View>
                                    <View style={{alignItems: 'flex-end', width: 70}}>
                                        <Text style={styles.miniLabel}>Total</Text>
                                        <Text style={styles.totalCalc}>{totalCalc}</Text>
                                        <Text style={styles.miniUnit}>{prod.unidad}</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => borrarProducto(prod.id)} style={{marginLeft: 15}}>
                                        <Text style={{color: '#ef5350', fontSize: 20, fontWeight: 'bold'}}>×</Text>
                                    </TouchableOpacity>
                                </View>
                            )
                        })
                    )}
                </View>
            </ScrollView>

            {/* MODAL PRODUCTOS */}
            <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
                <SafeAreaView style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Seleccionar Producto</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}><Text style={styles.modalClose}>Cerrar</Text></TouchableOpacity>
                        </View>
                        <TextInput style={styles.modalSearch} placeholder="Buscar..." value={searchQueryProd} onChangeText={setSearchQueryProd}/>
                        {loadingProductos ? <ActivityIndicator color="#4caf50"/> : (
                            <FlatList
                                data={productosFiltrados}
                                keyExtractor={item => item.id}
                                renderItem={({ item }) => (
                                    <TouchableOpacity style={styles.modalItem} onPress={() => seleccionarProductoDesdeModal(item)}>
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
    container: { flex: 1, backgroundColor: '#f2f2f2' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { backgroundColor: '#4caf50', paddingTop: 50, paddingBottom: 15, paddingHorizontal: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 4 },
    headerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    headerBtn: { color: 'white', fontSize: 16 },
    headerBtnBold: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    scroll: { padding: 15 },
    card: { backgroundColor: 'white', borderRadius: 12, padding: 15, marginBottom: 15, elevation: 2 },
    label: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 8 },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    selector: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fafafa' },
    selectorText: { fontSize: 16, color: '#333' },
    lotesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    loteChip: { backgroundColor: '#fff', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: '#ddd', minWidth: '30%' },
    loteChipSelected: { backgroundColor: '#e8f5e9', borderColor: '#4caf50', borderWidth: 2 },
    loteText: { fontSize: 14, color: '#333', fontWeight: '500' },
    loteTextSelected: { color: '#2e7d32', fontWeight: 'bold' },
    loteSub: { fontSize: 11, color: '#888', marginTop: 2 },
    totalBadgeContainer: { backgroundColor: '#2e7d32', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    totalBadgeText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
    input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, fontSize: 16, backgroundColor: '#fafafa' },
    hint: { color: '#999', fontStyle: 'italic', fontSize: 14 },
    hintCentrado: { color: '#999', fontStyle: 'italic', textAlign: 'center', marginVertical: 10 },
    addLink: { color: '#4caf50', fontWeight: 'bold', fontSize: 12, borderWidth: 1, borderColor: '#4caf50', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
    productRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f0f0f0', paddingVertical: 12 },
    prodName: { fontWeight: 'bold', fontSize: 14, color: '#333' },
    prodUnit: { fontSize: 10, color: '#888' },
    miniLabel: { fontSize: 10, color: '#aaa', marginBottom: 2 },
    miniUnit: { fontSize: 10, color: '#aaa' },
    doseInput: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, paddingVertical: 4, paddingHorizontal: 8, width: 80, textAlign: 'center', fontWeight: 'bold', fontSize: 16, backgroundColor: 'white' },
    totalCalc: { fontSize: 16, fontWeight: 'bold', color: '#2e7d32' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: 'white', height: '80%', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
    modalClose: { color: '#4caf50', fontSize: 16, fontWeight: 'bold' },
    modalSearch: { backgroundColor: '#f0f0f0', padding: 12, borderRadius: 10, marginBottom: 10 },
    modalItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
    modalItemName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    modalItemSub: { fontSize: 12, color: '#666' },
});