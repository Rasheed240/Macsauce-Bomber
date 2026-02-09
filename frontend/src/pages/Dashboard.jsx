import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Send, Clock, CheckCircle, XCircle, TrendingUp, Rocket, Zap, ArrowRight, Activity, Mail } from 'lucide-react'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import clsx from 'clsx'

const Dashboard = () => {
  const { user, isConnected } = useAuth()
  const { error } = useToast()
  const [campaigns, setCampaigns] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isConnected && user) {
      fetchDashboardData()
    } else {
      setLoading(false)
    }
  }, [isConnected, user])

  const fetchDashboardData = async () => {
    try {
      const [campaignsRes, statsRes] = await Promise.all([
        axios.get(`/api/campaigns?user_email=${user.email}&limit=5`),
        axios.get(`/api/emails/stats?user_email=${user.email}`)
      ])

      setCampaigns(campaignsRes.data.campaigns)
      setStats(statsRes.data)
    } catch (err) {
      error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] animate-scale-in">
        <div className="text-center space-y-8 max-w-2xl px-4">
          {/* Animated Icon */}
          <div className="relative mx-auto w-32 h-32 animate-float">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-accent-600 rounded-3xl blur-2xl opacity-40 animate-pulse-ring"></div>
            <div className="relative w-32 h-32 bg-gradient-to-br from-primary-600 to-accent-600 rounded-3xl flex items-center justify-center shadow-2xl">
              <Rocket className="w-16 h-16 text-white" />
            </div>
          </div>

          {/* Welcome Text */}
          <div className="space-y-4">
            <h2 className="text-5xl font-black">
              <span className="gradient-text">Welcome to</span>
              <br />
              <span className="gradient-text">Macsauce Bomber</span>
            </h2>
            <p className="text-lg" style={{ color: 'rgb(var(--color-text-secondary))' }}>
              Your professional bulk email platform. Connect your Gmail account to start sending personalized campaigns that convert.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            {[
              { icon: Zap, title: 'Lightning Fast', desc: 'Send thousands of emails' },
              { icon: Mail, title: 'Personalized', desc: 'Custom placeholders' },
              { icon: Activity, title: 'Analytics', desc: 'Track performance' }
            ].map((feature, index) => (
              <div
                key={index}
                className="p-4 rounded-2xl border"
                style={{
                  backgroundColor: 'rgb(var(--color-bg-secondary))',
                  borderColor: 'rgb(var(--color-border))',
                  animationDelay: `${index * 0.1}s`
                }}
              >
                <feature.icon className="w-8 h-8 text-primary-500 mx-auto mb-2" />
                <h3 className="font-bold text-sm" style={{ color: 'rgb(var(--color-text-primary))' }}>
                  {feature.title}
                </h3>
                <p className="text-xs mt-1" style={{ color: 'rgb(var(--color-text-tertiary))' }}>
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <Link
            to="/settings"
            className="inline-flex items-center gap-3 btn-primary px-10 py-4 text-lg group mt-8"
          >
            <Send className="w-6 h-6 group-hover:rotate-12 transition-transform" />
            Connect Gmail to Get Started
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="spinner-large text-primary-600"></div>
        <p className="text-sm font-medium" style={{ color: 'rgb(var(--color-text-secondary))' }}>
          Loading your dashboard...
        </p>
      </div>
    )
  }

  const statCards = [
    {
      label: 'Total Sent',
      value: stats?.total_sent || 0,
      icon: CheckCircle,
      color: 'green',
      gradient: 'from-green-600 to-emerald-600',
      bgColor: 'bg-green-500/10',
      iconColor: 'text-green-500'
    },
    {
      label: 'Sent Today',
      value: stats?.sent_today || 0,
      icon: Clock,
      color: 'blue',
      gradient: 'from-blue-600 to-cyan-600',
      bgColor: 'bg-blue-500/10',
      iconColor: 'text-blue-500'
    },
    {
      label: 'Success Rate',
      value: `${stats?.success_rate || 0}%`,
      icon: TrendingUp,
      color: 'purple',
      gradient: 'from-primary-600 to-accent-600',
      bgColor: 'bg-primary-500/10',
      iconColor: 'text-primary-500'
    },
    {
      label: 'Failed',
      value: stats?.total_failed || 0,
      icon: XCircle,
      color: 'red',
      gradient: 'from-red-600 to-rose-600',
      bgColor: 'bg-red-500/10',
      iconColor: 'text-red-500'
    }
  ]

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-slide-down">
        <div>
          <h1 className="text-4xl font-black gradient-text mb-2">
            Dashboard
          </h1>
          <p className="text-base" style={{ color: 'rgb(var(--color-text-secondary))' }}>
            Track and manage your email campaigns in real-time
          </p>
        </div>
        <Link to="/campaigns/new" className="btn-primary flex items-center gap-2 group">
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
          Create Campaign
        </Link>
      </div>

      {/* Stats Grid with Stagger Animation */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 stagger-animation">
          {statCards.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div
                key={index}
                className="stat-card group hover-lift cursor-pointer"
              >
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex-1">
                    <p className="text-sm font-semibold mb-2" style={{ color: 'rgb(var(--color-text-tertiary))' }}>
                      {stat.label}
                    </p>
                    <p className="text-4xl font-black" style={{ color: 'rgb(var(--color-text-primary))' }}>
                      {stat.value}
                    </p>
                  </div>
                  <div className={clsx(
                    "w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-6",
                    stat.bgColor
                  )}>
                    <Icon className={clsx("w-8 h-8", stat.iconColor)} />
                  </div>
                </div>

                {/* Hover Effect Border */}
                <div className={clsx(
                  "absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity",
                  stat.gradient
                )}></div>
              </div>
            )
          })}
        </div>
      )}

      {/* Recent Campaigns Section */}
      <div className="card-flat animate-slide-up" style={{ animationDelay: '0.3s' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold" style={{ color: 'rgb(var(--color-text-primary))' }}>
            Recent Campaigns
          </h2>
          <Link
            to="/campaigns/new"
            className="text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center gap-1 transition-colors"
          >
            View All
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {campaigns.length === 0 ? (
          <div className="text-center py-16">
            <div className="relative w-20 h-20 mx-auto mb-6 opacity-50">
              <Send className="w-20 h-20" style={{ color: 'rgb(var(--color-text-tertiary))' }} />
            </div>
            <h3 className="text-xl font-bold mb-2" style={{ color: 'rgb(var(--color-text-primary))' }}>
              No campaigns yet
            </h3>
            <p className="mb-6" style={{ color: 'rgb(var(--color-text-secondary))' }}>
              Create your first campaign to start sending personalized emails
            </p>
            <Link to="/campaigns/new" className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Create First Campaign
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {campaigns.map((campaign, index) => {
              const progress = (campaign.sent_count / campaign.total_contacts) * 100

              return (
                <Link
                  key={campaign.id}
                  to={`/campaigns/${campaign.id}`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                  className="block p-5 rounded-xl border hover-lift transition-all group animate-slide-up"
                  data-style={{
                    backgroundColor: 'rgb(var(--color-bg-tertiary))',
                    borderColor: 'rgb(var(--color-border))'
                  }}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg mb-1 truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors"
                          style={{ color: 'rgb(var(--color-text-primary))' }}>
                        {campaign.name}
                      </h3>
                      <p className="text-sm truncate" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                        {campaign.template_subject}
                      </p>
                    </div>

                    <div className={clsx(
                      "badge font-bold",
                      campaign.status === 'completed' ? 'badge-success' :
                      campaign.status === 'running' ? 'badge-info' :
                      campaign.status === 'paused' ? 'badge-warning' :
                      'badge-neutral'
                    )}>
                      {campaign.status.toUpperCase()}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs mb-1.5" style={{ color: 'rgb(var(--color-text-tertiary))' }}>
                      <span>Progress</span>
                      <span className="font-semibold">{campaign.sent_count} / {campaign.total_contacts}</span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className={clsx(
                          "progress-bar-fill",
                          campaign.status === 'running' && "progress-bar-striped"
                        )}
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="font-semibold" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                        {campaign.sent_count} sent
                      </span>
                    </div>
                    {campaign.failed_count > 0 && (
                      <div className="flex items-center gap-1.5">
                        <XCircle className="w-4 h-4 text-red-500" />
                        <span className="font-semibold" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                          {campaign.failed_count} failed
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
