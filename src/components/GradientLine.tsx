interface GradientLineProps {
  className?: string
}

export default function GradientLine({ className = '' }: GradientLineProps) {
  return (
    <div className={`w-full flex justify-center ${className}`}>
      <div className="w-full max-w-2xl h-px bg-gradient-to-r from-transparent via-accent-purple to-transparent opacity-40" />
    </div>
  )
}
