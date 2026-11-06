const stats = ['Potriviri noi', 'Colaborări active', 'Mesaje necitite']

const box = 'rounded-lg border border-dashed border-slate-400 bg-slate-100 p-5'

export default function Dashboard() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Dashboard</h1>

      <div className="grid gap-5 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s} className={box}>
            <p className="text-sm text-slate-500">{s}</p>
            <p className="mt-1 text-3xl font-bold">0</p>
          </div>
        ))}
      </div>

      <div className={`${box} mt-5`}>
        <p className="font-bold">Treapta curentă: Start</p>
        <div className="mt-3 h-2.5 rounded-full bg-slate-300">
          <div className="h-2.5 w-[30%] rounded-full bg-slate-700" />
        </div>
        <p className="mt-2 text-sm text-slate-500">Progres spre „Verificat"</p>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <div className={`${box} min-h-48`}>
          <p className="font-bold">Potriviri noi</p>
          <p className="mt-2 text-slate-500">Listă de carduri scurte</p>
        </div>
        <div className={`${box} min-h-48`}>
          <p className="font-bold">Colaborări active</p>
          <p className="mt-2 text-slate-500">Listă cu stare: în lucru / livrat</p>
        </div>
      </div>
    </div>
  )
}