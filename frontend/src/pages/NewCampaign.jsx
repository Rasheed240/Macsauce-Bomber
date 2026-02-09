import { useState, useEffect } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { useNavigate } from 'react-router-dom'
import { Upload, FileText, Link as LinkIcon, Eye, Send, Check, ArrowRight, ArrowLeft, Sparkles, Plus, X, Edit3, Database, Paperclip, Trash2 } from 'lucide-react'
import axios from 'axios'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { useAuth } from '../contexts/AuthContext'
import { fetchTemplates, createTemplate } from '../services/template'
import { useToast } from '../contexts/ToastContext'
import clsx from 'clsx'

const NewCampaign = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { success, error } = useToast()

  const [step, setStep] = useState(1)
  const [creating, setCreating] = useState(false)
  const [useManualEntry, setUseManualEntry] = useState(false)
  const [manualContacts, setManualContacts] = useState([])
  const [attachments, setAttachments] = useState([])
  const [uploading, setUploading] = useState(false)

  const [campaignData, setCampaignData] = useState({
    name: '',
    file: null,
    parsedData: null,
    columns: [],
    emailColumn: '',
    subject: '',
    body: '',
    columnMapping: {},
    dailyLimit: 100,
    delayMin: 30,
    delayMax: 90
  })
  const [scheduledAt, setScheduledAt] = useState(null)
  const [templates, setTemplates] = useState([])
  const [templatesLoading, setTemplatesLoading] = useState(false)
  const [templateError, setTemplateError] = useState(null)

  // Fetch templates for user
  useEffect(() => {
    const loadTemplates = async () => {
      if (!user?.email) return
      setTemplatesLoading(true)
      try {
        const data = await fetchTemplates(user.email)
        setTemplates(data)
      } catch (err) {
        setTemplateError('Failed to load templates')
      } finally {
        setTemplatesLoading(false)
      }
    }
    loadTemplates()
    // eslint-disable-next-line
  }, [user?.email])

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    try {
      const endpoint = file.name.endsWith('.csv') ? '/api/parse/csv' :
                      file.name.endsWith('.xlsx') || file.name.endsWith('.xls') ? '/api/parse/excel' :
                      '/api/parse/json'

      const response = await axios.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      setCampaignData(prev => ({
        ...prev,
        file,
        parsedData: response.data.data,
        columns: response.data.columns,
        emailColumn: response.data.detected_email_column || response.data.columns[0]
      }))

      success('File uploaded successfully')
      setStep(2)
    } catch (err) {
      error(err.response?.data?.detail || 'Failed to upload file')
    }
  }

  const handleManualEntry = () => {
    setUseManualEntry(true)
    setStep(2)
  }

  const addManualContact = () => {
    const placeholders = extractPlaceholders(campaignData.subject + ' ' + campaignData.body)
    const newContact = { email: '' }
    placeholders.forEach(p => {
      newContact[p] = ''
    })
    setManualContacts([...manualContacts, newContact])
  }

  const removeManualContact = (index) => {
    setManualContacts(manualContacts.filter((_, i) => i !== index))
  }

  const updateManualContact = (index, field, value) => {
    const updated = [...manualContacts]
    updated[index][field] = value
    setManualContacts(updated)
  }

  const handleTemplateChange = (field, value) => {
    setCampaignData(prev => ({ ...prev, [field]: value }))
  }

  const handleAttachmentUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    setUploading(true)
    try {
      const uploadedFiles = []

      for (const file of files) {
        const formData = new FormData()
        formData.append('file', file)

        const response = await axios.post('/api/campaigns/upload-attachment', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })

        uploadedFiles.push({
          original_name: response.data.filename,
          file_path: response.data.file_path,
          size: response.data.size
        })
      }

      setAttachments([...attachments, ...uploadedFiles])
      success(`${uploadedFiles.length} file(s) uploaded successfully`)
    } catch (err) {
      error(err.response?.data?.detail || 'Failed to upload attachment')
    } finally {
      setUploading(false)
    }
  }

  const removeAttachment = async (index) => {
    const attachment = attachments[index]
    try {
      const filename = attachment.file_path.split('/').pop().split('\\').pop()
      await axios.delete(`/api/campaigns/attachment/${filename}`)
      setAttachments(attachments.filter((_, i) => i !== index))
      success('Attachment removed')
    } catch (err) {
      error('Failed to remove attachment')
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const extractPlaceholders = (text) => {
    const regex = /\{\{(\s*[\w\-\.]+\s*)\}\}/g
    const matches = [...text.matchAll(regex)]
    return [...new Set(matches.map(m => m[1].trim()))]
  }

  const suggestMappings = async () => {
    const subjectPlaceholders = extractPlaceholders(campaignData.subject)
    const bodyPlaceholders = extractPlaceholders(campaignData.body)
    const allPlaceholders = [...new Set([...subjectPlaceholders, ...bodyPlaceholders])]

    try {
      const response = await axios.post('/api/parse/suggest-mappings', {
        columns: campaignData.columns,
        placeholders: allPlaceholders
      })

      setCampaignData(prev => ({
        ...prev,
        columnMapping: response.data.mappings
      }))

      success('Mappings suggested')
    } catch (err) {
      error('Failed to suggest mappings')
    }
  }

  const saveAsTemplate = async () => {
    if (!campaignData.subject || !campaignData.body) {
      error('Please fill in subject and body before saving template')
      return
    }

    const templateName = prompt('Enter a name for this template:', campaignData.name || 'My Template')
    if (!templateName) return

    try {
      await createTemplate({
        user_email: user.email,
        name: templateName,
        subject: campaignData.subject,
        body: campaignData.body,
        category: 'custom'
      })
      success('Template saved successfully')
    } catch (err) {
      error('Failed to save template')
    }
  }

  const createCampaign = async () => {
    if (creating) return

    setCreating(true)
    try {
      let contactsData = campaignData.parsedData
      let emailCol = campaignData.emailColumn
      let colMapping = campaignData.columnMapping

      // Handle manual entry
      if (useManualEntry && manualContacts.length > 0) {
        contactsData = manualContacts
        emailCol = 'email'

        // Auto-map placeholders for manual entry
        const placeholders = extractPlaceholders(campaignData.subject + ' ' + campaignData.body)
        colMapping = {}
        placeholders.forEach(p => {
          colMapping[p] = p
        })
      }

      const response = await axios.post('/api/campaigns', {
        user_email: user.email,
        name: campaignData.name,
        template_subject: campaignData.subject,
        template_body: campaignData.body,
        contacts: contactsData,
        column_mapping: colMapping,
        email_column: emailCol,
        daily_limit: campaignData.dailyLimit,
        delay_min: campaignData.delayMin,
        delay_max: campaignData.delayMax,
        scheduled_at: scheduledAt ? scheduledAt.toISOString() : null,
        attachments: attachments.map(a => a.file_path)
      })

      success('Campaign created successfully')
      navigate(`/campaigns/${response.data.id}`)
    } catch (err) {
      error(err.response?.data?.detail?.message || 'Failed to create campaign')
      setCreating(false)
    }
  }

  const steps = [
    { number: 1, title: 'Upload Data', icon: Upload },
    { number: 2, title: 'Create Template', icon: FileText },
    { number: 3, title: useManualEntry ? 'Enter Values' : 'Map Columns', icon: useManualEntry ? Edit3 : LinkIcon },
    { number: 4, title: 'Preview & Send', icon: Eye }
  ]

  const placeholders = extractPlaceholders(campaignData.subject + ' ' + campaignData.body)

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between animate-slide-down">
        <div>
          <h1 className="text-4xl font-black gradient-text mb-2 flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-primary-500" />
            New Campaign
          </h1>
          <p className="text-base" style={{ color: 'rgb(var(--color-text-secondary))' }}>
            Create and launch your personalized bulk email campaign
          </p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="card-flat animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <div className="flex items-center justify-between">
          {steps.map((s, idx) => {
            const Icon = s.icon
            const isActive = step === s.number
            const isCompleted = step > s.number

            return (
              <div key={s.number} className="flex items-center flex-1">
                <div className="flex items-center gap-3">
                  <div className={clsx(
                    'relative w-12 h-12 rounded-2xl flex items-center justify-center font-bold transition-all duration-300',
                    isActive && 'bg-gradient-to-br from-primary-600 to-accent-600 shadow-lg shadow-primary-500/30 scale-110',
                    isCompleted && 'bg-green-600 shadow-lg shadow-green-500/30',
                    !isActive && !isCompleted && 'border-2',
                  )}
                  style={!isActive && !isCompleted ? {
                    borderColor: 'rgb(var(--color-border))',
                    backgroundColor: 'rgb(var(--color-bg-tertiary))',
                    color: 'rgb(var(--color-text-tertiary))'
                  } : {}}>
                    {isCompleted ? (
                      <Check className="w-6 h-6 text-white" />
                    ) : (
                      <Icon className={clsx('w-6 h-6', isActive && 'text-white')} />
                    )}
                  </div>
                  <div className="hidden md:block">
                    <p className={clsx(
                      'text-xs font-semibold',
                      isActive && 'text-primary-600 dark:text-primary-400',
                      isCompleted && 'text-green-600 dark:text-green-400'
                    )}
                    style={!isActive && !isCompleted ? { color: 'rgb(var(--color-text-tertiary))' } : {}}>
                      Step {s.number}
                    </p>
                    <p className={clsx(
                      'text-sm font-bold',
                      isActive && 'text-primary-600 dark:text-primary-400',
                      isCompleted && 'text-green-600 dark:text-green-400'
                    )}
                    style={!isActive && !isCompleted ? { color: 'rgb(var(--color-text-secondary))' } : {}}>
                      {s.title}
                    </p>
                  </div>
                </div>
                {idx < steps.length - 1 && (
                  <div className="h-1 flex-1 mx-4 rounded-full transition-all duration-500"
                       style={{
                         backgroundColor: isCompleted ? '#10b981' : 'rgb(var(--color-border))'
                       }} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="card animate-scale-in" style={{ animationDelay: '0.2s' }}>
        {step === 1 && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: 'rgb(var(--color-text-primary))' }}>
                Choose Data Source
              </h2>
              <p style={{ color: 'rgb(var(--color-text-secondary))' }}>
                Upload a file or manually enter recipient data
              </p>
            </div>

            {/* Upload or Manual Entry Choice */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* File Upload Option */}
              <div className="border-2 border-dashed rounded-2xl p-8 text-center hover-lift transition-all group cursor-pointer"
                   style={{ borderColor: 'rgb(var(--color-border))' }}>
                <div className="relative mx-auto w-20 h-20 mb-4">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-accent-600 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity"></div>
                  <div className="relative w-20 h-20 bg-gradient-to-br from-primary-600 to-accent-600 rounded-2xl flex items-center justify-center">
                    <Database className="w-10 h-10 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ color: 'rgb(var(--color-text-primary))' }}>
                  Upload File
                </h3>
                <p className="text-sm mb-4" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                  CSV, Excel, or JSON file with contacts
                </p>
                <label className="btn-primary inline-block cursor-pointer">
                  <Upload className="w-4 h-4 inline mr-2" />
                  Browse Files
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls,.json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-xs mt-3" style={{ color: 'rgb(var(--color-text-tertiary))' }}>
                  Max 10MB
                </p>
              </div>

              {/* Manual Entry Option */}
              <div className="border-2 border-dashed rounded-2xl p-8 text-center hover-lift transition-all group cursor-pointer"
                   style={{ borderColor: 'rgb(var(--color-border))' }}
                   onClick={handleManualEntry}>
                <div className="relative mx-auto w-20 h-20 mb-4">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity"></div>
                  <div className="relative w-20 h-20 bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center">
                    <Edit3 className="w-10 h-10 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ color: 'rgb(var(--color-text-primary))' }}>
                  Manual Entry
                </h3>
                <p className="text-sm mb-4" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                  Type recipient data manually
                </p>
                <button className="btn-success">
                  <Plus className="w-4 h-4 inline mr-2" />
                  Enter Manually
                </button>
                <p className="text-xs mt-3" style={{ color: 'rgb(var(--color-text-tertiary))' }}>
                  Perfect for small lists
                </p>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: 'rgb(var(--color-text-primary))' }}>
                Create Email Template
              </h2>
              <p style={{ color: 'rgb(var(--color-text-secondary))' }}>
                Design your email with dynamic placeholders
              </p>
            </div>

            {/* Template selection dropdown */}
            <div className="card-flat">
              <label className="block text-sm font-semibold mb-2" style={{ color: 'rgb(var(--color-text-primary))' }}>
                <Sparkles className="w-4 h-4 inline mr-1 text-primary-500" />
                Start from Saved Template
              </label>
              {templatesLoading ? (
                <div className="text-sm" style={{ color: 'rgb(var(--color-text-tertiary))' }}>
                  Loading templates...
                </div>
              ) : templateError ? (
                <div className="text-sm text-red-500">{templateError}</div>
              ) : (
                <select
                  className="select-field"
                  value=""
                  onChange={e => {
                    const tid = e.target.value
                    if (!tid) return
                    const t = templates.find(t => t.id === parseInt(tid))
                    if (t) {
                      setCampaignData(prev => ({
                        ...prev,
                        subject: t.subject,
                        body: t.body
                      }))
                    }
                  }}
                >
                  <option value="">-- Select a template --</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'rgb(var(--color-text-primary))' }}>
                Campaign Name *
              </label>
              <input
                type="text"
                value={campaignData.name}
                onChange={(e) => handleTemplateChange('name', e.target.value)}
                placeholder="e.g., Product Launch Outreach Q1 2024"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'rgb(var(--color-text-primary))' }}>
                Email Subject *
              </label>
              <input
                type="text"
                value={campaignData.subject}
                onChange={(e) => handleTemplateChange('subject', e.target.value)}
                placeholder="Use {{placeholders}} for personalization"
                className="input-field"
              />
              <p className="text-xs mt-2 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                💡 Example: Hi {'{{name}}'}, check out our new product!
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'rgb(var(--color-text-primary))' }}>
                Email Body *
              </label>
              <textarea
                value={campaignData.body}
                onChange={(e) => handleTemplateChange('body', e.target.value)}
                placeholder="Write your email body here. Use {{placeholders}} for personalization. Include {{unsubscribe_link}} for compliance."
                rows={14}
                className="textarea-field"
              />
              {!useManualEntry && campaignData.columns?.length > 0 && (
                <p className="text-xs mt-2 px-3 py-2 rounded-lg bg-primary-500/10 border border-primary-500/20" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                  📊 Available columns: <span className="font-semibold">{campaignData.columns.join(', ')}</span>
                </p>
              )}
              <p className="text-xs mt-2 px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400">
                ⚠️ Important: Add <span className='font-mono bg-yellow-500/20 px-1.5 py-0.5 rounded'>{'{{unsubscribe_link}}'}</span> to comply with email regulations
              </p>
            </div>

            {/* Attachments Section */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'rgb(var(--color-text-primary))' }}>
                <Paperclip className="w-4 h-4 inline mr-1 text-primary-500" />
                Email Attachments
              </label>

              <div className="card-flat">
                <div className="border-2 border-dashed rounded-xl p-6 text-center hover-lift transition-all"
                     style={{ borderColor: 'rgb(var(--color-border))' }}>
                  <Paperclip className="w-8 h-8 mx-auto mb-2 opacity-50" style={{ color: 'rgb(var(--color-text-tertiary))' }} />
                  <p className="text-sm mb-3" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                    Attach files to send with each email
                  </p>
                  <label className="btn-outline inline-block cursor-pointer">
                    <Upload className="w-4 h-4 inline mr-2" />
                    {uploading ? 'Uploading...' : 'Choose Files'}
                    <input
                      type="file"
                      multiple
                      onChange={handleAttachmentUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs mt-2" style={{ color: 'rgb(var(--color-text-tertiary))' }}>
                    Max 25MB per file
                  </p>
                </div>

                {/* Attached Files List */}
                {attachments.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {attachments.map((attachment, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg border transition-colors hover:border-primary-500/50"
                        style={{
                          borderColor: 'rgb(var(--color-border))',
                          backgroundColor: 'rgb(var(--color-bg-tertiary))'
                        }}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
                            <Paperclip className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate" style={{ color: 'rgb(var(--color-text-primary))' }}>
                              {attachment.original_name}
                            </p>
                            <p className="text-xs" style={{ color: 'rgb(var(--color-text-tertiary))' }}>
                              {formatFileSize(attachment.size)}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeAttachment(index)}
                          className="flex-shrink-0 p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(1)}
                className="btn-ghost"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </button>
              <button
                onClick={saveAsTemplate}
                disabled={!campaignData.subject || !campaignData.body}
                className="btn-outline"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Save as Template
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!campaignData.name || !campaignData.subject || !campaignData.body}
                className="btn-primary flex-1"
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && !useManualEntry && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: 'rgb(var(--color-text-primary))' }}>
                Map Columns to Placeholders
              </h2>
              <p style={{ color: 'rgb(var(--color-text-secondary))' }}>
                Connect your data columns to email placeholders
              </p>
            </div>

            <button onClick={suggestMappings} className="btn-secondary">
              <Sparkles className="w-4 h-4 mr-2" />
              Auto-Suggest Mappings
            </button>

            <div className="space-y-4">
              {placeholders.map((placeholder, index) => (
                <div key={placeholder} className="card-flat animate-slide-up" style={{ animationDelay: `${index * 0.05}s` }}>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'rgb(var(--color-text-primary))' }}>
                    <span className="inline-flex items-center gap-2">
                      <LinkIcon className="w-4 h-4 text-primary-500" />
                      Placeholder: <code className="px-2 py-1 rounded bg-primary-500/20 text-primary-600 dark:text-primary-400 font-mono">{`{{${placeholder}}}`}</code>
                    </span>
                  </label>
                  <select
                    value={campaignData.columnMapping[placeholder] || ''}
                    onChange={(e) => setCampaignData(prev => ({
                      ...prev,
                      columnMapping: { ...prev.columnMapping, [placeholder]: e.target.value }
                    }))}
                    className="select-field"
                  >
                    <option value="">Select column...</option>
                    {campaignData.columns.map(col => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <button onClick={() => setStep(2)} className="btn-ghost">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </button>
              <button onClick={() => setStep(4)} className="btn-primary flex-1">
                Continue to Preview
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && useManualEntry && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2" style={{ color: 'rgb(var(--color-text-primary))' }}>
                  Enter Recipient Data
                </h2>
                <p style={{ color: 'rgb(var(--color-text-secondary))' }}>
                  Manually add recipient information for each placeholder
                </p>
              </div>
              <button onClick={addManualContact} className="btn-primary">
                <Plus className="w-4 h-4 mr-2" />
                Add Recipient
              </button>
            </div>

            {placeholders.length === 0 && (
              <div className="card-flat text-center py-12">
                <Edit3 className="w-16 h-16 mx-auto mb-4 opacity-30" style={{ color: 'rgb(var(--color-text-tertiary))' }} />
                <p className="font-semibold mb-2" style={{ color: 'rgb(var(--color-text-primary))' }}>
                  No placeholders found
                </p>
                <p className="text-sm" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                  Go back and add placeholders like {'{{name}}'} or {'{{email}}'} to your template
                </p>
              </div>
            )}

            {placeholders.length > 0 && manualContacts.length === 0 && (
              <div className="card-flat text-center py-12">
                <Plus className="w-16 h-16 mx-auto mb-4 opacity-30" style={{ color: 'rgb(var(--color-text-tertiary))' }} />
                <p className="font-semibold mb-2" style={{ color: 'rgb(var(--color-text-primary))' }}>
                  No recipients added yet
                </p>
                <p className="text-sm mb-4" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                  Click "Add Recipient" to start entering data
                </p>
                <button onClick={addManualContact} className="btn-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Recipient
                </button>
              </div>
            )}

            <div className="space-y-4 max-h-[500px] overflow-y-auto scrollbar-thin">
              {manualContacts.map((contact, index) => (
                <div key={index} className="card-flat relative hover-lift animate-slide-up" style={{ animationDelay: `${index * 0.05}s` }}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold" style={{ color: 'rgb(var(--color-text-primary))' }}>
                      Recipient #{index + 1}
                    </h3>
                    <button
                      onClick={() => removeManualContact(index)}
                      className="p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold mb-2" style={{ color: 'rgb(var(--color-text-primary))' }}>
                        Email Address *
                      </label>
                      <input
                        type="email"
                        value={contact.email || ''}
                        onChange={(e) => updateManualContact(index, 'email', e.target.value)}
                        placeholder="recipient@example.com"
                        className="input-field"
                      />
                    </div>

                    {placeholders.filter(p => p !== 'unsubscribe_link').map(placeholder => (
                      <div key={placeholder}>
                        <label className="block text-sm font-semibold mb-2" style={{ color: 'rgb(var(--color-text-primary))' }}>
                          {placeholder}
                        </label>
                        <input
                          type="text"
                          value={contact[placeholder] || ''}
                          onChange={(e) => updateManualContact(index, placeholder, e.target.value)}
                          placeholder={`Enter ${placeholder}`}
                          className="input-field"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <button onClick={() => setStep(2)} className="btn-ghost">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </button>
              <button
                onClick={() => setStep(4)}
                disabled={manualContacts.length === 0 || manualContacts.some(c => !c.email)}
                className="btn-primary flex-1"
              >
                Continue to Preview
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: 'rgb(var(--color-text-primary))' }}>
                Preview & Configure
              </h2>
              <p style={{ color: 'rgb(var(--color-text-secondary))' }}>
                Review your campaign settings before launching
              </p>
            </div>

            {/* Campaign Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="stat-card">
                <div className="relative z-10">
                  <p className="text-sm font-semibold mb-1" style={{ color: 'rgb(var(--color-text-tertiary))' }}>
                    Total Recipients
                  </p>
                  <p className="text-4xl font-black" style={{ color: 'rgb(var(--color-text-primary))' }}>
                    {useManualEntry ? manualContacts.length : (campaignData.parsedData?.length || 0)}
                  </p>
                </div>
              </div>

              <div className="stat-card">
                <div className="relative z-10">
                  <p className="text-sm font-semibold mb-1" style={{ color: 'rgb(var(--color-text-tertiary))' }}>
                    Data Source
                  </p>
                  <p className="text-lg font-black" style={{ color: 'rgb(var(--color-text-primary))' }}>
                    {useManualEntry ? 'Manual Entry' : campaignData.file?.name || 'File Upload'}
                  </p>
                </div>
              </div>

              <div className="stat-card">
                <div className="relative z-10">
                  <p className="text-sm font-semibold mb-1" style={{ color: 'rgb(var(--color-text-tertiary))' }}>
                    Placeholders
                  </p>
                  <p className="text-4xl font-black" style={{ color: 'rgb(var(--color-text-primary))' }}>
                    {placeholders.length}
                  </p>
                </div>
              </div>

              <div className="stat-card">
                <div className="relative z-10">
                  <p className="text-sm font-semibold mb-1" style={{ color: 'rgb(var(--color-text-tertiary))' }}>
                    Attachments
                  </p>
                  <p className="text-4xl font-black" style={{ color: 'rgb(var(--color-text-primary))' }}>
                    {attachments.length}
                  </p>
                </div>
              </div>
            </div>

            {/* Attachments Preview */}
            {attachments.length > 0 && (
              <div className="card-flat">
                <h3 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: 'rgb(var(--color-text-primary))' }}>
                  <Paperclip className="w-5 h-5 text-primary-500" />
                  Files to be Attached
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {attachments.map((attachment, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 rounded-lg border"
                      style={{
                        borderColor: 'rgb(var(--color-border))',
                        backgroundColor: 'rgb(var(--color-bg-tertiary))'
                      }}
                    >
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
                        <Paperclip className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate text-sm" style={{ color: 'rgb(var(--color-text-primary))' }}>
                          {attachment.original_name}
                        </p>
                        <p className="text-xs" style={{ color: 'rgb(var(--color-text-tertiary))' }}>
                          {formatFileSize(attachment.size)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Configuration */}
            <div className="card-flat">
              <h3 className="text-lg font-bold mb-4" style={{ color: 'rgb(var(--color-text-primary))' }}>
                Sending Configuration
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'rgb(var(--color-text-primary))' }}>
                    Daily Limit
                  </label>
                  <input
                    type="number"
                    value={campaignData.dailyLimit}
                    onChange={(e) => handleTemplateChange('dailyLimit', parseInt(e.target.value))}
                    className="input-field"
                  />
                  <p className="text-xs mt-1" style={{ color: 'rgb(var(--color-text-tertiary))' }}>
                    Max emails per day
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'rgb(var(--color-text-primary))' }}>
                    Min Delay (seconds)
                  </label>
                  <input
                    type="number"
                    value={campaignData.delayMin}
                    onChange={(e) => handleTemplateChange('delayMin', parseInt(e.target.value))}
                    className="input-field"
                  />
                  <p className="text-xs mt-1" style={{ color: 'rgb(var(--color-text-tertiary))' }}>
                    Minimum wait time
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'rgb(var(--color-text-primary))' }}>
                    Max Delay (seconds)
                  </label>
                  <input
                    type="number"
                    value={campaignData.delayMax}
                    onChange={(e) => handleTemplateChange('delayMax', parseInt(e.target.value))}
                    className="input-field"
                  />
                  <p className="text-xs mt-1" style={{ color: 'rgb(var(--color-text-tertiary))' }}>
                    Maximum wait time
                  </p>
                </div>
              </div>
            </div>

            {/* Schedule */}
            <div className="card-flat">
              <label className="block text-sm font-semibold mb-2" style={{ color: 'rgb(var(--color-text-primary))' }}>
                Schedule Start Time (Optional)
              </label>
              <DatePicker
                selected={scheduledAt}
                onChange={setScheduledAt}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                dateFormat="yyyy-MM-dd HH:mm"
                minDate={new Date()}
                className="input-field w-full"
                placeholderText="Leave blank to start immediately"
                isClearable
              />
              <p className="text-xs mt-2" style={{ color: 'rgb(var(--color-text-tertiary))' }}>
                Campaign will start at the specified time, or immediately if left blank
              </p>
            </div>

            {/* Warning */}
            <div className="px-6 py-4 rounded-xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-2 border-yellow-500/30">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <span className="text-2xl">⚠️</span>
                </div>
                <div>
                  <p className="font-bold text-yellow-600 dark:text-yellow-400 mb-1">
                    Ready to Launch
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    You're about to send <strong>{useManualEntry ? manualContacts.length : (campaignData.parsedData?.length || 0)} emails</strong>.
                    Please review all information carefully. Use responsibly and comply with anti-spam regulations.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={() => setStep(3)} className="btn-ghost">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </button>
              <button
                onClick={createCampaign}
                disabled={creating}
                className="btn-success flex-1 flex items-center justify-center gap-2"
              >
                {creating ? (
                  <>
                    <div className="spinner"></div>
                    Creating Campaign...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Create & Launch Campaign
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default NewCampaign
