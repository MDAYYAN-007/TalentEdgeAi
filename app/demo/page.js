import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import DemoUploader from '../../components/DemoUploader';

export default function DemoPage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-slate-100">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Live Demo — Resume Scoring</h1>
          <p className="mt-3 text-slate-600 max-w-2xl">
            Try a mock resume upload to see how TalentEdge AI ranks candidates. This is a client-side demo that returns a sample AI score and reasons.
          </p>

          <div className="mt-8">
            <DemoUploader />
          </div>

          <section className="mt-12 bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-slate-900">How this demo works</h2>
            <ol className="mt-3 list-decimal list-inside text-slate-600 space-y-2">
              <li>Upload a PDF (or click simulate) — demo doesn't actually send files anywhere.</li>
              <li>The client component generates a mock score and short justification.</li>
              <li>Use this to design your real `/api/candidates/score` endpoint later.</li>
            </ol>
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}
