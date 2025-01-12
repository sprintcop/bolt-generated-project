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
    import { Users, Plus, Loader2, MessageSquare, Calendar, MapPin, Pencil, Trash2, ArrowUpDown } from "lucide-react";
    import { supabase } from "@/lib/supabase";

    interface Comment {
      id: string;
      meeting_id: string;
      content: string;
      created_at: string;
    }

    interface Meeting {
      id: string;
      process_id: string;
      name: string;
      description: string | null;
      location: string | null;
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
      location: "",
      due_date: "",
      priority: "medium" as const,
      status: "pending" as const,
      responsable: "",
    };

    export function ProcessMeetings() {
      const { id: processId } = useParams();
      const { toast } = useToast();
      const [meetings, setMeetings] = useState<Meeting[]>([]);
      const [loading, setLoading] = useState(true);
      const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
      const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
      const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
      const [isCommentDialogOpen, setIsCommentDialogOpen] = useState(false);
      const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
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
        fetchMeetings();
      }, [processId]);

      useEffect(() => {
        if (!isCreateDialogOpen && !isEditDialogOpen) {
          setFormData(initialFormState);
        }
      }, [isCreateDialogOpen, isEditDialogOpen]);

      const fetchMeetings = async () => {
        try {
          // Fetch meetings
          const { data: meetingsData, error: meetingsError } = await supabase
            .from("process_meetings")
            .select("*")
            .eq("process_id", processId)
            .order("created_at", { ascending: false });

          if (meetingsError) throw meetingsError;

          // Fetch comments for all meetings
          const { data: commentsData, error: commentsError } = await supabase
            .from("meeting_comments")
            .select("*")
            .in("meeting_id", meetingsData?.map(meeting => meeting.id) || [])
            .order("created_at", { ascending: true });

          if (commentsError) throw commentsError;

          // Combine meetings with their comments
          const meetingsWithComments = meetingsData?.map(meeting => ({
            ...meeting,
            comments: commentsData?.filter(comment => comment.meeting_id === meeting.id) || [],
          })) || [];

          setMeetings(meetingsWithComments);
        } catch (error) {
          console.error("Error fetching meetings:", error);
          toast({
            title: "Error",
            description: "No se pudieron cargar las reuniones.",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      };

      const handleStatusChange = async (meetingId: string, newStatus: Meeting['status']) => {
        try {
          const { error } = await supabase
            .from("process_meetings")
            .update({ status: newStatus })
            .eq("id", meetingId);

          if (error) throw error;

          // Update local state
          setMeetings(prevMeetings => 
            prevMeetings.map(meeting => 
              meeting.id === meetingId ? { ...meeting, status: newStatus } : meeting
            )
          );

          toast({
            title: "Estado actualizado",
            description: "El estado de la reunión ha sido actualizado exitosamente.",
          });
        } catch (error) {
          console.error("Error updating meeting status:", error);
          toast({
            title: "Error",
            description: "No se pudo actualizar el estado de la reunión.",
            variant: "destructive",
          });
          
          // Refresh meetings to ensure UI is in sync with database
          fetchMeetings();
        }
      };

      const handleEditClick = (meeting: Meeting) => {
        setSelectedMeeting(meeting);
        setFormData({
          name: meeting.name,
          description: meeting.description || "",
          location: meeting.location || "",
          due_date: meeting.due_date || "",
          priority: meeting.priority,
          status: meeting.status,
          responsable: meeting.responsable || "",
        });
        setIsEditDialogOpen(true);
      };

      const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMeeting) return;
        setIsSubmitting(true);

        try {
          const { error } = await supabase
            .from("process_meetings")
            .update(formData)
            .eq("id", selectedMeeting.id);

          if (error) throw error;

          toast({
            title: "Reunión actualizada",
            description: "La reunión ha sido actualizada exitosamente.",
          });

          setIsEditDialogOpen(false);
          fetchMeetings();
        } catch (error) {
          console.error("Error updating meeting:", error);
          toast({
            title: "Error",
            description: "No se pudo actualizar la reunión.",
            variant: "destructive",
          });
        } finally {
          setIsSubmitting(false);
        }
      };

      const handleDeleteClick = (meeting: Meeting) => {
        setSelectedMeeting(meeting);
        setIsDeleteDialogOpen(true);
      };

      const handleDeleteConfirm = async () => {
        if (!selectedMeeting) return;
        setIsSubmitting(true);

        try {
          const { error } = await supabase
            .from("process_meetings")
            .delete()
            .eq("id", selectedMeeting.id);

          if (error) throw error;

          toast({
            title: "Reunión eliminada",
            description: "La reunión ha sido eliminada exitosamente.",
          });

          setIsDeleteDialogOpen(false);
          fetchMeetings();
        } catch (error) {
          console.error("Error deleting meeting:", error);
          toast({
            title: "Error",
            description: "No se pudo eliminar la reunión.",
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

          const { error } = await supabase.from("process_meetings").insert([
            {
              ...formData,
              process_id: processId,
              user_id: userData.user.id,
            },
          ]);

          if (error) throw error;

          toast({
            title: "Reunión creada",
            description: "La reunión ha sido creada exitosamente.",
          });

          setFormData(initialFormState);
          setIsCreateDialogOpen(false);
          fetchMeetings();
        } catch (error) {
          console.error("Error creating meeting:", error);
          toast({
            title: "Error",
            description: "No se pudo crear la reunión.",
            variant: "destructive",
          });
        } finally {
          setIsSubmitting(false);
        }
      };

      const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMeeting) return;
        setIsSubmitting(true);

        try {
          const { data: userData } = await supabase.auth.getUser();
          if (!userData.user) throw new Error("No user found");

          const { error } = await supabase.from("meeting_comments").insert([
            {
              meeting_id: selectedMeeting.id,
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
          fetchMeetings();
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

      const MeetingCard = ({ meeting }: { meeting: Meeting }) => (
        <div
          className="bg-card p-4 rounded-lg shadow-sm border mb-3"
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("meetingId", meeting.id);
          }}
        >
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-medium">{meeting.name}</h3>
            <Badge variant="outline" className={PRIORITY_COLORS[meeting.priority]}>
              {meeting.priority}
            </Badge>
          </div>
          {meeting.description && (
            <p className="text-sm text-muted-foreground mb-3">{meeting.description}</p>
          )}
          {meeting.location && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
              <MapPin className="h-4 w-4" />
              {meeting.location}
            </div>
          )}
          {meeting.responsable && (
            <p className="text-sm text-muted-foreground mb-3">Responsable: {meeting.responsable}</p>
          )}
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
            {meeting.due_date && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(meeting.due_date).toLocaleDateString()}
              </div>
            )}
            <div className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              {meeting.comments.length} comentarios
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1"
              onClick={() => {
                setSelectedMeeting(meeting);
                setIsCommentDialogOpen(true);
              }}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Comentar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEditClick(meeting)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteClick(meeting)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      );

      const MeetingColumn = ({ title, status, meetings }: { title: string; status: Meeting['status']; meetings: Meeting[] }) => {
        const sortedMeetings = [...meetings]
          .filter(meeting => filterResponsables[status] === 'all' || meeting.responsable === filterResponsables[status])
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
              const meetingId = e.dataTransfer.getData("meetingId");
              handleStatusChange(meetingId, status);
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
                    {Array.from(new Set(meetings.map(meeting => meeting.responsable))).filter(Boolean).map(responsable => (
                      <SelectItem key={responsable} value={responsable}>
                        {responsable}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {sortedMeetings.map((meeting) => (
              <MeetingCard key={meeting.id} meeting={meeting} />
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
              <Users className="h-6 w-6" />
              <h1 className="text-2xl font-bold">Reuniones</h1>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Reunión
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear Nueva Reunión</DialogTitle>
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
                    <Label htmlFor="location">Lugar</Label>
                    <Input
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
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
                      onValueChange={(value: Meeting['priority']) => setFormData({ ...formData, priority: value })}
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
                    Crear Reunión
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex gap-6 overflow-x-auto pb-6">
            <MeetingColumn
              title="Pendientes"
              status="pending"
              meetings={meetings.filter((meeting) => meeting.status === "pending")}
            />
            <MeetingColumn
              title="En Curso"
              status="in_progress"
              meetings={meetings.filter((meeting) => meeting.status === "in_progress")}
            />
            <MeetingColumn
              title="Finalizadas"
              status="completed"
              meetings={meetings.filter((meeting) => meeting.status === "completed")}
            />
          </div>

          {/* Edit Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Reunión</DialogTitle>
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
                  <Label htmlFor="edit-location">Lugar</Label>
                  <Input
                    id="edit-location"
                    name="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
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
                    onValueChange={(value: Meeting['priority']) => setFormData({ ...formData, priority: value })}
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
                <DialogTitle>Eliminar Reunión</DialogTitle>
                <DialogDescription>
                  ¿Estás seguro de que deseas eliminar esta reunión? Esta acción no se puede deshacer.
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
                <DialogTitle>Comentarios - {selectedMeeting?.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <ScrollArea className="h-[300px] pr-4">
                  {selectedMeeting?.comments.map((comment, index) => (
                    <div key={comment.id} className="mb-4">
                      <div className="bg-muted p-3 rounded-lg">
                        <p className="text-sm">{comment.content}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(comment.created_at).toLocaleString()}
                        </p>
                      </div>
                      {index < selectedMeeting.comments.length - 1 && (
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
