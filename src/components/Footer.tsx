import { Rocket, Mail, Phone, MapPin, Facebook, Youtube, Instagram, MessageCircle, ExternalLink } from "lucide-react";
import Link from "next/link";
import { SiteSettings } from "@/lib/google/settings";

export default function Footer({ settings }: { settings: SiteSettings }) {
  const hasContact = settings.contact_email || settings.contact_phone || settings.line_id;
  const hasSocial = settings.facebook_url || settings.youtube_url || settings.instagram_url;
  const hasAddress = settings.address;

  return (
    <footer id="contact" className="relative w-full bg-slate-950 border-t border-white/5 scroll-mt-20">
      {/* Top gradient line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-400/30 to-transparent"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          
          {/* Brand Column */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2.5 group mb-4">
              <div className="w-9 h-9 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(250,204,21,0.2)]">
                <Rocket className="text-slate-950 w-4 h-4" />
              </div>
              <span className="text-xl font-black text-white tracking-tighter">
                DeeDev<span className="text-yellow-400">IOT</span>
              </span>
            </Link>
            {settings.footer_description && (
              <p className="text-sm text-slate-500 leading-relaxed mt-3 max-w-xs">
                {settings.footer_description}
              </p>
            )}
          </div>

          {/* Contact Column */}
          {hasContact && (
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4">ช่องทางติดต่อ</h3>
              <ul className="space-y-3">
                {settings.contact_email && (
                  <li>
                    <a href={`mailto:${settings.contact_email}`} className="flex items-center gap-3 text-sm text-slate-400 hover:text-yellow-400 transition-colors group">
                      <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center group-hover:border-yellow-400/50 transition-colors shrink-0">
                        <Mail size={14} className="text-slate-500 group-hover:text-yellow-400 transition-colors" />
                      </div>
                      <span className="truncate">{settings.contact_email}</span>
                    </a>
                  </li>
                )}
                {settings.contact_phone && (
                  <li>
                    <a href={`tel:${settings.contact_phone}`} className="flex items-center gap-3 text-sm text-slate-400 hover:text-yellow-400 transition-colors group">
                      <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center group-hover:border-yellow-400/50 transition-colors shrink-0">
                        <Phone size={14} className="text-slate-500 group-hover:text-yellow-400 transition-colors" />
                      </div>
                      <span>{settings.contact_phone}</span>
                    </a>
                  </li>
                )}
                {settings.line_id && (
                  <li>
                    <a href={`https://line.me/ti/p/${settings.line_id.replace('@', '~')}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm text-slate-400 hover:text-green-400 transition-colors group">
                      <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center group-hover:border-green-400/50 transition-colors shrink-0">
                        <MessageCircle size={14} className="text-slate-500 group-hover:text-green-400 transition-colors" />
                      </div>
                      <span>LINE: {settings.line_id}</span>
                    </a>
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Social Column */}
          {hasSocial && (
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4">โซเชียลมีเดีย</h3>
              <ul className="space-y-3">
                {settings.facebook_url && (
                  <li>
                    <a href={settings.facebook_url} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm text-slate-400 hover:text-blue-400 transition-colors group">
                      <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center group-hover:border-blue-400/50 transition-colors shrink-0">
                        <Facebook size={14} className="text-slate-500 group-hover:text-blue-400 transition-colors" />
                      </div>
                      <span>Facebook</span>
                      <ExternalLink size={12} className="text-slate-700 ml-auto" />
                    </a>
                  </li>
                )}
                {settings.youtube_url && (
                  <li>
                    <a href={settings.youtube_url} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm text-slate-400 hover:text-red-400 transition-colors group">
                      <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center group-hover:border-red-400/50 transition-colors shrink-0">
                        <Youtube size={14} className="text-slate-500 group-hover:text-red-400 transition-colors" />
                      </div>
                      <span>YouTube</span>
                      <ExternalLink size={12} className="text-slate-700 ml-auto" />
                    </a>
                  </li>
                )}
                {settings.instagram_url && (
                  <li>
                    <a href={settings.instagram_url} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm text-slate-400 hover:text-pink-400 transition-colors group">
                      <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center group-hover:border-pink-400/50 transition-colors shrink-0">
                        <Instagram size={14} className="text-slate-500 group-hover:text-pink-400 transition-colors" />
                      </div>
                      <span>Instagram</span>
                      <ExternalLink size={12} className="text-slate-700 ml-auto" />
                    </a>
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Address Column */}
          {hasAddress && (
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4">ที่อยู่</h3>
              <div className="flex items-start gap-3 text-sm text-slate-400">
                <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin size={14} className="text-slate-500" />
                </div>
                <p className="leading-relaxed whitespace-pre-line">{settings.address}</p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-600 font-medium tracking-wider">
            © {new Date().getFullYear()} DeeDevIOT — Built with precision.
          </p>
          {hasSocial && (
            <div className="flex items-center gap-3">
              {settings.facebook_url && (
                <a href={settings.facebook_url} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 hover:text-blue-400 hover:border-blue-400/50 transition-all hover:scale-110">
                  <Facebook size={14} />
                </a>
              )}
              {settings.youtube_url && (
                <a href={settings.youtube_url} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 hover:text-red-400 hover:border-red-400/50 transition-all hover:scale-110">
                  <Youtube size={14} />
                </a>
              )}
              {settings.instagram_url && (
                <a href={settings.instagram_url} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 hover:text-pink-400 hover:border-pink-400/50 transition-all hover:scale-110">
                  <Instagram size={14} />
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
