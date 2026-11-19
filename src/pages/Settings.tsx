import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AvatarUpload } from "@/components/common/AvatarUpload";
import { ErrorState, PageHeader } from "@/components/common/states";
import { Skeleton } from "@/components/ui/skeleton";
import { myFreelancerProfileQuery } from "@/hooks/use-queries";
import { useAuthStore } from "@/store/auth";
import { roleLabel } from "@/lib/format";
import { createImageUrls } from "@/lib/image-uploads";
import { getErrorMessage, matchesService } from "@/services";
import { useI18n } from "@/i18n";
import type { Availability, FreelancerProfile, User } from "@/types";

type FreelancerDetails = {
  headline: string;
  about: string;
  skills: string;
  languages: string;
  location: string;
  experienceYears: string;
  website: string;
  hourlyRate: string;
  availability: Availability;
};

const emptyFreelancerDetails: FreelancerDetails = {
  headline: "",
  about: "",
  skills: "",
  languages: "",
  location: "",
  experienceYears: "",
  website: "",
  hourlyRate: "",
  availability: "FULL_TIME",
};

export function SettingsPage() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [pw, setPw] = useState({ current: "", next: "" });
  const [confirmDelete, setConfirmDelete] = useState(false);
  if (!user) return null;
  const pwError = pw.next && pw.next.length < 8 ? "Parola nouă are minimum 8 caractere." : null;
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader label="Setări" title="Contul tău" text={`Rol: ${roleLabel[user.role]}`} />
      <Tabs defaultValue="profile" className="mt-8">
        <TabsList>
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="security">Securitate</TabsTrigger>
          <TabsTrigger value="danger">Cont</TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="surface-card mt-4 space-y-5 p-6">
          {user.role === "FREELANCER" ? (
            <FreelancerProfileEditor user={user} />
          ) : (
            <AccountProfileEditor user={user} />
          )}
        </TabsContent>
        <TabsContent value="security" className="surface-card mt-4 space-y-5 p-6">
          <div>
            <Label htmlFor="cp">Parola curentă</Label>
            <Input
              id="cp"
              type="password"
              className="mt-2"
              value={pw.current}
              onChange={(e) => setPw({ ...pw, current: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="np">Parola nouă</Label>
            <Input
              id="np"
              type="password"
              className="mt-2"
              value={pw.next}
              onChange={(e) => setPw({ ...pw, next: e.target.value })}
            />
            {pwError && (
              <p role="alert" className="mt-1 text-small text-destructive">
                {pwError}
              </p>
            )}
          </div>
          <Button
            disabled={!pw.current || pw.next.length < 8}
            onClick={() => {
              setPw({ current: "", next: "" });
              toast.success("Parola a fost schimbată.");
            }}
          >
            Schimbă parola
          </Button>
        </TabsContent>
        <TabsContent value="danger" className="surface-card mt-4 space-y-4 p-6">
          <p className="font-semibold">Ștergerea contului</p>
          <p className="text-small text-muted-foreground">
            Acțiunea este definitivă: profilul, proiectele și mesajele tale dispar.
          </p>
          {confirmDelete ? (
            <div className="flex gap-2">
              <Button
                variant="destructive"
                onClick={() => {
                  logout();
                  void navigate({ to: "/" });
                }}
              >
                Da, șterge contul
              </Button>
              <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
                Renunț
              </Button>
            </div>
          ) : (
            <Button variant="outline" onClick={() => setConfirmDelete(true)}>
              Șterge contul
            </Button>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AccountProfileEditor({ user }: { user: User }) {
  const { t } = useI18n();
  const updateUser = useAuthStore((state) => state.updateUser);
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);

  const save = () => {
    const updatedUser = { ...user, name: name.trim(), email: email.trim() };
    if (avatarFile) updatedUser.avatarUrl = createImageUrls([avatarFile])[0];
    else if (removeAvatar) delete updatedUser.avatarUrl;
    updateUser(updatedUser);
    setAvatarFile(null);
    setRemoveAvatar(false);
    toast.success("Profil salvat.");
  };

  return (
    <div className="space-y-5">
      <AvatarUpload
        name={name}
        imageUrl={user.avatarUrl}
        file={avatarFile}
        removeAvatar={removeAvatar}
        onFileChange={(file) => {
          setAvatarFile(file);
          setRemoveAvatar(false);
        }}
        onRemove={() => {
          setAvatarFile(null);
          setRemoveAvatar(true);
        }}
      />
      <div>
        <Label htmlFor="n">Nume</Label>
        <Input
          id="n"
          className="mt-2"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="e">Email</Label>
        <Input
          id="e"
          type="email"
          className="mt-2"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>
      <Button disabled={name.trim().length < 2 || !/^\S+@\S+\.\S+$/.test(email)} onClick={save}>
        {t("profile.save")}
      </Button>
    </div>
  );
}

function FreelancerProfileEditor({ user }: { user: User }) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const updateUser = useAuthStore((state) => state.updateUser);
  const profile = useQuery(myFreelancerProfileQuery());
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [details, setDetails] = useState<FreelancerDetails>(emptyFreelancerDetails);

  useEffect(() => {
    if (!profile.data) return;
    setName(profile.data.name);
    setDetails(toFreelancerDetails(profile.data));
  }, [profile.data]);

  const save = useMutation({
    mutationFn: () => {
      if (!profile.data) throw new Error("Profilul nu este încărcat.");
      const experience = details.experienceYears.trim();
      return matchesService.updateMyProfile({
        name: name.trim(),
        headline: details.headline.trim(),
        about: details.about.trim(),
        skills: parseList(details.skills),
        languages: parseList(details.languages),
        location: details.location.trim() || undefined,
        experienceYears: experience ? Number(experience) : undefined,
        website: details.website.trim() || undefined,
        hourlyRate: Number(details.hourlyRate),
        availability: details.availability,
        avatar: avatarFile ?? undefined,
        removeAvatar,
      });
    },
    onSuccess: (saved) => {
      updateUser({
        ...user,
        name: saved.name,
        email: email.trim(),
        avatarUrl: saved.avatarUrl,
      });
      setAvatarFile(null);
      setRemoveAvatar(false);
      queryClient.setQueryData(["freelancers", "me"], saved);
      void queryClient.invalidateQueries({ queryKey: ["freelancers"] });
      toast.success("Profil salvat.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  if (profile.isLoading) return <Skeleton className="h-80 rounded-[var(--radius-card)]" />;
  if (profile.isError || !profile.data) {
    return <ErrorState onRetry={() => void profile.refetch()} />;
  }

  const parsedRate = Number(details.hourlyRate);
  const valid =
    name.trim().length >= 2 &&
    /^\S+@\S+\.\S+$/.test(email) &&
    details.headline.trim().length >= 3 &&
    details.about.trim().length >= 20 &&
    parseList(details.skills).length > 0 &&
    parseList(details.languages).length > 0 &&
    Number.isFinite(parsedRate) &&
    parsedRate > 0 &&
    (!details.experienceYears.trim() ||
      (Number.isFinite(Number(details.experienceYears)) && Number(details.experienceYears) >= 0));

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        save.mutate();
      }}
    >
      <AvatarUpload
        name={name}
        imageUrl={profile.data.avatarUrl ?? user.avatarUrl}
        file={avatarFile}
        removeAvatar={removeAvatar}
        onFileChange={(file) => {
          setAvatarFile(file);
          setRemoveAvatar(false);
        }}
        onRemove={() => {
          setAvatarFile(null);
          setRemoveAvatar(true);
        }}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="profile-name">{t("profile.name")}</Label>
          <Input
            id="profile-name"
            className="mt-2"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            minLength={2}
          />
        </div>
        <div>
          <Label htmlFor="profile-email">{t("profile.email")}</Label>
          <Input
            id="profile-email"
            type="email"
            className="mt-2"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="profile-headline">{t("profile.headline")}</Label>
          <Input
            id="profile-headline"
            className="mt-2"
            value={details.headline}
            onChange={(event) => setDetails({ ...details, headline: event.target.value })}
            required
            minLength={3}
          />
        </div>
        <div>
          <Label htmlFor="profile-location">{t("profile.location")}</Label>
          <Input
            id="profile-location"
            className="mt-2"
            value={details.location}
            onChange={(event) => setDetails({ ...details, location: event.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="profile-experience">{t("profile.experience")}</Label>
          <Input
            id="profile-experience"
            type="number"
            min={0}
            max={60}
            className="mt-2"
            value={details.experienceYears}
            onChange={(event) => setDetails({ ...details, experienceYears: event.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="profile-website">{t("profile.website")}</Label>
          <Input
            id="profile-website"
            type="url"
            className="mt-2"
            value={details.website}
            onChange={(event) => setDetails({ ...details, website: event.target.value })}
            placeholder="https://"
          />
        </div>
        <div>
          <Label htmlFor="profile-rate">{t("profile.hourlyRate")}</Label>
          <Input
            id="profile-rate"
            type="number"
            min={1}
            className="mt-2"
            value={details.hourlyRate}
            onChange={(event) => setDetails({ ...details, hourlyRate: event.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="profile-availability">{t("profile.availability")}</Label>
          <select
            id="profile-availability"
            className="mt-2 h-11 w-full rounded-[var(--radius-input)] border border-border bg-background px-3 text-sm"
            value={details.availability}
            onChange={(event) => {
              const { value } = event.target;
              if (
                value === "FULL_TIME" ||
                value === "PART_TIME" ||
                value === "WEEKENDS" ||
                value === "UNAVAILABLE"
              ) {
                setDetails({ ...details, availability: value });
              }
            }}
          >
            <option value="FULL_TIME">{t("profile.fullTime")}</option>
            <option value="PART_TIME">{t("profile.partTime")}</option>
            <option value="WEEKENDS">{t("profile.weekends")}</option>
            <option value="UNAVAILABLE">{t("profile.unavailable")}</option>
          </select>
        </div>
      </div>
      <div>
        <Label htmlFor="profile-skills">{t("profile.skills")}</Label>
        <Input
          id="profile-skills"
          className="mt-2"
          value={details.skills}
          onChange={(event) => setDetails({ ...details, skills: event.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="profile-languages">{t("profile.languages")}</Label>
        <Input
          id="profile-languages"
          className="mt-2"
          value={details.languages}
          onChange={(event) => setDetails({ ...details, languages: event.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="profile-about">{t("profile.about")}</Label>
        <Textarea
          id="profile-about"
          rows={5}
          maxLength={1200}
          className="mt-2"
          value={details.about}
          onChange={(event) => setDetails({ ...details, about: event.target.value })}
          required
          minLength={20}
        />
      </div>
      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={!valid || save.isPending}>
          {save.isPending ? t("profile.saving") : t("profile.save")}
        </Button>
        <Button asChild variant="outline">
          <Link to="/freelancers/$id" params={{ id: profile.data.id }}>
            {t("profile.viewPublic")}
          </Link>
        </Button>
      </div>
    </form>
  );
}

function toFreelancerDetails(profile: FreelancerProfile): FreelancerDetails {
  return {
    headline: profile.headline,
    about: profile.about,
    skills: profile.skills.join(", "),
    languages: profile.languages.join(", "),
    location: profile.location ?? "",
    experienceYears: profile.experienceYears?.toString() ?? "",
    website: profile.website ?? "",
    hourlyRate: profile.hourlyRate.toString(),
    availability: profile.availability,
  };
}

function parseList(value: string): string[] {
  return [
    ...new Set(
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
}
