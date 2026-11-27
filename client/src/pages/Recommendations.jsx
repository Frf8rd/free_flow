import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import PageShell from '../components/layout/PageShell.jsx';
import Button from '../components/ui/Button.jsx';
import Icon from '../components/ui/Icon.jsx';
import { Async, Card, Empty, Notice } from '../components/ui/Kit.jsx';
import { Select } from '../components/ui/Fields.jsx';
import { FreelancerMatchCard, ProjectMatchCard } from '../components/match/Cards.jsx';
import { useMyProjects, useProjectMatches, useMyMatches, useMyFreelancer, useInvite, useInterest, useDismiss, useRefreshMatches } from '../hooks/queries.js';
import useImpressions from '../hooks/useImpressions.js';
import { profileCompleteness } from '../lib/profile.js';
import { useSession } from '../lib/session.jsx';
import { useToast } from '../components/feedback/Toast.jsx';

function SearchStatus({ status, refreshing, count, projectId }) {
  if (refreshing || status === 'PENDING' || status === 'RUNNING') {
    return <Card className="p-4 text-sm text-fm-slate/75" role="status">
      <span aria-hidden="true" className="mr-2 inline-block h-3 w-3 animate-spin border-2 border-fm-graphite/25 border-t-fm-accent" />
      {refreshing ? 'Se solicită actualizarea…' : status === 'RUNNING' ? 'Se caută freelanceri potriviți…' : 'Căutarea este în așteptare. Rezultatul va apărea automat.'}
    </Card>;
  }
  if (status === 'FAILED') {
    return <Card role="alert"><Empty icon="alert" title="Căutarea nu s-a putut finaliza" text="Apasă «Actualizează potrivirile» pentru a încerca din nou." /></Card>;
  }
  if (count === 0) {
    return <Card role="status"><Empty icon="search" title="Căutare finalizată · 0 potriviri" text="Nu există recomandări de afișat pentru acest proiect. Poți revizui abilitățile cerute, bugetul sau termenul."
      action={<Link to={`/projects/${projectId}/edit`} className="bg-fm-ink px-4 py-2.5 text-sm font-semibold text-white">Editează proiectul</Link>} /></Card>;
  }
  return <Card className="p-4 text-sm font-semibold text-fm-ink" role="status">
    Căutare finalizată · {count} {count === 1 ? 'potrivire găsită' : count >= 20 ? 'de potriviri găsite' : 'potriviri găsite'}
  </Card>;
}

