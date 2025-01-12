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
    import { Timer, Plus, Loader2, MessageSquare, Calendar, Pencil, Trash2, ArrowUpDown } from "lucide-react";
    import { supabase } from "@/lib/supabase";

    interface Comment {
      id: string;
      term_id: string;
      content: string;
      created_at: string;
    }

    interface Term {
      id: string;
      process_id: string;
      name: string;
      description: string | null;
      days_term: number;
      notification_date: string | null;
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
      days_term: "",
      notification_date: "",
      due_date: "",
      priority: "medium" as const,
      status: "pending" as const,
      responsable: "",
    };

    export function ProcessTerms() {
      const { id: processId } = useParams();
      const { toast } = useToast();
      const [terms, setTerms] = useState<Term[]>([]);
      const [loading, setLoading] = useState(true);
      const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
      const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
      const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
      const [isCommentDialogOpen, setIsCommentDialogOpen] = useState(false);
      const [selectedTerm, setSelectedTerm] = useState<Term | null>(null);
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
        fetchTerms();
      }, [processId]);

      useEffect(() => {
        if (!isCreateDialogOpen && !isEditDialogOpen) {
          setFormData(initialFormState);
        }
      }, [isCreateDialogOpen, isEditDialogOpen]);

      const fetchTerms = async () => {
        try {
          // Fetch terms
          const { data: termsData, error: termsError } = await supabase
            .from("process_terms")
            .select("*")
            .eq("process_id", processId)
            .order("created_at", { ascending: false });

          if (termsError) throw termsError;

          // Fetch comments for all terms
          const { data: commentsData, error: commentsError } = await supabase
            .from("term_comments")
            .select("*")
            .in("term_id", termsData?.map(term => term.id) || [])
            .order("created_at", { ascending: true });

          if (commentsError) throw commentsError;

          // Combine terms with their comments
          const termsWithComments = termsData?.map(term => ({
            ...term,
            comments: commentsData?.filter(comment => comment.term_id === term.id) || [],
          })) || [];

          setTerms(termsWithComments);
        } catch (error) {
          console.error("Error fetching terms:", error);
          toast({
            title: "Error",
            description: "No se pudieron cargar los términos.",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      };

      const handleStatusChange = async (termId: string, newStatus: Term['status']) => {
        try {
          const { error } = await supabase
            .from("process_terms")
            .update({ status: newStatus })
            .eq("id", termId);

          if (error) throw error;

          // Update local state
          setTerms(prevTerms => 
            prevTerms.map(term => 
              term.id === termId ? { ...term, status: newStatus } : term
            )
          );

          toast({
            title: "Estado actualizado",
            description: "El estado del término ha sido actualizado exitosamente.",
          });
        } catch (error) {
          console.error("Error updating term status:", error);
          toast({
            title: "Error",
            description: "No se pudo actualizar el estado del término.",
            variant: "destructive",
          });
          
          // Refresh terms to ensure UI is in sync with database
          fetchTerms();
        }
      };

      const handleEditClick = (term: Term) => {
        setSelectedTerm(term);
        setFormData({
          name: term.name,
          description: term.description || "",
          days_term: term.days_term.toString(),
          notification_date: term.notification_date || "",
          due_date: term.due_date || "",
          priority: term.priority,
          status: term.status,
          responsable: term.responsable || "",
        });
        setIsEditDialogOpen(true);
      };

      const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTerm) return;
        setIsSubmitting(true);

        try {
          const { error } = await supabase
            .from("process_terms")
            .update({
              ...formData,
              days_term: parseInt(formData.days_term),
            })
            .eq("id", selectedTerm.id);

          if (error) throw error;

          toast({
            title: "Término actualizado",
            description: "El término ha sido actualizado exitosamente.",
          });

          setIsEditDialogOpen(false);
          fetchTerms();
        } catch (error) {
          console.error("Error updating term:", error);
          toast({
            title: "Error",
            description: "No se pudo actualizar el término.",
            variant: "destructive",
          });
        } finally {
          setIsSubmitting(false);
        }
      };

      const handleDeleteClick = (term: Term) => {
        setSelectedTerm(term);
        setIsDeleteDialogOpen(true);
      };

      const handleDeleteConfirm = async () => {
        if (!selectedTerm) return;
        setIsSubmitting(true);

        try {
          const { error } = await supabase
            .from("process_terms")
            .delete()
            .eq("id", selectedTerm.id);

          if (error) throw error;

          toast({
            title: "Término eliminado",
            description: "El término ha sido eliminado exitosamente.",
          });

          setIsDeleteDialogOpen(false);
          fetchTerms();
        } catch (error) {
          console.error("Error deleting term:", error);
          toast({
            title: "Error",
            description: "No se pudo eliminar el término.",
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

          const { error } = await supabase.from("process_terms").insert([
            {
              ...formData,
              days_term: parseInt(formData.days_term),
              process_id: processId,
              user_id: userData.user.id,
            },
          ]);

          if (error) throw error;

          toast({
            title: "Término creado",
            description: "El término ha sido creado exitosamente.",
          });

          setFormData(initialFormState);
          setIsCreateDialogOpen(false);
          fetchTerms();
        } catch (error) {
          console.error("Error creating term:", error);
          toast({
            title: "Error",
            description: "No se pudo crear el término.",
            variant: "destructive",
          });
        } finally {
          setIsSubmitting(false);
        }
      };

      const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTerm) return;
        setIsSubmitting(true);

        try {
          const { data: userData } = await supabase.auth.getUser();
          if (!userData.user) throw new Error("No user found");

          const { error } = await supabase.from("term_comments").insert([
            {
              term_id: selectedTerm.id,
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
          fetchTerms();
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

      const TermCard = ({ term }: { term: Term }) => (
        <div
          className="bg-card p-4 rounded-lg shadow-sm border mb-3"
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("termId", term.id);
          }}
        >
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-medium">{term.name}</h3>
            <Badge variant="outline" className={PRIORITY_COLORS[term.priority]}>
              {term.priority}
            </Badge>
          </div>
          {term.description && (
            <p className="text-sm text-muted-foreground mb-3">{term.description}</p>
          )}
          {term.responsable && (
            <p className="text-sm text-muted-foreground mb-3">Responsable: {term.responsable}</p>
          )}
          <div className="text-sm text-muted-foreground mb-3">
            <p>Término: {term.days_term} días</p>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
            {term.notification_date && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Notificación: {new Date(term.notification_date).toLocaleDateString()}
              </div>
            )}
            {term.due_date && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Vencimiento: {new Date(term.due_date).toLocaleDateString()}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
            <MessageSquare className="h-4 w-4" />
            {term.comments.length} comentarios
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1"
              onClick={() => {
                setSelectedTerm(term);
                setIsCommentDialogOpen(true);
              }}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Comentar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEditClick(term)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteClick(term)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      );

      const TermColumn = ({ title, status, terms }: { title: string; status: Term['status']; terms: Term[] }) => {
        const sortedTerms = [...terms]
          .filter(term => filterResponsables[status] === 'all' || term.responsable === filterResponsables[status])
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
              const termId = e.dataTransfer.getData("termId");
              handleStatusChange(termId, status);
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
                    {Array.from(new Set(terms.map(term => term.responsable))).filter(Boolean).map(responsable => (
                      <SelectItem key={responsable} value={responsable}>
                        {responsable}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {sortedTerms.map((term) => (
              <TermCard key={term.id} term={term} />
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
              <Timer className="h-6 w-6" />
              <h1 className="text-2xl font-bold">Términos</h1>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Término
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear Nuevo Término</DialogTitle>
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
                    <Label htmlFor="days_term">Término (días)</Label>
                    <Input
                      id="days_term"
                      name="days_term"
                      type="number"
                      min="1"
                      value={formData.days_term}
                      onChange={(e) => setFormData({ ...formData, days_term: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notification_date">Fecha de Notificación</Label>
                    <Input
                      id="notification_date"
                      name="notification_date"
                      type="date"
                      value={formData.notification_date}
                      onChange={(e) => setFormData({ ...formData, notification_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="due_date">Fecha de Vencimiento</Label>
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
                      onValueChange={(value: Term['priority']) => setFormData({ ...formData, priority: value })}
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
                    Crear Término
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex gap-6 overflow-x-auto pb-6">
            <TermColumn
              title="Pendientes"
              status="pending"
              terms={terms.filter((term) => term.status === "pending")}
            />
            <TermColumn
              title="En Curso"
              status="in_progress"
              terms={terms.filter((term) => term.status === "in_progress")}
            />
            <TermColumn
              title="Finalizados"
              status="completed"
              terms={terms.filter((term) => term.status === "completed")}
            />
          </div>

          {/* Edit Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Término</DialogTitle>
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
                  <Label htmlFor="edit-days-term">Término (días)</Label>
                  <Input
                    id="edit-days-term"
                    name="days_term"
                    type="number"
                    min="1"
                    value={formData.days_term}
                    onChange={(e) => setFormData({ ...formData, days_term: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-notification-date">Fecha de Notificación</Label>
                  <Input
                    id="edit-notification-date"
                    name="notification_date"
                    type="date"
                    value={formData.notification_date}
                    onChange={(e) => setFormData({ ...formData, notification_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-due-date">Fecha de Vencimiento</Label>
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
                    onValueChange={(value: Term['priority']) => setFormData({ ...formData, priority: value })}
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
                <DialogTitle>Eliminar Término</DialogTitle>
                <DialogDescription>
                  ¿Estás seguro de que deseas eliminar este término? Esta acción no se puede deshacer.
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
                <DialogTitle>Comentarios - {selectedTerm?.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <ScrollArea className="h-[300px] pr-4">
                  {selectedTerm?.comments.map((comment, index) => (
                    <div key={comment.id} className="mb-4">
                      <div className="bg-muted p-3 rounded-lg">
                        <p className="text-sm">{comment.content}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(comment.created_at).toLocaleString()}
                        </p>
                      </div>
                      {index < selectedTerm.comments.length - 1 && (
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
