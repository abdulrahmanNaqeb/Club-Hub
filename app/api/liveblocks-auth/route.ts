import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";

import { getActiveClub } from "@/lib/org-scope";
import { getLiveblocksClient } from "@/lib/liveblocks";
import { getCursorColor } from "@/lib/cursor-color";

const ROOM_ID_PATTERN = /^(events-board|brainstorm-canvas):([a-zA-Z0-9_-]+)$/;

export function parseLiveblocksRoomId(
  roomId: unknown
): { surface: "events-board" | "brainstorm-canvas"; clubId: string } | null {
  if (typeof roomId !== "string") return null;

  const match = ROOM_ID_PATTERN.exec(roomId);
  if (!match) return null;

  return { surface: match[1] as "events-board" | "brainstorm-canvas", clubId: match[2] };
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const rawRoomId =
    body && typeof body === "object" && "room" in body
      ? (body as { room: unknown }).room
      : undefined;

  const parsedRoom = parseLiveblocksRoomId(rawRoomId);
  if (!parsedRoom) {
    return NextResponse.json({ error: "Invalid or malformed room ID." }, { status: 400 });
  }

  let club;
  try {
    club = await getActiveClub();
  } catch {
    return NextResponse.json({ error: "Not authorized for this club." }, { status: 403 });
  }

  if (club.id !== parsedRoom.clubId) {
    return NextResponse.json({ error: "Not authorized for this club." }, { status: 403 });
  }

  const user = await currentUser();
  const name =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.username ||
    "Member";

  // getLiveblocksClient() throws synchronously if LIVEBLOCKS_SECRET_KEY is
  // missing/malformed, and session.authorize() can itself reject (e.g. a key
  // Liveblocks' servers reject as invalid). Left uncaught, either one turns
  // into Next's generic unhandled-error 500 — no body, no reason — which is
  // exactly what made this failure mode silent client-side. Catch it here so
  // there's always a real reason in both the response and the server log.
  try {
    const liveblocks = getLiveblocksClient();
    const session = liveblocks.prepareSession(userId, {
      userInfo: {
        name,
        avatarUrl: user?.imageUrl ?? "",
        cursorColor: getCursorColor(userId),
      },
    });

    session.allow(`${parsedRoom.surface}:${parsedRoom.clubId}`, ["*:write"]);

    const { status, body: responseBody } = await session.authorize();

    return new NextResponse(responseBody, {
      status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Liveblocks auth failed:", err);
    const reason = err instanceof Error ? err.message : "Unknown error.";
    return NextResponse.json(
      { error: `Liveblocks authentication failed: ${reason}` },
      { status: 500 }
    );
  }
}
