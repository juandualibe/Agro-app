base de datos en supabase:

-- ============================================

-- AGRORECETA - BASE DE DATOS

-- ============================================



-- 1. TABLA: clientes

CREATE TABLE clientes (

id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

nombre TEXT NOT NULL,

empresa TEXT,

establecimiento TEXT,

contacto TEXT,

email TEXT,

direccion TEXT,

created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()

);



-- 2. TABLA: lotes

CREATE TABLE lotes (

id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,

nombre_lote TEXT NOT NULL,

superficie_ha DECIMAL(10,2) NOT NULL,

latitud DECIMAL(10,7),

longitud DECIMAL(10,7),

cultivo TEXT,

comentarios TEXT,

created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()

);



-- 3. TABLA: productos

CREATE TABLE productos (

id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

nombre TEXT NOT NULL,

tipo TEXT,

composicion TEXT,

unidad_medida TEXT DEFAULT 'lts',

precio_actual DECIMAL(10,2),

marca TEXT,

activo BOOLEAN DEFAULT true,

created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()

);



-- 4. TABLA: recetas

CREATE TABLE recetas (

id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

numero_receta SERIAL UNIQUE NOT NULL,

cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,

asesor_tecnico TEXT NOT NULL,

fecha_emision DATE DEFAULT CURRENT_DATE,

fecha_aplicacion DATE,

fecha_vencimiento DATE,

tipo_aplicacion TEXT DEFAULT 'Terrestre',

cultivo TEXT,

diagnostico TEXT,

comentarios TEXT,

estado TEXT DEFAULT 'Abierta',

created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()

);



-- 5. TABLA: receta_lotes (relación muchos a muchos)

CREATE TABLE receta_lotes (

id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

receta_id UUID REFERENCES recetas(id) ON DELETE CASCADE,

lote_id UUID REFERENCES lotes(id) ON DELETE CASCADE,

superficie_aplicar_ha DECIMAL(10,2) NOT NULL,

created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()

);



-- 6. TABLA: receta_productos (relación muchos a muchos)

CREATE TABLE receta_productos (

id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

receta_id UUID REFERENCES recetas(id) ON DELETE CASCADE,

producto_id UUID REFERENCES productos(id) ON DELETE CASCADE,

orden_mezcla INTEGER NOT NULL,

dosis_por_ha DECIMAL(10,2) NOT NULL,

unidad_dosis TEXT DEFAULT 'cc/ha',

dosis_total DECIMAL(10,2),

unidad_total TEXT DEFAULT 'lts',

remanente DECIMAL(10,2) DEFAULT 0,

precio_unitario DECIMAL(10,2),

created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()

);



-- ============================================

-- ÍNDICES PARA OPTIMIZAR CONSULTAS

-- ============================================



CREATE INDEX idx_lotes_cliente ON lotes(cliente_id);

CREATE INDEX idx_recetas_cliente ON recetas(cliente_id);

CREATE INDEX idx_recetas_numero ON recetas(numero_receta);

CREATE INDEX idx_receta_lotes_receta ON receta_lotes(receta_id);

CREATE INDEX idx_receta_productos_receta ON receta_productos(receta_id);



-- ============================================

-- FUNCIÓN PARA ACTUALIZAR updated_at

-- ============================================



CREATE OR REPLACE FUNCTION update_updated_at_column()

RETURNS TRIGGER AS $$

BEGIN

NEW.updated_at = NOW();

RETURN NEW;

END;

$$ LANGUAGE plpgsql;



-- Aplicar trigger a las tablas

CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes

FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();



CREATE TRIGGER update_lotes_updated_at BEFORE UPDATE ON lotes

FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();



CREATE TRIGGER update_productos_updated_at BEFORE UPDATE ON productos

FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();



CREATE TRIGGER update_recetas_updated_at BEFORE UPDATE ON recetas

FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();



-- ============================================

-- DATOS DE PRUEBA (OPCIONAL)

-- ============================================



-- Cliente de ejemplo

INSERT INTO clientes (nombre, empresa, establecimiento, contacto, email)

VALUES ('Juan Dualibe', 'Las Viñas', 'Las Viñas', '+54 9 123456789', 'juan@example.com');



-- Productos de ejemplo (basados en la imagen)

INSERT INTO productos (nombre, tipo, composicion, unidad_medida, marca)

VALUES

('ALLTEC ULTRA', 'Herbicida', 'COADYUDANTES', 'cc/ha', 'Genérico'),

('TRASPECT/SELECT/NOVA CLETODIM', 'Herbicida', 'CLETODIM 24%', 'cc/ha', 'Varios'),

('DEDALO/ENLIST/BEKER/JASPEK', 'Herbicida', 'ACIDO VOLATIL 30%', 'lts/ha', 'Varios'),

('NUVOUX/SULFOSATO/FULL2/SÚPER ESTRELLA', 'Herbicida', 'GLIFOSATO', 'lts/ha', 'Varios');



-- Mensaje de éxito

SELECT 'Base de datos creada exitosamente!' AS mensaje;