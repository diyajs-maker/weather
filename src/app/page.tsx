import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
      <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
        Premium Weather Experience
      </h1>
      <p className="text-xl text-slate-600 mb-10 max-w-2xl">
        Get accurate real-time weather updates and detailed forecasts with our elegant and intuitive dashboard.
      </p>
      <div className="flex flex-wrap gap-4 justify-center">
        <Link
          href="/weather"
          className="px-8 py-4 bg-blue-600 text-white rounded-full font-semibold text-lg hover:bg-blue-700 transition-all transform hover:scale-105 shadow-lg"
        >
          Check Local Weather
        </Link>
        <Link
          href="/admin/login"
          className="px-8 py-4 bg-slate-800 text-white rounded-full font-semibold text-lg hover:bg-slate-900 transition-all transform hover:scale-105 shadow-md border border-slate-700"
        >
          Admin Portal
        </Link>
        <Link
          href="/building/login"
          className="px-8 py-4 bg-white text-slate-800 rounded-full font-semibold text-lg hover:bg-slate-50 transition-all transform hover:scale-105 shadow-md border border-slate-200"
        >
          Building Portal
        </Link>
      </div>
    </div>
  );
}
