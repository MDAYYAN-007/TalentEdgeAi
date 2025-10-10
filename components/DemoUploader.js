'use client';
import { useState } from 'react';

export default function DemoUploader() {
  const [fileName, setFileName] = useState('');
  const [score, setScore] = useState(null);
  const [reasons, setReasons] = useState([]);
  const [loading, setLoading] = useState(false);

  function handleFileChange(e) {
    const f = e.target.files?.[0];
    if (f) {
      setFileName(f.name);
      runMockScoring(f.name);
    }
  }

  function runMockScoring(name = 'sample.pdf') {
    setLoading(true);
    setScore(null);
    setReasons([]);

    // Simulate async scoring (mock)
    setTimeout(() => {
      // deterministic mock based on filename characters (so repeated runs show same result for same name)
      const seed = Array.from(name).reduce((s, ch) => s + ch.charCodeAt(0), 0);
      const mockScore = 60 + (seed % 41); // yields 60-100
      const mockReasons = [
        mockScore > 85 ? 'Strong role match and keywords found' : 'Partial skill match; missing senior-level experience',
        mockScore > 75 ? 'Relevant projects highlighted' : 'Few project examples; add more measurable impact',
        seed % 2 === 0 ? 'Good education fit' : 'Experience preferred in adjacent domain',
      ];

      setFileName(name);
      setScore(mockScore);
      setReasons(mockReasons);
      setLoading(false);
    }, 900);
  }

  function handleSimulate() {
    runMockScoring('demo_resume.pdf');
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <label className="block text-sm font-medium text-slate-700">Upload resume (PDF)</label>
      <div className="mt-3 flex items-center gap-3">
        <input
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={handleFileChange}
          className="block w-full text-sm text-slate-500 file:bg-indigo-600 file:text-white file:px-4 file:py-2 file:rounded-md file:border-0"
        />
        <button
          onClick={handleSimulate}
          className="px-4 py-2 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
        >
          Simulate
        </button>
      </div>

      <div className="mt-6">
        {!fileName && !loading && (
          <div className="text-sm text-slate-500">No file chosen — click <strong>Simulate</strong> to try a demo result.</div>
        )}

        {loading && (
          <div className="text-sm text-slate-500">Scoring resume…</div>
        )}

        {score !== null && !loading && (
          <div className="mt-4 border border-slate-100 rounded-lg p-4 bg-slate-50">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-500">File</div>
                <div className="font-medium text-slate-900">{fileName}</div>
              </div>

              <div className="text-right">
                <div className="text-sm text-slate-500">AI Match Score</div>
                <div className="text-2xl font-bold text-indigo-600">{score}%</div>
              </div>
            </div>

            <div className="mt-4">
              <div className="text-sm font-semibold text-slate-700">Why this score?</div>
              <ul className="mt-2 list-disc list-inside text-slate-600 space-y-1">
                {reasons.map((r, idx) => (
                  <li key={idx}>{r}</li>
                ))}
              </ul>
            </div>

            <div className="mt-4 flex gap-3">
              <button className="px-4 py-2 rounded-md border border-indigo-600 text-indigo-600 text-sm">Shortlist</button>
              <button className="px-4 py-2 rounded-md bg-white text-sm border text-slate-700">View Details</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
