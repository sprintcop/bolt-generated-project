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
    import { Input } from "@/components/ui/input";
    import { Label } from "@/components/ui/label";
    import { Textarea } from "@/components/ui/textarea";
    import {
      Select,
      SelectContent,
      SelectItem,
      SelectTrigger,
      SelectValue,
    } from "@/components/ui/select";
    import { ScrollArea } from "@/components/ui/scroll-area";
    import { Separator } from "@/components/ui/separator";
    import { Badge } from "@/components/ui/badge";
    import { Gavel, Plus, Loader2, MessageSquare, Calendar, Pencil, Trash2, ArrowUpDown } from "lucide-react";
    import { supabase } from "@/lib/supabase";

    interface Comment {
      id: string;
      hearing_id: string;
      content: string;
      created_at: string;
    }

    interface Hearing {
      id: string;
      process_id: string;
      name: string;
      description: string | null;
      hearing_status: string | null;
      due_date: string | null;
      priority: 'low' | 'medium' | 'high';
      status: 'pending' | 'in_progress' | 'completed';
      created_at: string;
      comments: Comment[];
      responsable: string | null;
    }

    const PRIORITY_COLORS = {
      low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    };

    const initialFormState = {
      name: "",
      description: "",
      hearing_status: "",
      due_date: "",
      priority: "medium" as const,
      status: "pending" as const,
      responsable: "",
    };

    export function ProcessHearings() {
      const { id: processId } = useParams();
      const { toast } = useToast();
      const [hearings, setHearings] = useState<Hearing[]>([]);
      const [loading, setLoading] = useState(true);
      const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
      const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
      const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
      const [isCommentDialogOpen, setIsCommentDialogOpen] = useState(false);
      const [selectedHearing, setSelectedHearing] = useState<Hearing | null>(null);
      const [commentContent, setCommentContent] = useState("");
      const [isSubmitting, setIsSubmitting] = useState(false);
      const [formData, setFormData] = useState(initialFormState);
      const [sortPriorities, setSortPriorities] = useState<{
        pending: 'asc' | 'desc';
        in_progress: 'asc' | 'desc';
        completed: 'asc' | 'desc';
      }>({
        pending: 'asc',
        in_progress: 'asc',
        completed: 'asc',
      });
      const [filterResponsables, setFilterResponsables] = useState<{
        pending: string;
        in_progress: string;
        completed: string;
      }>({
        pending: 'all',
        in_progress: 'all',
        completed: 'all',
      });

      useEffect(() => {
        fetchHearings();
      }, [processId]);

      useEffect(() => {
        if (!isCreateDialogOpen && !isEditDialogOpen) {
          setFormData(initialFormState);
        }
      }, [isCreateDialogOpen, isEditDialogOpen]);

      const fetchHearings = async () => {
        try {
          // Fetch hearings
          const { data: hearingsData, error: hearingsError } = await supabase
            .from("process_hearings")
            .select("*")
            .eq("process_id", processId)
            .order("created_at", { ascending: false });

          if (hearingsError) throw hearingsError;

          // Fetch comments for all hearings
          const { data: commentsData, error: commentsError } = await supabase
            .from("hearing_comments")
            .select("*")
            .in("hearing_id", hearingsData?.map(hearing => hearing.id) || [])
            .order("created_at", { ascending: true });

          if (commentsError) throw commentsError;

          // Combine hearings with their comments
          const hearingsWithComments = hearingsData?.map(hearing => ({
            ...hearing,
            comments: commentsData?.filter(comment => comment.hearing_id === hearing.id) || [],
          })) || [];

          setHearings(hearingsWithComments);
        } catch (error) {
          console.error("Error fetching hearings:", error);
          toast({
            title: "Error",
            description: "No se pudieron cargar las audiencias.",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      };

      const handleStatusChange = async (hearingId: string, newStatus: Hearing['status']) => {
        try {
          const { error } = await supabase
            .from("process_hearings")
            .update({ status: newStatus })
            .eq("id", hearingId);

          if (error) throw error;

          // Update local state
          setHearings(prevHearings => 
            prevHearings.map(hearing => 
              hearing.id === hearingId ? { ...hearing, status: newStatus } : hearing
            )
          );

          toast({
            title: "Estado actualizado",
            description: "El estado de la audiencia ha sido actualizado exitosamente.",
          });
        } catch (error) {
          console.error("Error updating hearing status:", error);
          toast({
            title: "Error",
            description: "No se pudo actualizar el estado de la audiencia.",
            variant: "destructive",
          });
          
          // Refresh hearings to ensure UI is in sync with database
          fetchHearings();
        }
      };

      const handleEditClick = (hearing: Hearing) => {
        setSelectedHearing(hearing);
        setFormData({
          name: hearing.name,
          description: hearing.description || "",
          hearing_status: hearing.hearing_status || "",
          due_date: hearing.due_date || "",
          priority: hearing.priority,
          status: hearing.status,
          responsable: hearing.responsable || "",
        });
        setIsEditDialogOpen(true);
      };

      const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedHearing) return;
        setIsSubmitting(true);

        try {
          const { error } = await supabase
            .from("process_hearings")
            .update(formData)
            .eq("id", selectedHearing.id);

          if (error) throw error;

          toast({
            title: "Audiencia actualizada",
            description: "La audiencia ha sido actualizada exitosamente.",
          });

          setIsEditDialogOpen(false);
          fetchHearings();
        } catch (error) {
          console.error("Error updating hearing:", error);
          toast({
            title: "Error",
            description: "No se pudo actualizar la audiencia.",
            variant: "destructive",
          });
        } finally {
          setIsSubmitting(false);
        }
      };

      const handleDeleteClick = (hearing: Hearing) => {
        setSelectedHearing(hearing);
        setIsDeleteDialogOpen(true);
      };

      const handleDeleteConfirm = async () => {
        if (!selectedHearing) return;
        setIsSubmitting(true);

        try {
          const { error } = await supabase
            .from("process_hearings")
            .delete()
            .eq("id", selectedHearing.id);

          if (error) throw error;

          toast({
            title: "Audiencia eliminada",
            description: "La audiencia ha sido eliminada exitosamente.",
          });

          setIsDeleteDialogOpen(false);
          fetchHearings();
        } catch (error) {
          console.error("Error deleting hearing:", error);
          toast({
            title: "Error",
            description: "No se pudo eliminar la audiencia.",
            variant: "destructive",
          });
        } finally {
          setIsSubmitting(false);
        }
      };

      const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
          const { data: userData } = await supabase.auth.getUser();
          if (!userData.user) throw new Error("No user found");

          const { error } = await supabase.from("process_hearings").insert([
            {
              ...formData,
              process_id: processId,
              user_id: userData.user.id,
            },
          ]);

          if (error) throw error;

          toast({
            title: "Audiencia creada",
            description: "La audiencia ha sido creada exitosamente.",
          });

          setFormData(initialFormState);
          setIsCreateDialogOpen(false);
          fetchHearings();
        } catch (error) {
          console.error("Error creating hearing:", error);
          toast({
            title: "Error",
            description: "No se pudo crear la audiencia.",
            variant: "destructive",
          });
        } finally {
          setIsSubmitting(false);
        }
      };

      const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedHearing) return;
        setIsSubmitting(true);

        try {
          const { data: userData } = await supabase.auth.getUser();
          if (!userData.user) throw new Error("No user found");

          const { error } = await supabase.from("hearing_comments").insert([
            {
              hearing_id: selectedHearing.id,
              content: commentContent,
              user_id: userData.user.id,
            },
          ]);

          if (error) throw error;

          toast({
            title: "Comentario añadido",
            description: "El comentario ha sido añadido exitosamente.",
          });

          setCommentContent("");
          setIsCommentDialogOpen(false);
          fetchHearings();
        } catch (error) {
          console.error("Error adding comment:", error);
          toast({
            title: "Error",
            description: "No se pudo añadir el comentario.",
            variant: "destructive",
          });
        } finally {
          setIsSubmitting(false);
        }
      };

      const HearingCard = ({ hearing }: { hearing: Hearing }) => (
        <div
          className="bg-card p-4 rounded-lg shadow-sm border mb-3"
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("hearingId", hearing.id);
          }}
        >
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-medium">{hearing.name}</h3>
            <Badge variant="outline" className={PRIORITY_COLORS[hearing.priority]}>
              {hearing.priority}
            </Badge>
          </div>
          {hearing.description && (
            <p className="text-sm text-muted-foreground mb-3">{hearing.description}</p>
          )}
          {hearing.hearing_status && (
            <p className="text-sm text-muted-foreground mb-3">
              Estado: {hearing.hearing_status}
            </p>
          )}
          {hearing.responsable && (
            <p className="text-sm text-muted-foreground mb-3">Responsable: {hearing.responsable}</p>
          )}
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
            {hearing.due_date && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(hearing.due_date).toLocaleDateString()}
              </div>
            )}
            <div className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              {hearing.comments.length} comentarios
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1"
              onClick={() => {
                setSelectedHearing(hearing);
                setIsCommentDialogOpen(true);
              }}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Comentar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEditClick(hearing)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteClick(hearing)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      );

      const HearingColumn = ({ title, status, hearings }: { title: string; status: Hearing['status']; hearings: Hearing[] }) => {
        const sortedHearings = [...hearings]
          .filter(hearing => filterResponsables[status] === 'all' || hearing.responsable === filterResponsables[status])
          .sort((a, b) => {
            const priorityOrder = { low: 1, medium: 2, high: 3 };
            return sortPriorities[status] === 'asc'
              ? priorityOrder[a.priority] - priorityOrder[b.priority]
              : priorityOrder[b.priority] - priorityOrder[a.priority];
          });

        const toggleSort = () => {
          setSortPriorities(prev => ({
            ...prev,
            [status]: prev[status] === 'asc' ? 'desc' : 'asc',
          }));
        };

        return (
          <div
            className="flex-1 min-w-[300px] bg-muted/50 p-4 rounded-lg"
            onDragOver={(e) => {
              e.preventDefault();
              e.currentTarget.classList.add('bg-muted');
            }}
            onDragLeave={(e) => {
              e.currentTarget.classList.remove('bg-muted');
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('bg-muted');
              const hearingId = e.dataTransfer.getData("hearingId");
              handleStatusChange(hearingId, status);
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">{title}</h2>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleSort}
                >
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
                <Select
                  value={filterResponsables[status]}
                  onValueChange={(value) => setFilterResponsables(prev => ({ ...prev, [status]: value }))}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filtrar por responsable" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {Array.from(new Set(hearings.map(hearing => hearing.responsable))).filter(Boolean).map(responsable => (
                      <SelectItem key={responsable} value={responsable}>
                        {responsable}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {sortedHearings.map((hearing) => (
              <HearingCard key={hearing.id} hearing={hearing} />
            ))}
          </div>
        );
      };

      if (loading) {
        return (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        );
      }

      return (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Gavel className="h-6 w-6" />
              <h1 className="text-2xl font-bold">Audiencias</h1>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Audiencia
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear Nueva Audiencia</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Descripción</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hearing_status">Estado de la Audiencia</Label>
                    <Input
                      id="hearing_status"
                      name="hearing_status"
                      value={formData.hearing_status}
                      onChange={(e) => setFormData({ ...formData, hearing_status: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="due_date">Fecha</Label>
                    <Input
                      id="due_date"
                      name="due_date"
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Prioridad</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value: Hearing['priority']) => setFormData({ ...formData, priority: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baja</SelectItem>
                        <SelectItem value="medium">Media</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="responsable">Responsable</Label>
                    <Input
                      id="responsable"
                      name="responsable"
                      value={formData.responsable}
                      onChange={(e) => setFormData({ ...formData, responsable: e.target.value })}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Crear Audiencia
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex gap-6 overflow-x-auto pb-6">
            <HearingColumn
              title="Pendientes"
              status="pending"
              hearings={hearings.filter((hearing) => hearing.status === "pending")}
            />
            <HearingColumn
              title="En Curso"
              status="in_progress"
              hearings={hearings.filter((hearing) => hearing.status === "in_progress")}
            />
            <HearingColumn
              title="Finalizadas"
              status="completed"
              hearings={hearings.filter((hearing) => hearing.status === "completed")}
            />
          </div>

          {/* Edit Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Audiencia</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Nombre</Label>
                  <Input
                    id="edit-name"
                    name="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Descripción</Label>
                  <Textarea
                    id="edit-description"
                    name="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-hearing-status">Estado de la Audiencia</Label>
                  <Input
                    id="edit-hearing-status"
                    name="hearing_status"
                    value={formData.hearing_status}
                    onChange={(e) => setFormData({ ...formData, hearing_status: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-due-date">Fecha</Label>
                  <Input
                    id="edit-due-date"
                    name="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-priority">Prioridad</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value: Hearing['priority']) => setFormData({ ...formData, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baja</SelectItem>
                      <SelectItem value="medium">Media</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-responsable">Responsable</Label>
                  <Input
                    id="edit-responsable"
                    name="responsable"
                    value={formData.responsable}
                    onChange={(e) => setFormData({ ...formData, responsable: e.target.value })}
                  />
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
                <DialogTitle>Eliminar Audiencia</DialogTitle>
                <DialogDescription>
                  ¿Estás seguro de que deseas eliminar esta audiencia? Esta acción no se puede deshacer.
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

          {/* Comments Dialog */}
          <Dialog open={isCommentDialogOpen} onOpenChange={setIsCommentDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Comentarios - {selectedHearing?.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <ScrollArea className="h-[300px] pr-4">
                  {selectedHearing?.comments.map((comment, index) => (
                    <div key={comment.id} className="mb-4">
                      <div className="bg-muted p-3 rounded-lg">
                        <p className="text-sm">{comment.content}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(comment.created_at).toLocaleString()}
                        </p>
                      </div>
                      {index < selectedHearing.comments.length - 1 && (
                        <Separator className="my-4" />
                      )}
                    </div>
                  ))}
                </ScrollArea>
                <form onSubmit={handleAddComment} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="comment">Nuevo Comentario</Label>
                    <Textarea
                      id="comment"
                      value={commentContent}
                      onChange={(e) => setCommentContent(e.target.value)}
                      required
                      rows={3}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Añadir Comentario
                  </Button>
                </form>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      );
    }
