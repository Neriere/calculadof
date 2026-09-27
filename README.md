# Calculadora de Experiencia y Rentabilidad • Dofus Unity

Herramienta técnica modular diseñada para el cálculo matemático preciso, optimización de conjuntos de sabiduría y análisis de rentabilidad económica en las mazmorras de leveo dimensional de **Dofus Unity**:

* **Fábrica de Malefíscof** *(Anutropía • Nivel 100)*
* **Palacio del Rey Nidas** *(Anutropía • Nivel 220)*
* **Trono de la Corte Tenebrosa — Reina de los Ladrones** *(Sramvil • Nivel 220)*
* **Coto del Venerable — Venerable Durmiente** *(Osavora • Nivel 220)*

---

## Modos de Ejecución y Requisitos

### Opción 1: Ejecución Directa 

* **Requisitos:** Ninguno. Solo un navegador web moderno (Edge, Chrome, Firefox, Opera, Brave o Safari).
* **Cómo usarlo:**
  1. Descarga o clona el repositorio.
  2. Haz doble clic sobre el archivo `index.html`.
* **Persistencia:** Al ejecutarse como archivo local (`file:///`), los perfiles y niveles modificados se guardan automáticamente en el almacenamiento local del navegador (`localStorage`) y pueden exportarse o importarse en formato JSON (`xp_sets.json`) con un solo clic.

---

### Opción 2: Modo Servidor Local (Node.js + Vite)
Recomendado para desarrollo o para guardar cambios directamente sobre el archivo `xp_sets.json` en disco en tiempo real.

* **Requisitos:** [Node.js](https://nodejs.org/) (versión 18 o superior) y `npm`.
* **Pasos para iniciar:**
  ```bash
  # 1. Instalar dependencias de desarrollo
  npm install

  # 2. Iniciar el servidor local
  npm run dev
  ```
* Abre tu navegador en la URL indicada por Vite (por defecto `http://localhost:5173/`).
* **Sincronización en disco:** Cualquier modificación guardada en la interfaz se escribirá directamente en el archivo `xp_sets.json` mediante la API local integrada en `vite.config.js`.

Para compilar los archivos optimizados para distribución:
```bash
npm run build
```

---

## Funcionalidades Principales

1. **Fórmulas Oficiales de Experiencia Dofus Unity:**
   * **Regla del tercio (*Règle du tiers*):** Cálculo automático del umbral de nivel mínimo (`ceil(MaxLevel / 3)`) necesario para activar los multiplicadores de grupo.
   * **Multiplicadores de grupo:** Coeficientes oficiales de B2 a B8 según miembros que alcanzan el tercio del nivel.
   * **Cuota proporcional:** Distribución equitativa por ratio de nivel del combatiente frente al nivel total del grupo.
   * **Bonificadores acumulativos:** Gremio (+50%), pócimas de experiencia de combate (+50%, +100%, +200%), retos de combate y anomalías de zona.
   * **Capital de sabiduría automático:** Asignación matemática de puntos de capital por nivel subido (coste 3 a 1).

2. **Tabla Técnica de Monstruos por Mazmorra:**
   * Catálogo completo con ilustraciones individuales de los 24 monstruos de las 4 familias.
   * Desglose de experiencia base por monstruo según rango (R1 a R5/R6).
   * Identificación de monstruos de experiencia fija (*Anfibuco* e *Hiperpótamo*, 121.000 XP plana) vs monstruos con escalado dinámico. Cualquier cambio se debe realizar manualmente en el archivos dungeonsData.js
   * Cálculo de XP base acumulada del combate en 5 oleadas según el tamaño del botín seleccionado.

3. **Editor de Conjuntos de Sabiduría (Set 1 vs Set 2):**
   * Comparativa visual entre Set 1 y Set 2 .
   * Edición directa sobre la tabla y guardado inmediato.

4. **Comparador de Mazmorras y Rentabilidad:**
   * Comparativa simultánea de las 4 mazmorras según nivel objetivo.
   * Estimación de rondas necesarias de nivel inicial a 199 y de 199 a 200.
   * Tiempo total estimado de leveo.
   * Presupuesto acumulado de llaves por mula y por grupo completo de 8 jugadores.

5. **Gestor de Perfiles y Persistencia JSON:**
   * Múltiples configuraciones guardadas con nombres personalizados.
   * Opciones para Crear nuevo perfil, Duplicar, Renombrar, Eliminar, Exportar e Importar base de datos en formato JSON.

---

## Estructura del Proyecto

```text
Calculadora de XP/
├── index.html              # Estructura semántica principal y marcado de la interfaz
├── styles.css              # Sistema de diseño, paleta formal y estilos responsivos
├── app.js                  # Coordinador de inicio y estado reactivo global (AppState)
├── xp_sets.json            # Base de datos JSON de perfiles y conjuntos de sabiduría
├── package.json            # Configuración de scripts y dependencias (Vite)
├── vite.config.js          # Configuración del servidor y API local de persistencia
├── .gitignore              # Reglas de exclusión para control de versiones
├── js/
│   ├── data/
│   │   ├── dungeonsData.js    # Fichas técnicas, coeficientes y catálogo de monstruos
│   │   ├── wisdomSetsData.js  # Conjuntos maestros predefinidos de sabiduría (Nivel 50-199)
│   │   └── xpTable.js         # Curva oficial acumulada de XP (Nivel 1 a 200)
│   ├── engine/
│   │   ├── database.js        # Gestor de perfiles y sincronización con xp_sets.json
│   │   └── simulator.js       # Motor matemático de simulación combate a combate
│   └── ui/
│       ├── events.js          # Controladores de eventos e interacción de controles
│       └── renderer.js        # Renderizado reactivo de KPIs, tablas y progreso
└── mobs/                   # Ilustraciones oficiales descargadas de DofusDB
    ├── Malefiscof/            # 6 imágenes PNG de la Fábrica de Malefíscof
    ├── Nidas/                 # 6 imágenes PNG del Palacio del Rey Nidas
    ├── Reina/                 # 6 imágenes PNG del Trono de la Corte Tenebrosa
    └── Venerable/             # 6 imágenes PNG del Coto del Venerable
```

---