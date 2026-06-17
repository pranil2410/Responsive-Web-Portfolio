import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import * as Icons from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getRoleById } from "../utils/roleLoader";
import type { RoleConfig } from "../utils/roleLoader";
import { dbService, storageService } from "../config/firebase";
import GlassCard from "../components/GlassCard";
import SEO from "../components/SEO";
import { downloadMockPDF } from "../utils/pdfGenerator";

export const ProfilePage: React.FC = () => {
  const { roleId } = useParams<{ roleId: string }>();
  const [role, setRole] = useState<RoleConfig | null>(null);
  const [downloadCount, setDownloadCount] = useState(0);
  const [customResume, setCustomResume] = useState<any>(null);
  
  // Software Developer Specifics (GitHub repos)
  const [githubRepos, setGithubRepos] = useState<any[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);

  // GenAI Specifics (Prompt Sandbox)
  const [selectedPromptIdx, setSelectedPromptIdx] = useState(0);
  const [customPromptInput, setCustomPromptInput] = useState("");
  const [promptOutput, setPromptOutput] = useState("");
  const [isSimulatingAI, setIsSimulatingAI] = useState(false);

  // Data Analyst Specifics (Dashboard Gallery Preview)
  const [activeDashboardIdx, setActiveDashboardIdx] = useState<number | null>(null);

  // Load profile data
  useEffect(() => {
    if (roleId) {
      const data = getRoleById(roleId);
      if (data) {
        setRole(data);
        
        // Reset states
        setPromptOutput("");
        setCustomPromptInput(data.promptShowcase?.[0]?.userInput || "");
        setSelectedPromptIdx(0);
        setActiveDashboardIdx(null);

        // Fetch resume download count
        dbService.getDownloadCounts()
          .then((counts) => setDownloadCount(counts[roleId] || 0))
          .catch(console.error);

        // Check if custom resume exists
        storageService.getUploadedResume(roleId)
          .then(setCustomResume)
          .catch(console.error);

        // Fetch GitHub Repos if Software Developer
        if (roleId === "software-developer") {
          setLoadingRepos(true);
          fetch("https://api.github.com/users/pranil2410/repos?sort=updated&per_page=6")
            .then((res) => res.json())
            .then((repos) => {
              if (Array.isArray(repos)) {
                setGithubRepos(repos.filter(r => !r.fork).slice(0, 4));
              }
            })
            .catch(console.error)
            .finally(() => setLoadingRepos(false));
        }
      } else {
        setRole(null);
      }
    }
  }, [roleId]);

  if (!role) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 grid-bg">
        <Icons.AlertTriangle className="w-16 h-16 text-yellow-500 mb-4 animate-bounce" />
        <h2 className="text-3xl font-extrabold text-foreground mb-2">Profile Not Found</h2>
        <p className="text-muted-foreground mb-6">The requested career path does not exist or has not been loaded.</p>
        <Link to="/" className="px-5 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90 transition-all flex items-center gap-2">
          <Icons.Home className="w-4 h-4" /> Go Back Home
        </Link>
      </div>
    );
  }

  // Handle resume download click
  const handleDownload = async () => {
    try {
      const freshCount = await dbService.incrementDownloadCount(role.id);
      setDownloadCount(freshCount);
    } catch (err) {
      console.error("Error logging download:", err);
    }

    // Determine download link
    const downloadUrl = customResume?.downloadUrl || "#";
    if (downloadUrl === "#") {
      downloadMockPDF(role);
    } else {
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.target = "_blank";
      link.download = customResume?.name || `Pranil_Belge_Resume_${role.id}.pdf`;
      link.click();
    }
  };

  // Run AI prompt simulation
  const runPromptSimulation = () => {
    if (!role.promptShowcase) return;
    setIsSimulatingAI(true);
    setPromptOutput("");
    
    const targetPrompt = role.promptShowcase[selectedPromptIdx];
    
    // Simulate generation with typewriter effect
    setTimeout(() => {
      setIsSimulatingAI(false);
      let outputText = targetPrompt.output;
      if (customPromptInput !== targetPrompt.userInput) {
        outputText = `/* [Simulated AI response for customized input] */\n-- Input processed under constraint: ${targetPrompt.concept}\n-- Resulting outputs will match: ${targetPrompt.name}\n\n` + targetPrompt.output;
      }
      
      let currentIdx = 0;
      const interval = setInterval(() => {
        setPromptOutput((prev) => prev + outputText[currentIdx]);
        currentIdx++;
        if (currentIdx >= outputText.length) {
          clearInterval(interval);
        }
      }, 15);
    }, 1200);
  };

  const DynamicIcon = ({ name, className = "w-5 h-5 text-primary" }: { name: string; className?: string }) => {
    const IconComponent = (Icons as any)[name] || Icons.User;
    return <IconComponent className={className} />;
  };

  return (
    <div className="w-full min-h-screen relative grid-bg pt-8 pb-16 px-6">
      <SEO 
        title={`${role.name} | ${role.title} Portfolio`} 
        description={role.summary}
        keywords={role.meta.keywords}
        roleId={role.id}
      />

      {/* Header Widget */}
      <section className="max-w-5xl mx-auto mb-12">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <Icons.ArrowLeft className="w-4 h-4" /> Back to Directory
        </Link>

        <GlassCard hoverScale={false} glowColor="purple" className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4 text-center md:text-left flex-col md:flex-row">
              <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <DynamicIcon name={role.roleIcon} className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-1">{role.name}</h1>
                <p className="text-lg text-purple-400 font-semibold tracking-wide">{role.title}</p>
                <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center md:justify-start gap-1">
                  <Icons.MapPin className="w-3 h-3" /> Mumbai, India
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center md:items-end gap-2.5">
              <button
                onClick={handleDownload}
                className="px-6 py-3 rounded-xl bg-primary hover:bg-primary-foreground/90 text-primary-foreground font-semibold text-sm transition-all duration-200 cursor-pointer shadow-md hover:shadow-purple-500/20 flex items-center gap-2"
              >
                <Icons.Download className="w-4 h-4" /> Download Resume
              </button>
              <span className="text-[11px] font-mono text-muted-foreground">
                Downloaded <strong className="text-foreground">{downloadCount}</strong> times
                {customResume && <span className="text-purple-400"> (Verified {customResume.size})</span>}
              </span>
            </div>
          </div>

          <div className="border-t border-border/40 mt-6 pt-6 text-sm md:text-base text-muted-foreground/90 leading-relaxed text-center md:text-left">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Professional Summary</h3>
            {role.summary}
          </div>
        </GlassCard>
      </section>

      {/* Grid: Skills & Certifications */}
      <section className="max-w-5xl mx-auto mb-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Skills progress section */}
          <div className="md:col-span-6">
            <GlassCard hoverScale={false} className="h-full">
              <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                <Icons.Cpu className="w-5 h-5 text-purple-400" /> Expertise Matrix
              </h3>
              
              <div className="space-y-4">
                {role.skills.map((skill, index) => (
                  <div key={index} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-foreground">{skill.name}</span>
                      <span className="text-muted-foreground">{skill.level}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-secondary/40 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${skill.level}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>

          {/* Certifications list */}
          <div className="md:col-span-6">
            {role.certifications && role.certifications.length > 0 ? (
              <GlassCard hoverScale={false} className="h-full">
                <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  <Icons.Award className="w-5 h-5 text-purple-400" /> Certifications
                </h3>
                <div className="space-y-4">
                  {role.certifications.map((cert, idx) => (
                    <div key={idx} className="p-3 rounded-xl border border-border/40 bg-secondary/15 flex items-start gap-3">
                      <Icons.FileBadge className="w-5 h-5 text-purple-400 mt-0.5 shrink-0" />
                      <div>
                        <h4 className="text-xs font-bold text-foreground">{cert.name}</h4>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{cert.issuer} ({cert.date})</p>
                        {cert.credentialId && (
                          <p className="text-[10px] text-muted-foreground font-mono mt-1">ID: {cert.credentialId}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            ) : (
              <GlassCard hoverScale={false} className="h-full flex flex-col justify-center items-center text-center p-6">
                <Icons.Award className="w-12 h-12 text-muted-foreground/40 mb-3" />
                <h4 className="text-sm font-bold text-foreground">Certifications</h4>
                <p className="text-xs text-muted-foreground mt-1">Professional certifications will be listed here.</p>
              </GlassCard>
            )}
          </div>
        </div>
      </section>

      {/* Dynamic Features Panel */}
      <section className="max-w-5xl mx-auto mb-12">
        {/* GenAI Engineer Features */}
        {role.id === "genai-engineer" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Prompt Engineering Simulator */}
            {role.promptShowcase && (
              <GlassCard hoverScale={false} glowColor="purple" className="flex flex-col h-full">
                <h3 className="text-lg font-bold text-foreground mb-1.5 flex items-center gap-2">
                  <Icons.Cpu className="w-5 h-5 text-purple-400" /> Prompt Engineering Showcase
                </h3>
                <p className="text-xs text-muted-foreground mb-6">
                  Select a template context to try simulated outputs from structured LLM requests.
                </p>

                <div className="flex gap-2 mb-4 overflow-x-auto pb-1.5">
                  {role.promptShowcase.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedPromptIdx(idx);
                        setCustomPromptInput(prompt.userInput);
                        setPromptOutput("");
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border cursor-pointer transition-colors ${
                        selectedPromptIdx === idx
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-border hover:bg-secondary/40 text-muted-foreground"
                      }`}
                    >
                      {prompt.name}
                    </button>
                  ))}
                </div>

                <div className="space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2 text-xs">
                    <div className="p-3 rounded-lg border border-border bg-secondary/10">
                      <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">System Instruction</span>
                      <p className="text-muted-foreground/90 font-mono mt-1 leading-relaxed">
                        {role.promptShowcase[selectedPromptIdx].systemPrompt}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">User Input</span>
                      <textarea
                        value={customPromptInput}
                        onChange={(e) => setCustomPromptInput(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background font-mono text-foreground focus:ring-1 focus:ring-primary focus:border-primary resize-none outline-none"
                      />
                    </div>
                  </div>

                  <div className="mt-4 space-y-4">
                    <button
                      onClick={runPromptSimulation}
                      disabled={isSimulatingAI}
                      className="w-full py-2 bg-primary hover:opacity-90 text-primary-foreground font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isSimulatingAI ? (
                        <>
                          <Icons.Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Simulating Model Run...
                        </>
                      ) : (
                        <>
                          <Icons.Play className="w-3.5 h-3.5" />
                          Run Prompt Model
                        </>
                      )}
                    </button>

                    <div className="p-3.5 rounded-lg border border-border bg-black/40 text-xs font-mono min-h-24 max-h-48 overflow-y-auto leading-relaxed relative">
                      <span className="absolute top-2 right-2 text-[9px] font-bold uppercase tracking-wider text-muted-foreground/40">Prompt Output</span>
                      <pre className="whitespace-pre-wrap text-emerald-400 font-mono">
                        {promptOutput || "Click 'Run Prompt Model' to simulate completions."}
                      </pre>
                    </div>
                  </div>
                </div>
              </GlassCard>
            )}

            {/* Architecture Diagrams */}
            {role.workflows && (
              <GlassCard hoverScale={false} className="flex flex-col h-full">
                <h3 className="text-lg font-bold text-foreground mb-1.5 flex items-center gap-2">
                  <Icons.Workflow className="w-5 h-5 text-purple-400" /> AI Systems Workflows
                </h3>
                <p className="text-xs text-muted-foreground mb-6">
                  Interactive operational flow representation of GenAI application processes.
                </p>

                <div className="space-y-6 flex-1 flex flex-col justify-center">
                  {role.workflows.map((flow, flowIdx) => (
                    <div key={flowIdx} className="space-y-3.5">
                      <h4 className="text-xs font-bold text-foreground uppercase border-l-2 border-purple-500 pl-2">
                        {flow.title}
                      </h4>
                      <div className="flex flex-col gap-2">
                        {flow.steps.map((step, stepIdx) => (
                          <div key={stepIdx} className="flex items-start gap-3 text-xs">
                            <span className="w-5 h-5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 font-bold flex items-center justify-center shrink-0 mt-0.5 font-mono text-[10px]">
                              {stepIdx + 1}
                            </span>
                            <div>
                              <strong className="text-foreground">{step.name}</strong>
                              <p className="text-muted-foreground text-[11px] mt-0.5">{step.detail}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}
          </div>
        )}

        {/* Data Analyst Features */}
        {role.id === "data-analyst" && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Case Studies */}
            {role.caseStudies && (
              <div className="md:col-span-6 space-y-4">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2 px-2">
                  <Icons.TrendingUp className="w-5 h-5 text-purple-400" /> Analytical Case Studies
                </h3>
                {role.caseStudies.map((cs, idx) => (
                  <GlassCard key={idx} hoverScale={false}>
                    <h4 className="text-sm font-bold text-purple-400 mb-2 border-b border-border pb-1.5 flex items-center gap-1.5">
                      <Icons.FileText className="w-4 h-4" /> {cs.title}
                    </h4>
                    <div className="space-y-2.5 text-xs mt-3">
                      <div>
                        <span className="text-[10px] font-bold text-foreground uppercase tracking-wide">Business Case:</span>
                        <p className="text-muted-foreground mt-0.5">{cs.background}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-foreground uppercase tracking-wide">Methodology:</span>
                        <p className="text-muted-foreground mt-0.5">{cs.methodology}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-foreground uppercase tracking-wide">Business Results:</span>
                        <p className="text-muted-foreground mt-0.5 text-emerald-400 font-medium">{cs.results}</p>
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            )}

            {/* Dashboard Embed Gallery */}
            {role.dashboardGallery && (
              <div className="md:col-span-6 flex flex-col gap-4">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2 px-2">
                  <Icons.Layers className="w-5 h-5 text-purple-400" /> BI Dashboard Gallery
                </h3>
                
                <div className="grid grid-cols-1 gap-4 flex-1">
                  {role.dashboardGallery.map((dash, idx) => (
                    <GlassCard key={idx} hoverScale={false} className="flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="text-sm font-bold text-foreground">{dash.title}</h4>
                          <span className="text-[9px] font-mono uppercase border border-border px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400">
                            {dash.platform}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground/90 leading-relaxed mb-4">{dash.description}</p>
                        
                        {/* Interactive dashboard visualization mock */}
                        <div className="w-full aspect-video rounded-xl bg-black/60 border border-border overflow-hidden relative group flex items-center justify-center">
                          <img 
                            src={dash.screenshot} 
                            alt={dash.title} 
                            className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all duration-300"></div>
                          
                          <button
                            onClick={() => setActiveDashboardIdx(activeDashboardIdx === idx ? null : idx)}
                            className="px-4 py-2 rounded-lg bg-primary hover:bg-opacity-95 text-primary-foreground font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer z-10"
                          >
                            <Icons.Eye className="w-3.5 h-3.5" /> 
                            {activeDashboardIdx === idx ? "Hide Interactive View" : "Explore Dashboard Preview"}
                          </button>
                        </div>
                      </div>

                      {/* Interactive Power BI Mock Overlay */}
                      <AnimatePresence>
                        {activeDashboardIdx === idx && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="w-full mt-4 p-3 rounded-lg border border-purple-500/20 bg-secondary/10 text-xs overflow-hidden"
                          >
                            <div className="flex items-center justify-between border-b border-border/40 pb-2 mb-2">
                              <span className="font-semibold text-purple-400">Interactive Preview Simulation</span>
                              <span className="text-[10px] text-muted-foreground font-mono">Status: Connected</span>
                            </div>
                            
                            {/* A mockup of a dashboard utilizing metrics charts */}
                            <div className="space-y-3 p-1">
                              <div className="grid grid-cols-3 gap-2">
                                <div className="p-2 rounded bg-black/30 text-center border border-border/20">
                                  <span className="text-[9px] text-muted-foreground uppercase">Revenue</span>
                                  <div className="font-bold text-foreground mt-0.5">$1.2M</div>
                                </div>
                                <div className="p-2 rounded bg-black/30 text-center border border-border/20">
                                  <span className="text-[9px] text-muted-foreground uppercase">Growth YoY</span>
                                  <div className="font-bold text-emerald-400 mt-0.5">+24.5%</div>
                                </div>
                                <div className="p-2 rounded bg-black/30 text-center border border-border/20">
                                  <span className="text-[9px] text-muted-foreground uppercase">Active Cust</span>
                                  <div className="font-bold text-foreground mt-0.5">14,291</div>
                                </div>
                              </div>
                              
                              <div className="h-16 rounded bg-black/30 border border-border/20 flex flex-col justify-end p-1.5">
                                <span className="text-[9px] text-muted-foreground absolute top-1.5">Monthly Sales trend</span>
                                <div className="flex items-end justify-between h-8 gap-1 pt-2">
                                  <div className="h-3 w-full bg-purple-500/80 rounded-t"></div>
                                  <div className="h-4 w-full bg-purple-500/80 rounded-t"></div>
                                  <div className="h-6 w-full bg-purple-500/80 rounded-t"></div>
                                  <div className="h-5 w-full bg-purple-500/80 rounded-t"></div>
                                  <div className="h-7 w-full bg-purple-500/80 rounded-t"></div>
                                  <div className="h-8 w-full bg-gradient-to-t from-purple-500 to-pink-500 rounded-t"></div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </GlassCard>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Projects Section */}
      <section className="max-w-5xl mx-auto mb-12">
        <h3 className="text-xl font-bold text-foreground mb-8 flex items-center gap-2 px-2">
          <Icons.Code className="w-5 h-5 text-purple-400" /> Featured Projects
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {role.projects.map((proj) => (
            <GlassCard key={proj.id} glowColor="none" hoverScale={false} className="flex flex-col justify-between h-full hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
              <div>
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/40">
                  <h4 className="text-base font-bold text-foreground tracking-wide flex items-center gap-2">
                    <Icons.FolderOpen className="w-4 h-4 text-purple-400" /> {proj.title}
                  </h4>
                  <div className="flex gap-2">
                    <a
                      href={proj.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg border border-border hover:bg-secondary/40 text-muted-foreground hover:text-foreground transition-colors"
                      title="GitHub Code"
                    >
                      <Icons.Github className="w-4 h-4" />
                    </a>
                    <a
                      href={proj.demo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg border border-border hover:bg-secondary/40 text-muted-foreground hover:text-foreground transition-colors"
                      title="Live Demo"
                    >
                      <Icons.ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground/90 leading-relaxed mb-4">{proj.description}</p>

                {/* Achievements, Problem Solved, Learnings */}
                <div className="space-y-3 mb-6">
                  {proj.problemSolved && (
                    <div className="text-xs">
                      <strong className="text-foreground/80 block">Problem Solved:</strong>
                      <span className="text-muted-foreground">{proj.problemSolved}</span>
                    </div>
                  )}
                  {proj.learnings && (
                    <div className="text-xs">
                      <strong className="text-foreground/80 block">Key Learnings:</strong>
                      <span className="text-muted-foreground">{proj.learnings}</span>
                    </div>
                  )}
                  {proj.achievements && proj.achievements.length > 0 && (
                    <div className="text-xs">
                      <strong className="text-foreground/80 block">Achievements:</strong>
                      <ul className="list-disc list-inside text-muted-foreground pl-1 space-y-0.5">
                        {proj.achievements.map((ach, aIdx) => (
                          <li key={aIdx}>{ach}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className="flex flex-wrap gap-1 border-t border-border/30 pt-3 mt-auto">
                  {proj.techStack.map((tech, tIdx) => (
                    <span
                      key={tIdx}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/10"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* GitHub Repository Feed (Only for Software Developer) */}
      {role.id === "software-developer" && (
        <section className="max-w-5xl mx-auto mb-12">
          <div className="flex items-center justify-between mb-8 px-2">
            <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Icons.GitBranch className="w-5 h-5 text-purple-400" /> GitHub Repository Hub
            </h3>
            <span className="text-[10px] font-mono text-muted-foreground">Source: api.github.com</span>
          </div>

          {loadingRepos ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Icons.Loader2 className="w-8 h-8 animate-spin text-purple-500 mb-2" />
              <p className="text-sm">Fetching public repositories...</p>
            </div>
          ) : githubRepos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {githubRepos.map((repo) => (
                <div
                  key={repo.id}
                  className="p-4 rounded-xl border border-border bg-card/25 hover:border-purple-500/20 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start">
                      <a
                        href={repo.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-bold text-foreground hover:text-primary transition-colors flex items-center gap-1.5"
                      >
                        <Icons.BookOpen className="w-4 h-4 text-purple-400 shrink-0" />
                        <span className="truncate max-w-[200px]">{repo.name}</span>
                      </a>
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded border border-border bg-secondary/20 text-muted-foreground">
                        {repo.language || "Web"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                      {repo.description || "No description provided for this repository."}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 mt-4 text-[10px] text-muted-foreground font-mono">
                    <span className="flex items-center gap-1">
                      <Icons.Star className="w-3.5 h-3.5 text-yellow-500" /> {repo.stargazers_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <Icons.GitFork className="w-3.5 h-3.5 text-blue-500" /> {repo.forks_count}
                    </span>
                    <span className="text-muted-foreground/60 ml-auto">
                      Updated: {new Date(repo.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Could not retrieve public repositories (API limit reached or offline). Check again later.
            </p>
          )}
        </section>
      )}

      {/* Profile-Specific Contact Card */}
      <section className="max-w-xl mx-auto">
        <GlassCard hoverScale={false}>
          <h3 className="text-lg font-bold text-foreground text-center mb-1">
            Interested in hiring a {role.title}?
          </h3>
          <p className="text-xs text-muted-foreground text-center mb-6">
            Inquire directly about roles, credentials, or custom projects.
          </p>

          <Link
            to="/"
            state={{ targetRole: role.title }}
            className="w-full py-3 rounded-xl bg-primary hover:bg-opacity-95 text-primary-foreground font-semibold text-center text-sm transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Icons.Mail className="w-4 h-4" /> Message {role.name}
          </Link>
        </GlassCard>
      </section>
    </div>
  );
};

export default ProfilePage;
