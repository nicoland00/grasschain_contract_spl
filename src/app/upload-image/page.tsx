"use client";

import React, { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";

export default function UploadImagePage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [blobResult, setBlobResult] = useState<any>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!inputRef.current?.files || inputRef.current.files.length === 0) {
      alert("No file selected");
      return;
    }

    const file = inputRef.current.files[0];

    try {
      // 1) The "upload" function calls /api/upload to get a secure token
      // 2) Then uploads file from browser → Vercel Blob
      // 3) Returns { url, ... }
      const result = await upload(file.name, file, {
        access: "public",            // or "private"
        handleUploadUrl: "/api/upload",  // We'll define below
      });

      setBlobResult(result);
    } catch (err) {
      console.error(err);
      alert("Upload failed. See console for details.");
    }
  }

  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      <h1 className="text-xl font-bold">Upload an Image</h1>
      <form onSubmit={handleSubmit} className="space-y-2">
        <input type="file" ref={inputRef} accept="image/*" required />
        <button type="submit" className="btn btn-primary">Upload</button>
      </form>

      {blobResult && (
        <div className="mt-4">
          <p>Upload successful!</p>
          <p>URL:{" "}
            <a href={blobResult.url} target="_blank" rel="noreferrer">
              {blobResult.url}
            </a>
          </p>
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
