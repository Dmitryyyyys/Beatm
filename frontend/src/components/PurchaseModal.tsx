import { X, Info } from 'lucide-react'
import { Track } from '../types'

interface PurchaseModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  track: Track | null
  isProcessing?: boolean
}

const PurchaseModal = ({
  isOpen,
  onClose,
  onConfirm,
  track,
  isProcessing = false,
}: PurchaseModalProps) => {
  if (!isOpen || !track) return null

  const handleConfirm = () => {
    onConfirm()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black bg-opacity-60"
        onClick={onClose}
      ></div>

      <div className="relative bg-gray-900 rounded-lg shadow-2xl max-w-md w-full mx-4 z-50 border border-gray-800">
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-2xl font-bold text-white">Оформление заказа</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-gray-800 rounded-lg p-4 flex items-center space-x-4">
            <div className="flex-shrink-0 w-16 h-16 rounded overflow-hidden bg-gradient-to-br from-primary-400 to-purple-600">
              {track.coverUrl ? (
                <img
                  src={track.coverUrl}
                  alt={track.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">
                    {track.title.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-medium text-sm truncate">
                {track.title}
              </h3>
              <p className="text-gray-400 text-xs mt-1 truncate">
                {track.producer?.displayName || 'Unknown Producer'}
              </p>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center">
                <Info className="h-3 w-3 text-gray-300" />
              </div>
              <div className="flex-1">
                <p className="text-white text-sm font-medium mb-1">
                  После покупки вы получите сертификат
                </p>
                <p className="text-gray-400 text-xs">
                  Он подтвердит факт совершения покупки и условия лицензии
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Цена</span>
              <span className="text-white font-semibold">
                ${parseFloat(track.price.toString()).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Тип лицензии</span>
              <span className="text-white text-sm">Лизинг (неисключительная лицензия)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Срок лицензии</span>
              <span className="text-white text-sm">1 год</span>
            </div>
          </div>

          <button
            onClick={handleConfirm}
            disabled={isProcessing}
            className={`w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors ${
              isProcessing ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isProcessing ? 'Обработка...' : `Оплатить $${parseFloat(track.price.toString()).toFixed(2)}`}
          </button>

          <p className="text-gray-500 text-xs text-center">
            Оплачивая товар вы полностью принимаете условия{' '}
            <a href="#" className="text-blue-400 hover:text-blue-300 underline">
              публичной оферты
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default PurchaseModal

