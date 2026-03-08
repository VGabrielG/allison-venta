# Estructura de Base de Datos - Boutique del Hogar

Este documento describe la estructura utilizada en la base de datos de la aplicación, que hace uso de **Firebase Firestore** (Base de datos NoSQL) y **Firebase Storage** (Almacenamiento de archivos).

## 1. Cloud Firestore

Toda la información principal de los productos se almacena en una única colección llamada `products`. Cada documento dentro de esta colección representa un producto individual.

### Colección: `products`

**Estructura del Documento (Modelo de Datos):**

- **`id`** (String): El identificador único del documento generado automáticamente por Firestore (no se guarda obligatoriamente como campo al crearlo, pero se obtiene al leer el documento).
- **`title`** (String): Título o nombre del producto.
- **`description`** (String): Descripción detallada del producto.
- **`price`** (Number): Precio del producto en CLP.
- **`category`** (String): Categoría a la que pertenece el producto. Valores posibles:
  - `'hogar'`
  - `'ropa'`
  - `'licores'`
- **`orientation`** (String): Define cómo se deben visualizar las imágenes del producto en la grilla. Valores posibles:
  - `'square'` (Cuadrado 1:1)
  - `'portrait'` (Vertical 3:4)
  - `'landscape'` (Horizontal 16:9)
- **`condition`** (String, *Opcional*): Estado del producto. Valores posibles: `'Nuevo'`, `'Como Nuevo'`, `'Usado'`.
- **`imageUrls`** (Array de Strings): Lista de URLs públicas de descarga de las imágenes del producto almacenadas en Firebase Storage.
- **`storagePaths`** (Array de Strings): Lista de las rutas exactas donde están guardados los archivos originales de las imágenes en Firebase Storage. Esto es crucial para poder eliminarlas del almacenamiento cuando se borra o edita un producto.

*(Nota de compatibilidad: Inicialmente el sistema usaba `imageUrl` y `storagePath` como strings simples para una sola imagen. El servicio `FirebaseService` de Angular hace una adaptación automática convirtiéndolos a Arrays para soportar múltiples imágenes sin romper productos antiguos).*

## 2. Firebase Storage

Firebase Storage se utiliza exclusivamente para almacenar los archivos de imagen subidos por los usuarios para cada producto.

**Estructura de Directorios:**

Las imágenes se organizan en carpetas según la categoría del producto al que pertenecen, siguiendo esta ruta:

`product-images/{category}/{timestamp}_{filename}`

- **`{category}`**: Será `hogar`, `ropa` o `licores`.
- **`{timestamp}`**: Un número generado por `Date.now()` para asegurar un nombre único e impedir que archivos con el mismo nombre se sobreescriban.
- **`{filename}`**: El nombre original del archivo subido.

**Ejemplo de ruta:**
`product-images/hogar/1715432109876_sofa.jpg`

---
**IMPORTANTE AL MODIFICAR:**
Para evitar dejar archivos "huérfanos" (archivos que ocupan espacio pero no pertenecen a ningún producto visible), la lógica de la aplicación debe garantizar que, si un producto es eliminado, se borren también todas las rutas que figuran en el arreglo `storagePaths` de ese producto. Lo mismo aplica si el usuario edita el producto y decide quitar una de sus imágenes.
