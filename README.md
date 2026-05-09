# MediCitas — Sistema de Gestión de Citas Médicas

Aplicación web para la gestión de citas médicas de una clínica. Cumple los requerimientos del **Documento de Requerimientos del Sistema**.

> 100% estática: HTML + CSS + JavaScript. Sin backend, sin base de datos, sin dependencias. Persistencia en `localStorage` del navegador. Se despliega gratis en **Cloudflare Pages** en menos de 5 minutos.

---

## 🩺 Funcionalidades implementadas

Todos los Requerimientos Funcionales (RF) del documento:

| ID | Requerimiento | Dónde se cumple |
|----|---------------|-----------------|
| **RF-001** | Registrar nueva cita médica | Vista Citas → "Nueva cita" |
| **RF-002** | Evitar doble asignación al mismo médico/hora | Validación al guardar (toast de error) |
| **RF-003** | Consultar citas por paciente | Vista Citas (con buscador por paciente) |
| **RF-004** | Mostrar horarios disponibles de los médicos | Vista Agenda |
| **RF-005** | Cancelar cita médica | Botón ❌ en la fila de la cita |
| **RF-006** | Reprogramar cita | Botón ✏️ en la fila → cambia fecha/hora |
| **RF-007** | Registrar datos básicos de pacientes | Vista Pacientes |
| **RF-008** | Inicio de sesión de usuarios | Pantalla de login (3 roles) |
| **RF-009** | Calendario diario del médico | Vista Agenda (slots por médico/fecha) |
| **RF-010** | Reportes de citas por día | Vista Reportes (con exportación CSV) |

Requerimientos No Funcionales:

- **RNF-001 Rendimiento:** carga instantánea (sitio estático servido por CDN de Cloudflare).
- **RNF-002 Disponibilidad 24/7:** garantizado por Cloudflare Pages.
- **RNF-003 Usabilidad:** interfaz limpia, navegación por sidebar, vistas separadas por dominio.
- **RNF-004 Seguridad:** autenticación por usuario/contraseña antes de acceder al sistema.
- **RNF-005 Compatibilidad:** funciona en cualquier navegador moderno (Chrome, Firefox, Edge, Safari).

---

## 🔐 Usuarios de prueba

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| `admin` | `admin123` | Administrador |
| `medico` | `medico123` | Médico |
| `recepcion` | `recep123` | Personal administrativo |

---

## 📁 Estructura de archivos

```
clinica-citas/
├── index.html      ← estructura HTML
├── styles.css      ← estilos visuales
└── app.js          ← lógica de la aplicación
```

Solo 3 archivos. Nada que compilar.

---

## 🚀 Despliegue en Cloudflare Pages (gratis)

### Opción A — Subida directa (la más rápida, sin Git)

1. Ingresa a [https://dash.cloudflare.com](https://dash.cloudflare.com) y crea una cuenta gratuita.
2. En el menú lateral, ve a **Workers & Pages** → **Create** → pestaña **Pages** → **Upload assets**.
3. Asigna un nombre al proyecto, por ejemplo: `medicitas`.
4. Arrastra los 3 archivos (`index.html`, `styles.css`, `app.js`) o la carpeta completa.
5. Click **Deploy site**.
6. Listo — Cloudflare te entrega una URL del tipo: `https://medicitas.pages.dev`.

### Opción B — Conectado a GitHub (recomendado para actualizaciones)

1. Sube la carpeta a un repositorio de GitHub.
2. En Cloudflare: **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
3. Selecciona el repositorio.
4. Configuración de build:
   - **Framework preset:** *None*
   - **Build command:** *(vacío)*
   - **Build output directory:** `/`
5. Click **Save and Deploy**.

A partir de ahí, cada `git push` redespliega automáticamente.

---

## 🧪 Pruebas locales (antes de subir)

No requiere servidor, basta con abrir `index.html` directamente en el navegador.

Si prefieres servirlo con un mini-servidor local:

```bash
# Python 3
python3 -m http.server 8080

# Node
npx serve .
```

Luego abre `http://localhost:8080`.

---

**Equipo — Análisis y Diseño de Sistemas**
Cristian Camilo Barragan Yagama · Maria Camila Franco Morales