import React, { useState, useEffect, useMemo } from "react";
import * as Icons from "lucide-react";
import { getRoles } from "../utils/roleLoader";
import { dbService, storageService } from "../config/firebase";
import GlassCard from "../components/GlassCard";
import SEO from "../components/SEO";
import { downloadMockPDF } from "../utils/pdfGenerator";

export const RecruiterPage: React.FC = () => {
  const allRoles = useMemo(() => getRoles(), []);
  
  // Selected roles to compare (default to first 3 roles)
  const [selectedIds, setSelectedIds] = useState<string[]>(allRoles.map(r => r.id));
  const [resumes, setResumes] = useState<Record<string, any>>({});
  const [downloadCounts, setDownloadCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    // Load download counts
    dbService.getDownloadCounts().then(setDownloadCounts).catch(console.error);

    // Load custom uploaded resumes
    const fetchResumes = async () => {
      const data: Record<string, any> = {};
      for (const role of allRoles) {
        try {
          const res = await storageService.getUploadedResume(role.id);
          if (res) data[role.id] = res;
        } catch (err) {
          console.error(err);
        }
      }
      setResumes(data);
    };
    fetchResumes();
  }, [allRoles]);

  const toggleRole = (id: string) => {
    if (selectedIds.includes(id)) {
      if (selectedIds.length > 1) {
        setSelectedIds(selectedIds.filter(x => x !== id));
      }
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleDownload = async (roleId: string) => {
    try {
      const freshCount = await dbService.incrementDownloadCount(roleId);
      setDownloadCounts(prev => ({ ...prev, [roleId]: freshCount }));
    } catch (err) {
      console.error(err);
    }

    const customResume = resumes[roleId];
    if (customResume?.downloadUrl) {
      const link = document.createElement("a");
      link.href = customResume.downloadUrl;
      link.target = "_blank";
      link.download = customResume.name || `Pranil_Belge_Resume_${roleId}.pdf`;
      link.click();
    } else {
      const targetRole = allRoles.find(r => r.id === roleId);
      downloadMockPDF(roleId, targetRole?.title || "Professional");
    }
  };

  const comparedRoles = allRoles.filter(r => selectedIds.includes(r.id));

  return (
    <div className="w-full min-h-screen relative grid-bg pt-8 pb-16 px-6">
      <SEO
        title="Recruiter Matrix | Pranil Belge Career Platform"
        description="Compare the professional skills, projects, experience, and certifications of Pranil Belge across multiple roles side-by-side."
      />

      <section className="max-w-7xl mx-auto mb-8 text-center md:text-left">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-gray-300 to-purple-400 bg-clip-text text-transparent mb-2">
          Recruiter Comparison Mode
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Evaluate capabilities, core expertise, and achievements side-by-side to match targeted job requisitions.
        </p>
      </section>

      {/* Role Selection Filters */}
      <section className="max-w-7xl mx-auto mb-8">
        <GlassCard hoverScale={false} className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1.5">
              <Icons.SlidersHorizontal className="w-4 h-4 text-purple-400" /> Compare Profiles:
            </span>
            <div className="flex flex-wrap gap-2.5">
              {allRoles.map((role) => {
                const isSelected = selectedIds.includes(role.id);
                return (
                  <button
                    key={role.id}
                    onClick={() => toggleRole(role.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all duration-200 cursor-pointer flex items-center gap-2 ${
                      isSelected
                        ? "bg-purple-500/10 border-purple-500 text-purple-400 font-bold"
                        : "border-border hover:bg-secondary/40 text-muted-foreground"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${isSelected ? "bg-purple-400 animate-pulse" : "bg-muted-foreground/40"}`}></span>
                    {role.title}
                  </button>
                );
              })}
            </div>
          </div>
        </GlassCard>
      </section>

      {/* Desktop Comparison Table */}
      <section className="max-w-7xl mx-auto hidden lg:block overflow-hidden rounded-2xl border border-border glass bg-card/10">
        <div className="w-full overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border/80 bg-secondary/15">
                <th className="p-6 font-bold text-foreground text-xs uppercase tracking-wider w-1/5">Evaluation Matrix</th>
                {comparedRoles.map((role) => (
                  <th key={role.id} className="p-6 font-bold text-foreground w-1/4 border-l border-border/60">
                    <div className="flex items-center gap-2">
                      <span className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        <Icons.User className="w-4 h-4" />
                      </span>
                      <div>
                        <h4 className="text-sm font-bold text-foreground leading-none">{role.title}</h4>
                        <span className="text-[10px] text-purple-400 font-semibold mt-1 block">Pranil Belge</span>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {/* Row 1: Summary */}
              <tr>
                <td className="p-6 font-semibold text-muted-foreground align-top text-xs uppercase tracking-wide">Summary</td>
                {comparedRoles.map((role) => (
                  <td key={role.id} className="p-6 text-muted-foreground/90 align-top border-l border-border/40 leading-relaxed text-xs">
                    {role.summary}
                  </td>
                ))}
              </tr>

              {/* Row 2: Skills */}
              <tr>
                <td className="p-6 font-semibold text-muted-foreground align-top text-xs uppercase tracking-wide">Skills (Expertise)</td>
                {comparedRoles.map((role) => (
                  <td key={role.id} className="p-6 align-top border-l border-border/40">
                    <div className="flex flex-wrap gap-1.5">
                      {role.skills.map((skill, sIdx) => (
                        <span
                          key={sIdx}
                          className="text-[10px] font-mono px-2 py-0.5 rounded border border-border bg-secondary/20 text-muted-foreground flex items-center gap-1"
                        >
                          {skill.name} <strong className="text-foreground/80">({skill.level}%)</strong>
                        </span>
                      ))}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Row 3: Projects */}
              <tr>
                <td className="p-6 font-semibold text-muted-foreground align-top text-xs uppercase tracking-wide">Featured Projects</td>
                {comparedRoles.map((role) => (
                  <td key={role.id} className="p-6 align-top border-l border-border/40 space-y-4">
                    {role.projects.slice(0, 3).map((proj, pIdx) => (
                      <div key={pIdx} className="space-y-1">
                        <h5 className="font-bold text-foreground text-xs flex items-center gap-1">
                          <Icons.FolderOpen className="w-3.5 h-3.5 text-purple-400" /> {proj.title}
                        </h5>
                        <p className="text-[11px] text-muted-foreground/80 leading-relaxed">{proj.description}</p>
                        <div className="flex flex-wrap gap-1 pt-1">
                          {proj.techStack.slice(0, 3).map((tech, tIdx) => (
                            <span key={tIdx} className="text-[9px] font-mono px-1.5 py-0.2 bg-secondary/30 rounded border border-border/40">
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </td>
                ))}
              </tr>

              {/* Row 4: Experience */}
              <tr>
                <td className="p-6 font-semibold text-muted-foreground align-top text-xs uppercase tracking-wide">Experience</td>
                {comparedRoles.map((role) => (
                  <td key={role.id} className="p-6 align-top border-l border-border/40 space-y-3.5">
                    {role.experience && role.experience.length > 0 ? (
                      role.experience.map((exp, eIdx) => (
                        <div key={eIdx} className="text-xs space-y-0.5">
                          <span className="text-[9px] font-mono text-purple-400 font-bold block">{exp.period}</span>
                          <strong className="text-foreground">{exp.role}</strong>
                          <p className="text-muted-foreground/80">{exp.company}</p>
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">General background available</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Row 5: Certifications */}
              <tr>
                <td className="p-6 font-semibold text-muted-foreground align-top text-xs uppercase tracking-wide">Certifications</td>
                {comparedRoles.map((role) => (
                  <td key={role.id} className="p-6 align-top border-l border-border/40 space-y-2.5">
                    {role.certifications && role.certifications.length > 0 ? (
                      role.certifications.map((cert, cIdx) => (
                        <div key={cIdx} className="text-xs space-y-0.5 flex items-start gap-1.5">
                          <Icons.Award className="w-3.5 h-3.5 text-purple-400 mt-0.5 shrink-0" />
                          <div>
                            <strong className="text-foreground block font-bold leading-tight">{cert.name}</strong>
                            <span className="text-[10px] text-muted-foreground">{cert.issuer} ({cert.date})</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">See details on profile page</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Row 6: Actions */}
              <tr>
                <td className="p-6 font-semibold text-muted-foreground align-top text-xs uppercase tracking-wide">Resume Download</td>
                {comparedRoles.map((role) => (
                  <td key={role.id} className="p-6 align-top border-l border-border/40">
                    <button
                      onClick={() => handleDownload(role.id)}
                      className="w-full py-2 px-3 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow"
                    >
                      <Icons.Download className="w-3.5 h-3.5" /> Download Resume
                    </button>
                    <div className="text-[10px] text-muted-foreground font-mono text-center mt-2">
                      Downloaded: <strong className="text-foreground">{downloadCounts[role.id] || 0}</strong>
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Mobile/Tablet Comparison Grid (Card-based stacked layout) */}
      <section className="max-w-7xl mx-auto lg:hidden space-y-6">
        {comparedRoles.map((role) => (
          <GlassCard key={role.id} hoverScale={false} glowColor="purple">
            <div className="flex items-center gap-3 border-b border-border pb-4 mb-4">
              <span className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Icons.User className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-lg font-bold text-foreground leading-tight">{role.title}</h3>
                <span className="text-[10px] uppercase font-mono tracking-widest text-muted-foreground">Pranil Belge</span>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Summary</span>
                <p className="text-muted-foreground leading-relaxed">{role.summary}</p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1.5">Expertise Matrix</span>
                <div className="flex flex-wrap gap-1.5">
                  {role.skills.map((skill, idx) => (
                    <span key={idx} className="text-[10px] font-mono px-2 py-0.5 rounded border border-border bg-secondary/20 text-muted-foreground">
                      {skill.name} ({skill.level}%)
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-2">Featured Projects</span>
                <div className="space-y-3">
                  {role.projects.slice(0, 3).map((proj, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-black/20 border border-border/40">
                      <strong className="text-foreground text-xs block font-bold">{proj.title}</strong>
                      <p className="text-[11px] text-muted-foreground/80 mt-1">{proj.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-2">Experience highlights</span>
                <div className="space-y-2">
                  {role.experience?.map((exp, idx) => (
                    <div key={idx} className="flex justify-between items-start">
                      <div>
                        <strong className="text-foreground block">{exp.role}</strong>
                        <span className="text-[11px] text-muted-foreground">{exp.company}</span>
                      </div>
                      <span className="text-[10px] font-mono text-purple-400">{exp.period}</span>
                    </div>
                  ))}
                </div>
              </div>

              {role.certifications && role.certifications.length > 0 && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-2">Certifications</span>
                  <div className="space-y-1.5">
                    {role.certifications.map((cert, idx) => (
                      <div key={idx} className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                        <Icons.Award className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <span>{cert.name} - {cert.issuer}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t border-border pt-4 mt-6">
                <button
                  onClick={() => handleDownload(role.id)}
                  className="w-full py-3 rounded-xl bg-primary hover:bg-opacity-95 text-primary-foreground font-semibold text-sm transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Icons.Download className="w-4 h-4" /> Download Resume
                </button>
                <div className="text-[10px] text-muted-foreground font-mono text-center mt-2">
                  Downloaded: <strong className="text-foreground">{downloadCounts[role.id] || 0}</strong>
                </div>
              </div>
            </div>
          </GlassCard>
        ))}
      </section>
    </div>
  );
};

export default RecruiterPage;
