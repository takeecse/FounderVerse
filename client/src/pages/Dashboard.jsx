function Dashboard() {
  return (
    <div className="min-h-screen p-10">

      <h1 className="text-5xl font-bold">
        Dashboard
      </h1>

      <p className="mt-4 text-gray-400">
        Welcome to FounderVerse 🚀
      </p>

      <div className="grid md:grid-cols-3 gap-6 mt-10">

        <div className="bg-[#0B1225] p-6 rounded-2xl">
          <h2 className="text-xl font-bold">
            Create Startup
          </h2>
        </div>

        <div className="bg-[#0B1225] p-6 rounded-2xl">
          <h2 className="text-xl font-bold">
            Find Co-Founder
          </h2>
        </div>

        <div className="bg-[#0B1225] p-6 rounded-2xl">
          <h2 className="text-xl font-bold">
            Browse Startups
          </h2>
        </div>

      </div>

    </div>
  );
}

export default Dashboard;