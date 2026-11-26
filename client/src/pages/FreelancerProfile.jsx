import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import PageShell from '../components/layout/PageShell.jsx';
import Button from '../components/ui/Button.jsx';
import Icon from '../components/ui/Icon.jsx';
import { Async, Avatar, Card, Chip, Empty, Stars, Status, Tag } from '../components/ui/Kit.jsx';
import { Select } from '../components/ui/Fields.jsx';
import { useFreelancer, useFreelancerReviews, useInviteManual, useMyProjects } from '../hooks/queries.js';
import { useSession } from '../lib/session.jsx';
import { AVAILABILITY, LEVELS, timeAgo, formatRate } from '../lib/format.js';
import { useToast } from '../components/feedback/Toast.jsx';

export default function FreelancerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { mode, user } = useSession();
  const query = useFreelancer(id);
  const reviews = useFreelancerReviews(query.data?.id, 1);
  const isClient = mode === 'CLIENT';
  const projects = useMyProjects(isClient);
  const invite = useInviteManual();
  const [projectId, setProjectId] = useState('');
  const [tab, setTab] = useState('about');
  const { toast, error } = useToast();
  return <Async q={query}>{(profile) => {
    const own = profile.userId === user.id;
    const openProjects = (projects.data || []).filter((p) => p.status === 'OPEN');
    const pickedProject = projectId || String(openProjects[0]?.id || '');
    const sendInvite = async () => { if (!pickedProject) return; try { const result = await invite.mutateAsync({ projectId: pickedProject, freelancerId: profile.id }); toast('Invitația a fost trimisă.'); if (result?.conversationId) navigate(`/messages/${result.conversationId}`); } catch (e) { error(e); } };
    return <PageShell title={profile.name} subtitle={profile.title || 'Profil freelancer'} action={own && <Link to="/profile/edit" className="border border-fm-graphite/25 px-4 py-2.5 text-sm font-semibold text-fm-ink">Editează profilul</Link>}>
      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="grid min-w-0 content-start gap-4">
          <Card className="p-4 sm:p-6"><div className="flex flex-wrap items-center gap-4"><Avatar name={profile.name} src={profile.avatarUrl} size="h-16 w-16" /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-bold text-fm-ink">{profile.name}</h2><Status tone="neutral">{profile.tier}</Status></div><p className="mt-1 text-sm text-fm-slate/70">{profile.title} · {LEVELS[profile.level] || profile.level}</p><div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-fm-slate/70">{profile.ratingAvg ? <span className="inline-flex items-center gap-1.5"><Stars value={profile.ratingAvg} /><b className="text-fm-ink">{profile.ratingAvg}</b>({profile.reviewsCount})</span> : <span>Fără recenzii încă</span>}<span>{formatRate(profile.hourlyRate)}</span><span>{AVAILABILITY[profile.availability] || profile.availability}</span></div></div></div><p className="mt-5 whitespace-pre-wrap text-sm leading-relaxed text-fm-slate">{profile.bio || 'Profilul nu include încă o descriere.'}</p><div className="mt-4 flex flex-wrap gap-2">{(profile.skills || []).map((skill) => <Tag key={skill.id}>{skill.name}</Tag>)}</div></Card>
          <div className="flex gap-5 border-b border-fm-ink/10"><button onClick={() => setTab('about')} className={`border-b-2 pb-3 text-sm font-semibold ${tab === 'about' ? 'border-fm-ink text-fm-ink' : 'border-transparent text-fm-slate/60'}`}>Portofoliu</button><button onClick={() => setTab('reviews')} className={`border-b-2 pb-3 text-sm font-semibold ${tab === 'reviews' ? 'border-fm-ink text-fm-ink' : 'border-transparent text-fm-slate/60'}`}>Recenzii ({profile.reviewsCount || 0})</button></div>
          {tab === 'about' ? (profile.portfolio?.length ? <div className="grid gap-3 sm:grid-cols-2">{profile.portfolio.map((item) => <Card key={item.id} className="overflow-hidden">{item.imageUrl ? <img src={item.imageUrl} alt={item.title} className="aspect-[16/9] w-full object-cover" /> : <div className="grid aspect-[16/9] place-items-center bg-fm-mist/50 text-fm-slate/50"><Icon name="image" className="h-8 w-8" /></div>}<div className="p-4"><h3 className="text-sm font-semibold text-fm-ink">{item.title}</h3>{item.description && <p className="mt-1 text-sm text-fm-slate/70">{item.description}</p>}{item.link && <a href={item.link} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-semibold text-fm-accent">Vezi lucrarea</a>}</div></Card>)}</div> : <Card><Empty icon="images" title="Portofoliul nu a fost adăugat încă" /></Card>) : <Async q={reviews}>{(data) => data.data.length ? <Card className="divide-y divide-fm-ink/10">{data.data.map((review) => <article key={review.id} className="p-4 sm:p-5"><div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><Stars value={review.rating} /><span className="text-sm font-semibold text-fm-ink">{review.author?.name || 'Client'}</span></div><span className="text-xs text-fm-slate/55">{timeAgo(review.createdAt)}</span></div>{review.comment && <p className="mt-2 text-sm text-fm-slate/75">{review.comment}</p>}</article>)}</Card> : <Card><Empty icon="star" title="Nicio recenzie încă" /></Card>}</Async>}
        </div>
        <aside className="grid h-fit gap-4">{own ? <Card className="p-4"><p className="text-sm font-semibold text-fm-ink">Acesta este profilul tău</p><p className="mt-1 text-sm text-fm-slate/70">Editează datele și exemplele de lucru.</p><Link to="/profile/edit" className="mt-4 block bg-fm-ink px-4 py-2.5 text-center text-sm font-semibold text-white">Editează profilul</Link></Card> : isClient ? <Card className="p-4"><h2 className="text-sm font-semibold text-fm-ink">Invită la un proiect</h2><p className="mt-1 text-xs text-fm-slate/65">Selectează unul dintre proiectele tale deschise.</p><Async q={projects}>{() => openProjects.length ? <><Select className="mt-3" aria-label="Proiect" value={pickedProject} onChange={(e) => setProjectId(e.target.value)} options={openProjects.map((p) => ({ value: p.id, label: p.title }))} /><Button onClick={sendInvite} loading={invite.isPending} className="mt-3 w-full">Trimite invitația</Button></> : <p className="mt-3 text-sm text-fm-slate/70">Publică mai întâi un proiect.<Link to="/projects/new" className="ml-1 font-semibold text-fm-accent">Creează proiect</Link></p>}</Async></Card> : <Card className="p-4"><p className="text-sm font-semibold text-fm-ink">Vrei să inviți acest freelancer?</p><p className="mt-1 text-sm text-fm-slate/70">Schimbă spațiul de lucru în Setări, apoi alege un proiect deschis.</p><Link to="/settings?section=account" className="mt-3 inline-block text-sm font-semibold text-fm-accent">Setări cont</Link></Card>}
          <Card className="grid gap-3 p-4"><div className="flex items-center justify-between"><span className="text-xs text-fm-slate/65">Proiecte finalizate</span><span className="font-semibold text-fm-ink">{profile.completedCount || 0}</span></div><div className="flex items-center justify-between"><span className="text-xs text-fm-slate/65">Disponibilitate</span><span className="text-sm font-semibold text-fm-ink">{AVAILABILITY[profile.availability] || profile.availability}</span></div></Card>
        </aside>
      </div>
    </PageShell>;
  }}</Async>;
}
