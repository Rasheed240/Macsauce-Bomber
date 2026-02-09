import axios from 'axios'

export const fetchTemplates = async (userEmail, category) => {
  const params = { user_email: userEmail }
  if (category) params.category = category
  const response = await axios.get('/api/templates', { params })
  return response.data
}

export const deleteTemplate = async (templateId) => {
  return axios.delete(`/api/templates/${templateId}`)
}

export const fetchTemplate = async (templateId) => {
  const response = await axios.get(`/api/templates/${templateId}`)
  return response.data
}

export const createTemplate = async (templateData) => {
  const response = await axios.post('/api/templates', templateData)
  return response.data
}
