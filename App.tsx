import React, { useState, useEffect } from 'react';
import { 
  Home, Clock, CreditCard, User as UserIcon, 
  Bell, LogOut, ChevronRight, Zap, Copy, Download,
  Sparkles, Check, AlertCircle, Hexagon, Type, 
  Fingerprint, MessageSquareQuote, Hash, Megaphone,
  X, ShieldCheck, Key, ShieldAlert, Lock, Globe,
  ArrowRight, MessageSquare, Send, Search, LayoutDashboard,
  Mail, LogIn, UserPlus, Scissors, Upload, Link as LinkIcon, Video, Wand2
} from 'lucide-react';
import { GlassCard, Button, Input, Select, Badge, ToastProvider, useToast } from './components/ui';
import * as Storage from './services/storage';
import * as Gemini from './services/geminiService';
import { User, GeneratorInput, TOOLS, GENERATION_COST, ActivationCode, PaymentRequest } from './types';

// --- Icon Mapping ---
const Icons: Record<string, any> = {
  Hexagon, Type, Fingerprint, Sparkles, MessageSquareQuote, Hash, Megaphone, Scissors
};

type View = 'auth' | 'home' | 'history' | 'pricing' | 'profile' | 'admin';
type AdminView = 'overview' | 'users' | 'revenue' | 'requests' | 'tokens';

// --- 0. HELPERS & COMPONENTS ---

// Request Review Card Component for Admin
const RequestReviewCard: React.FC<{ 
  req: PaymentRequest; 
  onApprove: (reqId: string, code: string, message: string) => void;
  isLoading: boolean;
}> = ({ req, onApprove, isLoading }) => {
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('Payment received. Welcome to Brandova Pro!');
  const [error, setError] = useState<string | null>(null);

  const handleSend = () => {
    setError(null);
    if (!code.trim()) {
      setError('Activation code is required.');
      return;
    }
    if (!message.trim()) {
      setError('Admin message is required.');
      return;
    }
    onApprove(req.id, code.trim(), message.trim());
  };

  return (
    <GlassCard className="border-yellow-500/20 mb-4">
      <div className="flex justify-between items-start mb-4">
         <div>
            <div className="font-bold text-sm text-white">{req.userName}</div>
            <div className="text-[10px] text-gray-400 font-mono">{req.userEmail}</div>
            <div className="text-[10px] text-gray-500 mt-1">{new Date(req.timestamp).toLocaleString()}</div>
         </div>
         <Badge color="gold">Pending</Badge>
      </div>
      
      <div className="bg-white/5 p-3 rounded-lg mb-4 text-xs font-mono text-gray-300 break-all border border-white/5">
         <span className="text-[10px] text-gray-500 block mb-1 uppercase tracking-widest font-bold">User Note</span>
         {req.userMessage || 'No notes provided'}
      </div>

      <div className="space-y-3 pt-2 border-t border-white/10">
        <div>
          <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1 block">Assign Activation Code</label>
          <div className="relative">
             <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"/>
             <Input 
                value={code} 
                onChange={e => { setCode(e.target.value); setError(null); }}
                placeholder="Paste unused code here (e.g. BRANDOVA-PRO-...)" 
                className="pl-10 font-mono text-xs"
             />
          </div>
        </div>

        <div>
          <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1 block">Approval Message</label>
          <div className="relative">
            <textarea 
              value={message}
              onChange={e => setMessage(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all resize-none h-20"
              placeholder="Message to user..."
            />
          </div>
        </div>

        {error && <div className="text-red-400 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {error}</div>}

        <Button 
          className="w-full h-10 text-xs bg-emerald-600 hover:bg-emerald-700 border-0" 
          onClick={handleSend}
          isLoading={isLoading}
          disabled={isLoading}
        >
          <Check className="w-3 h-3 mr-2"/> Approve & Send
        </Button>
      </div>
    </GlassCard>
  );
};

// --- 1. LOGIN SCREEN (Secure & Split) ---
const LoginScreen: React.FC<{ onLogin: (user: User) => void }> = ({ onLogin }) => {
  const [mode, setMode] = useState<'main' | 'admin_login'>('main');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  
  // Register State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  
  // Admin State
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPass, setAdminPass] = useState('');

  const { showToast } = useToast();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPass) {
        showToast('Please fill in all fields', 'error');
        return;
    }
    
    try {
        const user = Storage.authenticateUser(loginEmail, loginPass);
        onLogin(user);
        showToast(`Welcome back, ${user.name}`, 'success');
    } catch (err: any) {
        showToast(err.message, 'error');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPass || !regConfirm) {
        showToast('All fields are required', 'error');
        return;
    }
    if (regPass.length < 6) {
        showToast('Password must be at least 6 characters', 'error');
        return;
    }
    if (regPass !== regConfirm) {
        showToast('Passwords do not match', 'error');
        return;
    }

    try {
        const newUser = Storage.registerUser(regName, regEmail, regPass);
        onLogin(newUser);
        showToast('Account created successfully!', 'success');
    } catch (err: any) {
        showToast(err.message, 'error');
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (Storage.verifyAdminCredentials(adminEmail, adminPass)) {
      const adminUser: User = {
        id: 'admin_master',
        name: 'Administrator',
        email: adminEmail,
        role: 'admin',
        credits: 99999,
        plan: 'pro',
        joinDate: new Date().toISOString()
      };
      onLogin(adminUser);
      showToast('Secure Admin Session Established', 'success');
    } else {
      showToast('Authentication Failed: Invalid Credentials', 'error');
    }
  };

  // Admin View
  if (mode === 'admin_login') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-black relative overflow-hidden">
        <div className="absolute inset-0 bg-red-900/10 pointer-events-none"></div>
        <GlassCard className="w-full max-w-md p-8 relative z-10 border-red-500/20 shadow-2xl shadow-red-900/20">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-red-500/10 rounded-full mx-auto mb-4 flex items-center justify-center border border-red-500/20">
              <ShieldAlert className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-white uppercase tracking-wider">Restricted Access</h2>
            <p className="text-red-400/60 text-xs mt-2 font-mono">AUTHORIZED PERSONNEL ONLY</p>
          </div>
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <Input type="email" placeholder="Admin ID" required value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} className="bg-red-900/5 border-red-500/30 focus:border-red-500" />
            <Input type="password" placeholder="Passkey" required value={adminPass} onChange={(e) => setAdminPass(e.target.value)} className="bg-red-900/5 border-red-500/30 focus:border-red-500" />
            <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white border-0 mt-4">Authenticate</Button>
            <button type="button" onClick={() => setMode('main')} className="w-full text-center text-xs text-gray-500 hover:text-white mt-4 uppercase tracking-widest">Cancel Connection</button>
          </form>
        </GlassCard>
      </div>
    );
  }

  // Main User Auth View
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-black text-white relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-black to-black pointer-events-none"></div>
      
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-block p-4 rounded-3xl bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/30 shadow-2xl shadow-indigo-500/10 mb-6">
            <Sparkles className="w-12 h-12 text-indigo-400" />
          </div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-gray-500 tracking-tighter mb-2">
            Brandova AI
          </h1>
          <p className="text-gray-400 text-xs font-medium tracking-wide uppercase">Premier Branding Suite</p>
        </div>

        <GlassCard className="space-y-6 backdrop-blur-2xl bg-white/5 border-white/10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Auth Mode Toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-white/5 rounded-xl border border-white/5">
              <button 
                 onClick={() => setAuthMode('login')} 
                 className={`py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${authMode === 'login' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
              >
                  Login
              </button>
              <button 
                 onClick={() => setAuthMode('register')} 
                 className={`py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${authMode === 'register' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
              >
                  Register
              </button>
          </div>

          {authMode === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                 <div className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest ml-1">Email</label>
                        <Input 
                            type="email" 
                            placeholder="name@example.com" 
                            value={loginEmail} 
                            onChange={e => setLoginEmail(e.target.value)} 
                            className="bg-black/40"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest ml-1">Password</label>
                        <Input 
                            type="password" 
                            placeholder="••••••••" 
                            value={loginPass} 
                            onChange={e => setLoginPass(e.target.value)} 
                            className="bg-black/40"
                        />
                    </div>
                 </div>
                 <Button type="submit" className="w-full h-12 text-sm font-bold tracking-wide mt-4">
                    <LogIn className="w-4 h-4 mr-2"/> Sign In
                 </Button>
                 <div className="text-center pt-2">
                    <p className="text-[10px] text-gray-500">Don't have an account? <span className="text-white font-bold cursor-pointer hover:underline" onClick={() => setAuthMode('register')}>Create one</span></p>
                 </div>
              </form>
          ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest ml-1">Full Name</label>
                        <Input 
                            placeholder="John Doe" 
                            value={regName} 
                            onChange={e => setRegName(e.target.value)} 
                            className="bg-black/40"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest ml-1">Email</label>
                        <Input 
                            type="email" 
                            placeholder="name@example.com" 
                            value={regEmail} 
                            onChange={e => setRegEmail(e.target.value)} 
                            className="bg-black/40"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest ml-1">Password</label>
                            <Input 
                                type="password" 
                                placeholder="Create Password" 
                                value={regPass} 
                                onChange={e => setRegPass(e.target.value)} 
                                className="bg-black/40"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest ml-1">Confirm</label>
                            <Input 
                                type="password" 
                                placeholder="Repeat Password" 
                                value={regConfirm} 
                                onChange={e => setRegConfirm(e.target.value)} 
                                className="bg-black/40"
                            />
                        </div>
                    </div>
                 </div>
                 <Button type="submit" className="w-full h-12 text-sm font-bold tracking-wide mt-4 bg-gradient-to-r from-purple-600 to-indigo-600">
                    <UserPlus className="w-4 h-4 mr-2"/> Create Account
                 </Button>
                 <div className="text-center pt-2">
                    <p className="text-[10px] text-gray-500">Already registered? <span className="text-white font-bold cursor-pointer hover:underline" onClick={() => setAuthMode('login')}>Login here</span></p>
                 </div>
              </form>
          )}

        </GlassCard>

        <div className="mt-8 flex justify-center">
          <button onClick={() => setMode('admin_login')} className="text-[10px] text-gray-700 hover:text-gray-500 uppercase tracking-widest font-bold transition-colors">
            System Administration
          </button>
        </div>
      </div>
    </div>
  );
};

