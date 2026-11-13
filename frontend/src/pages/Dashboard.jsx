const stats = [
  { label: 'Potriviri noi', value: 3 },
  { label: 'Colaborări active', value: 1 },
  { label: 'Mesaje necitite', value: 2 },
]

const newMatches = [
  { title: 'Site pentru frizerie', sub: 'Buget mic · 2 săptămâni', tag: '92%' },
  { title: 'Logo pentru cafenea', sub: 'Design · 1 săptămână', tag: '84%' },
]

const active = [
  { title: 'Pagină de prezentare', sub: 'Client: [Nume]', tag: 'În lucru' },
]

function Row({ item }) {
  return (
    <div className="flex items-center justify-between border-t border-line py-3.5">
      <div>
        <p className="font-semibold">{item.title}</p>
        <p className="text-[13px] text-mute">{item.sub}</p>
      </div>
      <span className="chip">{item.tag}</span>
    </div>
  )
}

export default function Dashboard() {
  return (
    <div>
      <h1 className="font-display text-4xl tracking-tight">Bună, [Nume]</h1>
      <p className="mb-6 mt-1.5 text-mute">
        Iată ce s-a întâmplat de la ultima vizită.
      </p>

      <div className="grid gap-5 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="card p-5">
            <p className="text-sm text-mute">{s.label}</p>
            <p className="mt-1 text-4xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="card mt-5 p-6">
        <div className="flex justify-between font-semibold">
          <span>Treapta ta: Start</span>
          <span className="font-normal text-mute">
            2 din 5 proiecte pentru „Verificat”
          </span>
        </div>
        <div className="my-3.5 h-2.5 rounded-full bg-line">
          <div className="h-2.5 w-[40%] rounded-full bg-coral" />
        </div>
        <div className="flex justify-between text-[13px] text-mute">
          <span>Start</span>
          <span>Verificat</span>
          <span>Încercat</span>
          <span>Expert</span>
        </div>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <div className="card p-6">
          <b className="text-lg">Potriviri noi</b>
          <div className="mt-2">
            {newMatches.map((m) => (
              <Row key={m.title} item={m} />
            ))}
          </div>
        </div>
        <div className="card p-6">
          <b className="text-lg">Colaborări active</b>
          <div className="mt-2">
            {active.map((m) => (
              <Row key={m.title} item={m} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}