import { X, AlertTriangle } from 'lucide-react'

interface DeleteConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message?: string
  itemName?: string
}

const DeleteConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Подтверждение удаления',
  message = 'Вы уверены, что хотите удалить этот элемент?',
  itemName,
}: DeleteConfirmModalProps) => {
  if (!isOpen) return null

  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      ></div>

      <div className="relative bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 z-50 border border-gray-700">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-red-900/50 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-red-400" />
            </div>
            <h3 className="text-base font-semibold text-white">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-4 pb-4">
          <p className="text-sm text-gray-300 mb-4">{message}</p>
          {itemName && (
            <p className="text-sm font-medium text-white mb-4">
              {itemName}
            </p>
          )}

          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 border border-gray-600 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
            >
              Удалить
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeleteConfirmModal

