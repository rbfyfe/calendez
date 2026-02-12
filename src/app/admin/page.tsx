import { auth } from "@/lib/auth";
import { SignOutButton } from "@/components/admin/sign-out-button";
import { AdminDashboard } from "@/components/admin/admin-dashboard";

export default async function AdminPage() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Calendez Admin</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{session?.user?.email}</span>
          <SignOutButton />
        </div>
      </header>
      <main className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg border p-6 mb-6">
          <h2 className="text-lg font-medium mb-2">Google Calendar</h2>
          {session?.accessToken ? (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm text-green-700">
                Connected as {session.user?.email}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-sm text-red-700">Not connected</span>
            </div>
          )}
          {session?.error === "RefreshTokenError" && (
            <p className="text-sm text-red-600 mt-2">
              Your Google token has expired. Please sign out and sign back in to
              reconnect.
            </p>
          )}
        </div>

        <AdminDashboard />
      </main>
    </div>
  );
}
