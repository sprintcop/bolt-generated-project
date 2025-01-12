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
    import { ClipboardList, Plus, Loader2, MessageSquare, Calendar, Pencil, Trash2, ArrowUpDown } from "lucide-react";
    import { supabase } from "@/lib/supabase";

    interface Comment {
      id: string;
      task_id: string;
      content: string;
      created_at: string;
    }

    interface Task {
      id: string;
      process_id: string;
      name: string;
      description: string | null;
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
      due_date: "",
      priority: "medium" as const,
      status: "pending" as const,
      responsable: "",
    };

    export function ProcessTasks() {
      const { id: processId } = useParams();
      const { toast } = useToast();
      const [tasks, setTasks] = useState<Task[]>([]);
      const [loading, setLoading] = useState(true);
      const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
      const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
      const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
      const [isCommentDialogOpen, setIsCommentDialogOpen] = useState(false);
      const [selectedTask, setSelectedTask] = useState<Task | null>(null);
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
        fetchTasks();
      }, [processId]);

      useEffect(() => {
        if (!isCreateDialogOpen && !isEditDialogOpen) {
          setFormData(initialFormState);
        }
      }, [isCreateDialogOpen, isEditDialogOpen]);

      const fetchTasks = async () => {
        try {
          const { data, error } = await supabase
            .from("process_tasks")
            .select(`
              *,
              comments:task_comments(id, content, created_at)
            `)
            .eq("process_id", processId)
            .order("created_at", { ascending: false });

          if (error) throw error;

          setTasks(data || []);
        } catch (error) {
          console.error("Error fetching tasks:", error);
          toast({
            title: "Error",
            description: "No se pudieron cargar las tareas.",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      };

      const handleStatusChange = async (taskId: string, newStatus: Task['status']) => {
        try {
          const { error } = await supabase
            .from("process_tasks")
            .update({ status: newStatus })
            .eq("id", taskId);

          if (error) throw error;

          // Update local state
          setTasks(prevTasks => 
            prevTasks.map(task => 
              task.id === taskId ? { ...task, status: newStatus } : task
            )
          );

          toast({
            title: "Estado actualizado",
            description: "El estado de la tarea ha sido actualizado exitosamente.",
          });
        } catch (error) {
          console.error("Error updating task status:", error);
          toast({
            title: "Error",
            description: "No se pudo actualizar el estado de la tarea.",
            variant: "destructive",
          });
          
          // Refresh tasks to ensure UI is in sync with database
          fetchTasks();
        }
      };

      const handleEditClick = (task: Task) => {
        setSelectedTask(task);
        setFormData({
          name: task.name,
          description: task.description || "",
          due_date: task.due_date || "",
          priority: task.priority,
          status: task.status,
          responsable: task.responsable || "",
        });
        setIsEditDialogOpen(true);
      };

      const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTask) return;
        setIsSubmitting(true);

        try {
          const { error } = await supabase
            .from("process_tasks")
            .update(formData)
            .eq("id", selectedTask.id);

          if (error) throw error;

          toast({
            title: "Tarea actualizada",
            description: "La tarea ha sido actualizada exitosamente.",
          });

          setIsEditDialogOpen(false);
          fetchTasks();
        } catch (error) {
          console.error("Error updating task:", error);
          toast({
            title: "Error",
            description: "No se pudo actualizar la tarea.",
            variant: "destructive",
          });
        } finally {
          setIsSubmitting(false);
        }
      };

      const handleDeleteClick = (task: Task) => {
        setSelectedTask(task);
        setIsDeleteDialogOpen(true);
      };

      const handleDeleteConfirm = async () => {
        if (!selectedTask) return;
        setIsSubmitting(true);

        try {
          const { error } = await supabase
            .from("process_tasks")
            .delete()
            .eq("id", selectedTask.id);

          if (error) throw error;

          toast({
            title: "Tarea eliminada",
            description: "La tarea ha sido eliminada exitosamente.",
          });

          setIsDeleteDialogOpen(false);
          fetchTasks();
        } catch (error) {
          console.error("Error deleting task:", error);
          toast({
            title: "Error",
            description: "No se pudo eliminar la tarea.",
            variant: "destructive",
          });
        } finally {
          setIsSubmitting(false);
        }
      };

      const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) {
          toast({
            title: "Error",
            description: "El nombre de la tarea es requerido.",
            variant: "destructive",
          });
          return;
        }

        setIsSubmitting(true);

        try {
          const { data: userData } = await supabase.auth.getUser();
          if (!userData.user) throw new Error("No user found");

          const { error } = await supabase.from("process_tasks").insert([
            {
              ...formData,
              process_id: processId,
              user_id: userData.user.id,
            },
          ]);

          if (error) throw error;

          toast({
            title: "Tarea creada",
            description: "La tarea ha sido creada exitosamente.",
          });

          setFormData(initialFormState);
          setIsCreateDialogOpen(false);
          fetchTasks();
        } catch (error) {
          console.error("Error creating task:", error);
          toast({
            title: "Error",
            description: "No se pudo crear la tarea.",
            variant: "destructive",
          });
        } finally {
          setIsSubmitting(false);
        }
      };

      const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTask) return;
        if (!commentContent.trim()) {
          toast({
            title: "Error",
            description: "El comentario no puede estar vacío.",
            variant: "destructive",
          });
          return;
        }

        setIsSubmitting(true);

        try {
          const { data: userData } = await supabase.auth.getUser();
          if (!userData.user) throw new Error("No user found");

          const { error } = await supabase.from("task_comments").insert([
            {
              task_id: selectedTask.id,
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
          fetchTasks();
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

      const TaskCard = ({ task }: { task: Task }) => (
        <div
          className="bg-card p-4 rounded-lg shadow-sm border mb-3"
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("taskId", task.id);
          }}
        >
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-medium">{task.name}</h3>
            <Badge variant="outline" className={PRIORITY_COLORS[task.priority]}>
              {task.priority}
            </Badge>
          </div>
          {task.description && (
            <p className="text-sm text-muted-foreground mb-3">{task.description}</p>
          )}
          {task.responsable && (
            <p className="text-sm text-muted-foreground mb-3">Responsable: {task.responsable}</p>
          )}
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
            {task.due_date && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(task.due_date).toLocaleDateString()}
              </div>
            )}
            <div className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              {task.comments.length} comentarios
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1"
              onClick={() => {
                setSelectedTask(task);
                setIsCommentDialogOpen(true);
              }}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Comentar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEditClick(task)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteClick(task)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      );

      const TaskColumn = ({ title, status, tasks }: { title: string; status: Task['status']; tasks: Task[] }) => {
        const sortedTasks = [...tasks]
          .filter(task => filterResponsables[status] === 'all' || task.responsable === filterResponsables[status])
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
              const taskId = e.dataTransfer.getData("taskId");
              handleStatusChange(taskId, status);
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
                    {Array.from(new Set(tasks.map(task => task.responsable))).filter(Boolean).map(responsable => (
                      <SelectItem key={responsable} value={responsable}>
                        {responsable}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {sortedTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
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
              <ClipboardList className="h-6 w-6" />
              <h1 className="text-2xl font-bold">Tareas</h1>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Tarea
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear Nueva Tarea</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full"
                      placeholder="Nombre de la tarea"
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
                      className="w-full min-h-[100px]"
                      placeholder="Descripción detallada de la tarea"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="due_date">Fecha Límite</Label>
                    <Input
                      id="due_date"
                      name="due_date"
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Prioridad</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value: Task['priority']) => setFormData({ ...formData, priority: value })}
                    >
                      <SelectTrigger className="w-full">
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
                      className="w-full"
                      placeholder="Responsable de la tarea"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Crear Tarea
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex gap-6 overflow-x-auto pb-6">
            <TaskColumn
              title="Pendientes"
              status="pending"
              tasks={tasks.filter((task) => task.status === "pending")}
            />
            <TaskColumn
              title="En Curso"
              status="in_progress"
              tasks={tasks.filter((task) => task.status === "in_progress")}
            />
            <TaskColumn
              title="Finalizadas"
              status="completed"
              tasks={tasks.filter((task) => task.status === "completed")}
            />
          </div>

          {/* Edit Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Tarea</DialogTitle>
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
                  <Label htmlFor="edit-due-date">Fecha Límite</Label>
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
                    onValueChange={(value: Task['priority']) => setFormData({ ...formData, priority: value })}
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
                <DialogTitle>Eliminar Tarea</DialogTitle>
                <DialogDescription>
                  ¿Estás seguro de que deseas eliminar esta tarea? Esta acción no se puede deshacer.
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
                <DialogTitle>Comentarios - {selectedTask?.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <ScrollArea className="h-[300px] pr-4">
                  {selectedTask?.comments.map((comment, index) => (
                    <div key={comment.id} className="mb-4">
                      <div className="bg-muted p-3 rounded-lg">
                        <p className="text-sm">{comment.content}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(comment.created_at).toLocaleString()}
                        </p>
                      </div>
                      {index < selectedTask.comments.length - 1 && (
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
                      className="w-full min-h-[100px]"
                      placeholder="Escribe tu comentario aquí"
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
