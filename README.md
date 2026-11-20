# Reporte del rival: dónde se rompe la protección del mariscal

Proyecto del hackathon NFL Big Data Bowl, UNAM.

Una herramienta para el cuerpo técnico de un equipo que se prepara para enfrentar a un rival.
Elige al rival y la app muestra en qué posiciones y en qué situaciones de juego su línea ofensiva permite más presión
al mariscal. Un botón genera con Amazon Nova un resumen de 4 a 5 recomendaciones para la defensiva propia.

## Hallazgo principal

Datos: 8,557 jugadas de pase de las semanas 1 a 8 de la temporada 2021 (32 equipos).
Una jugada cuenta como "con presión" si algún pass rusher registró hurry, hit o sack (datos de PFF).

- **La presión depende mucho de la situación.** En toda la liga pasa de 31.7 % en 1ª down a 44.3 % en 3ª/4ª y media (4-6 yardas)
  y a 50.8 % en 3ª/4ª y larga (7+ yardas, 1,306 jugadas).
- **Los tackles son el punto débil de la línea.** Por cada snap, el tackle derecho (RT) permite presión el 7.7 % de las veces
  y el izquierdo (LT) el 7.3 %. El centro (C) solo el 4.1 %.
- **Cada equipo es distinto.** La tasa de presión va de 26.2 % (TB) a 46.3 % (NO). Un ejemplo de reporte: KC sufre 73.8 % de presión
  en 3ª/4ª y larga (42 jugadas), y su RT es el bloqueador más débil de la línea, con 9.1 %.

Limitaciones: son solo 8 semanas, y algunos grupos tienen pocas jugadas, así que las tasas de grupos pequeños son poco estables
(el resumen de IA ignora los de menos de 15). La tasa de presión describe lo ocurrido, no demuestra la causa.

## Qué hace la app

- Selector de equipo rival.
- Número de jugadas de pase y tasa de presión del equipo.
- Gráfica de la tasa de presión permitida por posición (LT, LG, C, RG, RT, TE, RB, WR).
- Tabla por situación (down y distancia).
- Botón "Resumen para el coach": Amazon Nova (vía Bedrock) lee el reporte y escribe las recomendaciones.
  Si la IA no está disponible, la app muestra un aviso y el reporte sigue funcionando.

## API

| Ruta | Qué devuelve |
|---|---|
| `GET /health` | `{"status": "ok"}` |
| `GET /api/equipos` | Lista de equipos |
| `GET /api/rival/{equipo}` | Reporte del equipo: jugadas, tasa de presión, tabla por posición, por situación y por formación |
| `POST /api/rival/{equipo}/resumen` | Resumen de Nova para el coach |
| `POST /api/ia/preguntar` | Pregunta libre a Nova |

## Cómo correrlo

Stack: Python 3.12 (FastAPI, pandas), React 18 + Vite + Tailwind 3 + Recharts, y Amazon Nova con Strands Agents.

1. Instalar el entorno del evento con `sh setup.sh` (Windows: `setup.cmd`).
2. Poner los datos del Big Data Bowl en `data/nfl-big-data-bowl-regional-event-data-main/data/`
   (deben estar `plays.csv` y `pffScoutingData.csv`). La carpeta `data/` no se sube a git.
3. Opcional, para el resumen de IA: copiar `.env.example` a `.env` y pegar las llaves temporales del workshop.
4. Backend, desde la raíz del proyecto:
   ```
   .venv/bin/uvicorn backend.main:app --reload      # Windows: .venv/Scripts/uvicorn
   ```
5. Dashboard, en otra terminal:
   ```
   cd dashboard
   npm install
   npm run dev
   ```
   Abrir `http://localhost:5173`. Vite redirige `/api` al backend en el puerto 8000.

## Estructura

```
backend/     API FastAPI (main.py) y cálculos con pandas (rival.py)
dashboard/   Frontend React
data/        Datos del evento (no versionados)
```
