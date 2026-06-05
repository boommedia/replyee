export default function Logo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className ?? ''}`}>
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: '#6366f1', boxShadow: '0 0 16px rgba(99,102,241,0.35)' }}
      >
        <span className="text-white text-xs font-bold">RP</span>
      </div>
      <span className="font-bold text-white">Replyee</span>
      <span className="hidden sm:inline text-xs" style={{ color: '#888' }}>by Boom Media</span>
    </div>
  )
}
