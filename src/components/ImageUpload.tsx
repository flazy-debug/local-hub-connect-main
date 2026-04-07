import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ImagePlus, X, Loader2, AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import imageCompression from 'browser-image-compression';
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  onUploadingChange?: (uploading: boolean) => void;
  maxImages?: number;
}

interface UploadTask {
  id: string;
  file: File;
  previewUrl: string;
  progress: number;
  status: "pending" | "compressing" | "uploading" | "success" | "error";
  error?: string;
  retryCount: number;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

async function compressImage(file: File): Promise<Blob | File> {
  const options = {
    maxSizeMB: 0.5, // 500Ko compromise requested by user
    maxWidthOrHeight: 1600,
    useWebWorker: true,
    fileType: 'image/webp' as const
  };
  try {
    return await imageCompression(file, options);
  } catch (error) {
    console.error("Compression error:", error);
    return file;
  }
}

export default function ImageUpload({ images, onChange, onUploadingChange, maxImages = 5 }: ImageUploadProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [tasks, setTasks] = useState<UploadTask[]>([]);

  // Cleanup Preview URLs
  useEffect(() => {
    return () => {
      tasks.forEach(t => URL.revokeObjectURL(t.previewUrl));
    };
  }, [tasks]);

  useEffect(() => {
    if (onUploadingChange) {
      const isUploading = tasks.some(t => t.status !== 'error' && t.status !== 'success');
      onUploadingChange(isUploading);
    }
  }, [tasks, onUploadingChange]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !user) return;

    const remainingSlots = maxImages - images.length - tasks.filter(t => t.status !== 'error').length;
    const filesToUpload = files.slice(0, remainingSlots);

    if (files.length > remainingSlots) {
      toast({ 
        title: "Limite atteinte", 
        description: `Vous ne pouvez ajouter que ${maxImages} images au total.`,
        variant: "destructive" 
      });
    }

    const newTasks: UploadTask[] = filesToUpload.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      previewUrl: URL.createObjectURL(file),
      progress: 0,
      status: "pending",
      retryCount: 0
    }));

    setTasks(prev => [...prev, ...newTasks]);
    
    // Start processing tasks
    newTasks.forEach(task => processTask(task));

    if (fileRef.current) fileRef.current.value = "";
  };

  const processTask = async (task: UploadTask) => {
    // 1. Validation
    if (task.file.size > MAX_FILE_SIZE) {
      updateTask(task.id, { status: "error", error: "L'image est trop lourde (Max 5 Mo)." });
      return;
    }
    if (!ALLOWED_TYPES.includes(task.file.type)) {
      updateTask(task.id, { status: "error", error: "Format non supporté (JPG, PNG, WebP uniquement)." });
      return;
    }

    try {
      // 2. Compression
      updateTask(task.id, { status: "compressing" });
      const compressed = await compressImage(task.file);
      
      // 3. Upload with Internal Retry
      await uploadFile(task.id, compressed);
    } catch (err: any) {
      handleUploadError(task.id, err);
    }
  };

  const uploadFile = async (taskId: string, blob: Blob | File) => {
    if (!user) return;
    updateTask(taskId, { status: "uploading", progress: 10 });

    const fileExt = "webp";
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substr(2, 5)}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from("product-images")
      .upload(fileName, blob, { 
        upsert: true, 
        contentType: "image/webp"
      });

    if (error) {
      // Logic for retry moved to handleUploadError to keep this clean
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("product-images")
      .getPublicUrl(fileName);

    updateTask(taskId, { status: "success", progress: 100 });
    
    // Add to main images list and remove from tasks
    setTimeout(() => {
      onChange([...images, publicUrl]);
      setTasks(prev => prev.filter(t => t.id !== taskId));
    }, 500);
  };

  const handleUploadError = (taskId: string, error: any) => {
    const currentTask = tasks.find(t => t.id === taskId);
    if (currentTask && currentTask.retryCount < 2) {
      updateTask(taskId, { 
        retryCount: currentTask.retryCount + 1, 
        status: "uploading",
        error: "Reconnexion..." 
      });
      // Small delay before retry
      setTimeout(() => {
        const t = tasks.find(x => x.id === taskId);
        if (t) processTask(t);
      }, 2000);
      return;
    }

    let userMessage = "Une erreur est survenue.";
    if (error.message?.includes("network") || !navigator.onLine) {
      userMessage = "Erreur de connexion : Vérifiez votre internet.";
    } else if (error.message?.includes("storage") || error.status === 413) {
      userMessage = "Stockage plein : Contactez le support Epuremarket.";
    } else if (error.message?.includes("corrupt")) {
      userMessage = "Fichier corrompu : Essayez une autre photo.";
    }

    updateTask(taskId, { status: "error", error: userMessage });
  };

  const updateTask = (id: string, updates: Partial<UploadTask>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  const cancelTask = (id: string) => {
    setTasks(prev => {
      const task = prev.find(t => t.id === id);
      if (task) URL.revokeObjectURL(task.previewUrl);
      return prev.filter(t => t.id !== id);
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        {/* Finalized Images */}
        {images.map((url, i) => (
          <div key={url} className="group relative h-32 w-32 overflow-hidden rounded-[2rem] bg-slate-50 shadow-premium transition-all hover:scale-105">
            <img src={url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => removeImage(i)}
              className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur-md text-destructive shadow-lg opacity-0 transition-opacity group-hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
               <div className="bg-white/90 backdrop-blur-md px-2 py-1 rounded-full flex items-center gap-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                 <CheckCircle2 className="h-3 w-3 text-secondary" />
                 <span className="text-[8px] font-black uppercase text-slate-600">OK</span>
               </div>
            </div>
          </div>
        ))}

        {/* Ongoing Tasks (Uploading) */}
        {tasks.map((task) => (
          <div key={task.id} className="relative h-32 w-32 overflow-hidden rounded-[2rem] bg-slate-100 shadow-inner group">
            <img src={task.previewUrl} alt="" className="h-full w-full object-cover opacity-50 grayscale" />
            
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
              {task.status === "error" ? (
                <>
                  <AlertCircle className="h-6 w-6 text-destructive mb-1" />
                  <p className="text-[8px] font-bold text-destructive leading-tight px-1">{task.error}</p>
                  <button 
                    onClick={() => processTask(task)}
                    className="mt-2 bg-destructive/10 text-destructive p-2 rounded-full hover:bg-destructive/20"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </button>
                </>
              ) : (
                <>
                  <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">
                    {task.status === "compressing" ? "Optimisation..." : "Envoi..."}
                  </p>
                  <div className="mt-2 w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-primary"
                      initial={{ width: 0 }}
                      animate={{ width: `${task.progress}%` }}
                    />
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => cancelTask(task.id)}
              className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur-md text-slate-400 shadow-lg"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}

        {/* Add Button */}
        {images.length + tasks.length < maxImages && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex h-32 w-32 flex-col items-center justify-center gap-3 rounded-[2rem] border-2 border-dashed border-slate-200 bg-white text-slate-400 transition-all hover:bg-primary/5 hover:border-primary/30 hover:text-primary active:scale-95 group"
          >
            <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
              <ImagePlus className="h-6 w-6" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Ajouter</span>
          </button>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
      
      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400 px-2">
        <p>{images.length}/{maxImages} Images</p>
        <p>MAX 5 MO • WEBP 500 KO AUTO</p>
      </div>
    </div>
  );
}
