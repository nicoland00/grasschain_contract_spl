'use client';

import React, { useRef, useState } from 'react';
import { upload } from '@vercel/blob/client';

export default function UploadImagePage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [blobResult, setBlobResult] = useState<any>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!inputRef.current?.files || inputRef.current.files.length === 0) {
      alert('No file selected');
      return;
    }

    const file = inputRef.current.files[0];

    // The "upload" function from '@vercel/blob/client' will:
    // 1) POST to /api/upload to get a token
    // 2) Upload the file directly from the browser to Vercel Blob
    // 3) Return the final Blob info with .url
    try {
      const result = await upload(file.name, file, {
        access: 'public',            // or "private"
        handleUploadUrl: '/api/upload',  // Our route from step 4
        // optionally pass some data to onBeforeGenerateToken
        // clientPayload: { userId: 'someUserId' },
      });
      setBlobResult(result);
    } catch (err) {
      console.error(err);
      alert('Upload failed. See console for details.');
    }
  }

  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      <h1 className="text-xl font-bold">Upload an Image (Client Upload)</h1>
      <form onSubmit={handleSubmit} className="space-y-2">
        <input type="file" ref={inputRef} accept="image/*" required />
        <button type="submit" className="btn btn-primary">Upload</button>
      </form>

      {blobResult && (
        <div className="mt-4">
          <p>Upload successful!</p>
          <p>URL: <a href={blobResult.url} target="_blank" rel="noreferrer">{blobResult.url}</a></p>
          {/* If you want to display it: */}
          <img
            src={blobResult.url}
            alt="Uploaded"
            className="border rounded w-32 h-32 object-cover mt-2"
          />
        </div>
      )}
    </div>
  );
}
