"use client"

import type { ReactNode } from "react"
import { LiveObject, LiveList } from "@liveblocks/client"
import { LiveblocksProvider, RoomProvider, ClientSideSuspense } from "@liveblocks/react/suspense"

interface EventsRoomProviderProps {
  roomId: string
  children: ReactNode
}

// Matches the events-board:{clubId} convention from 13-liveblocks-setup.md —
// this is the only place an Events board room gets opened.
export function EventsRoomProvider({ roomId, children }: EventsRoomProviderProps) {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider
        id={roomId}
        initialPresence={{ cursor: null, isTyping: false }}
        initialStorage={{
          columns: new LiveObject({
            IDEA: new LiveList<string>([]),
            PLANNING: new LiveList<string>([]),
            CONFIRMED: new LiveList<string>([]),
            DONE: new LiveList<string>([]),
          }),
        }}
      >
        <ClientSideSuspense
          fallback={
            <div className="flex h-64 items-center justify-center text-sm text-copy-secondary">
              Connecting to the board…
            </div>
          }
        >
          {children}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  )
}
