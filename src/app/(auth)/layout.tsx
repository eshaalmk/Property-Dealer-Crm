export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen mesh-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-brand-500/30">
              P
            </div>
            <span className="font-display text-2xl font-bold text-white">PropertyCRM</span>
          </div>
          <p className="text-slate-400 text-sm">Pakistan Real Estate Management</p>
        </div>
        {children}
      </div>
    </div>
  );
}
