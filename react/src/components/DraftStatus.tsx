// /react/src/components/DraftStatus.tsx

interface DraftStatusProps {
  hasDraft: boolean
  lastSaved: Date | null
}

export const DraftStatus = ({ hasDraft, lastSaved }: DraftStatusProps): JSX.Element | null => {
  if (!hasDraft || !lastSaved) {
    return null
  }

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }

  return (
    <div className="text-xs text-gray-500">
      Draft saved at {formatTime(lastSaved)}
    </div>
  )
}
