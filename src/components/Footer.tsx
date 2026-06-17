import React, { useState, useEffect } from "react";
import * as Icons from "lucide-react";
import { dbService } from "../config/firebase";

export const Footer: React.FC = () => {
  const [time, setTime] = useState("");
  const [links, setLinks] = useState<any>(null);

  useEffect(() => {
    // Dynamic Time ticking
    const updateTime = () => {
      const options: Intl.DateTimeFormatOptions = {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
      };
      const formatter = new Intl.DateTimeFormat([], options);
      setTime(formatter.format(new Date()));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    // Fetch links configuration
    dbService.getLinks().then(setLinks).catch(console.error);

    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="w-full border-t border-border bg-card/20 backdrop-blur-md px-6 py-8 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Info */}
        <div className="flex flex-col items-center md:items-start gap-1">
          <p className="text-sm font-medium text-foreground">
            © {new Date().getFullYear()} Pranil Belge. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Available for new opportunities
          </p>
        </div>

        {/* Local Time Widget */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl glass border border-border">
          <Icons.Clock className="w-4 h-4 text-purple-400" />
          <span className="text-xs text-muted-foreground font-mono">
            Local Time (IST): <span className="text-foreground font-bold">{time || "11:48 AM"}</span>
          </span>
        </div>

        {/* Social Links */}
        <div className="flex items-center gap-4">
          {links?.github && (
            <a
              href={links.github}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg border border-border hover:bg-secondary/40 text-muted-foreground hover:text-foreground transition-all duration-200"
              aria-label="GitHub"
            >
              <Icons.Github className="w-4 h-4" />
            </a>
          )}
          {links?.linkedin && (
            <a
              href={links.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg border border-border hover:bg-secondary/40 text-muted-foreground hover:text-foreground transition-all duration-200"
              aria-label="LinkedIn"
            >
              <Icons.Linkedin className="w-4 h-4" />
            </a>
          )}
          {links?.whatsapp && (
            <a
              href={links.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg border border-border hover:bg-secondary/40 text-muted-foreground hover:text-foreground transition-all duration-200"
              aria-label="WhatsApp"
            >
              <Icons.Phone className="w-4 h-4" />
            </a>
          )}
          {links?.email && (
            <a
              href={`mailto:${links.email}`}
              className="p-2 rounded-lg border border-border hover:bg-secondary/40 text-muted-foreground hover:text-foreground transition-all duration-200"
              aria-label="Email"
            >
              <Icons.Mail className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
