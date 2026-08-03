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

// Calculate Statistics
export const calculateStatistics = async (payload) => {
  const res = await axios.post(`${getPythonUrl()}/calculate-statistics`, {
    payload
  })

  return res.data
}

// Get Color for Album
export const getAlbumColor = async (payload) => {
  console.log("New Batch");

  const res = await axios.post(`${getPythonUrl()}/get-album-color`, {
    payload
  })
  return res.data
}

