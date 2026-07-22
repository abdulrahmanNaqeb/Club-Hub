import { OrganizationList } from "@clerk/nextjs";

export default function SelectClubPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-page px-6">
      <div className="flex w-full max-w-md flex-col items-center gap-6">
        <div className="text-center">
          <h1 className="text-3xl font-semibold text-copy-primary">
            Select a club
          </h1>
          <p className="mt-1 text-sm text-copy-secondary">
            Create or join a club to continue.
          </p>
        </div>
        <OrganizationList
          afterCreateOrganizationUrl="/team"
          afterSelectOrganizationUrl="/team"
          hidePersonal
        />
      </div>
    </div>
  );
}
