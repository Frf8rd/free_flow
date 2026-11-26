import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import PageShell from '../components/layout/PageShell.jsx';
import Button from '../components/ui/Button.jsx';
import Icon from '../components/ui/Icon.jsx';
import { Async, Avatar, Card, Chip, Empty, Notice, Status, Tag } from '../components/ui/Kit.jsx';
import ProjectImages from '../components/project/ProjectImages.jsx';
import { FreelancerMatchCard, Why } from '../components/match/Cards.jsx';
import { useDismiss, useInvite, useInterest, useMyMatches, useProject, useProjectMatches, useUpdateProject, useDeleteProject } from '../hooks/queries.js';
import { useSession } from '../lib/session.jsx';
import { formatBudget, formatDate, PROJECT_STATUS, timeAgo } from '../lib/format.js';
import { useToast } from '../components/feedback/Toast.jsx';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { mode, user } = useSession();
  const query = useProject(id);
  const matchQuery = useProjectMatches(id, mode === 'CLIENT' && query.data?.clientId === user.id);
  const [tab, setTab] = useState('details');
  const [confirm, setConfirm] = useState(false);
  const update = useUpdateProject(), remove = useDeleteProject();
  const invite = useInvite(), interest = useInterest(), dismiss = useDismiss();
  const myMatches = useMyMatches({ projectId: id, limit: 5 }, !user.isAdmin && mode === 'FREELANCER');
  const { toast, error } = useToast();

  return <Async q={query}>{(project) => {
    const owner = project.clientId === user.id;
    const myMatch = (myMatches.data?.data || []).find((m) => m.projectId === project.id) || project.myMatch;
    const matches = matchQuery.data?.data || [];
    const images = project.images || (project.imageUrl ? [project.imageUrl] : []);
    const act = async (fn, vars, message, target) => { try { const result = await fn.mutateAsync(vars); toast(message); if (target && result?.conversationId) navigate(`/messages/${result.conversationId}`); } catch (e) { error(e); } };
    const close = async () => { try { await update.mutateAsync({ id: project.id, status: 'CLOSED' }); toast('Proiectul a fost închis.'); setConfirm(false); } catch (e) { error(e); } };
    const del = async () => { try { await remove.mutateAsync(project.id); toast('Proiectul a fost șters.'); navigate('/projects/mine'); } catch (e) { error(e); } };
    const statusTone = { OPEN: 'success', IN_PROGRESS: 'accent', COMPLETED: 'neutral', CLOSED: 'outline' };
    return <PageShell title={project.title} subtitle={`${project.client?.name || 'Client'} · postat ${timeAgo(project.createdAt)}`} action={owner && <div className="flex flex-wrap gap-2"><Link to={`/projects/${project.id}/edit`} className="border border-fm-graphite/25 px-4 py-2.5 text-sm font-semibold text-fm-ink">Editează</Link>{project.status === 'OPEN' && <Button variant="outline" onClick={() => setConfirm(true)}>Închide proiectul</Button>}</div>}>
      {confirm && <Notice tone="warn" icon="info" className="mb-4"><div className="flex flex-wrap items-center justify-between gap-3"><span>Închiderea oprește potrivirile noi pentru acest proiect.</span><div className="flex gap-2"><Button variant="outline" onClick={() => setConfirm(false)}>Anulează</Button><Button onClick={close} loading={update.isPending}>Închide</Button><button onClick={del} disabled={remove.isPending} className="px-3 text-sm font-semibold text-red-600">Șterge definitiv</button></div></div></Notice>}
      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="grid min-w-0 content-start gap-4">
          {owner && <nav className="flex gap-5 border-b border-fm-ink/10" aria-label="Secțiuni proiect"><button onClick={() => setTab('details')} className={`border-b-2 pb-3 text-sm font-semibold ${tab === 'details' ? 'border-fm-ink text-fm-ink' : 'border-transparent text-fm-slate/60'}`}>Proiect</button><button onClick={() => setTab('matches')} className={`border-b-2 pb-3 text-sm font-semibold ${tab === 'matches' ? 'border-fm-ink text-fm-ink' : 'border-transparent text-fm-slate/60'}`}>Potriviri {project.matchesCount ? `(${project.matchesCount})` : ''}</button></nav>}
          {tab === 'details' ? <>
            <Card className="p-4 sm:p-6">{images.length > 0 && <ProjectImages images={images} title={project.title} className="mb-5 h-56 w-full sm:h-72" />}<div className="flex flex-wrap items-center gap-2"><Status tone={statusTone[project.status] || 'neutral'}>{PROJECT_STATUS[project.status] || project.status}</Status>{project.category?.name && <Chip icon="folder">{project.category.name}</Chip>}{project.isStarter && <Status tone="accent" icon="rocket">Proiect de start</Status>}</div><h2 className="mt-5 text-sm font-semibold text-fm-ink">Descriere</h2><p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-fm-slate">{project.description}</p>{project.skills?.length > 0 && <><h2 className="mt-5 text-sm font-semibold text-fm-ink">Abilități</h2><div className="mt-2 flex flex-wrap gap-2">{project.skills.map((s) => <Tag key={s.id}>{s.name}</Tag>)}</div></>}</Card>
            {!owner && !user.isAdmin && mode === 'FREELANCER' && <Card className="p-4 sm:p-5">{myMatch ? <><div className="flex items-center justify-between gap-3"><h2 className="text-sm font-semibold text-fm-ink">Potrivire pentru profilul tău</h2><span className="text-2xl font-bold text-fm-ink">{myMatch.score}%</span></div><Why items={myMatch.reasons?.forFreelancer} /><div className="mt-4 flex flex-wrap gap-2">{['FREELANCER_INTERESTED', 'ACCEPTED'].includes(myMatch.status) ? <Status tone="success">Interes trimis</Status> : <Button onClick={() => act(interest, myMatch.id, 'Interesul a fost trimis.', true)} loading={interest.isPending}>Sunt interesat</Button>}{myMatch.conversationId && <Link to={`/messages/${myMatch.conversationId}`} className="border border-fm-graphite/25 px-4 py-2.5 text-sm font-semibold text-fm-ink">Deschide conversația</Link>}</div></> : <p className="text-sm text-fm-slate/70">Acest proiect nu este în lista ta de potriviri. Vezi proiectele recomandate în pagina Potriviri.</p>}</Card>}
          </> : <div className="grid gap-3">{matchQuery.isPending && <Card className="p-5 text-sm text-fm-slate/65">Se caută freelanceri potriviți…</Card>}{matchQuery.isError && <Card><Empty icon="alert" title="Potrivirile nu s-au încărcat" text={matchQuery.error.message} action={<button onClick={() => matchQuery.refetch()} className="font-semibold text-fm-accent">Reîncarcă</button>} /></Card>}{matchQuery.data?.status === 'FAILED' && <Card><Empty icon="alert" title="Potrivirea nu a putut fi calculată" text="Verifică descrierea proiectului și încearcă din nou." /></Card>}{matchQuery.data?.analysis?.questions?.length > 0 && <Notice tone="info" icon="info"><b>Clarifică proiectul</b><ul className="mt-2 list-disc pl-5">{matchQuery.data.analysis.questions.map((question) => <li key={question}>{question}</li>)}</ul></Notice>}{matches.length ? matches.map((match) => <FreelancerMatchCard key={match.id} match={match} onInvite={(m) => act(invite, m.id, 'Invitația a fost trimisă.', true)} onDismiss={(m) => act(dismiss, { id: m.id }, 'Recomandarea a fost ascunsă.')} busy={invite.isPending} />) : matchQuery.data?.status === 'DONE' && <Card><Empty icon="sparkle" title="Nicio potrivire momentan" text="Poți edita proiectul pentru a include mai multe detalii sau abilități." /></Card>}</div>}
        </div>
        <aside className="grid h-fit gap-4"><Card className="divide-y divide-fm-ink/10">{[['wallet', 'Buget', formatBudget(project.budgetMin, project.budgetMax)], ['calendar', 'Termen', project.deadline ? formatDate(project.deadline) : 'Flexibil'], ['users', 'Freelanceri interesați', String(project.interestedCount || 0)]].map(([icon, label, value]) => <div key={label} className="flex items-center gap-3 p-4"><span className="grid h-9 w-9 place-items-center bg-fm-mist/70 text-fm-ink"><Icon name={icon} className="h-4 w-4" /></span><div><p className="text-xs text-fm-slate/60">{label}</p><p className="text-sm font-semibold text-fm-ink">{value}</p></div></div>)}</Card><Card className="p-4"><p className="text-xs font-semibold text-fm-slate/60">Client</p><div className="mt-3 flex items-center gap-3"><Avatar name={project.client?.name} src={project.client?.avatarUrl} /><div className="min-w-0"><p className="truncate text-sm font-semibold text-fm-ink">{project.client?.name}</p><p className="text-xs text-fm-slate/65">{project.client?.companyName || 'Client FairMatch'}</p></div></div>{!owner && myMatch?.conversationId && <Link to={`/messages/${myMatch.conversationId}`} className="mt-4 inline-flex w-full items-center justify-center gap-2 border border-fm-graphite/25 px-4 py-2.5 text-sm font-semibold text-fm-ink"><Icon name="chat" className="h-4 w-4" />Deschide conversația</Link>}</Card></aside>
      </div>
    </PageShell>;
  }}</Async>;
}
