export default function HomePage() {
  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto text-center py-20">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Your Premed Journey, Data-Driven
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          &ldquo;With my 3.7 GPA and 512 MCAT, which schools did UT students
          like me get into?&rdquo; — Get answers backed by 30+ real data
          sources.
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/login"
            className="bg-orange-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-700"
          >
            Sign In to Get Started
          </a>
          <a
            href="/login?next=/schools"
            className="border border-gray-300 px-6 py-3 rounded-lg font-medium hover:bg-gray-50"
          >
            Explore Schools
          </a>
        </div>
      </div>
    </div>
  );
}
