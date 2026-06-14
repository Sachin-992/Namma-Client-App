import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { Mail, Phone, CheckCircle2, ArrowRight, Shield, Languages } from "lucide-react";
import logoWide from "@/assets/logo-wide.png";
import { useRequirements, useClientInfo } from "@/hooks/useRequirements";
import { useProjects } from "@/hooks/useProjects";

export default function WelcomeCenterPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { profile } = useAuth();
  
  const { data: clientInfo } = useClientInfo();
  const { data: requirements } = useRequirements();
  const { data: projects } = useProjects();

  const toggleLanguage = () => i18n.changeLanguage(i18n.language === "en" ? "ta" : "en");

  // Determine steps status dynamically
  const isAccountActive = true; // User is logged in to view this
  
  const isRequirementDone = requirements 
    ? requirements.some(r => r.status === "submitted" || r.status === "reviewed")
    : false;

  const isTimelineDone = projects && clientInfo
    ? projects.some(p => p.client_id === clientInfo.id && p.milestones && p.milestones.length > 0)
    : false;

  const steps = [
    { key: "steps.accountActivation", done: isAccountActive, active: false },
    { 
      key: "steps.requirementCollection", 
      done: isRequirementDone, 
      active: !isRequirementDone 
    },
    { 
      key: "steps.projectTimeline", 
      done: isTimelineDone, 
      active: isRequirementDone && !isTimelineDone 
    },
  ];

  const currentStep = isTimelineDone ? 3 : isRequirementDone ? 2 : 1;

  return (
    <div className="min-h-screen bg-[#F0F2F8]">
      {/* TopBar */}
      <header className="flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-2">
          <img src={logoWide} alt="Namma Client" className="h-10 w-auto object-contain" />
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent rounded-full transition-colors"
          >
            <Languages size={15} className="text-primary" />
            Language: {i18n.language === "en" ? "English / தமிழ்" : "தமிழ் / English"}
          </button>
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white text-sm font-semibold">
            {profile?.full_name?.[0] ?? "J"}
            {profile?.full_name?.split(" ")[1]?.[0] ?? "D"}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5">
          {/* Left column */}
          <div className="space-y-5">
            {/* Welcome card */}
            <div className="bg-white border border-border rounded-2xl shadow-card p-8">
              <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">
                {t("welcome.subtitle")}
              </p>
              <h1 className="text-3xl font-bold text-foreground mb-4 leading-tight">
                {t("welcome.title")}
              </h1>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {t("welcome.desc")}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Quote card */}
              <div className="bg-white border border-border rounded-2xl shadow-card p-6">
                <p className="text-4xl font-bold text-primary mb-3">99</p>
                <p className="text-sm text-muted-foreground italic leading-relaxed mb-5">
                  "{t("welcome.quoteText")}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-primary font-bold text-sm">AK</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{t("welcome.quoteName")}</p>
                    <p className="text-xs text-muted-foreground">{t("welcome.quoteTitle")}</p>
                  </div>
                </div>
              </div>

              {/* Support card */}
              <div className="revenue-card flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">{t("welcome.needHelp")}</h3>
                  <p className="text-sm text-white/80 leading-relaxed mb-5">{t("welcome.needHelpDesc")}</p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-white/90">
                    <Mail size={15} />
                    <span>support@nammaclient.com</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/90">
                    <Phone size={15} />
                    <span>+91 98765 43210</span>
                  </div>
                  <button className="w-full py-2.5 bg-white text-primary text-sm font-bold rounded-xl hover:bg-white/90 transition-colors">
                    {t("welcome.chatSupport")}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-5">
            {/* Wizard card */}
            <div className="bg-white border-2 border-primary/30 rounded-2xl shadow-card-hover p-6">
              <span className="text-xs font-bold text-primary uppercase tracking-widest">
                {t("welcome.stepOf", { current: currentStep.toString(), total: "3" })}
              </span>
              <h2 className="text-lg font-bold text-foreground mt-2 mb-1">
                {isTimelineDone ? "All Setup Complete!" : isRequirementDone ? "Requirements Under Review" : "Let's get started"}
              </h2>
              <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
                {isTimelineDone 
                  ? "Your project is now fully initialized. You can track deliverables, view invoices, and manage shared documents from your dashboard."
                  : isRequirementDone 
                  ? "We have successfully received your project requirements. Our engineering team is currently planning your timeline and milestones."
                  : "Before we begin, we need to gather a few details about your project requirements."}
              </p>

              <div className="space-y-4 mb-6">
                {steps.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    {step.done ? (
                      <div className="step-circle done">
                        <CheckCircle2 size={16} />
                      </div>
                    ) : step.active ? (
                      <div className="step-circle active">
                        <div className="w-3 h-3 rounded-full bg-primary" />
                      </div>
                    ) : (
                      <div className="step-circle pending">
                        <span>{idx + 1}</span>
                      </div>
                    )}
                    <span className={`text-sm font-medium ${step.active ? "text-foreground" : step.done ? "text-muted-foreground" : "text-muted-foreground/60"}`}>
                      {t(`welcome.${step.key}`)}
                    </span>
                  </div>
                ))}
              </div>

              {isTimelineDone ? (
                <button
                  onClick={() => navigate("/dashboard")}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary text-white font-bold text-sm rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/30 cursor-pointer"
                >
                  Go to Dashboard
                  <ArrowRight size={16} />
                </button>
              ) : isRequirementDone ? (
                <button
                  onClick={() => navigate("/requirements")}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary text-white font-bold text-sm rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/30 cursor-pointer"
                >
                  View Submitted Requirements
                  <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  onClick={() => navigate("/requirements/wizard")}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary text-white font-bold text-sm rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/30 cursor-pointer"
                >
                  {t("welcome.launchWizard")}
                  <ArrowRight size={16} />
                </button>
              )}
            </div>

            {/* Security card */}
            <div className="bg-white border border-border rounded-2xl shadow-card p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Shield size={16} className="text-primary" />
                </div>
                <h3 className="text-sm font-bold text-foreground">{t("welcome.securePrivate")}</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{t("welcome.secureDesc")}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