export default function Recommendations() {
  const { mode } = useSession();
  const navigate = useNavigate();
  const isClient = mode === 'CLIENT';
  const [params, setParams] = useSearchParams();
  const projects = useMyProjects(isClient);
  const projectId = params.get('project') || params.get('projectId');
  const clientProjects = (projects.data || []).filter((p) => p.status === 'OPEN');
  const selected = projectId ? clientProjects.find((p) => String(p.id) === projectId) : clientProjects[0];
  const clientMatches = useProjectMatches(selected?.id, isClient);
  const freelancerMatches = useMyMatches({ status: 'new', page: 1, limit: 20 }, !isClient);
  const freelancerInvites = useMyMatches({ status: 'invited', page: 1, limit: 50 }, !isClient);
  const freelancerProfile = useMyFreelancer(!isClient);
  const invite = useInvite(), interest = useInterest(), dismiss = useDismiss(), refresh = useRefreshMatches();
  const track = useImpressions();
  const { toast, error } = useToast();
  const result = isClient ? clientMatches : freelancerMatches;
  const rows = isClient ? (clientMatches.data?.data || []) : (freelancerMatches.data?.data || []);
  const showProfileHint = !isClient && freelancerProfile.isSuccess && profileCompleteness(freelancerProfile.data).percent < 100;
  const refreshing = Boolean(selected && refresh.isPending && refresh.variables === selected.id);
  const searchStatus = clientMatches.data?.status;
  const searching = refreshing || ['PENDING', 'RUNNING'].includes(searchStatus);
  const refreshError = selected && refresh.variables === selected.id ? refresh.error : null;

  const changeProject = (value) => { const next = new URLSearchParams(params); next.delete('projectId'); value ? next.set('project', value) : next.delete('project'); setParams(next, { replace: true }); };
  const act = async (mutation, vars, message, goToConversation = false) => { try { const data = await mutation.mutateAsync(vars); toast(message); if (goToConversation && data?.conversationId) navigate(`/messages/${data.conversationId}`); } catch (e) { error(e); } };

  const title = isClient ? 'Freelanceri potriviți' : 'Potriviri pentru tine';
  return <PageShell title={title} subtitle={isClient ? 'Primești o listă scurtă, cu explicații pentru fiecare recomandare.' : 'Proiectele sunt selectate după abilități, nivel, disponibilitate și buget.'} action={isClient && selected && <Button variant="outline" onClick={() => refresh.mutate(selected.id)} disabled={searching || refresh.isPending}><Icon name="repeat" className="h-4 w-4" />Actualizează potrivirile</Button>}>
    <div className="grid gap-4">
      {!isClient && <Async q={freelancerInvites}>{({ data }) => data.length > 0 && (
        <section className="grid gap-3" aria-labelledby="received-invites">
          <h2 id="received-invites" className="text-lg font-semibold text-fm-ink">Invitații primite</h2>
          {data.map((match) => <ProjectMatchCard key={match.id} match={match} onInterest={(m) => act(interest, m.id, 'Invitația a fost acceptată.', true)} busy={interest.isPending} />)}
        </section>
      )}</Async>}
      {!isClient && freelancerInvites.data?.data.length > 0 && <h2 className="text-lg font-semibold text-fm-ink">Recomandări noi</h2>}
      {isClient && <Async q={projects}>{() => clientProjects.length ? <Card className="flex flex-wrap items-center gap-3 p-4"><label className="min-w-52 flex-1 text-sm font-semibold text-fm-ink">Proiect<Select className="mt-1.5" value={selected?.id || ''} onChange={(event) => changeProject(event.target.value)} options={[...(!selected ? [{ value: '', label: 'Alege un proiect' }] : []), ...clientProjects.map((p) => ({ value: p.id, label: p.title }))]} /></label><Link to="/projects/mine" className="pt-5 text-sm font-semibold text-fm-accent hover:underline">Gestionează proiectele</Link></Card> : <Card><Empty icon="folder" title="Postează un proiect pentru a vedea potriviri" text="După publicare, sistemul caută freelanceri potriviți." action={<Link to="/projects/new" className="bg-fm-ink px-4 py-2.5 text-sm font-semibold text-white">Postează proiect</Link>} /></Card>}</Async>}
      {isClient && selected && clientMatches.data?.analysis?.questions?.length > 0 && <Notice tone="info" icon="info"><b>Detalii care pot îmbunătăți potrivirea</b><ul className="mt-2 list-disc pl-5">{clientMatches.data.analysis.questions.map((question) => <li key={question}>{question}</li>)}</ul></Notice>}
      {refreshError && <Notice tone="warn" icon="info"><span role="alert">{refreshError.message}</span></Notice>}
      {isClient && projects.isSuccess && projectId && !selected && <Notice tone="warn" icon="info">Proiectul din acest link nu este în lista proiectelor tale deschise.</Notice>}
      {isClient && selected && refreshing && <SearchStatus refreshing />}
      {isClient && selected && !refreshing && <Async q={clientMatches}>{() => <SearchStatus status={searchStatus} count={rows.length} projectId={selected.id} />}</Async>}
      {(!isClient || (selected && searchStatus === 'DONE' && !searching && !clientMatches.isError && rows.length > 0)) && <Async q={result}>{() => rows.length === 0 ? <Card><Empty
        icon="sparkle"
        title="Nu ai potriviri noi"
        text={showProfileHint
            ? 'Poți completa abilitățile și exemplele de lucru pentru a îmbunătăți recomandările.'
            : 'Momentan nu sunt recomandări noi pentru profilul tău. Poți căuta proiecte deschise în catalog.'}
        action={!isClient && <Link to={showProfileHint ? '/profile/edit' : '/browse'} className="bg-fm-ink px-4 py-2.5 text-sm font-semibold text-white">{showProfileHint ? 'Editează profilul' : 'Explorează proiecte'}</Link>}
      /></Card> : <div className="grid gap-3">{rows.map((match) => isClient ? <FreelancerMatchCard key={match.id} match={match} onSeen={track} onInvite={(m) => act(invite, m.id, 'Invitația a fost trimisă.', true)} onDismiss={(m) => act(dismiss, { id: m.id, reason: '' }, 'Potrivirea a fost ascunsă.')} busy={invite.isPending} /> : <ProjectMatchCard key={match.id} match={match} onSeen={track} onInterest={(m) => act(interest, m.id, 'Interesul a fost trimis.', true)} onDismiss={(m) => act(dismiss, { id: m.id, reason: '' }, 'Potrivirea a fost ascunsă.')} busy={interest.isPending} />)}</div>}</Async>}
    </div>
  </PageShell>;
}
