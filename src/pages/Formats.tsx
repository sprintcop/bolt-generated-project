import { useEffect, useState } from "react";
import { FileText, Loader2, Download } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/lib/supabase";

interface Task {
  id: string;
  name: string;
  description: string | null;
  due_date: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  created_at: string;
  process: {
    id: string;
    filing_number: string | null;
    court: string;
    client: {
      name: string;
    };
  };
}

interface Hearing {
  id: string;
  name: string;
  description: string | null;
  hearing_status: string | null;
  due_date: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  created_at: string;
  process: {
    id: string;
    filing_number: string | null;
    court: string;
    client: {
      name: string;
    };
  };
}

interface Term {
  id: string;
  name: string;
  description: string | null;
  days_term: number;
  notification_date: string | null;
  due_date: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  created_at: string;
  process: {
    id: string;
    filing_number: string | null;
    court: string;
    client: {
      name: string;
    };
  };
}

export function Formats() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [taskStatusFilter, setTaskStatusFilter] = useState<string>("all");
  const [tasksLoading, setTasksLoading] = useState(true);

  const [hearings, setHearings] = useState<Hearing[]>([]);
  const [filteredHearings, setFilteredHearings] = useState<Hearing[]>([]);
  const [hearingStatusFilter, setHearingStatusFilter] = useState<string>("all");
  const [hearingsLoading, setHearingsLoading] = useState(true);

  const [terms, setTerms] = useState<Term[]>([]);
  const [filteredTerms, setFilteredTerms] = useState<Term[]>([]);
  const [termStatusFilter, setTermStatusFilter] = useState<string>("all");
  const [termsLoading, setTermsLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
    fetchHearings();
    fetchTerms();
  }, []);

  useEffect(() => {
    if (taskStatusFilter === "all") {
      setFilteredTasks(tasks);
    } else {
      setFilteredTasks(tasks.filter(task => task.status === taskStatusFilter));
    }
  }, [taskStatusFilter, tasks]);

  useEffect(() => {
    if (hearingStatusFilter === "all") {
      setFilteredHearings(hearings);
    } else {
      setFilteredHearings(hearings.filter(hearing => hearing.status === hearingStatusFilter));
    }
  }, [hearingStatusFilter, hearings]);

  useEffect(() => {
    if (termStatusFilter === "all") {
      setFilteredTerms(terms);
    } else {
      setFilteredTerms(terms.filter(term => term.status === termStatusFilter));
    }
  }, [termStatusFilter, terms]);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from("process_tasks")
        .select(`
          id,
          name,
          description,
          due_date,
          status,
          created_at,
          process:processes (
            id,
            filing_number,
            court,
            client:clients (
              name
            )
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setTasks(data || []);
      setFilteredTasks(data || []);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setTasksLoading(false);
    }
  };

  const fetchHearings = async () => {
    try {
      const { data, error } = await supabase
        .from("process_hearings")
        .select(`
          id,
          name,
          description,
          hearing_status,
          due_date,
          status,
          created_at,
          process:processes (
            id,
            filing_number,
            court,
            client:clients (
              name
            )
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setHearings(data || []);
      setFilteredHearings(data || []);
    } catch (error) {
      console.error("Error fetching hearings:", error);
    } finally {
      setHearingsLoading(false);
    }
  };

  const fetchTerms = async () => {
    try {
      const { data, error } = await supabase
        .from("process_terms")
        .select(`
          id,
          name,
          description,
          days_term,
          notification_date,
          due_date,
          status,
          created_at,
          process:processes (
            id,
            filing_number,
            court,
            client:clients (
              name
            )
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setTerms(data || []);
      setFilteredTerms(data || []);
    } catch (error) {
      console.error("Error fetching terms:", error);
    } finally {
      setTermsLoading(false);
    }
  };

  const handleExportTasksCSV = () => {
    const csvData = filteredTasks.map(task => ({
      Cliente: task.process.client.name,
      'Número de Radicado': task.process.filing_number || 'Sin radicado',
      Despacho: task.process.court,
      Tarea: task.name,
      Descripción: task.description || '',
      'Fecha de Vencimiento': task.due_date ? new Date(task.due_date).toLocaleDateString() : ''
    }));

    const headers = ['Cliente', 'Número de Radicado', 'Despacho', 'Tarea', 'Descripción', 'Fecha de Vencimiento'];
    const csvString = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => `"${row[header as keyof typeof row]}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'tareas.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportHearingsCSV = () => {
    const csvData = filteredHearings.map(hearing => ({
      Cliente: hearing.process.client.name,
      'Número de Radicado': hearing.process.filing_number || 'Sin radicado',
      Despacho: hearing.process.court,
      Audiencia: hearing.name,
      Descripción: hearing.description || '',
      'Estado de la Audiencia': hearing.hearing_status || '',
      'Fecha': hearing.due_date ? new Date(hearing.due_date).toLocaleDateString() : ''
    }));

    const headers = ['Cliente', 'Número de Radicado', 'Despacho', 'Audiencia', 'Descripción', 'Estado de la Audiencia', 'Fecha'];
    const csvString = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => `"${row[header as keyof typeof row]}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'audiencias.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportTermsCSV = () => {
    const csvData = filteredTerms.map(term => ({
      Cliente: term.process.client.name,
      'Número de Radicado': term.process.filing_number || 'Sin radicado',
      Despacho: term.process.court,
      Término: term.name,
      Descripción: term.description || '',
      'Días de Término': term.days_term,
      'Fecha de Notificación': term.notification_date ? new Date(term.notification_date).toLocaleDateString() : '',
      'Fecha de Vencimiento': term.due_date ? new Date(term.due_date).toLocaleDateString() : ''
    }));

    const headers = ['Cliente', 'Número de Radicado', 'Despacho', 'Término', 'Descripción', 'Días de Término', 'Fecha de Notificación', 'Fecha de Vencimiento'];
    const csvString = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => `"${row[header as keyof typeof row]}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'terminos.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <FileText className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Formatos</h1>
      </div>

      <Tabs defaultValue="tasks" className="w-full">
        <TabsList className="w-full justify-start mb-6">
          <TabsTrigger value="tasks">Tareas</TabsTrigger>
          <TabsTrigger value="hearings">Audiencias</TabsTrigger>
          <TabsTrigger value="terms">Términos</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks">
          <div className="flex items-center justify-between mb-4">
            <Select
              value={taskStatusFilter}
              onValueChange={setTaskStatusFilter}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las tareas</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="in_progress">En progreso</SelectItem>
                <SelectItem value="completed">Completadas</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleExportTasksCSV} disabled={tasksLoading || filteredTasks.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Proceso</TableHead>
                  <TableHead>Tarea</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Fecha de Vencimiento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasksLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : filteredTasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No hay tareas registradas.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell>{task.process.client.name}</TableCell>
                      <TableCell>
                        {task.process.filing_number || "Sin radicado"}
                        <br />
                        <span className="text-sm text-muted-foreground">
                          {task.process.court}
                        </span>
                      </TableCell>
                      <TableCell>{task.name}</TableCell>
                      <TableCell>{task.description || "-"}</TableCell>
                      <TableCell>
                        {task.due_date ? new Date(task.due_date).toLocaleDateString() : "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="hearings">
          <div className="flex items-center justify-between mb-4">
            <Select
              value={hearingStatusFilter}
              onValueChange={setHearingStatusFilter}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las audiencias</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="in_progress">En progreso</SelectItem>
                <SelectItem value="completed">Completadas</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleExportHearingsCSV} disabled={hearingsLoading || filteredHearings.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Proceso</TableHead>
                  <TableHead>Audiencia</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Estado de la Audiencia</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hearingsLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : filteredHearings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No hay audiencias registradas.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredHearings.map((hearing) => (
                    <TableRow key={hearing.id}>
                      <TableCell>{hearing.process.client.name}</TableCell>
                      <TableCell>
                        {hearing.process.filing_number || "Sin radicado"}
                        <br />
                        <span className="text-sm text-muted-foreground">
                          {hearing.process.court}
                        </span>
                      </TableCell>
                      <TableCell>{hearing.name}</TableCell>
                      <TableCell>{hearing.description || "-"}</TableCell>
                      <TableCell>{hearing.hearing_status || "-"}</TableCell>
                      <TableCell>
                        {hearing.due_date ? new Date(hearing.due_date).toLocaleDateString() : "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="terms">
          <div className="flex items-center justify-between mb-4">
            <Select
              value={termStatusFilter}
              onValueChange={setTermStatusFilter}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los términos</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="in_progress">En progreso</SelectItem>
                <SelectItem value="completed">Completados</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleExportTermsCSV} disabled={termsLoading || filteredTerms.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Proceso</TableHead>
                  <TableHead>Término</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Días de Término</TableHead>
                  <TableHead>Fecha de Notificación</TableHead>
                  <TableHead>Fecha de Vencimiento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {termsLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : filteredTerms.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No hay términos registrados.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTerms.map((term) => (
                    <TableRow key={term.id}>
                      <TableCell>{term.process.client.name}</TableCell>
                      <TableCell>
                        {term.process.filing_number || "Sin radicado"}
                        <br />
                        <span className="text-sm text-muted-foreground">
                          {term.process.court}
                        </span>
                      </TableCell>
                      <TableCell>{term.name}</TableCell>
                      <TableCell>{term.description || "-"}</TableCell>
                      <TableCell>{term.days_term} días</TableCell>
                      <TableCell>
                        {term.notification_date ? new Date(term.notification_date).toLocaleDateString() : "-"}
                      </TableCell>
                      <TableCell>
                        {term.due_date ? new Date(term.due_date).toLocaleDateString() : "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
