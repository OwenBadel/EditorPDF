# 🤖 Directiva Agéntica: EditorPDF - Suite Profesional de Edición y API REST

---
project_id: "PROJ_012"
project_name: "EditorPDF"
absolute_disk_path: "d:/Proyectos/LemonFabrica/Fabrica_Software/projects/EditorPDF"
okf_project_node: "[[Proyectos/PROJ_012_EditorPDF|PROJ-012: EditorPDF]]"
architecture_node: "[[Decisiones de Arquitectura/ARQ_002_SPA_Fullstack_React_Express|ARQ-002 SPA Fullstack React + Express REST]]"
mcp_server_entrypoint: "d:/Proyectos/LemonFabrica/Fabrica_Software/mcp/server.py"
status: "active"
created_at: "2026-09-27T17:35:00-05:00"
github_repo: "https://github.com/OwenBadel/EditorPDF.git"
---

## 🎯 1. Identidad y Autoría
Este proyecto es diseñado y desarrollado bajo la titularidad y dirección de **Owen Badel Hooker** (Ingeniero de Sistemas / Software Architect).
Directorio local en disco duro:
`d:/Proyectos/LemonFabrica/Fabrica_Software/projects/EditorPDF`

### Roles Operativos en este Proyecto:
1. **Orquestador (ROL-001):** Supervisa el plan de entrega, dependencias y cumplimiento OKF.
2. **Desarrollador (ROL-004):** Construye la solución modular, tipada y sin código espagueti.
3. **Evaluador / QA (ROL-005):** Audita calidad, estándares y bloquea código roto antes del commit.
4. **Documentador (ROL-006):** Mantiene la bitácora (`README.md`), docstrings y notas OKF en español.
5. **Tester (ROL-007):** Diseña y ejecuta suites de pruebas y validaciones automatizadas.

---

## 🧭 2. Enrutamiento Determinista al Cerebro OKF (Cero Reinvención)
Antes de proponer o codificar, el agente debe navegar deterministamente hacia el árbol del cerebro:

| Si necesitas... | Acude al Árbol de Conocimiento | Acción Obligatoria |
| :--- | :--- | :--- |
| **Modelos de Diseño y Arquitectura** | `vault/Decisiones de Arquitectura/` | Aplicar patrones desacoplados y REST stateless. |
| **Habilidades y Snippets Probados** | `vault/Técnicas/` | Reutilizar manipulación de PDF (`pdf-lib`, `PyMuPDF`). |
| **Librerías JS/TS Frontend** | `vault/Librerías JS/` | React 19, TailwindCSS v4, Lucide React, PDF.js, Tesseract.js. |
| **Librerías Backend Node/Python** | `vault/Python/` y `package.json` | Express, Multer, Mammoth, Archiver, pdf-lib, FastAPI. |
| **Resolución de Errores y Bugs** | `vault/Errores y Soluciones/` | Consultar post-mortems previos o registrar uno nuevo. |

---

## 🏛️ 3. Marco Arquitectónico y Estándares
Este proyecto implementa:
* **Arquitectura Canónica:** [[Decisiones de Arquitectura/ARQ_002_SPA_Fullstack_React_Express|ARQ-002 SPA Fullstack React + Express]]
* **Frontend:** React 19 + TypeScript + TailwindCSS v4 + Canvas Interactivo para firmas, resaltados y notas.
* **Backend REST Stateless:** Express + TypeScript + Multer con streaming y limpieza reactiva de temporales.
* **OpenAPI / Swagger:** Especificación OpenAPI 3.0 interactiva servida en `/api/docs` y `/api/openapi.json`.

---

## 📦 4. Librerías y Dependencias Autorizadas
- **Frontend:** `react`, `react-dom`, `@tailwindcss/vite`, `lucide-react`, `pdf-lib`, `pdfjs-dist`, `tesseract.js`, `mammoth`.
- **Backend:** `express`, `multer`, `archiver`, `dotenv`, `tsx`, `esbuild`.

---

## 🚦 5. Protocolo de Ejecución y Calidad
1. **Verificación Estricta:** Comprobar `npm run lint` (`tsc --noEmit`) y `npm run build` antes de realizar commits.
2. **Cero Placeholders:** Funcionalidad real implementada de extremo a extremo.
3. **Manejo de Errores y Resiliencia:** Límites de tamaño de archivo (20MB), validación MIME y códigos HTTP semánticos.

---

## 🚀 6. Repositorio Git Individual y Commits Autónomos a GitHub
* **Aislamiento Total:** Este proyecto posee su propio repositorio Git con remoto `https://github.com/OwenBadel/EditorPDF.git`.
* **Creación Desatendida con `gh` CLI:** `gh repo create EditorPDF --public --source=. --push`.
* **Commits en Español:** Commits semánticos en español (`feat:`, `fix:`, `docs:`, `refactor:`).
