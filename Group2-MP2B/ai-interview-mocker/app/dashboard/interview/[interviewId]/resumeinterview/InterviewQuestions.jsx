"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Button } from '@/components/ui/button';

function ResumeUploader() {
  const [image, setImage] = useState(null);
  const router = useRouter();

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'image/png') {
      setImage(file);
    } else {
      alert('Please upload a PNG file.');
    }
  };

  const handleUpload = async () => {
    if (!image) {
      alert('Please select an image first.');
      return;
    }

    const formData = new FormData();
    formData.append('resume', image);

    try {
      const response = await axios.post('/api/process-resume', formData);
      const questions = response.data.questions;
      router.push(`/interview-questions?questions=${encodeURIComponent(JSON.stringify(questions))}`);
    } catch (error) {
      console.error('Error processing resume:', error);
    }
  };

  return (
    <div>
      <p>Upload your resume here</p>
      <input type="file" accept="image/png" onChange={handleFileChange} />
      <Button onClick={handleUpload}>Upload</Button>
    </div>
  );
}

export default ResumeUploader;
