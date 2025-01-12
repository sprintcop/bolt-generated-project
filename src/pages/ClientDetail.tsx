import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, User, Eye } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Client {
  id: string;
  name: string;
  email: string;
  description: string | null;
  created_at: string;
}

interface Process {
  id: string;
  filing_number: string | null;
  filing_date: string;
  court: string;
  judge: string;
  process_type: string;
  process_class: string;
  process_subclass: string;
  created_at: string;
}

export function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [client, setClient] = useState<Client | null>(null);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClientData();
  }, [id]);

  const fetchClientData = async () => {
    try {
      // Fetch client data
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select("*")
        .eq("id", id)
        .single();

      if (clientError) throw clientError;

      setClient(clientData);

      // Fetch related processes
      const { data: processesData, error: processesError } = await supabase
        .from("processes")
        .select("*")
        .eq("client_id", id)
        .order("created_at", { ascending: false });

      if (processesError) throw processesError;

      setProcesses(processesData || []);
    } catch (error) {
      console.error("Error fetching client data:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar la información del cliente.",
        variant: "destructive",
      });
      navigate("/dashboard/clients");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Skeleton className="h-6 w-6" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid gap-6">
          <Skeleton className="h-[200px]" />
          <Skeleton className="h-[400px]" />
        </div>
      </div>
    );
  }

  if (!client) return null;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <User className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Detalle del Cliente</h1>
        </div>
        <Button variant="outline" onClick={() => navigate("/dashboard/clients")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Client Information */}
        <Card>
          <CardHeader>
            <CardTitle>Información del Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Nombre</p>
              <p className="text-lg">{client.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Correo Electrónico</p>
              <p className="text-lg">{client.email}</p>
            </div>
            {client.description && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Descripción</p>
                <p className="text-lg">{client.description}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-muted-foreground">Fecha de Registro</p>
              <p className="text-lg">{new Date(client.created_at).toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>

        {/* Client Processes */}
        <Card>
          <CardHeader>
            <CardTitle>Procesos del Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Radicado</TableHead>
                    <TableHead>Fecha Radicación</TableHead>
                    <TableHead>Despacho</TableHead>
                    <TableHead>Ponente</TableHead>
                    <TableHead>Tipo Proceso</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No hay procesos registrados para este cliente.
                      </TableCell>
                    </TableRow>
                  ) : (
                    processes.map((process) => (
                      <TableRow key={process.id}>
                        <TableCell>{process.filing_number || "-"}</TableCell>
                        <TableCell>{new Date(process.filing_date).toLocaleDateString()}</TableCell>
                        <TableCell>{process.court}</TableCell>
                        <TableCell>{process.judge}</TableCell>
                        <TableCell>{process.process_type}</TableCell>
                        <TableCell>
                          <div className="flex justify-end">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => navigate(`/dashboard/processes/${process.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
