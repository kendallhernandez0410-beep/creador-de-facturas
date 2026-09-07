# Sistema de Facturación Electrónica • AutoFix Express S.A.
### Evaluación Práctica de Desarrollo Front-End en React (Quiz #3)

Aplicación web de página única (**Single Page Application - SPA**) desarrollada en **React**, concebida para la gestión, emisión, visualización, despacho por correo electrónico y persistencia en base de datos **`db.json`** de facturas electrónicas en **Colones Costarricenses (₡ CRC)** para la empresa automotriz **AutoFix Express S.A.**

---

## 1. Tecnologías y Herramientas

* **React 19**: Componentes funcionales, Hooks estándar (`useState`, `useEffect`, `useParams`).
* **React Router Dom v7**: Enrutamiento declarativo del lado del cliente.
* **Tailwind CSS v3**: Diseño formal e institucional basado en el estándar de Comprobantes Electrónicos de Costa Rica.
* **db.json / JSON-Server**: Base de datos en archivo local JSON para almacenar todas las facturas y persistencia híbrida.
* **Vite**: Entorno de compilación y empaquetado optimizado.

---

## 2. Estructura de Carpetas y Arquitectura

```text
├── db.json                      # Base de datos en formato JSON (colección de facturas)
src/
├── components/                  # Componentes de interfaz de usuario
│   ├── Invoice.jsx              # Factura Electrónica en Colones (₡) con clave numérica y código de barras
│   ├── InvoiceForm.jsx          # Formulario de emisión en Colones con guardado en db.json
│   ├── InvoiceList.jsx          # Tabla de registro en Colones con indicadores y estado vacío
│   ├── InvoiceView.jsx          # Adaptador de vista para Invoice
│   └── Navbar.jsx               # Encabezado formal corporativo
├── pages/                       # Vistas de la aplicación
│   ├── InvoiceListPage.jsx      # Vista del listado general
│   ├── InvoiceFormPage.jsx      # Vista del formulario de emisión
│   └── InvoiceViewPage.jsx      # Vista de la factura individual
├── routes/                      # Enrutamiento centralizado
│   └── AppRoutes.jsx            # Configuración de rutas (/ , /create, /invoice/:id)
├── services/                    # Capa de datos
│   └── invoiceService.js        # Integración con db.json / json-server y almacenamiento local
├── utils.js                     # Cálculos matemáticos (.reduce()) y formateador de Colones formatCRC()
├── App.jsx                      # Estado global sincronizado con db.json
├── main.jsx                     # Punto de entrada de React
└── index.css                    # Estilos globales y Tailwind CSS
```

---

## 3. Cumplimiento de Requerimientos y Novedades

### 3.1. Moneda Oficial: Colones Costarricenses (₡ CRC)
* Todos los precios, subtotales, IVA (13%) y totales están calculados y formateados en **Colones (₡)** con separador de miles y dos decimales (ejemplo: `₡ 127.690,00`).
* Helper especializado `formatCRC()` en `src/utils.js`.

### 3.2. Base de Datos en `db.json`
* El archivo `db.json` ubicado en la raíz del proyecto almacena la colección `invoices`.
* El servicio `src/services/invoiceService.js` administra las operaciones de lectura, creación y eliminación.
* Si ejecutas `json-server`, se conecta como API REST en `http://localhost:5000/invoices`. Si ejecutas únicamente `npm run dev`, el sistema utiliza los datos iniciales de `db.json` con persistencia automática en el navegador sin interrupciones.

### 3.3. Nuevo Diseño de Factura Electrónica Formal
* **Membrete de Factura Electrónica**: Adaptado al formato oficial de comprobante del Ministerio de Hacienda de Costa Rica.
* **Clave Numérica Fiscal**: Bloque con la clave oficial de 50 dígitos (`506...`).
* **Representación Gráfica de Código de Barras**: Código de barras de seguridad fiscal y firma digital autorizada.
* **Liquidación en Colones (₡)**: Detalle claro de Subtotal, 13% de IVA y Total a Pagar.
* **Términos de Garantía de Taller**: Cláusulas formales de garantía para mano de obra y repuestos automotrices.

### 3.4. Envío de Facturas al Correo Electrónico
* Botón **"Enviar al Correo"** con modal interactivo para confirmar el destinatario y asunto.
* Genera la liquidación completa en Colones (₡) y abre el cliente de correo predeterminado mediante protocolo `mailto:`.

---

## 4. Instrucciones de Ejecución

### Opción A: Ejecución Estándar (Vite)
1. Abrir la terminal en la carpeta del proyecto.
2. Instalar las dependencias (si no lo ha hecho):
   ```bash
   npm install
   ```
3. Iniciar la aplicación web:
   ```bash
   npm run dev
   ```
4. Ingresar a `http://localhost:5173`.

### Opción B: Ejecución con Servidor de Base de Datos REST (JSON-Server)
Para levantar simultáneamente el servidor de base de datos con `db.json` en el puerto 5000 y el cliente Vite:
```bash
npm run dev:all
```
O de forma independiente en dos terminales:
* Terminal 1: `npm run server` (Inicia JSON-Server en `http://localhost:5000/invoices` observando `db.json`).
* Terminal 2: `npm run dev` (Inicia la aplicación React en `http://localhost:5173`).
