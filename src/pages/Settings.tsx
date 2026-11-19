import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/common/states";
import { useAuthStore } from "@/store/auth";
import { roleLabel } from "@/lib/format";

export function SettingsPage() {
  const { user, updateUser, logout } = useAuthStore();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
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
          <div>
            <Label htmlFor="n">Nume</Label>
            <Input id="n" className="mt-2" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="e">Email</Label>
            <Input
              id="e"
              type="email"
              className="mt-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button
            disabled={name.trim().length < 2 || !/^\S+@\S+\.\S+$/.test(email)}
            onClick={() => {
              updateUser({ ...user, name: name.trim(), email });
              toast.success("Profil salvat.");
            }}
          >
            Salvează
          </Button>
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
