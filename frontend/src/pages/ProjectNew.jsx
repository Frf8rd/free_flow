import { useNavigate } from 'react-router-dom'

export default function ProjectNew() {
  const navigate = useNavigate()

  function handleSubmit(e) {
    e.preventDefault()
    navigate('/recommendations')
  }

  return (
    <div className="flex flex-col gap-8 lg:flex-row">
      <form onSubmit={handleSubmit} className="card flex-[2] p-8">
        <h1 className="font-display text-4xl tracking-tight">
          Postează un proiect
        </h1>
        <p className="mb-6 mt-1.5 text-mute">
          Scrie cu cuvintele tale. Restul îl deducem noi.
        </p>

        <label className="block text-sm font-semibold">
          Descrierea proiectului
          <textarea
            placeholder="Vreau un site pentru frizeria mea, buget mic, în două săptămâni…"
            className="input mt-1.5 h-36 resize-none font-normal"
          />
        </label>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <label className="block text-sm font-semibold">
            Categorie
            <input placeholder="Web design" className="input mt-1.5 font-normal" />
          </label>
          <label className="block text-sm font-semibold">
            Buget
            <input placeholder="300 €" className="input mt-1.5 font-normal" />
          </label>
          <label className="block text-sm font-semibold">
            Termen
            <input placeholder="2 săptămâni" className="input mt-1.5 font-normal" />
          </label>
        </div>

        <button type="submit" className="btn-primary mt-7">
          Găsește potriviri
        </button>
      </form>

      <aside className="h-fit flex-1 rounded-2xl bg-mint p-7">
        <b className="text-lg">Cum funcționează</b>
        <p className="mt-2.5 leading-relaxed text-[#2f4f4f]">
          Citim descrierea, extragem abilitățile și bugetul, apoi îți arătăm
          5 freelanceri potriviți, în câteva minute. Dacă brief-ul e vag, îți
          punem 1–2 întrebări.
        </p>
      </aside>
    </div>
  )
}