import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Play, Pause, Square, CheckCircle, XCircle, Clock } from 'lucide-react'
import axios from 'axios'
import { useToast } from '../contexts/ToastContext'

const CampaignDetail = () => {
  const { id } = useParams()
  const { success, error } = useToast()
  const [campaign, setCampaign] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    fetchCampaign()
  }, [id])

  const fetchCampaign = async () => {
    try {
      const response = await axios.get(`/api/campaigns/${id}`)
      setCampaign(response.data)
    } catch (err) {
      error('Failed to load campaign')
    } finally {
      setLoading(false)
    }
  }

  const handleStart = async () => {
    try {
      await axios.post(`/api/campaigns/${id}/start`)
      success('Campaign started in background')
      fetchCampaign()
    } catch (err) {
      error(err.response?.data?.detail || 'Failed to start campaign in background. Is Redis running?')
    }
  }

  const handleStartNow = async () => {
    if (window.confirm('This will send all emails immediately. The page may be unresponsive during sending. Continue?')) {
      setSending(true)
      try {
        console.log('Starting campaign now...', id)
        const response = await axios.post(`/api/campaigns/${id}/start-now`)
        console.log('Campaign response:', response.data)
        success(`Campaign completed! Sent: ${response.data.sent}, Failed: ${response.data.failed}`)
        await fetchCampaign()
      } catch (err) {
        console.error('Campaign error:', err)
        error(err.response?.data?.detail || 'Failed to start campaign')
      } finally {
        setSending(false)
      }
    }
  }

  const handlePause = async () => {
    try {
      await axios.post(`/api/campaigns/${id}/pause`)
      success('Campaign paused')
      fetchCampaign()
    } catch (err) {
      error('Failed to pause campaign')
    }
  }

  const handleStop = async () => {
    if (window.confirm('Are you sure you want to stop this campaign? This cannot be undone.')) {
      try {
        await axios.post(`/api/campaigns/${id}/stop`)
        success('Campaign stopped')
        fetchCampaign()
      } catch (err) {
        error('Failed to stop campaign')
      }
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full"></div>
    </div>
  }

  if (!campaign) {
    return <div className="text-center py-12">Campaign not found</div>
  }

  const progress = campaign.total_contacts > 0
    ? ((campaign.sent_count + campaign.failed_count) / campaign.total_contacts) * 100
    : 0

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{campaign.name}</h1>
          <p className="text-gray-400 mt-1">{campaign.template_subject}</p>
        </div>

        <div className="flex gap-2">
          {campaign.status === 'draft' && (
            <>
              <button
                onClick={handleStartNow}
                disabled={sending}
                className="btn-primary flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                {sending ? 'Sending...' : 'Start Now'}
              </button>
              <button onClick={handleStart} className="btn-secondary flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Start in Background
              </button>
            </>
          )}

          {campaign.status === 'running' && (
            <>
              <button onClick={handlePause} className="btn-secondary flex items-center gap-2">
                <Pause className="w-4 h-4" />
                Pause
              </button>
              <button onClick={handleStop} className="btn-secondary flex items-center gap-2">
                <Square className="w-4 h-4" />
                Stop
              </button>
            </>
          )}

          {campaign.status === 'paused' && (
            <>
              <button
                onClick={handleStartNow}
                disabled={sending}
                className="btn-primary flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                {sending ? 'Sending...' : 'Resume Now'}
              </button>
              <button onClick={handleStart} className="btn-secondary flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Resume in Background
              </button>
            </>
          )}

          {(campaign.status === 'stopped' || campaign.status === 'completed' || campaign.status === 'failed') && (
            <>
              <button
                onClick={handleStartNow}
                disabled={sending}
                className="btn-primary flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                {sending ? 'Sending...' : 'Resend Campaign'}
              </button>
              <button onClick={handleStart} className="btn-secondary flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Resend in Background
              </button>
            </>
          )}
        </div>
      </div>

      {/* Progress */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Progress</h2>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            campaign.status === 'completed' ? 'bg-green-500/20 text-green-400' :
            campaign.status === 'running' ? 'bg-blue-500/20 text-blue-400' :
            campaign.status === 'paused' ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-gray-500/20 text-gray-400'
          }`}>
            {campaign.status.toUpperCase()}
          </span>
        </div>

        <div className="w-full bg-gray-800 rounded-full h-4">
          <div
            className="bg-gradient-to-r from-primary-600 to-accent-600 h-4 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-800 rounded-lg">
            <Clock className="w-6 h-6 text-gray-400 mx-auto mb-2" />
            <p className="text-2xl font-bold">{campaign.total_contacts}</p>
            <p className="text-sm text-gray-400">Total</p>
          </div>

          <div className="text-center p-4 bg-gray-800 rounded-lg">
            <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold">{campaign.sent_count}</p>
            <p className="text-sm text-gray-400">Sent</p>
          </div>

          <div className="text-center p-4 bg-gray-800 rounded-lg">
            <XCircle className="w-6 h-6 text-red-400 mx-auto mb-2" />
            <p className="text-2xl font-bold">{campaign.failed_count}</p>
            <p className="text-sm text-gray-400">Failed</p>
          </div>

          <div className="text-center p-4 bg-gray-800 rounded-lg">
            <Clock className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-bold">
              {campaign.total_contacts - campaign.sent_count - campaign.failed_count}
            </p>
            <p className="text-sm text-gray-400">Pending</p>
          </div>
        </div>
      </div>

      {/* Template Preview */}
      <div className="card space-y-4">
        <h2 className="text-xl font-bold">Template</h2>
        <div className="bg-gray-800 rounded-lg p-6 space-y-4">
          <div>
            <p className="text-sm text-gray-400 mb-1">Subject</p>
            <p className="font-semibold">{campaign.template_subject}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Body</p>
            <p className="text-sm whitespace-pre-wrap">{campaign.template_body}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CampaignDetail
