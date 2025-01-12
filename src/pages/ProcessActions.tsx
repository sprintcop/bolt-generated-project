import { useEffect, useState, useRef } from "react";
    import { useParams } from "react-router-dom";
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
    import { Input } from "@/components/ui/input";
    import { Label } from "@/components/ui/label";
    import { Textarea } from "@/components/ui/textarea";
    import { ScrollText, Plus, Loader2, Pencil, Trash2, Upload, ChevronLeft, ChevronRight, ArrowUpDown, Search } from "lucide-react";
    import { supabase } from "@/lib/supabase";

    interface ProcessAction {
      id: string;
      process_id: string;
      action_date: string;
      action: string;
      annotation: string | null;
      term_start_date: string | null;
      term_end_date: string | null;
      registration_date: string;
      created_at: string;
    }

    export function ProcessActions() {
      const { id: processId } = useParams();
      const { toast } = useToast();
      const [actions, setActions] = useState<ProcessAction[]>([]);
      const [loading, setLoading] = useState(true);
      const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
      const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
      const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
      const [selectedAction, setSelectedAction] = useState<ProcessAction | null>(null);
      const [formData, setFormData] = useState({
        action_date: "",
        action: "",
        annotation: "",
        term_start_date: "",
        term_end_date: "",
      });
      const [isSubmitting, setIsSubmitting] = useState(false);
      const fileInputRef = useRef<HTMLInputElement>(null);
      const [isUploading, setIsUploading] = useState(false);
      const [searchQuery, setSearchQuery] = useState("");
      const [filteredActions, setFilteredActions] = useState<ProcessAction[]>([]);

      // Paginación y ordenamiento
      const [currentPage, setCurrentPage] = useState(1);
      const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
      const itemsPerPage = 10;

      useEffect(() => {
        fetchActions();
      }, [processId, sortOrder]);

      useEffect(() => {
        const filtered = actions.filter((action) => {
          const search = searchQuery.toLowerCase();
          return (
            action.action.toLowerCase().includes(search) ||
            (action.annotation?.toLowerCase().includes(search) || false)
          );
        });
        setFilteredActions(filtered);
      }, [searchQuery, actions]);

      const fetchActions = async () => {
        try {
          const { data, error } = await supabase
            .from("process_actions")
            .select("*")
            .eq("process_id", processId)
            .order('action_date', { ascending: sortOrder === 'asc' });

          if (error) throw error;

          setActions(data || []);
          setFilteredActions(data || []);
        } catch (error) {
          console.error("Error fetching actions:", error);
          toast({
            title: "Error",
            description: "No se pudieron cargar las actuaciones.",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
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

      const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
          const { data: userData } = await supabase.auth.getUser();
          if (!userData.user) throw new Error("No user found");

          const { error } = await supabase.from("process_actions").insert([
            {
              ...formData,
              process_id: processId,
              user_id: userData.user.id,
            },
          ]);

          if (error) throw error;

          toast({
            title: "Actuación creada",
            description: "La actuación ha sido creada exitosamente.",
          });

          setFormData({
            action_date: "",
            action: "",
            annotation: "",
            term_start_date: "",
            term_end_date: "",
          });
          setIsCreateDialogOpen(false);
          fetchActions();
        } catch (error) {
          console.error("Error creating action:", error);
          toast({
            title: "Error",
            description: "No se pudo crear la actuación.",
            variant: "destructive",
          });
        } finally {
          setIsSubmitting(false);
        }
      };

      const handleEditClick = (action: ProcessAction) => {
        setSelectedAction(action);
        setFormData({
          action_date: action.action_date,
          action: action.action,
          annotation: action.annotation || "",
          term_start_date: action.term_start_date || "",
          term_end_date: action.term_end_date || "",
        });
        setIsEditDialogOpen(true);
      };

      const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAction) return;
        setIsSubmitting(true);

        try {
          const { error } = await supabase
            .from("process_actions")
            .update(formData)
            .eq("id", selectedAction.id);

          if (error) throw error;

          toast({
            title: "Actuación actualizada",
            description: "La actuación ha sido actualizada exitosamente.",
          });

          setIsEditDialogOpen(false);
          fetchActions();
        } catch (error) {
          console.error("Error updating action:", error);
          toast({
            title: "Error",
            description: "No se pudo actualizar la actuación.",
            variant: "destructive",
          });
        } finally {
          setIsSubmitting(false);
        }
      };

      const handleDeleteClick = (action: ProcessAction) => {
        setSelectedAction(action);
        setIsDeleteDialogOpen(true);
      };

      const handleDeleteConfirm = async () => {
        if (!selectedAction) return;
        setIsSubmitting(true);

        try {
          const { error } = await supabase
            .from("process_actions")
            .delete()
            .eq("id", selectedAction.id);

          if (error) throw error;

          toast({
            title: "Actuación eliminada",
            description: "La actuación ha sido eliminada exitosamente.",
          });

          setIsDeleteDialogOpen(false);
          fetchActions();
        } catch (error) {
          console.error("Error deleting action:", error);
          toast({
            title: "Error",
            description: "No se pudo eliminar la actuación.",
            variant: "destructive",
          });
        } finally {
          setIsSubmitting(false);
        }
      };

      const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploading(true);

        try {
          const text = await file.text();
          
          // Función auxiliar para parsear CSV respetando comillas
          const parseCSVLine = (line: string): string[] => {
            const result = [];
            let cell = '';
            let inQuotes = false;
            
            for (let i = 0; i < line.length; i++) {
              const char = line[i];
              
              if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                  // Doble comilla dentro de comillas - añadir una sola comilla
                  cell += '"';
                  i++;
                } else {
                  // Cambiar estado de comillas
                  inQuotes = !inQuotes;
                }
              } else if (char === ',' && !inQuotes) {
                // Final de la celda - añadir al resultado
                result.push(cell.trim());
                cell = '';
              } else {
                cell += char;
              }
            }
            
            // Añadir la última celda
            result.push(cell.trim());
            return result;
          };

          // Dividir por líneas y eliminar líneas vacías
          const rows = text.split('\n')
            .map(row => row.trim())
            .filter(row => row.length > 0);
          
          if (rows.length < 2) {
            throw new Error('El archivo CSV debe contener al menos un encabezado y una fila de datos');
          }

          // Parsear headers y normalizar
          const headers = parseCSVLine(rows[0]).map(header => 
            header.trim().toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .replace(/\s+/g, ' ')
          );

          // Mapear los nombres de columnas esperados
          const columnMap = {
            'fecha de actuacion': 'action_date',
            'fecha actuacion': 'action_date',
            'actuacion': 'action',
            'anotacion': 'annotation',
            'fecha inicia termino': 'term_start_date',
            'fecha finaliza termino': 'term_end_date'
          };

          // Validar columnas necesarias
          const dateColumnIndex = headers.findIndex(h => 
            h.includes('fecha') && (h.includes('actuacion') || h.includes('actuación'))
          );
          const actionColumnIndex = headers.findIndex(h => 
            h === 'actuacion' || h === 'actuación'
          );

          if (dateColumnIndex === -1 || actionColumnIndex === -1) {
            throw new Error('El CSV debe contener al menos las columnas "Fecha de Actuación" y "Actuación"');
          }

          const { data: userData } = await supabase.auth.getUser();
          if (!userData.user) throw new Error("No user found");

          // Procesar las filas de datos
          const actions = rows.slice(1).map(row => {
            const values = parseCSVLine(row);
            
            if (!values[dateColumnIndex] || !values[actionColumnIndex]) {
              throw new Error('Todas las filas deben tener fecha de actuación y actuación');
            }

            const action: any = {
              process_id: processId,
              user_id: userData.user.id,
              action_date: '',
              action: values[actionColumnIndex]
            };

            // Procesar la fecha de actuación
            const rawDate = values[dateColumnIndex];
            let actionDate = null;

            if (rawDate.includes('/')) {
              const [day, month, year] = rawDate.split('/').map(Number);
              actionDate = new Date(year, month - 1, day);
            } else if (rawDate.includes('-')) {
              actionDate = new Date(rawDate);
            }

            if (!actionDate || isNaN(actionDate.getTime())) {
              throw new Error(`Formato de fecha inválido en la fila: ${row}`);
            }

            action.action_date = actionDate.toISOString().split('T')[0];

            // Procesar campos opcionales
            headers.forEach((header, index) => {
              if (index === dateColumnIndex || index === actionColumnIndex) return;
              if (!values[index]) return;

              const dbColumn = columnMap[header as keyof typeof columnMap];
              if (!dbColumn) return;

              if (dbColumn.includes('date')) {
                try {
                  let date = null;
                  const rawValue = values[index];

                  if (rawValue.includes('/')) {
                    const [day, month, year] = rawValue.split('/').map(Number);
                    date = new Date(year, month - 1, day);
                  } else if (rawValue.includes('-')) {
                    date = new Date(rawValue);
                  }

                  if (date && !isNaN(date.getTime())) {
                    action[dbColumn] = date.toISOString().split('T')[0];
                  }
                } catch (e) {
                  console.warn(`Ignorando fecha inválida: ${values[index]}`);
                }
              } else {
                action[dbColumn] = values[index];
              }
            });

            return action;
          });

          const { error } = await supabase
            .from("process_actions")
            .insert(actions);

          if (error) throw error;

          toast({
            title: "Actuaciones importadas",
            description: `Se importaron ${actions.length} actuaciones exitosamente.`,
          });

          fetchActions();

          // Limpiar el input file
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        } catch (error) {
          console.error("Error importing actions:", error);
          toast({
            title: "Error",
            description: error.message || "Error al importar actuaciones. Verifica que el archivo CSV tenga el formato correcto.",
            variant: "destructive",
          });
        } finally {
          setIsUploading(false);
        }
      };

      const handleDownloadTemplate = () => {
        const headers = [
          '"Fecha de Actuación"',
          '"Actuación"',
          '"Anotación"',
          '"Fecha Inicia Término"',
          '"Fecha Finaliza Término"'
        ];
        const csvContent = headers.join(',');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'plantilla_actuaciones.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      };

      // Paginación
      const totalPages = Math.ceil(filteredActions.length / itemsPerPage);
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const currentActions = filteredActions.slice(startIndex, endIndex);

      const toggleSortOrder = () => {
        setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
      };

      return (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <ScrollText className="h-6 w-6" />
              <h1 className="text-2xl font-bold">Actuaciones</h1>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="text"
                placeholder="Buscar por actuación o anotación..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-xs"
              />
              <input
                type="file"
                ref={fileInputRef}
                accept=".csv"
                className="hidden"
                onChange={handleFileUpload}
              />
              <Button
                variant="outline"
                onClick={handleDownloadTemplate}
              >
                Descargar Plantilla
              </Button>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Importar CSV
              </Button>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Actuación
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Crear Nueva Actuación</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="action_date">Fecha de Actuación</Label>
                      <Input
                        id="action_date"
                        name="action_date"
                        type="date"
                        value={formData.action_date}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="action">Actuación</Label>
                      <Textarea
                        id="action"
                        name="action"
                        value={formData.action}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="annotation">Anotación</Label>
                      <Textarea
                        id="annotation"
                        name="annotation"
                        value={formData.annotation}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="term_start_date">Fecha Inicia Término</Label>
                        <Input
                          id="term_start_date"
                          name="term_start_date"
                          type="date"
                          value={formData.term_start_date}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="term_end_date">Fecha Finaliza Término</Label>
                        <Input
                          id="term_end_date"
                          name="term_end_date"
                          type="date"
                          value={formData.term_end_date}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Crear Actuación
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={toggleSortOrder}
                      className="flex items-center gap-1"
                    >
                      Fecha Actuación
                      <ArrowUpDown className="h-4 w-4" />
                      {sortOrder === 'asc' ? ' (Más antiguas primero)' : ' (Más recientes primero)'}
                    </Button>
                  </TableHead>
                  <TableHead>Actuación</TableHead>
                  <TableHead>Anotación</TableHead>
                  <TableHead>Fecha Inicia Término</TableHead>
                  <TableHead>Fecha Finaliza Término</TableHead>
                  <TableHead>Fecha Registro</TableHead>
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
                ) : currentActions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No hay actuaciones registradas.
                    </TableCell>
                  </TableRow>
                ) : (
                  currentActions.map((action) => (
                    <TableRow key={action.id}>
                      <TableCell>{new Date(action.action_date).toLocaleDateString()}</TableCell>
                      <TableCell>{action.action}</TableCell>
                      <TableCell>{action.annotation || "-"}</TableCell>
                      <TableCell>
                        {action.term_start_date ? new Date(action.term_start_date).toLocaleDateString() : "-"}
                      </TableCell>
                      <TableCell>
                        {action.term_end_date ? new Date(action.term_end_date).toLocaleDateString() : "-"}
                      </TableCell>
                      <TableCell>{new Date(action.registration_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditClick(action)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(action)}
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

          {/* Paginación */}
          {!loading && actions.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Mostrando {startIndex + 1}-{Math.min(endIndex, filteredActions.length)} de {filteredActions.length} actuaciones
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
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Actuación</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-action-date">Fecha de Actuación</Label>
                  <Input
                    id="edit-action-date"
                    name="action_date"
                    type="date"
                    value={formData.action_date}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-action">Actuación</Label>
                  <Textarea
                    id="edit-action"
                    name="action"
                    value={formData.action}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-annotation">Anotación</Label>
                  <Textarea
                    id="edit-annotation"
                    name="annotation"
                    value={formData.annotation}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-term-start-date">Fecha Inicia Término</Label>
                    <Input
                      id="edit-term-start-date"
                      name="term_start_date"
                      type="date"
                      value={formData.term_start_date}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-term-end-date">Fecha Finaliza Término</Label>
                    <Input
                      id="edit-term-end-date"
                      name="term_end_date"
                      type="date"
                      value={formData.term_end_date}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Guardar Cambios
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Eliminar Actuación</DialogTitle>
                <DialogDescription>
                  ¿Estás seguro de que deseas eliminar esta actuación? Esta acción no se puede deshacer.
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
        </div>
      );
    }
