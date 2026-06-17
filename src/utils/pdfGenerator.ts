import type { RoleConfig } from "./roleLoader";

const escapePDF = (text: string) => {
  return (text || "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
};

const wrapText = (text: string, maxChars: number): string[] => {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";
  
  words.forEach(word => {
    if ((currentLine + " " + word).trim().length <= maxChars) {
      currentLine = (currentLine + " " + word).trim();
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  });
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
};

export const downloadMockPDF = (role: RoleConfig) => {
  // Page 1 Setup
  let y1 = 730;
  let stream1 = `BT
70 ${y1} Td
13 TL
/F2 20 Tf
(PRANIL BELGE) Tj
T*
/F1 9 Tf
(Thane, Maharashtra, India  |  pranil2410@gmail.com  |  +91-9137447968) Tj
T*
(linkedin.com/in/pranil-belge-ml  |  github.com/pranil2410) Tj
T*
T*
ET
`;
  y1 -= 55;

  // 1. Summary / Objective
  stream1 += `70 ${y1} m 542 ${y1} l S\n`;
  y1 -= 14;
  stream1 += `BT
70 ${y1} Td
11 TL
/F2 11 Tf
(${role.id === "data-analyst" ? "OBJECTIVE" : "SUMMARY"}) Tj
T*
/F1 9 Tf
`;
  y1 -= 11;
  const summaryLines = wrapText(role.summary, 90);
  summaryLines.forEach(line => {
    stream1 += `(${escapePDF(line)}) Tj\nT*\n`;
    y1 -= 11;
  });
  stream1 += `ET\n`;
  y1 -= 6;

  // 2. Education
  stream1 += `70 ${y1} m 542 ${y1} l S\n`;
  y1 -= 14;
  stream1 += `BT
70 ${y1} Td
11 TL
/F2 11 Tf
(EDUCATION) Tj
T*
/F2 9.5 Tf
(A.P. Shah Institute of Technology) Tj
350 0 Td (Thane - Mumbai, India) Tj -350 0 Td
T*
/F1 9 Tf
(Bachelor of Engineering - Computer Engineering) Tj
350 0 Td (Jan 2022 - Jun 2026) Tj -350 0 Td
T*
(CGPA: 6.14/10) Tj
T*
/F2 8.5 Tf (Relevant Coursework: ) Tj /F1 8.5 Tf (DBMS, Data Structures & Algorithms, Statistics, Operating Systems, Software Engineering) Tj
T*
T*
/F2 9.5 Tf
(New Horizon Scholars School) Tj
350 0 Td (Mumbai, India) Tj -350 0 Td
T*
/F1 9 Tf
(HSC - Science/Engineering Stream) Tj
350 0 Td (Jul 2019 - May 2021) Tj -350 0 Td
T*
T*
ET
`;
  y1 -= 95;

  // 3. Skills Matrix
  stream1 += `70 ${y1} m 542 ${y1} l S\n`;
  y1 -= 14;
  stream1 += `BT
70 ${y1} Td
11 TL
/F2 11 Tf
(TECHNICAL SKILLS) Tj
T*
`;
  y1 -= 11;

  const categories: Record<string, string[]> = {};
  role.skills.forEach(s => {
    if (!categories[s.category]) {
      categories[s.category] = [];
    }
    categories[s.category].push(s.name);
  });

  for (const cat in categories) {
    const skillList = categories[cat].join(", ");
    const skillLines = wrapText(`${cat}: ${skillList}`, 90);
    skillLines.forEach((line, idx) => {
      if (idx === 0) {
        const prefix = `${cat}: `;
        const rest = line.substring(prefix.length);
        stream1 += `/F2 9 Tf (${escapePDF(prefix)}) Tj /F1 9 Tf (${escapePDF(rest)}) Tj\nT*\n`;
      } else {
        stream1 += `/F1 9 Tf (${escapePDF(line)}) Tj\nT*\n`;
      }
      y1 -= 11;
    });
  }
  stream1 += `T*\nET\n`;
  y1 -= 12;

  // 4. Experience & Internships (Split dynamically if overflowing)
  const p1Experiences: any[] = [];
  const p2Experiences: any[] = [];
  
  if (role.experience) {
    role.experience.forEach(exp => {
      let size = 22;
      if (exp.achievements) {
        exp.achievements.forEach((ach: string) => {
          size += wrapText(`* ${ach}`, 88).length * 11;
        });
      } else if (exp.description) {
        size += wrapText(`* ${exp.description}`, 88).length * 11;
      }
      
      if (y1 - size > 50) {
        p1Experiences.push(exp);
        y1 -= size;
      } else {
        p2Experiences.push(exp);
      }
    });
  }

  if (p1Experiences.length > 0) {
    stream1 += `70 ${y1} m 542 ${y1} l S\n`;
    y1 -= 14;
    stream1 += `BT
70 ${y1} Td
11 TL
/F2 11 Tf
(${role.id === "genai-engineer" ? "AI EXPERIENCE & INTERNSHIPS" : "EXPERIENCE & INTERNSHIPS"}) Tj
T*
`;
    y1 -= 11;

    p1Experiences.forEach(exp => {
      stream1 += `/F2 9.5 Tf (${escapePDF(exp.role)}) Tj /F1 9.5 Tf ( - ${escapePDF(exp.company)}) Tj 350 0 Td /F2 9.5 Tf (${escapePDF(exp.period)}) Tj -350 0 Td\nT*\n`;
      y1 -= 11;
      
      const bullets = exp.achievements || (exp.description ? [exp.description] : []);
      bullets.forEach((bullet: string) => {
        const bulletLines = wrapText(`* ${bullet}`, 88);
        bulletLines.forEach(line => {
          stream1 += `/F1 8.5 Tf (${escapePDF(line)}) Tj\nT*\n`;
          y1 -= 11;
        });
      });
      stream1 += `T*\n`;
      y1 -= 11;
    });
    stream1 += `ET\n`;
  }

  // Page 2 Setup
  let y2 = 730;
  let stream2 = `BT
70 ${y2} Td
13 TL
/F2 14 Tf
(PRANIL BELGE - RESUME CONTINUED) Tj
T*
ET
`;
  y2 -= 25;

  // Defer remaining experiences to page 2 if any
  if (p2Experiences.length > 0) {
    stream2 += `70 ${y2} m 542 ${y2} l S\n`;
    y2 -= 14;
    stream2 += `BT
70 ${y2} Td
11 TL
/F2 11 Tf
(EXPERIENCE & INTERNSHIPS (CONTINUED)) Tj
T*
`;
    y2 -= 11;

    p2Experiences.forEach(exp => {
      stream2 += `/F2 9.5 Tf (${escapePDF(exp.role)}) Tj /F1 9.5 Tf ( - ${escapePDF(exp.company)}) Tj 350 0 Td /F2 9.5 Tf (${escapePDF(exp.period)}) Tj -350 0 Td\nT*\n`;
      y2 -= 11;
      
      const bullets = exp.achievements || (exp.description ? [exp.description] : []);
      bullets.forEach((bullet: string) => {
        const bulletLines = wrapText(`* ${bullet}`, 88);
        bulletLines.forEach(line => {
          stream2 += `/F1 8.5 Tf (${escapePDF(line)}) Tj\nT*\n`;
          y2 -= 11;
        });
      });
      stream2 += `T*\n`;
      y2 -= 11;
    });
    stream2 += `ET\n`;
  }

  // 5. Key Projects
  stream2 += `70 ${y2} m 542 ${y2} l S\n`;
  y2 -= 14;
  stream2 += `BT
70 ${y2} Td
11 TL
/F2 11 Tf
(${role.id === "genai-engineer" ? "AI / GENAI PROJECTS" : "KEY PROJECTS"}) Tj
T*
`;
  y2 -= 11;

  role.projects.forEach(proj => {
    stream2 += `/F2 9.5 Tf (${escapePDF(proj.title)}) Tj /F1 9 Tf ( [${escapePDF(proj.techStack.join(", "))}]) Tj\nT*\n`;
    y2 -= 11;
    
    const bullets = proj.achievements || (proj.description ? [proj.description] : []);
    bullets.forEach((bullet: string) => {
      const bulletLines = wrapText(`* ${bullet}`, 88);
      bulletLines.forEach(line => {
        stream2 += `/F1 8.5 Tf (${escapePDF(line)}) Tj\nT*\n`;
        y2 -= 11;
      });
    });
    stream2 += `T*\n`;
    y2 -= 11;
  });
  stream2 += `ET\n`;

  // 6. Hackathons
  if (role.hackathons && role.hackathons.length > 0) {
    stream2 += `70 ${y2} m 542 ${y2} l S\n`;
    y2 -= 14;
    stream2 += `BT
70 ${y2} Td
11 TL
/F2 11 Tf
(HACKATHONS) Tj
T*
`;
    y2 -= 11;

    role.hackathons.forEach(h => {
      stream2 += `/F2 9.5 Tf (${escapePDF(h.name)}) Tj /F1 9 Tf ( - Project: ${escapePDF(h.project)} [${escapePDF(h.prize || "Participant")}]) Tj\nT*\n`;
      y2 -= 11;
      if (h.description) {
        const hLines = wrapText(`* ${h.description}`, 88);
        hLines.forEach(line => {
          stream2 += `/F1 8.5 Tf (${escapePDF(line)}) Tj\nT*\n`;
          y2 -= 11;
        });
      }
      stream2 += `T*\n`;
      y2 -= 11;
    });
    stream2 += `ET\n`;
  }

  // 7. Certifications & Courses
  if (role.certifications && role.certifications.length > 0) {
    stream2 += `70 ${y2} m 542 ${y2} l S\n`;
    y2 -= 14;
    stream2 += `BT
70 ${y2} Td
11 TL
/F2 11 Tf
(CERTIFICATIONS & COURSES) Tj
T*
`;
    y2 -= 11;

    role.certifications.forEach(cert => {
      stream2 += `/F1 8.5 Tf (* ${escapePDF(cert.name)} - ${escapePDF(cert.issuer)} (${escapePDF(cert.date)})) Tj\nT*\n`;
      y2 -= 11;
    });
    stream2 += `ET\n`;
  }

  // 8. Additional Info (Data Analyst specific)
  if (role.id === "data-analyst") {
    stream2 += `70 ${y2} m 542 ${y2} l S\n`;
    y2 -= 14;
    stream2 += `BT
70 ${y2} Td
11 TL
/F2 11 Tf
(ADDITIONAL INFORMATION) Tj
T*
/F1 9 Tf
(* Communication: Fluent in English (Advanced - C1); strong written communication through structured analytical reports.) Tj
T*
(* Work Style: Self-starter; comfortable handling multiple business tasks under tight timelines.) Tj
T*
(* Availability: Immediately available for full-time engagement; open to Gurgaon relocation.) Tj
T*
ET
`;
  }

  // Construct PDF Objects with correct xref byte offsets
  const catalog = `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`;
  const pages = `2 0 obj\n<< /Type /Pages /Kids [3 0 R 5 0 R] /Count 2 >>\nendobj\n`;
  
  const page1 = `3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> /F2 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> >> >> /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n`;
  const content1 = `4 0 obj\n<< /Length ${stream1.length} >>\nstream\n${stream1}endstream\nendobj\n`;
  
  const page2 = `5 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> /F2 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> >> >> /MediaBox [0 0 612 792] /Contents 6 0 R >>\nendobj\n`;
  const content2 = `6 0 obj\n<< /Length ${stream2.length} >>\nstream\n${stream2}endstream\nendobj\n`;

  const objects = [catalog, pages, page1, content1, page2, content2];
  
  let pdf = `%PDF-1.4\n`;
  const offsets: number[] = [];
  
  objects.forEach(obj => {
    offsets.push(pdf.length);
    pdf += obj;
  });
  
  const startXref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  
  offsets.forEach(offset => {
    const pad = ("0000000000" + offset).slice(-10);
    pdf += `${pad} 00000 n \n`;
  });
  
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF`;

  const bytes = new Uint8Array(pdf.length);
  for (let i = 0; i < pdf.length; i++) {
    bytes[i] = pdf.charCodeAt(i);
  }

  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `Pranil_Belge_${role.id.replace(/-/g, '_')}_Resume.pdf`;
  link.click();
  URL.revokeObjectURL(url);
};
