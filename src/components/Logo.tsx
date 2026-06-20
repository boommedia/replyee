export default function Logo({ className, size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const s = size === 'sm' ? { box: 34, br: 9, icon: 17 } : size === 'lg' ? { box: 56, br: 14, icon: 28 } : { box: 44, br: 11, icon: 22 }
  return (
    <div className={`flex items-center gap-[10px] ${className ?? ''}`}>
      <div style={{ width: s.box, height: s.box, borderRadius: s.br, background: 'linear-gradient(145deg,#312E81,#4F46E5)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <svg width={s.icon} height={s.icon} viewBox="0 0 24 24" fill="none">
          <path d="M20 4H4C2.9 4 2 4.9 2 6v10c0 1.1.9 2 2 2h4l3.3 3.3c.4.4 1 .4 1.4 0L16 18h4c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z" fill="white" opacity="0.15" stroke="white" strokeWidth="1.5"/>
          <path d="M12 8l.7 2.1L15 11l-2.3.9L12 14l-.7-2.1L9 11l2.3-.9L12 8z" fill="white"/>
          <circle cx="8" cy="11" r="1" fill="white" opacity="0.6"/>
          <circle cx="16" cy="11" r="1" fill="white" opacity="0.6"/>
        </svg>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <span style={{ fontWeight: 800, fontSize: size === 'sm' ? '0.9rem' : size === 'lg' ? '1.4rem' : '1.1rem', color: '#F5F5FF', lineHeight: 1, letterSpacing: '-0.02em' }}>Replyee</span>
        <span style={{ fontWeight: 500, fontSize: size === 'sm' ? '0.58rem' : size === 'lg' ? '0.78rem' : '0.66rem', color: '#6B7280' }}>by Boom Media</span>
      </div>
    </div>
  )
}
