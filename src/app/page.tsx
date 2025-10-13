'use client';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Test - If you see this, it works!</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg border">
          <p className="text-sm text-slate-600">Test Card 1</p>
          <p className="text-3xl font-bold mt-2">42</p>
        </div>
        <div className="bg-white p-6 rounded-lg border">
          <p className="text-sm text-slate-600">Test Card 2</p>
          <p className="text-3xl font-bold mt-2">99</p>
        </div>
        <div className="bg-white p-6 rounded-lg border">
          <p className="text-sm text-slate-600">Test Card 3</p>
          <p className="text-3xl font-bold mt-2">13</p>
        </div>
        <div className="bg-white p-6 rounded-lg border">
          <p className="text-sm text-slate-600">Test Card 4</p>
          <p className="text-3xl font-bold mt-2">7</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border">
        <h2 className="text-lg font-semibold mb-4">Status</h2>
        <p className="text-green-600">✅ Dashboard is loading correctly!</p>
      </div>
    </div>
  );
}