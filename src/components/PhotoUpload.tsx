import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PhotoUploadProps {
  onUploaded: (url: string) => void;
  currentUrl?: string;
}

export function PhotoUpload({ onUploaded, currentUrl }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor selecione uma imagem válida");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande (máx 5MB)");
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("hammer-evidence").upload(path, file);
      if (error) throw error;

      const { data: pub } = supabase.storage.from("hammer-evidence").getPublicUrl(path);
      setPreview(pub.publicUrl);
      onUploaded(pub.publicUrl);
      toast.success("Foto enviada com sucesso!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro no upload";
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <input ref={inputRef} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" aria-label="Upload de foto" />
      {preview ? (
        <div className="relative w-full max-w-xs">
          <img src={preview} alt="Evidência" className="w-full rounded-lg border border-white/10" />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6"
            onClick={() => { setPreview(null); onUploaded(""); }}
            aria-label="Remover foto"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <Button type="button" variant="outline" onClick={() => inputRef.current?.click()} disabled={uploading} className="border-primary/20 hover:bg-primary/10 transition-all duration-200">
          {uploading ? <Upload className="mr-2 h-4 w-4 animate-pulse" /> : <Camera className="mr-2 h-4 w-4" />}
          {uploading ? "Enviando..." : "Anexar Foto"}
        </Button>
      )}
    </div>
  );
}