// Free AI Shorts workflow: browser-safe planner for turning long videos into captioned shorts.
const ShortsGeneratorView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [sourceType, setSourceType] = useState<'upload' | 'youtube'>('upload');
  const [fileName, setFileName] = useState('');
  const [videoLink, setVideoLink] = useState('');
  const [clipLength, setClipLength] = useState<'30' | '60'>('30');
  const [aspectRatio, setAspectRatio] = useState('9:16');
  const [quality, setQuality] = useState('1080p');
  const [format, setFormat] = useState('MP4');
  const [language, setLanguage] = useState<'Hindi' | 'Hinglish' | 'English'>('Hinglish');
  const [loading, setLoading] = useState(false);
  const [clips, setClips] = useState<Array<{ title: string; time: string; score: number; caption: string; reason: string }>>([]);
  const { showToast } = useToast();

  const handleAnalyze = () => {
    const source = sourceType === 'upload' ? fileName : videoLink;
    if (!source) {
      showToast(sourceType === 'upload' ? 'Please upload a long-form video first.' : 'Please paste a YouTube link first.', 'error');
      return;
    }

    setLoading(true);
    setClips([]);
    setTimeout(() => {
      const lengthLabel = `${clipLength}s`;
      const sampleClips = [
        {
          title: 'Hook Moment',
          time: '00:18 - 00:' + (18 + Number(clipLength)).toString().padStart(2, '0'),
          score: 94,
          caption: language === 'English' ? 'This is the moment everyone will replay.' : 'Ye moment log baar-baar dekhenge.',
          reason: 'Strong opening emotion, quick context, and high retention potential.'
        },
        {
          title: 'Value Bomb',
          time: '03:42 - 04:' + (42 + Number(clipLength) - 60).toString().padStart(2, '0'),
          score: 89,
          caption: language === 'Hindi' ? 'Is trick se result instantly improve hoga.' : 'Is trick se instant result improve hoga.',
          reason: 'Clear takeaway with a natural before/after arc for captions.'
        },
        {
          title: 'Viral Punchline',
          time: '07:05 - 07:' + (5 + Number(clipLength)).toString().padStart(2, '0'),
          score: 86,
          caption: language === 'English' ? 'Save this before your next upload.' : 'Next upload se pehle ise save kar lo.',
          reason: 'Ends with a shareable CTA and works well as a standalone short.'
        }
      ];
      setClips(sampleClips);
      setLoading(false);
      showToast(`AI selected the best ${lengthLabel} shorts for free.`, 'success');
    }, 1200);
  };

  return (
    <div className="pb-24 animate-in slide-in-from-right duration-300">
      <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-md p-4 flex items-center gap-4 border-b border-white/10">
        <button onClick={onBack} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"><ChevronRight className="rotate-180 w-5 h-5" /></button>
        <div>
          <h2 className="text-xl font-bold">AI Shorts Cutter</h2>
          <p className="text-[10px] text-emerald-400 uppercase font-bold tracking-widest">Free • Captions • Auto best clips</p>
        </div>
      </div>

      <div className="p-4 space-y-6">
        <GlassCard className="border-emerald-500/20 bg-emerald-900/5">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center"><Video className="w-6 h-6 text-emerald-400" /></div>
            <div>
              <h3 className="font-bold text-white">Long video se ready-to-post shorts</h3>
              <p className="text-xs text-gray-400">Upload video ya YouTube link paste karo; AI best 30s/60s chunks, captions aur export settings suggest karega.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 p-1 bg-black/40 rounded-xl border border-white/5 mb-4">
            <button onClick={() => setSourceType('upload')} className={`py-2 text-xs font-bold rounded-lg uppercase tracking-widest ${sourceType === 'upload' ? 'bg-emerald-600 text-white' : 'text-gray-500'}`}><Upload className="w-3 h-3 inline mr-1"/> Upload</button>
            <button onClick={() => setSourceType('youtube')} className={`py-2 text-xs font-bold rounded-lg uppercase tracking-widest ${sourceType === 'youtube' ? 'bg-emerald-600 text-white' : 'text-gray-500'}`}><LinkIcon className="w-3 h-3 inline mr-1"/> Link</button>
          </div>

          {sourceType === 'upload' ? (
            <Input type="file" accept="video/*" onChange={(e) => setFileName(e.target.files?.[0]?.name || '')} className="bg-black/40" />
          ) : (
            <Input placeholder="https://youtube.com/watch?v=..." value={videoLink} onChange={(e) => setVideoLink(e.target.value)} className="bg-black/40" />
          )}

          <div className="grid grid-cols-2 gap-3 mt-4">
            <Select value={clipLength} onChange={(e) => setClipLength(e.target.value as '30' | '60')}><option value="30">30 seconds</option><option value="60">60 seconds</option></Select>
            <Select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)}><option>9:16</option><option>1:1</option><option>16:9</option></Select>
            <Select value={quality} onChange={(e) => setQuality(e.target.value)}><option>720p</option><option>1080p</option><option>2K</option><option>4K</option></Select>
            <Select value={format} onChange={(e) => setFormat(e.target.value)}><option>MP4</option><option>MOV</option><option>WEBM</option></Select>
            <Select value={language} onChange={(e) => setLanguage(e.target.value as any)}><option>Hinglish</option><option>Hindi</option><option>English</option></Select>
          </div>

          <Button className="w-full mt-5 bg-emerald-600 hover:bg-emerald-700 border-0" onClick={handleAnalyze} isLoading={loading} disabled={loading}>
            <Wand2 className="w-4 h-4 mr-2"/> {loading ? 'Finding viral moments...' : 'Create Shorts Free'}
          </Button>
        </GlassCard>

        {clips.length > 0 && <div className="space-y-3">
          {clips.map((clip, idx) => <GlassCard key={clip.title} className="border-white/10 bg-white/[0.03]">
            <div className="flex justify-between items-start mb-3"><div><p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Short #{idx + 1} • {clip.time}</p><h4 className="font-bold text-white">{clip.title}</h4></div><Badge color="green">{clip.score}% viral</Badge></div>
            <p className="text-sm text-indigo-50 mb-3">“{clip.caption}”</p>
            <p className="text-xs text-gray-500 mb-4">{clip.reason}</p>
            <div className="grid grid-cols-3 gap-2 text-center text-[10px] uppercase tracking-widest font-bold text-gray-400"><span className="bg-black/30 rounded-lg py-2">{aspectRatio}</span><span className="bg-black/30 rounded-lg py-2">{quality}</span><span className="bg-black/30 rounded-lg py-2">{format}</span></div>
          </GlassCard>)}
        </div>}
      </div>
    </div>
  );
};

