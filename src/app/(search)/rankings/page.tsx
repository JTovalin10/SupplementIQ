import RankingTable from "@/components/features/RankingTable";

// Force dynamic rendering to prevent build-time fetch errors
export const dynamic = "force-dynamic";

export default function RankingsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">User Rankings</h1>
          <p className="mt-2 text-lg text-gray-700">
            Discover the top contributors based on their contribution scores and
            reputation points.
          </p>
        </div>

        <div className="space-y-8">
          <RankingTable limit={20} />
        </div>
      </div>
    </div>
  );
}
