import { prisma } from "./prisma"

/**
 * A BudgetEntry's optional category/event foreign keys are supplied by the
 * client, so they need the same ownership check the entry row itself gets —
 * otherwise a member of one club could attach their spend to another club's
 * category or event. Returns an error message, or null when the links are
 * valid (including when they're absent, which is allowed).
 */
export async function validateEntryLinks(
  clubId: string,
  categoryId: string | null | undefined,
  eventId: string | null | undefined
): Promise<string | null> {
  if (categoryId) {
    const category = await prisma.budgetCategory.findUnique({
      where: { id: categoryId },
      select: { clubId: true },
    })

    if (!category || category.clubId !== clubId) {
      return "Category not found."
    }
  }

  if (eventId) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { clubId: true },
    })

    if (!event || event.clubId !== clubId) {
      return "Event not found."
    }
  }

  return null
}
