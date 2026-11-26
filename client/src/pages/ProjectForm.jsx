import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageShell from '../components/layout/PageShell.jsx';
import Button from '../components/ui/Button.jsx';
import Icon from '../components/ui/Icon.jsx';
import { Async, BackLink, Card, Notice, SkeletonList } from '../components/ui/Kit.jsx';
import { ChipPicker, Field, Text, Textarea } from '../components/ui/Fields.jsx';
import SkillSelector from '../components/forms/SkillSelector.jsx';
import useForm from '../lib/useForm.js';
import { projectSchema } from '../lib/validators.js';
import { useCategories, useCreateProject, useProject, useUpdateProject } from '../hooks/queries.js';
import { clearDraft, readDraft } from '../lib/draft.js';
import { currencySymbol, toInputDate } from '../lib/format.js';
import { config } from '../config.js';
import { track } from '../lib/analytics.js';
import ProjectImagePicker from '../components/project/ProjectImagePicker.jsx';
import * as projectService from '../services/projects.js';
import { useToast } from '../components/feedback/Toast.jsx';

function Form({ project }) {
  const nav = useNavigate();
  const create = useCreateProject(), update = useUpdateProject();
  const cats = useCategories();
  const { error: showError } = useToast();
  const [imageFiles, setImageFiles] = useState([]);
  const draft = !project ? readDraft() : null;
  const f = useForm(projectSchema, {
    title: project?.title || '', description: project?.description || draft?.description || '', categoryId: project?.categoryId || '',
    budgetMin: project?.budgetMin ?? '', budgetMax: project?.budgetMax ?? '', deadline: toInputDate(project?.deadline), skillIds: project?.skills?.map((s) => s.id) || [],
  });
  const [more, setMore] = useState(!!(project?.budgetMin || project?.budgetMax || project?.deadline || project?.skills?.length));
  useEffect(() => { if (!project) track('project_form_opened', { fromDraft: !!draft }); }, []); // eslint-disable-line

  const onSubmit = f.submit(async (d) => {
    const title = d.title || d.description.split('\n')[0].slice(0, 80);
    const uploadSelectedImages = async (projectId) => {
      for (const file of imageFiles) await projectService.uploadAttachment(projectId, file);
      setImageFiles([]);
    };
    if (project) {
      await update.mutateAsync({ id: project.id, title, description: d.description, categoryId: d.categoryId, budgetMin: d.budgetMin ?? null, budgetMax: d.budgetMax ?? null, deadline: d.deadline || null, skillIds: d.skillIds || [] });
      await uploadSelectedImages(project.id);
      nav(`/projects/${project.id}`);
    } else {
      const p = await create.mutateAsync({ title, description: d.description, categoryId: d.categoryId, budgetMin: d.budgetMin, budgetMax: d.budgetMax, deadline: d.deadline || undefined, skillIds: d.skillIds?.length ? d.skillIds : undefined });
      clearDraft(); track('project_created', { hasBudget: d.budgetMax != null });
      try { await uploadSelectedImages(p.id); }
      catch (uploadError) {
        showError(uploadError);
        nav(`/projects/${p.id}`);
        return;
      }
      nav(`/recommendations?projectId=${p.id}`);
    }
  });
  const len = f.values.description.length;

  return (
    <PageShell title={project ? 'Editează proiectul' : 'Postează un proiect'} subtitle={project ? 'Dacă schimbi descrierea sau abilitățile, recalculăm potrivirile.' : 'Scrie liber ce ai nevoie. Restul detaliilor sunt opționale.'} width="max-w-4xl">
      {project && <BackLink to={`/projects/${project.id}`}>Înapoi la proiect</BackLink>}
      <form onSubmit={onSubmit} noValidate className="grid gap-6">
        <Card className="space-y-6 p-5 sm:p-7">
          {f.formError && <Notice tone="danger" icon="alert">{f.formError}</Notice>}
          <Field label="Descrie ce ai nevoie" error={f.errors.description} hint={`${len}/${config.maxDescription} · minim ${config.minDescription} de caractere`}>
            <Textarea rows={7} maxLength={config.maxDescription} autoFocus={!project} error={f.errors.description} placeholder="Ex.: Am o cafenea în centru și vreau un site simplu cu meniu, program, galerie foto și formular de rezervare. Stil cald, minimalist, să arate bine pe telefon." {...f.bind('description')} />
          </Field>
          <div>
            <p className="mb-2 text-sm font-medium text-fm-ink">Categorie</p>
            <ChipPicker multiple={false} options={(cats.data || []).map((c) => ({ value: c.id, label: c.name }))} value={f.values.categoryId} onChange={(v) => f.set('categoryId', v)} />
            {cats.isError && <span className="mt-1 block text-xs text-red-500">Nu am putut încărca categoriile.</span>}
            {f.errors.categoryId && <span role="alert" className="mt-1 block text-xs text-red-500">{f.errors.categoryId}</span>}
          </div>

          <button type="button" onClick={() => setMore(!more)} aria-expanded={more} className="flex w-full items-center justify-between rounded-md bg-fm-mist/40 px-4 py-3 text-left text-sm font-semibold text-fm-ink hover:bg-fm-mist/60">
            Buget, termen și abilități <span className="text-xs font-normal text-fm-slate/60">opțional · ajută la potriviri mai precise</span>
            <Icon name="chevron" className={`h-4 w-4 transition ${more ? 'rotate-180' : ''}`} />
          </button>
          {more && (
            <div className="space-y-5">
              <Field label="Titlu" optional hint="Dacă îl lași gol, îl generăm din descriere."><Text maxLength={120} error={f.errors.title} {...f.bind('title')} /></Field>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label={`Buget minim (${currencySymbol()})`} optional error={f.errors.budgetMin}><Text type="number" min="0" inputMode="numeric" error={f.errors.budgetMin} {...f.bind('budgetMin')} /></Field>
                <Field label={`Buget maxim (${currencySymbol()})`} optional error={f.errors.budgetMax}><Text type="number" min="0" inputMode="numeric" error={f.errors.budgetMax} {...f.bind('budgetMax')} /></Field>
                <Field label="Termen" optional error={f.errors.deadline}><Text type="date" min={toInputDate(new Date())} error={f.errors.deadline} {...f.bind('deadline')} /></Field>
              </div>
              <div><p className="mb-2 text-sm font-medium text-fm-ink">Abilități cerute <span className="text-xs font-normal text-fm-slate/50">opțional · le deducem și noi din descriere</span></p><SkillSelector value={f.values.skillIds} onChange={(v) => f.set('skillIds', v)} max={15} /></div>
            </div>
          )}
          <div className="border-t border-fm-ink/10 pt-5">
            <ProjectImagePicker files={imageFiles} onChange={setImageFiles} />
          </div>
          <div className="flex flex-wrap justify-end gap-3 border-t border-fm-ink/10 pt-5">
            <Button type="button" variant="outline" onClick={() => nav(-1)}>Renunță</Button>
            <Button type="submit" loading={f.submitting}>{project ? 'Salvează modificările' : 'Postează și vezi potrivirile'}</Button>
          </div>
        </Card>
      </form>
    </PageShell>
  );
}

export default function ProjectForm() {
  const { id } = useParams();
  const q = useProject(id);
  if (!id) return <Form />;
  return <PageShell title="Editează proiectul" width="max-w-4xl"><Async q={q} skeleton={<SkeletonList n={2} />}>{(p) => <Form project={p} />}</Async></PageShell>;
}
