import axios from "axios"

const getPythonUrl = () => {
  const url = process.env.PYTHON_API_URL;
  if (!url) throw new Error("PYTHON_API_URL missing");
  return url;
};


// Prep Data
export const prepareCached = async (payload) => {
  const res = await axios.post(`${getPythonUrl()}/prepare-cached`, {
    payload
  })

  return res.data
}

// Render Video
export const renderVideo = async (payload, jobId) => {
  const res = await axios.post(`${getPythonUrl()}/render-video`, {
    payload,
    jobId
  })

  return res.data
}

// Status Check
export const getStatus = async (jobId) => {
  const res = await axios.get(`${getPythonUrl()}/status/${jobId}`)
  return res.data
}

// Get Color for Album
export const getAlbumColor = async (payload) => {
  const res = await axios.post(`${getPythonUrl()}/get-album-color`, {
    payload
  })
  return res.data
}