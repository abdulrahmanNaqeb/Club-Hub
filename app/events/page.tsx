import { requireOrgMode } from "@/lib/get-org-mode"
import { prisma } from "@/lib/prisma"
import { AppShell } from "@/components/app/app-shell"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EventsRoomProvider } from "@/components/events/events-room-provider"
import { EventsBoard } from "@/components/events/events-board"
import { EventsCalendar } from "@/components/events/events-calendar"
import type { BoardEvent } from "@/components/events/board-types"

export default async function EventsPage() {
  const club = await requireOrgMode("club")

  const events = await prisma.event.findMany({
    where: { clubId: club.id },
    orderBy: { createdAt: "asc" },
  })

  const boardEvents: BoardEvent[] = events.map((event) => ({
    id: event.id,
    title: event.title,
    description: event.description,
    location: event.location,
    status: event.status,
    dateTime: event.dateTime ? event.dateTime.toISOString() : null,
  }))

  return (
    <AppShell mode="club" title="Events" padded={false}>
      <Tabs defaultValue="board" className="flex h-full flex-col">
        <div className="border-b border-surface-border px-6 pt-6">
          <TabsList>
            <TabsTrigger value="board">Board</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="board" className="min-h-0 flex-1 p-6">
          <EventsRoomProvider roomId={`events-board:${club.id}`}>
            <EventsBoard initialEvents={boardEvents} />
          </EventsRoomProvider>
        </TabsContent>

        <TabsContent value="calendar" className="flex-1 overflow-y-auto p-6">
          <EventsCalendar events={boardEvents} />
        </TabsContent>
      </Tabs>
    </AppShell>
  )
}
