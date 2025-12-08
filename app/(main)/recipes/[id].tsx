// app/(main)/recipes/[id].tsx

import * as Print from 'expo-print';
import { router, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator, Alert, ScrollView, StyleSheet,
    Text, TouchableOpacity, View
} from 'react-native';
import { supabase } from '../../../lib/supabase';

export default function RecipeDetailScreen() {
    const { id } = useLocalSearchParams();
    const [receta, setReceta] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [generatingPdf, setGeneratingPdf] = useState(false);

    useEffect(() => {
        if (id) fetchRecetaDetalle();
    }, [id]);

    const fetchRecetaDetalle = async () => {
        try {
            // Buscamos la receta con TODAS sus relaciones (Cliente, Lotes, Productos)
            const { data, error } = await supabase
                .from('recetas')
                .select(`
                    *,
                    cliente:clientes (*),
                    items_lotes:receta_lotes (
                        *,
                        lote:lotes (*)
                    ),
                    items_productos:receta_productos (
                        *,
                        producto:productos (*)
                    )
                `)
                .eq('id', id)
                .single();

            if (error) throw error;
            setReceta(data);
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "No se pudo cargar la receta.");
            router.back();
        } finally {
            setLoading(false);
        }
    };

    // === GENERADOR DE PDF (Aquí ocurre la magia visual) ===
    const generarYCompartirPDF = async () => {
        if (!receta) return;
        setGeneratingPdf(true);

        try {
            // Calculamos totales para mostrar
            const totalHectareas = receta.items_lotes.reduce((acc: number, item: any) => acc + item.superficie_aplicar_ha, 0);

            // Armamos las filas de LOTES
            const lotesHTML = receta.items_lotes.map((item: any) => `
                <tr>
                    <td style="text-align: center;">${item.lote.nombre_lote}</td>
                    <td style="text-align: center;">${item.lote.superficie_ha}</td>
                    <td style="text-align: center;">${item.superficie_aplicar_ha}</td>
                    <td style="text-align: center;">${item.lote.latitud || '-'}</td>
                    <td style="text-align: center;">${item.lote.longitud || '-'}</td>
                </tr>
            `).join('');

            // Armamos las filas de PRODUCTOS
            const productosHTML = receta.items_productos.map((item: any) => `
                <tr>
                    <td style="text-align: center;">${item.orden_mezcla}</td>
                    <td>
                        <strong>${item.producto.nombre}</strong><br/>
                        <span style="font-size: 10px; color: #666;">${item.producto.composicion || ''}</span>
                    </td>
                    <td style="text-align: center;">${item.dosis_por_ha} ${item.unidad_dosis || ''}</td>
                    <td style="text-align: center;">${item.dosis_total} ${item.unidad_total || ''}</td>
                    <td style="text-align: center;">0</td>
                </tr>
            `).join('');

            // EL HTML COMPLETO (Diseño idéntico a la foto)
            const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: 'Helvetica', sans-serif; padding: 20px; color: #333; }
                    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #4caf50; padding-bottom: 10px; margin-bottom: 20px; }
                    .logo { font-size: 24px; font-weight: bold; }
                    .logo span { color: #4caf50; }
                    .title-box { text-align: center; margin-bottom: 30px; }
                    .receta-num { font-size: 22px; font-weight: bold; margin-bottom: 10px; }
                    .dates { display: flex; justify-content: space-around; font-size: 12px; margin-bottom: 15px; }
                    .dates div { text-align: center; }
                    .dates strong { display: block; margin-bottom: 5px; font-style: italic; }
                    .section-title { font-size: 12px; font-weight: bold; margin-top: 15px; margin-bottom: 5px; text-transform: uppercase; color: #555; }
                    .info-block { font-size: 12px; line-height: 1.6; margin-bottom: 20px; }
                    
                    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px; }
                    th { background-color: #f0f0f0; padding: 8px; text-align: center; font-weight: bold; border: 1px solid #ddd; }
                    td { padding: 8px; border: 1px solid #ddd; }
                    
                    .status { float: right; color: #4caf50; font-weight: bold; border: 1px solid #4caf50; padding: 2px 8px; border-radius: 4px; font-size: 10px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="logo">APLICAR | <span>AGRORECETA</span></div>
                    <div style="color: #0288d1; font-weight: bold;">RECETA FITOSANITARIA</div>
                </div>

                <div class="title-box">
                    <div class="status">[${receta.estado.toUpperCase()}]</div>
                    <div class="receta-num">RECETA N° ${receta.numero_receta}</div>
                    
                    <div class="dates">
                        <div>
                            <strong>FECHA DE EMISIÓN</strong>
                            ${new Date(receta.fecha_emision).toLocaleDateString()}
                        </div>
                        <div>
                            <strong>FECHA DE APLICACIÓN</strong>
                            <span style="color: #0288d1;">${new Date().toLocaleDateString()}</span>
                        </div>
                        <div>
                            <strong>FECHA DE VENCIMIENTO</strong>
                            <span style="color: #d32f2f;">${new Date(new Date().setDate(new Date().getDate() + 7)).toLocaleDateString()}</span>
                        </div>
                    </div>
                    
                    <div style="border-top: 1px solid #ddd; border-bottom: 1px solid #ddd; padding: 5px; font-size: 12px; text-align: center; margin-top: 10px;">
                        TIPO DE APLICACIÓN: <strong style="color: #d32f2f;">${receta.tipo_aplicacion || 'TERRESTRE'}</strong>
                    </div>
                </div>

                <div class="info-block">
                    <b>ASESOR TÉCNICO:</b> ${receta.asesor_tecnico}<br/><br/>
                    <b>EMPRESA:</b> ${receta.cliente.empresa}<br/>
                    <b>ESTABLECIMIENTO:</b> ${receta.cliente.establecimiento || '-'}<br/>
                    <b>DIAGNÓSTICO:</b> ${receta.diagnostico || '-'}
                </div>

                <div class="section-title">LOTES A TRATAR</div>
                <table>
                    <thead>
                        <tr>
                            <th>NOMBRE LOTE</th>
                            <th>SUPERFICIE [ha]</th>
                            <th>SUPERFICIE A APLICAR [ha]</th>
                            <th>LATITUD</th>
                            <th>LONGITUD</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${lotesHTML}
                    </tbody>
                </table>
                <div style="text-align: right; font-size: 11px; margin-top: -15px; margin-bottom: 20px;">
                    <strong>Total a aplicar: ${totalHectareas.toFixed(2)} ha</strong>
                </div>

                <div class="section-title">PRODUCTOS A SER APLICADOS</div>
                <table>
                    <thead>
                        <tr>
                            <th>ORDEN</th>
                            <th>PRODUCTO</th>
                            <th>DOSIS</th>
                            <th>DOSIS TOTAL</th>
                            <th>REMANENTE</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${productosHTML}
                    </tbody>
                </table>

                <div class="section-title">COMENTARIOS / OBSERVACIONES</div>
                <div style="border: 1px solid #ddd; padding: 10px; font-size: 12px; min-height: 50px;">
                    ${receta.comentarios || 'Sin comentarios adicionales.'}
                </div>
                
                <div style="margin-top: 30px; text-align: center; font-size: 10px; color: #999;">
                    Generado automáticamente por AgroReceta App
                </div>
            </body>
            </html>
            `;

            // Generar PDF
            const { uri } = await Print.printToFileAsync({ html: htmlContent });
            
            // Compartir
            await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });

        } catch (error) {
            console.error(error);
            Alert.alert("Error", "No se pudo generar el PDF");
        } finally {
            setGeneratingPdf(false);
        }
    };


    if (loading) {
        return <View style={styles.center}><ActivityIndicator size="large" color="#4caf50"/><Text>Cargando receta...</Text></View>;
    }

    if (!receta) {
        return <View style={styles.center}><Text>Receta no encontrada</Text></View>;
    }

    return (
        <View style={styles.container}>
            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}><Text style={styles.backText}>‹ Volver</Text></TouchableOpacity>
                <Text style={styles.title}>Receta #{receta.numero_receta}</Text>
                <View style={{width: 60}} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* TARJETA RESUMEN */}
                <View style={styles.card}>
                    <Text style={styles.label}>CLIENTE</Text>
                    <Text style={styles.valueLarge}>{receta.cliente.nombre}</Text>
                    <Text style={styles.value}>{receta.cliente.empresa}</Text>
                    
                    <View style={styles.divider}/>
                    
                    <View style={styles.row}>
                        <View>
                            <Text style={styles.label}>FECHA</Text>
                            <Text style={styles.value}>{new Date(receta.fecha_emision).toLocaleDateString()}</Text>
                        </View>
                        <View>
                            <Text style={styles.label}>ESTADO</Text>
                            <Text style={[styles.status, receta.estado === 'Cerrada' ? {color:'red'} : {color:'green'}]}>
                                {receta.estado}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* BOTÓN PDF GRANDE */}
                <TouchableOpacity 
                    style={styles.pdfButton} 
                    onPress={generarYCompartirPDF}
                    disabled={generatingPdf}
                >
                    {generatingPdf ? <ActivityIndicator color="#1b5e20"/> : <Text style={styles.pdfButtonText}>📄 COMPARTIR PDF OFICIAL</Text>}
                </TouchableOpacity>

                {/* DETALLE PRODUCTOS SIMPLE */}
                <Text style={styles.sectionTitle}>Productos ({receta.items_productos.length})</Text>
                {receta.items_productos.map((item: any) => (
                    <View key={item.id} style={styles.itemRow}>
                        <Text style={styles.itemName}>{item.producto.nombre}</Text>
                        <Text style={styles.itemValue}>{item.dosis_total} {item.unidad_total}</Text>
                    </View>
                ))}

                {/* DETALLE LOTES SIMPLE */}
                <Text style={styles.sectionTitle}>Lotes Tratados ({receta.items_lotes.length})</Text>
                {receta.items_lotes.map((item: any) => (
                    <View key={item.id} style={styles.itemRow}>
                        <Text style={styles.itemName}>{item.lote.nombre_lote}</Text>
                        <Text style={styles.itemValue}>{item.superficie_aplicar_ha} ha</Text>
                    </View>
                ))}

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { backgroundColor: '#4caf50', paddingTop: 50, paddingBottom: 15, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 15, alignItems: 'center' },
    title: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    backText: { color: 'white', fontSize: 16 },
    
    content: { padding: 20 },
    card: { backgroundColor: 'white', padding: 20, borderRadius: 12, elevation: 2, marginBottom: 20 },
    label: { fontSize: 12, color: '#999', fontWeight: 'bold', marginBottom: 4 },
    valueLarge: { fontSize: 20, fontWeight: 'bold', color: '#333' },
    value: { fontSize: 16, color: '#555' },
    divider: { height: 1, backgroundColor: '#eee', marginVertical: 15 },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    status: { fontWeight: 'bold', fontSize: 16 },

    pdfButton: { backgroundColor: '#c8e6c9', padding: 15, borderRadius: 12, alignItems: 'center', marginBottom: 30, borderWidth: 2, borderColor: '#4caf50' },
    pdfButtonText: { color: '#1b5e20', fontWeight: 'bold', fontSize: 16 },

    sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#888', marginBottom: 10, textTransform: 'uppercase' },
    itemRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'white', padding: 15, borderRadius: 8, marginBottom: 8 },
    itemName: { fontSize: 16, color: '#333', fontWeight: '500' },
    itemValue: { fontSize: 16, color: '#2e7d32', fontWeight: 'bold' }
});