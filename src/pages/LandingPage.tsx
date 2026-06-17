import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import * as Icons from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getRoles } from "../utils/roleLoader";
import { dbService } from "../config/firebase";
import GlassCard from "../components/GlassCard";
import SEO from "../components/SEO";

export const LandingPage: React.FC = () => {
  const roles = getRoles();
  const [visitorCount, setVisitorCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Contact form state
  const [formData, setFormData] = useState({ name: "", email: "", role: "General", message: "" });
  const [formStatus, setFormStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [links, setLinks] = useState<any>(null);

  useEffect(() => {
    // Increment and fetch visitor counter
    dbService.incrementVisitorCount().then(setVisitorCount).catch(console.error);

    // Get contact links
    dbService.getLinks().then(setLinks).catch(console.error);
  }, []);

  // Search logic
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    
    setIsSearching(true);
    const query = searchQuery.toLowerCase();
    const results: any[] = [];

    roles.forEach((role) => {
      const matchedItems: { type: string; name: string }[] = [];

      // 1. Check title and summary
      if (role.title.toLowerCase().includes(query)) {
        matchedItems.push({ type: "Role Title", name: role.title });
      }

      // 2. Check skills
      role.skills.forEach((skill) => {
        if (skill.name.toLowerCase().includes(query) || skill.category.toLowerCase().includes(query)) {
          matchedItems.push({ type: "Skill", name: `${skill.name} (${skill.category})` });
        }
      });

      // 3. Check projects
      role.projects.forEach((proj) => {
        if (
          proj.title.toLowerCase().includes(query) ||
          proj.description.toLowerCase().includes(query) ||
          proj.techStack.some((tech) => tech.toLowerCase().includes(query))
        ) {
          matchedItems.push({ type: "Project", name: proj.title });
        }
      });

      // 4. Check certifications
      role.certifications?.forEach((cert) => {
        if (cert.name.toLowerCase().includes(query) || cert.issuer.toLowerCase().includes(query)) {
          matchedItems.push({ type: "Certification", name: `${cert.name} - ${cert.issuer}` });
        }
      });

      // 5. Check experience
      role.experience?.forEach((exp) => {
        if (
          exp.role.toLowerCase().includes(query) ||
          exp.company.toLowerCase().includes(query) ||
          exp.description.toLowerCase().includes(query)
        ) {
          matchedItems.push({ type: "Experience", name: `${exp.role} at ${exp.company}` });
        }
      });

      // 6. Check hackathons
      role.hackathons?.forEach((h) => {
        if (h.name.toLowerCase().includes(query) || h.project.toLowerCase().includes(query)) {
          matchedItems.push({ type: "Hackathon", name: `${h.name} (${h.project})` });
        }
      });

      if (matchedItems.length > 0) {
        // De-duplicate matched item names
        const uniqueMatches = Array.from(new Set(matchedItems.map(item => JSON.stringify(item)))).map(str => JSON.parse(str) as any);
        results.push({
          roleId: role.id,
          roleTitle: role.title,
          matches: uniqueMatches
        });
      }
    });

    setSearchResults(results);
  }, [searchQuery, roles]);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      setFormStatus("error");
      return;
    }
    setFormStatus("submitting");
    try {
      await dbService.addMessage(formData);
      setFormStatus("success");
      setFormData({ name: "", email: "", role: "General", message: "" });
      setTimeout(() => setFormStatus("idle"), 5000);
    } catch (err) {
      console.error(err);
      setFormStatus("error");
    }
  };

  const DynamicIcon = ({ name, className = "w-6 h-6 text-primary" }: { name: string; className?: string }) => {
    const IconComponent = (Icons as any)[name] || Icons.User;
    return <IconComponent className={className} />;
  };

  return (
    <div className="w-full min-h-screen relative grid-bg pt-8 pb-16 px-6">
      <SEO 
        title="Pranil Belge | Career Portfolio Platform" 
        description="Dynamic, multi-role professional portfolio of Pranil Belge. Software Developer, Data Analyst, and GenAI / AI Engineer."
        keywords={["Pranil Belge", "Portfolio", "Software Developer", "Data Analyst", "GenAI Engineer"]}
      />

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto text-center mt-12 mb-16 relative">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-purple-500/20 bg-purple-500/5 mb-6 backdrop-blur-md"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-500"></span>
          </span>
          <span className="text-xs font-mono tracking-wider text-purple-300">
            Visitor Count: {visitorCount || "..."}
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-7xl font-extrabold tracking-tight bg-gradient-to-r from-white via-gray-300 to-purple-400 bg-clip-text text-transparent mb-6"
        >
          Pranil Belge
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-10 font-medium"
        >
          Building Software, Data & AI Solutions
        </motion.p>

        {/* Global Search Component */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="max-w-lg mx-auto relative z-30"
        >
          <div className="flex items-center gap-2 rounded-xl glass border border-border px-3 py-2 text-foreground focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary/50 transition-all duration-300">
            <Icons.Search className="w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search skills, projects, certs, e.g. React, SQL, RAG..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none w-full text-sm py-1 placeholder:text-muted-foreground/60"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")} 
                className="p-1 rounded-full hover:bg-secondary/40 text-muted-foreground"
              >
                <Icons.X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Search Result Overlay */}
          <AnimatePresence>
            {isSearching && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full left-0 right-0 mt-2 p-4 rounded-xl glass border border-border shadow-2xl text-left max-h-80 overflow-y-auto z-40"
              >
                <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">
                  Search Results ({searchResults.length} profiles found)
                </h3>
                {searchResults.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2 text-center">
                    No matching profiles or skills found. Try searching "RAG", "SQL", or "React".
                  </p>
                ) : (
                  <div className="flex flex-col gap-4">
                    {searchResults.map((res) => (
                      <div key={res.roleId} className="border-b border-border/40 pb-3 last:border-0 last:pb-0">
                        <Link
                          to={`/role/${res.roleId}`}
                          className="text-sm font-semibold text-primary hover:underline flex items-center justify-between"
                        >
                          <span>{res.roleTitle}</span>
                          <Icons.ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {res.matches.map((item: any, idx: number) => (
                            <span
                              key={idx}
                              className="text-[11px] px-2 py-0.5 rounded-full border border-border/80 bg-secondary/20 text-muted-foreground font-mono"
                            >
                              <strong className="text-foreground/80">{item.type}:</strong> {item.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </section>

      {/* Career Cards Grid */}
      <section className="max-w-6xl mx-auto mb-20">
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-center text-foreground mb-12">
          Select a Career Profile
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roles.map((role, index) => {
            const glowColors: Array<"purple" | "blue" | "emerald"> = ["purple", "blue", "emerald"];
            const color = glowColors[index % 3];

            return (
              <GlassCard
                key={role.id}
                glowColor={color}
                delay={index * 0.1}
                className="flex flex-col justify-between h-full group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                      <DynamicIcon name={role.roleIcon} />
                    </div>
                    <span className="text-[10px] font-mono uppercase text-muted-foreground border border-border px-2 py-0.5 rounded-full bg-secondary/10">
                      {role.projects.length} Projects
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-purple-400 transition-colors">
                    {role.title}
                  </h3>

                  <p className="text-sm text-muted-foreground/90 line-clamp-3 mb-6 leading-relaxed">
                    {role.summary}
                  </p>

                  <div className="mb-8">
                    <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2.5">
                      Core Expertise
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {role.skills.slice(0, 4).map((skill, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] font-medium px-2.5 py-0.5 rounded-full border border-border bg-secondary/30 text-foreground/80"
                        >
                          {skill.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <Link
                  to={`/role/${role.id}`}
                  className="w-full py-2.5 px-4 rounded-xl bg-primary hover:bg-primary-foreground/90 text-primary-foreground font-semibold text-center text-sm transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer shadow-md hover:shadow-purple-500/20"
                >
                  View Profile <Icons.ArrowRight className="w-4 h-4" />
                </Link>
              </GlassCard>
            );
          })}
        </div>
      </section>

      {/* Universal Contact System */}
      <section className="max-w-3xl mx-auto">
        <GlassCard glowColor="none" hoverScale={false}>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-center text-foreground mb-2">
            Get In Touch
          </h2>
          <p className="text-sm text-muted-foreground text-center mb-8">
            Have an inquiry or want to discuss a specific job role? Leave a message below.
          </p>

          <form onSubmit={handleContactSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Your Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. John Doe"
                  className="w-full px-4 py-2.5 rounded-xl glass border border-border text-sm outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Your Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. john@company.com"
                  className="w-full px-4 py-2.5 rounded-xl glass border border-border text-sm outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Target Profile</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl glass border border-border text-sm outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all cursor-pointer text-foreground [&>option]:bg-background"
              >
                <option value="General">General Inquiry</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.title}>
                    {r.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Message</label>
              <textarea
                required
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Type your message here..."
                className="w-full px-4 py-2.5 rounded-xl glass border border-border text-sm outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all resize-none"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={formStatus === "submitting"}
              className="w-full py-3 px-4 rounded-xl bg-primary hover:bg-primary-foreground/95 text-primary-foreground font-semibold text-center text-sm transition-all duration-200 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {formStatus === "submitting" ? (
                <>
                  <Icons.Loader2 className="w-4 h-4 animate-spin" />
                  Sending Message...
                </>
              ) : (
                <>
                  <Icons.Send className="w-4 h-4" />
                  Send Inquiry
                </>
              )}
            </button>

            {formStatus === "success" && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-emerald-400 text-center font-medium mt-2"
              >
                Thank you! Your inquiry has been submitted and registered successfully.
              </motion.p>
            )}

            {formStatus === "error" && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-red-400 text-center font-medium mt-2"
              >
                Failed to send message. Please fill all fields and try again.
              </motion.p>
            )}
          </form>
        </GlassCard>
      </section>

      {/* Floating Action Button (WhatsApp Quick Contact) */}
      {links?.whatsapp && (
        <motion.a
          href={links.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="fixed bottom-6 right-6 p-4 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-2xl z-50 flex items-center justify-center cursor-pointer"
          title="Quick chat on WhatsApp"
        >
          <DynamicIcon name="Phone" className="w-6 h-6 text-white" />
        </motion.a>
      )}
    </div>
  );
};

export default LandingPage;
