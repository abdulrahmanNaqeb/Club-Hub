import dotenv from "dotenv";
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local" });

import { createClerkClient } from "@clerk/backend";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const ORG_NAME = "Test University Union Staff";
const INSTITUTION_NAME = "Test University";
const INSTITUTION_SLUG = "test-university";
const TARGET_EMAIL = "dhomy.yaf@gmail.com";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    throw new Error("CLERK_SECRET_KEY not found in env");
  }

  const clerkClient = createClerkClient({ secretKey });

  const { data: users } = await clerkClient.users.getUserList({
    emailAddress: [TARGET_EMAIL],
  });

  if (users.length === 0) {
    throw new Error(`No Clerk user found with email ${TARGET_EMAIL}`);
  }
  const user = users[0];
  console.log(`Found Clerk user ${user.id} (${TARGET_EMAIL})`);

  const { data: existingOrgs } = await clerkClient.organizations.getOrganizationList({
    query: ORG_NAME,
  });
  let org = existingOrgs.find((o) => o.name === ORG_NAME);

  if (org) {
    console.log(`Reusing existing organization ${org.id} (${org.name})`);
  } else {
    org = await clerkClient.organizations.createOrganization({
      name: ORG_NAME,
      createdBy: user.id,
    });
    console.log(`Created organization ${org.id} (${org.name})`);
  }

  const { data: memberships } = await clerkClient.organizations.getOrganizationMembershipList({
    organizationId: org.id,
  });
  const isMember = memberships.some((m) => m.publicUserData?.userId === user.id);

  if (isMember) {
    console.log(`User ${user.id} already a member of ${org.id}`);
  } else {
    await clerkClient.organizations.createOrganizationMembership({
      organizationId: org.id,
      userId: user.id,
      role: "org:admin",
    });
    console.log(`Added ${user.id} to ${org.id} as org:admin`);
  }

  const institution = await prisma.institution.upsert({
    where: { slug: INSTITUTION_SLUG },
    update: { name: INSTITUTION_NAME },
    create: { name: INSTITUTION_NAME, slug: INSTITUTION_SLUG },
  });
  console.log(`Institution: ${institution.id} (${institution.slug})`);

  const link = await prisma.unionStaffOrgLink.upsert({
    where: { clerkOrgId: org.id },
    update: { institutionId: institution.id },
    create: { clerkOrgId: org.id, institutionId: institution.id },
  });
  console.log(`UnionStaffOrgLink: ${link.id} -> institution ${link.institutionId}`);

  console.log("\n--- Summary ---");
  console.log(`Clerk org name: ${org.name}`);
  console.log(`Clerk org id:   ${org.id}`);
  console.log(`Institution:    ${institution.name} (${institution.slug})`);
}

main()
  .catch((e) => {
    console.error("Setup failed:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
