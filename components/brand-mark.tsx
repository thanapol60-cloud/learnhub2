export function BrandMark({
  className = 'h-9 w-9',
  tone = 'dark',
}: {
  className?: string
  tone?: 'dark' | 'light'
}) {
  const surface = tone === 'dark' ? 'bg-brand-900 text-white' : 'bg-white text-brand-900'
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-md ${surface} ${className}`}
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-[62%] w-[62%]">
        <path
          d="M4 6.5h6.2c1 0 1.8.8 1.8 1.8V19c0-1-.8-1.8-1.8-1.8H4Z"
          fill="currentColor"
          opacity="0.55"
        />
        <path
          d="M20 6.5h-6.2c-1 0-1.8.8-1.8 1.8V19c0-1 .8-1.8 1.8-1.8H20Z"
          fill="currentColor"
        />
      </svg>
    </span>
  )
}
