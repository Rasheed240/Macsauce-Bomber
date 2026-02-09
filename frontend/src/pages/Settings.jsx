import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Mail, CheckCircle, XCircle, LogOut, Shield, Zap, Clock, Users, AlertTriangle, Info, Sparkles, Link as LinkIcon } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import clsx from 'clsx'

const Settings = () => {
  const [searchParams] = useSearchParams()
  const { user, isConnected, initGoogleAuth, disconnect, setUserEmail } = useAuth()
  const { success, error } = useToast()
  const [email, setEmail] = useState('')

  useEffect(() => {
    // Handle OAuth callback
    const authStatus = searchParams.get('auth')
    const authEmail = searchParams.get('email')

    if (authStatus === 'success' && authEmail) {
      setUserEmail(authEmail)
      success('Gmail connected successfully!')
    } else if (authStatus === 'error') {
      error('Failed to connect Gmail')
    }
  }, [searchParams])

  const handleConnect = async () => {
    try {
      await initGoogleAuth()
    } catch (err) {
      error('Failed to initiate Gmail connection')
    }
  }

  const handleDisconnect = async () => {
    if (window.confirm('Are you sure you want to disconnect your Gmail account?')) {
      try {
        await disconnect()
        success('Gmail disconnected successfully')
      } catch (err) {
        error('Failed to disconnect Gmail')
      }
    }
  }

  const limits = [
    { label: 'Free Gmail', value: '500 emails/day', icon: Mail, color: 'text-blue-500' },
    { label: 'Google Workspace', value: '2,000 emails/day', icon: Zap, color: 'text-purple-500' },
    { label: 'Recommended Delay', value: '30-90 seconds', icon: Clock, color: 'text-green-500' },
  ]

  const bestPractices = [
    { text: 'Always personalize emails with recipient names', icon: Users },
    { text: 'Test emails with yourself before bulk sending', icon: Mail },
    { text: 'Include an unsubscribe option in all emails', icon: LinkIcon },
    { text: 'Never send unsolicited emails (spam)', icon: AlertTriangle },
    { text: 'Respect sending limits to avoid suspension', icon: Shield },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="animate-slide-down">
        <h1 className="text-4xl font-black gradient-text mb-2 flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-primary-500" />
          Settings
        </h1>
        <p className="text-base" style={{ color: 'rgb(var(--color-text-secondary))' }}>
          Configure your account and manage Gmail connection
        </p>
      </div>

      {/* Gmail Connection Card */}
      <div className="card animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-primary-500/20 to-accent-500/20">
            <Mail className="w-6 h-6 text-primary-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold" style={{ color: 'rgb(var(--color-text-primary))' }}>
              Gmail Connection
            </h2>
            <p className="text-sm" style={{ color: 'rgb(var(--color-text-tertiary))' }}>
              Secure OAuth 2.0 Authentication
            </p>
          </div>
        </div>

        {!isConnected ? (
          <div className="space-y-6">
            <p style={{ color: 'rgb(var(--color-text-secondary))' }}>
              Connect your Gmail account to start sending personalized bulk emails.
              Your emails will be sent from your Gmail account and appear in your Sent folder.
            </p>

            {/* Privacy Notice */}
            <div className="px-6 py-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-2 border-blue-500/30">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="font-bold text-blue-600 dark:text-blue-400 mb-1">
                    Privacy & Security
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Your emails are sent directly from your Gmail. We never access your email content.
                    All contact data is encrypted and stored securely.
                  </p>
                </div>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { icon: Shield, label: 'Secure', desc: 'OAuth 2.0' },
                { icon: Zap, label: 'Fast', desc: 'Instant setup' },
                { icon: CheckCircle, label: 'Reliable', desc: 'Gmail API' }
              ].map((feature, index) => (
                <div
                  key={index}
                  className="p-4 rounded-xl border text-center hover-lift"
                  style={{
                    backgroundColor: 'rgb(var(--color-bg-tertiary))',
                    borderColor: 'rgb(var(--color-border))',
                    animationDelay: `${index * 0.1}s`
                  }}
                >
                  <feature.icon className="w-8 h-8 mx-auto mb-2 text-primary-500" />
                  <p className="font-bold text-sm mb-1" style={{ color: 'rgb(var(--color-text-primary))' }}>
                    {feature.label}
                  </p>
                  <p className="text-xs" style={{ color: 'rgb(var(--color-text-tertiary))' }}>
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>

            <button
              onClick={handleConnect}
              className="btn-primary flex items-center gap-2 w-full md:w-auto"
            >
              <Mail className="w-5 h-5" />
              Connect Gmail Account
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Connected Status */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-2 border-green-500/30 animate-scale-in">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-green-500/20 flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse-ring"></div>
                </div>
                <div className="flex-1">
                  <p className="text-lg font-bold text-green-600 dark:text-green-400 mb-1">
                    Connected Successfully
                  </p>
                  <p className="text-sm font-mono" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                    {user?.email}
                  </p>
                </div>
                <button
                  onClick={handleDisconnect}
                  className="btn-danger flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Disconnect
                </button>
              </div>
            </div>

            {/* Account Stats */}
            <div className="card-flat">
              <h3 className="text-lg font-bold mb-4" style={{ color: 'rgb(var(--color-text-primary))' }}>
                Account Information
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: 'rgb(var(--color-bg-tertiary))' }}>
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-primary-500" />
                    <span className="font-semibold" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                      Email Address
                    </span>
                  </div>
                  <span className="font-mono font-bold" style={{ color: 'rgb(var(--color-text-primary))' }}>
                    {user?.email}
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: 'rgb(var(--color-bg-tertiary))' }}>
                  <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-primary-500" />
                    <span className="font-semibold" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                      Daily Send Limit
                    </span>
                  </div>
                  <span className="font-bold text-2xl" style={{ color: 'rgb(var(--color-text-primary))' }}>
                    {user?.dailyLimit || 100}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sending Limits */}
      <div className="card animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20">
            <Info className="w-6 h-6 text-yellow-500" />
          </div>
          <h2 className="text-2xl font-bold" style={{ color: 'rgb(var(--color-text-primary))' }}>
            Gmail Sending Limits
          </h2>
        </div>

        <p className="mb-6" style={{ color: 'rgb(var(--color-text-secondary))' }}>
          Gmail enforces daily sending limits to prevent spam and protect your account.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {limits.map((limit, index) => {
            const Icon = limit.icon
            return (
              <div
                key={index}
                className="stat-card hover-lift"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="relative z-10">
                  <Icon className={clsx("w-10 h-10 mb-3", limit.color)} />
                  <p className="text-sm font-semibold mb-1" style={{ color: 'rgb(var(--color-text-tertiary))' }}>
                    {limit.label}
                  </p>
                  <p className="text-xl font-black" style={{ color: 'rgb(var(--color-text-primary))' }}>
                    {limit.value}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Best Practices */}
      <div className="card animate-slide-up" style={{ animationDelay: '0.3s' }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20">
            <CheckCircle className="w-6 h-6 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold" style={{ color: 'rgb(var(--color-text-primary))' }}>
            Best Practices
          </h2>
        </div>

        <p className="mb-6" style={{ color: 'rgb(var(--color-text-secondary))' }}>
          Follow these guidelines to maintain a good sender reputation and avoid issues.
        </p>

        <div className="space-y-3">
          {bestPractices.map((practice, index) => {
            const Icon = practice.icon
            return (
              <div
                key={index}
                className="flex items-start gap-4 p-4 rounded-xl hover-lift transition-all"
                style={{
                  backgroundColor: 'rgb(var(--color-bg-tertiary))',
                  animationDelay: `${index * 0.05}s`
                }}
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-green-500" />
                </div>
                <div className="flex-1 pt-1">
                  <p className="font-semibold" style={{ color: 'rgb(var(--color-text-primary))' }}>
                    {practice.text}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Warning Footer */}
      <div className="px-6 py-4 rounded-xl bg-gradient-to-r from-red-500/10 to-orange-500/10 border-2 border-red-500/30 animate-slide-up" style={{ animationDelay: '0.4s' }}>
        <div className="flex gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="font-bold text-red-600 dark:text-red-400 mb-1">
              Important Warning
            </p>
            <p className="text-sm text-red-700 dark:text-red-300">
              Violating Gmail's Terms of Service by sending spam or unsolicited emails can result in permanent account suspension.
              Always obtain consent before sending marketing emails and honor unsubscribe requests immediately.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings
