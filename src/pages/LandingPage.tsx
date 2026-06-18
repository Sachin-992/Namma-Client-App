import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import {
  Languages,
  Check,
  Play,
  Globe,
  Zap,
  TrendingUp,
  X,
  ChevronRight,
  ChevronLeft,
  Info,
  Shield,
  FileText,
  Clock,
  Sparkles,
  Smartphone,
  CheckCircle2,
  Lock,
  ArrowRight
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import logoWide from "@/assets/logo-wide.png";

export default function LandingPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  
  const [form, setForm] = useState({ name: "", email: "", business: "", message: "" });
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const [demoTab, setDemoTab] = useState<"overview" | "bilingual" | "tracker" | "video">("overview");
  const [demoPlaying, setDemoPlaying] = useState(false);
  const [demoProgress, setDemoProgress] = useState(0);

  // Legal Modal State
  const [isLegalOpen, setIsLegalOpen] = useState(false);
  const [legalTab, setLegalTab] = useState<"privacy" | "terms">("privacy");

  const isTamil = i18n.language?.startsWith("ta");

  const toggleLang = () => {
    const nextLang = isTamil ? "en" : "ta";
    i18n.changeLanguage(nextLang);
    localStorage.setItem("namma_language", nextLang);
  };

  const handleGetStarted = () => {
    if (authLoading) return;
    if (user) {
      navigate("/dashboard");
    } else {
      navigate("/register");
    }
  };

  const handleNavLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Simulated Video player timing effect
  useEffect(() => {
    let interval: any;
    if (demoPlaying) {
      interval = setInterval(() => {
        setDemoProgress((prev) => {
          if (prev >= 100) {
            setDemoPlaying(false);
            return 0;
          }
          return prev + 1.5;
        });
      }, 150);
    }
    return () => clearInterval(interval);
  }, [demoPlaying]);

  const NAV_LINKS = [
    { id: "features", label: isTamil ? "அம்சங்கள்" : "Features" },
    { id: "benefits", label: isTamil ? "நன்மைகள்" : "Benefits" },
    { id: "pricing", label: isTamil ? "விலைப்பட்டியல்" : "Pricing" }
  ];

  const openLegal = (type: "privacy" | "terms") => {
    setLegalTab(type);
    setIsLegalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-primary/20 overflow-x-hidden">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/80 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="flex items-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-lg"
            aria-label="Namma Client Logo"
          >
            <img src={logoWide} alt="Namma Client" className="h-9 w-auto object-contain" />
          </a>
          
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(link => (
              <a
                key={link.id}
                href={`#${link.id}`}
                onClick={(e) => handleNavLinkClick(e, link.id)}
                className="text-sm font-medium text-slate-600 hover:text-primary transition-colors duration-200"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleLang}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 transition-all cursor-pointer"
              aria-label="Toggle Language Between English and Tamil"
            >
              <Languages size={14} className="text-slate-500" />
              {isTamil ? "English" : "தமிழ்"}
            </button>
            <button
              onClick={handleGetStarted}
              className="px-4 py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/95 hover:shadow-lg hover:shadow-primary/20 transition-all duration-200 cursor-pointer"
            >
              {isTamil ? "தொடங்கவும்" : "Get Started"}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-100 via-white to-blue-50/50 pt-20 pb-28 border-b border-slate-200/50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.05),transparent_70%)] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="flex flex-col items-start text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 rounded-full text-xs font-bold text-primary mb-6 shadow-sm">
                <Sparkles size={12} className="animate-pulse" />
                {isTamil ? "உலகளாவிய வளர்ச்சிக்கக்கான #1 தளம்" : "The #1 Platform for Global Growth"}
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.1] mb-6 tracking-tight">
                {t("landing.hero.title")}{" "}
                <span className="text-primary bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent italic">
                  {t("landing.hero.titleHighlight")}
                </span>
              </h1>
              
              <p className="text-lg text-slate-600 leading-relaxed mb-8 max-w-lg">
                {t("landing.hero.subtitle")}
              </p>
              
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={handleGetStarted}
                  className="flex items-center gap-2 px-6 py-4 bg-primary text-white text-sm font-extrabold rounded-xl hover:bg-primary/95 transition-all shadow-xl shadow-primary/20 hover:shadow-primary/35 hover:-translate-y-0.5 duration-200 cursor-pointer"
                >
                  {t("landing.hero.getStarted")}
                  <ArrowRight size={16} />
                </button>
                <button
                  onClick={() => {
                    setDemoTab("overview");
                    setIsDemoOpen(true);
                  }}
                  className="flex items-center gap-2 px-5 py-4 bg-white border border-slate-200 text-slate-700 hover:text-slate-900 text-sm font-bold rounded-xl hover:bg-slate-50 transition-all hover:-translate-y-0.5 duration-200 shadow-sm cursor-pointer"
                >
                  <Play size={14} className="fill-slate-600 text-slate-600" />
                  {t("landing.hero.watchDemo")}
                </button>
              </div>
              
              {/* Social proof */}
              <p className="text-xs font-semibold text-slate-500 mt-8">
                {isTamil ? "இந்த வாரம் " : "Trusted by " }
                <span className="font-extrabold text-slate-800">1,000+</span> 
                {isTamil ? " வணிக பங்காளர்களின் நன்மதிப்பைப் பெற்றது" : " business partners this week"}
              </p>
            </div>

            {/* Hero Visual Card */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-indigo-600 rounded-3xl blur-2xl opacity-10 group-hover:opacity-15 transition-opacity" />
              <div className="relative bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-800">
                <div className="flex justify-between items-start mb-8 border-b border-slate-800 pb-5">
                  <div>
                    <p className="text-slate-400 text-xs font-semibold tracking-wider uppercase mb-1">
                      {isTamil ? "பெறப்பட்ட தொகை" : "Payment Received"}
                    </p>
                    <p className="text-white text-3xl sm:text-4xl font-black tracking-tight">₹45,000.00</p>
                  </div>
                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                    <TrendingUp size={12} />
                    +12%
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: isTamil ? "செயலில் உள்ள திட்டங்கள்" : "Active Projects", value: "8" },
                    { label: isTamil ? "நிலுவை இன்வாய்ஸ்கள்" : "Pending Invoices", value: "3" },
                    { label: isTamil ? "கிளையன்ட் NPS மதிப்பீடு" : "Client NPS Score", value: "98%" },
                    { label: isTamil ? "துல்லிய வழங்கல் விகிதம்" : "On-time Delivery Rate", value: "94%" },
                  ].map((item, idx) => (
                    <div key={idx} className="bg-white/5 rounded-xl p-4 border border-white/5 hover:bg-white/10 transition-colors">
                      <p className="text-white text-xl sm:text-2xl font-black">{item.value}</p>
                      <p className="text-slate-400 text-xs mt-1 font-medium leading-tight">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-white border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-4">
              {t("landing.features.title")}
            </h2>
            <p className="text-slate-600 text-base leading-relaxed">
              {t("landing.features.subtitle")}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Globe,
                title: t("landing.features.bilingual"),
                desc: t("landing.features.bilingualDesc"),
                color: "bg-blue-50 text-blue-600 border-blue-100",
                tab: "bilingual" as const
              },
              {
                icon: Zap,
                title: t("landing.features.easyOnboarding"),
                desc: t("landing.features.easyOnboardingDesc"),
                color: "bg-emerald-50 text-emerald-600 border-emerald-100",
                tab: "overview" as const
              },
              {
                icon: TrendingUp,
                title: t("landing.features.projectTracking"),
                desc: t("landing.features.projectTrackingDesc"),
                color: "bg-amber-50 text-amber-600 border-amber-100",
                tab: "tracker" as const
              },
            ].map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  onClick={() => {
                    setDemoTab(feat.tab);
                    setIsDemoOpen(true);
                  }}
                  className="group bg-slate-50/50 border border-slate-200/80 rounded-2xl p-6 sm:p-8 hover:bg-white hover:shadow-xl hover:shadow-slate-100 hover:border-slate-300 transition-all duration-300 cursor-pointer text-left hover:-translate-y-1"
                >
                  <div className={`w-12 h-12 rounded-xl ${feat.color} border flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon size={20} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-3 group-hover:text-primary transition-colors flex items-center gap-1.5">
                    {feat.title}
                    <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits / Stats Section */}
      <section id="benefits" className="py-24 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.08),transparent_50%)] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="text-left">
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-6 leading-tight">
                {t("landing.benefits.title")}
              </h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-1 border border-primary/30">
                    <span className="text-primary text-xs font-bold">✓</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-slate-100">{t("landing.benefits.owners")}</h4>
                    <p className="text-sm text-slate-400 mt-1 leading-relaxed">{t("landing.benefits.ownersDesc")}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-1 border border-primary/30">
                    <span className="text-primary text-xs font-bold">✓</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-slate-100">{t("landing.benefits.freelancers")}</h4>
                    <p className="text-sm text-slate-400 mt-1 leading-relaxed">{t("landing.benefits.freelancersDesc")}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white/5 border border-white/5 rounded-2xl p-6 sm:p-8 text-center backdrop-blur-sm hover:bg-white/10 transition-colors">
                <p className="text-4xl sm:text-5xl font-black text-primary mb-2 tracking-tight">40%</p>
                <p className="text-xs sm:text-sm text-slate-400 font-semibold">{t("landing.benefits.fasterDelivery")}</p>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-2xl p-6 sm:p-8 text-center backdrop-blur-sm hover:bg-white/10 transition-colors">
                <p className="text-4xl sm:text-5xl font-black text-indigo-400 mb-2 tracking-tight">12+</p>
                <p className="text-xs sm:text-sm text-slate-400 font-semibold">{t("landing.benefits.customers")}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-slate-50 border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
              {t("landing.testimonials.title")}
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                quote: t("landing.testimonials.quote1"),
                author: t("landing.testimonials.author1"),
                role: t("landing.testimonials.role1"),
              },
              {
                quote: t("landing.testimonials.quote2"),
                author: t("landing.testimonials.author2"),
                role: t("landing.testimonials.role2"),
              },
              {
                quote: t("landing.testimonials.quote3"),
                author: t("landing.testimonials.author3"),
                role: t("landing.testimonials.role3"),
              },
            ].map((t, idx) => (
              <div key={idx} className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between text-left">
                <div>
                  <div className="flex gap-1 mb-5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <span key={s} className="text-amber-400 text-base">★</span>
                    ))}
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed italic mb-6">"{t.quote}"</p>
                </div>
                <div className="flex items-center gap-3 border-t border-slate-100 pt-4 mt-auto">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold shadow-sm shrink-0">
                    {t.author ? t.author[0] : "N"}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{t.author}</p>
                    <p className="text-[10px] text-slate-500 font-medium">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-white border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-3">
              {t("landing.pricing.title")}
            </h2>
            <p className="text-slate-600 text-sm">{t("landing.pricing.subtitle")}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-stretch">
            {[
              {
                name: t("landing.pricing.starter"),
                price: t("landing.pricing.starterPrice"),
                features: [t("landing.pricing.starterFeatures.0"), t("landing.pricing.starterFeatures.1"), t("landing.pricing.starterFeatures.2")],
                cta: t("landing.pricing.chooseStarter"),
                popular: false,
              },
              {
                name: t("landing.pricing.pro"),
                price: t("landing.pricing.proPrice"),
                features: [t("landing.pricing.proFeatures.0"), t("landing.pricing.proFeatures.1"), t("landing.pricing.proFeatures.2"), t("landing.pricing.proFeatures.3")],
                cta: t("landing.pricing.choosePro"),
                popular: true,
              },
              {
                name: t("landing.pricing.enterprise"),
                price: t("landing.pricing.enterprisePrice"),
                features: [t("landing.pricing.enterpriseFeatures.0"), t("landing.pricing.enterpriseFeatures.1"), t("landing.pricing.enterpriseFeatures.2"), t("landing.pricing.enterpriseFeatures.3")],
                cta: t("landing.pricing.contactSales"),
                popular: false,
              },
            ].map((plan, idx) => (
              <div
                key={idx}
                className={`rounded-2xl p-8 border flex flex-col justify-between transition-all duration-300 relative ${
                  plan.popular
                    ? "border-primary bg-slate-950 text-white shadow-xl shadow-slate-200 hover:-translate-y-1 scale-105 z-10"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:-translate-y-1"
                }`}
              >
                <div>
                  {plan.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
                      {t("landing.pricing.mostPopular")}
                    </span>
                  )}
                  <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${plan.popular ? "text-primary" : "text-slate-500"}`}>
                    {plan.name}
                  </p>
                  <div className="flex items-baseline mb-6">
                    <span className={`text-4xl sm:text-5xl font-black tracking-tight ${plan.popular ? "text-white" : "text-slate-900"}`}>
                      {plan.price}
                    </span>
                    <span className={`text-xs font-semibold ml-1.5 ${plan.popular ? "text-slate-400" : "text-slate-500"}`}>
                      {t("landing.pricing.perMonth")}
                    </span>
                  </div>
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((f, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2.5 text-xs text-left">
                        <CheckCircle2 size={15} className={`shrink-0 ${plan.popular ? "text-primary" : "text-emerald-500"} mt-0.5`} />
                        <span className={plan.popular ? "text-slate-300" : "text-slate-600"}>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <button
                  onClick={handleGetStarted}
                  className={`w-full py-3.5 rounded-xl text-xs font-extrabold transition-all duration-200 cursor-pointer ${
                    plan.popular
                      ? "bg-primary text-white hover:bg-primary/95 hover:shadow-lg hover:shadow-primary/20"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-800 hover:text-slate-900"
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary via-indigo-700 to-indigo-900 text-white relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.05),transparent_40%)] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="text-left">
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">{t("landing.cta.title")}</h2>
              <p className="text-indigo-100 text-base leading-relaxed mb-8">{t("landing.cta.subtitle")}</p>
              <div className="space-y-4 text-sm font-semibold text-indigo-150">
                <div className="flex items-center gap-3">
                  <span className="text-lg">✉</span>
                  <span>support@nammaclient.com</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg">📞</span>
                  <span>+1 99865 4321</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white text-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  toast.success(
                    isTamil 
                      ? "செய்தி அனுப்பப்பட்டது! விரைவில் உங்களைத் தொடர்புகொள்வோம்." 
                      : "Message sent! We'll contact you soon."
                  );
                  setForm({ name: "", email: "", business: "", message: "" });
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="sr-only" htmlFor="form-name">{t("landing.cta.fullName")}</label>
                    <input
                      id="form-name"
                      type="text"
                      placeholder={t("landing.cta.fullName")}
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                    />
                  </div>
                  <div>
                    <label className="sr-only" htmlFor="form-email">{t("landing.cta.email")}</label>
                    <input
                      id="form-email"
                      type="email"
                      placeholder={t("landing.cta.email")}
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="sr-only" htmlFor="form-business">{t("landing.cta.businessName")}</label>
                  <select
                    id="form-business"
                    value={form.business}
                    onChange={e => setForm(f => ({ ...f, business: e.target.value }))}
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-500 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all cursor-pointer"
                  >
                    <option value="">{isTamil ? "வணிகத் துறை" : "Business Domain"}</option>
                    <option value="ecommerce">{isTamil ? "மின்-வணிகம்" : "E-Commerce"}</option>
                    <option value="it_services">{isTamil ? "ஐடி சேவைகள்" : "IT Services"}</option>
                    <option value="manufacturing">{isTamil ? "உற்பத்தி" : "Manufacturing"}</option>
                    <option value="other">{isTamil ? "இதர" : "Other"}</option>
                  </select>
                </div>
                <div>
                  <label className="sr-only" htmlFor="form-message">{t("landing.cta.message")}</label>
                  <textarea
                    id="form-message"
                    rows={3}
                    placeholder={t("landing.cta.message")}
                    value={form.message}
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3.5 bg-primary text-white font-extrabold text-xs rounded-xl hover:bg-primary/95 transition-all shadow-lg shadow-primary/20 cursor-pointer"
                >
                  {t("landing.cta.send")}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-white py-16 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 mb-12">
            <div className="text-left">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-white font-extrabold text-sm">N</span>
                </div>
                <span className="font-extrabold text-sm tracking-tight">Namma Client</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t("landing.footer.desc")}
              </p>
            </div>

            {[
              {
                title: isTamil ? "தயாரிப்பு" : "Product",
                links: [
                  { label: isTamil ? "அம்சங்கள்" : "Features", href: "#features", onClick: (e: any) => handleNavLinkClick(e, "features") },
                  { label: isTamil ? "விலைப்பட்டியல்" : "Pricing", href: "#pricing", onClick: (e: any) => handleNavLinkClick(e, "pricing") },
                  { label: isTamil ? "திட்டவரைபடம்" : "Roadmap", href: "#", onClick: (e: any) => { e.preventDefault(); toast.info("Roadmap under active preparation!"); } },
                  { label: isTamil ? "மாற்றங்கள்" : "Changelog", href: "#", onClick: (e: any) => { e.preventDefault(); toast.info("Latest changes: v1.5.0 launched!"); } }
                ]
              },
              {
                title: isTamil ? "நிறுவனம்" : "Company",
                links: [
                  { label: isTamil ? "எங்களைப் பற்றி" : "About Us", href: "#", onClick: (e: any) => { e.preventDefault(); toast.info("Namma Client: Empowering global businesses."); } },
                  { label: isTamil ? "வலைப்பதிவு" : "Blog", href: "#", onClick: (e: any) => { e.preventDefault(); toast.info("Blog placeholder - coming soon!"); } },
                  { label: isTamil ? "பணிகள்" : "Careers", href: "#", onClick: (e: any) => { e.preventDefault(); toast.info("Join our distributed team!"); } },
                  { label: isTamil ? "செய்திகள்" : "Press", href: "#", onClick: (e: any) => { e.preventDefault(); toast.info("Press information."); } }
                ]
              },
              {
                title: isTamil ? "சட்டப்பூர்வ" : "Legal",
                links: [
                  { label: t("landing.footer.privacy"), href: "#", onClick: (e: any) => { e.preventDefault(); openLegal("privacy"); } },
                  { label: t("landing.footer.terms"), href: "#", onClick: (e: any) => { e.preventDefault(); openLegal("terms"); } },
                  { label: t("landing.footer.cookie"), href: "#", onClick: (e: any) => { e.preventDefault(); toast.info("Cookie configuration settings."); } },
                  { label: t("landing.footer.gdpr"), href: "#", onClick: (e: any) => { e.preventDefault(); toast.info("GDPR Compliance details."); } }
                ]
              }
            ].map((col, idx) => (
              <div key={idx} className="text-left">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-4">{col.title}</h4>
                <ul className="space-y-2.5">
                  {col.links.map((link, lIdx) => (
                    <li key={lIdx}>
                      <a
                        href={link.href}
                        onClick={link.onClick}
                        className="text-xs text-slate-400 hover:text-white transition-colors duration-150"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-900 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500">
              {t("landing.footer.copyright")}
            </p>
            <div className="flex gap-3">
              {[
                { label: "X", href: "https://x.com", aria: "Follow Namma Client on X" },
                { label: "in", href: "https://linkedin.com", aria: "Connect on LinkedIn" },
                { label: "gh", href: "https://github.com", aria: "View on GitHub" }
              ].map((social, idx) => (
                <a
                  key={idx}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center hover:bg-slate-800 border border-slate-800 transition-colors"
                  aria-label={social.aria}
                >
                  <span className="text-slate-400 text-xs font-bold">{social.label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* ====================================================
          WATCH DEMO WALKTHROUGH MODAL
          ==================================================== */}
      {isDemoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity duration-300"
            onClick={() => {
              setIsDemoOpen(false);
              setDemoPlaying(false);
              setDemoProgress(0);
            }}
          />
          
          <div className="bg-white rounded-3xl overflow-hidden w-full max-w-4xl shadow-2xl border border-slate-200 z-10 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-full text-xs font-black flex items-center gap-1.5 shadow-sm">
                  <Play size={12} className="fill-primary" />
                  {isTamil ? "நேரடி தயாரிப்பு விளக்கம்" : "Interactive Walkthrough"}
                </span>
                <span className="text-slate-300">|</span>
                <span className="text-xs font-bold text-slate-500">Namma Client v1.5</span>
              </div>
              <button
                onClick={() => {
                  setIsDemoOpen(false);
                  setDemoPlaying(false);
                  setDemoProgress(0);
                }}
                className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                aria-label="Close Walkthrough Modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200 overflow-x-auto bg-slate-50/50">
              {[
                { id: "overview" as const, label: isTamil ? "கண்ணோட்டம்" : "Dashboard Overview", icon: Zap },
                { id: "bilingual" as const, label: isTamil ? "இருமொழி இடைமுகம்" : "Bilingual Interface", icon: Globe },
                { id: "tracker" as const, label: isTamil ? "திட்டக் கண்காணிப்பு" : "Project Hub", icon: TrendingUp },
                { id: "video" as const, label: isTamil ? "வீடியோ டெமோ" : "Live Video Demo", icon: Play }
              ].map((tab) => {
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setDemoTab(tab.id);
                      setDemoPlaying(false);
                      setDemoProgress(0);
                    }}
                    className={`flex items-center gap-2 px-5 py-3.5 border-b-2 text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      demoTab === tab.id
                        ? "border-primary text-primary bg-white"
                        : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50"
                    }`}
                  >
                    <TabIcon size={14} className={demoTab === tab.id ? "text-primary" : "text-slate-400"} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Walkthrough Content Area */}
            <div className="flex-1 p-6 sm:p-8 overflow-y-auto min-h-[350px] flex flex-col justify-between">
              {demoTab === "overview" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center text-left my-auto">
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900 mb-3 flex items-center gap-2">
                      <Zap className="text-emerald-500 shrink-0" size={22} />
                      {isTamil ? "வணிக மேலாண்மை டாஷ்போர்டு" : "All-in-One Client Center"}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed mb-6">
                      {isTamil
                        ? "உங்கள் வாடிக்கையாளர்கள், திட்டங்கள், குறிப்புகள், இன்வாய்ஸ்கள் மற்றும் காலக்கெடுகளை ஒரே இடத்தில் நிர்வகிக்கவும். நிர்வாகச் சுமைகளைக் குறைத்து, திட்ட வழங்கலில் மட்டுமே கவனம் செலுத்துங்கள்."
                        : "Centralize your entire customer portfolio. From tracking invoices and recording payments to managing deliverables and tasks. Namma Client integrates everything into a single workspace."}
                    </p>
                    <ul className="space-y-2 text-xs font-semibold text-slate-700">
                      <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> {isTamil ? "வாடிக்கையாளர் திருப்தி மற்றும் NPS கண்காணிப்பு" : "Automated Client Satisfaction NPS tracking"}</li>
                      <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> {isTamil ? "திட்டங்கள் மற்றும் பட்ஜெட்களின் நேரடிக் கண்ணோட்டம்" : "Live indicators for project values & statuses"}</li>
                      <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> {isTamil ? "எளிதான கணக்கு உருவாக்கம் மற்றும் ஆன்போர்டிங்" : "Interactive client onboarding questionnaire"}</li>
                    </ul>
                  </div>
                  {/* Mock Graphic */}
                  <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-lg relative">
                    <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Dashboard Mockup</span>
                    </div>
                    <div className="space-y-3">
                      <div className="bg-white/5 rounded-xl p-3 flex justify-between items-center">
                        <div className="text-left">
                          <p className="text-[10px] text-slate-400 uppercase font-bold">Revenue YTD</p>
                          <p className="text-white text-base font-black">₹3,45,000</p>
                        </div>
                        <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded">Active</span>
                      </div>
                      <div className="bg-white/5 rounded-xl p-3 flex justify-between items-center">
                        <div className="text-left">
                          <p className="text-[10px] text-slate-400 uppercase font-bold">Active Partners</p>
                          <p className="text-white text-base font-black">18 Clients</p>
                        </div>
                        <span className="bg-indigo-500/10 text-indigo-400 text-[10px] font-bold px-2 py-0.5 rounded">Growing</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {demoTab === "bilingual" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center text-left my-auto">
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900 mb-3 flex items-center gap-2">
                      <Globe className="text-blue-500 shrink-0" size={22} />
                      {isTamil ? "தமிழ் மற்றும் ஆங்கில இடைமுகம்" : "Bilingual Document Workspace"}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed mb-6">
                      {isTamil
                        ? "வாடிக்கையாளர் திட்டத் தேவைகள் மற்றும் இன்வாய்ஸ்களை ஒரே கிளிக்கில் தமிழ் அல்லது ஆங்கில மொழியில் மாற்றலாம். இது உங்களுக்கும் வாடிக்கையாளருக்கும் இடையே தெளிவான புரிதலை உறுதி செய்கிறது."
                        : "Bridging communication and regional language barriers. Clients can input details in English, and local teams can toggle translation blocks to Tamil in real-time. Invoices can be issues in both languages seamlessly."}
                    </p>
                    <div className="flex gap-2">
                      <span className="px-2.5 py-1 bg-blue-50 border border-blue-100 text-blue-700 font-bold rounded-lg text-xs">English</span>
                      <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold rounded-lg text-xs">தமிழ் மொழிபெயர்ப்பு</span>
                    </div>
                  </div>
                  {/* Mock Graphic */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-200">
                      <span className="text-xs font-bold text-slate-700">Project Requirements</span>
                      <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">Live Translation</span>
                    </div>
                    <div className="space-y-4">
                      <div className="p-3 bg-white border border-slate-200 rounded-xl">
                        <p className="text-[10px] text-slate-400 font-bold mb-1">English Input</p>
                        <p className="text-xs font-bold text-slate-800 leading-normal">Provide automated daily activity reporting templates for projects.</p>
                      </div>
                      <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                        <p className="text-[10px] text-indigo-500 font-bold mb-1">Tamil Translation</p>
                        <p className="text-xs font-semibold text-indigo-900 leading-normal">திட்டங்களுக்கான தானியங்கி தினசரி செயல்பாட்டு அறிக்கையிடல் வார்ப்புருக்களை வழங்கவும்.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {demoTab === "tracker" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center text-left my-auto">
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900 mb-3 flex items-center gap-2">
                      <TrendingUp className="text-amber-500 shrink-0" size={22} />
                      {isTamil ? "நேரடி திட்டக் கண்காணிப்பு" : "Real-time Progress Tracker"}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed mb-6">
                      {isTamil
                        ? "வாடிக்கையாளர் திட்ட முன்னேற்றம், மைல்கற்கள் மற்றும் வரவிருக்கும் காலக்கெடுகளை வரைபடமாகக் கண்காணிக்கலாம். ஒவ்வொரு பணியின் நிலையையும் உடனுக்குடன் அறிந்துகொள்ளலாம்."
                        : "Minimize updates overhead. Clients see dynamic milestones, project scopes, deadline calendars, and active invoice charts. Clear progression statuses from initiation to closure."}
                    </p>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-100 p-2.5 rounded-xl border border-slate-200 max-w-fit">
                      <Clock size={14} className="text-slate-400" />
                      <span>{isTamil ? "12+ செயலில் உள்ள திட்டங்கள்" : "12+ active schedules tracked"}</span>
                    </div>
                  </div>
                  {/* Mock Graphic */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <p className="text-xs font-extrabold text-slate-800 text-left mb-3">Project Phase: Phase 2 - Backend Integration</p>
                    <div className="w-full bg-slate-100 rounded-full h-3 mb-4 overflow-hidden border border-slate-200">
                      <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: "70%" }} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
                        <span className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-emerald-500" /> API Gateway Setup</span>
                        <span className="text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded font-bold">Done</span>
                      </div>
                      <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
                        <span className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-emerald-500" /> Database Relational Schema</span>
                        <span className="text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded font-bold">Done</span>
                      </div>
                      <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
                        <span className="flex items-center gap-1.5"><Clock size={13} className="text-slate-400" /> Supabase Realtime Setup</span>
                        <span className="text-[10px] bg-amber-50 text-amber-600 border border-amber-100 px-1.5 py-0.5 rounded font-bold">In Progress</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {demoTab === "video" && (
                <div className="my-auto flex flex-col items-center justify-center">
                  <div className="relative bg-slate-950 rounded-2xl overflow-hidden w-full max-w-lg aspect-video shadow-2xl border border-slate-800 flex items-center justify-center group/video">
                    {demoPlaying ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-white bg-slate-950/95 font-mono">
                        <div className="flex items-center gap-2 text-primary font-bold animate-pulse text-sm mb-4">
                          <Sparkles size={16} />
                          {isTamil ? "டெமோ வீடியோ இயங்குகிறது..." : "SIMULATING PRODUCT WALKTHROUGH..."}
                        </div>
                        
                        <div className="text-left w-full space-y-2 text-xs font-semibold text-slate-400 mb-6 bg-white/5 p-4 rounded-xl border border-white/5">
                          <p className="flex justify-between">
                            <span>➔ Initialize Supabase auth context:</span>
                            <span className="text-emerald-400">SUCCESS</span>
                          </p>
                          <p className="flex justify-between">
                            <span>➔ Establishing Bilingual channels:</span>
                            <span className="text-emerald-400">LOADED</span>
                          </p>
                          <p className="flex justify-between">
                            <span>➔ Compiling client invoice timelines:</span>
                            <span className="text-emerald-400">READY</span>
                          </p>
                        </div>

                        {/* Visual Progress Bar */}
                        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-primary h-full transition-all ease-linear duration-150"
                            style={{ width: `${demoProgress}%` }}
                          />
                        </div>
                        <div className="flex justify-between w-full text-[10px] text-slate-500 mt-2">
                          <span>0:{Math.floor(demoProgress / 4).toString().padStart(2, "0")}</span>
                          <span>Demo Duration (100%)</span>
                        </div>
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-slate-900/90 p-4">
                        <button
                          onClick={() => {
                            setDemoPlaying(true);
                            setDemoProgress(0);
                          }}
                          className="w-16 h-16 rounded-full bg-primary hover:bg-primary/95 text-white flex items-center justify-center shadow-xl shadow-primary/20 hover:scale-110 transition-transform cursor-pointer"
                          aria-label="Play Simulated Demo Video"
                        >
                          <Play size={24} className="fill-white translate-x-0.5" />
                        </button>
                        <p className="mt-4 text-xs font-extrabold text-slate-300">
                          {isTamil ? "தொடக்க விளக்கம் காண கிளிக் செய்க (1:30 நிமிடம்)" : "Click to Play Simulated Product Walkthrough (1:30)"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Modal Footer Controls */}
              <div className="mt-8 border-t border-slate-100 pt-5 flex justify-between items-center bg-white">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Namma Client SaaS Suite
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleGetStarted}
                    className="px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/95 transition-all shadow-md shadow-primary/10 cursor-pointer flex items-center gap-1.5"
                  >
                    {isTamil ? "கணக்கு உருவாக்கவும்" : "Sign Up Now"}
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================
          LEGAL TERMS & PRIVACY MODAL
          ==================================================== */}
      {isLegalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsLegalOpen(false)}
          />
          <div className="bg-white rounded-3xl overflow-hidden w-full max-w-2xl shadow-2xl border border-slate-200 z-10 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2 text-slate-800 font-extrabold text-sm">
                <Shield size={16} className="text-primary" />
                {legalTab === "privacy"
                  ? (isTamil ? "தனியுரிமைக் கொள்கை" : "Privacy Policy")
                  : (isTamil ? "சேவை விதிமுறைகள்" : "Terms of Service")}
              </div>
              <button
                onClick={() => setIsLegalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 cursor-pointer"
                aria-label="Close Legal Modal"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="flex-1 p-6 sm:p-8 overflow-y-auto text-left text-sm text-slate-600 leading-relaxed space-y-4 font-normal">
              {legalTab === "privacy" ? (
                <>
                  <h3 className="font-extrabold text-base text-slate-900">{isTamil ? "1. நாங்கள் சேகரிக்கும் தகவல்கள்" : "1. Information We Collect"}</h3>
                  <p>
                    {isTamil
                      ? "நாங்கள் உங்கள் மின்னஞ்சல் முகவரி, வணிக விவரங்கள் மற்றும் வாடிக்கையாளர் தேவைகளைச் சேகரிக்கிறோம். இது எங்கள் தளத்தை திறம்பட வழங்க உதவுகிறது."
                      : "We collect your email, account credentials, profile configurations, and client metadata (requirements, invoice references) purely to deliver functional SaaS services."}
                  </p>
                  <h3 className="font-extrabold text-base text-slate-900">{isTamil ? "2. பாதுகாப்பு மற்றும் குறியாக்கம்" : "2. Information Security"}</h3>
                  <p>
                    {isTamil
                      ? "உங்கள் தகவல்கள் அனைத்தும் பாதுகாப்பான தரவுத்தளத்தில் சேமிக்கப்பட்டு, RLS (Row Level Security) மூலம் பாதுகாக்கப்படுகின்றன."
                      : "All user entries and billing documents are secured via industry-standard transport encryption and Supabase Row Level Security (RLS) configurations, making them accessible only to verified roles."}
                  </p>
                  <h3 className="font-extrabold text-base text-slate-950">{isTamil ? "3. குக்கீ கொள்கை" : "3. Cookies & Session Storage"}</h3>
                  <p>
                    {isTamil
                      ? "நாங்கள் உங்கள் உள்நுழைவு அமர்வு மற்றும் மொழி விருப்பங்களைச் சேமிக்க குக்கீகள் மற்றும் லோக்கல் ஸ்டோரேஜைப் பயன்படுத்துகிறோம்."
                      : "We utilize local storage and secure cookies to maintain active login sessions, verify user identity patterns, and persist language preferences (English/Tamil)."}
                  </p>
                </>
              ) : (
                <>
                  <h3 className="font-extrabold text-base text-slate-900">{isTamil ? "1. சேவை நிபந்தனைகள்" : "1. Acceptance of Terms"}</h3>
                  <p>
                    {isTamil
                      ? "நம்ம கிளையன்ட் சேவைகளைப் பயன்படுத்துவதன் மூலம், இந்த விதிமுறைகளை ஒப்புக்கொள்கிறீர்கள்."
                      : "By registering for a Namma Client subscription, you agree to these baseline provisions. You remain entirely responsible for all metadata entries made under your organization profile."}
                  </p>
                  <h3 className="font-extrabold text-base text-slate-900">{isTamil ? "2. சந்தா மற்றும் கொடுப்பனவுகள்" : "2. Subscriptions & Billing"}</h3>
                  <p>
                    {isTamil
                      ? "எங்கள் சேவைகள் மாதாந்திர சந்தா அடிப்படையில் வழங்கப்படுகின்றன. ஏதேனும் கட்டணத் தவர்த்தல்கள் ஏற்பட்டால், திரும்பப் பெற இயலாது."
                      : "Paid plan upgrades (Pro/Enterprise) are billed on a recurring monthly schedule. All payments are processed securely, and cancellation takes effect at the end of the active billing period."}
                  </p>
                  <h3 className="font-extrabold text-base text-slate-900">{isTamil ? "3. கணக்கு பொறுப்புகள்" : "3. Account Conduct"}</h3>
                  <p>
                    {isTamil
                      ? "உங்கள் கணக்கின் கடவுச்சொல் மற்றும் செயல்பாடுகளுக்கு நீங்களே முழுப் பொறுப்பாவீர்கள்."
                      : "You may not utilize Namma Client for any unlawful purposes, resource spamming, or fraudulent document creations. Violation is subject to immediate service termination."}
                  </p>
                </>
              )}
            </div>
            
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end bg-slate-50">
              <button
                onClick={() => setIsLegalOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-350 text-slate-800 hover:text-slate-900 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                {isTamil ? "மூடு" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
