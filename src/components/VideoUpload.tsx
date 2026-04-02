import { useRef, useState } from "react";
import { Video, X, Loader2, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Button } from "./ui/button";

interface VideoUploadProps {
  videoUrl: string | null;
  onChange: (url: string | null) => void;
  disabled?: boolean;
}

export default function VideoUpload({ videoUrl, onChange, disabled = false }: VideoUploadProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Check size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Vidéo trop lourde",
        description: "La taille maximale autorisée est de 10 Mo.",
        variant: "destructive"
      });
      return;
    }

    // Check duration (optional, browser-side is tricky without loading metadata)
    
    setUploading(true);
    try {
      const path = `${user.id}/videos/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage
        .from("product-images") // Reusing the same bucket for simplicity OR use a dedicated "product-videos"
        .upload(path, file, { upsert: true, contentType: file.type });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(path);

      onChange(urlData.publicUrl);
      toast({ title: "Vidéo ajoutée ✅" });
    } catch (err: any) {
      toast({ title: "Erreur upload", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const removeVideo = () => {
    onChange(null);
  };

  return (
    <div className="space-y-2">
      {videoUrl ? (
        <div className="group relative w-full aspect-video max-w-xs overflow-hidden rounded-xl border bg-black/5">
          <video 
            src={videoUrl} 
            className="h-full w-full object-cover"
            autoPlay 
            muted 
            loop 
            playsInline
          />
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
             <Play className="text-white h-8 w-8 fill-white/20" />
          </div>
          <button
            type="button"
            onClick={removeVideo}
            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-destructive text-white shadow-lg transition-transform hover:scale-110"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={() => fileRef.current?.click()}
          disabled={uploading || disabled}
          className={`w-full max-w-xs h-24 flex-col gap-2 border-dashed border-2 ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-accent hover:bg-accent/5'}`}
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-accent" />
          ) : (
            <>
              <div className="p-2 rounded-full bg-accent/10">
                <Video className="h-6 w-6 text-accent" />
              </div>
              <div className="text-center">
                 <p className="text-xs font-bold">Ajouter une vidéo</p>
                 <p className="text-[10px] text-muted-foreground">30s max • MP4 • 10 Mo max</p>
              </div>
            </>
          )}
        </Button>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="video/mp4,video/x-m4v,video/*"
        className="hidden"
        onChange={handleFileChange}
      />
      {disabled && <p className="text-[10px] text-accent font-medium italic">⚡ Disponible uniquement pour les comptes PRO et PARTENAIRES.</p>}
    </div>
  );
}
