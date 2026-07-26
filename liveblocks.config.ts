// Room ID naming convention (enforced in app/api/liveblocks-auth/route.ts,
// which is the only place rooms get authorized):
//
//   events-board:{clubId}
//   brainstorm-canvas:{clubId}
//
// Room IDs are always derived from the club and the surface, never
// arbitrary. Future specs building the actual board/canvas should open
// rooms using these exact prefixes rather than inventing a new scheme.
//
// Presence/UserMeta are shared by both room types on purpose — they're
// structurally identical, and the room ID prefix above is what
// distinguishes an Events board room from a Brainstorm canvas room, not a
// separate config type per surface.

import type { LiveList, LiveObject } from "@liveblocks/client";

declare global {
  interface Liveblocks {
    Presence: {
      cursor: { x: number; y: number } | null;
      isTyping: boolean;
    };

    UserMeta: {
      id: string; // Clerk user ID
      info: {
        name: string;
        avatarUrl: string;
        cursorColor: string;
      };
    };

    // Events board only (14-events-board.md). Prisma remains the source of
    // truth for an event's existence/status; this is purely the ordering of
    // event IDs within each status column, which has no Prisma column of its
    // own. One LiveList per column, keyed by EventStatus, inside a single
    // LiveObject so the whole board's ordering lives at one Storage root key.
    Storage: {
      columns: LiveObject<{
        IDEA: LiveList<string>;
        PLANNING: LiveList<string>;
        CONFIRMED: LiveList<string>;
        DONE: LiveList<string>;
      }>;
    };
  }
}

export {};