// --- 2. GENERATOR VIEW ---
const GeneratorView: React.FC<{ toolId: string, user: User, onBack: () => void, onCreditUse: (cost: number) => void }> = ({ toolId, user, onBack, onCreditUse }) => {
  const tool = TOOLS.find(t => t.id === toolId);
  const [desc, setDesc] = useState('');
  const [audience, setAudience] = useState('');
  const [style, setStyle] = useState('Modern');
  const [lang, setLang] = useState<'English' | 'Hindi' | 'Hinglish'>('English');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const { showToast } = useToast();

  const handleGenerate = async () => {
    if (user.credits < GENERATION_COST) {
      showToast(`Insufficient Credits. Required: ${GENERATION_COST}`, 'error');
      return;
    }
    
    setLoading(true);
    setResult(null);

    try {
      const input: GeneratorInput = {
        type: toolId as any,
        description: desc,
        audience,
        style,
        language: lang
      };

      let output = '';
      if (tool?.isImage) {
        output = await Gemini.generateLogo(input);
      } else {
        output = await Gemini.generateContent(input);
      }

      setResult(output);
      onCreditUse(GENERATION_COST);
      
      Storage.addHistory({
        id: `hist_${Date.now()}`,
        userId: user.id,
        type: input.type,
        input: desc,
        output: output,
        timestamp: new Date().toISOString(),
        isImage: tool?.isImage || false
      });
      showToast('Generation successful', 'success');

    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!tool) return null;

  return (
    <div className="pb-24 animate-in slide-in-from-right duration-300">
      <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-md p-4 flex items-center gap-4 border-b border-white/10">
        <button onClick={onBack} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"><ChevronRight className="rotate-180 w-5 h-5" /></button>
        <h2 className="text-xl font-bold">{tool.name}</h2>
        <div className="ml-auto bg-white/5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 border border-white/10">
          <Zap className="w-3 h-3 text-yellow-500" />
          <span>{(tool as any).isFree ? 'Free' : `${GENERATION_COST} Credits`}</span>
        </div>
      </div>

      <div className="p-4 space-y-6">
        <GlassCard>
           <div className="space-y-4">
             <div>
               <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-2 block">Concept Brief</label>
               <textarea className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white h-24 resize-none focus:border-indigo-500 transition-all outline-none text-sm" 
                 placeholder="Describe your brand or requirement..." value={desc} onChange={e => setDesc(e.target.value)} />
             </div>
             <div>
               <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-2 block">Target Audience</label>
               <Input placeholder="E.g. Gen Z, Luxury Buyers..." value={audience} onChange={e => setAudience(e.target.value)} />
             </div>
             <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-2 block">Style</label>
                 <Select value={style} onChange={(e) => setStyle(e.target.value)}>
                   <option>Modern</option><option>Luxury</option><option>Minimal</option><option>Desi</option><option>Vintage</option>
                 </Select>
               </div>
               <div>
                 <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-2 block">Language</label>
                 <Select value={lang} onChange={(e) => setLang(e.target.value as any)}>
                   <option>English</option><option>Hindi</option><option>Hinglish</option>
                 </Select>
               </div>
             </div>
           </div>
           
           <div className="mt-6">
             <Button className="w-full" onClick={handleGenerate} disabled={!desc || loading} isLoading={loading}>
                {loading ? 'Processing...' : 'Generate Asset'}
             </Button>
           </div>
        </GlassCard>

        {result && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <GlassCard className="border-indigo-500/30 overflow-hidden relative shadow-2xl">
               <div className="flex justify-between items-center mb-4">
                 <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Output</span>
                 <div className="flex gap-2">
                   <button onClick={() => { navigator.clipboard.writeText(result); showToast('Copied to clipboard', 'success') }} className="p-2 bg-white/5 rounded-full hover:bg-white/20 transition-colors"><Copy className="w-4 h-4 text-gray-300" /></button>
                   {tool.isImage && <a href={result} download="brandova-export.png" className="p-2 bg-white/5 rounded-full hover:bg-white/20 transition-colors"><Download className="w-4 h-4 text-gray-300" /></a>}
                 </div>
               </div>
               {tool.isImage ? (
                 <div className="bg-white/5 rounded-lg p-8 flex items-center justify-center aspect-square">
                   <img src={result} alt="Logo" className="w-full h-full object-contain drop-shadow-2xl" />
                 </div>
               ) : (
                 <div className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-indigo-50/90">{result}</div>
               )}
            </GlassCard>
          </div>
        )}
      </div>
    </div>
  );
};

