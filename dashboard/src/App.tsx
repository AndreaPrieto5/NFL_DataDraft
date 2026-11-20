import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { obtenerEquipos, obtenerReporte, obtenerResumen, USAR_DATOS_FALSOS } from './api'
import type { ReporteRival } from './tipos'

const pct = (x: number) => `${(x * 100).toFixed(1)}%`

function Tarjeta({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-gray-500">{titulo}</p>
      <p className="text-3xl font-bold text-gray-900">{valor}</p>
    </div>
  )
}

export default function App() {
  const [equipos, setEquipos] = useState<string[]>([])
  const [equipo, setEquipo] = useState('')
  const [reporte, setReporte] = useState<ReporteRival | null>(null)
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const [resumen, setResumen] = useState('')
  const [errorResumen, setErrorResumen] = useState('')
  const [cargandoResumen, setCargandoResumen] = useState(false)

  useEffect(() => {
    obtenerEquipos()
      .then((lista) => {
        setEquipos(lista)
        if (lista.length > 0) setEquipo(lista[0])
      })
      .catch(() => setError('No se pudo cargar la lista de equipos.'))
  }, [])

  useEffect(() => {
    if (!equipo) return
    let vigente = true // evita que una respuesta lenta pise a la del equipo actual
    setCargando(true)
    setError('')
    setResumen('')
    setErrorResumen('')
    obtenerReporte(equipo)
      .then((r) => {
        if (vigente) setReporte(r)
      })
      .catch(() => {
        if (vigente) {
          setReporte(null)
          setError('No se pudo cargar el reporte de este equipo.')
        }
      })
      .finally(() => {
        if (vigente) setCargando(false)
      })
    return () => {
      vigente = false
    }
  }, [equipo])

  async function pedirResumen() {
    const objetivo = equipo
    setCargandoResumen(true)
    setErrorResumen('')
    setResumen('')
    try {
      const r = await obtenerResumen(objetivo)
      if (objetivo === equipo) setResumen(r.resumen)
    } catch {
      setErrorResumen('No se pudo generar el resumen con IA. El reporte de arriba sigue siendo válido.')
    } finally {
      setCargandoResumen(false)
    }
  }

  const datosGrafica = (reporte?.por_posicion ?? []).map((p) => ({ ...p, tasaPct: Number((p.tasa * 100).toFixed(1)) }))

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Reporte del rival: protección del mariscal</h1>
          <p className="text-gray-600">Presiones permitidas por la línea ofensiva rival, semanas 1 a 8 de 2021.</p>
        </div>
        <label className="text-sm text-gray-700">
          Equipo rival
          <select
            className="ml-2 rounded border border-gray-300 bg-white px-3 py-2 text-base"
            value={equipo}
            onChange={(e) => setEquipo(e.target.value)}
          >
            {equipos.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </label>
      </header>

      {USAR_DATOS_FALSOS && (
        <p className="rounded bg-yellow-100 px-3 py-2 text-sm text-yellow-900">Mostrando datos de ejemplo, no reales.</p>
      )}
      {error && <p className="rounded bg-red-100 px-3 py-2 text-sm text-red-800">{error}</p>}
      {cargando && <p className="text-gray-500">Cargando…</p>}

      {reporte && !cargando && (
        <>
          <section className="grid grid-cols-2 gap-4">
            <Tarjeta titulo="Jugadas de pase" valor={String(reporte.jugadas_pase)} />
            <Tarjeta titulo="Tasa de presión" valor={pct(reporte.tasa_presion)} />
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="mb-2 text-lg font-semibold">Tasa de presión permitida por posición</h2>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosGrafica}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="posicion" />
                  <YAxis unit="%" />
                  <Tooltip formatter={(v) => [`${v}%`, 'Tasa']} />
                  <Bar dataKey="tasaPct" fill="#2F7D4F" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="mb-2 text-lg font-semibold">Por situación</h2>
            <table className="w-full text-left text-sm">
              <thead className="border-b text-gray-500">
                <tr>
                  <th className="py-2">Situación</th>
                  <th className="py-2 text-right">Jugadas</th>
                  <th className="py-2 text-right">Tasa de presión</th>
                </tr>
              </thead>
              <tbody>
                {reporte.por_situacion.map((f) => (
                  <tr key={f.situacion} className="border-b last:border-0">
                    <td className="py-2">{f.situacion}</td>
                    <td className="py-2 text-right">{f.jugadas}</td>
                    <td className="py-2 text-right">{pct(f.tasa_presion)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Resumen para el coach</h2>
              <button
                className="rounded bg-green-700 px-4 py-2 text-white hover:bg-green-800 disabled:opacity-50"
                onClick={pedirResumen}
                disabled={cargandoResumen}
              >
                {cargandoResumen ? 'Generando…' : 'Resumen para el coach'}
              </button>
            </div>
            {errorResumen && <p className="rounded bg-red-100 px-3 py-2 text-sm text-red-800">{errorResumen}</p>}
            {resumen && <p className="whitespace-pre-line text-gray-800">{resumen}</p>}
          </section>
        </>
      )}
    </main>
  )
}
