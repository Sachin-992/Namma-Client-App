import { supabase } from "@/services/supabase/client";

// Required Storage Buckets
export const STORAGE_BUCKETS = {
  CLIENT_DOCUMENTS: "client-documents",
  PROJECT_FILES: "project-files",
  CLIENT_ASSETS: "client-assets", // Public bucket
  INVOICES: "invoices",
  REQUIREMENTS: "requirements",
  NOTES_ATTACHMENTS: "notes-attachments",
  MEDIA: "media",
} as const;

export type BucketName = typeof STORAGE_BUCKETS[keyof typeof STORAGE_BUCKETS];

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Helper to validate file type and size limitations before uploading.
 */
export function validateFile(file: File, category: "image" | "document" | "video"): ValidationResult {
  const fileExt = file.name.split(".").pop()?.toLowerCase() || "";
  const fileSize = file.size;

  const rules = {
    image: {
      extensions: ["jpg", "jpeg", "png", "webp"],
      maxSize: 10 * 1024 * 1024, // 10MB
      errorLabel: "Image",
    },
    document: {
      extensions: ["pdf", "docx", "xlsx"],
      maxSize: 20 * 1024 * 1024, // 20MB
      errorLabel: "Document",
    },
    video: {
      extensions: ["mp4", "mov"],
      maxSize: 100 * 1024 * 1024, // 100MB
      errorLabel: "Video",
    },
  };

  const rule = rules[category];
  if (!rule) {
    return { isValid: false, error: "Unsupported file category." };
  }

  if (!rule.extensions.includes(fileExt)) {
    return {
      isValid: false,
      error: `File type not supported. Allowed types: ${rule.extensions.join(", ")}`,
    };
  }

  if (fileSize > rule.maxSize) {
    return {
      isValid: false,
      error: `${rule.errorLabel} exceeds maximum size of ${rule.maxSize / (1024 * 1024)}MB.`,
    };
  }

  return { isValid: true };
}

/**
 * Map raw Supabase errors to professional, localized user-facing messages.
 */
export function mapStorageError(error: any): Error {
  console.error("Supabase Storage Error Details:", error);
  const msg = error?.message || "";

  if (msg.includes("Bucket not found") || msg.includes("bucket_not_found")) {
    return new Error("Upload failed. The requested storage service is currently unavailable.");
  }
  if (msg.includes("Duplicate") || msg.includes("already exists")) {
    return new Error("A file with this name already exists in this folder.");
  }
  if (msg.includes("Unauthorized") || msg.includes("unauthorized") || msg.includes("permission")) {
    return new Error("Access denied. You do not have permission to access these files.");
  }

  return new Error("Upload failed. Please try again later.");
}

/**
 * Assures a storage bucket exists; if not, attempts to auto-create it.
 */
async function ensureBucketExists(bucketName: BucketName, isPublic: boolean = false) {
  try {
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) {
      console.warn("Failed to check buckets list:", listError);
      return;
    }

    const bucketExists = buckets?.some((b) => b.id === bucketName);
    if (!bucketExists) {
      console.log(`Bucket '${bucketName}' is missing. Attempting auto-creation...`);
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: isPublic,
      });
      if (createError) {
        console.error(`Bucket auto-creation failed for '${bucketName}':`, createError);
      } else {
        console.log(`Successfully auto-created storage bucket '${bucketName}'`);
      }
    }
  } catch (err) {
    console.error(`Error verifying bucket state for '${bucketName}':`, err);
  }
}

/**
 * Centralized Supabase Storage Service.
 */
export const storageService = {
  /**
   * Generic file upload with auto-recovery and file validation.
   */
  async uploadFile(
    bucket: BucketName,
    filePath: string,
    file: File,
    category: "image" | "document" | "video" = "document"
  ): Promise<string> {
    // 1. Validate file constraints
    const validation = validateFile(file, category);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    // 2. Pre-upload bucket existence check
    const isPublic = bucket === STORAGE_BUCKETS.CLIENT_ASSETS;
    await ensureBucketExists(bucket, isPublic);

    // 3. Perform upload
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (error) throw error;
      if (!data) throw new Error("Upload response was empty.");
      
      return filePath;
    } catch (err) {
      throw mapStorageError(err);
    }
  },

  /**
   * Specialized upload helpers
   */
  async uploadClientDocument(filePath: string, file: File): Promise<string> {
    return this.uploadFile(STORAGE_BUCKETS.CLIENT_DOCUMENTS, filePath, file, "document");
  },

  async uploadProjectFile(filePath: string, file: File): Promise<string> {
    return this.uploadFile(STORAGE_BUCKETS.PROJECT_FILES, filePath, file, "document");
  },

  async uploadClientAsset(filePath: string, file: File): Promise<string> {
    return this.uploadFile(STORAGE_BUCKETS.CLIENT_ASSETS, filePath, file, "image");
  },

  async uploadInvoice(filePath: string, file: File): Promise<string> {
    return this.uploadFile(STORAGE_BUCKETS.INVOICES, filePath, file, "document");
  },

  async uploadRequirementFile(filePath: string, file: File): Promise<string> {
    return this.uploadFile(STORAGE_BUCKETS.REQUIREMENTS, filePath, file, "document");
  },

  async uploadNotesAttachment(filePath: string, file: File): Promise<string> {
    return this.uploadFile(STORAGE_BUCKETS.NOTES_ATTACHMENTS, filePath, file, "document");
  },

  async uploadMedia(filePath: string, file: File, category: "image" | "video" = "image"): Promise<string> {
    return this.uploadFile(STORAGE_BUCKETS.MEDIA, filePath, file, category);
  },

  /**
   * Retrieve a temporary signed download URL for private files.
   */
  async getSignedUrl(bucket: BucketName, filePath: string, expiresInSeconds: number = 60 * 15): Promise<string> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(filePath, expiresInSeconds);

      if (error) throw error;
      if (!data?.signedUrl) throw new Error("Failed to generate signed download link.");

      return data.signedUrl;
    } catch (err) {
      throw mapStorageError(err);
    }
  },

  /**
   * Retrieve a public access URL for public files.
   */
  getPublicUrl(bucket: BucketName, filePath: string): string {
    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return data.publicUrl;
  },

  /**
   * Remove a file from a bucket.
   */
  async deleteFile(bucket: BucketName, filePath: string): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (error) throw error;
    } catch (err) {
      throw mapStorageError(err);
    }
  },
};
