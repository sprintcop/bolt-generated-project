import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ProcessDetail } from "@/pages/ProcessDetail";
import { ProcessSubjects } from "@/pages/ProcessSubjects";
import { ProcessActions } from "@/pages/ProcessActions";
import { ProcessTasks } from "@/pages/ProcessTasks";
import { ProcessHearings } from "@/pages/ProcessHearings";
import { ProcessTerms } from "@/pages/ProcessTerms";
import { ProcessMeetings } from "@/pages/ProcessMeetings";

export function ProcessTabs() {
  return (
    <Tabs defaultValue="details" className="w-full">
      <TabsList className="w-full justify-start mb-6">
        <TabsTrigger value="details">Detalle Proceso</TabsTrigger>
        <TabsTrigger value="subjects">Sujetos Procesales</TabsTrigger>
        <TabsTrigger value="actions">Actuaciones</TabsTrigger>
        <TabsTrigger value="tasks">Tareas</TabsTrigger>
        <TabsTrigger value="hearings">Audiencias</TabsTrigger>
        <TabsTrigger value="terms">Términos</TabsTrigger>
        <TabsTrigger value="meetings">Reuniones</TabsTrigger>
      </TabsList>
      <TabsContent value="details">
        <ProcessDetail />
      </TabsContent>
      <TabsContent value="subjects">
        <ProcessSubjects />
      </TabsContent>
      <TabsContent value="actions">
        <ProcessActions />
      </TabsContent>
      <TabsContent value="tasks">
        <ProcessTasks />
      </TabsContent>
      <TabsContent value="hearings">
        <ProcessHearings />
      </TabsContent>
      <TabsContent value="terms">
        <ProcessTerms />
      </TabsContent>
      <TabsContent value="meetings">
        <ProcessMeetings />
      </TabsContent>
    </Tabs>
  );
}