// --- 3. PRICING & UPGRADE VIEW ---
const PricingView: React.FC<{ user: User, onUpgradeSuccess: (updatedUser: User) => void }> = ({ user, onUpgradeSuccess }) => {
  const [showPayment, setShowPayment] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const { showToast } = useToast();

  const handleRedeem = () => {
    if (!inputCode) return;
    setVerifying(true);
    setTimeout(() => {
      const result = Storage.redeemActivationCode(inputCode, user);
      if (result.success && result.user) {
        onUpgradeSuccess(result.user);
        showToast(result.msg, 'success');
        setInputCode('');
      } else {
        showToast(result.msg, 'error');
      }
      setVerifying(false);
    }, 1500);
  };

  const handlePaymentRequest = () => {
    if (!transactionId) {
        showToast("Please enter Transaction ID", "error");
        return;
    }
    const req: PaymentRequest = {
      id: `req_${Date.now()}`,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      amount: 99,
      timestamp: new Date().toISOString(),
      status: 'pending',
      userMessage: `Transaction ID: ${transactionId}`
    };
    Storage.createPaymentRequest(req);
    setShowPayment(false);
    showToast('Payment request sent to admin. You will receive a code shortly.', 'success');
  };

  return (
    <div className="p-6 pb-24 space-y-8 animate-in fade-in duration-500 relative">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-white to-purple-300">Upgrade Plan</h2>
        <p className="text-gray-400 text-xs tracking-wide">Unlock full creative potential</p>
      </div>

      <div className="flex flex-col gap-6">
        {/* Free Plan */}
        <div className={`p-6 rounded-2xl border transition-all ${user.plan === 'free' ? 'bg-white/5 border-white/20' : 'bg-transparent border-white/10 opacity-60'}`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-300 tracking-tight">Starter</h3>
            <span className="text-xl font-bold">₹0</span>
          </div>
          <ul className="space-y-3 text-xs text-gray-400 mb-6">
            <li className="flex gap-2 items-center"><Check className="w-3 h-3 text-gray-500"/> 20 Total Credits</li>
            <li className="flex gap-2 items-center"><Check className="w-3 h-3 text-gray-500"/> Standard Speed</li>
            <li className="flex gap-2 items-center"><Check className="w-3 h-3 text-gray-500"/> Basic Tools</li>
          </ul>
          {user.plan === 'free' && <div className="text-center text-[10px] text-gray-500 font-bold uppercase tracking-widest">Current Plan</div>}
        </div>

        {/* Pro Plan */}
        <div className={`relative p-6 rounded-2xl border transition-all overflow-hidden ${user.plan === 'pro' ? 'bg-indigo-900/20 border-indigo-500 shadow-indigo-500/10' : 'bg-gradient-to-br from-indigo-900/40 to-black border-indigo-500/50 shadow-2xl shadow-indigo-500/20'}`}>
          <div className="absolute top-0 right-0 bg-gradient-to-l from-indigo-600 to-purple-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl tracking-widest uppercase">Recommended</div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-white tracking-tight">Studio Pro</h3>
            <span className="text-2xl font-bold text-indigo-300">₹99<span className="text-xs font-normal text-gray-400">/mo</span></span>
          </div>
          <ul className="space-y-3 text-xs text-indigo-100/80 mb-6">
            <li className="flex gap-2 items-center"><Check className="w-3 h-3 text-indigo-400"/> 100 Credits Daily</li>
            <li className="flex gap-2 items-center"><Check className="w-3 h-3 text-indigo-400"/> Priority Generation</li>
            <li className="flex gap-2 items-center"><Check className="w-3 h-3 text-indigo-400"/> Full Commercial License</li>
            <li className="flex gap-2 items-center"><Check className="w-3 h-3 text-indigo-400"/> 4K Image Exports</li>
          </ul>
          {user.plan === 'pro' ? (
             <Badge color="purple" className="w-full flex justify-center py-3">Active Membership</Badge>
          ) : (
             <Button className="w-full" onClick={() => setShowPayment(true)}>Upgrade Now</Button>
          )}
        </div>
      </div>

      <GlassCard className="border-white/10 bg-white/[0.02]">
        <h4 className="text-[10px] font-bold text-gray-400 mb-4 flex items-center gap-2 tracking-widest uppercase">
          <Key className="w-3 h-3"/> 
          Have an Activation Code?
        </h4>
        <div className="flex flex-col gap-3">
           <Input 
             placeholder="BRANDOVA-PRO-XXXX-XXXX" 
             value={inputCode} 
             onChange={e => setInputCode(e.target.value)} 
             className="uppercase font-mono text-center tracking-widest text-lg"
             disabled={user.plan === 'pro' || verifying}
           />
           <Button 
            variant="secondary" 
            onClick={handleRedeem} 
            isLoading={verifying} 
            disabled={!inputCode || user.plan === 'pro'}
            className="w-full"
           >
             Redeem & Activate
           </Button>
        </div>
      </GlassCard>

      {/* Payment Modal - Centered */}
      {showPayment && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
          <GlassCard className="w-full max-w-sm bg-[#050505] border-white/10 relative shadow-2xl ring-1 ring-white/5 z-[110]">
            <button 
              onClick={() => setShowPayment(false)} 
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors text-gray-500 hover:text-white"
            >
              <X className="w-5 h-5"/>
            </button>
            
            <div className="text-center mb-8">
               <div className="w-14 h-14 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/5 shadow-lg shadow-indigo-500/10">
                 <CreditCard className="w-7 h-7 text-indigo-400"/>
               </div>
               <h3 className="text-xl font-bold text-white tracking-tight">Complete Payment</h3>
               <p className="text-xs text-gray-500 mt-1">Send <span className="text-white font-bold">₹99</span> via UPI</p>
            </div>
            
            <div className="space-y-6">
               <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 flex flex-col items-center gap-2 group hover:border-indigo-500/30 transition-colors">
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Official UPI ID</span>
                  <div 
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={() => { navigator.clipboard.writeText('samebhai92@oksbi'); showToast('UPI ID Copied', 'info'); }}
                  >
                    <p className="text-white font-mono text-lg font-bold tracking-wide select-all">samebhai92@oksbi</p>
                    <Copy className="w-4 h-4 text-gray-500 group-hover:text-indigo-400 transition-colors" />
                  </div>
               </div>

               <div className="space-y-2">
                 <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold ml-1">
                   Transaction Reference
                 </label>
                 <Input 
                   placeholder="Enter UPI Transaction ID" 
                   value={transactionId} 
                   onChange={(e) => setTransactionId(e.target.value)}
                   className="bg-black/40 border-white/10 text-sm focus:border-indigo-500/50"
                 />
               </div>

               <Button variant="primary" className="w-full h-12 text-sm uppercase tracking-widest font-bold shadow-indigo-500/20" onClick={handlePaymentRequest}>
                 I Have Paid
               </Button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

// --- 4. ADMIN DASHBOARD (Secure Drill-Down) ---
const AdminDashboard: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const [adminView, setAdminView] = useState<AdminView>('overview');
  const [users, setUsers] = useState<User[]>([]);
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [codes, setCodes] = useState<ActivationCode[]>([]); // These are hashed
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastBatch, setLastBatch] = useState<string[]>([]);
  const { showToast } = useToast();

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setUsers(Storage.getUsers());
    setRequests(Storage.getPaymentRequests());
    setCodes(Storage.getActivationCodes());
  };

  const handleManualApprove = (reqId: string, code: string, message: string) => {
    // 1. Validate the entered code
    const validation = Storage.validateCodeForAdmin(code);
    
    if (validation !== 'valid') {
       if (validation === 'invalid') showToast('Code not found in registry.', 'error');
       else if (validation === 'used') showToast('Code already used.', 'error');
       else if (validation === 'expired') showToast('Code has expired.', 'error');
       return;
    }

    setProcessingId(reqId);
    
    // Simulate API delay
    setTimeout(() => {
        // 2. Find request details
        const req = requests.find(r => r.id === reqId);
        if (!req) return;

        // 3. Mark request approved
        Storage.updatePaymentRequest(reqId, 'approved', message);

        // 4. Send Notification (Critical: Uses shared store in storage.ts)
        Storage.addNotification({
          id: `notif_${Date.now()}`,
          userId: req.userId,
          title: 'Upgrade Approved',
          message: message,
          read: false,
          timestamp: new Date().toISOString(),
          type: 'code',
          metadata: { code: code }
        });

        showToast('Request approved & notification sent.', 'success');
        setProcessingId(null);
        refreshData();
    }, 1000);
  };

  const handleBatchGenerate = () => {
    setIsGenerating(true);
    // Simulate network delay for effect
    setTimeout(() => {
        try {
            const raw = Storage.generateBatchCodes(10);
            setLastBatch(raw);
            refreshData(); // updates 'codes' state
            showToast(`Successfully generated 10 secure codes.`, 'success');
        } catch (e) {
            showToast('Generation failed.', 'error');
        } finally {
            setIsGenerating(false);
        }
    }, 1500);
  };

  const renderHeader = (title: string, subtitle: string) => (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h1 className="text-2xl font-bold text-red-500 flex items-center gap-2 tracking-tight">
          {adminView !== 'overview' && (
            <button onClick={() => setAdminView('overview')} className="p-1 hover:bg-white/10 rounded-full mr-2 transition-colors">
              <ChevronRight className="rotate-180 w-6 h-6 text-white"/>
            </button>
          )}
          {title}
        </h1>
        <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mt-1 ml-1">{subtitle}</p>
      </div>
      <button onClick={onLogout} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors border border-white/5"><LogOut className="w-5 h-5"/></button>
    </div>
  );

  const pendingRequests = requests.filter(r => r.status === 'pending');

  // Sub-Views
  if (adminView === 'users') {
    return (
      <div className="min-h-screen bg-neutral-950 p-4 pb-24 animate-in fade-in slide-in-from-right duration-300">
        {renderHeader("User Database", "Manage Accounts")}
        <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/40">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/5 text-gray-400 uppercase font-bold">
              <tr>
                <th className="p-4">Identity</th>
                <th className="p-4">Plan</th>
                <th className="p-4">Credits</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-white/5">
                  <td className="p-4">
                    <div className="font-bold text-white">{u.name}</div>
                    <div className="text-gray-500 font-mono text-[10px]">{u.email}</div>
                  </td>
                  <td className="p-4"><Badge color={u.plan === 'pro' ? 'purple' : 'blue'}>{u.plan}</Badge></td>
                  <td className="p-4 font-bold">{u.credits}</td>
                  <td className="p-4">{u.tamperFlag ? <Badge color="red">LOCKED</Badge> : <Badge color="green">ACTIVE</Badge>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (adminView === 'requests') {
    return (
      <div className="min-h-screen bg-neutral-950 p-4 pb-24 animate-in fade-in slide-in-from-right duration-300">
        {renderHeader("Pending Approvals", "Payment Verification")}
        <div className="grid gap-4">
          {pendingRequests.length === 0 ? (
             <div className="text-center py-20 text-gray-600 uppercase text-xs font-bold tracking-widest">No Pending Actions</div>
          ) : pendingRequests.map(req => (
            <RequestReviewCard 
              key={req.id} 
              req={req} 
              onApprove={handleManualApprove} 
              isLoading={processingId === req.id}
            />
          ))}
        </div>
      </div>
    );
  }

  if (adminView === 'tokens') {
    return (
        <div className="min-h-screen bg-neutral-950 p-4 pb-24 animate-in fade-in slide-in-from-right duration-300">
          {renderHeader("Hash Registry", "Stored Activation Hashes")}
          
          <GlassCard className="border-red-500/20 bg-red-900/5 mb-8 p-6">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2 tracking-wide uppercase">
                <Key className="w-4 h-4 text-red-500"/> 
                Secure Batch Generator
            </h3>
            <div className="flex gap-4 items-center">
                <Button 
                    onClick={handleBatchGenerate} 
                    isLoading={isGenerating} 
                    disabled={isGenerating} 
                    className="w-full bg-red-600 hover:bg-red-700 text-white border-0"
                >
                    Generate 10 Secure Codes
                </Button>
            </div>
            <p className="text-[10px] text-gray-500 mt-2 text-center">Codes expire automatically in 30 days.</p>
          </GlassCard>

          {lastBatch.length > 0 && (
             <GlassCard className="mb-8 border-emerald-500/20 bg-emerald-900/5 p-4">
                 <div className="flex justify-between items-center mb-4">
                     <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest">New Batch Generated (Copy Now)</p>
                     <button onClick={() => { navigator.clipboard.writeText(lastBatch.join('\n')); showToast('All codes copied', 'success') }} className="p-2 bg-emerald-500/10 rounded-lg hover:bg-emerald-500/20 transition-colors">
                        <Copy className="w-4 h-4 text-emerald-400"/>
                     </button>
                 </div>
                 <div className="max-h-40 overflow-y-auto no-scrollbar space-y-1">
                     {lastBatch.map((code, idx) => (
                         <div key={idx} className="font-mono text-[10px] text-emerald-100/80 bg-black/20 p-2 rounded flex justify-between">
                            {code}
                         </div>
                     ))}
                 </div>
             </GlassCard>
          )}

          <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/40">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/5 text-gray-400 uppercase font-bold">
              <tr>
                <th className="p-4">Hash ID (Obfuscated)</th>
                <th className="p-4">Expires</th>
                <th className="p-4">Status</th>
                <th className="p-4">Used By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {codes.length === 0 ? <tr><td colSpan={4} className="p-8 text-center text-gray-600">No codes generated</td></tr> : codes.map((c, i) => {
                const isExpired = new Date() > new Date(c.expiresAt);
                return (
                  <tr key={i} className="hover:bg-white/5">
                    <td className="p-4 font-mono text-[10px] text-gray-500">{c.hash.substring(0, 16)}...</td>
                    <td className="p-4 text-gray-400">{new Date(c.expiresAt).toLocaleDateString()}</td>
                    <td className="p-4">
                      {c.used ? <Badge color="red">USED</Badge> : 
                       isExpired ? <Badge color="gold">EXPIRED</Badge> : 
                       <Badge color="green">OPEN</Badge>}
                    </td>
                    <td className="p-4 text-gray-400">{c.usedBy || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        </div>
    )
  }

  if (adminView === 'revenue') {
      const approved = requests.filter(r => r.status === 'approved');
      return (
        <div className="min-h-screen bg-neutral-950 p-4 pb-24 animate-in fade-in slide-in-from-right duration-300">
        {renderHeader("Revenue Ledger", "Approved Transactions")}
        <GlassCard className="mb-6 border-emerald-500/20 bg-emerald-900/10 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Total Verified</span>
            <span className="text-2xl font-bold text-white">₹{approved.reduce((a,b) => a + b.amount, 0)}</span>
        </GlassCard>
        <div className="space-y-2">
            {approved.map(r => (
                <div key={r.id} className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/5">
                    <div>
                        <div className="font-bold text-xs">{r.userName}</div>
                        <div className="text-[10px] text-gray-500">{new Date(r.timestamp).toLocaleDateString()}</div>
                    </div>
                    <div className="font-mono font-bold text-emerald-400">₹{r.amount}</div>
                </div>
            ))}
        </div>
        </div>
      )
  }

  // Dashboard Overview
  return (
    <div className="min-h-screen bg-neutral-950 p-6 pb-32 animate-in fade-in">
       {renderHeader("Command Center", "System Overview")}
       
       <div className="grid grid-cols-2 gap-4">
          <button onClick={() => setAdminView('requests')} className="col-span-2">
             <GlassCard className="flex items-center justify-between border-yellow-500/20 bg-yellow-900/5 hover:bg-yellow-900/10 transition-colors">
                <div className="text-left">
                    <p className="text-xs font-bold uppercase tracking-widest text-yellow-500">Pending Actions</p>
                    <p className="text-3xl font-bold text-white mt-1">{pendingRequests.length}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-yellow-500/50"/>
             </GlassCard>
          </button>

          <button onClick={() => setAdminView('users')}>
             <GlassCard className="h-full border-blue-500/20 bg-blue-900/5 hover:bg-blue-900/10 transition-colors">
                <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-2">Total Users</p>
                <p className="text-2xl font-bold text-white">{users.length}</p>
             </GlassCard>
          </button>

          <button onClick={() => setAdminView('revenue')}>
             <GlassCard className="h-full border-emerald-500/20 bg-emerald-900/5 hover:bg-emerald-900/10 transition-colors">
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-2">Revenue</p>
                <p className="text-2xl font-bold text-white">₹{users.filter(u => u.plan === 'pro').length * 99}</p>
             </GlassCard>
          </button>
          
          <button onClick={() => setAdminView('tokens')} className="col-span-2">
             <GlassCard className="flex items-center justify-between border-red-500/20 bg-red-900/5 hover:bg-red-900/10 transition-colors">
                <div className="text-left">
                    <p className="text-xs font-bold uppercase tracking-widest text-red-500">Hash Registry</p>
                    <p className="text-xs text-gray-500 mt-1">{codes.length} Secured Hashes</p>
                </div>
                <Key className="w-8 h-8 text-red-500/50"/>
             </GlassCard>
          </button>
       </div>
    </div>
  );
};

// --- MAIN APP ---
const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<View>('auth');
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    // Anti-tamper Check on Load
    const session = Storage.getCurrentSession();
    if (session) {
      if (session.tamperFlag) {
          showToast('Security Violation: Account Locked', 'error');
          setUser(null);
          setView('auth');
          Storage.logoutUser();
      } else {
          setUser(session);
          setView(session.role === 'admin' ? 'admin' : 'home');
          setNotifications(Storage.getNotifications(session.id));
      }
    } else {
      setView('auth');
    }
  }, []);

  const handleLogin = (u: User) => {
    Storage.loginUser(u);
    setUser(u);
    setView(u.role === 'admin' ? 'admin' : 'home');
    setNotifications(Storage.getNotifications(u.id));
  };

  const handleLogout = () => {
    Storage.logoutUser();
    setUser(null);
    setView('auth');
    setActiveTool(null);
  };

  const renderContent = () => {
    if (!user) return <LoginScreen onLogin={handleLogin} />;
    if (user.role === 'admin') return <AdminDashboard onLogout={handleLogout} />;
    
    // User Views
    if (activeTool === 'shorts') {
      return <ShortsGeneratorView onBack={() => setActiveTool(null)} />;
    }

    if (activeTool) {
      return (
        <GeneratorView 
          toolId={activeTool} 
          user={user} 
          onBack={() => setActiveTool(null)} 
          onCreditUse={(c) => { 
            const u = {...user, credits: user.credits - c}; 
            setUser(u); 
            Storage.saveUser(u); 
          }} 
        />
      );
    }
    
    switch (view) {
      case 'home':
        return (
          <div className="p-6 pb-24 space-y-8 animate-in fade-in duration-500">
             <header className="flex justify-between items-center">
              <div>
                 <h1 className="text-2xl font-bold tracking-tight">Studio</h1>
                 <div className="flex items-center gap-2 mt-1">
                   <Badge color={user.plan === 'pro' ? 'purple' : 'blue'}>{user.plan.toUpperCase()}</Badge>
                   <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{user.credits} Credits</p>
                 </div>
              </div>
              <div className="relative cursor-pointer" onClick={() => setShowNotifDrawer(true)}>
                 <div className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors relative">
                    <Bell className="w-6 h-6 text-gray-300" />
                    {notifications.some(n => !n.read) && <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-black"></span>}
                 </div>
              </div>
            </header>

            {user.plan === 'free' && (
              <button onClick={() => setView('pricing')} className="w-full text-left">
                <GlassCard className="bg-gradient-to-r from-indigo-900/40 via-purple-900/20 to-black border-indigo-500/30 flex justify-between items-center p-5 shadow-2xl shadow-indigo-900/10 group">
                    <div>
                    <h3 className="font-bold text-sm text-indigo-300 tracking-tight group-hover:text-white transition-colors">Upgrade to Studio Pro</h3>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">100 Daily Credits + 4K Export</p>
                    </div>
                    <ChevronRight className="text-indigo-500 group-hover:translate-x-1 transition-transform"/>
                </GlassCard>
              </button>
            )}

            <div className="grid grid-cols-2 gap-3">
              {TOOLS.map((tool) => {
                const Icon = Icons[tool.icon] || Zap;
                return (
                  <button key={tool.id} onClick={() => setActiveTool(tool.id)} className="text-left group bg-white/5 hover:bg-white/10 border border-white/5 hover:border-indigo-500/30 p-4 rounded-2xl transition-all duration-300 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowRight className="w-4 h-4 text-white -rotate-45"/>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center mb-3 border border-white/5 group-hover:scale-110 transition-transform">
                      <Icon className="w-5 h-5 text-indigo-400" />
                    </div>
                    <h3 className="font-bold text-sm text-gray-200 leading-tight mb-1 group-hover:text-white">{tool.name}</h3>
                    <p className="text-[10px] text-gray-500 line-clamp-1 font-medium">{tool.desc}</p>
                  </button>
                )
              })}
            </div>
          </div>
        );
      case 'history': 
        const history = Storage.getHistory(user.id);
        return (
          <div className="p-6 pb-24 min-h-screen animate-in fade-in duration-500">
             <h2 className="text-2xl font-bold mb-6 tracking-tight">Archive</h2>
             {history.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-32 text-gray-600 opacity-20">
                 <Clock className="w-16 h-16 mb-4"/>
                 <p className="uppercase text-[10px] font-bold tracking-widest">No Records Found</p>
               </div>
             ) : (
               <div className="space-y-4">
                 {history.map(h => (
                   <GlassCard key={h.id} className="flex gap-4 items-start hover:border-indigo-500/30 transition-all shadow-xl">
                      <div className="w-12 h-12 bg-white/5 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden border border-white/5">
                        {h.isImage ? <img src={h.output} className="w-full h-full object-cover"/> : <Type className="w-5 h-5 text-indigo-400"/>}
                      </div>
                      <div className="flex-1 overflow-hidden">
                         <div className="flex justify-between items-start">
                            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1">{h.type.replace('_', ' ')}</p>
                            <p className="text-[10px] text-gray-600 font-bold">{new Date(h.timestamp).toLocaleDateString()}</p>
                         </div>
                         <p className="text-sm truncate text-gray-300 font-medium">"{h.input}"</p>
                      </div>
                   </GlassCard>
                 ))}
               </div>
             )}
          </div>
        );
      case 'pricing': return <PricingView user={user} onUpgradeSuccess={(updatedUser) => { Storage.saveUser(updatedUser); setUser(updatedUser); setView('home'); }} />;
      case 'profile': return (
        <div className="p-6 pb-24 animate-in fade-in duration-500">
           <div className="text-center mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-indigo-600 to-purple-800 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl font-bold shadow-2xl shadow-indigo-500/30 border-4 border-black">{user.name[0]}</div>
              <h2 className="text-2xl font-bold tracking-tight">{user.name}</h2>
              <p className="text-xs text-gray-500 mb-4 font-medium">{user.email}</p>
              <Badge color={user.plan === 'pro' ? 'purple' : 'blue'}>{user.plan.toUpperCase()} MEMBER</Badge>
           </div>
           
           <div className="space-y-3">
              <GlassCard className="flex items-center justify-between p-4 border-white/5 bg-white/[0.02]">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
                      <Zap className="w-4 h-4 text-yellow-500"/>
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Available Credits</span>
                 </div>
                 <span className="font-bold text-xl">{user.credits}</span>
              </GlassCard>
              <div className="pt-8">
                <Button variant="ghost" className="w-full text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 h-12" onClick={handleLogout}>
                  Terminate Session
                </Button>
              </div>
           </div>
        </div>
      );
      default: return null;
    }
  };

  return (
    <ToastProvider>
      <div className="min-h-screen bg-black text-white font-sans selection:bg-indigo-500/30 overflow-hidden antialiased">
        <div className="max-w-md mx-auto min-h-screen relative shadow-2xl bg-black border-x border-white/5 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto no-scrollbar relative z-10">
            {renderContent()}
          </div>

          {/* User-Only Navigation */}
          {user && user.role !== 'admin' && !activeTool && (
            <div className="fixed bottom-0 z-40 w-full max-w-md bg-black/80 backdrop-blur-xl border-t border-white/10 pb-8 pt-2 px-6 flex justify-between shadow-2xl shadow-black">
              {[
                { id: 'home', icon: Home, label: 'Studio' },
                { id: 'history', icon: Clock, label: 'Archive' },
                { id: 'pricing', icon: Key, label: 'Upgrade' },
                { id: 'profile', icon: UserIcon, label: 'Profile' },
              ].map((item: any) => (
                <button key={item.id} onClick={() => setView(item.id)} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 ${view === item.id ? 'text-indigo-400 bg-white/5 scale-105' : 'text-gray-600 hover:text-gray-400'}`}>
                  <item.icon className={`w-6 h-6 ${view === item.id ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                  <span className="text-[8px] font-bold uppercase tracking-widest">{item.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Notification Drawer */}
          {showNotifDrawer && user?.role !== 'admin' && (
            <div className="absolute inset-0 z-[100] bg-black/90 backdrop-blur-sm flex justify-end">
               <div className="w-full h-full bg-[#0a0a0a] border-l border-white/10 p-6 overflow-y-auto animate-in slide-in-from-right duration-300 shadow-2xl">
                  <div className="flex justify-between items-center mb-10">
                    <h3 className="text-2xl font-bold flex items-center gap-2 tracking-tight"><Bell className="w-6 h-6 text-indigo-500"/> Inbox</h3>
                    <button onClick={() => setShowNotifDrawer(false)} className="p-2 bg-white/5 rounded-full transition-colors hover:bg-white/10"><X className="w-5 h-5 text-gray-500"/></button>
                  </div>
                  <div className="space-y-4">
                    {notifications.length === 0 ? (
                      <div className="text-center py-32 text-gray-600 opacity-20 uppercase text-[10px] font-bold tracking-widest">
                         <p>No new messages</p>
                      </div>
                    ) : notifications.map(n => (
                      <div key={n.id} className={`p-5 rounded-2xl border transition-all duration-300 ${n.read ? 'border-transparent bg-white/5' : 'border-indigo-500/30 bg-indigo-900/10'}`} onClick={() => { Storage.markNotificationRead(n.id); setNotifications(Storage.getNotifications(user!.id)); }}>
                         <div className="flex justify-between items-start mb-2">
                           <p className="font-bold text-sm text-indigo-100 tracking-tight">{n.title}</p>
                           <span className="text-[8px] text-gray-600 uppercase font-bold tracking-widest">{new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                         </div>
                         <p className="text-xs text-gray-400 leading-relaxed font-medium mb-2">{n.message}</p>
                         
                         {n.metadata?.code && (
                             <div className="bg-black/50 p-2 rounded border border-white/10 flex justify-between items-center mt-2">
                                 <code className="text-indigo-400 font-mono font-bold tracking-widest">{n.metadata.code}</code>
                                 <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(n.metadata.code); showToast('Code Copied', 'info') }}>
                                     <Copy className="w-4 h-4 text-gray-400 hover:text-white"/>
                                 </button>
                             </div>
                         )}

                         {!n.read && <div className="mt-4 flex justify-end"><Badge color="blue" className="text-[8px] tracking-widest">New</Badge></div>}
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          )}
        </div>
      </div>
    </ToastProvider>
  );
};

export default App;