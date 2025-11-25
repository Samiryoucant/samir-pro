import React, { useEffect, useState } from 'react';
import { User, Theme, Course, CourseFile } from '../types';
import { db } from '../services/mockDb';
import { ArrowLeft, Download, Eye, Upload, CheckCircle, Clock, AlertCircle, Lock, Loader2, PlayCircle, Instagram, Send, Image as ImageIcon } from 'lucide-react';
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
    
  const btnPrimary = `px-6 py-3 rounded-xl font-bold text-white shadow-lg transition active:scale-95 ${
    isDark 
      ? 'bg-indigo-600 hover:bg-indigo-700' 
      : (isPizza ? 'bg-pizza-600 hover:bg-pizza-700' : 'bg-lemon-600 hover:bg-lemon-700')
  }`;
  
  const btnSecondary = `px-6 py-3 rounded-xl font-bold border-2 transition active:scale-95 ${
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

    if (file.sourceType === 'upload' && file.url.startsWith('blob:')) {
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
             <h3 className="font-bold mb-4 flex items-center gap-2">Need Help / Buy?</h3>
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
            <>
              {/* Buy Card */}
              <div className={`rounded-2xl shadow-lg border p-6 relative overflow-hidden ${cardClass}`}>
                <div className={`absolute top-0 right-0 p-2 opacity-10 ${brandColor}`}>
                   <CheckCircle size={100} />
                </div>
                <div className="text-center mb-6 relative z-10">
                  <p className={`${textMuted} text-sm uppercase font-bold tracking-wider`}>Premium Access</p>
                  <div className={`text-4xl font-black mt-2 ${brandColor}`}>৳{course.price}</div>
                </div>
                <button onClick={() => setShowBuyModal(true)} className={`w-full ${btnPrimary} flex items-center justify-center gap-2 relative z-10`}>
                   Buy Now
                </button>
              </div>

              {/* Ad Unlock Card */}
              <div className={`rounded-2xl border-2 p-6 transition-all duration-300 hover:shadow-xl ${
                isDark 
                  ? 'bg-slate-800 border-slate-600'
                  : (isPizza ? 'bg-orange-50 border-orange-200 hover:shadow-orange-100' : 'bg-lime-50 border-lime-200 hover:shadow-lime-100')
              }`}>
                 <div className="flex items-center justify-between mb-2">
                   <h3 className={`font-bold ${
                     isDark ? 'text-indigo-400' : (isPizza ? 'text-orange-800' : 'text-lime-800')
                   }`}>Unlock for Free</h3>
                   <span className={`px-2 py-1 rounded-md text-xs font-black shadow-sm border ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white'}`}>
                     {Math.round((adsWatched / course.unlockAdsRequired) * 100)}%
                   </span>
                 </div>
                 
                 <div className={`flex justify-between text-xs font-bold mb-2 uppercase ${textMuted}`}>
                    <span>Progress</span>
                    <span>{adsWatched} / {course.unlockAdsRequired} Ads</span>
                 </div>

                 <div className={`w-full rounded-full h-4 mb-6 overflow-hidden border shadow-inner relative ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`}>
                   {/* Striped Background for bar */}
                   <div 
                    className={`h-full transition-all duration-500 relative ${
                        isDark ? 'bg-indigo-600' : (isPizza ? 'bg-pizza-500' : 'bg-lemon-500')
                    }`} 
                    style={{ width: `${Math.min((adsWatched / course.unlockAdsRequired) * 100, 100)}%`}}
                   >
                     <div className="absolute inset-0 bg-white/20" style={{backgroundImage: 'linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)', backgroundSize: '1rem 1rem'}}></div>
                   </div>
                 </div>

                 {showAdPlayer ? (
                   <div className="w-full aspect-video bg-black rounded-xl flex flex-col items-center justify-center text-white mb-4 animate-pulse relative overflow-hidden border-2 border-gray-800">
                      <div className="absolute inset-0 bg-gray-900 opacity-50"></div>
                      <div className="z-10 flex flex-col items-center">
                        <div className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center mb-3">
                           <PlayCircle size={24} className="text-white" />
                        </div>
                        <p className="font-bold text-lg tracking-widest">ADVERTISEMENT</p>
                        <p className="text-xs opacity-70 mt-1 uppercase tracking-wide">Please wait {adTimer}s</p>
                      </div>
                      <div className="absolute bottom-0 left-0 h-1 bg-red-500 transition-all duration-1000 ease-linear" style={{width: `${(adTimer/15)*100}%`}}></div>
                   </div>
                 ) : (
                   <button 
                    onClick={handleWatchAd}
                    disabled={isWatchingAd}
                    className={`w-full ${btnSecondary} flex items-center justify-center gap-2 ${isDark ? 'bg-slate-800' : 'bg-white'}`}
                   >
                      {isWatchingAd ? (
                        <Loader2 className="animate-spin" size={18} />
                      ) : (
                        <><Eye size={18} /> Watch Ad (+1)</>
                      )}
                   </button>
                 )}
                 <p className="text-xs text-center mt-3 opacity-60">
                   Watch {course.unlockAdsRequired} ads via Monetag to get full access instantly.
                 </p>
              </div>
            </>
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