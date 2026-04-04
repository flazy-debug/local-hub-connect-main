import { useRef, useState } from "react";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";

interface ImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

import imageCompression from 'browser-image-compression';

async function compressImage(file: File, maxSizeMB = 0.3): Promise<Blob | File> {
  const options = {
    maxSizeMB: maxSizeMB,
    maxWidthOrHeight: 1200,
    useWebWorker: true,
    fileType: 'image/webp'
  };
  try {
    return await imageCompression(file, options);
  } catch (error) {
    console.error("Compression error:", error);
    return file;
  }
}

export default function ImageUpload({ images, onChange, maxImages = 5 }: ImageUploadProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user) return;

    setUploading(true);
    const newUrls: string[] = [];

    try {
      for (let i = 0; i < Math.min(files.length, maxImages - images.length); i++) {
        const file = files[i];

        // Compress image to max 300KB
        const compressed = await compressImage(file, 0.3);
        const path = `${user.id}/${Date.now()}-${i}.webp`;

        const { error } = await supabase.storage
          .from("product-images")
          .upload(path, compressed, { upsert: true, contentType: "image/webp" });

        if (error) throw error;

        const { data: urlData } = supabase.storage
          .from("product-images")
          .getPublicUrl(path);

        newUrls.push(urlData.publicUrl);
      }
      onChange([...images, ...newUrls]);
    } catch (err: any) {
      toast({ title: "Erreur upload", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-3">
        {images.map((url, i) => (
          <div key={i} className="group relative h-24 w-24 overflow-hidden rounded-2xl bg-slate-50 shadow-soft transition-all hover:shadow-premium">
            <img src={url} alt="" className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" />
            <button
              type="button"
              onClick={() => removeImage(i)}
              className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 backdrop-blur-md text-destructive shadow-lg opacity-0 transition-opacity group-hover:opacity-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}

        {images.length < maxImages && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex h-24 w-24 flex-col items-center justify-center gap-2 rounded-2xl border-none bg-slate-50 text-slate-400 transition-all shadow-inner hover:bg-accent/5 hover:text-accent hover:shadow-soft"
          >
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-accent" />
            ) : (
              <>
                <ImagePlus className="h-6 w-6" />
                <span className="text-[9px] font-black uppercase tracking-widest">Ajouter</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
      <p className="text-xs text-muted-foreground">{images.length}/{maxImages} images • Optimisation WebP auto ≤ 300 Ko</p>
    </div>
  );
}
