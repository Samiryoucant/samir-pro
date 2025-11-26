import React, { useEffect, useState } from 'react';
import { User, Theme, Course, CourseFile } from '../types';
import { db } from '../services/mockDb';
import { ArrowLeft, Download, Eye, Upload, CheckCircle, Clock, AlertCircle, Lock, Loader2, PlayCircle, Instagram, Send, Image as ImageIcon, Zap } from 'lucide-react';
import { useToast } from '../components/Toast.tsx';

interface CourseViewProps {
  user: User | null;
  theme: Theme;
  courseId: string;
  onBack: () => void;
}

export const CourseView: React.FC<CourseViewProps> = ({ user, theme, courseId, onBack }) => {
  const [course, setCourse] = useState<Course | null>(null);
  const [isOwned, setIsOwned] = useState(false);
  const [adsWatched, setAdsWatched] = useState(0);
  const [pendingRequest, setPendingRequest] = useState(false);
  const { showToast } = useToast();
  
  // Buy Modal State
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'Bkash' | 'Nagad'>('Bkash');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Ad Watch State
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [adTimer, setAdTimer] = useState(0);
  const [showAdPlayer, setShowAdPlayer] = useState(false);

  // Gallery
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const isDark = theme === 'dark';
  const isPizza = theme === 'pizza';
  
  const brandColor = isDark 
    ? 'text-indigo-400' 
    : (isPizza ? 'text-pizza-600' : 'text-lemon-600');
    
  const btnPrimary = `rounded-xl font-bold text-white shadow-lg transition active:scale-95 ${
    isDark 
      ? 'bg-indigo-600 hover:bg-indigo-700' 
      : (isPizza ? 'bg-pizza-600 hover:bg-pizza-700' : 'bg-lemon-600 hover:bg-lemon-700')
  }`;
  
  const btnSecondary = `rounded-xl font-bold border-2 transition active:scale-95 ${
    isDark
      ? 'border-slate-600 text-slate-300 hover:bg-slate-700'
      : (isPizza ? 'border-pizza-200 text-pizza-700 hover:bg-pizza-50' : 'border-lemon-200 text-lemon-700 hover:bg-lemon-50')
  }`;
  
  const cardClass = isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100';
  const textMuted = isDark ? 'text-slate-400' : 'text-gray-500';

  useEffect(() => {
    const c = db.courses.all().find(x => x.id === courseId);
    if (c) {
      setCourse(c);
      if (user) {
        setIsOwned(db.purchases.userHasAccess(user.id, c.id));
        setAdsWatched(db.ads.getWatchCount(user.id, c.id));
        
        const reqs = db.requests.all();
        const pending = reqs.find(r => r.userId === user.id && r.courseId === c.id && r.status === 'pending');
        setPendingRequest(!!pending);
      }
    }
  }, [courseId, user]);

  const handleWatchAd = () => {
    if (!user) {
      showToast("Please login first to watch ads.", "error");
      return;
    }
    if (isWatchingAd) return;

    setIsWatchingAd(true);
    
    // Check if Monetag SDK is available
    if (typeof window.show_10231981 === 'function') {
      console.log("Showing Monetag Ad...");
      window.show_10231981().then(() => {
        finishAd();
        showToast("Ad watched successfully! (+1)", "success");
      }).catch((e) => {
        console.error("Ad error or closed, using simulation fallback:", e);
        startManualTimer();
      });
    } else {
      console.warn("Monetag SDK not found, falling back to simulation.");
      startManualTimer();
    }
  };

  const startManualTimer = () => {
    setShowAdPlayer(true);
    setAdTimer(15);
    const interval = setInterval(() => {
      setAdTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setShowAdPlayer(false);
          finishAd();
          showToast("Ad watched successfully! (+1)", "success");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const finishAd = () => {
    if (!user || !course) return;
    const newCount = db.ads.increment(user.id, course.id);
    setAdsWatched(newCount);
    setIsWatchingAd(false);
    
    if (newCount >= course.unlockAdsRequired) {
      db.purchases.grant({
        id: `p-${Date.now()}`,
        userId: user.id,
        courseId: course.id,
        grantedAt: new Date().toISOString(),
        type: 'ad_unlock'
      });
      setIsOwned(true);
      showToast("Congratulations! You've unlocked this course!", "success");
    }
  };

  const handleDownload = (file: CourseFile) => {
    if (!user || !course) return;
    
    showToast(`Downloading ${file.name}...`, "success");
    
    // Record download
    db.downloads.add({
      id: `dl-${Date.now()}`,
      userId: user.id,
      fileName: file.name,
      courseTitle: course.title,
      downloadedAt: new Date().toISOString()
    });

    if (file.url === '#simulated-large-file') {
        const blob = new Blob([
            `This file (${file.name}) was uploaded in a Demo/Static environment.\n` +
            `Browser storage cannot hold large files (>2MB) persistently without a backend.\n` +
            `In a real application, this would download the actual file.`
        ], { type: "text/plain" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${file.name}.txt`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        showToast("Downloaded placeholder text (Storage Limit Reached)", "success");

    } else if (file.sourceType === 'upload' && file.url.startsWith('data:')) {
      const a = document.createElement("a");
      a.href = file.url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else if (file.url === '#' || !file.url) {
      const blob = new Blob(["This is the demo content of " + file.name], { type: "text/plain" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } else {
      window.open(file.url, '_blank');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (x) => setScreenshot(x.target?.result as string);
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSubmitBuy = () => {
    if (!user || !course || !screenshot) return;
    setSubmitting(true);
    setTimeout(() => {
      db.requests.create({
        id: `req-${Date.now()}`,
        userId: user.id,
        courseId: course.id,
        screenshot: screenshot,
        status: 'pending',
        method: paymentMethod,
        createdAt: new Date().toISOString()
      });
      setPendingRequest(true);
      setShowBuyModal(false);
      setSubmitting(false);
      showToast("Request submitted! Waiting for admin approval.", "success");
    }, 2000);
  };

  if (!course) return <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto text-gray-400" size={32} /></div>;

  const accessProgress = Math.round((adsWatched / course.unlockAdsRequired) * 100);

  return (
    <div>
      {/* Header */}
      <button onClick={onBack} className={`mb-6 flex items-center gap-2 transition ${isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>
        <ArrowLeft size={20} /> Back to Courses
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <div className={`rounded-2xl overflow-hidden shadow-sm border group relative ${cardClass}`}>
             <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
             <img src={course.banner || course.thumbnail} className="w-full h-64 md:h-80 object-cover" alt="Course Banner" />
             <div className="absolute bottom-0 left-0 p-8 z-20 text-white">
                <h1 className="text-3xl font-black mb-2 drop-shadow-md">{course.title}</h1>
                <p className="text-white/90 leading-relaxed max-w-xl drop-shadow-sm">{course.description}</p>
             </div>
          </div>

          {/* Sample Images Gallery */}
          {course.sampleImages && course.sampleImages.length > 0 && (
            <div className={`rounded-2xl shadow-sm border p-8 ${cardClass}`}>
               <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                 <ImageIcon size={20} className={isDark ? 'text-slate-500' : 'text-gray-400'}/> Preview Gallery
               </h3>
               <div className="flex gap-4 overflow-x-auto pb-2">
                 {course.sampleImages.map((img, idx) => (
                   <img 
                    key={idx} 
                    src={img} 
                    onClick={() => setSelectedImage(img)}
                    className={`w-32 h-32 object-cover rounded-lg cursor-pointer hover:opacity-80 transition border ${isDark ? 'border-slate-600' : ''}`}
                   />
                 ))}
               </div>
            </div>
          )}

          {/* Files Section (Only if Owned) */}
          <div className={`rounded-2xl shadow-sm border p-8 ${cardClass}`}>
             <h2 className={`text-xl font-bold mb-6 flex items-center gap-2 ${isDark ? 'text-white' : ''}`}>
               <Download className={brandColor} /> Course Content
             </h2>
             
             {isOwned ? (
               <div className="space-y-3">
                 {course.files.length === 0 && <p className="text-gray-400 italic">No files available yet.</p>}
                 {course.files.map(f => (
                   <div key={f.id} className={`flex items-center justify-between p-4 rounded-xl hover:bg-opacity-80 transition ${isDark ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                            isDark 
                             ? 'bg-slate-700 text-slate-200'
                             : (isPizza ? 'bg-orange-100 text-orange-600' : 'bg-lime-100 text-lime-600')
                        }`}>
                          {f.type === 'video' ? 'MP4' : f.type === 'pdf' ? 'PDF' : 'ZIP'}
                        </div>
                        <div>
                          <p className={`font-bold text-sm ${isDark ? 'text-slate-200' : 'text-gray-900'}`}>{f.name}</p>
                          <p className={`text-xs ${textMuted}`}>{f.size}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDownload(f)} 
                        className={`px-4 py-2 rounded-lg text-sm font-bold border shadow-sm hover:shadow-md transition ${
                            isDark 
                             ? 'bg-slate-600 border-slate-500 text-white hover:bg-slate-500'
                             : (isPizza ? 'bg-white text-pizza-600 border-pizza-200' : 'bg-white text-lemon-600 border-lemon-200')
                        }`}
                      >
                        Download
                      </button>
                   </div>
                 ))}
               </div>
             ) : (
               <div className={`text-center py-12 rounded-xl border border-dashed ${isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                 <Lock className="mx-auto text-gray-400 mb-3" size={32} />
                 <p className="text-gray-500 font-medium">Content Locked. Purchase or watch ads to access.</p>
               </div>
             )}
          </div>
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-6">
          {/* Contact Support */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white shadow-lg">
             <h3 className="font-bold mb-4 flex items-center gap-2">Need Help?</h3>
             <div className="space-y-3">
               <a href="https://instagram.com/quixoratech" target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 bg-white/10 rounded-xl hover:bg-white/20 transition">
                 <Instagram size={20} className="text-pink-400"/>
                 <div>
                   <p className="text-xs opacity-50 uppercase font-bold">Instagram</p>
                   <p className="font-bold">@quixoratech</p>
                 </div>
               </a>
               <a href="https://t.me/King0916ok" target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 bg-white/10 rounded-xl hover:bg-white/20 transition">
                 <Send size={20} className="text-blue-400"/>
                 <div>
                   <p className="text-xs opacity-50 uppercase font-bold">Telegram</p>
                   <p className="font-bold">@King0916ok</p>
                 </div>
               </a>
             </div>
          </div>

          {!isOwned && !pendingRequest && (
            /* Unified Access Card */
            <div className={`rounded-2xl shadow-xl border overflow-hidden ${cardClass}`}>
                {/* Buy Section */}
                <div className="p-6 pb-4">
                  <div className="flex items-end justify-between mb-4">
                      <div>
                        <p className={`text-xs font-bold uppercase ${textMuted}`}>One-time Purchase</p>
                        <div className={`text-3xl font-black ${brandColor}`}>৳{course.price}</div>
                      </div>
                      <button 
                        onClick={() => setShowBuyModal(true)} 
                        className={`${btnPrimary} py-2 px-6 flex items-center gap-2`}
                      >
                        Buy Now
                      </button>
                  </div>
                  
                  {/* Divider */}
                  <div className="relative flex items-center py-4">
                      <div className={`flex-grow border-t ${isDark ? 'border-slate-600' : 'border-gray-200'}`}></div>
                      <span className={`flex-shrink-0 mx-3 text-xs font-bold uppercase ${textMuted}`}>OR UNLOCK FREE</span>
                      <div className={`flex-grow border-t ${isDark ? 'border-slate-600' : 'border-gray-200'}`}></div>
                  </div>

                  {/* Ad Unlock Section */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                        <span className={`text-sm font-bold flex items-center gap-1 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                           <Zap size={14} className="text-yellow-500 fill-yellow-500" /> Watch Ads
                        </span>
                        <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full dark:bg-slate-700 dark:text-slate-300">
                           {adsWatched} / {course.unlockAdsRequired}
                        </span>
                    </div>

                    {/* Progress Bar */}
                    <div className={`w-full rounded-full h-3 mb-4 overflow-hidden border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-gray-100 border-gray-200'}`}>
                       <div 
                        className={`h-full transition-all duration-500 ${isDark ? 'bg-indigo-500' : (isPizza ? 'bg-pizza-500' : 'bg-lemon-500')}`} 
                        style={{ width: `${Math.min(accessProgress, 100)}%`}}
                       />
                    </div>

                    {showAdPlayer ? (
                       <div className="w-full bg-black rounded-xl p-4 flex flex-col items-center justify-center text-white mb-2 animate-pulse border-2 border-gray-800">
                          <PlayCircle size={24} className="text-white mb-2" />
                          <p className="font-bold tracking-widest text-sm">AD PLAYING</p>
                          <p className="text-xs opacity-70 mt-1 uppercase tracking-wide">Wait {adTimer}s</p>
                       </div>
                    ) : (
                       <button 
                        onClick={handleWatchAd}
                        disabled={isWatchingAd}
                        className={`w-full ${btnSecondary} py-3 flex items-center justify-center gap-2 ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 text-gray-700 border-gray-200'}`}
                       >
                          {isWatchingAd ? <Loader2 className="animate-spin" size={18} /> : <Eye size={18} />}
                          <span>Watch Ad (+1)</span>
                       </button>
                    )}
                  </div>
                </div>
            </div>
          )}

          {pendingRequest && (
             <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 text-center animate-pulse">
                <Clock className="mx-auto text-yellow-600 mb-2" size={32} />
                <h3 className="font-bold text-yellow-800">Purchase Pending</h3>
                <p className="text-sm text-yellow-700 mt-2">
                  We are verifying your payment screenshot. You will be notified once approved.
                </p>
             </div>
          )}

          {isOwned && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
              <CheckCircle className="mx-auto text-green-600 mb-2" size={32} />
              <h3 className="font-bold text-green-800">Course Unlocked</h3>
              <p className="text-sm text-green-700 mt-2">
                You have lifetime access to this course.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 cursor-pointer" onClick={() => setSelectedImage(null)}>
           <img src={selectedImage} className="max-w-full max-h-screen rounded-lg" />
        </div>
      )}

      {/* Buy Modal */}
      {showBuyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
           <div className={`rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100 ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
              <div className={`p-6 text-white flex justify-between items-start ${
                  isDark ? 'bg-indigo-600' : (isPizza ? 'bg-pizza-600' : 'bg-lemon-600')
              }`}>
                <div>
                  <h3 className="text-xl font-bold">Complete Purchase</h3>
                  <p className="text-white/80 text-sm">Send ৳{course.price} to our number.</p>
                </div>
                <button onClick={() => setShowBuyModal(false)} className="text-white/70 hover:text-white"><AlertCircle size={20} /></button>
              </div>
              <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
                <div>
                   <label className={`block text-xs font-bold uppercase mb-2 ${textMuted}`}>Select Method</label>
                   <div className="grid grid-cols-2 gap-3">
                      {['Bkash', 'Nagad'].map(m => (
                        <button 
                          key={m}
                          onClick={() => setPaymentMethod(m as any)}
                          className={`py-3 rounded-xl font-bold border-2 transition ${
                            paymentMethod === m 
                              ? (isDark 
                                  ? 'border-indigo-500 bg-indigo-500/20 text-indigo-400' 
                                  : (isPizza ? 'border-pizza-500 bg-pizza-50 text-pizza-700' : 'border-lemon-500 bg-lemon-50 text-lemon-700'))
                              : (isDark ? 'border-slate-700 hover:border-slate-600 text-slate-300' : 'border-gray-100 hover:border-gray-200 text-gray-700')
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                   </div>
                </div>

                <div className={`p-4 rounded-xl text-center ${isDark ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                   <p className={`text-sm font-bold mb-1 ${textMuted}`}>Send Money To (Personal)</p>
                   <p className={`text-xl font-mono font-black tracking-wider ${isDark ? 'text-white' : ''}`}>+8801935728557</p>
                </div>
                
                <div className="flex gap-2 justify-center text-sm">
                   <a href="https://instagram.com/quixoratech" target="_blank" rel="noreferrer" className="flex items-center gap-1 text-pink-500 hover:underline">
                      <Instagram size={14} /> @quixoratech
                   </a>
                   <span className="text-gray-400">|</span>
                   <a href="https://t.me/King0916ok" target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-500 hover:underline">
                      <Send size={14} /> @King0916ok
                   </a>
                </div>

                <div>
                   <label className={`block text-xs font-bold uppercase mb-2 ${textMuted}`}>Upload Screenshot</label>
                   <div className={`relative border-2 border-dashed rounded-xl p-6 text-center transition cursor-pointer ${
                       isDark 
                         ? 'border-slate-600 hover:bg-slate-700/50' 
                         : 'border-gray-300 hover:bg-gray-50'
                   }`}>
                      <input type="file" onChange={handleFileSelect} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                      {screenshot ? (
                        <div className="flex items-center justify-center gap-2 text-green-500 font-bold">
                          <CheckCircle size={18} /> Image Selected
                        </div>
                      ) : (
                        <div className="text-gray-400">
                           <Upload className="mx-auto mb-2" />
                           <span className="text-sm font-bold">Tap to Upload Proof</span>
                        </div>
                      )}
                   </div>
                </div>

                <div className="flex gap-3 pt-2">
                   <button onClick={() => setShowBuyModal(false)} className={`flex-1 py-3 font-bold rounded-xl transition ${isDark ? 'text-slate-400 hover:bg-slate-700' : 'text-gray-500 hover:bg-gray-100'}`}>Cancel</button>
                   <button 
                    onClick={handleSubmitBuy}
                    disabled={!screenshot || submitting}
                    className={`flex-1 py-3 font-bold text-white rounded-xl shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                        isDark 
                          ? 'bg-indigo-600 hover:bg-indigo-700' 
                          : (isPizza ? 'bg-pizza-600 hover:bg-pizza-700' : 'bg-lemon-600 hover:bg-lemon-700')
                    }`}
                   >
                     {submitting ? <Loader2 className="animate-spin" size={20} /> : 'Submit Request'}
                   </button>
                </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};