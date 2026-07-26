import { Liveblocks } from "@liveblocks/node";

const globalForLiveblocks = globalThis as unknown as {
  liveblocks: Liveblocks | undefined;
};

function createLiveblocksClient() {
  const secret = process.env.LIVEBLOCKS_SECRET_KEY;

  if (!secret) {
    throw new Error(
      "LIVEBLOCKS_SECRET_KEY is not set — see .env.local for where to add it."
    );
  }

  return new Liveblocks({ secret });
}

// Unlike lib/prisma.ts's PrismaClient, Liveblocks's constructor eagerly
// validates its secret key and throws immediately if it's missing or
// malformed — so the client can't be built at module-eval time the way
// prisma.ts's `export const prisma = ...` is, or `next build`'s page-data
// collection step (which imports every route module) fails whenever
// LIVEBLOCKS_SECRET_KEY isn't set. Deferring construction into a getter,
// called only once a request actually reaches the route handler, keeps the
// same cached-per-process-and-across-dev-hot-reloads pattern while
// avoiding that build-time crash.
let liveblocks: Liveblocks | undefined = globalForLiveblocks.liveblocks;

export function getLiveblocksClient() {
  if (!liveblocks) {
    liveblocks = createLiveblocksClient();

    if (process.env.NODE_ENV !== "production") {
      globalForLiveblocks.liveblocks = liveblocks;
    }
  }

  return liveblocks;
}
