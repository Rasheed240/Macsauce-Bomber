
import { useEffect, useState } from 'react'
import { FileText, Trash2 } from 'lucide-react'
import { fetchTemplates, deleteTemplate } from '../services/template'
import { useAuth } from '../contexts/AuthContext'

const Templates = () => {
  const { user } = useAuth()
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadTemplates = async () => {
    if (!user?.email) return
    setLoading(true)
    try {
      const data = await fetchTemplates(user.email)
      setTemplates(data)
    } catch (err) {
      setError('Failed to load templates')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTemplates()
    // eslint-disable-next-line
  }, [user?.email])

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this template?')) return
    try {
      await deleteTemplate(id)
      setTemplates(templates.filter(t => t.id !== id))
    } catch {
      setError('Failed to delete template')
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Templates</h1>
        <p className="text-gray-400 mt-1">Saved email templates</p>
      </div>

      {loading ? (
        <div className="card text-center py-12">
          <div className="animate-spin w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">Loading templates...</p>
        </div>
      ) : error ? (
        <div className="card text-center py-12">
          <p className="text-red-400">{error}</p>
        </div>
      ) : templates.length === 0 ? (
        <div className="card text-center py-12">
          <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No templates saved yet</p>
          <p className="text-sm text-gray-500 mt-2">Create templates from the campaign wizard</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {templates.map(template => (
            <div key={template.id} className="card p-4 sm:p-6 space-y-2 relative">
              <button
                className="absolute top-2 right-2 sm:top-3 sm:right-3 text-gray-500 hover:text-red-500 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                title="Delete"
                onClick={() => handleDelete(template.id)}
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <h2 className="text-lg font-bold mb-1">{template.name}</h2>
              <p className="text-gray-400 text-sm mb-2">{template.description}</p>
              <div>
                <span className="text-xs text-gray-500">Subject:</span>
                <span className="ml-1 text-sm">{template.subject}</span>
              </div>
              <div>
                <span className="text-xs text-gray-500">Body:</span>
                <span className="ml-1 text-sm line-clamp-2 whitespace-pre-wrap">{template.body}</span>
              </div>
              <div className="flex gap-2 mt-2">
                {template.category && (
                  <span className="px-2 py-0.5 rounded bg-gray-700 text-xs text-gray-300">{template.category}</span>
                )}
                <span className="px-2 py-0.5 rounded bg-gray-800 text-xs text-gray-400">Used {template.use_count}x</span>
              </div>
              <div className="text-xs text-gray-500 mt-2">Last updated: {new Date(template.updated_at).toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Templates
