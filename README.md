# 🌾 Agroterra Mobile — Sistema de Emisión y Gestión de Recetas Fitosanitarias

Agroterra Mobile es una aplicación nativa modular diseñada específicamente para el sector agropecuario. Permite a los Ingenieros Agrónomos (Asesores Técnicos) gestionar su cartera de clientes, dar de alta y geolocalizar lotes de campo, administrar un catálogo de insumos químicos y emitir recetas fitosanitarias complejas con orden de mezcla asincrónica y cálculo automatizado de dosis totales, exportando el documento final a PDF nativo para su previsualización o envío inmediato.

---

## 🚀 Arquitectura General del Sistema

La aplicación está construida sobre un entorno mobile nativo multiplataforma, conectada de forma directa a un motor de base de datos relacional robusto a través de capas seguras de abstracción:

```
[ App Mobile: React Native (Expo SDK 54) ]
                   │
                   │ Conexión Segura (Supabase JS Client)
                   ▼
[ Backend & Persistencia: Supabase (PostgreSQL Cloud) ]
```

---

## 🛠️ Tecnologías y Dependencias Core

* **React Native & TypeScript:** Desarrollo de componentes nativos con tipado estricto para asegurar la robustez de los datos en lógica de cálculo.
* **Expo SDK 54:** Framework para acceso simplificado y unificado a APIs nativas del sistema operativo.
* **Expo Router v6:** Sistema de enrutamiento perimetral basado en archivos (*File-Based Routing*) con soporte para grupos de rutas y navegación por stack.
* **Supabase Client JS:** Librería para la persistencia e interacción en tiempo real con la base de datos a través de abstracciones relacionales.
* **Expo Print & Expo Sharing:** Puentes nativos del sistema operativo (*Native Bridges*) encargados de la compilación de strings HTML hacia archivos binarios `.pdf` y la posterior invocación de la hoja de compartición nativa (*Share Sheet*).
* **Expo Intent Launcher (Android):** Interoperabilidad a bajo nivel para despachar actividades (*Intents*) y abrir visores de documentos externos dentro del ecosistema Android.

---

## 🗄️ Arquitectura y Modelado de Datos (Estrategia SQL Relacional)

A diferencia de modelos NoSQL, Agroterra aprovecha la potencia de **PostgreSQL** en Supabase para garantizar la integridad referencial y consistencia transaccional mediante esquemas estricto y claves foráneas con borrados en cascada (`ON DELETE CASCADE`):

### Modelos y Tablas Core:

1. **`clientes`:** Entidad principal que almacena los datos fiscales, comerciales y de contacto de productores o empresas agropecuarias.
2. **`lotes`:** Campos o subdivisiones geográficas pertenecientes a un cliente. Mapea propiedades numéricas para cálculo de área (`superficie_ha`) y campos con tipo de dato `DECIMAL(10,7)` para el almacenamiento de precisión de `latitud` y `longitud` geoespacial.
3. **`productos`:** Catálogo maestro de agroquímicos e insumos. Registra propiedades clave como principio activo (`composicion`), `marca` (laboratorio), `unidad_medida` base y una bandera lógica de borrado suave (`activo`).
4. **`recetas`:** Documento troncal e histórico. Mapea datos funcionales (diagnóstico, tipo de aplicación, asesor a cargo) y se vincula mediante relaciones **Muchos a Muchos** a través de dos tablas pivote intermedias:
   * `receta_lotes`: Registra qué secciones del campo del cliente entran en la orden de fumigación.
   * `receta_productos`: Almacena de forma posicional el orden exacto de vertido químico en el tanque (`orden_mezcla`), la dosis dosificada por hectárea y calcula multiplicativamente la carga de dosis total.

---

## 🔒 Patrones y Hacks Técnicos Críticos de la App

### A. Sanitización de Routing Dinámico (El Fix del ID Fantasma)
Expo Router mapea de forma nativa los nombres de archivos de su estructura de carpetas como parámetros de URL. Para prevenir comportamientos erráticos, se implementó el patrón de sanitización perimetral `isValidUUID`:
* **Mecánica:** Al ingresar a una ruta dinámica del tipo `client-detail/[id]`, el ciclo de vida del componente intercepta el parámetro extraído por `useLocalSearchParams`. Si el ID corresponde a una ruta estática del framework (como `"index"` o `"new"`), la app detiene el flujo de llamadas de Supabase de forma temprana, evitando que el cliente intente realizar consultas de clave primaria (`.eq('id', id)`) con strings de navegación inválidos, eliminando excepciones fatales en la base de datos.

