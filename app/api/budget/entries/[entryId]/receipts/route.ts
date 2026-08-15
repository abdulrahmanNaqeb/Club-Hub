import { NextResponse } from "next/server"
import { put } from "@vercel/blob"

import { getActiveClub } from "@/lib/org-scope"
import { prisma } from "@/lib/prisma"
import { serializeEntry } from "@/lib/budget-serialize"

/**
 * The uploaded filename becomes part of the blob pathname, so it's untrusted
 * input on a path — strip any directory components and anything outside a
 * conservative character set before it gets there.
 */
function safeFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? ""
  const cleaned = base.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/^\.+/, "")
  return cleaned.length > 0 ? cleaned.slice(0, 100) : "receipt"
}

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/budget/entries/[entryId]/receipts">
) {
  const { entryId } = await ctx.params

  let club
  try {
    club = await getActiveClub()
  } catch {
    return NextResponse.json({ error: "Not authorized for this club." }, { status: 403 })
  }

  const entry = await prisma.budgetEntry.findUnique({ where: { id: entryId } })
  if (!entry || entry.clubId !== club.id) {
    return NextResponse.json({ error: "Entry not found." }, { status: 404 })
  }

  // Receipts are proof of spend — income entries don't have them, and the
  // form never offers the field, so reject it here too rather than trusting
  // the client to have hidden it.
  if (entry.type !== "EXPENSE") {
    return NextResponse.json(
      { error: "Receipts can only be attached to expense entries." },
      { status: 400 }
    )
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: "Invalid upload." }, { status: 400 })
  }

  const files = formData.getAll("files").filter((value): value is File => value instanceof File)
  if (files.length === 0) {
    return NextResponse.json({ error: "No files were uploaded." }, { status: 400 })
  }

  let uploadedUrls: string[]
  try {
    uploadedUrls = await Promise.all(
      files.map(async (file) => {
        const pathname = `receipts/${club.id}/${entry.id}/${safeFileName(file.name)}`
        const blob = await put(pathname, file, { access: "public", allowOverwrite: true })
        return blob.url
      })
    )
  } catch (error) {
    console.error(`Receipt upload failed for entry ${entryId}:`, error)
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 502 })
  }

  // allowOverwrite keeps the spec's exact path scheme (rather than a random
  // suffix), which means re-uploading the same filename returns the same URL —
  // so dedupe instead of appending a second identical reference.
  const receiptUrls = Array.from(new Set([...entry.receiptUrls, ...uploadedUrls]))

  const updated = await prisma.budgetEntry.update({
    where: { id: entryId },
    data: { receiptUrls },
  })

  return NextResponse.json({ entry: serializeEntry(updated) })
}
