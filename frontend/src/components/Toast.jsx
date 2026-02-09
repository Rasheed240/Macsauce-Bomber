import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react'

const Toast = ({ message, type = 'info', onClose }) => {
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-400" />,
    error: <XCircle className="w-5 h-5 text-red-400" />,
    info: <Info className="w-5 h-5 text-blue-400" />,
    warning: <AlertTriangle className="w-5 h-5 text-yellow-400" />
  }

  const colors = {
    success: 'border-green-500/30 bg-green-500/10',
    error: 'border-red-500/30 bg-red-500/10',
    info: 'border-blue-500/30 bg-blue-500/10',
    warning: 'border-yellow-500/30 bg-yellow-500/10'
  }

  return (
    <div className={`flex items-center gap-3 p-3 sm:p-4 rounded-lg border ${colors[type]} backdrop-blur-sm animate-slide-in min-w-0 sm:min-w-[300px] max-w-[calc(100vw-2rem)] sm:max-w-md shadow-lg`}>
      {icons[type]}
      <p className="flex-1 text-sm text-gray-100">{message}</p>
      <button
        onClick={onClose}
        className="text-gray-400 hover:text-gray-200 transition-colors p-2 -mr-1 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

export default Toast
