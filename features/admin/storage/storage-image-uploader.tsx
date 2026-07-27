"use client";

import { useRef, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export type UploadedCatalogImage = {
  name: string;
  path: string;
  url: string;
};

export function StorageImageUploader({
  folder,
  multiple = false,
  onUploaded,
}: {
  folder: "categories" | "products";
  multiple?: boolean;
  onUploaded: (images: UploadedCatalogImage[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setError("");
    setIsUploading(true);

    try {
      const supabase = createBrowserSupabaseClient();
      const uploaded: UploadedCatalogImage[] = [];

      for (const file of Array.from(files)) {
        const allowedTypes = [
          "image/jpeg",
          "image/png",
          "image/webp",
          "image/avif",
        ];
        if (!allowedTypes.includes(file.type)) {
          throw new Error(`Файл «${file.name}» имеет неподдерживаемый формат.`);
        }
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`Файл «${file.name}» больше 10 МБ.`);
        }

        const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${folder}/${crypto.randomUUID()}/${Date.now()}.${extension}`;
        const { error: uploadError } = await supabase.storage
          .from("catalog-images")
          .upload(path, file, {
            cacheControl: "3600",
            contentType: file.type,
            upsert: false,
          });
        if (uploadError) throw uploadError;

        uploaded.push({
          name: file.name,
          path,
          url: supabase.storage.from("catalog-images").getPublicUrl(path).data
            .publicUrl,
        });
      }

      onUploaded(uploaded);
      if (inputRef.current) inputRef.current.value = "";
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Не удалось загрузить изображение.",
      );
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="grid gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        multiple={multiple}
        disabled={isUploading}
        onChange={(event) => void upload(event.target.files)}
        className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:font-bold file:text-white hover:file:bg-slate-700 disabled:opacity-60"
      />
      <p className="text-xs leading-5 text-slate-500">
        JPG, PNG, WebP или AVIF, до 10 МБ.
        {multiple ? " Можно выбрать несколько файлов." : ""}
      </p>
      {isUploading ? (
        <p role="status" className="text-sm font-semibold text-slate-700">
          Загружаем изображение…
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm font-semibold text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
