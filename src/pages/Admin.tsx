import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ErrorState, PageHeader } from "@/components/common/states";
import { adminProjectsQuery, adminReportsQuery, adminUsersQuery } from "@/hooks/use-queries";
import { adminService } from "@/services";
import { formatDate, roleLabel, statusLabel } from "@/lib/format";

export function AdminPage() {
  const qc = useQueryClient();
  const users = useQuery(adminUsersQuery());
  const projects = useQuery(adminProjectsQuery());
  const reports = useQuery(adminReportsQuery());
  const inv = (k: string) => () => void qc.invalidateQueries({ queryKey: ["admin", k] });
  const block = useMutation({ mutationFn: adminService.toggleBlock, onSuccess: inv("users") });
  const delProject = useMutation({
    mutationFn: adminService.removeProject,
    onSuccess: inv("projects"),
  });
  const resolve = useMutation({
    mutationFn: adminService.resolveReport,
    onSuccess: inv("reports"),
  });
  const wrap = (
    q: { isLoading: boolean; isError: boolean; refetch: () => unknown },
    body: React.ReactNode,
  ) =>
    q.isLoading ? (
      <Skeleton className="h-48 rounded-[var(--radius-card)]" />
    ) : q.isError ? (
      <ErrorState onRetry={() => void q.refetch()} />
    ) : (
      <div className="surface-card overflow-x-auto p-2">{body}</div>
    );
  const open = reports.data?.filter((r) => r.status === "OPEN").length ?? 0;
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        label="Administrare"
        title="Moderare"
        text="Utilizatori, proiecte și raportări."
      />
      <Tabs defaultValue="users" className="mt-8">
        <TabsList>
          <TabsTrigger value="users">Utilizatori</TabsTrigger>
          <TabsTrigger value="projects">Proiecte</TabsTrigger>
          <TabsTrigger value="reports">Raportări{open > 0 && ` (${open})`}</TabsTrigger>
        </TabsList>
        <TabsContent value="users" className="mt-4">
          {wrap(
            users,
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Din</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.data?.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{roleLabel[u.role]}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{u.status === "ACTIVE" ? "Activ" : "Blocat"}</Badge>
                    </TableCell>
                    <TableCell>{formatDate(u.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      {u.role !== "ADMIN" && (
                        <Button size="sm" variant="ghost" onClick={() => block.mutate(u.id)}>
                          {u.status === "ACTIVE" ? "Blochează" : "Deblochează"}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>,
          )}
        </TabsContent>
        <TabsContent value="projects" className="mt-4">
          {wrap(
            projects,
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titlu</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.data?.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="max-w-xs truncate">{p.title}</TableCell>
                    <TableCell>{p.ownerName}</TableCell>
                    <TableCell>{statusLabel[p.status]}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => delProject.mutate(p.id)}>
                        Șterge
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>,
          )}
        </TabsContent>
        <TabsContent value="reports" className="mt-4">
          {wrap(
            reports,
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Motiv</TableHead>
                  <TableHead>Țintă</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.data?.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.reason}</TableCell>
                    <TableCell className="max-w-xs truncate">{r.targetName}</TableCell>
                    <TableCell>{formatDate(r.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      {r.status === "OPEN" ? (
                        <Button size="sm" variant="soft" onClick={() => resolve.mutate(r.id)}>
                          Rezolvă
                        </Button>
                      ) : (
                        <Badge variant="outline">Rezolvat</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>,
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
