import axios from "axios"

const PYTHON_URL = process.env.PYTHON_API_URL

// Prep Data
export const prepareCached = async (payload) => {
  const res = await axios.post(`${PYTHON_URL}/prepare-cached`, {
    payload
  })

  return res.data
}

// Render Video
export const renderVideo = async (payload, jobId) => {
  const res = await axios.post(`${PYTHON_URL}/render-video`, {
    payload,
    jobId
  })

  return res.data
}

// Status Check
export const getStatus = async (jobId) => {
  const res = await axios.get(`${PYTHON_URL}/status/${jobId}`)
  return res.data
}