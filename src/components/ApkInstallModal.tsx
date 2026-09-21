import React, { useState } from 'react';
import { Smartphone, Download, CheckCircle2, ExternalLink, X, Copy, Music2, Share, PlusSquare, AlertCircle, FileCode, Github, Terminal } from 'lucide-react';

interface ApkInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  deferredPrompt: any;
  onNativeInstall: () => void;
  isInstallable: boolean;
}

const MANIFEST_DATA = {
  id: "/",
  name: "Buddy - Voice Music Assistant",
  short_name: "Buddy Music",
  description: "Voice-activated music assistant awakened with 'Hey Buddy', featuring high-fidelity audio playback, hands-free Hindi and English voice controls, and smart playback commands.",
  lang: "en",
  dir: "ltr",
  start_url: "/",
  scope: "/",
  display: "standalone",
  orientation: "portrait-primary",
  background_color: "#000000",
  theme_color: "#000000",
  prefer_related_applications: false,
  categories: ["music", "entertainment", "utilities"],
  icons: [
    {
      src: "/icon-192.png",
      sizes: "192x192",
      type: "image/png",
      purpose: "any"
    },
    {
      src: "/icon-512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "any"
    },
    {
      src: "/icon-maskable.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "maskable"
    }
  ]
};

export const ApkInstallModal: React.FC<ApkInstallModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
  onNativeInstall,
  isInstallable,
}) => {
  const [activeTab, setActiveTab] = useState<'github' | 'android' | 'pwabuilder' | 'shortcut'>('github');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedManifest, setCopiedManifest] = useState(false);
  const [copiedGit, setCopiedGit] = useState(false);

  if (!isOpen) return null;

  const PUBLIC_APP_URL = 'https://ais-pre-7m6wppvuhbt4fh6454dfls-58305786231.asia-southeast1.run.app';
  const currentUrl = typeof window !== 'undefined' && !window.location.origin.includes('ais-dev-')
    ? window.location.origin
    : PUBLIC_APP_URL;

  const handleCopyUrl = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(currentUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  const handleCopyGitCommands = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      const gitCmds = `git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/<YOUR_REPO_NAME>.git\ngit branch -M main\ngit push -u origin main`;
      navigator.clipboard.writeText(gitCmds);
      setCopiedGit(true);
      setTimeout(() => setCopiedGit(false), 2500);
    }
  };

  const handleCopyManifest = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      const manifestWithFullUrls = {
        ...MANIFEST_DATA,
        start_url: currentUrl + "/",
        scope: currentUrl + "/",
        icons: MANIFEST_DATA.icons.map(icon => ({
          ...icon,
          src: `${currentUrl}${icon.src}`
        }))
      };
      navigator.clipboard.writeText(JSON.stringify(manifestWithFullUrls, null, 2));
      setCopiedManifest(true);
      setTimeout(() => setCopiedManifest(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      {/* Modal Sheet / Card */}
      <div
        id="install-modal-sheet"
        className="relative w-full max-w-lg bg-[#1c1c1e] border-t sm:border border-white/15 rounded-t-[36px] sm:rounded-[36px] p-5 sm:p-6 shadow-2xl overflow-hidden backdrop-blur-3xl max-h-[90vh] flex flex-col"
      >
        {/* Mobile Drag Handle */}
        <div className="w-12 h-1.5 bg-white/30 rounded-full mx-auto mb-3 sm:hidden" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/10 text-white/70 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-4">
          <div className="w-11 h-11 rounded-[18px] bg-gradient-to-tr from-[#fa243c] to-[#af52de] flex items-center justify-center text-white shadow-lg shrink-0">
            <Music2 className="w-6 h-6" />
          </div>
          <div className="pr-8">
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Install Buddy Music
            </h3>
            <p className="text-xs text-white/60">
              Direct Phone Install & PWABuilder Helper
            </p>
          </div>
        </div>

        {/* Platform Selector Segment */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-[#2c2c2e] rounded-full mb-4 shrink-0">
          <button
            onClick={() => setActiveTab('github')}
            className={`py-2 px-1 rounded-full text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'github'
                ? 'bg-[#fa243c] text-white shadow-md font-bold'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Github className="w-3.5 h-3.5" />
            <span className="truncate">GitHub APK</span>
          </button>
          <button
            onClick={() => setActiveTab('android')}
            className={`py-2 px-1 rounded-full text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'android'
                ? 'bg-white text-black shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="truncate">Chrome</span>
          </button>
          <button
            onClick={() => setActiveTab('pwabuilder')}
            className={`py-2 px-1 rounded-full text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'pwabuilder'
                ? 'bg-[#30d158] text-black shadow-md font-bold'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span className="truncate">PWABuilder</span>
          </button>
          <button
            onClick={() => setActiveTab('shortcut')}
            className={`py-2 px-1 rounded-full text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'shortcut'
                ? 'bg-white text-black shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Share className="w-3.5 h-3.5" />
            <span className="truncate">Shortcut</span>
          </button>
        </div>

        <div className="overflow-y-auto pr-1 space-y-3.5 text-xs text-white/80">
          {/* TAB 0: GITHUB ACTIONS APK AUTO-BUILD */}
          {activeTab === 'github' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-[20px] bg-gradient-to-r from-[#fa243c]/20 to-purple-500/20 border border-[#fa243c]/40 flex items-start gap-2.5">
                <Github className="w-5 h-5 text-white shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white text-sm">GitHub Actions APK Builder is Ready!</p>
                  <p className="text-white/80 text-[11px] mt-0.5 leading-relaxed">
                    Aapke project me <code className="bg-black/50 text-red-300 px-1 py-0.5 rounded">.github/workflows/build-apk.yml</code> aur <code className="bg-black/50 text-red-300 px-1 py-0.5 rounded">twa-manifest.json</code> already add kar diya gaya hai.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-[20px] bg-[#2c2c2e]/70 border border-white/10 space-y-2.5">
                <p className="font-semibold text-white flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-[#fa243c] text-[10px] flex items-center justify-center text-white font-bold">1</span>
                  AI Studio se GitHub me Export Karein:
                </p>
                <p className="text-white/70 text-[11px] leading-relaxed pl-5">
                  AI Studio ke top-right me <strong>Project Settings / Menu (⋮)</strong> kholein aur <strong>"Export to GitHub"</strong> ya <strong>"Download ZIP"</strong> choose karein.
                </p>

                <div className="h-px bg-white/10 my-2" />

                <p className="font-semibold text-white flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-[#fa243c] text-[10px] flex items-center justify-center text-white font-bold">2</span>
                  Terminal se Git Push karne ka command:
                </p>
                <div className="bg-black/60 rounded-xl p-2.5 font-mono text-[10px] text-green-400 border border-white/10 space-y-1">
                  <p>git remote add origin https://github.com/&lt;USERNAME&gt;/&lt;REPO&gt;.git</p>
                  <p>git branch -M main</p>
                  <p>git push -u origin main</p>
                </div>
                <button
                  onClick={handleCopyGitCommands}
                  className="w-full py-2.5 px-3 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-white font-medium flex items-center justify-center gap-2 transition-all cursor-pointer text-xs"
                >
                  {copiedGit ? <CheckCircle2 className="w-3.5 h-3.5 text-[#30d158]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedGit ? 'Git Commands Copied!' : 'Copy Git Push Commands'}</span>
                </button>

                <div className="h-px bg-white/10 my-2" />

                <p className="font-semibold text-white flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-[#30d158] text-[10px] flex items-center justify-center text-black font-bold">3</span>
                  APK Kaise Milega:
                </p>
                <p className="text-white/70 text-[11px] leading-relaxed pl-5">
                  Jaise hi code GitHub par push hoga, GitHub Actions automatically Bubblewrap se APK build karega. GitHub repo ke <strong>"Actions"</strong> tab me jaakar <strong>Buddy-Music-Android-APK</strong> ya <strong>"Releases"</strong> se direct APK download kar sakte hain!
                </p>
              </div>
            </div>
          )}
          {/* TAB 1: DIRECT PHONE INSTALL */}
          {activeTab === 'android' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-[20px] bg-[#30d158]/10 border border-[#30d158]/30 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#30d158] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white">PWABuilder ki zaroorat nahi hai!</p>
                  <p className="text-white/70 text-[11px] mt-0.5 leading-relaxed">
                    Android Chrome browser sidhe app ko native app (WebAPK) bana kar install karta hai. Niche button dabayein:
                  </p>
                </div>
              </div>

              {isInstallable ? (
                <button
                  onClick={() => {
                    onNativeInstall();
                    onClose();
                  }}
                  className="w-full py-3.5 px-4 rounded-full bg-[#30d158] hover:bg-[#28b84d] text-black font-bold flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer text-sm active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>Install App on Phone Now</span>
                </button>
              ) : (
                <div className="p-3.5 rounded-[20px] bg-[#2c2c2e]/70 border border-white/10 space-y-2">
                  <p className="font-semibold text-white">Chrome se direct install kaise karein:</p>
                  <ol className="list-decimal pl-4 space-y-1.5 text-white/70 text-[11px]">
                    <li>Phone ke <strong>Chrome Browser</strong> me ye website kholein.</li>
                    <li>Upar right corner me <strong>3 dots (⋮)</strong> tap karein.</li>
                    <li><strong>"Install app"</strong> ya <strong>"Add to Home screen"</strong> par tap karein.</li>
                    <li>Confirm karein — app aapke phone ke app drawer me install ho jayegi!</li>
                  </ol>
                </div>
              )}

              <button
                onClick={handleCopyUrl}
                className="w-full py-2.5 px-4 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-white font-medium flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {copiedUrl ? <CheckCircle2 className="w-4 h-4 text-[#30d158]" /> : <Copy className="w-4 h-4" />}
                <span>{copiedUrl ? 'Phone URL Copied!' : 'Copy Website URL for Phone Chrome'}</span>
              </button>
            </div>
          )}

          {/* TAB 2: PWABUILDER FIX */}
          {activeTab === 'pwabuilder' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-[20px] bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white">"Missing Name / Description" kyu aaya?</p>
                  <p className="text-white/70 text-[11px] mt-1 leading-relaxed">
                    Kyunki AI Studio ka dev URL (<code className="text-white bg-black/40 px-1 py-0.5 rounded text-[10px]">ais-dev-...</code>) private hai aur Google security cookie maangta hai. PWABuilder ka bot use access nahi kar pata.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-[20px] bg-[#2c2c2e]/70 border border-white/10 space-y-2">
                <p className="font-semibold text-white">PWABuilder Solution:</p>
                <p className="text-white/70 text-[11px] leading-relaxed">
                  PWABuilder me <strong>"Edit manifest"</strong> ya <strong>"Create a web app"</strong> tap karein aur niche button se 100% valid manifest paste karein:
                </p>

                <button
                  onClick={handleCopyManifest}
                  className="w-full py-3 px-4 rounded-full bg-white text-black font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md hover:bg-white/90 active:scale-95"
                >
                  {copiedManifest ? <CheckCircle2 className="w-4 h-4 text-[#30d158]" /> : <Copy className="w-4 h-4 text-black" />}
                  <span>{copiedManifest ? 'Manifest JSON Copied!' : 'Copy Valid Manifest JSON for PWABuilder'}</span>
                </button>
              </div>

              <a
                href="https://www.pwabuilder.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-white font-medium flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Open PWABuilder.com</span>
                <ExternalLink className="w-3.5 h-3.5 text-white/60" />
              </a>
            </div>
          )}

          {/* TAB 3: SHORTCUT */}
          {activeTab === 'shortcut' && (
            <div className="space-y-3">
              <div className="p-3 rounded-[20px] bg-[#2c2c2e]/70 border border-white/10 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#0a84ff]/20 text-[#0a84ff] flex items-center justify-center font-bold shrink-0 text-xs">
                  1
                </div>
                <div>
                  <p className="font-semibold text-white">Open in Browser</p>
                  <p className="text-white/60 text-[11px] mt-0.5">
                    Safari ya Chrome me open karein.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-[20px] bg-[#2c2c2e]/70 border border-white/10 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#0a84ff]/20 text-[#0a84ff] flex items-center justify-center shrink-0">
                  <Share className="w-3.5 h-3.5 text-[#0a84ff]" />
                </div>
                <div>
                  <p className="font-semibold text-white">Tap Share / Menu</p>
                  <p className="text-white/60 text-[11px] mt-0.5">
                    Browser toolbar me Share ya 3 dots menu tap karein.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-[20px] bg-[#2c2c2e]/70 border border-white/10 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#30d158]/20 text-[#30d158] flex items-center justify-center shrink-0">
                  <PlusSquare className="w-3.5 h-3.5 text-[#30d158]" />
                </div>
                <div>
                  <p className="font-semibold text-white">Add to Home Screen</p>
                  <p className="text-white/60 text-[11px] mt-0.5">
                    "Add to Home Screen" choose karein.
                  </p>
                </div>
              </div>

              <button
                onClick={handleCopyUrl}
                className="w-full py-2.5 px-4 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-white font-medium flex items-center justify-center gap-2 transition-all cursor-pointer mt-2"
              >
                {copiedUrl ? <CheckCircle2 className="w-4 h-4 text-[#30d158]" /> : <Copy className="w-4 h-4" />}
                <span>{copiedUrl ? 'Link Copied!' : 'Copy App URL'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