### B. Selector Genérico con Retorno Dinámico (`returnTo`)
Para evitar la duplicación de código y pantallas de búsqueda en flujos cruzados, se implementó un mecanismo de callback por parámetros de navegación:
* **Mecánica:** La pantalla `ClientSelectorScreen` es completamente desacoplada. Cuando un flujo (como la creación de un nuevo lote) necesita asignar un cliente, despacha un `router.push` hacia el selector adjuntando un parámetro `returnTo` con su propia ubicación lógica. El selector lista los datos, y al hacer tap en el ítem, ejecuta un `router.navigate` apuntando exactamente al origen dinámico e inyectando las propiedades `clienteId` y `clienteNombre` directamente en el stack de la pantalla que lo invocó.

### C. Mutación y Vaciado de Historial (`router.dismissAll`)
En dispositivos móviles, un error clásico de experiencia de usuario es el bucle infinito del botón "Atrás" físico tras completar un flujo lineal.
* **Mecánica:** Al guardar un lote de forma exitosa en `lot-create/new.tsx`, la aplicación procesa la persistencia de datos y ejecuta un vaciado atómico del historial mediante `router.dismissAll()`. Esto remueve del stack nativo la pantalla de creación, la pantalla del selector de clientes y las vistas intermedias, devolviendo el puntero de navegación a la raíz (`Home`). Acto seguido, inyecta mediante un `push` diferido el listado de lotes (`/lots`). De esta forma, si el usuario presiona "Atrás" desde la lista, el sistema operativo lo expulsa hacia el Home de manera limpia y orgánica.

---

## 📄 Motor Nativo de Compilación y Visualización de PDFs

La emisión de la Receta Fitosanitaria no se delega a librerías javascript de renderizado de canvas (que degradan la performance del dispositivo), sino que explota los hilos nativos del sistema operativo:

1. **Inyección Estructural:** La aplicación procesa los arreglos relacionales devueltos por Supabase y mapea un string HTML puro inyectando de forma asincrónica las filas de los lotes seleccionados y el orden de mezcla de los productos.
2. **Compilación a Binario:** El motor de Expo invoca a `Print.printToFileAsync`, que delega al motor de renderizado nativo del sistema operativo (iOS/Android) la maquetación exacta a un archivo físico `.pdf` temporal.
3. **Pase de Permisos Scoped Storage (Android):** Para evadir las restricciones de acceso a archivos aislados impuestas por Android de forma nativa, se utiliza el puente `FileSystem.getContentUriAsync(uri)` bajo canales legacy. Esto genera un `Content URI` seguro con banderas temporales de lectura.
4. **Lanzamiento por Intent:** Finalmente, a través de `IntentLauncher.startActivityAsync`, la app despacha una actividad nativa de tipo `ACTION_VIEW` con el MIME-type `application/pdf`, provocando que el sistema operativo inicialice de forma externa y fluida el visor PDF favorito del usuario con cero latencia.

---

## 💻 Configuración del Entorno de Desarrollo

### Configuración de Supabase
1. Clonar el script de base de datos ubicado en `query.sql` dentro de la consola del **SQL Editor** en tu proyecto de Supabase Atlas para generar las tablas, triggers, índices y funciones automáticas del timestamp.

### Ejecución Local del Proyecto
1. Instalar dependencias de la app mobile:
   ```bash
   npm install
   ```
2. Asegurar que las credenciales de inicialización del cliente estén correctamente definidas en `lib/supabase.ts` (URL del proyecto y Anon Key).
3. Levantar el bundler de desarrollo de Expo:
   ```bash
   npx expo start
   ```
4. Presionar `a` para inicializar el emulador de Android, `i` para el simulador de iOS, o escanear el código QR en pantalla mediante la app de **Expo Go** en un dispositivo físico conectado a la misma red local.
