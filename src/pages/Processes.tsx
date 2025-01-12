import { useEffect, useState } from "react";
    import { useNavigate } from "react-router-dom";
    import { useToast } from "@/components/ui/use-toast";
    import { Button } from "@/components/ui/button";
    import {
      Dialog,
      DialogContent,
      DialogHeader,
      DialogTitle,
      DialogTrigger,
      DialogDescription,
      DialogFooter,
    } from "@/components/ui/dialog";
    import {
      Table,
      TableBody,
      TableCell,
      TableHead,
      TableHeader,
      TableRow,
    } from "@/components/ui/table";
    import {
      Select,
      SelectContent,
      SelectItem,
      SelectTrigger,
      SelectValue,
    } from "@/components/ui/select";
    import { Input } from "@/components/ui/input";
    import { Label } from "@/components/ui/label";
    import { Textarea } from "@/components/ui/textarea";
    import { ClipboardList, Plus, Loader2, Pencil, Trash2, ChevronLeft, ChevronRight, Eye, Search } from "lucide-react";
    import { supabase } from "@/lib/supabase";

    interface Process {
      id: string;
      client_id: string;
      filing_number: string | null;
      filing_date: string;
      court: string;
      judge: string;
      process_type: string;
      process_class: string;
      process_subclass: string;
      documents_url: string | null;
      resource: string | null;
      file_location: string | null;
      filing_content: string | null;
      created_at: string;
      client: {
        name: string;
        email: string;
      };
    }

    interface Client {
      id: string;
      name: string;
      email: string;
    }

    export function Processes() {
      const navigate = useNavigate();
      const { toast } = useToast();
      const [processes, setProcesses] = useState<Process[]>([]);
      const [clients, setClients] = useState<Client[]>([]);
      const [loading, setLoading] = useState(true);
      const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
      const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
      const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
      const [selectedProcess, setSelectedProcess] = useState<Process | null>(null);
      const [formData, setFormData] = useState({
        client_id: "",
        filing_number: "",
        filing_date: "",
        court: "",
        judge: "",
        process_type: "",
        process_class: "",
        process_subclass: "",
        documents_url: "",
        resource: "",
        file_location: "",
        filing_content: "",
      });
      const [isSubmitting, setIsSubmitting] = useState(false);
      const [currentPage, setCurrentPage] = useState(1);
      const itemsPerPage = 5;
      const [searchQuery, setSearchQuery] = useState("");
      const [filteredProcesses, setFilteredProcesses] = useState<Process[]>([]);

      useEffect(() => {
        fetchProcesses();
        fetchClients();
      }, []);

      useEffect(() => {
        const filtered = processes.filter((process) => {
          const search = searchQuery.toLowerCase();
          return (
            process.client.name.toLowerCase().includes(search) ||
            (process.filing_number?.toLowerCase().includes(search) || false)
          );
        });
        setFilteredProcesses(filtered);
      }, [searchQuery, processes]);

      const fetchProcesses = async () => {
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
            .order("created_at", { ascending: false });

          if (error) throw error;

          setProcesses(data || []);
          setFilteredProcesses(data || []);
        } catch (error) {
          console.error("Error fetching processes:", error);
          toast({
            title: "Error",
            description: "No se pudieron cargar los procesos.",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      };

      const fetchClients = async () => {
        try {
          const { data, error } = await supabase
            .from("clients")
            .select("id, name, email")
            .order("name");

          if (error) throw error;

          setClients(data || []);
        } catch (error) {
          console.error("Error fetching clients:", error);
        }
      };

      const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
          ...prev,
          [name]: value,
        }));
      };

      const handleSelectChange = (name: string, value: string) => {
        setFormData((prev) => ({
          ...prev,
          [name]: value,
        }));
      };

      const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
          const { data: userData } = await supabase.auth.getUser();
          if (!userData.user) throw new Error("No user found");

          const { error } = await supabase.from("processes").insert([
            {
              ...formData,
              user_id: userData.user.id,
            },
          ]);

          if (error) throw error;

          toast({
            title: "Proceso creado",
            description: "El proceso ha sido creado exitosamente.",
          });

          setFormData({
            client_id: "",
            filing_number: "",
            filing_date: "",
            court: "",
            judge: "",
            process_type: "",
            process_class: "",
            process_subclass: "",
            documents_url: "",
            resource: "",
            file_location: "",
            filing_content: "",
          });
          setIsCreateDialogOpen(false);
          fetchProcesses();
        } catch (error) {
          console.error("Error creating process:", error);
          toast({
            title: "Error",
            description: "No se pudo crear el proceso.",
            variant: "destructive",
          });
        } finally {
          setIsSubmitting(false);
        }
      };

      const handleEditClick = (process: Process) => {
        setSelectedProcess(process);
        setFormData({
          client_id: process.client_id,
          filing_number: process.filing_number || "",
          filing_date: process.filing_date,
          court: process.court,
          judge: process.judge,
          process_type: process.process_type,
          process_class: process.process_class,
          process_subclass: process.process_subclass,
          documents_url: process.documents_url || "",
          resource: process.resource || "",
          file_location: process.file_location || "",
          filing_content: process.filing_content || "",
        });
        setIsEditDialogOpen(true);
      };

      const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProcess) return;
        setIsSubmitting(true);

        try {
          const { error } = await supabase
            .from("processes")
            .update(formData)
            .eq("id", selectedProcess.id);

          if (error) throw error;

          toast({
            title: "Proceso actualizado",
            description: "El proceso ha sido actualizado exitosamente.",
          });

          setIsEditDialogOpen(false);
          fetchProcesses();
        } catch (error) {
          console.error("Error updating process:", error);
          toast({
            title: "Error",
            description: "No se pudo actualizar el proceso.",
            variant: "destructive",
          });
        } finally {
          setIsSubmitting(false);
        }
      };

      const handleDeleteClick = (process: Process) => {
        setSelectedProcess(process);
        setIsDeleteDialogOpen(true);
      };

      const handleDeleteConfirm = async () => {
        if (!selectedProcess) return;
        setIsSubmitting(true);

        try {
          const { error } = await supabase
            .from("processes")
            .delete()
            .eq("id", selectedProcess.id);

          if (error) throw error;

          toast({
            title: "Proceso eliminado",
            description: "El proceso ha sido eliminado exitosamente.",
          });

          setIsDeleteDialogOpen(false);
          fetchProcesses();
        } catch (error) {
          console.error("Error deleting process:", error);
          toast({
            title: "Error",
            description: "No se pudo eliminar el proceso.",
            variant: "destructive",
          });
        } finally {
          setIsSubmitting(false);
        }
      };

      const handleViewClick = (process: Process) => {
        navigate(`/dashboard/processes/${process.id}`);
      };

      // Pagination
      const totalPages = Math.ceil(filteredProcesses.length / itemsPerPage);
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const currentProcesses = filteredProcesses.slice(startIndex, endIndex);

      const ProcessForm = ({ onSubmit }: { onSubmit: (e: React.FormEvent) => Promise<void> }) => (
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client_id">Cliente</Label>
            <Select
              value={formData.client_id}
              onValueChange={(value) => handleSelectChange("client_id", value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="filing_number">Radicado</Label>
            <Input
              id="filing_number"
              name="filing_number"
              value={formData.filing_number}
              onChange={handleInputChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="filing_date">Fecha de Radicación</Label>
            <Input
              id="filing_date"
              name="filing_date"
              type="date"
              value={formData.filing_date}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="court">Despacho</Label>
            <Input
              id="court"
              name="court"
              value={formData.court}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="judge">Ponente</Label>
            <Input
              id="judge"
              name="judge"
              value={formData.judge}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="process_type">Tipo de Proceso</Label>
            <Input
              id="process_type"
              name="process_type"
              value={formData.process_type}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="process_class">Clase de Proceso</Label>
            <Input
              id="process_class"
              name="process_class"
              value={formData.process_class}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="process_subclass">Subclase de Proceso</Label>
            <Input
              id="process_subclass"
              name="process_subclass"
              value={formData.process_subclass}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="documents_url">URL de Documentos</Label>
            <Input
              id="documents_url"
              name="documents_url"
              type="url"
              value={formData.documents_url}
              onChange={handleInputChange}
              placeholder="https://"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="resource">Recurso</Label>
            <Input
              id="resource"
              name="resource"
              value={formData.resource}
              onChange={handleInputChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="file_location">Ubicación del Expediente</Label>
            <Input
              id="file_location"
              name="file_location"
              value={formData.file_location}
              onChange={handleInputChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="filing_content">Contenido de Radicación</Label>
            <Textarea
              id="filing_content"
              name="filing_content"
              value={formData.filing_content}
              onChange={handleInputChange}
              rows={3}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {selectedProcess ? "Guardar Cambios" : "Crear Proceso"}
          </Button>
        </form>
      );

      return (
        <>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-6 w-6" />
              <h1 className="text-2xl font-bold">Procesos</h1>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="text"
                placeholder="Buscar por cliente o radicado..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-xs"
              />
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Proceso
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Crear Nuevo Proceso</DialogTitle>
                  </DialogHeader>
                  <ProcessForm onSubmit={handleCreateSubmit} />
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Radicado</TableHead>
                  <TableHead>Fecha Radicación</TableHead>
                  <TableHead>Despacho</TableHead>
                  <TableHead>Ponente</TableHead>
                  <TableHead>Tipo Proceso</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : currentProcesses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No hay procesos registrados.
                    </TableCell>
                  </TableRow>
                ) : (
                  currentProcesses.map((process) => (
                    <TableRow key={process.id}>
                      <TableCell>{process.client.name}</TableCell>
                      <TableCell>{process.filing_number || "-"}</TableCell>
                      <TableCell>{new Date(process.filing_date).toLocaleDateString()}</TableCell>
                      <TableCell>{process.court}</TableCell>
                      <TableCell>{process.judge}</TableCell>
                      <TableCell>{process.process_type}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewClick(process)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditClick(process)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(process)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {!loading && processes.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Mostrando {startIndex + 1}-{Math.min(endIndex, filteredProcesses.length)} de {filteredProcesses.length} procesos
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Edit Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Editar Proceso</DialogTitle>
              </DialogHeader>
              <ProcessForm onSubmit={handleEditSubmit} />
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Eliminar Proceso</DialogTitle>
                <DialogDescription>
                  ¿Estás seguro de que deseas eliminar este proceso? Esta acción no se puede deshacer.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteConfirm}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    "Eliminar"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      );
    }
