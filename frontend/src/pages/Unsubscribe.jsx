import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { unsubscribeContact } from '../services/unsubscribe'

const Unsubscribe = () => {
  const { contactId } = useParams()
  const [status, setStatus] = useState('pending')

  const handleUnsubscribe = async () => {
    try {
      await unsubscribeContact(contactId)
      setStatus('success')
    } catch (err) {
      setStatus('error')
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      {status === 'pending' && (
        <>
          <h1 className="text-2xl font-bold mb-4">Unsubscribe from Emails</h1>
          <p className="mb-6 text-gray-400">Are you sure you want to unsubscribe from future emails?</p>
          <button onClick={handleUnsubscribe} className="btn-primary">Unsubscribe</button>
        </>
      )}
      {status === 'success' && (
        <>
          <h1 className="text-2xl font-bold mb-4 text-green-400">You have been unsubscribed.</h1>
          <p className="text-gray-400">You will no longer receive emails from us.</p>
        </>
      )}
      {status === 'error' && (
        <>
          <h1 className="text-2xl font-bold mb-4 text-red-400">Unsubscribe Failed</h1>
          <p className="text-gray-400">There was a problem processing your request. Please try again later.</p>
        </>
      )}
    </div>
  )
}

export default Unsubscribe
