import './MemoryMatch.css'

interface MemoryCardProps {
  uid: string
  image: string
  alt: string
  isFlipped: boolean
  isMatched: boolean
  isError: boolean
  isDisabled: boolean
  primaryColor: string
  onClick: () => void
}

export function MemoryCard({
  uid,
  image,
  alt,
  isFlipped,
  isMatched,
  isError,
  isDisabled,
  primaryColor,
  onClick,
}: MemoryCardProps) {
  const showFace = isFlipped || isMatched
  const isInteractive = !isDisabled && !isFlipped && !isMatched

  const innerClass = [
    'mm-card__inner',
    isMatched ? 'mm-card__inner--matched' : showFace ? 'mm-card__inner--flipped' : '',
    isError ? 'mm-card__inner--error' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const backClass = [
    'mm-card__face mm-card__back',
    isMatched ? 'mm-card__back--matched' : '',
    isError ? 'mm-card__back--error' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      id={uid}
      role="button"
      tabIndex={isInteractive ? 0 : -1}
      aria-label={showFace ? alt : 'Carta oculta'}
      aria-pressed={showFace}
      aria-disabled={isDisabled && !showFace}
      className={[
        'mm-card aspect-square',
        isInteractive ? 'mm-card--interactive' : '',
        isMatched ? 'mm-card--matched' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={isInteractive ? onClick : undefined}
      onKeyDown={(e) => {
        if (isInteractive && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onClick()
        }
      }}
    >
      <div className={innerClass}>
        {/* Face-down */}
        <div
          className="mm-card__face mm-card__front"
          style={{ borderColor: primaryColor + '55' }}
        >
          <span className="mm-card__front-label">?</span>
        </div>
        {/* Face-up */}
        <div
          className={backClass}
          style={!isMatched && !isError ? { borderColor: primaryColor + '88' } : undefined}
        >
          <img src={image} alt={alt} className="mm-card__image" draggable={false} />
          {isMatched && (
            <div className="mm-card__matched-overlay" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                className="mm-card__check"
                fill="none"
                stroke="currentColor"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
