import * as LucideIcons from 'lucide-react';
import { getIconByName } from '@/components/custom/CustomIconScheme';
import type { LucideIcon } from 'lucide-react';

// Helper function to get icon for a field name
export const getIconForField = (fieldName: string): LucideIcon => {
  const fieldLower = fieldName.toLowerCase();
  
  if (fieldLower.includes('email') || fieldLower.includes('mail')) return getIconByName('Mail') || LucideIcons.Mail;
  if (fieldLower.includes('phone') || fieldLower.includes('mobile') || fieldLower.includes('contact')) return getIconByName('Phone') || LucideIcons.Phone;
  if (fieldLower.includes('address') || fieldLower.includes('location')) return getIconByName('MapPin') || LucideIcons.MapPin;
  if (fieldLower.includes('url') || fieldLower.includes('link') || fieldLower.includes('website')) return getIconByName('Globe') || LucideIcons.Globe;
  if (fieldLower.includes('status') || fieldLower.includes('state')) return getIconByName('Info') || LucideIcons.Info;
  if (fieldLower.includes('ssl') || fieldLower.includes('certificate') || fieldLower.includes('security')) return getIconByName('Shield') || LucideIcons.Shield;
  if (fieldLower.includes('ip') || fieldLower.includes('server') || fieldLower.includes('domain')) return getIconByName('Server') || LucideIcons.Server;
  if (fieldLower.includes('country') || fieldLower.includes('location')) return getIconByName('MapPin') || LucideIcons.MapPin;
  if (fieldLower.includes('social') || fieldLower.includes('facebook') || fieldLower.includes('instagram') || fieldLower.includes('linkedin')) return getIconByName('Users') || LucideIcons.Users;
  if (fieldLower.includes('navigation') || fieldLower.includes('navbar')) return getIconByName('Navigation') || LucideIcons.Navigation;
  if (fieldLower.includes('policy') || fieldLower.includes('terms') || fieldLower.includes('privacy') || fieldLower.includes('refund')) return getIconByName('FileText') || LucideIcons.FileText;
  if (fieldLower.includes('product') || fieldLower.includes('shop') || fieldLower.includes('cart')) return getIconByName('ShoppingCart') || LucideIcons.ShoppingCart;
  if (fieldLower.includes('content') || fieldLower.includes('analysis') || fieldLower.includes('check')) return getIconByName('FileSearch') || LucideIcons.FileSearch;
  if (fieldLower.includes('logo') || fieldLower.includes('brand')) return getIconByName('BadgeInfo') || LucideIcons.BadgeInfo;
  if (fieldLower.includes('about') || fieldLower.includes('description') || fieldLower.includes('lob')) return getIconByName('Info') || LucideIcons.Info;
  if (fieldLower.includes('price') || fieldLower.includes('cost') || fieldLower.includes('currency')) return getIconByName('Banknote') || LucideIcons.Banknote;
  if (fieldLower.includes('availability') || fieldLower.includes('stock')) return getIconByName('CheckCircle2') || LucideIcons.CheckCircle2;
  if (fieldLower.includes('image') || fieldLower.includes('photo') || fieldLower.includes('picture')) return getIconByName('FileText') || LucideIcons.FileText;
  if (fieldLower.includes('language') || fieldLower.includes('grammar') || fieldLower.includes('spell')) return getIconByName('Languages') || LucideIcons.Languages;
  if (fieldLower.includes('frequent') || fieldLower.includes('word')) return getIconByName('Hash') || LucideIcons.Hash;
  if (fieldLower.includes('signup') || fieldLower.includes('login') || fieldLower.includes('register')) return getIconByName('LogIn') || LucideIcons.LogIn;
  if (fieldLower.includes('date') || fieldLower.includes('created') || fieldLower.includes('age')) return getIconByName('CalendarClock') || LucideIcons.CalendarClock;
  if (fieldLower.includes('time') || fieldLower.includes('response')) return getIconByName('Timer') || LucideIcons.Timer;
  if (fieldLower.includes('copyright') || fieldLower.includes('legal')) return getIconByName('Copyright') || LucideIcons.Copyright;
  if (fieldLower.includes('owner') || fieldLower.includes('registrar')) return getIconByName('User') || LucideIcons.User;
  if (fieldLower.includes('profile')) return getIconByName('UserCheck') || LucideIcons.UserCheck;
  if (fieldLower.includes('working')) return getIconByName('Activity') || LucideIcons.Activity;
  
  return getIconByName('Info') || LucideIcons.Info;
};

