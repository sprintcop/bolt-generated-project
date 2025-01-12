import { useEffect, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users2, Plus, Loader2, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface ProcessSubject {
  id: string;
  process_id: string;
  type: string;
  name: string;
  created_at: string;
}

const SUBJECT_TYPES = [
  "Demandante",
  "Demandado",
  "Tercero Interviniente",
  "Coadyuvante",
  "Ministerio Público",
  "Otro"
];

export function ProcessSubjects() {
  const { id: processId } = useParams();
  const { toast } = useToast();
  const [subjects, setSubjects] = useState<ProcessSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<ProcessSubject | null>(null);
  const [formData, setFormData] = useState({
    type: "",
    name: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchSubjects();
  }, [processId]);

  const fetchSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from("process_subjects")
        .select("*")
        .eq("process_id", processId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setSubjects(data || []);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los sujetos procesales.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      type: value,
    }));
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("No user found");

      const { error } = await supabase.from("process_subjects").insert([
        {
          ...formData,
          process_id: processId,
          user_id: userData.user.id,
        },
      ]);

      if (error) throw error;

      toast({
        title: "Sujeto procesal creado",
        description: "El sujeto procesal ha sido creado exitosamente.",
      });

      setFormData({
        type: "",
        name: "",
      });
      setIsCreateDialogOpen(false);
      fetchSubjects();
    } catch (error) {
      console.error("Error creating subject:", error);
      toast({
        title: "Error",
        description: "No se pudo crear el sujeto procesal.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (subject: ProcessSubject) => {
    setSelectedSubject(subject);
    setFormData({
      type: subject.type,
      name: subject.name,
    });
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject) return;
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("process_subjects")
        .update(formData)
        .eq("id", selectedSubject.id);

      if (error) throw error;

      toast({
        title: "Sujeto procesal actualizado",
        description: "El sujeto procesal ha sido actualizado exitosamente.",
      });

      setIsEditDialogOpen(false);
      fetchSubjects();
    } catch (error) {
      console.error("Error updating subject:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el sujeto procesal.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (subject: ProcessSubject) => {
    setSelectedSubject(subject);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedSubject) return;
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("process_subjects")
        .delete()
        .eq("id", selectedSubject.id);

      if (error) throw error;

      toast({
        title: "Sujeto procesal eliminado",
        description: "El sujeto procesal ha sido eliminado exitosamente.",
      });

      setIsDeleteDialogOpen(false);
      fetchSubjects();
    } catch (error) {
      console.error("Error deleting subject:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el sujeto procesal.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const SubjectForm = ({ onSubmit }: { onSubmit: (e: React.FormEvent) => Promise<void> }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="type">Tipo</Label>
        <Select
          value={formData.type}
          onValueChange={handleSelectChange}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar tipo" />
          </SelectTrigger>
          <SelectContent>
            {SUBJECT_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="name">Nombre</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {selectedSubject ? "Guardar Cambios" : "Crear Sujeto Procesal"}
      </Button>
    </form>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Users2 className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Sujetos Procesales</h1>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Sujeto Procesal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nuevo Sujeto Procesal</DialogTitle>
            </DialogHeader>
            <SubjectForm onSubmit={handleCreateSubmit} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Fecha de Creación</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : subjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No hay sujetos procesales registrados.
                </TableCell>
              </TableRow>
            ) : (
              subjects.map((subject) => (
                <TableRow key={subject.id}>
                  <TableCell>{subject.type}</TableCell>
                  <TableCell>{subject.name}</TableCell>
                  <TableCell>{new Date(subject.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditClick(subject)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(subject)}
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Sujeto Procesal</DialogTitle>
          </DialogHeader>
          <SubjectForm onSubmit={handleEditSubmit} />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Sujeto Procesal</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este sujeto procesal? Esta acción no se puede deshacer.
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
