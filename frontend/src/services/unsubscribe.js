import axios from 'axios'

export const unsubscribeContact = async (contactId) => {
  return axios.post(`/api/unsubscribe/${contactId}`)
}
