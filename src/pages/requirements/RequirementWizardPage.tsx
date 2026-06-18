import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Check, ChevronLeft, ChevronRight, Upload, X, Save } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/utils";
import { useAuth } from "@/hooks/useAuth";
import {
  useClientInfo,
  useRequirementDraft,
  useSaveRequirementDraft,
  useSubmitRequirement
} from "@/hooks/useRequirements";
import { supabase } from "@/services/supabase/client";
import { storageService } from "@/services/storageService";

const STEPS = [
  { id: 1, key: "requirements.wizard.step1", desc: "requirements.wizard.step1Desc" },
  { id: 2, key: "requirements.wizard.step2", desc: "requirements.wizard.step2Desc" },
  { id: 3, key: "requirements.wizard.step3", desc: "requirements.wizard.step3Desc" },
  { id: 4, key: "requirements.wizard.step4", desc: "requirements.wizard.step4Desc" },
  { id: 5, key: "requirements.wizard.step5", desc: "requirements.wizard.step5Desc" },
  { id: 6, key: "requirements.wizard.step6", desc: "requirements.wizard.step6Desc" },
  { id: 7, key: "requirements.wizard.step7", desc: "requirements.wizard.step7Desc" },
];

const PROJECT_TYPES = [
  { key: "website", label: "🌐 Website" },
  { key: "mobileApp", label: "📱 Mobile App" },
  { key: "webApp", label: "💻 Web Application" },
  { key: "ecommerce", label: "🛒 E-Commerce" },
  { key: "branding", label: "🎨 Branding & Design" },
  { key: "digitalMarketing", label: "📈 Digital Marketing" },
  { key: "erp", label: "🏭 ERP / CRM System" },
  { key: "other", label: "✨ Other" },
];

interface FormData {
  projectType: string;
  businessName: string;
  businessDescription: string;
  industry: string;
  goals: string[];
  references: string[];
  additionalNotes: string;
  uploadedFilePaths: string[]; // Store file paths uploaded to Supabase storage
}

const INITIAL: FormData = {
  projectType: "",
  businessName: "",
  businessDescription: "",
  industry: "",
  goals: [""],
  references: [""],
  additionalNotes: "",
  uploadedFilePaths: [],
};

