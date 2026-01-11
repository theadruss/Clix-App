
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import { UserRole, EventStatus, Event, User, Venue, Club, Post, VolunteerApplication, VolunteerStatus, Announcement, MediaPost, Feedback, Comment, Winner } from './types';
import { MOCK_USERS } from './constants';
import { api } from './services/api'; 
import { generateEventContent, generateEventReport, generateImage } from './services/geminiService';
import { 
  Calendar, MapPin, Clock, Users, Check, X, Search, Loader2, Sparkles, AlertCircle, TrendingUp,
  DollarSign, CheckSquare, Hand, Trophy, Megaphone, PlusCircle, Mail, Lock, ArrowRight, Edit,
  Save, MessageSquare, Heart, Send, ArrowLeft, FileText, Briefcase, LogOut, Filter, Star, QrCode, Image as ImageIcon,
  Smartphone, Award, Download, Home, BarChart3, UserCog, Ticket, ChevronRight, Eye, ThumbsUp, LayoutGrid, FileText as ReportIcon, Palette, Share2, Plus, PenSquare
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import QRCode from "react-qr-code";

// --- Helpers ---

const ImageUpload = ({ label, onImageSelected, currentImage }: { label: string, onImageSelected: (base64: string) => void, currentImage?: string }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5000000) { // 5MB limit check
          alert("File is too large. Please select an image under 5MB.");
          return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        onImageSelected(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div>
      <label className="block text-xs font-bold uppercase text-gray-500 mb-2">{label}</label>
      <div className="flex items-center gap-4">
        {currentImage ? (
           <div className="relative group">
              <img src={currentImage} alt="Preview" className="w-20 h-20 object-cover border-2 border-black" />
           </div>
        ) : (
           <div className="w-20 h-20 border-2 border-dashed border-gray-400 flex items-center justify-center text-gray-400">
              <ImageIcon size={24} />
           </div>
        )}
        <label className="cursor-pointer bg-white border-2 border-black px-4 py-3 font-bold hover:bg-yellow-50 flex items-center gap-2 transition-colors">
            <span>{currentImage ? 'Change' : 'Choose'}</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </label>
      </div>
    </div>
  );
};

// --- Shared Components ---

const StatusBadge = ({ status }: { status: EventStatus }) => {
  const styles = {
    [EventStatus.APPROVED]: 'bg-yellow-400 text-black border border-yellow-500 shadow-[2px_2px_0px_rgba(0,0,0,1)]',
    [EventStatus.PENDING]: 'bg-black text-white border border-gray-700',
    [EventStatus.REJECTED]: 'bg-gray-200 text-gray-500 border border-gray-300 line-through',
    [EventStatus.COMPLETED]: 'bg-gray-800 text-white border border-gray-900',
  };
  return (
    <span className={`px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest rounded-sm ${styles[status]}`}>
      {status}
    </span>
  );
};

const VolunteerBadge = ({ status }: { status: VolunteerStatus }) => {
    const styles = {
      [VolunteerStatus.PENDING]: 'bg-gray-100 text-gray-500 border border-gray-300',
      [VolunteerStatus.ACCEPTED]: 'bg-green-100 text-green-700 border border-green-300',
      [VolunteerStatus.REJECTED]: 'bg-red-50 text-red-400 border border-red-200 line-through',
    };
    return (
      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-sm ${styles[status]}`}>
        {status}
      </span>
    );
};

const SplashScreen = () => {
    return (
        <div className="fixed inset-0 bg-yellow-400 flex flex-col items-center justify-center z-50 animate-out fade-out duration-500 delay-[2000ms] fill-mode-forwards">
            <h1 className="text-8xl font-black mb-2 text-black tracking-tighter animate-in zoom-in duration-700">CLIX<span className="text-white">.</span></h1>
            <p className="font-bold text-black text-xl uppercase tracking-[0.5em] animate-in slide-in-from-bottom-4 duration-1000 delay-300">Campus Life</p>
        </div>
    );
};

// --- Modals ---

const Modal = ({ isOpen, onClose, title, children, large = false }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; large?: boolean }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
            <div className={`bg-white w-full ${large ? 'max-w-4xl' : 'max-w-2xl'} my-8 shadow-2xl border-4 border-yellow-400 animate-in zoom-in-95 duration-200 relative`}>
                <div className="p-6 border-b-2 border-black flex justify-between items-center bg-gray-50 sticky top-0 z-10">
                    <h2 className="text-xl font-black uppercase text-black">{title}</h2>
                    <button onClick={onClose} className="hover:bg-red-500 hover:text-white p-1 transition text-black"><X size={24} /></button>
                </div>
                <div className="p-6 max-h-[80vh] overflow-y-auto text-black">
                    {children}
                </div>
            </div>
        </div>
    );
};

const PaymentModal = ({ isOpen, onClose, event, onConfirm }: { isOpen: boolean, onClose: () => void, event: Event | null, onConfirm: () => void }) => {
    const [processing, setProcessing] = useState(false);

    const handlePay = () => {
        setProcessing(true);
        setTimeout(() => {
            setProcessing(false);
            onConfirm();
        }, 1500); 
    };

    if (!isOpen || !event) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Secure Payment">
            <div className="text-center space-y-8 py-4">
                <div className="bg-gray-50 p-6 border border-gray-200 rounded-lg">
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-2">Total Amount</p>
                    <p className="text-5xl font-black mb-1">₹{event.price}</p>
                    <p className="text-sm font-bold text-gray-400">for {event.title}</p>
                </div>
                
                <div className="space-y-3">
                    <p className="font-bold text-sm uppercase text-left mb-2">Select Payment Method</p>
                    <button 
                        onClick={handlePay}
                        disabled={processing}
                        className="w-full flex items-center justify-between p-4 border-2 border-black hover:bg-yellow-50 transition group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="bg-black text-white p-2 rounded">
                                <Smartphone size={20} />
                            </div>
                            <span className="font-bold">UPI / GPay / PhonePe</span>
                        </div>
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform"/>
                    </button>
                    
                    <button disabled className="w-full flex items-center justify-between p-4 border-2 border-gray-200 text-gray-400 cursor-not-allowed">
                         <div className="flex items-center gap-3">
                            <div className="bg-gray-200 text-gray-400 p-2 rounded">
                                <DollarSign size={20} />
                            </div>
                            <span className="font-bold">Credit/Debit Card (Coming Soon)</span>
                        </div>
                    </button>
                </div>

                {processing && (
                    <div className="flex flex-col items-center justify-center text-yellow-500 animate-pulse">
                        <Loader2 className="animate-spin mb-2" size={32} />
                        <span className="font-bold text-xs uppercase tracking-widest">Processing Payment...</span>
                    </div>
                )}
            </div>
        </Modal>
    );
};

const TicketQRModal = ({ isOpen, onClose, event, user }: { isOpen: boolean, onClose: () => void, event: Event | null, user: User }) => {
    if (!isOpen || !event) return null;
    const ticketData = JSON.stringify({ eventId: event.id, userId: user.id, userName: user.name, timestamp: new Date().toISOString() });
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Entry Ticket">
            <div className="text-center space-y-6">
                <div className="bg-black text-yellow-400 p-6 rounded-t-lg">
                    <h3 className="text-2xl font-black">{event.title}</h3>
                    <p className="font-medium">{event.date} | {event.time}</p>
                </div>
                <div className="flex justify-center py-4">
                    <div className="p-4 border-4 border-black bg-white">
                        <QRCode value={ticketData} size={200} level="L" />
                    </div>
                </div>
                <div>
                    <p className="font-black text-xl uppercase">{user.name}</p>
                    <p className="text-gray-500 font-bold text-sm">Role: {user.role}</p>
                    <p className="text-xs text-gray-400 mt-2">Scan this at the venue entrance</p>
                </div>
                {event.certificatesIssued && (
                    <div className="border-t-2 border-dashed border-gray-300 pt-6 mt-4">
                        <p className="font-bold text-lg mb-2">Certificate Available!</p>
                        <button className="bg-yellow-400 text-black px-6 py-3 font-bold uppercase tracking-widest border-2 border-black hover:bg-yellow-300 flex items-center gap-2 mx-auto" onClick={() => { onClose(); }}>
                            <Award size={20} /> View Certificate
                        </button>
                        <p className="text-xs text-gray-400 mt-2">Check 'Profile' to access.</p>
                    </div>
                )}
            </div>
        </Modal>
    );
};

const CertificateModal = ({ isOpen, onClose, event, user }: { isOpen: boolean, onClose: () => void, event: Event | null, user: User }) => {
    if (!isOpen || !event) return null;
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Certificate of Completion" large>
            <div className="bg-white p-10 border-8 border-double border-yellow-400 text-center relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none">
                     <Award size={400} />
                </div>
                <div className="relative z-10 text-black">
                    <div className="mb-8">
                         <h1 className="text-5xl font-black uppercase tracking-tight mb-2">Certificate</h1>
                         <p className="text-xl font-serif italic text-gray-600">of Participation</p>
                    </div>
                    <p className="text-lg text-gray-500 uppercase tracking-widest mb-4">Presented To</p>
                    <h2 className="text-4xl font-black border-b-2 border-black inline-block px-10 pb-2 mb-8">{user.name}</h2>
                    <p className="text-gray-600 mb-6 max-w-xl mx-auto font-medium">
                        For actively participating in <span className="font-bold text-black">{event.title}</span> organized by {event.organizer} on {event.date}.
                    </p>
                    <div className="flex justify-center gap-20 mt-16">
                        <div className="text-center">
                            <div className="w-40 border-b-2 border-black mb-2"></div>
                            <p className="text-xs font-bold uppercase">Club President</p>
                        </div>
                         <div className="text-center">
                            <div className="w-40 border-b-2 border-black mb-2"></div>
                            <p className="text-xs font-bold uppercase">Faculty Advisor</p>
                        </div>
                    </div>
                     <div className="mt-12">
                         <button onClick={() => alert("Downloaded Certificate!")} className="bg-black text-white px-6 py-3 font-bold uppercase tracking-widest hover:bg-gray-800 flex items-center gap-2 mx-auto">
                            <Download size={18} /> Download PDF
                         </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

const EditProfileModal = ({ isOpen, onClose, user, onUpdate }: { isOpen: boolean, onClose: () => void, user: User, onUpdate: (data: Partial<User>) => void }) => {
    const [name, setName] = useState(user.name);
    const [bio, setBio] = useState(user.bio || '');
    const [avatar, setAvatar] = useState(user.avatar || '');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setName(user.name);
        setBio(user.bio || '');
        setAvatar(user.avatar || '');
    }, [user, isOpen]);

    const handleSave = async () => {
        setLoading(true);
        await onUpdate({ name, bio, avatar });
        setLoading(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Profile">
            <div className="space-y-6">
                <div className="flex justify-center">
                     <ImageUpload label="Profile Picture" onImageSelected={setAvatar} currentImage={avatar} />
                </div>
                <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Full Name</label>
                    <input className="w-full p-3 border-2 border-gray-200 focus:border-black focus:outline-none font-bold text-black" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Bio</label>
                    <textarea rows={3} className="w-full p-3 border-2 border-gray-200 focus:border-black focus:outline-none font-medium text-black" value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell us about yourself..." />
                </div>
                <button onClick={handleSave} disabled={loading} className="w-full bg-black text-white py-3 font-bold uppercase tracking-widest hover:bg-gray-800">
                    {loading ? <Loader2 className="animate-spin mx-auto"/> : 'Save Changes'}
                </button>
            </div>
        </Modal>
    );
};

const FeedbackModal = ({ isOpen, onClose, event, onSubmit }: { isOpen: boolean, onClose: () => void, event: Event | null, onSubmit: (r: number, c: string) => void }) => {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');

    if (!isOpen || !event) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Rate Event">
            <div className="space-y-6">
                <p className="font-medium text-center text-gray-600">How was your experience at <span className="font-bold text-black">{event.title}</span>?</p>
                <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} onClick={() => setRating(star)} className="focus:outline-none transition-transform hover:scale-110">
                            <Star size={32} fill={star <= rating ? "#FACC15" : "none"} stroke={star <= rating ? "#FACC15" : "#D1D5DB"} />
                        </button>
                    ))}
                </div>
                <textarea className="w-full border-2 border-black p-3 font-medium focus:outline-none focus:ring-4 focus:ring-yellow-100 text-black" rows={3} placeholder="Tell us what you liked..." value={comment} onChange={(e) => setComment(e.target.value)} />
                <button onClick={() => { onSubmit(rating, comment); onClose(); }} className="w-full bg-black text-white py-3 font-bold uppercase tracking-widest hover:bg-gray-800">
                    Submit Feedback
                </button>
            </div>
        </Modal>
    );
};

const EventManagementModal = ({ isOpen, onClose, event, volunteers, registeredUsers, onUpdateVolunteerStatus }: { 
    isOpen: boolean; 
    onClose: () => void; 
    event: Event | null; 
    volunteers: VolunteerApplication[];
    registeredUsers: User[]; 
    onUpdateVolunteerStatus: (appId: string, status: VolunteerStatus) => void;
}) => {
    const [report, setReport] = useState<string | null>(null);
    const [generatingReport, setGeneratingReport] = useState(false);

    useEffect(() => {
        setReport(null);
    }, [event?.id]);

    const handleGenerateReport = async () => {
        if(!event) return;
        setGeneratingReport(true);
        const reportText = await generateEventReport(
            event.title, 
            { registered: event.registeredCount, capacity: event.capacity, revenue: event.registeredCount * event.price },
            event.feedback || []
        );
        setReport(reportText);
        setGeneratingReport(false);
    };

    if (!isOpen || !event) return null;
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Event Management" large>
            <div className="space-y-8">
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-black text-white p-4">
                        <p className="text-xs text-gray-400 font-bold uppercase">Registrations</p>
                        <p className="text-2xl font-black">{event.registeredCount} <span className="text-sm font-medium text-gray-500">/ {event.capacity}</span></p>
                    </div>
                    <div className="bg-yellow-400 text-black p-4 border border-black">
                         <p className="text-xs font-bold uppercase">Revenue</p>
                         <p className="text-2xl font-black">₹{event.registeredCount * event.price}</p>
                    </div>
                     <div className="bg-gray-100 p-4 border border-gray-200">
                         <p className="text-xs text-gray-500 font-bold uppercase">Volunteers</p>
                         <p className="text-2xl font-black text-black">{volunteers.length}</p>
                    </div>
                    <div className="bg-gray-100 p-4 border border-gray-200">
                         <p className="text-xs text-gray-500 font-bold uppercase">Rating</p>
                         <p className="text-2xl font-black text-black">{event.feedback ? (event.feedback.reduce((a, b) => a + b.rating, 0) / event.feedback.length).toFixed(1) : '-'}</p>
                    </div>
                </div>
                
                <div className="flex flex-col md:flex-row gap-8">
                    <div className="flex-1">
                        <h3 className="text-lg font-black uppercase mb-4 border-b-2 border-black pb-2 text-black">Volunteer Applications</h3>
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                            {volunteers.length === 0 ? <p className="text-gray-500 text-sm italic">No volunteer applications yet.</p> :
                             volunteers.map(vol => (
                                 <div key={vol.id} className="bg-white border border-gray-200 p-3 flex justify-between items-center text-black">
                                     <div className="flex items-center gap-3">
                                         <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
                                              <img src={vol.userAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${vol.userName}`} />
                                         </div>
                                         <div>
                                             <p className="font-bold text-sm">{vol.userName}</p>
                                             <VolunteerBadge status={vol.status} />
                                         </div>
                                     </div>
                                     {vol.status === VolunteerStatus.PENDING && (
                                         <div className="flex gap-1">
                                             <button onClick={() => onUpdateVolunteerStatus(vol.id, VolunteerStatus.ACCEPTED)} className="p-1.5 bg-green-100 text-green-700 hover:bg-green-200 rounded"><Check size={14} /></button>
                                             <button onClick={() => onUpdateVolunteerStatus(vol.id, VolunteerStatus.REJECTED)} className="p-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded"><X size={14} /></button>
                                         </div>
                                     )}
                                 </div>
                             ))
                            }
                        </div>
                    </div>

                    <div className="flex-1">
                        <h3 className="text-lg font-black uppercase mb-4 border-b-2 border-black pb-2 text-black">Registered Students</h3>
                        <div className="space-y-2 max-h-64 overflow-y-auto bg-gray-50 p-2">
                             {registeredUsers.length === 0 ? <p className="text-gray-500 text-sm italic">No registrations found.</p> :
                              registeredUsers.map(user => (
                                  <div key={user.id} className="flex justify-between items-center text-sm p-2 border-b border-gray-200 text-black">
                                      <div className="flex items-center gap-2">
                                          <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden border border-gray-300">
                                              <img src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} className="w-full h-full object-cover" />
                                          </div>
                                          <div>
                                              <p className="font-bold leading-none">{user.name}</p>
                                              <p className="text-[10px] text-gray-500">{user.year} • {user.branch}</p>
                                          </div>
                                      </div>
                                      <span className="text-xs text-gray-500">{user.email}</span>
                                  </div>
                              ))
                             }
                        </div>
                    </div>
                </div>

                <div className="border-t-2 border-gray-100 pt-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-black uppercase text-black">Post-Event Analysis</h3>
                        <button onClick={handleGenerateReport} disabled={generatingReport} className="bg-black text-white px-4 py-2 text-xs font-bold uppercase hover:bg-gray-800 flex items-center gap-2">
                            {generatingReport ? <Loader2 className="animate-spin" size={14}/> : <><ReportIcon size={14} /> Generate AI Report</>}
                        </button>
                    </div>
                    {report && (
                        <div className="bg-yellow-50 border-2 border-yellow-400 p-4 mb-6 max-h-60 overflow-y-auto text-black">
                            <pre className="whitespace-pre-wrap font-sans text-sm">{report}</pre>
                        </div>
                    )}
                    <h4 className="font-bold text-sm uppercase text-gray-500 mb-2">Student Feedback</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-48 overflow-y-auto">
                        {event.feedback && event.feedback.length > 0 ? (
                            event.feedback.map((fb, idx) => (
                                <div key={idx} className="bg-gray-50 p-3 border-l-4 border-black">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="flex text-yellow-400">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} size={12} fill={i < fb.rating ? "currentColor" : "none"} stroke="currentColor" />
                                            ))}
                                        </div>
                                        <span className="text-xs font-bold text-gray-400">Student</span>
                                    </div>
                                    <p className="text-sm italic text-gray-700">"{fb.comment}"</p>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 text-sm italic">No feedback received yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
};

