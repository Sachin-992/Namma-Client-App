import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { Languages, Check, Play, Globe, Zap, TrendingUp, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import logoWide from "@/assets/logo-wide.png";

const NAV_LINKS = ["Features", "Benefits", "Pricing"];

export default function LandingPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", business: "", message: "" });

  const toggleLang = () => i18n.changeLanguage(i18n.language === "en" ? "ta" : "en");

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logoWide} alt="Namma Client" className="h-10 w-auto object-contain" />
          </div>
          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map(link => (
              <a key={link} href={`#${link.toLowerCase()}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {link}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggleLang} className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
              <Languages size={15} />
              {i18n.language === "en" ? "English / தமிழ்" : "தமிழ் / English"}
            </button>
            <button onClick={() => navigate("/login")} className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/90 transition-colors">
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#F5F6FA] via-white to-[#EEF0FF] pt-20 pb-24">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(79,70,229,0.08),transparent_70%)]" />
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full text-xs font-semibold text-primary mb-6">
                🌟 The #1 Platform for Global Growth
              </div>
              <h1 className="text-[42px] sm:text-5xl font-black text-foreground leading-tight mb-4">
                {t("landing.hero.title")}{" "}
                <span className="text-primary italic">{t("landing.hero.titleHighlight")}</span>
              </h1>
              <p className="text-base text-muted-foreground leading-relaxed mb-8 max-w-lg">
                {t("landing.hero.subtitle")}
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => navigate("/register")}
                  className="flex items-center gap-2 px-6 py-3.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40"
                >
                  {t("landing.hero.getStarted")}
                </button>
                <button className="flex items-center gap-2 px-5 py-3.5 border border-border text-sm font-semibold rounded-xl hover:bg-accent transition-all">
                  <Play size={15} className="fill-foreground" />
                  {t("landing.hero.watchDemo")}
                </button>
              </div>
              {/* Social proof */}
              <p className="text-xs text-muted-foreground mt-6">
                Trusted by <span className="font-bold text-foreground">1,000+</span> business partners this week
              </p>
            </div>

            {/* Hero visual */}
            <div className="relative">
              <div className="bg-gradient-to-br from-primary to-[#6366F1] rounded-3xl p-6 shadow-2xl">
                <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
                  <p className="text-white/70 text-xs font-medium mb-1">Payment Received</p>
                  <p className="text-white text-3xl font-black">₹45,000.00</p>
                  <p className="text-emerald-300 text-xs mt-1 font-semibold">+12% from last month</p>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  {[
                    { label: "Active Projects", value: "8" },
                    { label: "Pending Invoices", value: "3" },
                    { label: "Client NPS", value: "98%" },
                    { label: "On-time Rate", value: "94%" },
                  ].map(item => (
                    <div key={item.label} className="bg-white/10 rounded-xl p-3">
                      <p className="text-white text-lg font-bold">{item.value}</p>
                      <p className="text-white/60 text-[10px]">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 text-center mb-12">
          <h2 className="text-3xl font-black text-foreground mb-3">{t("landing.features.title")}</h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm">{t("landing.features.subtitle")}</p>
        </div>
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Globe, title: t("landing.features.bilingual"), desc: t("landing.features.bilingualDesc"), color: "bg-blue-100 text-blue-600" },
            { icon: Zap, title: t("landing.features.easyOnboarding"), desc: t("landing.features.easyOnboardingDesc"), color: "bg-emerald-100 text-emerald-600" },
            { icon: TrendingUp, title: t("landing.features.projectTracking"), desc: t("landing.features.projectTrackingDesc"), color: "bg-amber-100 text-amber-600" },
          ].map(feat => {
            const Icon = feat.icon;
            return (
              <div key={feat.title} className="bg-[#F8F9FF] border border-border rounded-2xl p-6 hover:shadow-card-hover transition-all">
                <div className={`w-12 h-12 rounded-xl ${feat.color} flex items-center justify-center mb-4`}>
                  <Icon size={22} />
                </div>
                <h3 className="text-sm font-bold text-foreground mb-2">{feat.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Stats section */}
      <section className="py-16 bg-gradient-to-br from-primary to-[#4338CA] text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-black mb-4">Built for the modern workforce</h2>
              <div className="space-y-3 text-sm text-white/80">
                <p>✓ For Business Owners — Automate administrative overhead, focus on high-value strategy and growth.</p>
                <p>✓ For Freelancers — Bill your requirements in your own language and receive timely payments in both in translations.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 rounded-2xl p-5 text-center backdrop-blur-sm">
                <p className="text-5xl font-black mb-1">40%</p>
                <p className="text-xs text-white/70">Faster Time To Task</p>
              </div>
              <div className="bg-white/10 rounded-2xl p-5 text-center backdrop-blur-sm">
                <p className="text-5xl font-black mb-1">12+</p>
                <p className="text-xs text-white/70">Customer Zones</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-[#F8F9FF]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { quote: "Namma Client has completely removed the language barrier between my agency and my partners in Chennai. The bilingual interface is a game changer.", author: "Kartik Raj", role: "Design Creative, Freelance", rating: 5 },
              { quote: "The project tracking interface is so intuitive. My clients are usually easily impressed when something is broken and the transition between pieces is clean and the feature grows with you.", author: "Priya Kumar", role: "Agency Owner", rating: 5 },
              { quote: "Having a new breakdown to a per-person rate that my clients can't take is a great tool! The translation between places is linear and the feature grows with you.", author: "Shane Bhattai", role: "Startup Consultant", rating: 5 },
            ].map((t, i) => (
              <div key={i} className="bg-white border border-border rounded-2xl p-6 shadow-card">
                <div className="flex gap-0.5 mb-4">
                  {[1,2,3,4,5].map(s => (
                    <span key={s} className="text-amber-400 text-sm">★</span>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5 italic">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
                    {t.author[0]}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">{t.author}</p>
                    <p className="text-[10px] text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-foreground mb-2">{t("landing.pricing.title")}</h2>
            <p className="text-muted-foreground text-sm">{t("landing.pricing.subtitle")}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              {
                name: t("landing.pricing.starter"), price: t("landing.pricing.starterPrice"),
                features: [t("landing.pricing.starterFeatures.0"), t("landing.pricing.starterFeatures.1"), t("landing.pricing.starterFeatures.2")],
                cta: t("landing.pricing.chooseStarter"), popular: false,
              },
              {
                name: t("landing.pricing.pro"), price: t("landing.pricing.proPrice"),
                features: [t("landing.pricing.proFeatures.0"), t("landing.pricing.proFeatures.1"), t("landing.pricing.proFeatures.2"), t("landing.pricing.proFeatures.3")],
                cta: t("landing.pricing.choosePro"), popular: true,
              },
              {
                name: t("landing.pricing.enterprise"), price: t("landing.pricing.enterprisePrice"),
                features: [t("landing.pricing.enterpriseFeatures.0"), t("landing.pricing.enterpriseFeatures.1"), t("landing.pricing.enterpriseFeatures.2"), t("landing.pricing.enterpriseFeatures.3")],
                cta: t("landing.pricing.contactSales"), popular: false,
              },
            ].map(plan => (
              <div
                key={plan.name}
                className={`rounded-2xl p-6 border-2 transition-all ${plan.popular ? "border-primary bg-primary shadow-2xl text-white scale-105" : "border-border"}`}
              >
                {plan.popular && <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-2">Most Popular</p>}
                <p className={`text-sm font-bold mb-1 ${plan.popular ? "text-white/80" : "text-muted-foreground"}`}>{plan.name}</p>
                <p className={`text-4xl font-black mb-1 ${plan.popular ? "text-white" : "text-foreground"}`}>
                  {plan.price}
                  <span className={`text-sm font-normal ml-1 ${plan.popular ? "text-white/70" : "text-muted-foreground"}`}>/mo</span>
                </p>
                <ul className="space-y-2 my-5">
                  {plan.features.map(f => (
                    <li key={f} className={`flex items-center gap-2 text-xs ${plan.popular ? "text-white/90" : "text-muted-foreground"}`}>
                      <Check size={13} className={plan.popular ? "text-white" : "text-emerald-500"} />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate("/register")}
                  className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${plan.popular ? "bg-white text-primary hover:bg-white/90" : "border border-border hover:bg-accent"}`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-primary to-[#4338CA]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-black text-white mb-3">{t("landing.cta.title")}</h2>
              <p className="text-white/80 text-sm leading-relaxed mb-4">{t("landing.cta.subtitle")}</p>
              <div className="space-y-2 text-sm text-white/80">
                <p>✉ support@nammaclient.com</p>
                <p>📞 +1 99865 4321</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" placeholder="Full Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="form-input" />
                  <input type="email" placeholder="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="form-input" />
                </div>
                <select value={form.business} onChange={e => setForm(f => ({ ...f, business: e.target.value }))} className="form-input">
                  <option value="">Business Domain</option>
                  <option>E-Commerce</option>
                  <option>IT Services</option>
                  <option>Manufacturing</option>
                  <option>Other</option>
                </select>
                <textarea rows={3} placeholder="How can we help you?" value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} className="form-input resize-none" />
                <button
                  onClick={() => { toast.success("Message sent! We'll contact you soon."); setForm({ name: "", email: "", business: "", message: "" }); }}
                  className="w-full py-3 bg-primary text-white font-bold text-sm rounded-xl hover:bg-primary/90 transition-colors"
                >
                  {t("landing.cta.send")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0F172A] text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-white font-bold text-sm">N</span>
                </div>
                <span className="font-bold text-sm">Namma Client</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">Everything business can manage through language barriers and deliver on-time deliveries and Tamil solutions.</p>
            </div>
            {[
              { title: "Product", links: ["Features", "Pricing", "Roadmap", "Changelog"] },
              { title: "Company", links: ["About Us", "Blog", "Careers", "Press"] },
              { title: "Legal", links: ["Privacy Policy", "Terms of Service", "Cookie Policy", "GDPR Compliance"] },
            ].map(col => (
              <div key={col.title}>
                <h4 className="text-xs font-bold text-white mb-3">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map(link => (
                    <li key={link}>
                      <a href="#" className="text-xs text-slate-400 hover:text-white transition-colors">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-slate-500">© 2024 Namma Client. All rights reserved.</p>
            <div className="flex gap-3">
              {["X", "in", "gh"].map((label, i) => (
                <button key={i} className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors">
                  <span className="text-slate-400 text-[10px] font-bold">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
