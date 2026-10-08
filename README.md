# Farm Battle Island 🚜⚔️🏝️

**Farm Battle Island** es un juego multijugador táctico de combate de tanques y vehículos agrícolas por turnos en 2D, construido con **React, TypeScript, Vite, Canvas 2D procedural** y **Firebase / Firestore**.

---

## 🎮 Características Principales

- **Arquitectura Híbrida**:
  - **Mundo y Simulación en Canvas 2D**: Renderizado de islas procedurales, destrucción y deformación del terreno al impacto, física balística con gravedad y viento, vehículos dinámicos, agua con olas y salpicaduras, humo, explosiones de partículas y cámara cinemática dinámica.
  - **HUD y Menús en React**: Interfaz reactiva para barras de vida (HP), temporizadores de turno, selección de potencia/ángulo, selector de proyectiles y power-ups, ranking TOP 50, lobby de partidas online y panel administrativo.
- **Modos de Juego**:
  - **Partida Rápida (vs IA)**: Algoritmo de cálculo balístico táctico contra la máquina para entrenamiento inmediato.
  - **Multijugador Online en Tiempo Real**: Creación y unión a salas públicas o privadas mediante Firestore, con sincronización de estado, turnos y eventos de impacto.
- **Identidad del Jugador**: Sin login forzado; personalización de nombre de jugador con identificador persistente.
- **Personajes y Vehículos Agrícolas**:
  - 🌾 *Gallo Bombardero* (Tractor Clásico) - Equilibrado y resistente.
  - 🐖 *Cerdo Acorazado* (Tractor Blindado) - Alta defensa, proyectiles pesados.
  - 🐑 *Oveja Francotiradora* (Cosechadora) - Alta precisión, balística rápida.
  - 🐂 *Toro Demoledor* (Tractor Oruga) - Alto impacto y daño de área.
  - 🦊 *Zorro Artillero* (Pickup Ligera) - Gran movilidad y disparo rápido.
  - *Regla de Selección*: Bloqueo estricto del personaje ya elegido por el oponente (no se permiten personajes repetidos).
- **Mecánica de Partida**:
  - Opciones de duración (300 segundos o ilimitado).
  - Vidas por partida (1, 3 o 5 vidas). Al agotarse los 100 HP, se descuenta una vida y el vehículo reaparece con HP completo.
  - **Sin Pausa**: Salir o rendirse implica derrota automática inmediata.
  - **Puntuación y Ranking**:
    - 1 punto por cada 1 de daño realizado.
    - +50 puntos de bonificación de victoria (50% de la vida máxima).
    - Ranking TOP 50 ordenado por: 1º Puntos (DESC) → 2º Victorias (DESC) → 3º Derrotas (ASC).
- **Panel Administrativo (`/admin`)**:
  - Monitoreo en tiempo real de partidas activas, historial, victorias por personaje y estado de sincronización.

---

## 🛠️ Tecnologías

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Canvas 2D API.
- **Backend / Real-time**: Google Cloud Firestore & Firebase SDK.
- **Herramientas de Build**: Vite, PostCSS.

---

## 🚀 Instalación y Ejecución Local

1. **Clonar repositorio**:
   ```bash
   git clone https://github.com/tu-usuario/farm-battle-island.git
   cd farm-battle-island
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Variables de entorno**:
   Copiar `.env.example` a `.env` y configurar las credenciales de Firebase en caso de usar un proyecto propio.
   ```bash
   cp .env.example .env
   ```

4. **Ejecutar servidor de desarrollo**:
   ```bash
   npm run dev
   ```
   Abre [http://localhost:3000](http://localhost:3000) en el navegador.

5. **Compilación para producción**:
   ```bash
   npm run build
   ```

---

## 📋 Reglas de Seguridad (Firestore)

Las reglas de seguridad se encuentran en `firestore.rules` y protegen:
- Creación y actualización de partidas en la colección `/matches`.
- Idempotencia en la conclusión de partidas (una partida en estado `finished` no puede alterarse).
- Validación de que ningún jugador seleccione el mismo personaje en la misma partida.
- Heartbeats de presencia en `/presence/{playerId}`.
- Validación de puntuaciones y estadísticas en `/ranking/{playerId}`.

---

## 🎨 Regla de Assets

Farm Battle Island implementa el 100% de sus elementos visuales, efectos balísticos, agua, explosiones, partículas y terrenos mediante renderizado procedural en Canvas y estilos CSS optimizados. No depende de imágenes externas ni spritesheets generados.
