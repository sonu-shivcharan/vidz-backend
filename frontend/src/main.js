
import './style.css'
import axios from "axios"
const form = document.querySelector('form');
const file = document.querySelector('#video');


form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const videoData = {
    title: "test",
    description: "test",
    video: file.files[0],
  }

  const formData = new FormData();
  formData.append('videoFile', videoData.video);
  formData.append('description', videoData.description);
  try {
    const signature = await generateCloudinaryApiSign();
    if (!signature) {
      throw new Error('Failed to get API signature');
    }

    // const url = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;
    const videoUploadData = await uploadVideoToCloudinary(videoData.video, signature);
    console.log("videoUploadData", videoUploadData);
    
  } catch (error) {
    console.error('Error uploading video:', error);
  }
  
})

async function uploadVideoToCloudinary(videoFile, {apiKey, cloudName, signature, folder, timestamp}) {
  console.log("Uploading video to Cloudinary...", {apiKey, cloudName, signature, folder, timestamp});
  
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;
  const formData = new FormData();
  formData.append('file', videoFile);
  formData.append('api_key', apiKey);
  formData.append('signature', signature);
  formData.append('timestamp', timestamp);
  formData.append('folder', folder);
  console.log("formData", formData.getAll('file'));
  
  const response = await axios.post(url, formData, {
    onUploadProgress: (progressEvent) => {
      const { loaded, total } = progressEvent;
      const percentCompleted = Math.round((loaded * 100) / total);
      console.log(`File upload progress: ${percentCompleted}%`);
    },
  });
  console.log("response", response);
  if (response.status!==200) {
    throw new Error('Failed to upload video');
  }
  return await response.data
}


async function generateCloudinaryApiSign (){

  const resp = await fetch('http://localhost:8000/api/v1/videos/signature', {
    method: 'GET',
  })

  if (!resp.ok) {
    throw new Error('Failed to get API signature');
  }
  const data = await resp.json();
  return data.data;
}

// const resp = await fetch('http://localhost:8000/api/v1/videos', {
//   method: 'POST',
//   headers: {
//     'Authorization': `Bearer ${localStorage.getItem('token')}`,
//   },
//   body: formData,
// })
// console.log(resp);
// const data = await resp.text();  
// console.log(data);

