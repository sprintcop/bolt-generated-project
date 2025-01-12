import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ClipboardList, Link2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Process {
  id: string;
  client_id: string;
  filing_date: string;
  filing_number: string | null;
  documents_url: string | null;
  court: string;
  judge: string;
  process_type: string;
  process_class: string;
  process_subclass: string;
  resource: string | null;
  file_location: string | null;
  filing_content: string | null;
  created_at: string;
  client: {
    name: string;
    email: string;
  };
}

export function ProcessDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [process, setProcess] = useState<Process | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProcess();
  }, [id]);

  const fetchProcess = async () => {
    try {
      const { data, error } = await supabase
        .from("processes")
        .select(`
          *,
          client:clients (
            name,
            email
          )
        `)
        .eq("id", id)
        .single();

      if (error) throw error;

      setProcess(data);
    } catch (error) {
      console.error("Error fetching process:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar el proceso.",
        variant: "destructive",
      });
      navigate("/dashboard/processes");
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
        <div className="grid gap-6 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-[200px]" />
          ))}
        </div>
      </div>
    );
  }

  if (!process) return null;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Detalle del Proceso</h1>
        </div>
        <Button variant="outline" onClick={() => navigate("/dashboard/processes")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Client Information */}
        <Card>
          <CardHeader>
            <CardTitle>Información del Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Nombre</p>
              <p className="text-lg">{process.client.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Correo Electrónico</p>
              <p className="text-lg">{process.client.email}</p>
            </div>
          </CardContent>
        </Card>

        {/* Basic Process Information */}
        <Card>
          <CardHeader>
            <CardTitle>Información Básica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Radicado</p>
              <p className="text-lg">{process.filing_number || "-"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Fecha de Radicación</p>
              <p className="text-lg">{new Date(process.filing_date).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Despacho</p>
              <p className="text-lg">{process.court}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Ponente</p>
              <p className="text-lg">{process.judge}</p>
            </div>
          </CardContent>
        </Card>

        {/* Process Classification */}
        <Card>
          <CardHeader>
            <CardTitle>Clasificación del Proceso</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Tipo de Proceso</p>
              <p className="text-lg">{process.process_type}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Clase de Proceso</p>
              <p className="text-lg">{process.process_class}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Subclase de Proceso</p>
              <p className="text-lg">{process.process_subclass}</p>
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Información Adicional</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Recurso</p>
              <p className="text-lg">{process.resource || "-"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Ubicación del Expediente</p>
              <p className="text-lg">{process.file_location || "-"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Contenido de Radicación</p>
              <p className="text-lg">{process.filing_content || "-"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Documentos</p>
              {process.documents_url ? (
                <a
                  href={process.documents_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center"
                >
                  <Link2 className="h-4 w-4 mr-1" />
                  Ver documentos
                </a>
              ) : (
                <p className="text-lg">-</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
