"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function UploadContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams?.get("token") ?? null;

  const [context, setContext] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("Missing upload token. Please check your link.");
      setLoading(false);
      return;
    }

    const fetchContext = async () => {
      try {
        const res = await fetch(`/api/upload/${token}`);
        const data = await res.json();
        if (res.ok) {
          setContext(data);
          if (data.alreadyUploaded) {
            setSuccess(true);
          }
        } else {
          setError(data.message || "Invalid link.");
        }
      } catch (err) {
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchContext();
  }, [token]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (!selected.type.startsWith("image/")) {
        alert("Please select an image file (JPG, PNG, WEBP)");
        return;
      }
      setFile(selected);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selected);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !token) return;

    setSubmitting(true);
    const formData = new FormData();
    formData.append("photo", file);

    try {
      const res = await fetch(`/api/upload/${token}`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
      } else {
        alert(data.message || "Upload failed");
      }
    } catch (err) {
      alert("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 font-medium italic">Verifying secure link...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-[2rem] shadow-xl border border-red-50 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-red-500">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
        </div>
        <h1 className="text-2xl font-black text-slate-900 mb-2">Access Denied</h1>
        <p className="text-slate-500 mb-8">{error}</p>
        <button 
          onClick={() => router.push("/")}
          className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-lg shadow-slate-200"
        >
          Return Home
        </button>
      </div>
    );
  }

  if (success && !file) {
    return (
      <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-[2rem] shadow-xl border border-green-50 text-center">
        <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-green-500">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </div>
        <h1 className="text-2xl font-black text-slate-900 mb-2">Thank You!</h1>
        <p className="text-slate-500 mb-8">
          The snapshot of your changes at <strong>{context?.buildingName}</strong> has been successfully recorded.
        </p>
        <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">
           Compliance Confirmed
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <div className="mb-10 text-center">
        <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-blue-50 rounded-full">
          <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
          <span className="text-[10px] font-black text-blue-700 uppercase tracking-widest">System Confirmation</span>
        </div>
        <h1 className="text-4xl font-black text-slate-900 mb-2 italic tracking-tighter">Action Required</h1>
        <p className="text-slate-500 font-medium">Please upload a photo of your thermostat to confirm the requested adjustment.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl shadow-blue-100/50 border border-slate-50 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-32 h-32">
                <path d="M12 9a3.75 3.75 0 1 0 0 7.5A3.75 3.75 0 0 0 12 9Z" />
                <path fillRule="evenodd" d="M9.344 3.071a49.52 49.52 0 0 1 5.312 0c.967.052 1.83.585 2.332 1.39l.821 1.317c.24.383.645.627 1.11.651 1.173.06 2.358.26 3.505.592a2.25 2.25 0 0 1 1.575 2.13v10.037a2.25 2.25 0 0 1-2.25 2.25H2.25a2.25 2.25 0 0 1-2.25-2.25V9.153a2.25 2.25 0 0 1 1.575-2.129 49.108 49.108 0 0 1 3.505-.592c.465-.024.87-.268 1.11-.651l.821-1.317a2.25 2.25 0 0 1 2.332-1.39ZM12 18.75a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z" clipRule="evenodd" />
              </svg>
          </div>

          <div className="relative z-10">
            <div className="mb-6">
               <h3 className="text-lg font-bold text-slate-900">{context?.buildingName}</h3>
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{context?.alertType} ALERT RESPONSE</p>
            </div>

            <div 
              className={`aspect-[4/3] rounded-[2rem] border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center p-4 text-center
                ${preview ? 'border-blue-200 bg-blue-50/30' : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300'}
              `}
              onClick={() => document.getElementById('photo-input')?.click()}
            >
              {preview ? (
                <img src={preview} alt="Preview" className="w-full h-full object-cover rounded-2xl shadow-lg" />
              ) : (
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg mx-auto text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Tap to take photo</p>
                    <p className="text-xs text-slate-500">or select from camera roll</p>
                  </div>
                </div>
              )}
            </div>
            
            <input 
              id="photo-input"
              type="file" 
              accept="image/*" 
              capture="environment"
              className="hidden" 
              onChange={handleFileChange}
            />
          </div>
        </div>

        {context?.expired && (
          <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl flex gap-3">
             <div className="text-orange-500">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
                </svg>
             </div>
             <p className="text-xs text-orange-700 font-medium">
                Note: The 2-hour window has passed. Photo will be flagged as late compliance.
             </p>
          </div>
        )}

        <button
          type="submit"
          disabled={!file || submitting}
          className={`w-full py-5 rounded-[2rem] font-black text-lg transition-all shadow-xl
            ${!file || submitting 
              ? 'bg-slate-100 text-slate-400 border border-slate-200' 
              : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-blue-200'
            }
          `}
        >
          {submitting ? 'Uploading...' : 'Submit Snapshot'}
        </button>
      </form>
    </div>
  );
}

export default function UploadPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen italic text-slate-500">Loading Portal...</div>}>
      <UploadContent />
    </Suspense>
  );
}
