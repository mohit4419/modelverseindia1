import React, { useRef, useState } from 'react';
import { Upload, Loader2, CheckCircle2 } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => Promise<void>;
  accept?: string;
  maxSizeMB?: number;
}

export default function FileUpload({ onFileSelect, accept = 'image/*', maxSizeMB = 5 }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const processFile = async (file: File) => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      alert(`File size exceeds maximum limit of ${maxSizeMB}MB.`);
      return;
    }
    setIsUploading(true);
    setSuccess(false);
    try {
      await onFileSelect(file);
      setSuccess(true);
    } catch (e) {
      console.error('File selection processing failed:', e);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0]);
    }
  };

  return (
    <div
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`border-2 border-dashed rounded-3xl p-8 text-center transition cursor-pointer flex flex-col items-center justify-center space-y-3 min-h-48 ${
        isDragActive
          ? 'border-purple-600 bg-purple-500/5'
          : 'border-neutral-250 dark:border-neutral-800 hover:border-purple-500/50'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileInput}
        className="hidden"
      />
      {isUploading ? (
        <>
          <Loader2 className="h-10 w-10 text-purple-650 animate-spin" />
          <p className="text-xs font-black uppercase tracking-widest text-neutral-400">Processing Upload...</p>
        </>
      ) : success ? (
        <>
          <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          <p className="text-xs font-black uppercase tracking-widest text-emerald-500">File Onboarded Successfully!</p>
        </>
      ) : (
        <>
          <Upload className="h-10 w-10 text-neutral-400" />
          <div className="space-y-1">
            <p className="text-xs font-black uppercase tracking-wider text-neutral-700 dark:text-neutral-200">
              Drag & Drop files or click to browse
            </p>
            <p className="text-[10px] text-neutral-400 font-medium">
              Supports JPG, PNG or WEBP up to {maxSizeMB}MB
            </p>
          </div>
        </>
      )}
    </div>
  );
}
