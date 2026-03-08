# Estructura del Proyecto y Funcionalidades - Boutique del Hogar

Este documento sirve como guía rápida para entender la arquitectura y comportamiento del sistema, evitando introducir errores al modificar el código.

## 1. Estructura del Proyecto (Angular Standalone)

El proyecto es una aplicación web desarrollada usando **Angular** (con enfoque en componentes Standalone). 

**Directorio principal de código:** `src/app/`

- **`app.config.ts` y `app.routes.ts`**: Configuración principal de Angular y enrutamiento (Routing de la app).
- **`app.ts`**: El componente raíz de la aplicación. Contiene un menú de navegación central que permite transicionar entre las tres categorías de productos (que funcionan como páginas).
- **Carpetas de páginas / categorías**: La app está dividida en tres verticales idénticas en funcionalidad básica pero distintas en el grupo de datos que muestran:
  - **`hogar/hogar.ts`**: Componente que lista los productos de la categoría *'hogar'*.
  - **`ropa/ropa.ts`**: Componente para la categoría *'ropa'*.
  - **`licores/licores.ts`**: Componente para la categoría *'licores'*.
- **Carpeta de Servicios**:
  - **`services/firebase.service.ts`**: Centraliza **TODA** la lógica de comunicación con Firebase. Se encarga de la inicialización de Firebase, consultas a Firestore (con `onSnapshot` para modo real-time) y subidas o borrado de archivos de imagenes en Firebase Storage. Es el único lugar donde se manipula directamente la API de Firebase.
- **`styles.css`**: Archivo de estilos globales de la aplicación. Contiene el diseño CSS de la grilla de productos, barra superior, modales flotantes, notificaciones y elementos de la interfaz, asegurando un diseño general y adaptable (responsive).

## 2. Funcionalidades Principales

Cada componente de categoría (`hogar`, `ropa`, `licores`) implementa de forma independiente (replicada) la misma serie de características centrales. 

### 2.1 Visualización y Filtrado de Productos
- **Sincronización en Tiempo Real:** Al inicializarse el componente (`ngOnInit`), se suscribe a Firestore mediante un listener en tiempo real (`firebase.service.listenProducts(category)`), trayendo los productos y refrescando automáticamente la pantalla en caso de que agreguen o borren cosas de la base de datos remotamente.
- **Barra de Búsqueda y Ordenamiento:** El usuario puede buscar un producto filtrando en el cliente tanto por título como por descripción. Adicionalmente puede ordenar todo por precio de menor a mayor o viceversa.
- **Cálculo de Total (Inventario):** La app permite visualizar el valor total sumado de todos los productos que actualmente se encuentren filtrados en pantalla. También muestra en todo momento cuántos productos son visibles usando un modal especial de totalidad.

### 2.2 Rejilla de Productos e Imágenes Multimedia
- **Tarjetas CSS de Productos (Cards):** Cada producto se presenta en una tarjeta.
- **Listado y Carrusel Multi-imagen:** Un mismo producto admite una o múltiples fotos. Si hay varias fotos (campo `imageUrls` tiene más de 1 elemento), la tarjeta adapta un diseño con un scroll horizontal para navegar dichas imágenes de forma interna.
- **Control de Aspecto/Orientación:** Por configuración al añadir el producto, se puede encajar la imagen para que se muestre cuadrada (`square`), vertical (`portrait`) o apaisada horizontalmente (`landscape`).
- **Visor Pantalla Completa:** Pinchando sobre una imagen de un producto, la imagen original se abre flotando para ver al detalle.

### 2.3 Sistema CRUD (Crear, Editar, Eliminar)
Las modificaciones en los productos se realizan mediante ventanas flotantes (Modales) personalizadas contenidas dentro de los componentes.

- **Añadir Producto (`openAddModal`):** Abre un formulario con título, descripción, precio y permite cargar imágenes (las cuales son pre-visualizadas en local gracias a `FileReader`).
- **Editar Producto (`openEditModal`):** Permite cambiar los detalles del producto de base, y además permite agregar, o eliminar libremente las fotos que tenga el producto. Al guardar los cambios, la app consolida qué fotos nuevas hay que subir, cuáles fotos viejas hay que borrar en el Storage y qué datos mutaron en el Firestone (base de datos).
- **Eliminar Producto (`confirmDelete`):** Lanza un modal de prevención de borrado. Si se confirma, borra cada imagen del Storage atada a al sistema por medio de `storagePaths` y en última instancia elimina el producto físico de Firestore.

### 2.4 Generación de Catálogo PDF
- **Descargar PDF:** Permite al locatario exportar la lista de productos actual. 
- **Flujo PDF:** Se utiliza `html2canvas` para registrar la imagen actual del HTML generado (capturando exactamente lo que se ve en la pantalla de grillas, ignorando botones, scroll bars o los modales). Posteriormente, este "pantallazo" en alta calidad se inyecta en un documento de libre exportación usando la biblioteca `jsPDF` y se baja inmediatamente a la PC bajo el formato de un catálogo listo para imprimir.

## 3. Consideraciones para IAs e Integraciones Futuras

1. **Centralización Firebase:** Cualquier nuevo método de escritura, recolección o escucha hacia Firebase **DEBE** ir sí o sí en `firebase.service.ts` como una función pura, jamás inyectando llamadas directas del SDK dentro de un componente UI.
2. **Propagación de Cambios:** Actualmente, el diseño HTML/TypeScript y lógica de un producto se encuentra duplicado tres veces en `hogar.ts`, `ropa.ts` y `licores.ts`. Si vas a introducir un cambio importante en la lógica del Modal (por ejemplo un campo nuevo), un rediseño de CSS en el botón principal, o en cómo se guardan productos... **Deberás aplicar el cambio a los tres componentes** por igual para evitar desfases.
3. **Mantenimiento del PDF (`downloadPDF`):** Al tocar el CSS del Layout Principal o inyectar contenedores fijos (`fixed`), hay que tener cuidado con el comportamiento en la impresión PDF, y asegurar su invisibilidad pre-renderizado en este método (ej. usando la función de ocultamiento temporal por ID/clase `hide()`).
