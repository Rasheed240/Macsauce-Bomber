import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend, Area, AreaChart, CartesianGrid } from 'recharts'
import { Download, TrendingUp, TrendingDown, Mail, AlertCircle, CheckCircle2, Activity, Calendar, Users } from 'lucide-react'
import axios from 'axios'
import Papa from 'papaparse'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'


const COLORS = ['#6366f1', '#22d3ee', '#f59e42', '#ef4444', '#10b981', '#a78bfa']
const GRADIENT_COLORS = {
  sent: ['#6366f1', '#8b5cf6'],
  failed: ['#ef4444', '#f87171'],
  bounced: ['#f59e42', '#fb923c']
}

const Analytics = () => {
  const { user } = useAuth()
  const { error, success } = useToast()
  const [stats, setStats] = useState(null)
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) fetchAnalytics()
  }, [user])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const [statsRes, campaignsRes] = await Promise.all([
        axios.get(`/api/emails/stats?user_email=${user.email}`),
        axios.get(`/api/campaigns?user_email=${user.email}&limit=100`)
      ])
      setStats(statsRes.data)
      setCampaigns(campaignsRes.data.campaigns)
    } catch (err) {
      error('Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  const exportCSV = () => {
    if (!campaigns.length) return
    const csv = Papa.unparse(campaigns.map(c => ({
      Name: c.name,
      Status: c.status,
      'Total Contacts': c.total_contacts,
      Sent: c.sent_count,
      Failed: c.failed_count,
      Bounced: c.bounced_count,
      'Created At': c.created_at,
      'Started At': c.started_at,
      'Completed At': c.completed_at
    })))
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'campaign_analytics.csv'
    a.click()
    window.URL.revokeObjectURL(url)
    success('Exported analytics to CSV')
  }

  // Prepare chart data
  const chartData = campaigns.map(c => ({
    name: c.name,
    Sent: c.sent_count,
    Failed: c.failed_count,
    Bounced: c.bounced_count
  }))

  const timeSeries = campaigns
    .filter(c => c.started_at)
    .map(c => ({
      date: c.started_at ? new Date(c.started_at).toLocaleDateString() : '',
      Sent: c.sent_count,
      Failed: c.failed_count,
      Bounced: c.bounced_count
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date))

  const pieData = [
    { name: 'Sent', value: stats?.total_sent || 0 },
    { name: 'Failed', value: stats?.total_failed || 0 },
    { name: 'Bounced', value: stats?.total_bounced || 0 }
  ]

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800/95 backdrop-blur-sm border border-gray-700 rounded-lg p-3 shadow-xl">
          <p className="text-gray-200 font-semibold mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
              <span className="text-gray-300">{entry.name}:</span>
              <span className="text-white font-semibold">{entry.value}</span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header Section with Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-8 shadow-2xl">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Activity className="w-8 h-8 text-white" />
              <h1 className="text-4xl font-bold text-white">Analytics Dashboard</h1>
            </div>
            <p className="text-indigo-100 text-lg">Real-time campaign performance insights</p>
          </div>
          <button
            onClick={exportCSV}
            className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all duration-200 hover:scale-105 shadow-lg"
          >
            <Download className="w-5 h-5" />
            Export Data
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="relative">
            <div className="animate-spin w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full"></div>
            <div className="absolute inset-0 animate-ping w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full opacity-20"></div>
          </div>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Sent Card */}
            <div className="group relative overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center">
                    <Mail className="w-6 h-6 text-indigo-400" />
                  </div>
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                <p className="text-gray-400 text-sm font-medium mb-1">Total Sent</p>
                <p className="text-3xl font-bold text-white mb-1">{stats?.total_sent?.toLocaleString() || 0}</p>
                <p className="text-xs text-gray-500">This week: {stats?.sent_this_week?.toLocaleString() || 0}</p>
              </div>
            </div>

            {/* Success Rate Card */}
            <div className="group relative overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-green-400" />
                  </div>
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                <p className="text-gray-400 text-sm font-medium mb-1">Success Rate</p>
                <p className="text-3xl font-bold text-white mb-1">{stats?.success_rate ?? 0}%</p>
                <p className="text-xs text-gray-500">Delivery performance</p>
              </div>
            </div>

            {/* Failed Emails Card */}
            <div className="group relative overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-red-400" />
                  </div>
                  <TrendingDown className="w-5 h-5 text-red-400" />
                </div>
                <p className="text-gray-400 text-sm font-medium mb-1">Failed</p>
                <p className="text-3xl font-bold text-white mb-1">{stats?.total_failed?.toLocaleString() || 0}</p>
                <p className="text-xs text-gray-500">Requires attention</p>
              </div>
            </div>

            {/* Bounced Emails Card */}
            <div className="group relative overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-amber-400" />
                  </div>
                  <TrendingDown className="w-5 h-5 text-amber-400" />
                </div>
                <p className="text-gray-400 text-sm font-medium mb-1">Bounced</p>
                <p className="text-3xl font-bold text-white mb-1">{stats?.total_bounced?.toLocaleString() || 0}</p>
                <p className="text-xs text-gray-500">Invalid addresses</p>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Sends Over Time - Area Chart */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Sends Over Time</h2>
                  <p className="text-sm text-gray-400">Campaign delivery timeline</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={timeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorBounced" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e42" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f59e42" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.3} />
                  <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 12 }} stroke="#4b5563" />
                  <YAxis allowDecimals={false} tick={{ fill: '#9ca3af', fontSize: 12 }} stroke="#4b5563" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Area type="monotone" dataKey="Sent" stroke="#6366f1" strokeWidth={2} fill="url(#colorSent)" />
                  <Area type="monotone" dataKey="Failed" stroke="#ef4444" strokeWidth={2} fill="url(#colorFailed)" />
                  <Area type="monotone" dataKey="Bounced" stroke="#f59e42" strokeWidth={2} fill="url(#colorBounced)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Sends by Campaign - Bar Chart */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Campaign Performance</h2>
                  <p className="text-sm text-gray-400">Sends by campaign name</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.3} />
                  <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={80} stroke="#4b5563" />
                  <YAxis allowDecimals={false} tick={{ fill: '#9ca3af', fontSize: 12 }} stroke="#4b5563" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: '10px' }} />
                  <Bar dataKey="Sent" fill="#6366f1" radius={[8, 8, 0, 0]} animationDuration={1000} />
                  <Bar dataKey="Failed" fill="#ef4444" radius={[8, 8, 0, 0]} animationDuration={1000} />
                  <Bar dataKey="Bounced" fill="#f59e42" radius={[8, 8, 0, 0]} animationDuration={1000} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Delivery Breakdown - Enhanced Pie Chart */}
            <div className="lg:col-span-2 bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Delivery Breakdown</h2>
                  <p className="text-sm text-gray-400">Distribution of email statuses</p>
                </div>
              </div>
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <defs>
                      <linearGradient id="pieGradient1" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                      </linearGradient>
                      <linearGradient id="pieGradient2" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#ef4444" />
                        <stop offset="100%" stopColor="#f87171" />
                      </linearGradient>
                      <linearGradient id="pieGradient3" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#f59e42" />
                        <stop offset="100%" stopColor="#fb923c" />
                      </linearGradient>
                    </defs>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      innerRadius={60}
                      paddingAngle={3}
                      animationDuration={1000}
                      label={({ value }) => value > 0 ? value.toLocaleString() : ''}
                      labelLine={{ stroke: '#6b7280', strokeWidth: 1 }}
                    >
                      {pieData.map((entry, idx) => (
                        <Cell
                          key={`cell-${idx}`}
                          fill={idx === 0 ? 'url(#pieGradient1)' : idx === 1 ? 'url(#pieGradient2)' : 'url(#pieGradient3)'}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-4 min-w-[200px]">
                  {pieData.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: COLORS[idx] }}></div>
                        <span className="text-gray-300 font-medium">{item.name}</span>
                      </div>
                      <span className="text-white font-bold">{item.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Quick Stats</h2>
                  <p className="text-sm text-gray-400">Key metrics</p>
                </div>
              </div>
              <div className="space-y-6">
                <div className="text-center p-6 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-xl border border-indigo-500/20">
                  <p className="text-gray-400 text-sm mb-2">Today</p>
                  <p className="text-4xl font-bold text-white mb-1">{stats?.sent_today?.toLocaleString() || 0}</p>
                  <p className="text-xs text-gray-500">emails sent</p>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-xl border border-cyan-500/20">
                  <p className="text-gray-400 text-sm mb-2">This Week</p>
                  <p className="text-4xl font-bold text-white mb-1">{stats?.sent_this_week?.toLocaleString() || 0}</p>
                  <p className="text-xs text-gray-500">emails sent</p>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl border border-green-500/20">
                  <p className="text-gray-400 text-sm mb-2">Total Campaigns</p>
                  <p className="text-4xl font-bold text-white mb-1">{campaigns.length}</p>
                  <p className="text-xs text-gray-500">active campaigns</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default Analytics
