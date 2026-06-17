import { createClient } from "@supabase/supabase-js";

// Supabase Connection Configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://wmheyybdtzizjyhphpjm.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_DV03qPpQtzdpTHxAxfd_VQ_fC4EYDpn";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const isOfflineMode = false; // Connected via Supabase

import defaultLinks from "../data/links.json";

const KEYS = {
  LINKS: "portfolio_links",
  VISITORS: "portfolio_visitors",
  DOWNLOADS: "portfolio_downloads",
  MESSAGES: "portfolio_messages",
  ANALYTICS_PROJECTS: "portfolio_analytics_projects",
  RESUMES: "portfolio_resumes_data",
  AUTH_USER: "portfolio_auth_user"
};

// ----------------------------------------------------
// DATABASE SERVICES (Supabase implementation)
// ----------------------------------------------------
export const dbService = {
  // 1. LINK MANAGEMENT
  async getLinks(): Promise<typeof defaultLinks> {
    try {
      const { data, error } = await supabase
        .from("portfolio_config")
        .select("value")
        .eq("key", "links")
        .single();
        
      if (data && data.value) {
        return data.value as typeof defaultLinks;
      }
      
      // If table exists but row is missing, seed it
      if (error && error.code === "PGRST116") {
        await supabase.from("portfolio_config").insert({ key: "links", value: defaultLinks });
        return defaultLinks;
      }
      if (error) throw error;
    } catch (err) {
      console.warn("Supabase getLinks query failed. Falling back to local storage:", err);
    }
    
    const local = localStorage.getItem(KEYS.LINKS);
    if (!local) {
      localStorage.setItem(KEYS.LINKS, JSON.stringify(defaultLinks));
      return defaultLinks;
    }
    return JSON.parse(local);
  },

  async saveLinks(links: typeof defaultLinks): Promise<void> {
    try {
      const { error } = await supabase
        .from("portfolio_config")
        .upsert({ key: "links", value: links }, { onConflict: "key" });
      if (!error) return;
      throw error;
    } catch (err) {
      console.warn("Supabase saveLinks failed. Saving locally:", err);
    }
    localStorage.setItem(KEYS.LINKS, JSON.stringify(links));
  },

  // 2. VISITOR COUNTER
  async incrementVisitorCount(): Promise<number> {
    try {
      const { data } = await supabase
        .from("portfolio_analytics")
        .select("value")
        .eq("key", "visitors")
        .single();
        
      const current = data ? (data.value || 0) : 0;
      const next = current + 1;
      
      const { error } = await supabase
        .from("portfolio_analytics")
        .upsert({ key: "visitors", value: next }, { onConflict: "key" });
        
      if (!error) return next;
      throw error;
    } catch (err) {
      console.warn("Supabase incrementVisitorCount failed, using local storage:", err);
    }
    const local = localStorage.getItem(KEYS.VISITORS) || "0";
    const newCount = parseInt(local, 10) + 1;
    localStorage.setItem(KEYS.VISITORS, newCount.toString());
    return newCount;
  },

  async getVisitorCount(): Promise<number> {
    try {
      const { data } = await supabase
        .from("portfolio_analytics")
        .select("value")
        .eq("key", "visitors")
        .single();
      if (data) return data.value || 0;
    } catch (err) {
      console.warn("Supabase getVisitorCount query failed:", err);
    }
    return parseInt(localStorage.getItem(KEYS.VISITORS) || "0", 10);
  },

  // 3. RESUME DOWNLOAD COUNTER
  async incrementDownloadCount(roleId: string): Promise<number> {
    const key = `download_${roleId}`;
    try {
      const { data } = await supabase
        .from("portfolio_analytics")
        .select("value")
        .eq("key", key)
        .single();
        
      const current = data ? (data.value || 0) : 0;
      const next = current + 1;
      
      const { error } = await supabase
        .from("portfolio_analytics")
        .upsert({ key, value: next }, { onConflict: "key" });
        
      if (!error) return next;
      throw error;
    } catch (err) {
      console.warn(`Supabase incrementDownloadCount failed for ${roleId}, logging locally:`, err);
    }
    const local = localStorage.getItem(KEYS.DOWNLOADS) || "{}";
    const data = JSON.parse(local);
    data[roleId] = (data[roleId] || 0) + 1;
    localStorage.setItem(KEYS.DOWNLOADS, JSON.stringify(data));
    return data[roleId];
  },

  async getDownloadCounts(): Promise<Record<string, number>> {
    try {
      const { data, error } = await supabase
        .from("portfolio_analytics")
        .select("key, value")
        .like("key", "download_%");
        
      if (data && !error) {
        const counts: Record<string, number> = {};
        data.forEach(row => {
          const roleId = row.key.replace("download_", "");
          counts[roleId] = row.value || 0;
        });
        return counts;
      }
    } catch (err) {
      console.warn("Supabase getDownloadCounts query failed:", err);
    }
    return JSON.parse(localStorage.getItem(KEYS.DOWNLOADS) || "{}");
  },

  // 4. PROJECT CLICKS ANALYTICS
  async incrementProjectClick(projectId: string): Promise<number> {
    const key = `click_${projectId}`;
    try {
      const { data } = await supabase
        .from("portfolio_analytics")
        .select("value")
        .eq("key", key)
        .single();
        
      const current = data ? (data.value || 0) : 0;
      const next = current + 1;
      
      const { error } = await supabase
        .from("portfolio_analytics")
        .upsert({ key, value: next }, { onConflict: "key" });
        
      if (!error) return next;
      throw error;
    } catch (err) {
      console.warn(`Supabase incrementProjectClick failed for ${projectId}, logging locally:`, err);
    }
    const local = localStorage.getItem(KEYS.ANALYTICS_PROJECTS) || "{}";
    const data = JSON.parse(local);
    data[projectId] = (data[projectId] || 0) + 1;
    localStorage.setItem(KEYS.ANALYTICS_PROJECTS, JSON.stringify(data));
    return data[projectId];
  },

  async getProjectClicks(): Promise<Record<string, number>> {
    try {
      const { data, error } = await supabase
        .from("portfolio_analytics")
        .select("key, value")
        .like("key", "click_%");
        
      if (data && !error) {
        const clicks: Record<string, number> = {};
        data.forEach(row => {
          const projectId = row.key.replace("click_", "");
          clicks[projectId] = row.value || 0;
        });
        return clicks;
      }
    } catch (err) {
      console.warn("Supabase getProjectClicks query failed:", err);
    }
    return JSON.parse(localStorage.getItem(KEYS.ANALYTICS_PROJECTS) || "{}");
  },

  // 5. CONTACT FORM MESSAGES
  async addMessage(msg: { name: string; email: string; message: string; role?: string }): Promise<void> {
    const fullMsg = {
      ...msg,
      timestamp: new Date().toISOString()
    };
    try {
      const { error } = await supabase
        .from("portfolio_messages")
        .insert(fullMsg);
      if (!error) return;
      throw error;
    } catch (err) {
      console.warn("Supabase addMessage failed. Storing message locally:", err);
    }
    const local = localStorage.getItem(KEYS.MESSAGES) || "[]";
    const messages = JSON.parse(local);
    messages.push(fullMsg);
    localStorage.setItem(KEYS.MESSAGES, JSON.stringify(messages));
  },

  async getMessages(): Promise<Array<{ name: string; email: string; message: string; timestamp: string; role?: string }>> {
    try {
      const { data, error } = await supabase
        .from("portfolio_messages")
        .select("*")
        .order("timestamp", { ascending: false });
        
      if (data && !error) return data;
    } catch (err) {
      console.warn("Supabase getMessages query failed:", err);
    }
    const local = localStorage.getItem(KEYS.MESSAGES) || "[]";
    return JSON.parse(local).sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
};

// ----------------------------------------------------
// STORAGE SERVICES (Supabase implementation)
// ----------------------------------------------------
export const storageService = {
  async uploadResume(file: File, roleId: string): Promise<{ downloadUrl: string; name: string; size: string }> {
    const fileSizeStr = `${(file.size / 1024 / 1024).toFixed(2)} MB`;
    
    try {
      // 1. Upload to resumes bucket
      const { error } = await supabase.storage
        .from("resumes")
        .upload(`${roleId}/${file.name}`, file, { cacheControl: "3600", upsert: true });
        
      if (error) throw error;
      
      // 2. Resolve Public URL
      const { data: { publicUrl } } = supabase.storage
        .from("resumes")
        .getPublicUrl(`${roleId}/${file.name}`);
        
      const metadata = {
        downloadUrl: publicUrl,
        name: file.name,
        size: fileSizeStr,
        uploadedAt: new Date().toISOString()
      };
      
      // 3. Save metadata record to config table
      await supabase
        .from("portfolio_config")
        .upsert({ key: `resume_${roleId}`, value: metadata }, { onConflict: "key" });
        
      return metadata;
    } catch (err) {
      console.warn("Supabase Storage resume upload failed. Storing locally:", err);
    }

    // Local Storage Mock fallback
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        const mockUrl = base64data;
        const localResumes = localStorage.getItem(KEYS.RESUMES) || "{}";
        const resumes = JSON.parse(localResumes);
        resumes[roleId] = {
          downloadUrl: mockUrl,
          name: file.name,
          size: fileSizeStr,
          uploadedAt: new Date().toISOString()
        };
        localStorage.setItem(KEYS.RESUMES, JSON.stringify(resumes));
        resolve({
          downloadUrl: mockUrl,
          name: file.name,
          size: fileSizeStr
        });
      };
      reader.readAsDataURL(file);
    });
  },

  async getUploadedResume(roleId: string): Promise<{ downloadUrl: string; name: string; size: string } | null> {
    try {
      const { data } = await supabase
        .from("portfolio_config")
        .select("value")
        .eq("key", `resume_${roleId}`)
        .single();
      if (data && data.value) return data.value;
    } catch (err) {
      console.warn(`Supabase getUploadedResume query failed for ${roleId}:`, err);
    }
    
    const localResumes = localStorage.getItem(KEYS.RESUMES) || "{}";
    const resumes = JSON.parse(localResumes);
    return resumes[roleId] || null;
  }
};

// ----------------------------------------------------
// AUTHENTICATION SERVICES (Supabase implementation)
// ----------------------------------------------------
export const authService = {
  async login(password: string): Promise<boolean> {
    if (password === "admin123" || password === "admin") {
      localStorage.setItem(KEYS.AUTH_USER, "true");
      return true;
    }
    return false;
  },

  async logout(): Promise<void> {
    localStorage.removeItem(KEYS.AUTH_USER);
  },

  async isAuthenticated(): Promise<boolean> {
    return localStorage.getItem(KEYS.AUTH_USER) === "true";
  }
};
