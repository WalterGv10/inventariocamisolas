# ⚽ Sistema de Inventario de Camisolas

Sistema de gestión de inventario para camisolas de fútbol de Real Madrid y Barcelona, construido con React, TypeScript, Vite y Supabase.

## 🚀 Características

- ✅ **Control de Inventario**: Gestión completa de stock por producto y talla
- ✅ **Movimientos de Stock**: Registro de entradas y salidas con historial
- ✅ **Filtros Avanzados**: Filtra por equipo, color y talla
- ✅ **Actualización en Tiempo Real**: Los cambios se reflejan automáticamente
- ✅ **Exportación a PDF**: Genera reportes de inventario
- ✅ **Interfaz Moderna**: Diseño responsive y atractivo

## 📋 Requisitos Previos

- Node.js 18 o superior
- Cuenta de Supabase (gratuita)
- npm o yarn

## ⚙️ Configuración

### 1. Clonar o crear el proyecto

El proyecto ya está creado en: `c:\Users\wgarc\Documents\walweb\inventariocamisolas`

### 2. Instalar dependencias

```bash
cd c:\Users\wgarc\Documents\walweb\inventariocamisolas
npm install
```

### 3. Configurar Supabase

1. Ve a [https://supabase.com](https://supabase.com) y crea una cuenta
2. Crea un nuevo proyecto
3. Ve a **SQL Editor** y ejecuta el script `supabase_schema.sql`
4. Ve a **Settings > API** y copia:
   - Project URL
   - anon/public API key

### 4. Configurar variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=tu-project-url.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

### 5. Iniciar el servidor de desarrollo

```bash
npm run dev
```

La aplicación se abrirá en [http://localhost:5173](http://localhost:5173)

## 🗄️ Estructura de la Base de Datos

### Tabla: `camisolas`
- `id` (TEXT, PK): Identificador único de la camisola
- `equipo` (TEXT): Nombre del equipo (Real Madrid, Barcelona)
- `color` (TEXT): Color de la camisola
- `created_at` (TIMESTAMPTZ): Fecha de creación

### Tabla: `inventario`
- `id` (BIGSERIAL, PK): ID autoincrementable
- `camisola_id` (TEXT, FK): Referencia a la camisola
- `talla` (TEXT): Talla (S, M, L, XL)
- `cantidad` (INTEGER): Cantidad en stock
- `updated_at` (TIMESTAMPTZ): Última actualización

### Tabla: `movimientos_inventario`
- `id` (BIGSERIAL, PK): ID autoincrementable
- `camisola_id` (TEXT, FK): Referencia a la camisola
- `talla` (TEXT): Talla del producto
- `tipo` (TEXT): 'entrada' o 'salida'
- `cantidad` (INTEGER): Cantidad del movimiento
- `fecha` (DATE): Fecha del movimiento
- `descripcion` (TEXT): Descripción opcional
- `created_at` (TIMESTAMPTZ): Timestamp de creación

## 📁 Estructura del Proyecto

```
inventariocamisolas/
├── src/
│   ├── components/
│   │   ├── Filters.tsx              # Componente de filtros
│   │   ├── InventarioTable.tsx      # Tabla de inventario
│   │   ├── StockMovementModal.tsx   # Modal de movimientos
│   │   └── PDFExport.tsx            # Exportación a PDF
│   ├── hooks/
│   │   ├── useInventario.ts         # Hook para datos de inventario
│   │   ├── useMovimientos.ts        # Hook para movimientos
│   │   └── useCamisolas.ts          # Hook para productos
│   ├── lib/
│   │   └── supabase.ts              # Cliente de Supabase
│   ├── types/
│   │   └── index.ts                 # Definiciones TypeScript
│   ├── App.tsx                      # Componente principal
│   ├── App.css                      # Estilos globales
│   └── main.tsx                     # Punto de entrada
├── supabase_schema.sql              # Schema de la base de datos
├── package.json
├── vite.config.ts
├── tsconfig.json
└── .env.example
```

## 🎯 Uso

### Ajustar Stock Rápidamente
- Usa los botones **+** y **-** en la tabla para ajustar cantidades

### Registrar Movimientos
1. Click en **"+ Registrar Movimiento"**
2. Selecciona producto, talla, tipo (entrada/salida) y cantidad
3. Agrega una descripción opcional
4. Confirma

### Filtrar Inventario
- Usa los filtros de equipo, color y talla
- Click en **"Limpiar Filtros"** para resetear

### Exportar Reportes
- Click en **"📄 Exportar PDF"** para descargar el reporte actual

## 🛠️ Comandos Disponibles

```bash
npm run dev      # Iniciar servidor de desarrollo
npm run build    # Compilar para producción
npm run preview  # Vista previa de producción
npm run lint     # Ejecutar linter
```

## 🎨 Tecnologías Utilizadas

- **React 18**: Biblioteca UI
- **TypeScript**: Tipado estático
- **Vite**: Build tool y dev server
- **Supabase**: Backend y base de datos PostgreSQL
- **jsPDF**: Generación de PDFs
- **CSS Modules**: Estilos con scope local

## 📝 Datos Iniciales

El sistema incluye 7 camisolas pre-cargadas:

**Real Madrid:**
- Blanca
- Negra
- Azul

**Barcelona:**
- Azulgrana
- Verde Serpiente
- Rosa Coral
- Lamine Yamal

## 🔒 Seguridad

- Las políticas RLS están configuradas para acceso público
- **IMPORTANTE**: En producción, configura políticas más restrictivas
- Considera implementar autenticación de usuarios

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

## 🤝 Soporte

Para problemas o preguntas, revisa:
- Documentación de Supabase: https://supabase.com/docs
- Documentación de Vite: https://vitejs.dev
- Documentación de React: https://react.dev

---

**Desarrollado con ❤️ para la gestión eficiente de inventarios**