export default function RequirementWizardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, profile } = useAuth();
  
  const queryClientId = searchParams.get("client_id") || undefined;
  
  const { data: clientInfo } = useClientInfo(queryClientId);
  const { data: activeDraft, isLoading: loadingDraft } = useRequirementDraft(queryClientId);
  const saveDraft = useSaveRequirementDraft(queryClientId);
  const submitRequirement = useSubmitRequirement(queryClientId);

  const [step, setStep] = useState(1);
  const [data, setData] = useState<FormData>(INITIAL);
  const [draftId, setDraftId] = useState<string | undefined>(undefined);
  const [draftSaving, setDraftSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);

  // Load existing draft if present
  useEffect(() => {
    if (activeDraft) {
      setDraftId(activeDraft.id);
      if (activeDraft.step_data) {
        const sd = activeDraft.step_data as any;
        setData({
          projectType: sd.projectType || "",
          businessName: sd.businessName || "",
          businessDescription: sd.businessDescription || "",
          industry: sd.industry || "",
          goals: sd.goals || [""],
          references: sd.references || [""],
          additionalNotes: sd.additionalNotes || "",
          uploadedFilePaths: sd.uploadedFilePaths || [],
        });
      }
    }
  }, [activeDraft]);

  // Save draft to Supabase function
  const handleSaveDraft = async () => {
    if (!clientInfo) return;
    setDraftSaving(true);
    try {
      const res = await saveDraft.mutateAsync({
        id: draftId,
        stepData: data as any,
      });
      if (res) {
        setDraftId(res.id);
      }
    } catch (err: any) {
      console.error("Failed to auto-save draft:", err);
    } finally {
      setDraftSaving(false);
    }
  };

  // Auto-save draft every 30 seconds if clientInfo is loaded
  useEffect(() => {
    if (!clientInfo) return;
    const timer = setInterval(() => {
      handleSaveDraft();
    }, 30000);
    return () => clearInterval(timer);
  }, [data, clientInfo, draftId]);

  // Step validation
  const canGoNext = () => {
    if (step === 1) return !!data.projectType;
    if (step === 2) return !!data.businessName && !!data.businessDescription;
    if (step === 3) return data.goals.some(g => g.trim().length > 0);
    return true;
  };

  const handleNext = () => {
    if (step < STEPS.length) {
      // Save draft whenever user moves between steps
      handleSaveDraft();
      setStep(step + 1);
    }
  };
  
  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  // Upload files to Supabase Storage and register them in documents table
  const handleFileUpload = async (files: File[]) => {
    if (!clientInfo || !user) {
      toast.error("User or client info not loaded yet.");
      return;
    }
    setUploadingFiles(true);
    const uploadedPaths: string[] = [...data.uploadedFilePaths];

    try {
      for (const file of files) {
        const timestamp = Date.now();
        const cleanName = file.name.replace(/[^a-zA-Z0-9.]/g, "_");
        const filePath = `requirements/${clientInfo.id}/${timestamp}_${cleanName}`;

        // 1. Upload to Supabase 'requirements' storage bucket using storageService
        await storageService.uploadRequirementFile(filePath, file);

        // 2. Insert record in 'documents' database table
        const fileExtension = file.name.split(".").pop()?.toLowerCase() || "png";
        const validExtensions = ["pdf", "jpg", "png", "docx"];
        const fileType = validExtensions.includes(fileExtension) ? fileExtension : "png";

        const { error: dbErr } = await (supabase.from("documents") as any).insert({
          org_id: clientInfo.org_id,
          client_id: clientInfo.id,
          name: file.name,
          file_path: filePath,
          file_type: fileType,
          file_size: file.size,
          uploaded_by: user.id,
        });

        if (dbErr) {
          console.error("Error inserting document record:", dbErr);
        }

        uploadedPaths.push(file.name);
      }

      setData(d => ({ ...d, uploadedFilePaths: uploadedPaths }));
      setFilesToUpload([]);
      toast.success("Files uploaded successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload files");
      console.error(err);
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleSubmit = async () => {
    if (!clientInfo) return;
    setSubmitting(true);
    try {
      await submitRequirement.mutateAsync({
        id: draftId,
        stepData: data as any,
      });
      toast.success("Requirements submitted successfully!");
      if (profile?.role === "admin" || profile?.role === "team_member") {
        navigate("/requirements");
      } else {
        navigate("/welcome");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to submit requirements");
    } finally {
      setSubmitting(false);
    }
  };

  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

  if (loadingDraft) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("requirements.wizard.title")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Step {step} of {STEPS.length}
          </p>
        </div>
        {draftSaving && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Save size={12} className="animate-pulse" />
            Saving draft...
          </div>
        )}
      </div>

      {/* Step progress bar */}
      <div className="mb-8">
        <div className="flex gap-2 mb-3">
          {STEPS.map((s) => (
            <button
              key={s.id}
              onClick={() => s.id < step && setStep(s.id)}
              className={cn(
                "flex-1 h-1.5 rounded-full transition-all",
                s.id < step ? "bg-primary" : s.id === step ? "bg-primary/60" : "bg-border"
              )}
            />
          ))}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-primary">
            {t(STEPS[step - 1].key)}
          </span>
          <span className="text-xs text-muted-foreground">{Math.round(progress)}% complete</span>
        </div>
      </div>

      {/* Step content card */}
      <div className="bg-card border border-border rounded-2xl shadow-card p-6 mb-5 animate-fade-in">
        <h2 className="text-lg font-bold text-foreground mb-1">{t(STEPS[step - 1].key)}</h2>
        <p className="text-sm text-muted-foreground mb-6">{t(STEPS[step - 1].desc)}</p>

        {/* Step 1: Project Type */}
        {step === 1 && (
          <div className="grid grid-cols-2 gap-3">
            {PROJECT_TYPES.map((type) => (
              <button
                key={type.key}
                onClick={() => setData({ ...data, projectType: type.key })}
                className={cn(
                  "p-4 rounded-xl border-2 text-left text-sm font-medium transition-all cursor-pointer",
                  data.projectType === type.key
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border hover:border-primary/40 hover:bg-accent"
                )}
              >
                {type.label}
              </button>
            ))}
          </div>
        )}

        {/* Step 2: Business Details */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Business / Brand Name *</label>
              <input
                type="text"
                value={data.businessName}
                onChange={e => setData({ ...data, businessName: e.target.value })}
                className="form-input"
                placeholder="e.g. Vortex Media Group"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Industry</label>
              <input
                type="text"
                value={data.industry}
                onChange={e => setData({ ...data, industry: e.target.value })}
                className="form-input"
                placeholder="e.g. E-Commerce, Healthcare, Education"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Tell us about your business *</label>
              <textarea
                rows={4}
                value={data.businessDescription}
                onChange={e => setData({ ...data, businessDescription: e.target.value })}
                className="form-input resize-none"
                placeholder="Describe your business, what you do, who your customers are..."
              />
            </div>
          </div>
        )}

        {/* Step 3: Goals */}
        {step === 3 && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">Add one goal per line.</p>
            {data.goals.map((goal, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  type="text"
                  value={goal}
                  onChange={e => {
                    const goals = [...data.goals];
                    goals[idx] = e.target.value;
                    setData({ ...data, goals });
                  }}
                  className="form-input flex-1"
                  placeholder={`Goal ${idx + 1}...`}
                />
                {data.goals.length > 1 && (
                  <button
                    onClick={() => setData({ ...data, goals: data.goals.filter((_, i) => i !== idx) })}
                    className="w-9 h-9 flex items-center justify-center rounded-xl border border-border text-muted-foreground hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => setData({ ...data, goals: [...data.goals, ""] })}
              className="text-sm text-primary font-medium hover:underline cursor-pointer"
            >
              + Add another goal
            </button>
          </div>
        )}

        {/* Step 4: References */}
        {step === 4 && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">Share URLs of websites or apps you admire.</p>
            {data.references.map((ref, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  type="url"
                  value={ref}
                  onChange={e => {
                    const refs = [...data.references];
                    refs[idx] = e.target.value;
                    setData({ ...data, references: refs });
                  }}
                  className="form-input flex-1"
                  placeholder="https://example.com"
                />
                {data.references.length > 1 && (
                  <button
                    onClick={() => setData({ ...data, references: data.references.filter((_, i) => i !== idx) })}
                    className="w-9 h-9 flex items-center justify-center rounded-xl border border-border text-muted-foreground hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => setData({ ...data, references: [...data.references, ""] })}
              className="text-sm text-primary font-medium hover:underline cursor-pointer"
            >
              + Add reference
            </button>
          </div>
        )}

        {/* Step 5: File Upload */}
        {step === 5 && (
          <div>
            <div
              className="border-2 border-dashed border-border rounded-2xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault();
                const files = Array.from(e.dataTransfer.files);
                setFilesToUpload(prev => [...prev, ...files]);
              }}
            >
              <Upload size={32} className="mx-auto text-muted-foreground mb-3" />
              <p className="text-sm font-medium text-foreground">{t("documents.dragDrop")}</p>
              <p className="text-xs text-muted-foreground mt-1">{t("documents.allowedTypes")}</p>
              <p className="text-xs text-muted-foreground">{t("documents.maxSize")}</p>
              <label className="mt-4 inline-block">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.docx"
                  className="sr-only"
                  onChange={e => {
                    const files = Array.from(e.target.files ?? []);
                    setFilesToUpload(prev => [...prev, ...files]);
                  }}
                />
                <span className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl cursor-pointer hover:bg-primary/90 transition-colors">
                  Browse Files
                </span>
              </label>
            </div>

            {/* Selected files stage */}
            {filesToUpload.length > 0 && (
              <div className="mt-4 p-3 bg-accent/40 rounded-xl">
                <h4 className="text-xs font-bold text-foreground mb-2">Files Selected for Upload:</h4>
                <div className="space-y-2">
                  {filesToUpload.map((f, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="truncate max-w-[80%]">{f.name}</span>
                      <button
                        type="button"
                        onClick={() => setFilesToUpload(prev => prev.filter((_, i) => i !== idx))}
                        className="text-red-500 hover:underline cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  disabled={uploadingFiles}
                  onClick={() => handleFileUpload(filesToUpload)}
                  className="w-full mt-3 py-2 bg-primary text-white text-xs font-bold rounded-xl disabled:opacity-50"
                >
                  {uploadingFiles ? "Uploading..." : "Upload Selected Files"}
                </button>
              </div>
            )}

            {/* Uploaded paths lists */}
            {data.uploadedFilePaths.length > 0 && (
              <div className="mt-6">
                <h4 className="text-xs font-bold text-foreground mb-2">Successfully Uploaded Documents:</h4>
                <div className="space-y-2">
                  {data.uploadedFilePaths.map((path, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                      <span className="text-xs font-medium text-emerald-800 truncate">{path}</span>
                      <span className="text-[10px] text-emerald-600 font-bold uppercase">Ready</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 6: Review */}
        {step === 6 && (
          <div className="space-y-4">
            <ReviewItem label="Project Type" value={data.projectType} />
            <ReviewItem label="Business Name" value={data.businessName} />
            <ReviewItem label="Industry" value={data.industry} />
            <ReviewItem label="Business Description" value={data.businessDescription} />
            <ReviewItem label="Goals" value={data.goals.filter(Boolean).join(", ")} />
            <ReviewItem label="References" value={data.references.filter(Boolean).join(", ")} />
            <ReviewItem label="Uploaded Documents" value={data.uploadedFilePaths.join(", ") || "None"} />
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Additional Notes</label>
              <textarea
                rows={3}
                value={data.additionalNotes}
                onChange={e => setData({ ...data, additionalNotes: e.target.value })}
                className="form-input resize-none"
                placeholder="Any additional information..."
              />
            </div>
          </div>
        )}

        {/* Step 7: Submit */}
        {step === 7 && (
          <div className="text-center py-6">
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5">
              <Check size={36} className="text-emerald-600" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">Ready to submit!</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your requirements will be sent to the team. We'll review them and get back to you within 24 hours.
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={step === 1 ? () => {
            if (profile?.role === "client") {
              navigate("/welcome");
            } else {
              navigate("/requirements");
            }
          } : handlePrev}
          className="flex items-center gap-2 px-4 py-2.5 border border-border text-foreground text-sm font-medium rounded-xl hover:bg-accent transition-colors cursor-pointer"
        >
          <ChevronLeft size={16} />
          {step === 1 ? "Cancel" : t("common.back")}
        </button>

        {step < STEPS.length ? (
          <button
            onClick={handleNext}
            disabled={!canGoNext()}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 cursor-pointer"
          >
            {t("common.next")}
            <ChevronRight size={16} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-all disabled:opacity-60 cursor-pointer"
          >
            <Check size={16} />
            {submitting ? "Submitting..." : t("common.submit")}
          </button>
        )}
      </div>
    </div>
  );
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex gap-3 p-3 bg-accent rounded-xl">
      <span className="text-xs font-semibold text-muted-foreground w-28 flex-shrink-0">{label}</span>
      <span className="text-xs text-foreground">{value}</span>
    </div>
  );
}
