'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { auth } from './firebase'; 
import { Builder, NewsArticle, SiteSettings, Lead, RecruitmentLead, Property, BlogPost } from './types';
import { LeadService } from './services/LeadService';
import { ContentService } from './services/ContentService';
import { PropertyService } from './services/PropertyService';
import { useRates } from './RateContext';

interface AdminContextType {
  user: User | null;
  loadingAuth: boolean;
  builders: Builder[];
  newsArticles: NewsArticle[];
  siteSettings: SiteSettings;
  leads: Lead[];
  recruitmentLeads: RecruitmentLead[];
  properties: Property[];
  blogPosts: BlogPost[];
  
  login: (email: string, pass: string) => Promise<void>;
  verifyOtp: (token: string) => boolean;
  logout: () => Promise<void>;
  
  updateSettings: (settings: Partial<SiteSettings>) => void;
  addLead: (lead: Omit<Lead, 'id' | 'date' | 'status' | 'userAgent' | 'pageSource'>) => void;
  updateLeadStatus: (id: string, status: Lead['status']) => void;
  refreshLeads: () => void;
  publishBlogPost: (post: Partial<BlogPost>) => Promise<void>;
  deleteBlogPost: (id: string) => Promise<void>;
  updateMortgageRate: (id: string, rate: number) => Promise<void>;
  publishNews: (news: Omit<NewsArticle, 'id'>) => Promise<void>;
  refreshProperties: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const { refreshRates } = useRates();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([]);
  const [builders, setBuilders] = useState<Builder[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
        enableMortgageCalculator: true,
        enableTriggerRateTool: true,
        enableLTTCalculator: true,
        enableNewsScraper: true,
        useExternalRatesWidget: false,
        ratesWidgetUrl: 'https://gopineapple.ca/muditchhura/rates?embed=true',
  });
  const [recruitmentLeads, setRecruitmentLeads] = useState<RecruitmentLead[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
      if (currentUser) {
        refreshAllData();
        refreshRates();
      }
    });
    return () => unsubscribe();
  }, []);

  const refreshAllData = async () => {
    try {
      const fetchedLeads = await LeadService.fetchLeads();
      setLeads(fetchedLeads); 
      
      const fetchedPosts = await ContentService.fetchPosts();
      setBlogPosts(fetchedPosts);
      
      const fetchedNews = await ContentService.fetchNews();
      setNewsArticles(fetchedNews);

      const fetchedProperties = await PropertyService.fetchProperties();
      setProperties(fetchedProperties);
    } catch (error) {
      console.error("Error refreshing data:", error);
    }
  };

  const login = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error: any) {
      console.error("Login Failed:", error.message);
      throw new Error("Invalid Credentials");
    }
  };

  const verifyOtp = (token: string) => {
    const secret = "451862"; 
    
    return token === secret;
    }
    

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  const updateSettings = (newSettings: Partial<SiteSettings>) => {
    setSiteSettings(prev => ({ ...prev, ...newSettings }));
  };

  const addLead = async (leadData: any) => {
    const res = await LeadService.submitLead(leadData);
    if (res.success) refreshAllData();
  };

  const updateLeadStatus = async (id: string, status: Lead['status']) => {
    await LeadService.updateStatus(id, status);
    refreshAllData();
  };

  const publishBlogPost = async (post: Partial<BlogPost>) => {
    // @ts-ignore
    await ContentService.createPost(post);
    refreshAllData();
  };

  const deleteBlogPost = async (id: string) => {
    await ContentService.deletePost(id);
    refreshAllData();
  };

  const updateMortgageRate = async (id: string, rate: number) => {
    await ContentService.updateRate(id, rate);
    await refreshRates();
  };

  const publishNews = async (news: Omit<NewsArticle, 'id'>) => {
    await ContentService.createNews(news);
    refreshAllData();
  };

  return (
    <AdminContext.Provider value={{ 
      user, loadingAuth,
      builders, newsArticles, siteSettings, leads, recruitmentLeads, properties, blogPosts,
      login, verifyOtp, logout, 
      updateSettings, addLead, updateLeadStatus, refreshLeads: refreshAllData,
      publishBlogPost, deleteBlogPost, updateMortgageRate, publishNews,
      refreshProperties: refreshAllData 
    }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) throw new Error('useAdmin must be used within AdminProvider');
  return context;
};