// ... (Rest of App.tsx follows standard structure, only changed ClubAdminDashboard poster modal)

// --- Component: EventCard ---
// (No changes to EventCard)
const EventCard = ({ event, isAdminView, onClick, onRegister, onEdit, onGeneratePoster, onIssueCertificates, venueName, onVolunteer, volunteerStatus, isRegistered }: { 
    event: Event, 
    isAdminView?: boolean, 
    onClick?: () => void, 
    onRegister?: (e: Event) => void, 
    onEdit?: (e: Event) => void,
    onGeneratePoster?: () => void,
    onIssueCertificates?: (e: Event) => void,
    venueName?: string,
    onVolunteer?: (id: string) => void,
    volunteerStatus?: VolunteerStatus,
    isRegistered?: boolean
}) => {
    
    const handleShare = (e: React.MouseEvent) => {
        e.stopPropagation();
        const shareData = {
            title: event.title,
            text: `Check out ${event.title} by ${event.organizer}!`,
            url: window.location.href // In a real app this would be specific link
        };
        if (navigator.share) {
            navigator.share(shareData).catch(console.error);
        } else {
            alert(`Share link copied: ${shareData.url}`);
        }
    };

    return (
        <div onClick={onClick} className="bg-white border-2 border-black shadow-[4px_4px_0px_#000] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#000] transition-all cursor-pointer group relative overflow-hidden flex flex-col h-full text-black">
            <div className="h-40 overflow-hidden bg-gray-200 border-b-2 border-black relative">
                 <img src={event.image} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                 <div className="absolute top-2 right-2 flex gap-1">
                     <StatusBadge status={event.status} />
                 </div>
                 {event.price === 0 && (
                     <div className="absolute bottom-2 right-2 bg-black text-white px-2 py-1 text-[10px] font-bold uppercase tracking-widest">Free</div>
                 )}
                 <button 
                    onClick={handleShare}
                    className="absolute bottom-2 left-2 bg-white/90 p-1.5 rounded-full border border-black hover:bg-yellow-400 transition-colors"
                    title="Share Event"
                 >
                     <Share2 size={16} className="text-black" />
                 </button>
            </div>
            <div className="p-4 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-black text-lg leading-tight uppercase">{event.title}</h3>
                </div>
                
                <div className="space-y-1 mb-4 flex-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                        <Calendar size={14} />
                        <span>{event.date} • {event.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                        <MapPin size={14} />
                        <span>{venueName || event.venueId}</span>
                    </div>
                </div>

                {isAdminView ? (
                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t-2 border-gray-100" onClick={e => e.stopPropagation()}>
                        <button onClick={() => onEdit?.(event)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-black py-2 text-[10px] font-bold uppercase flex items-center justify-center gap-1">
                            <Edit size={12} /> Edit
                        </button>
                        {event.status === EventStatus.APPROVED && (
                            <>
                                <button onClick={onGeneratePoster} className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black py-2 text-[10px] font-bold uppercase flex items-center justify-center gap-1">
                                    <Sparkles size={12} /> Poster
                                </button>
                                {event.certificatesIssued ? (
                                     <button disabled className="flex-1 bg-green-100 text-green-700 py-2 text-[10px] font-bold uppercase flex items-center justify-center gap-1">
                                        <Check size={12} /> Issued
                                     </button>
                                ) : (
                                    <button onClick={() => onIssueCertificates?.(event)} className="flex-1 bg-black text-white hover:bg-gray-800 py-2 text-[10px] font-bold uppercase flex items-center justify-center gap-1">
                                        <Award size={12} /> Certs
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                ) : (
                    <div className="mt-4 pt-4 border-t-2 border-gray-100 flex gap-2">
                        {isRegistered ? (
                             <button disabled className="flex-1 bg-gray-100 text-green-600 py-2 font-bold uppercase tracking-widest border border-gray-200 flex items-center justify-center gap-2 cursor-default text-xs">
                                 <Check size={14} /> Registered
                             </button>
                        ) : (
                            <button 
                                onClick={(e) => { e.stopPropagation(); onRegister?.(event); }}
                                className="flex-1 bg-black text-white px-4 py-2 font-bold text-xs uppercase hover:bg-gray-800 transition-colors"
                            >
                                {event.price > 0 ? `Buy Ticket ₹${event.price}` : 'Register Free'}
                            </button>
                        )}
                        {event.volunteersNeeded && onVolunteer && (
                             volunteerStatus ? (
                                 <div className="px-3 py-2 border border-gray-200 bg-gray-50 flex items-center justify-center" title="Volunteer Status">
                                     <VolunteerBadge status={volunteerStatus} />
                                 </div>
                             ) : (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onVolunteer(event.id); }}
                                    className="px-3 py-2 border-2 border-black bg-white hover:bg-gray-100 text-black"
                                    title="Apply as Volunteer"
                                >
                                    <Hand size={16} />
                                </button>
                             )
                         )}
                    </div>
                )}
            </div>
        </div>
    );
};

// ... ProfileView, StudentClubDetail, StudentMediaView, StudentDashboard, CollegeAdminDashboard same as before ... 
// (We only include full content if changing, but here I am providing full content to ensure integrity)

const ProfileView = ({ user, onLogout, onEdit }: { user: User, onLogout: () => void, onEdit: () => void }) => {
  const [certs, setCerts] = useState<Event[]>([]);
  const [certViewer, setCertViewer] = useState<Event | null>(null);

  useEffect(() => {
      const fetchCerts = async () => {
          const allEvents = await api.events.list();
          const myRegs = await api.auth.getRegistrations(user.id);
          const myCerts = allEvents.filter(e => 
              myRegs.includes(e.id) && 
              e.certificatesIssued && 
              e.status === EventStatus.COMPLETED
          );
          setCerts(myCerts);
      };
      fetchCerts();
  }, [user.id]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
       <div className="bg-white border-2 border-black p-6 text-center relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-24 bg-yellow-400 -z-10"></div>
          <div className="w-32 h-32 mx-auto bg-gray-200 rounded-full border-4 border-white shadow-lg overflow-hidden mb-4 relative z-10">
             <img src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} className="w-full h-full object-cover" />
          </div>
          <h2 className="text-2xl font-black uppercase text-black">{user.name}</h2>
          <p className="text-gray-500 font-bold text-sm mb-4">{user.email}</p>
          
          <div className="flex justify-center gap-2 mb-6">
             <span className="bg-black text-white px-3 py-1 text-xs font-bold uppercase rounded-full">{user.role}</span>
             {user.year && <span className="bg-gray-100 text-black px-3 py-1 text-xs font-bold uppercase rounded-full">{user.year}</span>}
             {user.branch && <span className="bg-gray-100 text-black px-3 py-1 text-xs font-bold uppercase rounded-full">{user.branch}</span>}
          </div>

          <div className="space-y-3">
            <button onClick={onEdit} className="w-full border-2 border-black py-2 font-bold uppercase hover:bg-gray-50 text-black">Edit Profile</button>
            <button onClick={onLogout} className="w-full bg-red-500 text-white py-2 font-bold uppercase hover:bg-red-600 border-2 border-red-600">Logout</button>
          </div>
       </div>

       {user.role === UserRole.STUDENT && (
           <div className="bg-white border-2 border-black p-6">
               <h3 className="text-xl font-black uppercase mb-4 flex items-center gap-2 text-black"><Award size={24} className="text-yellow-400" /> My Certificates</h3>
               {certs.length === 0 ? (
                   <p className="text-gray-400 italic text-sm">No certificates earned yet.</p>
               ) : (
                   <div className="grid grid-cols-1 gap-3">
                       {certs.map(event => (
                           <div key={event.id} className="border border-gray-200 p-4 flex justify-between items-center bg-gray-50">
                               <div>
                                   <p className="font-bold text-black">{event.title}</p>
                                   <p className="text-xs text-gray-500">{event.date}</p>
                               </div>
                               <button 
                                  onClick={() => setCertViewer(event)}
                                  className="text-xs font-bold uppercase underline text-black hover:text-yellow-600"
                               >
                                   View
                               </button>
                           </div>
                       ))}
                   </div>
               )}
           </div>
       )}
       <CertificateModal isOpen={!!certViewer} onClose={() => setCertViewer(null)} event={certViewer} user={user} />
    </div>
  )
}

// ... StudentClubDetail ...
// (Omitting StudentClubDetail, StudentMediaView, StudentDashboard, CollegeAdminDashboard to focus on relevant ClubAdminDashboard change)
// Assuming full file replacement, including them is safer.

const StudentClubDetail = ({ club, onBack, user, onUpdateUser, readOnly = false, onEventClick }: { club: Club, onBack: () => void, user: User, onUpdateUser: (u: User) => void, readOnly?: boolean, onEventClick?: (e: Event) => void }) => {
    // ... (same as before)
    const [activeTab, setActiveTab] = useState<'overview' | 'discussion'>('overview');
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [media, setMedia] = useState<MediaPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingJoin, setLoadingJoin] = useState(false);
    const [posts, setPosts] = useState<Post[]>([]);
    const [newPostContent, setNewPostContent] = useState('');
    const [loadingPost, setLoadingPost] = useState(false);
    const [commentingPostId, setCommentingPostId] = useState<string | null>(null);
    const [newComment, setNewComment] = useState('');
    const isMember = (user.joinedClubIds || []).includes(club.id);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const [anns, evs, meds] = await Promise.all([
                    api.announcements.list(club.id),
                    api.events.list(club.id),
                    api.media.list(club.id)
                ]);
                setAnnouncements(anns);
                setEvents(evs);
                setMedia(meds);
                if (isMember) {
                    const clubPosts = await api.posts.list(club.id);
                    setPosts(clubPosts);
                }
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [club.id, isMember]);

    const handleJoinToggle = async () => {
        const wasMember = isMember;
        const newJoinedIds = wasMember
            ? (user.joinedClubIds || []).filter(id => id !== club.id)
            : [...(user.joinedClubIds || []), club.id];
        const optimisticUser = { ...user, joinedClubIds: newJoinedIds };
        onUpdateUser(optimisticUser);
        setLoadingJoin(true);
        try {
            let updatedUser;
            if (wasMember) {
                updatedUser = await api.clubs.leave(club.id, user.id);
            } else {
                updatedUser = await api.clubs.join(club.id, user.id);
            }
            onUpdateUser(updatedUser);
        } catch (e: any) {
            onUpdateUser(user);
            alert(e.message);
        } finally {
            setLoadingJoin(false);
        }
    };

    const handleCreatePost = async () => {
        if (!newPostContent.trim()) return;
        const tempId = `temp-${Date.now()}`;
        const newPost: Post = {
            id: tempId,
            clubId: club.id,
            userId: user.id,
            userName: user.name,
            userAvatar: user.avatar || '',
            content: newPostContent,
            timestamp: new Date().toISOString(),
            likedBy: [],
            comments: []
        };
        setPosts([newPost, ...posts]);
        setNewPostContent('');
        try {
            const postToCreate = { ...newPost, id: `p${Date.now()}` }; 
            await api.posts.create(postToCreate);
            setPosts(current => current.map(p => p.id === tempId ? postToCreate : p));
        } catch (e: any) {
            setPosts(current => current.filter(p => p.id !== tempId));
            alert("Failed to create post");
        }
    };

    const handleLikePost = async (post: Post) => {
        const isLiked = post.likedBy.includes(user.id);
        const newLikedBy = isLiked ? post.likedBy.filter(id => id !== user.id) : [...post.likedBy, user.id];
        setPosts(posts.map(p => p.id === post.id ? { ...p, likedBy: newLikedBy } : p));
        await api.posts.like(post.id, user.id);
    };

    const handleAddComment = async (postId: string) => {
        if (!newComment.trim()) return;
        const comment: Comment = {
            id: `c${Date.now()}`,
            userId: user.id,
            userName: user.name,
            text: newComment,
            timestamp: new Date().toISOString()
        };
        setPosts(posts.map(p => p.id === postId ? { ...p, comments: [...p.comments, comment] } : p));
        setNewComment('');
        setCommentingPostId(null);
        await api.posts.comment(postId, comment);
    };

    if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin" size={32}/></div>;

    return (
        <div className="animate-in fade-in slide-in-from-right duration-300">
             <button onClick={onBack} className="mb-4 flex items-center gap-2 text-sm font-bold hover:text-yellow-500 transition-colors text-black">
                <ArrowLeft size={16} /> Back to Clubs
             </button>
             <div className="bg-white border-2 border-black overflow-hidden mb-6">
                 <div className="h-32 bg-gray-200 relative">
                     <img src={club.banner} className="w-full h-full object-cover grayscale opacity-50" />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                 </div>
                 <div className="px-6 pb-6 pt-0 relative text-black">
                     <div className="flex justify-between items-end -mt-8 mb-4">
                         <img src={club.logo} className="w-20 h-20 border-2 border-black bg-white object-cover" />
                         {!readOnly && (
                             <button onClick={handleJoinToggle} className={`px-6 py-2 text-xs font-bold uppercase tracking-widest flex items-center gap-2 border-2 transition-colors ${isMember ? 'bg-white border-black text-black hover:bg-gray-100' : 'bg-black text-white border-black hover:bg-gray-800'}`}>
                                {loadingJoin ? <Loader2 className="animate-spin" size={14}/> : (isMember ? 'Leave Club' : 'Join Club')}
                             </button>
                         )}
                         {readOnly && (
                             <div className="bg-black text-white px-4 py-2 text-xs font-bold uppercase">
                                 {club.memberCount} Members
                             </div>
                         )}
                     </div>
                     <h2 className="text-3xl font-black uppercase mb-1">{club.name}</h2>
                     <p className="text-gray-600 font-medium">{club.description}</p>
                 </div>
             </div>
             <div className="flex border-b-2 border-gray-200 mb-6">
                <button onClick={() => setActiveTab('overview')} className={`flex-1 py-3 text-sm font-bold uppercase tracking-widest border-b-4 transition-colors ${activeTab === 'overview' ? 'border-yellow-400 text-black' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                    <div className="flex items-center justify-center gap-2"><LayoutGrid size={16} /> Overview</div>
                </button>
                {!readOnly && (
                    <button onClick={() => setActiveTab('discussion')} className={`flex-1 py-3 text-sm font-bold uppercase tracking-widest border-b-4 transition-colors ${activeTab === 'discussion' ? 'border-yellow-400 text-black' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                        <div className="flex items-center justify-center gap-2"><MessageSquare size={16} /> Discussion</div>
                    </button>
                )}
             </div>
             {activeTab === 'overview' && (
                 <div className="space-y-8 animate-in fade-in duration-300">
                     <div>
                         <h3 className="text-xl font-black uppercase mb-4 flex items-center gap-2 border-b-2 border-gray-100 pb-2 text-black"><Megaphone size={20}/> Announcements</h3>
                         {announcements.length === 0 ? <p className="text-gray-400 italic">No announcements.</p> : (
                             <div className="space-y-2">
                                 {announcements.map(a => (
                                     <div key={a.id} className="bg-yellow-50 p-3 border-l-4 border-yellow-400 text-black">
                                         <p className="font-medium">{a.content}</p>
                                         <p className="text-xs text-gray-400 mt-1">{new Date(a.date).toLocaleDateString()}</p>
                                     </div>
                                 ))}
                             </div>
                         )}
                     </div>
                     <div>
                         <h3 className="text-xl font-black uppercase mb-4 flex items-center gap-2 border-b-2 border-gray-100 pb-2 text-black"><Calendar size={20}/> Upcoming Events</h3>
                         <div className="grid grid-cols-1 gap-4">
                            {events.length === 0 ? <p className="text-gray-400 italic">No upcoming events.</p> : (
                                events.map(event => (
                                    <EventCard key={event.id} event={event} isAdminView={false} venueName={event.venueId} onClick={() => onEventClick?.(event)} />
                                ))
                            )}
                         </div>
                     </div>
                      <div>
                         <h3 className="text-xl font-black uppercase mb-4 flex items-center gap-2 border-b-2 border-gray-100 pb-2 text-black"><ImageIcon size={20}/> Club Gallery</h3>
                         <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                             {media.length === 0 ? <p className="text-gray-400 italic col-span-2">No photos yet.</p> : (
                                 media.map(m => (
                                     <div key={m.id} className="aspect-square bg-gray-100 border border-gray-200 relative group overflow-hidden">
                                         <img src={m.imageUrl} className="w-full h-full object-cover" />
                                         <div className="absolute inset-0 bg-black/60 flex items-end p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                             <p className="text-white text-xs truncate">{m.caption}</p>
                                         </div>
                                     </div>
                                 ))
                             )}
                         </div>
                      </div>
                 </div>
             )}
             {activeTab === 'discussion' && (
                 <div className="animate-in fade-in duration-300">
                     {isMember ? (
                         <div className="space-y-6">
                             <div className="bg-gray-50 p-4 border border-gray-200">
                                 <textarea className="w-full p-3 border border-gray-300 focus:outline-none focus:border-black mb-3 text-sm" rows={2} placeholder="Start a discussion..." value={newPostContent} onChange={e => setNewPostContent(e.target.value)} />
                                 <div className="flex justify-end">
                                     <button onClick={handleCreatePost} disabled={loadingPost} className="bg-black text-white px-4 py-2 text-xs font-bold uppercase tracking-wide hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2">
                                         {loadingPost ? <Loader2 className="animate-spin" size={14}/> : <><Send size={14} /> Post</>}
                                     </button>
                                 </div>
                             </div>
                             <div className="space-y-4">
                                 {posts.length === 0 && <p className="text-gray-400 italic text-center">No discussions yet. Be the first!</p>}
                                 {posts.map(post => {
                                     const isLiked = post.likedBy.includes(user.id);
                                     return (
                                         <div key={post.id} className="bg-white border-2 border-black p-4 text-black">
                                             <div className="flex items-center gap-3 mb-3">
                                                 <img src={post.userAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${post.userName}`} className="w-8 h-8 rounded-full bg-gray-200" />
                                                 <div>
                                                     <p className="font-bold text-sm leading-none">{post.userName}</p>
                                                     <p className="text-[10px] text-gray-400">{new Date(post.timestamp).toLocaleDateString()}</p>
                                                 </div>
                                             </div>
                                             <p className="text-sm mb-4">{post.content}</p>
                                             <div className="flex items-center gap-4 border-t border-gray-100 pt-2">
                                                 <button onClick={() => handleLikePost(post)} className={`flex items-center gap-1 text-xs font-bold transition-colors ${isLiked ? 'text-blue-600' : 'text-gray-500 hover:text-black'}`}>
                                                     <ThumbsUp size={14} fill={isLiked ? "currentColor" : "none"}/> {post.likedBy.length} Likes
                                                 </button>
                                                 <button onClick={() => setCommentingPostId(commentingPostId === post.id ? null : post.id)} className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-black transition-colors">
                                                     <MessageSquare size={14} /> {post.comments.length} Comments
                                                 </button>
                                             </div>
                                             {commentingPostId === post.id && (
                                                 <div className="mt-3 pt-3 border-t border-dashed border-gray-200">
                                                     <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
                                                         {post.comments.map(c => (
                                                             <div key={c.id} className="text-xs bg-gray-50 p-2 text-black">
                                                                 <span className="font-bold">{c.userName}: </span>
                                                                 <span>{c.text}</span>
                                                             </div>
                                                         ))}
                                                     </div>
                                                     <div className="flex gap-2">
                                                         <input type="text" className="flex-1 border border-gray-300 p-2 text-xs focus:outline-none focus:border-black" placeholder="Write a comment..." value={newComment} onChange={e => setNewComment(e.target.value)} />
                                                         <button onClick={() => handleAddComment(post.id)} className="bg-black text-white px-3 py-1 text-xs font-bold uppercase">Reply</button>
                                                     </div>
                                                 </div>
                                             )}
                                         </div>
                                     );
                                 })}
                             </div>
                         </div>
                     ) : (
                         <div className="bg-gray-100 border-2 border-dashed border-gray-300 p-8 text-center">
                             <Lock className="mx-auto mb-2 text-gray-400" size={32} />
                             <p className="font-bold text-gray-500">Join the club to view and participate in discussions.</p>
                         </div>
                     )}
                 </div>
             )}
        </div>
    );
};

const StudentMediaView = ({ user }: { user: User }) => {
    const [media, setMedia] = useState<MediaPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState("");
    const [activeCommentId, setActiveCommentId] = useState<string | null>(null);

    useEffect(() => {
        api.media.list().then(m => {
            setMedia(m.reverse()); // Newest first
            setLoading(false);
        });
    }, []);

    const handleLike = async (m: MediaPost) => {
        const isLiked = m.likedBy.includes(user.id);
        const newLikedBy = isLiked ? m.likedBy.filter(id => id !== user.id) : [...m.likedBy, user.id];
        setMedia(media.map(item => item.id === m.id ? { ...item, likedBy: newLikedBy } : item));
        
        await api.media.like(m.id, user.id);
    };

    const handleComment = async (m: MediaPost) => {
        if (!newComment.trim()) return;
        const comment: Comment = {
            id: `c${Date.now()}`,
            userId: user.id,
            userName: user.name,
            text: newComment,
            timestamp: new Date().toISOString()
        };
        setMedia(media.map(item => item.id === m.id ? { ...item, comments: [...item.comments, comment] } : item));
        setNewComment("");
        setActiveCommentId(null);
        await api.media.comment(m.id, comment);
    };

    const handleShare = (m: MediaPost) => {
        const shareData = {
            title: m.caption,
            text: `Check out this photo from Clix!`,
            url: window.location.href 
        };
        if (navigator.share) {
            navigator.share(shareData).catch(console.error);
        } else {
            alert(`Link copied to clipboard: ${window.location.href}`);
        }
    };

    if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin" size={32}/></div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-500">
            {media.map(item => {
                const isLiked = item.likedBy.includes(user.id);
                return (
                    <div key={item.id} className="bg-white border-2 border-black shadow-[8px_8px_0px_#000] text-black">
                        <div className="relative">
                            <img src={item.imageUrl} className="w-full h-64 object-cover border-b-2 border-black" />
                            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 border border-black text-xs font-bold uppercase">
                                {item.caption}
                            </div>
                        </div>
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex gap-4">
                                    <button onClick={() => handleLike(item)} className={`flex items-center gap-1 font-bold ${isLiked ? 'text-red-500' : 'text-gray-500 hover:text-black'}`}>
                                        <Heart size={20} fill={isLiked ? "currentColor" : "none"} /> {item.likedBy.length}
                                    </button>
                                    <button onClick={() => setActiveCommentId(activeCommentId === item.id ? null : item.id)} className="flex items-center gap-1 font-bold text-gray-500 hover:text-black">
                                        <MessageSquare size={20} /> {item.comments.length}
                                    </button>
                                </div>
                                <button onClick={() => handleShare(item)} className="text-gray-500 hover:text-black"><Share2 size={20} /></button>
                            </div>
                            
                            {activeCommentId === item.id && (
                                <div className="mt-4 border-t border-gray-100 pt-4 animate-in slide-in-from-top-2">
                                    <div className="max-h-40 overflow-y-auto space-y-2 mb-3">
                                        {item.comments.map(c => (
                                            <div key={c.id} className="text-xs">
                                                <span className="font-bold">{c.userName}</span> <span className="text-gray-600">{c.text}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            placeholder="Add a comment..."
                                            className="flex-1 border border-black p-2 text-xs font-bold focus:outline-none"
                                            value={newComment}
                                            onChange={e => setNewComment(e.target.value)}
                                        />
                                        <button onClick={() => handleComment(item)} className="bg-black text-white px-3 font-bold uppercase text-xs">Post</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
            {media.length === 0 && <div className="col-span-2 text-center py-10 text-gray-400">No media posts yet.</div>}
        </div>
    );
};

const StudentDashboard = ({ user, activeTab, onLogout }: { user: User, activeTab: string, onLogout: () => void }) => {
    // ... (StudentDashboard implementation same as before)
    const [events, setEvents] = useState<Event[]>([]);
    const [clubs, setClubs] = useState<Club[]>([]);
    const [venues, setVenues] = useState<Venue[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [showPayment, setShowPayment] = useState(false);
    const [showTicket, setShowTicket] = useState(false);
    const [myTickets, setMyTickets] = useState<string[]>([]);
    const [viewingClub, setViewingClub] = useState<Club | null>(null);
    const [userVol, setUserVol] = useState<VolunteerApplication[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [showProfileEdit, setShowProfileEdit] = useState(false);
    const [currentUser, setCurrentUser] = useState(user);
    const [feedbackEvent, setFeedbackEvent] = useState<Event | null>(null);

    useEffect(() => {
        api.events.list().then(setEvents);
        api.clubs.list().then(setClubs);
        api.venues.list().then(setVenues);
        api.auth.getRegistrations(user.id).then(setMyTickets);
        api.volunteers.listByUser(user.id).then(setUserVol);
    }, [user.id]);

    const handleRegister = (event: Event) => {
        setSelectedEvent(event);
        if (event.price > 0) {
            setShowPayment(true);
        } else {
            confirmRegistration(event);
        }
    };

    const confirmRegistration = async (event: Event) => {
        try {
            await api.events.register(event.id, user.id);
            setMyTickets([...myTickets, event.id]);
            setEvents(events.map(e => e.id === event.id ? {...e, registeredCount: e.registeredCount + 1} : e));
            alert("Successfully Registered!");
            setShowPayment(false);
            setShowTicket(true);
        } catch (e) {
            alert("Registration failed: " + (e as Error).message);
        }
    };

    const handleVolunteer = async (eventId: string) => {
        try {
            await api.volunteers.apply({
                id: `v${Date.now()}`,
                eventId,
                userId: user.id,
                userName: user.name,
                userAvatar: user.avatar,
                status: VolunteerStatus.PENDING,
                appliedAt: new Date().toISOString()
            });
            alert("Application Submitted!");
        } catch (e: any) { alert(e.message); }
    };

    const handleUpdateProfile = async (data: Partial<User>) => {
        try {
            const updatedUser = { ...currentUser, ...data };
            await api.auth.updateProfile(updatedUser);
            setCurrentUser(updatedUser);
            setShowProfileEdit(false);
        } catch(e) {
            alert("Failed to update profile");
        }
    };

    const handleFeedbackSubmit = async (rating: number, comment: string) => {
        if (!feedbackEvent) return;
        await api.events.addFeedback(feedbackEvent.id, { userId: user.id, rating, comment });
        setFeedbackEvent(null);
        alert("Feedback Submitted!");
    };

    const getVenueName = (id: string) => venues.find(v => v.id === id)?.name || id;

    if (viewingClub) {
        return <StudentClubDetail club={viewingClub} onBack={() => setViewingClub(null)} user={currentUser} onUpdateUser={setCurrentUser} />;
    }

    const filteredEvents = events.filter(e => e.status === EventStatus.APPROVED && e.title.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="space-y-6">
            {activeTab === 'feed' && (
                <div className="space-y-6">
                     <div className="flex justify-between items-end text-black">
                         <h2 className="text-3xl font-black uppercase italic tracking-tighter">Whats <br/><span className="text-yellow-400">On?</span></h2>
                         <div className="flex gap-2">
                             <div className="relative">
                                 <Search className="absolute left-2 top-2.5 text-gray-400" size={16} />
                                 <input 
                                    type="text" 
                                    placeholder="Search events..." 
                                    className="pl-8 pr-4 py-2 border-2 border-black focus:outline-none text-xs font-bold w-40"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                 />
                             </div>
                             <button className="bg-black text-white p-2 border-2 border-black hover:bg-gray-800 transition-colors"><Filter size={20} /></button>
                         </div>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         {filteredEvents.map(event => (
                             <EventCard 
                                key={event.id} 
                                event={event} 
                                onRegister={() => handleRegister(event)} 
                                isRegistered={myTickets.includes(event.id)}
                                onVolunteer={handleVolunteer}
                                volunteerStatus={userVol.find(v => v.eventId === event.id)?.status}
                                venueName={getVenueName(event.venueId)}
                             />
                         ))}
                     </div>
                </div>
            )}
            
            {activeTab === 'clubs' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {clubs.map(club => (
                        <div key={club.id} className="bg-white border-2 border-black p-4 flex gap-4 text-black">
                            <img src={club.logo} className="w-16 h-16 rounded-full border border-gray-300 object-cover" />
                            <div>
                                <h3 className="font-bold uppercase text-lg">{club.name}</h3>
                                <p className="text-xs text-gray-500 line-clamp-2 mb-2">{club.description}</p>
                                <button onClick={() => setViewingClub(club)} className="text-xs font-bold underline hover:text-yellow-600">View Details</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'media' && <StudentMediaView user={currentUser} />}

            {activeTab === 'tickets' && (
                <div className="grid grid-cols-1 gap-4">
                    {events.filter(e => myTickets.includes(e.id)).map(event => (
                        <div key={event.id} className="bg-white border-2 border-black p-4 flex justify-between items-center text-black">
                            <div>
                                <h3 className="font-bold">{event.title}</h3>
                                <p className="text-xs text-gray-500">{event.date} • {getVenueName(event.venueId)}</p>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setFeedbackEvent(event); }}
                                    className="bg-yellow-400 text-black px-3 py-1 font-bold text-xs uppercase border border-black hover:bg-yellow-500"
                                >
                                    Rate
                                </button>
                                <button 
                                    onClick={() => { setSelectedEvent(event); setShowTicket(true); }}
                                    className="bg-black text-white px-3 py-1 font-bold text-xs uppercase hover:bg-gray-800"
                                >
                                    View Ticket
                                </button>
                            </div>
                        </div>
                    ))}
                    {myTickets.length === 0 && <p className="text-gray-500 italic">No tickets yet.</p>}
                </div>
            )}

            {activeTab === 'profile' && (
                <ProfileView user={currentUser} onEdit={() => setShowProfileEdit(true)} onLogout={onLogout} />
            )}

            <PaymentModal isOpen={showPayment} onClose={() => setShowPayment(false)} event={selectedEvent} onConfirm={() => selectedEvent && confirmRegistration(selectedEvent)} />
            <TicketQRModal isOpen={showTicket} onClose={() => setShowTicket(false)} event={selectedEvent} user={currentUser} />
            <EditProfileModal isOpen={showProfileEdit} onClose={() => setShowProfileEdit(false)} user={currentUser} onUpdate={handleUpdateProfile} />
            <FeedbackModal isOpen={!!feedbackEvent} onClose={() => setFeedbackEvent(null)} event={feedbackEvent} onSubmit={handleFeedbackSubmit} />
        </div>
    );
};

const CollegeAdminDashboard = ({ user, activeTab, onLogout }: { user: User, activeTab: string, onLogout: () => void }) => {
    // ... (CollegeAdminDashboard same as before)
    const [events, setEvents] = useState<Event[]>([]);
    const [clubs, setClubs] = useState<Club[]>([]);
    const [viewingClub, setViewingClub] = useState<Club | null>(null);
    const [showProfileEdit, setShowProfileEdit] = useState(false);
    const [currentUser, setCurrentUser] = useState(user);
    const [isCreateClubOpen, setIsCreateClubOpen] = useState(false);
    const [isEditClubOpen, setIsEditClubOpen] = useState(false);
    const [editingClubId, setEditingClubId] = useState<string | null>(null);
    const [clubForm, setClubForm] = useState({ name: '', description: '', logo: '', banner: '' });
    const [adminForm, setAdminForm] = useState({ id: '', name: '', email: '', password: '' });
    const [viewingEvent, setViewingEvent] = useState<Event | null>(null);
    const [manageVolunteers, setManageVolunteers] = useState<VolunteerApplication[]>([]);
    const [manageRegisteredUsers, setManageRegisteredUsers] = useState<User[]>([]);

    useEffect(() => {
        api.events.list().then(setEvents);
        api.clubs.list().then(setClubs);
    }, []);

    const pendingEvents = events.filter(e => e.status === EventStatus.PENDING);

    const handleApprove = async (id: string) => {
        await api.events.updateStatus(id, EventStatus.APPROVED);
        setEvents(events.map(e => e.id === id ? { ...e, status: EventStatus.APPROVED } : e));
    };

    const handleReject = async (id: string) => {
        await api.events.updateStatus(id, EventStatus.REJECTED, "Does not meet criteria");
        setEvents(events.map(e => e.id === id ? { ...e, status: EventStatus.REJECTED } : e));
    };

    const handleUpdateProfile = async (data: Partial<User>) => {
        try {
            const updatedUser = { ...currentUser, ...data };
            await api.auth.updateProfile(updatedUser);
            setCurrentUser(updatedUser);
            setShowProfileEdit(false);
        } catch(e) {
            alert("Failed to update profile");
        }
    };

    const handleCreateClub = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const adminId = `u${Date.now()}`;
            const adminUser: User = {
                id: adminId,
                name: adminForm.name,
                email: adminForm.email,
                role: UserRole.CLUB_ADMIN,
                joinDate: new Date().toISOString(),
            };
            await api.admin.createUser(adminUser);

            const clubId = `c${Date.now()}`;
            const clubData: Club = {
                id: clubId,
                ...clubForm,
                adminId: adminId,
                memberCount: 0
            };
            await api.admin.createClub(clubData);
            await api.auth.updateProfile({ ...adminUser, clubId: clubId });

            setClubs([...clubs, clubData]);
            setIsCreateClubOpen(false);
            setClubForm({ name: '', description: '', logo: '', banner: '' });
            setAdminForm({ id: '', name: '', email: '', password: '' });
            alert("Club and Admin created successfully!");
        } catch(e: any) {
            alert("Error creating club: " + e.message);
        }
    };

    const handleEditClubSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!editingClubId) return;
        try {
            const updatedClub: Club = {
                id: editingClubId,
                ...clubForm,
                adminId: adminForm.id,
                memberCount: clubs.find(c => c.id === editingClubId)?.memberCount || 0
            };
            await api.admin.updateClub(updatedClub);
            if(adminForm.id) {
                await api.admin.updateUser({
                    id: adminForm.id,
                    name: adminForm.name,
                    email: adminForm.email
                });
            }
            setClubs(clubs.map(c => c.id === editingClubId ? updatedClub : c));
            setIsEditClubOpen(false);
            alert("Club updated!");
        } catch(e: any) {
            alert("Error updating: " + e.message);
        }
    };

    const openEditClubModal = async (club: Club) => {
        setEditingClubId(club.id);
        setClubForm({ name: club.name, description: club.description, logo: club.logo, banner: club.banner });
        setAdminForm({ id: club.adminId, name: 'Current Admin', email: 'admin@test.com', password: '' }); 
        setIsEditClubOpen(true);
    };

    const handleEventClick = async (event: Event) => {
        setViewingEvent(event);
        const [vols, users] = await Promise.all([
            api.volunteers.listByEvent(event.id),
            api.events.getRegisteredUsers(event.id)
        ]);
        setManageVolunteers(vols);
        setManageRegisteredUsers(users);
    };

    if (viewingClub) {
        return <StudentClubDetail club={viewingClub} onBack={() => setViewingClub(null)} user={currentUser} onUpdateUser={() => {}} readOnly={true} onEventClick={handleEventClick} />;
    }

    const clubStats = clubs.map(c => {
        const clubEvents = events.filter(e => e.clubId === c.id);
        const registrations = clubEvents.reduce((acc, e) => acc + e.registeredCount, 0);
        return { name: c.name, registrations };
    });

    return (
        <div className="space-y-6">
            {activeTab === 'approvals' && (
                <div className="space-y-4">
                    <h2 className="text-2xl font-black uppercase text-black">Pending Approvals</h2>
                    {pendingEvents.length === 0 ? <p className="text-gray-500">No pending events.</p> : 
                        pendingEvents.map(event => (
                            <div key={event.id} className="bg-white border-l-4 border-yellow-400 p-4 shadow-sm flex justify-between items-center text-black">
                                <div>
                                    <h3 className="font-bold text-lg">{event.title}</h3>
                                    <p className="text-xs text-gray-500">{event.organizer} • {event.date}</p>
                                    <p className="text-sm mt-1">{event.description}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleApprove(event.id)} className="bg-black text-white px-3 py-1 font-bold text-xs uppercase hover:bg-gray-800">Approve</button>
                                    <button onClick={() => handleReject(event.id)} className="border-2 border-black text-black px-3 py-1 font-bold text-xs uppercase hover:bg-gray-100">Reject</button>
                                </div>
                            </div>
                        ))
                    }
                </div>
            )}

            {activeTab === 'clubs_manage' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-black uppercase text-black">Manage Clubs</h2>
                        <button 
                            onClick={() => {
                                setEditingClubId(null);
                                setClubForm({ name: '', description: '', logo: '', banner: '' });
                                setAdminForm({ id: '', name: '', email: '', password: '' });
                                setIsCreateClubOpen(true);
                            }}
                            className="bg-black text-white px-4 py-2 font-bold uppercase text-xs flex items-center gap-2 hover:bg-gray-800"
                        >
                            <Plus size={16} /> Create Club
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {clubs.map(club => (
                            <div key={club.id} className="bg-white border-2 border-black p-4 flex gap-4 cursor-pointer hover:bg-gray-50 transition-colors text-black relative group" onClick={() => setViewingClub(club)}>
                                <img src={club.logo} className="w-16 h-16 rounded-full border border-gray-300 object-cover" />
                                <div className="flex-1">
                                    <h3 className="font-bold uppercase text-lg">{club.name}</h3>
                                    <p className="text-xs text-gray-500 line-clamp-2 mb-2">{club.description}</p>
                                    <span className="text-xs font-bold underline text-yellow-600">View Details</span>
                                </div>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); openEditClubModal(club); }}
                                    className="absolute top-2 right-2 p-2 bg-gray-100 hover:bg-yellow-400 hover:text-black rounded-full z-10"
                                >
                                    <PenSquare size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {activeTab === 'reports' && (
                <div className="space-y-6">
                    <div className="bg-white p-6 border-2 border-black">
                        <h3 className="text-lg font-black uppercase text-black mb-4">Club Performance</h3>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={clubStats}>
                                    <XAxis dataKey="name" stroke="#000" fontSize={10} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#000" fontSize={10} tickLine={false} axisLine={false} />
                                    <Tooltip cursor={{fill: '#fefce8'}} contentStyle={{ background: '#000', color: '#fff', border: 'none', fontWeight: 'bold' }} />
                                    <Bar dataKey="registrations" fill="#FACC15" radius={[0, 0, 0, 0]} barSize={40} stroke="#000" strokeWidth={2} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'profile' && (
                <ProfileView user={currentUser} onEdit={() => setShowProfileEdit(true)} onLogout={onLogout} />
            )}

            <EditProfileModal isOpen={showProfileEdit} onClose={() => setShowProfileEdit(false)} user={currentUser} onUpdate={handleUpdateProfile} />
            
            <Modal isOpen={isCreateClubOpen || isEditClubOpen} onClose={() => { setIsCreateClubOpen(false); setIsEditClubOpen(false); }} title={isEditClubOpen ? "Edit Club" : "Create New Club"}>
                <form onSubmit={isEditClubOpen ? handleEditClubSubmit : handleCreateClub} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Club Name</label>
                        <input className="w-full p-2 border-2 border-gray-200 text-black" required value={clubForm.name} onChange={e => setClubForm({...clubForm, name: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Description</label>
                        <textarea className="w-full p-2 border-2 border-gray-200 text-black" rows={3} required value={clubForm.description} onChange={e => setClubForm({...clubForm, description: e.target.value})} />
                    </div>
                    <ImageUpload label="Club Logo" currentImage={clubForm.logo} onImageSelected={b64 => setClubForm({...clubForm, logo: b64})} />
                    <ImageUpload label="Club Banner" currentImage={clubForm.banner} onImageSelected={b64 => setClubForm({...clubForm, banner: b64})} />
                    
                    <div className="border-t border-gray-200 pt-4 mt-4">
                        <h4 className="font-black text-sm uppercase mb-2">Club Admin Details</h4>
                        <div className="space-y-3">
                            <input className="w-full p-2 border-2 border-gray-200 text-black" placeholder="Admin Name" required value={adminForm.name} onChange={e => setAdminForm({...adminForm, name: e.target.value})} />
                            <input className="w-full p-2 border-2 border-gray-200 text-black" placeholder="Admin Email" type="email" required value={adminForm.email} onChange={e => setAdminForm({...adminForm, email: e.target.value})} />
                            {!isEditClubOpen && (
                                <input className="w-full p-2 border-2 border-gray-200 text-black" placeholder="Admin Password" type="password" required value={adminForm.password} onChange={e => setAdminForm({...adminForm, password: e.target.value})} />
                            )}
                        </div>
                    </div>
                    <button className="w-full bg-black text-white py-3 font-bold uppercase hover:bg-gray-800 mt-4">
                        {isEditClubOpen ? 'Update Club' : 'Create Club & Admin'}
                    </button>
                </form>
            </Modal>

            <EventManagementModal 
                isOpen={!!viewingEvent} 
                onClose={() => setViewingEvent(null)}
                event={viewingEvent}
                volunteers={manageVolunteers}
                registeredUsers={manageRegisteredUsers}
                onUpdateVolunteerStatus={() => {}} 
            />
        </div>
    );
};

const ClubAdminDashboard = ({ user, refreshData, activeTab, onLogout }: { user: User, refreshData: () => void, activeTab: string, onLogout: () => void }) => {
    // ... (Most of ClubAdminDashboard remains, focused on Modal changes)
    const [events, setEvents] = useState<Event[]>([]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [announcementText, setAnnouncementText] = useState('');
    const [mediaList, setMediaList] = useState<MediaPost[]>([]);
    const [isPosting, setIsPosting] = useState(false);
    const [clubMembers, setClubMembers] = useState<User[]>([]);
    const [clubInfo, setClubInfo] = useState<Club | null>(null);
    const [showProfileEdit, setShowProfileEdit] = useState(false);
    const [currentUser, setCurrentUser] = useState(user);
    const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
    const [proposalTopic, setProposalTopic] = useState('');
    const [generatedDesc, setGeneratedDesc] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [newProposal, setNewProposal] = useState<Partial<Event>>({
      title: '', description: '', date: '', time: '', venueId: '', capacity: 0, price: 0, volunteersNeeded: false, image: ''
    });
    const [venues, setVenues] = useState<Venue[]>([]);
    const [editingEventId, setEditingEventId] = useState<string | null>(null);
    const [mediaEventId, setMediaEventId] = useState('');
    const [mediaUrl, setMediaUrl] = useState('');
    const [mediaCaption, setMediaCaption] = useState('');
    const [posterEvent, setPosterEvent] = useState<Event | null>(null);
    const [winners, setWinners] = useState<Winner[]>([
        { rank: 1, name: '', photo: '' },
        { rank: 2, name: '', photo: '' },
        { rank: 3, name: '', photo: '' }
    ]);
    const [generatedPoster, setGeneratedPoster] = useState(false);
    const [aiPosterImage, setAiPosterImage] = useState<string | null>(null);
    const [generatingPoster, setGeneratingPoster] = useState(false);
    const [manageEvent, setManageEvent] = useState<Event | null>(null);
    const [manageVolunteers, setManageVolunteers] = useState<VolunteerApplication[]>([]);
    const [manageRegisteredUsers, setManageRegisteredUsers] = useState<User[]>([]);
    const [certDesignEvent, setCertDesignEvent] = useState<Event | null>(null);
    const [certDesignImage, setCertDesignImage] = useState<string | null>(null);
    const [generatingCert, setGeneratingCert] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            const allEvents = await api.events.list();
            setEvents(allEvents);
            const allVenues = await api.venues.list();
            setVenues(allVenues);
            if (user.clubId) {
                const anns = await api.announcements.list(user.clubId);
                setAnnouncements(anns);
                const allMedia = await api.media.list();
                setMediaList(allMedia.filter(x => x.clubId === user.clubId));
                const members = await api.clubs.getMembers(user.clubId);
                setClubMembers(members);
                const allClubs = await api.clubs.list();
                const myClub = allClubs.find(c => c.id === user.clubId);
                if (myClub) setClubInfo(myClub);
            }
        };
        fetchData();
    }, [user.clubId]);

    const handleAddAnnouncement = async () => {
        if(!user.clubId || !announcementText.trim()) return;
        setIsPosting(true);
        try {
            const ann: Announcement = {
                id: `a${Date.now()}`,
                clubId: user.clubId,
                content: announcementText,
                date: new Date().toISOString()
            };
            await api.announcements.create(ann);
            setAnnouncements([ann, ...announcements]);
            setAnnouncementText('');
            alert("Announcement Posted!");
        } catch(e) {
            alert("Failed to post announcement");
        } finally {
            setIsPosting(false);
        }
    };

    const handleUpdateProfile = async (data: Partial<User>) => {
        try {
            const updatedUser = { ...currentUser, ...data };
            await api.auth.updateProfile(updatedUser);
            setCurrentUser(updatedUser);
            setShowProfileEdit(false);
        } catch(e) {
            alert("Failed to update profile");
        }
    };

    const getVenueName = (id: string) => venues.find(v => v.id === id)?.name || id;

    const myEvents = events.filter(e => e.clubId === user.clubId);
    
    const totalReach = myEvents.reduce((acc, e) => acc + (e.registeredCount || 0), 0); 

    const allFeedbacks = myEvents.flatMap(e => e.feedback || []);
    const totalRatingSum = allFeedbacks.reduce((acc, f) => acc + f.rating, 0);
    const avgRating = allFeedbacks.length > 0 ? (totalRatingSum / allFeedbacks.length).toFixed(1) : '0.0';

    const totalRevenue = myEvents.reduce((acc, e) => acc + (e.price * (e.registeredCount || 0)), 0);

    const handleAiGenerate = async () => {
        if (!proposalTopic) return;
        setIsGenerating(true);
        const desc = await generateEventContent(proposalTopic, 'description');
        setGeneratedDesc(desc);
        setNewProposal({ ...newProposal, description: desc });
        setIsGenerating(false);
    };
    
    const handleSubmitProposal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editingEventId) {
            const existingEvent = events.find(e => e.id === editingEventId);
            if (existingEvent) {
                const updatedEvent: Event = {
                    ...existingEvent,
                    ...newProposal,
                    status: EventStatus.PENDING,
                    rejectionReason: undefined
                } as Event;
                await api.events.update(updatedEvent);
                alert("Proposal updated and re-submitted for approval.");
            }
        } else {
             const event: Event = {
                id: `e${Date.now()}`,
                title: newProposal.title || 'Untitled Event',
                description: newProposal.description || generatedDesc || 'No description.',
                organizer: clubInfo?.name || 'My Club', 
                clubId: user.clubId || 'c1',
                date: newProposal.date || '2024-01-01',
                time: newProposal.time || '12:00',
                venueId: newProposal.venueId || 'v1',
                status: EventStatus.PENDING,
                capacity: newProposal.capacity || 100,
                registeredCount: 0,
                tags: ['New'],
                price: newProposal.price || 0,
                image: newProposal.image || `https://picsum.photos/800/400?random=${Date.now()}`,
                volunteersNeeded: newProposal.volunteersNeeded
            };
            await api.events.create(event);
            alert("Proposal submitted for College Admin approval.");
        }
        setIsProposalModalOpen(false);
        setNewProposal({});
        setEditingEventId(null);
        refreshData(); 
        const updatedEvents = await api.events.list();
        setEvents(updatedEvents);
    };

    const handleEditEvent = (event: Event) => {
        setEditingEventId(event.id);
        setNewProposal({
            title: event.title,
            description: event.description,
            date: event.date,
            time: event.time,
            venueId: event.venueId,
            capacity: event.capacity,
            price: event.price,
            image: event.image,
            volunteersNeeded: event.volunteersNeeded
        });
        setIsProposalModalOpen(true);
    };

    const handleUploadMedia = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!mediaEventId || !mediaUrl || !user.clubId) return;
        const newMedia: MediaPost = {
            id: `m${Date.now()}`,
            clubId: user.clubId,
            eventId: mediaEventId,
            imageUrl: mediaUrl,
            caption: mediaCaption || 'Event Highlights',
            likedBy: [],
            comments: []
        };
        await api.media.create(newMedia);
        setMediaList([...mediaList, newMedia]);
        setMediaUrl('');
        setMediaEventId('');
        setMediaCaption('');
        alert("Media Uploaded!");
    };

    const handleIssueCertificates = async (event: Event) => {
        if(confirm(`Issue certificates to all ${event.registeredCount} participants for ${event.title}?`)) {
            await api.events.issueCertificates(event.id);
            setEvents(events.map(e => e.id === event.id ? {...e, certificatesIssued: true} : e));
            alert("Certificates Issued! Students can now view them in their profiles.");
        }
    };

    const handleGeneratePoster = async () => {
        if (!posterEvent) return;
        await api.events.saveWinners(posterEvent.id, winners);
        setGeneratedPoster(true); // Switch to view mode which uses the photos
        setAiPosterImage(null); 
    };

    const handleGenerateCertificateDesign = async () => {
        if (!certDesignEvent) return;
        setGeneratingCert(true);
        const prompt = `A sophisticated, elegant certificate background design for "${certDesignEvent.title}". 
        Minimalist, gold and white theme, academic and prestigious style. No text, just the border and background pattern.`;
        
        const image = await generateImage(prompt);
        if (image) {
            setCertDesignImage(image);
        } else {
            alert("Failed to generate certificate design.");
        }
        setGeneratingCert(false);
    };

    const handleOpenEventManagement = async (event: Event) => {
        if (event.status !== EventStatus.APPROVED && event.status !== EventStatus.COMPLETED) return;
        setManageEvent(event);
        const [vols, users] = await Promise.all([
            api.volunteers.listByEvent(event.id),
            api.events.getRegisteredUsers(event.id)
        ]);
        setManageVolunteers(vols);
        setManageRegisteredUsers(users);
    };

    const handleUpdateVolunteer = async (appId: string, status: VolunteerStatus) => {
        await api.volunteers.updateStatus(appId, status);
        setManageVolunteers(prev => prev.map(v => v.id === appId ? { ...v, status } : v));
    };

    const analyticsData = myEvents.map(e => ({
        name: e.title,
        participants: e.registeredCount
    }));

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        
        {activeTab === 'dashboard' && (
            <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-black text-yellow-400 p-8 shadow-[8px_8px_0px_#FACC15] border-2 border-black">
                        <h3 className="text-sm font-bold opacity-80 uppercase tracking-widest mb-2">Total Reach</h3>
                        <p className="text-5xl font-black">{totalReach.toLocaleString()}</p>
                    </div>
                    <div className="bg-white text-black p-8 shadow-[8px_8px_0px_#000] border-2 border-black">
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Avg Rating</h3>
                        <p className="text-5xl font-black">{avgRating}</p>
                    </div>
                    <div className="bg-yellow-400 text-black p-8 border-2 border-black">
                        <h3 className="text-sm font-bold opacity-80 uppercase tracking-widest mb-2">Total Revenue</h3>
                        <p className="text-5xl font-black">₹{totalRevenue.toLocaleString()}</p>
                    </div>
                </div>

                <div className="bg-white p-8 border-2 border-black shadow-sm">
                    <h3 className="text-xl font-black mb-6 border-b-2 border-gray-100 pb-4 text-black">PARTICIPATION ANALYTICS (REAL-TIME)</h3>
                    <div className="h-64 w-full">
                        {analyticsData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={analyticsData}>
                                    <XAxis dataKey="name" stroke="#000" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#000" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip cursor={{fill: '#fefce8'}} contentStyle={{ background: '#000', color: '#fff', border: 'none', fontWeight: 'bold' }} />
                                    <Bar dataKey="participants" fill="#FACC15" radius={[0, 0, 0, 0]} barSize={50} stroke="#000" strokeWidth={2} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-gray-400 italic text-center pt-20">No data available.</p>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* Club Management Tab */}
        {activeTab === 'club' && (
            <div className="space-y-8">
                {/* Club Header */}
                <div className="bg-white border-2 border-black overflow-hidden relative">
                    <div className="h-40 bg-gray-200">
                        {clubInfo?.banner && <img src={clubInfo.banner} className="w-full h-full object-cover grayscale opacity-50" />}
                    </div>
                    <div className="px-8 pb-8 pt-0 relative text-black">
                        <div className="flex justify-between items-end -mt-10 mb-4">
                            <div className="w-24 h-24 border-4 border-white bg-white shadow-lg overflow-hidden">
                                {clubInfo?.logo && <img src={clubInfo.logo} className="w-full h-full object-cover" />}
                            </div>
                            <div className="bg-black text-yellow-400 px-4 py-1 text-xs font-bold uppercase tracking-widest">
                                {clubMembers.length} Members
                            </div>
                        </div>
                        <h2 className="text-4xl font-black uppercase mb-2">{clubInfo?.name || 'Club Name'}</h2>
                        <p className="text-gray-600 font-medium max-w-2xl">{clubInfo?.description}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left: Announcements */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white border-2 border-black p-6 shadow-sm">
                            <h3 className="text-xl font-black mb-4 flex items-center gap-2 text-black"><Megaphone size={24} /> POST ANNOUNCEMENT</h3>
                            <div className="flex gap-4">
                                <textarea 
                                className="flex-1 p-3 border-2 border-gray-200 focus:border-black focus:outline-none font-medium text-black" 
                                rows={2}
                                placeholder="Share updates with your club members..."
                                value={announcementText}
                                onChange={e => setAnnouncementText(e.target.value)}
                                />
                                <button 
                                onClick={handleAddAnnouncement}
                                disabled={isPosting}
                                className="bg-black text-white px-6 font-bold uppercase tracking-widest hover:bg-gray-800 disabled:opacity-50"
                                >
                                    {isPosting ? <Loader2 className="animate-spin" /> : 'Post'}
                                </button>
                            </div>
                            <div className="mt-6 space-y-3">
                                <h4 className="text-xs font-bold uppercase text-gray-400">Recent Announcements</h4>
                                {announcements.length === 0 && <p className="text-sm italic text-gray-400">No announcements yet.</p>}
                                {announcements.map(a => (
                                    <div key={a.id} className="bg-gray-50 p-4 border-l-4 border-yellow-400 text-sm text-black">
                                        <p className="font-bold mb-1">{a.content}</p>
                                        <span className="text-gray-400 text-xs">{new Date(a.date).toLocaleDateString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right: Member Directory */}
                    <div>
                        <div className="bg-white border-2 border-black p-6">
                            <h3 className="text-xl font-black mb-4 flex items-center gap-2 text-black"><Users size={24} /> MEMBERS</h3>
                            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                                {clubMembers.length === 0 ? <p className="text-gray-400 italic">No members found.</p> :
                                 clubMembers.map(member => (
                                     <div key={member.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 text-black">
                                         <img src={member.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${member.name}`} className="w-10 h-10 rounded-full bg-gray-200 border border-gray-300" />
                                         <div>
                                             <p className="font-bold text-sm leading-tight">{member.name}</p>
                                             <p className="text-[10px] text-gray-500 font-bold uppercase">{member.year} • {member.branch}</p>
                                         </div>
                                     </div>
                                 ))
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* ... (Events Tab) ... */}
        {activeTab === 'events' && (
            <div>
                <div className="flex justify-between items-center mb-6 text-black">
                    <h2 className="text-3xl font-black uppercase tracking-tight">Events & Proposals</h2>
                    <button 
                    onClick={() => {
                        setEditingEventId(null);
                        setNewProposal({});
                        setIsProposalModalOpen(true);
                    }}
                    className="bg-black text-white px-6 py-3 text-sm font-bold uppercase tracking-wider hover:bg-gray-800 hover:scale-105 transition-transform flex items-center gap-2 border-2 border-transparent hover:border-yellow-400"
                    >
                    <Sparkles size={16} className="text-yellow-400" /> New Proposal
                    </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.filter(e => e.clubId === user?.clubId).map(event => (
                    <div key={event.id} className="relative">
                        <EventCard 
                            event={event} 
                            isAdminView={true}
                            venueName={getVenueName(event.venueId)}
                            onGeneratePoster={() => {
                                setPosterEvent(event);
                                setGeneratedPoster(!!event.winners); 
                                if (event.winners) setWinners(event.winners);
                                setAiPosterImage(null);
                            }}
                            onIssueCertificates={handleIssueCertificates}
                            onEdit={handleEditEvent}
                            onClick={() => handleOpenEventManagement(event)}
                        />
                        {event.status === EventStatus.COMPLETED && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); setCertDesignEvent(event); }}
                                className="absolute top-2 left-2 bg-white text-black p-2 border border-black text-xs font-bold uppercase hover:bg-gray-100 z-10"
                                title="Design Certificate"
                            >
                                <Palette size={16} />
                            </button>
                        )}
                    </div>
                    ))}
                </div>
            </div>
        )}

        {/* ... (Media Tab) ... */}
        {activeTab === 'media' && (
            <div className="space-y-8">
                <div className="bg-white p-6 border-2 border-black shadow-sm">
                    <h3 className="text-xl font-black mb-4 text-black">UPLOAD MEDIA</h3>
                    <form onSubmit={handleUploadMedia} className="flex flex-col gap-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <select 
                                required
                                className="p-3 border-2 border-gray-200 focus:border-black outline-none font-medium text-black"
                                value={mediaEventId}
                                onChange={e => setMediaEventId(e.target.value)}
                            >
                                <option value="">Select Completed Event</option>
                                {events.filter(e => e.clubId === user.clubId).map(e => (
                                    <option key={e.id} value={e.id}>{e.title}</option>
                                ))}
                            </select>
                            
                            <ImageUpload 
                                label="Upload Image"
                                onImageSelected={setMediaUrl}
                                currentImage={mediaUrl}
                            />
                        </div>
                        <input 
                            required
                            type="text"
                            placeholder="Add a caption..."
                            className="p-3 border-2 border-gray-200 focus:border-black outline-none font-medium text-black"
                            value={mediaCaption}
                            onChange={e => setMediaCaption(e.target.value)}
                        />
                        <button className="bg-black text-white py-3 font-bold uppercase hover:bg-gray-800 border-2 border-black">
                            Post to Media Feed
                        </button>
                    </form>
                </div>
                
                <h3 className="text-xl font-black mt-8 mb-4 border-b-2 border-gray-200 pb-2 text-black">YOUR POSTS</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {mediaList.map(m => (
                        <div key={m.id} className="relative group border-2 border-black">
                            <img 
                                src={m.imageUrl} 
                                onError={(e) => { e.currentTarget.src = "https://via.placeholder.com/800x600/000000/FACC15?text=MEDIA"; }}
                                className="w-full h-48 object-cover" 
                            />
                            <div className="absolute bottom-0 left-0 w-full bg-black/80 text-white p-3 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                <p className="font-bold truncate mb-1">{m.caption}</p>
                                <p className="text-gray-400 text-[10px] uppercase truncate">{events.find(e => e.id === m.eventId)?.title}</p>
                                <div className="flex gap-2 mt-2">
                                    <span>❤️ {(m.likedBy || []).length}</span>
                                    <span>💬 {(m.comments || []).length}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* ... (Proposal Modal) ... */}
        <Modal
            isOpen={isProposalModalOpen}
            onClose={() => setIsProposalModalOpen(false)}
            title={editingEventId ? "Edit Event Proposal" : "New Event Proposal"}
        >
             {/* Content same as before */}
             <div className="space-y-6">
                <div className="bg-yellow-50 p-6 border-2 border-yellow-400 border-dashed rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={20} className="text-black" />
                    <h3 className="text-sm font-black uppercase tracking-wider text-black">AI Content Architect</h3>
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="E.g., A robotics workshop for beginners..."
                      className="flex-1 p-3 border-2 border-black text-sm font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400 text-black"
                      value={proposalTopic}
                      onChange={(e) => setProposalTopic(e.target.value)}
                    />
                    <button 
                      onClick={handleAiGenerate}
                      disabled={isGenerating}
                      className="bg-black text-white px-6 py-2 text-xs font-bold uppercase hover:bg-gray-800 disabled:opacity-50 min-w-[120px] flex items-center justify-center border-2 border-black"
                    >
                      {isGenerating ? <Loader2 className="animate-spin text-yellow-400" size={16} /> : 'Generate'}
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSubmitProposal} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Event Title</label>
                    <input 
                      required
                      type="text" 
                      className="w-full p-4 border-2 border-gray-200 focus:border-black focus:outline-none transition-colors font-bold text-lg text-black"
                      value={newProposal.title}
                      onChange={e => setNewProposal({...newProposal, title: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Description</label>
                    <textarea 
                      required
                      rows={4}
                      className="w-full p-4 border-2 border-gray-200 focus:border-black focus:outline-none transition-colors font-medium text-black"
                      value={newProposal.description || generatedDesc}
                      onChange={e => setNewProposal({...newProposal, description: e.target.value})}
                    />
                  </div>
                  
                  <ImageUpload 
                        label="Cover Image"
                        onImageSelected={(base64) => setNewProposal({...newProposal, image: base64})}
                        currentImage={newProposal.image}
                  />

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Date</label>
                      <input 
                        required
                        type="date" 
                        className="w-full p-3 border-2 border-gray-200 focus:border-black focus:outline-none font-medium text-black"
                        value={newProposal.date}
                        onChange={e => setNewProposal({...newProposal, date: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Time</label>
                      <input 
                        required
                        type="time" 
                        className="w-full p-3 border-2 border-gray-200 focus:border-black focus:outline-none font-medium text-black"
                        value={newProposal.time}
                        onChange={e => setNewProposal({...newProposal, time: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                     <div>
                      <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Venue Preference</label>
                      <select 
                        className="w-full p-3 border-2 border-gray-200 focus:border-black focus:outline-none bg-white font-medium text-black"
                        value={newProposal.venueId}
                        onChange={e => setNewProposal({...newProposal, venueId: e.target.value})}
                      >
                        <option value="">Select Venue</option>
                        {venues.map(v => (
                          <option key={v.id} value={v.id}>{v.name} (Cap: {v.capacity})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Ticket Price (₹)</label>
                      <input 
                        type="number" 
                        className="w-full p-3 border-2 border-gray-200 focus:border-black focus:outline-none font-medium text-black"
                        placeholder="0 for Free"
                        value={newProposal.price}
                        onChange={e => setNewProposal({...newProposal, price: Number(e.target.value)})}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-gray-50 border-2 border-gray-200">
                      <input 
                        type="checkbox"
                        id="volunteers"
                        className="w-5 h-5 text-yellow-400 focus:ring-black border-gray-300 rounded"
                        checked={newProposal.volunteersNeeded}
                        onChange={e => setNewProposal({...newProposal, volunteersNeeded: e.target.checked})}
                      />
                      <label htmlFor="volunteers" className="font-bold text-sm cursor-pointer select-none text-black">Volunteers Needed for this Event</label>
                  </div>

                  <button type="submit" className="w-full bg-yellow-400 text-black py-4 font-black uppercase tracking-widest hover:bg-yellow-500 transition-all mt-6 border-2 border-black shadow-[4px_4px_0px_#000] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]">
                    {editingEventId ? "Update & Re-Submit" : "Submit Proposal"}
                  </button>
                </form>
             </div>
        </Modal>

        <Modal 
            isOpen={!!posterEvent} 
            onClose={() => { setPosterEvent(null); setGeneratedPoster(false); setAiPosterImage(null); }}
            title="Winners Poster"
            large
        >
            {!generatedPoster ? (
                <div className="space-y-6">
                     <p className="font-medium text-gray-600">Upload details of the top 3 winners to generate a celebratory poster.</p>
                     {[0, 1, 2].map(idx => (
                         <div key={idx} className="flex gap-4 p-4 border border-gray-200 bg-gray-50 items-end">
                             <div className="w-12 h-12 flex items-center justify-center bg-black text-white font-black text-xl rounded-full">
                                 {idx + 1}
                             </div>
                             <div className="flex-1">
                                 <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Name</label>
                                 <input 
                                    className="w-full p-2 border border-gray-300 text-black"
                                    value={winners[idx].name}
                                    onChange={e => {
                                        const newWinners = [...winners];
                                        newWinners[idx].name = e.target.value;
                                        setWinners(newWinners);
                                    }}
                                 />
                             </div>
                             <div>
                                 <ImageUpload 
                                    label="Photo"
                                    onImageSelected={(b64) => {
                                        const newWinners = [...winners];
                                        newWinners[idx].photo = b64;
                                        setWinners(newWinners);
                                    }}
                                    currentImage={winners[idx].photo}
                                 />
                             </div>
                         </div>
                     ))}
                     
                     <div className="flex gap-4">
                         {/* Removed Manual Generate Button, renamed AI Poster to Generate Poster that uses manual logic */}
                         <button 
                            onClick={handleGeneratePoster} 
                            disabled={generatingPoster}
                            className="flex-1 bg-black text-yellow-400 py-4 font-black uppercase text-xl hover:bg-gray-900 flex items-center justify-center gap-2"
                         >
                             {generatingPoster ? <Loader2 className="animate-spin" /> : <><Sparkles /> Generate Poster</>}
                         </button>
                     </div>
                </div>
            ) : (
                <div className="text-center">
                    {aiPosterImage ? (
                        <div className="bg-black p-2 mb-6">
                            <img src={aiPosterImage} alt="AI Poster" className="w-full max-h-[600px] object-contain border-4 border-yellow-400" />
                        </div>
                    ) : (
                        <div className="bg-black p-8 text-white relative overflow-hidden mb-6" id="poster-area">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400 rounded-bl-full"></div>
                            <h2 className="text-sm font-bold uppercase tracking-widest text-yellow-400 mb-2">{posterEvent?.title}</h2>
                            <h1 className="text-5xl font-black mb-12">CONGRATULATIONS</h1>
                            
                            <div className="flex justify-center items-end gap-4 mb-8">
                                 <div className="flex flex-col items-center">
                                     <div className="w-24 h-24 rounded-full border-4 border-gray-400 overflow-hidden mb-2">
                                         <img src={winners[1].photo || "https://via.placeholder.com/100"} className="w-full h-full object-cover"/>
                                     </div>
                                     <div className="bg-gray-400 text-black px-3 py-1 font-bold text-xs uppercase mb-1">2nd Place</div>
                                     <p className="font-bold">{winners[1].name}</p>
                                 </div>
                                 <div className="flex flex-col items-center -translate-y-6">
                                     <div className="w-32 h-32 rounded-full border-4 border-yellow-400 overflow-hidden mb-2 shadow-[0_0_20px_rgba(250,204,21,0.5)]">
                                         <img src={winners[0].photo || "https://via.placeholder.com/100"} className="w-full h-full object-cover"/>
                                     </div>
                                     <div className="bg-yellow-400 text-black px-4 py-1.5 font-bold text-sm uppercase mb-1">Winner</div>
                                     <p className="font-bold text-xl">{winners[0].name}</p>
                                 </div>
                                  <div className="flex flex-col items-center">
                                     <div className="w-24 h-24 rounded-full border-4 border-orange-700 overflow-hidden mb-2">
                                         <img src={winners[2].photo || "https://via.placeholder.com/100"} className="w-full h-full object-cover"/>
                                     </div>
                                     <div className="bg-orange-700 text-white px-3 py-1 font-bold text-xs uppercase mb-1">3rd Place</div>
                                     <p className="font-bold">{winners[2].name}</p>
                                 </div>
                            </div>
                            <p className="text-gray-500 font-bold text-sm uppercase tracking-widest">Organized by {posterEvent?.organizer}</p>
                        </div>
                    )}
                    <div className="mt-6 flex justify-center gap-4">
                        <button onClick={() => setGeneratedPoster(false)} className="px-4 py-2 border-2 border-black font-bold uppercase hover:bg-gray-100 text-black">Edit</button>
                        <button onClick={() => alert("Poster Saved/Downloaded!")} className="bg-black text-white px-6 py-2 font-bold uppercase hover:bg-gray-800">Download</button>
                    </div>
                </div>
            )}
        </Modal>

        <Modal
            isOpen={!!certDesignEvent}
            onClose={() => { setCertDesignEvent(null); setCertDesignImage(null); }}
            title="Design Certificate Template"
        >
            <div className="space-y-6">
                <div className="bg-gray-50 border-2 border-dashed border-gray-300 h-64 flex items-center justify-center relative overflow-hidden">
                    {certDesignImage ? (
                        <img src={certDesignImage} className="w-full h-full object-cover" />
                    ) : (
                        <div className="text-center text-gray-400">
                            <Award size={48} className="mx-auto mb-2" />
                            <p>No design generated yet.</p>
                        </div>
                    )}
                </div>
                
                <div className="flex gap-4">
                    <button 
                        onClick={handleGenerateCertificateDesign}
                        disabled={generatingCert}
                        className="flex-1 bg-black text-white py-3 font-bold uppercase hover:bg-gray-800 flex items-center justify-center gap-2"
                    >
                        {generatingCert ? <Loader2 className="animate-spin" /> : <><Sparkles size={18} /> Generate AI Design</>}
                    </button>
                    <button 
                        onClick={() => { alert("Template Saved!"); setCertDesignEvent(null); }}
                        disabled={!certDesignImage}
                        className="flex-1 bg-yellow-400 text-black py-3 font-bold uppercase hover:bg-yellow-500 disabled:opacity-50"
                    >
                        Save Template
                    </button>
                </div>
                <p className="text-xs text-gray-500 text-center">Uses Gemini to generate a unique certificate background for this event.</p>
            </div>
        </Modal>

        <EventManagementModal 
            isOpen={!!manageEvent}
            onClose={() => setManageEvent(null)}
            event={manageEvent}
            volunteers={manageVolunteers}
            registeredUsers={manageRegisteredUsers}
            onUpdateVolunteerStatus={handleUpdateVolunteer}
        />

        {activeTab === 'profile' && (
            <ProfileView user={currentUser} onEdit={() => setShowProfileEdit(true)} onLogout={onLogout} />
        )}

        <EditProfileModal isOpen={showProfileEdit} onClose={() => setShowProfileEdit(false)} user={currentUser} onUpdate={handleUpdateProfile} />
      </div>
    );
};

// ... LoginPage, SignupPage, App ...
// (Providing full file content is safest)

const LoginPage = ({ onLogin, onSwitchToSignup }: { onLogin: (u: User) => void, onSwitchToSignup: () => void }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const u = await api.auth.login(email, password);
            onLogin(u);
        } catch (err) {
            alert('Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-yellow-400 flex items-center justify-center p-4">
            <div className="bg-white p-8 border-4 border-black shadow-[8px_8px_0px_#000] max-w-md w-full text-black">
                <h1 className="text-4xl font-black mb-2 tracking-tighter">CLIX<span className="text-yellow-400">.</span></h1>
                <p className="font-bold text-gray-500 uppercase tracking-widest mb-8 text-xs">Your Campus, One Click Away</p>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold uppercase mb-1">Email</label>
                        <input 
                            className="w-full border-2 border-black p-3 font-bold focus:outline-none focus:bg-yellow-50 text-black"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase mb-1">Password</label>
                        <input 
                            type="password"
                            className="w-full border-2 border-black p-3 font-bold focus:outline-none focus:bg-yellow-50 text-black"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                    </div>
                    <button disabled={loading} className="w-full bg-black text-white py-4 font-black uppercase hover:bg-gray-800 transition">
                        {loading ? <Loader2 className="animate-spin mx-auto"/> : 'Login'}
                    </button>
                </form>

                <div className="mt-4 text-center">
                    <button onClick={onSwitchToSignup} className="text-sm font-bold underline">Create an account</button>
                </div>
            </div>
        </div>
    );
};

const SignupPage = ({ onSignup, onSwitchToLogin }: { onSignup: (u: User) => void, onSwitchToLogin: () => void }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [year, setYear] = useState('1st Year');
    const [branch, setBranch] = useState('CSE');
    const [avatar, setAvatar] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Simplified signup
            const newUser: User = {
                id: `u${Date.now()}`,
                name,
                email,
                role: UserRole.STUDENT, // Default
                joinDate: new Date().toISOString(),
                joinedClubIds: [],
                year,
                branch,
                avatar
            };
            // In real app, we would send password to API too
            const u = await api.auth.signup(newUser); 
            onSignup(u);
        } catch (err) {
            alert('Signup failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
             <div className="bg-white p-8 border-4 border-yellow-400 shadow-[8px_8px_0px_#FACC15] max-w-md w-full text-black">
                <h1 className="text-3xl font-black mb-6 tracking-tighter">JOIN CLIX.</h1>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex justify-center mb-4">
                        <ImageUpload 
                            label="Profile Photo" 
                            onImageSelected={setAvatar} 
                            currentImage={avatar}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase mb-1">Full Name</label>
                        <input 
                            required
                            className="w-full border-2 border-black p-3 font-bold focus:outline-none focus:bg-yellow-50 text-black"
                            value={name}
                            onChange={e => setName(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase mb-1">Email</label>
                        <input 
                            required
                            type="email"
                            className="w-full border-2 border-black p-3 font-bold focus:outline-none focus:bg-yellow-50 text-black"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase mb-1">Year</label>
                            <select 
                                className="w-full border-2 border-black p-3 font-bold focus:outline-none focus:bg-yellow-50 bg-white text-black"
                                value={year}
                                onChange={e => setYear(e.target.value)}
                            >
                                <option>1st Year</option>
                                <option>2nd Year</option>
                                <option>3rd Year</option>
                                <option>4th Year</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase mb-1">Branch</label>
                            <select 
                                className="w-full border-2 border-black p-3 font-bold focus:outline-none focus:bg-yellow-50 bg-white text-black"
                                value={branch}
                                onChange={e => setBranch(e.target.value)}
                            >
                                <option>CSE</option>
                                <option>ECE</option>
                                <option>ME</option>
                                <option>CE</option>
                                <option>EE</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase mb-1">Password</label>
                        <input 
                            required
                            type="password"
                            className="w-full border-2 border-black p-3 font-bold focus:outline-none focus:bg-yellow-50 text-black"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                    </div>
                    <button disabled={loading} className="w-full bg-yellow-400 text-black py-4 font-black uppercase hover:bg-yellow-500 transition border-2 border-black">
                        {loading ? <Loader2 className="animate-spin mx-auto"/> : 'Create Account'}
                    </button>
                </form>

                <div className="mt-4 text-center">
                    <button onClick={onSwitchToLogin} className="text-sm font-bold underline">Already have an account? Login</button>
                </div>
            </div>
        </div>
    );
};

// ... App ...
const App = () => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authView, setAuthView] = useState<'login' | 'signup'>('login');
    const [activeTab, setActiveTab] = useState('feed');
    const [splash, setSplash] = useState(true);

    useEffect(() => {
        // Mock splash screen timer
        const timer = setTimeout(() => {
            setSplash(false);
        }, 2200); // Allow animation to finish
        return () => clearTimeout(timer);
    }, []);

    // Handle Login Logic
    const handleLogin = (u: User) => {
        setUser(u);
        setIsAuthenticated(true);
        if (u.role === UserRole.STUDENT) setActiveTab('feed');
        else if (u.role === UserRole.CLUB_ADMIN) setActiveTab('dashboard');
        else if (u.role === UserRole.COLLEGE_ADMIN) setActiveTab('approvals');
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        setUser(null);
        setAuthView('login');
    };

    if (splash) return <SplashScreen />;

    if (!isAuthenticated) {
        return authView === 'login' 
          ? <LoginPage onLogin={handleLogin} onSwitchToSignup={() => setAuthView('signup')} />
          : <SignupPage onSignup={(u) => { setUser(u); setIsAuthenticated(true); setActiveTab('feed'); }} onSwitchToLogin={() => setAuthView('login')} />;
    }

    if (!user) return null;

    return (
      <Layout user={user} onLogout={handleLogout} activeTab={activeTab} setActiveTab={setActiveTab}>
        {user.role === UserRole.STUDENT && <StudentDashboard user={user} activeTab={activeTab} onLogout={handleLogout} />}
        {user.role === UserRole.CLUB_ADMIN && <ClubAdminDashboard user={user} refreshData={() => {}} activeTab={activeTab} onLogout={handleLogout} />}
        {user.role === UserRole.COLLEGE_ADMIN && <CollegeAdminDashboard user={user} activeTab={activeTab} onLogout={handleLogout} />}
      </Layout>
    );
};

export default App;
