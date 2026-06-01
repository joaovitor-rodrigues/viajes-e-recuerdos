export default function MapSkeleton() {
  return (
    <div style={{
      height: '100vh', width: '100%',
      background: '#0f0f1a',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: '50%',
        border: '3px solid rgba(201,72,91,0.3)',
        borderTopColor: '#C9485B',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
