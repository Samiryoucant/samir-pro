import React, { useEffect, useState } from 'react';
import { User, Theme, BuyRequest, Course, CourseFile } from '../types';
import { db } from '../services/mockDb';
import { Check, X, Trash, Plus, FileText, Video, Folder, Upload, Image as ImageIcon, Search, Eye, Pencil } from 'lucide-react';
import { useToast } from '../components/Toast.tsx';

interface AdminPanelProps {
  user: User;
  theme: Theme;
  subPage: string;
  onViewCourse: (id: string) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ user, theme, subPage, onViewCourse }) => {
  const [requests, setRequests] = useState<BuyRequest[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [stats, setStats] = useState({ users: 0, sales: 0, revenue: 0 });
  const { showToast } = useToast();
  
  // New/Edit Course State
  const [showAddModal, setShowAddModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'content' | 'images'>('basic');
  const [newCourse, setNewCourse] = useState<Partial<Course>>({ title: '', price: 0, unlockAdsRequired: 5, files: [], sampleImages: [], banner: '' });
  
  // File Upload State
  const [newFile, setNewFile] = useState<{name: string, type: 'video'|'pdf'|'zip', url: string, sourceType: 'link' | 'upload'}>({name: '', type: 'pdf', url: '', sourceType: 'upload'});
  const [fileSearch, setFileSearch] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  // Image Upload State
  const [sampleImgUploadProgress, setSampleImgUploadProgress] = useState(0);
  const [bannerUploadProgress, setBannerUploadProgress] = useState(0);

  const isDark = theme === 'dark';
  const isPizza = theme === 'pizza';

  const cardClass = isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-100';
  const inputClass = isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50';

  const refresh = () => {
    setRequests(db.requests.all());
    setCourses(db.courses.all());
    const u = db.users.all();
    const p = db.purchases.all();
    setStats({ users: u.length, sales: p.length, revenue: p.filter(x => x.type === 'buy').length * 1500 });
  };

  useEffect(() => {
    refresh();
  }, [subPage]);

  const handleRequest = (id: string, action: 'approved' | 'rejected') => {
    const req = db.requests.updateStatus(id, action);
    if (req && action === 'approved') {
       db.purchases.grant({
         id: `p-${Date.now()}`,
         userId: req.userId,
         courseId: req.courseId,
         grantedAt: new Date().toISOString(),
         type: 'manual'
       });
       showToast("Request approved and access granted.", "success");
    } else {
       showToast("Request rejected.", "error");
    }
    refresh();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Set file details
    setNewFile(prev => ({ 
      ...prev, 
      name: file.name,
      type: file.name.endsWith('.mp4') ? 'video' : file.name.endsWith('.zip') ? 'zip' : 'pdf'
    }));

    // Simulate Upload Progress
    setIsUploading(true);
    setUploadProgress(0);

    const steps = 20;
    for(let i = 1; i <= steps; i++) {
       await new Promise(r => setTimeout(r, 100)); // Simulated network delay
       setUploadProgress(Math.round((i / steps) * 100));
    }

    // For Demo: Create a blob URL for immediate access in this session
    const blobUrl = URL.createObjectURL(file);
    setNewFile(prev => ({ ...prev, url: blobUrl, sourceType: 'upload' }));
    setIsUploading(false);
    showToast("File uploaded successfully (Session Only)", "success");
  };

  const handleAddFileToCourse = () => {
    if(!newFile.name) {
      showToast("File name required", "error");
      return;
    }
    const file: CourseFile = {
      id: `f-${Date.now()}`,
      name: newFile.name,
      type: newFile.type,
      size: '15MB', // Mock size as we can't easily read it without full file object persistence in this flow
      url: newFile.url || '#',
      sourceType: newFile.sourceType
    };
    setNewCourse({...newCourse, files: [...(newCourse.files || []), file]});
    setNewFile({name: '', type: 'pdf', url: '', sourceType: 'upload'});
    setUploadProgress(0);
  };

  const handleSampleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Simulate Progress
    for(let i = 0; i <= 100; i+=20) {
      setSampleImgUploadProgress(i);
      await new Promise(r => setTimeout(r, 100));
    }

    const reader = new FileReader();
    reader.onload = (x) => {
      const result = x.target?.result as string;
      setNewCourse(prev => ({
        ...prev,
        sampleImages: [...(prev.sampleImages || []), result]
      }));
      setSampleImgUploadProgress(0);
    };
    reader.readAsDataURL(file);
  };

  const handleBannerSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Simulate Progress
    for(let i = 0; i <= 100; i+=20) {
      setBannerUploadProgress(i);
      await new Promise(r => setTimeout(r, 100));
    }

    const reader = new FileReader();
    reader.onload = (x) => {
      const result = x.target?.result as string;
      setNewCourse(prev => ({ ...prev, banner: result }));
      setBannerUploadProgress(0);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveCourse = () => {
    if (!newCourse.title) {
      showToast("Title is required", "error");
      return;
    }

    const courseData: Course = {
      id: isEditing && editingCourseId ? editingCourseId : `c-${Date.now()}`,
      title: newCourse.title!,
      description: newCourse.description || 'No description',
      price: Number(newCourse.price),
      unlockAdsRequired: Number(newCourse.unlockAdsRequired),
      thumbnail: newCourse.thumbnail || 'https://picsum.photos/400/225?random=' + Date.now(),
      banner: newCourse.banner,
      sampleImages: newCourse.sampleImages || [],
      files: newCourse.files || [],
      createdAt: isEditing ? (courses.find(c => c.id === editingCourseId)?.createdAt || new Date().toISOString()) : new Date().toISOString()
    };

    if (isEditing && editingCourseId) {
      db.courses.update(editingCourseId, courseData);
      showToast("Course updated successfully!", "success");
    } else {
      db.courses.create(courseData);
      showToast("Course created successfully!", "success");
    }

    setShowAddModal(false);
    resetForm();
    refresh();
  };

  const handleDeleteCourse = (id: string) => {
    if(window.confirm("Are you sure you want to delete this course? This action cannot be undone.")) {
      db.courses.delete(id);
      showToast("Course deleted", "success");
      refresh();
    }
  };

  const handleEditCourse = (course: Course) => {
    // Deep copy arrays to avoid mutating state directly before save
    setNewCourse({ 
      ...course,
      files: [...course.files],
      sampleImages: [...course.sampleImages]
    });
    setEditingCourseId(course.id);
    setIsEditing(true);
    setShowAddModal(true);
    setActiveTab('basic');
  };

  const resetForm = () => {
    setNewCourse({ title: '', price: 0, unlockAdsRequired: 5, files: [], sampleImages: [], banner: '' });
    setEditingCourseId(null);
    setIsEditing(false);
    setUploadProgress(0);
    setSampleImgUploadProgress(0);
    setBannerUploadProgress(0);
  };

  const openModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  if (subPage === 'admin-dashboard') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Users', value: stats.users },
          { label: 'Total Sales', value: stats.sales },
          { label: 'Est. Revenue', value: `৳${stats.revenue}` }
        ].map((s, i) => (
          <div key={i} className={`p-6 rounded-xl shadow-sm border ${cardClass}`}>
            <div className="text-gray-500 text-sm font-bold uppercase mb-1">{s.label}</div>
            <div className={`text-4xl font-black ${isDark ? 'text-indigo-400' : (isPizza ? 'text-pizza-600' : 'text-lemon-600')}`}>{s.value}</div>
          </div>
        ))}
      </div>
    );
  }

  if (subPage === 'admin-requests') {
    const pending = requests.filter(r => r.status === 'pending');
    return (
      <div className={`rounded-xl shadow-sm border overflow-hidden ${cardClass}`}>
        <div className={`p-6 border-b ${isDark ? 'border-slate-700' : 'border-gray-100'}`}>
          <h3 className="font-bold text-lg">Pending Buy Requests ({pending.length})</h3>
        </div>
        {pending.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No pending requests.</div>
        ) : (
          <div className={`divide-y ${isDark ? 'divide-slate-700' : 'divide-gray-100'}`}>
            {pending.map(r => {
               const course = courses.find(c => c.id === r.courseId);
               const requestUser = db.users.all().find(u => u.id === r.userId);
               return (
                 <div key={r.id} className="p-6 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-lg">{course?.title || 'Unknown Course'}</p>
                      <p className="text-sm text-gray-500">User: {requestUser?.username}</p>
                      <p className="text-sm text-gray-500">Method: {r.method}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <a href={r.screenshot} target="_blank" className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden border block hover:opacity-80">
                         <img src={r.screenshot} alt="proof" className="w-full h-full object-cover" />
                      </a>
                      <div className="flex gap-2">
                        <button onClick={() => handleRequest(r.id, 'approved')} className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition"><Check size={20} /></button>
                        <button onClick={() => handleRequest(r.id, 'rejected')} className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"><X size={20} /></button>
                      </div>
                    </div>
                 </div>
               );
            })}
          </div>
        )}
      </div>
    );
  }

  if (subPage === 'admin-courses') {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className={`font-bold text-2xl ${isDark ? 'text-white' : ''}`}>Courses</h3>
          <button onClick={openModal} className={`px-4 py-2 rounded-lg font-bold text-white flex items-center gap-2 ${isDark ? 'bg-indigo-600' : (isPizza ? 'bg-pizza-600' : 'bg-lemon-600')}`}>
            <Plus size={18} /> Add Course
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {courses.map(c => (
            <div key={c.id} className={`p-4 rounded-xl shadow-sm border flex justify-between items-center ${cardClass}`}>
               <div className="flex items-center gap-4">
                  <img src={c.thumbnail} className="w-16 h-16 rounded-lg object-cover" />
                  <div>
                    <h4 className="font-bold">{c.title}</h4>
                    <p className="text-sm text-gray-500">৳{c.price} • {c.unlockAdsRequired} Ads</p>
                    <p className="text-xs text-gray-400">{c.files.length} Files</p>
                  </div>
               </div>
               <div className="flex gap-2">
                 <button onClick={() => handleEditCourse(c)} className={`hover:bg-blue-50 p-2 rounded-lg transition ${isDark ? 'text-blue-400 hover:bg-slate-700' : 'text-blue-500'}`} title="Edit Course">
                   <Pencil size={18} />
                 </button>
                 <button onClick={() => handleDeleteCourse(c.id)} className={`hover:bg-red-50 p-2 rounded-lg transition ${isDark ? 'text-red-400 hover:bg-slate-700' : 'text-red-500'}`} title="Delete Course">
                   <Trash size={18} />
                 </button>
               </div>
            </div>
          ))}
        </div>

        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
            <div className={`rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden m-4 flex flex-col max-h-[90vh] ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
               {/* Modal Header */}
               <div className={`p-4 border-b flex justify-between items-center ${isDark ? 'bg-slate-700 border-slate-600' : 'bg-gray-50'}`}>
                  <h3 className={`font-bold text-lg ${isDark ? 'text-white' : ''}`}>{isEditing ? 'Edit Course' : 'Create New Course'}</h3>
                  <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
               </div>

               {/* Tabs */}
               <div className={`flex border-b ${isDark ? 'border-slate-700' : ''}`}>
                 {['basic', 'content', 'images'].map(tab => (
                   <button 
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`flex-1 py-4 font-bold text-sm uppercase tracking-wider transition ${
                        activeTab === tab 
                            ? (isDark 
                                ? 'bg-slate-700 text-indigo-400 border-b-2 border-indigo-500' 
                                : (isPizza ? 'bg-pizza-50 text-pizza-600 border-b-2 border-pizza-600' : 'bg-lemon-50 text-lemon-600 border-b-2 border-lemon-600'))
                            : (isDark ? 'text-gray-500 hover:bg-slate-700' : 'text-gray-400 hover:bg-gray-50')
                    }`}
                   >
                     {tab}
                   </button>
                 ))}
               </div>

               <div className="p-6 overflow-y-auto flex-1">
                 {activeTab === 'basic' && (
                   <div className="space-y-4">
                     <div>
                       <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Title</label>
                       <input 
                         placeholder="Course Title" 
                         className={`w-full p-3 rounded-lg border focus:ring-2 focus:outline-none ${inputClass}`}
                         value={newCourse.title}
                         onChange={e => setNewCourse({...newCourse, title: e.target.value})}
                       />
                     </div>
                     <div>
                       <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Description</label>
                       <textarea 
                         placeholder="Description" 
                         className={`w-full p-3 rounded-lg border h-32 focus:ring-2 focus:outline-none ${inputClass}`}
                         value={newCourse.description}
                         onChange={e => setNewCourse({...newCourse, description: e.target.value})}
                       />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Price (TK)</label>
                          <input 
                            type="number"
                            className={`w-full p-3 rounded-lg border ${inputClass}`}
                            value={newCourse.price}
                            onChange={e => setNewCourse({...newCourse, price: Number(e.target.value)})}
                          />
                        </div>
                        <div>
                           <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Ads to Unlock</label>
                           <input 
                              type="number"
                              className={`w-full p-3 rounded-lg border ${inputClass}`}
                              value={newCourse.unlockAdsRequired}
                              onChange={e => setNewCourse({...newCourse, unlockAdsRequired: Number(e.target.value)})}
                            />
                        </div>
                     </div>
                   </div>
                 )}

                 {activeTab === 'content' && (
                   <div className="space-y-6">
                      {/* Search/Filter Files */}
                      <div className={`flex items-center gap-2 p-2 rounded-lg ${isDark ? 'bg-slate-900' : 'bg-gray-100'}`}>
                        <Search size={18} className="text-gray-400 ml-2" />
                        <input 
                          placeholder="Search uploaded files..." 
                          className={`bg-transparent border-none focus:outline-none text-sm w-full ${isDark ? 'text-white' : ''}`}
                          value={fileSearch}
                          onChange={e => setFileSearch(e.target.value)}
                        />
                      </div>

                      <div className={`p-4 rounded-xl border border-dashed ${isDark ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50 border-gray-300'}`}>
                        <div className="flex gap-2 mb-4">
                           <button onClick={() => setNewFile({...newFile, sourceType: 'upload'})} className={`flex-1 py-2 text-sm font-bold rounded ${newFile.sourceType === 'upload' ? (isDark ? 'bg-slate-600 shadow text-white' : 'bg-white shadow') : 'opacity-50'}`}>Upload File</button>
                           <button onClick={() => setNewFile({...newFile, sourceType: 'link'})} className={`flex-1 py-2 text-sm font-bold rounded ${newFile.sourceType === 'link' ? (isDark ? 'bg-slate-600 shadow text-white' : 'bg-white shadow') : 'opacity-50'}`}>External Link</button>
                        </div>
                        
                        {newFile.sourceType === 'upload' ? (
                          <div className="space-y-3">
                             {/* File Picker */}
                             <div className={`relative border-2 border-dashed rounded-lg p-6 text-center transition cursor-pointer group ${isDark ? 'border-slate-500 hover:bg-slate-700' : 'border-gray-300 hover:bg-white'}`}>
                                <input type="file" onChange={handleFileSelect} className="absolute inset-0 opacity-0 cursor-pointer" />
                                <div className="pointer-events-none group-hover:scale-105 transition-transform">
                                  <Upload className="mx-auto text-gray-400 mb-2" />
                                  <p className="text-sm font-bold text-gray-500">{newFile.name || 'Click to select file (PDF, Zip, Video)'}</p>
                                </div>
                             </div>
                             
                             {/* Progress Bar */}
                             {isUploading && (
                               <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                                 <div className={`h-full ${isDark ? 'bg-indigo-500' : (isPizza ? 'bg-pizza-500' : 'bg-lemon-500')} transition-all duration-300`} style={{width: `${uploadProgress}%`}} />
                               </div>
                             )}
                             {uploadProgress > 0 && !isUploading && (
                                <div className="text-xs text-green-600 font-bold text-center">Upload Complete</div>
                             )}
                          </div>
                        ) : (
                          <input 
                            placeholder="https://example.com/file.zip"
                            className={`w-full p-2 border rounded text-sm mb-3 ${inputClass}`}
                            value={newFile.url}
                            onChange={e => setNewFile({...newFile, url: e.target.value})}
                          />
                        )}

                        <div className="flex gap-2 mt-4">
                           <input 
                              placeholder="Display Name"
                              className={`flex-1 p-2 border rounded text-sm ${inputClass}`}
                              value={newFile.name}
                              onChange={e => setNewFile({...newFile, name: e.target.value})}
                           />
                           <select 
                              className={`p-2 border rounded text-sm ${inputClass}`}
                              value={newFile.type} 
                              onChange={e => setNewFile({...newFile, type: e.target.value as any})}
                           >
                              <option value="pdf">PDF</option>
                              <option value="video">Video</option>
                              <option value="zip">Zip</option>
                           </select>
                           <button 
                              onClick={handleAddFileToCourse} 
                              disabled={isUploading}
                              className={`px-4 py-2 rounded font-bold text-sm text-white ${isDark ? 'bg-indigo-600' : (isPizza ? 'bg-pizza-600' : 'bg-lemon-600')} disabled:opacity-50`}
                           >
                             Add
                           </button>
                        </div>
                      </div>

                      {/* File List */}
                      <div className="space-y-2">
                        {newCourse.files?.filter(f => f.name.toLowerCase().includes(fileSearch.toLowerCase())).map((f) => (
                          <div key={f.id} className={`flex justify-between items-center p-3 rounded-lg border shadow-sm text-sm ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-200'}`}>
                             <div className="flex items-center gap-3">
                                <div className={`p-2 rounded ${isDark ? 'bg-slate-600 text-indigo-400' : (isPizza ? 'bg-pizza-100 text-pizza-600' : 'bg-lemon-100 text-lemon-600')}`}>
                                  {f.type === 'video' ? <Video size={16}/> : f.type === 'zip' ? <Folder size={16}/> : <FileText size={16}/>}
                                </div>
                                <div>
                                  <p className="font-bold">{f.name}</p>
                                  <p className="text-xs text-gray-400">{f.size} • {f.sourceType === 'upload' ? 'Local' : 'Link'}</p>
                                </div>
                             </div>
                             <div className="flex gap-2">
                               {f.url && f.url !== '#' && (
                                 <a 
                                  href={f.url} 
                                  target="_blank" 
                                  className="text-gray-400 hover:text-blue-500 p-1" 
                                  title="Preview File"
                                 >
                                   <Eye size={16} />
                                 </a>
                               )}
                               <button onClick={() => {
                                  const files = (newCourse.files || []).filter(x => x.id !== f.id);
                                  setNewCourse({...newCourse, files});
                               }} className="text-red-400 hover:text-red-600 p-1">
                                 <Trash size={16} />
                               </button>
                             </div>
                          </div>
                        ))}
                        {(!newCourse.files || newCourse.files.length === 0) && (
                          <div className="text-center text-gray-400 text-sm py-4">No files added yet.</div>
                        )}
                      </div>
                   </div>
                 )}

                 {activeTab === 'images' && (
                   <div className="space-y-8">
                      {/* Thumbnail Section */}
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Thumbnail URL</label>
                        <input 
                          className={`w-full p-3 rounded-lg border mb-4 ${inputClass}`}
                          placeholder="https://..."
                          value={newCourse.thumbnail || ''}
                          onChange={e => setNewCourse({...newCourse, thumbnail: e.target.value})}
                        />
                        {newCourse.thumbnail && <img src={newCourse.thumbnail} className="w-full h-40 object-cover rounded-lg shadow-sm" />}
                      </div>

                      {/* Banner Section */}
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Banner Image (Optional)</label>
                        <div className="mb-4">
                           <div className={`relative border-2 border-dashed rounded-lg p-6 text-center transition cursor-pointer group mb-2 ${isDark ? 'border-slate-500 hover:bg-slate-700' : 'border-gray-300 hover:bg-white'}`}>
                              <input type="file" accept="image/*" onChange={handleBannerSelect} className="absolute inset-0 opacity-0 cursor-pointer" />
                              <div className="pointer-events-none group-hover:scale-105 transition-transform">
                                <Upload className="mx-auto text-gray-400 mb-2" />
                                <p className="text-sm font-bold text-gray-500">Upload Banner Image</p>
                              </div>
                           </div>
                           <input 
                              className={`w-full p-3 rounded-lg border text-sm ${inputClass}`}
                              placeholder="Or paste Banner URL..."
                              value={newCourse.banner || ''}
                              onChange={e => setNewCourse({...newCourse, banner: e.target.value})}
                           />
                        </div>
                        {bannerUploadProgress > 0 && (
                            <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden mb-2">
                              <div className="bg-blue-500 h-full transition-all" style={{width: `${bannerUploadProgress}%`}} />
                            </div>
                        )}
                        {newCourse.banner && <img src={newCourse.banner} className="w-full h-32 object-cover rounded-lg shadow-sm" />}
                      </div>

                      {/* Sample Images Section */}
                      <div>
                         <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Sample Images (Gallery)</label>
                         <div className="grid grid-cols-3 gap-2 mb-4">
                            {newCourse.sampleImages?.map((img, i) => (
                              <div key={i} className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden border">
                                <img src={img} className="w-full h-full object-cover" />
                                <button 
                                  onClick={() => {
                                    const imgs = [...(newCourse.sampleImages || [])];
                                    imgs.splice(i, 1);
                                    setNewCourse({...newCourse, sampleImages: imgs});
                                  }}
                                  className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                                >
                                  <Trash size={20} />
                                </button>
                              </div>
                            ))}
                            <div className={`relative aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-gray-400 transition cursor-pointer ${isDark ? 'bg-slate-700/50 border-slate-600 hover:bg-slate-700' : 'bg-gray-50 border-gray-300 hover:bg-white'}`}>
                               <input type="file" accept="image/*" onChange={handleSampleImageSelect} className="absolute inset-0 opacity-0 cursor-pointer" />
                               <ImageIcon size={24} className="mb-1"/>
                               <span className="text-xs font-bold">Add</span>
                            </div>
                         </div>
                         {sampleImgUploadProgress > 0 && (
                            <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                              <div className="bg-blue-500 h-full transition-all" style={{width: `${sampleImgUploadProgress}%`}} />
                            </div>
                         )}
                      </div>
                   </div>
                 )}
               </div>

               <div className={`p-6 border-t flex gap-3 shrink-0 ${isDark ? 'bg-slate-700 border-slate-600' : 'bg-gray-50'}`}>
                  <button onClick={() => setShowAddModal(false)} className={`flex-1 py-3 font-bold border rounded-xl ${isDark ? 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700' : 'text-gray-500 bg-white hover:bg-gray-100'}`}>Cancel</button>
                  <button onClick={handleSaveCourse} className={`flex-1 py-3 font-bold text-white rounded-xl shadow-lg ${isDark ? 'bg-indigo-600 hover:bg-indigo-700' : (isPizza ? 'bg-pizza-600 hover:bg-pizza-700' : 'bg-lemon-600 hover:bg-lemon-700')}`}>
                    {isEditing ? 'Update Course' : 'Create Course'}
                  </button>
               </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return <div>Select a subpage</div>;
};