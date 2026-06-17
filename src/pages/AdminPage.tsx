import React, { useState, useEffect, useMemo } from "react";
import * as Icons from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { authService, dbService, storageService, isOfflineMode } from "../config/firebase";
import { getRoles } from "../utils/roleLoader";
import GlassCard from "../components/GlassCard";
import SEO from "../components/SEO";

export const AdminPage: React.FC = () => {
  const roles = useMemo(() => getRoles(), []);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [activeTab, setActiveTab] = useState<"links" | "validator" | "resumes" | "messages" | "analytics" | "builder" | "tailor">("links");

  // Links state
  const [links, setLinks] = useState<any>({ name: "", linkedin: "", github: "", whatsapp: "", email: "", portfolioUrl: "" });
  const [linksStatus, setLinksStatus] = useState<"idle" | "saving" | "success" | "error">("idle");

  // Messages state
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // JD Resume Tailor & ATS Scanner States
  const [selectedJdRole, setSelectedJdRole] = useState(roles[0]?.id || "");
  const [jdText, setJdText] = useState("");
  const [atsScore, setAtsScore] = useState<number | null>(null);
  const [atsAnalysis, setAtsAnalysis] = useState<any>(null);
  const [isAnalyzingJd, setIsAnalyzingJd] = useState(false);
  const [tailoredSummary, setTailoredSummary] = useState("");
  const [tailoredSkills, setTailoredSkills] = useState<any[]>([]);
  const [isTailoringApplied, setIsTailoringApplied] = useState(false);

  const runAtsAnalysis = () => {
    if (!jdText.trim()) return;
    setIsAnalyzingJd(true);
    setIsTailoringApplied(false);
    
    setTimeout(() => {
      const targetRole = roles.find(r => r.id === selectedJdRole);
      if (!targetRole) return;

      const jdLower = jdText.toLowerCase();
      const matchedSkills: string[] = [];
      const missingSkills: string[] = [];
      
      const commonKeywords = [
        "react", "typescript", "node", "express", "javascript", "rest", "api", "git", "ci/cd", "aws", "firebase",
        "power bi", "sql", "python", "tableau", "excel", "dax", "dashboard", "etl", "data modeling", "statistics",
        "openai", "anthropic", "llm", "prompt engineering", "rag", "vector", "langchain", "pinecone", "claude", "gpt", "agentic", "ai"
      ];

      const jdKeywords = commonKeywords.filter(k => jdLower.includes(k));
      
      targetRole.skills.forEach(skill => {
        const skillNameLower = skill.name.toLowerCase();
        const matchesJd = jdKeywords.some(keyword => skillNameLower.includes(keyword) || jdLower.includes(skillNameLower));
        if (matchesJd) {
          matchedSkills.push(skill.name);
        }
      });

      jdKeywords.forEach(keyword => {
        const hasSkill = targetRole.skills.some(skill => skill.name.toLowerCase().includes(keyword));
        if (!hasSkill) {
          const displayKeyword = keyword.charAt(0).toUpperCase() + keyword.slice(1);
          missingSkills.push(displayKeyword);
        }
      });

      let score = 35;
      if (targetRole.skills.length > 0) {
        const skillMatchWeight = (matchedSkills.length / targetRole.skills.length) * 45;
        score += skillMatchWeight;
      }
      
      const totalKeywordsEvaluated = matchedSkills.length + missingSkills.length;
      if (totalKeywordsEvaluated > 0) {
        const keywordRatio = (matchedSkills.length / totalKeywordsEvaluated) * 15;
        score += keywordRatio;
      }

      const finalScore = Math.min(Math.round(score), 98);
      
      const recommendations: string[] = [];
      if (missingSkills.length > 0) {
        recommendations.push(`Integrate missing critical skills: ${missingSkills.slice(0, 3).join(", ")} to align with requirements.`);
      }
      if (finalScore < 70) {
        recommendations.push("Revise the professional summary to contextually link with primary keywords in the JD.");
        recommendations.push("Adapt the project metrics to emphasize execution context aligned with JD targets.");
      } else {
        recommendations.push("Great alignment! Apply tailoring below to prioritize matched competencies.");
      }

      const tailoredSum = `Experienced ${targetRole.title} with solid execution records matching key requirements. Proficient in core JD areas including ${matchedSkills.slice(0, 4).join(", ")}${missingSkills.length > 0 ? `, with developing expertise in ${missingSkills.slice(0, 2).join(" and ")}` : ""}. Skilled in resolving business challenges, optimizing systems architecture, and delivering high-quality analytics workflows.`;

      const tailoredSk = targetRole.skills.map(s => {
        const isMatched = matchedSkills.includes(s.name);
        return {
          ...s,
          level: isMatched ? Math.min(s.level + 4, 98) : s.level,
          priority: isMatched ? 1 : 2
        };
      }).sort((a, b) => a.priority - b.priority);

      setAtsScore(finalScore);
      setAtsAnalysis({
        matchedSkills,
        missingSkills,
        recommendations
      });
      setTailoredSummary(tailoredSum);
      setTailoredSkills(tailoredSk);
      setIsAnalyzingJd(false);
    }, 1000);
  };

  const applyTailoredChanges = () => {
    const targetRole = roles.find(r => r.id === selectedJdRole);
    if (!targetRole) return;

    const tailoredProfile = {
      ...targetRole,
      summary: tailoredSummary,
      skills: tailoredSkills.map(({ name, category, level }) => ({ name, category, level }))
    };

    const overrideKey = `portfolio_role_override_${selectedJdRole}`;
    localStorage.setItem(overrideKey, JSON.stringify(tailoredProfile));
    setIsTailoringApplied(true);
  };

  const resetRoleToDefault = (roleId: string) => {
    const overrideKey = `portfolio_role_override_${roleId}`;
    localStorage.removeItem(overrideKey);
    
    if (selectedJdRole === roleId) {
      setAtsScore(null);
      setAtsAnalysis(null);
      setTailoredSummary("");
      setTailoredSkills([]);
    }
    window.location.reload();
  };

  // Analytics state
  const [analytics, setAnalytics] = useState<any>({ visitors: 0, downloads: {}, projectClicks: {} });

  // Resume state
  const [selectedResumeRole, setSelectedResumeRole] = useState(roles[0]?.id || "");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [uploadedResumes, setUploadedResumes] = useState<Record<string, any>>({});

  // Link Validator state
  const [validationResults, setValidationResults] = useState<Record<string, { format: boolean; ping: "checking" | "reachable" | "cors-restricted" | "broken" }>>({});
  const [isValidating, setIsValidating] = useState(false);

  // Resume Builder state
  const [newRoleJson, setNewRoleJson] = useState({
    id: "python-developer",
    name: "Pranil Belge",
    title: "Python Developer",
    roleIcon: "Code",
    summary: "Experienced Python Developer focused on automation, scripting, and backend integrations.",
    skills: "Python (Languages) - 90\nDjango (Backend) - 85\nREST APIs (Integration) - 88",
    projects: "Task Automation Script - Python script automating reporting pipelines - Python, Cron - https://github.com/pranil2410 - https://demo.com"
  });
  const [generatedJsonOutput, setGeneratedJsonOutput] = useState("");
  const [copiedBuilderJson, setCopiedBuilderJson] = useState(false);

  // Authenticate admin check
  useEffect(() => {
    authService.isAuthenticated().then(setIsAuthenticated);
  }, []);

  // Fetch admin configurations
  useEffect(() => {
    if (isAuthenticated) {
      dbService.getLinks().then(setLinks).catch(console.error);
      
      // Load messages
      setLoadingMessages(true);
      dbService.getMessages()
        .then(setMessages)
        .catch(console.error)
        .finally(() => setLoadingMessages(false));

      // Load analytics
      const loadAnalytics = async () => {
        try {
          const v = await dbService.getVisitorCount();
          const d = await dbService.getDownloadCounts();
          const p = await dbService.getProjectClicks();
          setAnalytics({ visitors: v, downloads: d, projectClicks: p });
        } catch (err) {
          console.error(err);
        }
      };
      loadAnalytics();

      // Load uploaded resumes metadata
      const fetchAllResumes = async () => {
        const metadata: Record<string, any> = {};
        for (const role of roles) {
          const res = await storageService.getUploadedResume(role.id);
          if (res) metadata[role.id] = res;
        }
        setUploadedResumes(metadata);
      };
      fetchAllResumes();
    }
  }, [isAuthenticated, roles]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    const success = await authService.login(password);
    if (success) {
      setIsAuthenticated(true);
      setPassword("");
    } else {
      setLoginError("Invalid password credentials. Try 'admin'.");
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    setIsAuthenticated(false);
  };

  // Save Link Configuration
  const handleSaveLinks = async (e: React.FormEvent) => {
    e.preventDefault();
    setLinksStatus("saving");
    try {
      await dbService.saveLinks(links);
      setLinksStatus("success");
      setTimeout(() => setLinksStatus("idle"), 3000);
    } catch (err) {
      console.error(err);
      setLinksStatus("error");
    }
  };

  // Run URL Validation Checks
  const runLinkValidation = async () => {
    setIsValidating(true);
    const urlsToCheck = {
      LinkedIn: links.linkedin,
      GitHub: links.github,
      Portfolio: links.portfolioUrl,
    };

    // Add first project demo URLs for validation
    roles.forEach(role => {
      if (role.projects[0]) {
        (urlsToCheck as any)[`${role.title} Demo`] = role.projects[0].demo;
      }
    });

    const results: any = {};
    const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/i;

    for (const [name, url] of Object.entries(urlsToCheck)) {
      if (!url) continue;
      
      const formatValid = urlPattern.test(url);
      results[name] = { format: formatValid, ping: "checking" };
      setValidationResults({ ...results });

      if (formatValid) {
        try {
          // Attempt fetch with no-cors. Browser CORS restricts standard requests.
          // Fetch failure might mean DNS error or offline endpoint, success means reachable.
          await fetch(url, { mode: "no-cors", credentials: "omit" });
          results[name].ping = "cors-restricted"; // Reachable but blocked by CORS
        } catch (err) {
          // A fetch error in no-cors could mean unreachable domain
          if (navigator.onLine) {
            results[name].ping = "cors-restricted"; // Standard browser behaviour for social sites
          } else {
            results[name].ping = "broken";
          }
        }
      } else {
        results[name].ping = "broken";
      }
      setValidationResults({ ...results });
      await new Promise(r => setTimeout(r, 200)); // Stagger checks
    }
    setIsValidating(false);
  };

  // Upload Resume File
  const handleResumeUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeFile) return;

    setUploadStatus("uploading");
    try {
      const metadata = await storageService.uploadResume(resumeFile, selectedResumeRole);
      setUploadedResumes(prev => ({ ...prev, [selectedResumeRole]: metadata }));
      setUploadStatus("success");
      setResumeFile(null);
      setTimeout(() => setUploadStatus("idle"), 3000);
    } catch (err) {
      console.error(err);
      setUploadStatus("error");
    }
  };

  // Generate role JSON builder output
  const handleGenerateRoleJson = () => {
    // Parse skills list
    const parsedSkills = newRoleJson.skills.split("\n").map(line => {
      const parts = line.split("-");
      const nameCat = parts[0]?.trim();
      const level = parseInt(parts[1]?.trim() || "80", 10);
      
      const nameParts = nameCat.split("(");
      const name = nameParts[0]?.trim();
      const category = nameParts[1]?.replace(")", "").trim() || "Technical";
      
      return { name, category, level };
    });

    // Parse project
    const pParts = newRoleJson.projects.split("-");
    const pTitle = pParts[0]?.trim() || "My Project";
    const pDesc = pParts[1]?.trim() || "Project description goes here";
    const pTechStr = pParts[2]?.trim() || "React, Tailwind";
    const pGithub = pParts[3]?.trim() || "https://github.com/pranil2410";
    const pDemo = pParts[4]?.trim() || "https://demo.com";

    const outputObj = {
      id: newRoleJson.id,
      name: newRoleJson.name,
      title: newRoleJson.title,
      roleIcon: newRoleJson.roleIcon,
      summary: newRoleJson.summary,
      meta: {
        title: `${newRoleJson.name} | ${newRoleJson.title} Portfolio`,
        description: newRoleJson.summary,
        keywords: [newRoleJson.title, "Portfolio", "Development"]
      },
      skills: parsedSkills,
      projects: [
        {
          id: `${newRoleJson.id}-project-1`,
          title: pTitle,
          description: pDesc,
          techStack: pTechStr.split(",").map(t => t.trim()),
          image: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?q=80&w=600",
          github: pGithub,
          demo: pDemo,
          achievements: ["Successfully deployed configuration system."],
          problemSolved: "Manual configurations are error-prone.",
          learnings: "Orchestration automation reduces deployment latency."
        }
      ],
      experience: [
        {
          role: newRoleJson.title,
          company: "Cognizant Technology Solutions",
          period: "2024 - Present",
          description: `Leading project deliveries and architecting pipelines as ${newRoleJson.title}.`
        }
      ]
    };

    setGeneratedJsonOutput(JSON.stringify(outputObj, null, 2));
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-6 grid-bg">
        <GlassCard glowColor="purple" className="w-full max-w-md" hoverScale={false}>
          <div className="flex justify-center mb-6">
            <span className="p-3.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Icons.Lock className="w-6 h-6" />
            </span>
          </div>

          <h2 className="text-2xl font-bold text-center text-foreground mb-1">Admin Portal Access</h2>
          <p className="text-xs text-muted-foreground text-center mb-6">
            Input password keys to authenticate and configure dynamic system variables.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs uppercase font-bold text-muted-foreground">Admin Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                className="w-full px-4 py-2.5 rounded-xl glass border border-border text-sm outline-none text-foreground focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>

            {loginError && (
              <p className="text-xs text-red-400 text-center font-medium">{loginError}</p>
            )}

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-primary hover:opacity-90 text-primary-foreground font-semibold text-sm cursor-pointer transition-all flex items-center justify-center gap-1.5"
            >
              Sign In <Icons.LogIn className="w-4 h-4" />
            </button>
          </form>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen relative grid-bg pt-8 pb-16 px-6">
      <SEO title="Admin Dashboard | Career Platform" description="Admin configuration panel for personal portfolio links, resumes, inquiries, and visitor statistics." />

      <section className="max-w-6xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground flex items-center justify-center md:justify-start gap-2">
            <Icons.Settings className="w-6 h-6 text-purple-400" /> Admin Control Center
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            System status: <span className="text-emerald-400 font-semibold">{isOfflineMode ? "Offline/Mock Mode" : "Firebase Connected"}</span>
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="px-4 py-2 rounded-xl border border-border hover:bg-secondary/40 text-muted-foreground hover:text-foreground text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Icons.LogOut className="w-3.5 h-3.5" /> Sign Out
        </button>
      </section>

      {/* Tabs Navigation */}
      <section className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-3">
          <GlassCard hoverScale={false} className="p-3 space-y-1">
            <h3 className="text-xs uppercase font-bold tracking-wider text-muted-foreground px-3 mb-3 mt-1">
              Configuration Modules
            </h3>

            {[
              { id: "links", label: "Link Management", icon: "Link" },
              { id: "validator", label: "Link Validator", icon: "ShieldCheck" },
              { id: "resumes", label: "Resume Manager", icon: "FileText" },
              { id: "messages", label: "Messages Inbox", icon: "Mail" },
              { id: "analytics", label: "Analytics Logs", icon: "BarChart" },
              { id: "builder", label: "Resume Builder", icon: "PlusCircle" },
              { id: "tailor", label: "JD Resume Tailor", icon: "Sparkles" },
            ].map((tab) => {
              const IconComp = (Icons as any)[tab.icon] || Icons.HelpCircle;
              const isSelected = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-3 cursor-pointer ${
                    isSelected
                      ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                      : "text-muted-foreground hover:bg-secondary/20 hover:text-foreground"
                  }`}
                >
                  <IconComp className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </GlassCard>
        </div>

        {/* Tab Content Display */}
        <div className="md:col-span-9">
          <AnimatePresence mode="wait">
            {activeTab === "links" && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                <GlassCard hoverScale={false}>
                  <h3 className="text-lg font-bold text-foreground mb-1.5 flex items-center gap-2 border-b border-border/40 pb-3">
                    <Icons.Link className="w-5 h-5 text-purple-400" /> Link Management System
                  </h3>
                  <p className="text-xs text-muted-foreground mb-6">
                    Update central profiles. These links automatically distribute across the headers, footers, resumes, and contact links.
                  </p>

                  <form onSubmit={handleSaveLinks} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground">Full Name</label>
                        <input
                          type="text"
                          value={links.name}
                          onChange={(e) => setLinks({ ...links, name: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs text-foreground focus:ring-1 focus:ring-primary outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground">LinkedIn URL</label>
                        <input
                          type="url"
                          value={links.linkedin}
                          onChange={(e) => setLinks({ ...links, linkedin: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs text-foreground focus:ring-1 focus:ring-primary outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground">GitHub URL</label>
                        <input
                          type="url"
                          value={links.github}
                          onChange={(e) => setLinks({ ...links, github: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs text-foreground focus:ring-1 focus:ring-primary outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground">WhatsApp Link</label>
                        <input
                          type="url"
                          value={links.whatsapp}
                          onChange={(e) => setLinks({ ...links, whatsapp: e.target.value })}
                          placeholder="https://wa.me/..."
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs text-foreground focus:ring-1 focus:ring-primary outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground">Inquiry Email</label>
                        <input
                          type="email"
                          value={links.email}
                          onChange={(e) => setLinks({ ...links, email: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs text-foreground focus:ring-1 focus:ring-primary outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground">Portfolio URL</label>
                        <input
                          type="url"
                          value={links.portfolioUrl}
                          onChange={(e) => setLinks({ ...links, portfolioUrl: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs text-foreground focus:ring-1 focus:ring-primary outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={linksStatus === "saving"}
                      className="w-full py-2.5 rounded-lg bg-primary hover:opacity-90 text-primary-foreground font-semibold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {linksStatus === "saving" ? "Saving..." : "Update Profiles Configuration"}
                    </button>

                    {linksStatus === "success" && (
                      <p className="text-[11px] text-emerald-400 text-center mt-2 font-medium">Links successfully updated global configurations!</p>
                    )}
                  </form>
                </GlassCard>
              </motion.div>
            )}

            {activeTab === "validator" && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                <GlassCard hoverScale={false}>
                  <h3 className="text-lg font-bold text-foreground mb-1.5 flex items-center gap-2 border-b border-border/40 pb-3">
                    <Icons.ShieldCheck className="w-5 h-5 text-purple-400" /> Link Verification System
                  </h3>
                  <p className="text-xs text-muted-foreground mb-6">
                    Validate syntax rules and reachability status for external references (handling CORS limitations).
                  </p>

                  <button
                    onClick={runLinkValidation}
                    disabled={isValidating}
                    className="mb-6 px-4 py-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 font-bold text-xs flex items-center gap-1.5 cursor-pointer hover:bg-purple-500/20"
                  >
                    {isValidating ? (
                      <>
                        <Icons.Loader2 className="w-4.5 h-4.5 animate-spin" /> Running Link Verification...
                      </>
                    ) : (
                      <>
                        <Icons.RefreshCw className="w-4 h-4" /> Run Live Diagnostics
                      </>
                    )}
                  </button>

                  <div className="space-y-3">
                    {Object.keys(validationResults).length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-6">
                        No logs recorded. Click "Run Live Diagnostics" to begin.
                      </p>
                    ) : (
                      Object.entries(validationResults).map(([name, status]) => (
                        <div key={name} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/25 text-xs">
                          <div>
                            <strong className="text-foreground font-bold">{name} Link</strong>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              Format: {status.format ? <span className="text-emerald-400">Valid</span> : <span className="text-red-400">Invalid</span>}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {status.ping === "checking" && (
                              <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/15 flex items-center gap-1">
                                <Icons.Loader2 className="w-3 h-3 animate-spin" /> Pinging...
                              </span>
                            )}
                            {status.ping === "cors-restricted" && (
                              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 flex items-center gap-1">
                                <Icons.CheckCircle className="w-3 h-3" /> Validated (CORS Verified)
                              </span>
                            )}
                            {status.ping === "broken" && (
                              <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/15 flex items-center gap-1">
                                <Icons.AlertCircle className="w-3 h-3" /> Broken Link
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </GlassCard>
              </motion.div>
            )}

            {activeTab === "resumes" && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                <GlassCard hoverScale={false}>
                  <h3 className="text-lg font-bold text-foreground mb-1.5 flex items-center gap-2 border-b border-border/40 pb-3">
                    <Icons.FileText className="w-5 h-5 text-purple-400" /> Resume Management Hub
                  </h3>
                  <p className="text-xs text-muted-foreground mb-6">
                    Upload resumes (PDF/DOCX support). Files are stored directly in Firebase Storage or serialized locally.
                  </p>

                  <form onSubmit={handleResumeUpload} className="space-y-4 border-b border-border pb-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground">Select Career Role</label>
                        <select
                          value={selectedResumeRole}
                          onChange={(e) => setSelectedResumeRole(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs text-foreground cursor-pointer outline-none [&>option]:bg-background"
                        >
                          {roles.map(r => (
                            <option key={r.id} value={r.id}>{r.title}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground">Resume File (PDF/DOCX)</label>
                        <input
                          type="file"
                          accept=".pdf,.docx"
                          required
                          onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                          className="w-full px-3 py-1 rounded-lg border border-border bg-background text-xs text-muted-foreground outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={uploadStatus === "uploading"}
                      className="px-5 py-2.5 bg-primary hover:opacity-95 text-primary-foreground font-semibold rounded-lg text-xs cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {uploadStatus === "uploading" ? "Uploading file..." : "Upload & Associate Resume"}
                    </button>

                    {uploadStatus === "success" && (
                      <p className="text-[11px] text-emerald-400 font-medium">File successfully linked to role metadata!</p>
                    )}
                  </form>

                  <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-3">Active Linked Resumes</h4>
                  <div className="space-y-2.5">
                    {roles.map((role) => {
                      const res = uploadedResumes[role.id];
                      return (
                        <div key={role.id} className="flex justify-between items-center p-3 rounded-lg border border-border bg-card/10 text-xs">
                          <div>
                            <strong className="text-foreground">{role.title}</strong>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {res ? `${res.name} (${res.size})` : "Default Mock text-download"}
                            </p>
                          </div>
                          
                          {res ? (
                            <span className="px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 font-mono text-[9px]">
                              Active Upload
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded bg-secondary text-muted-foreground font-mono text-[9px]">
                              Fallback Mock
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </GlassCard>
              </motion.div>
            )}

            {activeTab === "messages" && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                <GlassCard hoverScale={false}>
                  <h3 className="text-lg font-bold text-foreground mb-1.5 flex items-center gap-2 border-b border-border/40 pb-3">
                    <Icons.Mail className="w-5 h-5 text-purple-400" /> Inquiries Messages Inbox
                  </h3>
                  <p className="text-xs text-muted-foreground mb-6">
                    Review inquiries sent through landing page or role profile forms.
                  </p>

                  {loadingMessages ? (
                    <div className="flex justify-center items-center py-12">
                      <Icons.Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                    </div>
                  ) : messages.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-8">
                      No customer inquiries or emails received yet.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((msg, idx) => (
                        <div key={idx} className="p-4 rounded-xl border border-border bg-card/25 space-y-2">
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-1 border-b border-border/30 pb-2">
                            <div>
                              <strong className="text-foreground text-sm">{msg.name}</strong>
                              <span className="text-xs text-muted-foreground ml-2">({msg.email})</span>
                            </div>
                            <span className="text-[10px] font-mono text-purple-400">
                              {new Date(msg.timestamp).toLocaleString()}
                            </span>
                          </div>
                          
                          <div className="text-xs">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">Target Context:</span>
                            <span className="ml-1.5 text-foreground">{msg.role || "General Inquiry"}</span>
                          </div>

                          <p className="text-xs text-muted-foreground/90 mt-2 bg-black/20 p-2.5 rounded-lg font-mono whitespace-pre-wrap leading-relaxed">
                            {msg.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </GlassCard>
              </motion.div>
            )}

            {activeTab === "analytics" && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                <GlassCard hoverScale={false}>
                  <h3 className="text-lg font-bold text-foreground mb-1.5 flex items-center gap-2 border-b border-border/40 pb-3">
                    <Icons.BarChart className="w-5 h-5 text-purple-400" /> Dynamic Analytics Dashboard
                  </h3>
                  <p className="text-xs text-muted-foreground mb-6">
                    Analyze traffic logs: profile visits, click-through actions, and resume download rates.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="p-4 rounded-xl border border-border bg-card/25 text-center">
                      <Icons.Eye className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                      <span className="text-[10px] text-muted-foreground uppercase font-mono">Total Page Views</span>
                      <div className="text-2xl font-extrabold text-foreground mt-1">{analytics.visitors}</div>
                    </div>

                    <div className="p-4 rounded-xl border border-border bg-card/25 text-center col-span-2">
                      <Icons.Download className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                      <span className="text-[10px] text-muted-foreground uppercase font-mono">Resume Downloads</span>
                      <div className="flex justify-center gap-6 mt-1 flex-wrap">
                        {roles.map(r => (
                          <div key={r.id} className="text-xs">
                            <strong className="text-foreground">{analytics.downloads[r.id] || 0}</strong>
                            <span className="text-[10px] text-muted-foreground block">{r.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-3">Project Clicks Analytics</h4>
                  <div className="space-y-2">
                    {roles.flatMap(r => r.projects).map((p) => {
                      const count = analytics.projectClicks[p.id] || 0;
                      return (
                        <div key={p.id} className="flex justify-between items-center p-3 rounded-lg border border-border bg-card/10 text-xs">
                          <span className="font-medium text-foreground">{p.title}</span>
                          <span className="font-mono text-purple-400 font-bold">{count} clicks</span>
                        </div>
                      );
                    })}
                  </div>
                </GlassCard>
              </motion.div>
            )}

            {activeTab === "builder" && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                <GlassCard hoverScale={false}>
                  <h3 className="text-lg font-bold text-foreground mb-1.5 flex items-center gap-2 border-b border-border/40 pb-3">
                    <Icons.PlusCircle className="w-5 h-5 text-purple-400" /> Career Profile Builder
                  </h3>
                  <p className="text-xs text-muted-foreground mb-6">
                    Configure a brand-new role JSON. Add it to the codebase directory to generate a new page instantly.
                  </p>

                  <div className="space-y-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground">Role ID (e.g. cloud-engineer)</label>
                        <input
                          type="text"
                          value={newRoleJson.id}
                          onChange={(e) => setNewRoleJson({ ...newRoleJson, id: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs text-foreground outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground">Job Title</label>
                        <input
                          type="text"
                          value={newRoleJson.title}
                          onChange={(e) => setNewRoleJson({ ...newRoleJson, title: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs text-foreground outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground">Icon (Lucide name)</label>
                        <input
                          type="text"
                          value={newRoleJson.roleIcon}
                          onChange={(e) => setNewRoleJson({ ...newRoleJson, roleIcon: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs text-foreground outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-muted-foreground">Professional Summary</label>
                      <textarea
                        value={newRoleJson.summary}
                        onChange={(e) => setNewRoleJson({ ...newRoleJson, summary: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs text-foreground outline-none resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground">
                          Skills List (Format: Name (Category) - Level)
                        </label>
                        <textarea
                          value={newRoleJson.skills}
                          onChange={(e) => setNewRoleJson({ ...newRoleJson, skills: e.target.value })}
                          rows={4}
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background font-mono text-xs text-foreground outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground">
                          Project details (Format: Title - Desc - Techs - Git - Demo)
                        </label>
                        <textarea
                          value={newRoleJson.projects}
                          onChange={(e) => setNewRoleJson({ ...newRoleJson, projects: e.target.value })}
                          rows={4}
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background font-mono text-xs text-foreground outline-none"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleGenerateRoleJson}
                      className="px-5 py-2.5 bg-primary hover:opacity-95 text-primary-foreground font-semibold rounded-lg text-xs cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Icons.FileCode className="w-4 h-4" /> Generate Profile JSON
                    </button>
                  </div>

                  {generatedJsonOutput && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center bg-black/20 px-3 py-1.5 rounded-lg border border-border/40">
                        <span className="text-[10px] font-mono text-muted-foreground">
                          Save as: src/data/roles/{newRoleJson.id}.json
                        </span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(generatedJsonOutput);
                            setCopiedBuilderJson(true);
                            setTimeout(() => setCopiedBuilderJson(false), 2000);
                          }}
                          className="text-[10px] text-purple-400 font-bold flex items-center gap-1 hover:text-purple-300 transition-colors"
                        >
                          <Icons.Copy className="w-3 h-3" /> {copiedBuilderJson ? "Copied!" : "Copy JSON"}
                        </button>
                      </div>
                      <pre className="p-4 rounded-xl border border-border bg-black/40 text-xs font-mono text-emerald-400 overflow-x-auto max-h-72">
                        {generatedJsonOutput}
                      </pre>
                    </div>
                  )}
                </GlassCard>
              </motion.div>
            )}

            {activeTab === "tailor" && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                <GlassCard hoverScale={false}>
                  <h3 className="text-lg font-bold text-foreground mb-1.5 flex items-center gap-2 border-b border-border/40 pb-3">
                    <Icons.Sparkles className="w-5 h-5 text-purple-400" /> JD Resume Tailor & ATS Scanner
                  </h3>
                  <p className="text-xs text-muted-foreground mb-6">
                    Paste a Job Description (JD) to analyze your profile suitability, calculate a match score, and generate a tailored summary/skills matrix.
                  </p>

                  <div className="space-y-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground">Target Role Profile</label>
                        <select
                          value={selectedJdRole}
                          onChange={(e) => {
                            setSelectedJdRole(e.target.value);
                            setAtsScore(null);
                            setAtsAnalysis(null);
                            setTailoredSummary("");
                            setTailoredSkills([]);
                            setIsTailoringApplied(false);
                          }}
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs text-foreground cursor-pointer outline-none [&>option]:bg-background"
                        >
                          {roles.map(r => (
                            <option key={r.id} value={r.id}>{r.title}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-end gap-2">
                        <button
                          onClick={() => resetRoleToDefault(selectedJdRole)}
                          className="px-4 py-2 rounded-lg border border-red-500/30 bg-red-500/5 hover:bg-red-500/10 text-red-400 text-xs font-semibold cursor-pointer transition-colors"
                          title="Restore default profile details from static files"
                        >
                          Reset Profile to Code Defaults
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-muted-foreground">Job Description (JD)</label>
                      <textarea
                        value={jdText}
                        onChange={(e) => setJdText(e.target.value)}
                        placeholder="Paste the Job Description keywords and details here..."
                        rows={6}
                        className="w-full px-4 py-3 rounded-lg border border-border bg-background text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    <button
                      onClick={runAtsAnalysis}
                      disabled={isAnalyzingJd || !jdText.trim()}
                      className="px-5 py-2.5 bg-primary hover:opacity-95 text-primary-foreground font-semibold rounded-lg text-xs cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isAnalyzingJd ? (
                        <>
                          <Icons.Loader2 className="w-4 h-4 animate-spin" /> Scanning JD suitability...
                        </>
                      ) : (
                        <>
                          <Icons.Activity className="w-4 h-4" /> Calculate ATS Score & Tailor
                        </>
                      )}
                    </button>
                  </div>

                  {/* ATS Results View */}
                  {atsScore !== null && (
                    <div className="space-y-6 border-t border-border/40 pt-6 animate-in fade-in duration-300">
                      <div className="flex flex-col md:flex-row items-center gap-6 p-4 rounded-xl border border-border bg-card/25">
                        {/* Circle Score */}
                        <div className="relative flex items-center justify-center w-20 h-20 rounded-full border-4 border-secondary shrink-0">
                          <span className={`text-xl font-black ${
                            atsScore >= 75 ? "text-emerald-400" : atsScore >= 50 ? "text-yellow-400" : "text-red-400"
                          }`}>
                            {atsScore}%
                          </span>
                          <span className="text-[8px] uppercase font-bold text-muted-foreground absolute bottom-2">ATS Score</span>
                        </div>

                        <div className="space-y-2">
                          <h4 className="text-sm font-bold text-foreground">Suitability Diagnostics Analysis</h4>
                          <div className="text-xs text-muted-foreground space-y-1">
                            <p>Matched Keywords: <span className="text-emerald-400 font-medium">{atsAnalysis?.matchedSkills?.join(", ") || "None"}</span></p>
                            <p>Missing Keywords: <span className="text-red-400 font-medium">{atsAnalysis?.missingSkills?.join(", ") || "None"}</span></p>
                          </div>
                        </div>
                      </div>

                      {/* Recommendations */}
                      <div className="space-y-2.5">
                        <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Optimizations Recommendations</h4>
                        <div className="space-y-1.5">
                          {atsAnalysis?.recommendations?.map((rec: string, rIdx: number) => (
                            <div key={rIdx} className="flex items-start gap-2 text-xs text-muted-foreground bg-secondary/10 p-2.5 rounded-lg border border-border/30">
                              <Icons.ChevronRight className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                              <span>{rec}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Auto Tailor Results Preview */}
                      <div className="space-y-4 border-t border-border/40 pt-6">
                        <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                          <Icons.Sparkles className="w-4.5 h-4.5 text-purple-400" /> Tailored Profile Preview (JD Customized)
                        </h4>
                        
                        <div className="space-y-3.5">
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-muted-foreground">Suggested Summary Overwrite</label>
                            <textarea
                              value={tailoredSummary}
                              onChange={(e) => setTailoredSummary(e.target.value)}
                              rows={4}
                              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs text-foreground outline-none resize-none focus:ring-1 focus:ring-primary"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-muted-foreground">Prioritized Skills Order</label>
                            <div className="flex flex-wrap gap-1.5 p-3 rounded-lg border border-border bg-black/20">
                              {tailoredSkills.map((sk, sIdx) => (
                                <span key={sIdx} className="text-[10px] font-mono px-2 py-0.5 rounded border border-border/60 bg-secondary/35 text-foreground/80 flex items-center gap-1">
                                  {sk.name} <strong className="text-purple-400 font-bold">{sk.level}%</strong>
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 pt-2">
                          <button
                            onClick={applyTailoredChanges}
                            disabled={isTailoringApplied}
                            className="w-full py-2.5 bg-primary hover:opacity-95 text-primary-foreground font-semibold rounded-lg text-xs cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Icons.CheckCircle className="w-4 h-4" /> 
                            {isTailoringApplied ? "Tailored Modifications Applied Globally!" : "Apply Tailored Profile & Resume Globally"}
                          </button>
                          
                          {isTailoringApplied && (
                            <p className="text-[10px] text-emerald-400 text-center font-medium animate-pulse">
                              Success! Profile overrides saved. The homepage resume summaries, skills matrices, and comparison tables will immediately render this JD-tailored configuration.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
};

export default AdminPage;
