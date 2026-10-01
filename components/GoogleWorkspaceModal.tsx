import React, { useState, useEffect } from 'react';
import {
  X,
  RefreshCw,
  ExternalLink,
  Calendar,
  FileText,
  CheckSquare,
  Users,
  HardDrive,
  Table,
  Plus,
  Search,
  Check,
  AlertCircle,
  Clock,
  MapPin,
  Mail,
  Phone,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import {
  googleWorkspaceService,
  DriveFileItem,
  CalendarEventItem,
  TaskItem,
  ContactItem
} from '../services/googleWorkspaceService';
import { getAccessToken, signInWithGooglePopup } from '../firebase';
import { Language } from '../types';

interface GoogleWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: 'dark' | 'light';
  language?: Language;
  onInsertToChat?: (text: string) => void;
}

type TabType = 'overview' | 'drive' | 'calendar' | 'tasks' | 'contacts';

export const GoogleWorkspaceModal: React.FC<GoogleWorkspaceModalProps> = ({
  isOpen,
  onClose,
  theme = 'dark',
  language = 'tr',
  onInsertToChat
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [driveFiles, setDriveFiles] = useState<DriveFileItem[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEventItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [driveSearch, setDriveSearch] = useState('');

  // Confirmation modal state for destructive / mutating operations
  const [pendingAction, setPendingAction] = useState<{
    type: 'create_event' | 'create_task';
    title: string;
    details: string;
    onConfirm: () => Promise<void>;
  } | null>(null);

  // New Event Form
  const [showEventForm, setShowEventForm] = useState(false);
  const [newEventSummary, setNewEventSummary] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventTime, setNewEventTime] = useState('10:00');
  const [newEventLocation, setNewEventLocation] = useState('');

  // New Task Form
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskNotes, setNewTaskNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      checkAuthAndLoad();
    }
  }, [isOpen, activeTab]);

  const checkAuthAndLoad = async () => {
    const hasToken = !!getAccessToken();
    setIsConnected(hasToken);
    if (!hasToken) return;

    setError(null);
    setIsLoading(true);
    try {
      if (activeTab === 'overview') {
        const [files, events, tList, cList] = await Promise.all([
          googleWorkspaceService.listDriveFiles(undefined, 5).catch(() => []),
          googleWorkspaceService.listCalendarEvents(undefined, 5).catch(() => []),
          googleWorkspaceService.listTasks().catch(() => []),
          googleWorkspaceService.listContacts(5).catch(() => [])
        ]);
        setDriveFiles(files);
        setCalendarEvents(events);
        setTasks(tList);
        setContacts(cList);
      } else if (activeTab === 'drive') {
        const files = await googleWorkspaceService.listDriveFiles(driveSearch ? `name contains '${driveSearch}'` : undefined, 20);
        setDriveFiles(files);
      } else if (activeTab === 'calendar') {
        const events = await googleWorkspaceService.listCalendarEvents(undefined, 20);
        setCalendarEvents(events);
      } else if (activeTab === 'tasks') {
        const taskItems = await googleWorkspaceService.listTasks();
        setTasks(taskItems);
      } else if (activeTab === 'contacts') {
        const contactItems = await googleWorkspaceService.listContacts(30);
        setContacts(contactItems);
      }
    } catch (err: any) {
      setError(err.message || 'Veriler yüklenirken bir sorun oluştu.');
      if (err.message?.includes('oturum') || err.message?.includes('token')) {
        setIsConnected(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectGoogle = async () => {
    setIsAuthenticating(true);
    setError(null);
    try {
      await signInWithGooglePopup();
      setIsConnected(true);
      await checkAuthAndLoad();
    } catch (err: any) {
      setError(err.message || 'Google oturum açma başarısız oldu.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleRequestCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventSummary || !newEventDate) return;

    const startDateTime = new Date(`${newEventDate}T${newEventTime || '09:00'}:00`).toISOString();
    const endDate = new Date(new Date(`${newEventDate}T${newEventTime || '09:00'}:00`).getTime() + 60 * 60 * 1000).toISOString();

    setPendingAction({
      type: 'create_event',
      title: language === 'tr' ? 'Takvim Etkinliğini Onayla' : 'Confirm Calendar Event',
      details: `${newEventSummary} (${newEventDate} ${newEventTime || ''})${newEventLocation ? ` - ${newEventLocation}` : ''}`,
      onConfirm: async () => {
        await googleWorkspaceService.createCalendarEvent({
          summary: newEventSummary,
          startDateTime,
          endDateTime: endDate,
          location: newEventLocation
        });
        setNewEventSummary('');
        setNewEventLocation('');
        setShowEventForm(false);
        await checkAuthAndLoad();
      }
    });
  };

  const handleRequestCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle) return;

    setPendingAction({
      type: 'create_task',
      title: language === 'tr' ? 'Yeni Görevi Onayla' : 'Confirm New Task',
      details: `${newTaskTitle}${newTaskNotes ? ` (${newTaskNotes})` : ''}`,
      onConfirm: async () => {
        await googleWorkspaceService.createTask('@default', newTaskTitle, newTaskNotes);
        setNewTaskTitle('');
        setNewTaskNotes('');
        setShowTaskForm(false);
        await checkAuthAndLoad();
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl shadow-2xl border overflow-hidden transition-all duration-300 ${
          theme === 'dark'
            ? 'bg-[#121316] border-zinc-800 text-zinc-100'
            : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-5 sm:px-6 py-4 border-b ${
            theme === 'dark' ? 'border-zinc-800/80 bg-[#16171b]' : 'border-zinc-200 bg-zinc-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-md p-2 border border-zinc-200/50">
              <svg viewBox="0 0 24 24" className="w-6 h-6">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight">Google Workspace</h2>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {isConnected ? (language === 'tr' ? 'Bağlandı' : 'Connected') : (language === 'tr' ? 'Yetki Bekleniyor' : 'Auth Required')}
                </span>
              </div>
              <p className={`text-xs ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
                {language === 'tr'
                  ? 'Drive, Takvim, Görevler, Kişiler, E-Tablo ve Belgeler entegrasyonu'
                  : 'Drive, Calendar, Tasks, Contacts, Sheets & Docs integration'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={checkAuthAndLoad}
              disabled={isLoading || !isConnected}
              className={`p-2 rounded-xl transition-all ${
                theme === 'dark'
                  ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white'
                  : 'hover:bg-zinc-200 text-zinc-600 hover:text-black'
              } disabled:opacity-40`}
              title="Yenile"
            >
              <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition-all ${
                theme === 'dark'
                  ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white'
                  : 'hover:bg-zinc-200 text-zinc-600 hover:text-black'
              }`}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div
          className={`flex items-center gap-1 px-4 sm:px-6 py-2 overflow-x-auto border-b custom-scrollbar ${
            theme === 'dark' ? 'border-zinc-800/80 bg-[#141518]' : 'border-zinc-200 bg-zinc-100/60'
          }`}
        >
          {[
            { id: 'overview', label: language === 'tr' ? 'Genel Bakış' : 'Overview', icon: ShieldCheck },
            { id: 'drive', label: 'Google Drive', icon: HardDrive },
            { id: 'calendar', label: language === 'tr' ? 'Google Takvim' : 'Calendar', icon: Calendar },
            { id: 'tasks', label: language === 'tr' ? 'Google Görevler' : 'Tasks', icon: CheckSquare },
            { id: 'contacts', label: language === 'tr' ? 'Google Kişiler' : 'Contacts', icon: Users }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                    : theme === 'dark'
                    ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60'
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
          {error && (
            <div className="mb-4 p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs sm:text-sm flex items-center gap-2">
              <AlertCircle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!isConnected ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="w-16 h-16 rounded-3xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-500 mb-4 shadow-inner">
                <ShieldCheck size={36} />
              </div>
              <h3 className="text-xl font-bold mb-2">
                {language === 'tr' ? 'Google Workspace Entegrasyonunu Başlatın' : 'Enable Google Workspace Integration'}
              </h3>
              <p className={`text-sm max-w-md mb-6 leading-relaxed ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>
                {language === 'tr'
                  ? 'Chat_CNR yapay zekasının Google Drive dosyalarınıza, Takviminize, Görevlerinize ve Kişilerinize erişerek sorularınıza gerçek zamanlı cevap verebilmesi için kullanıcı izni gereklidir.'
                  : 'Chat_CNR requires your permission to access your Google Drive files, Calendar, Tasks, and Contacts to answer your queries in real-time.'}
              </p>

              {/* Official Google Sign-in style button */}
              <button
                type="button"
                onClick={handleConnectGoogle}
                disabled={isAuthenticating}
                className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-white text-zinc-800 font-semibold shadow-md hover:shadow-lg hover:bg-zinc-50 border border-zinc-300 transition-all active:scale-95 disabled:opacity-50"
              >
                <svg viewBox="0 0 48 48" className="w-5 h-5">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                <span>
                  {isAuthenticating
                    ? (language === 'tr' ? 'Yetkilendiriliyor...' : 'Authenticating...')
                    : (language === 'tr' ? 'Google ile Yetkilendir' : 'Sign in with Google')}
                </span>
              </button>
            </div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Status Banner */}
                  <div
                    className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      theme === 'dark' ? 'bg-[#18191e] border-zinc-800' : 'bg-blue-50/50 border-blue-100'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                        <Check size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm sm:text-base">
                          {language === 'tr' ? 'Tüm Google Entegrasyonları Aktif' : 'All Google Integrations Active'}
                        </h4>
                        <p className={`text-xs ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>
                          {language === 'tr'
                            ? 'Chat_CNR ile sohbet ederken doğrudan takvim, dosyalar, görevler ve kişilerinizi sorabilirsiniz.'
                            : 'You can directly query your calendar, drive files, tasks, and contacts when chatting with Chat_CNR.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleConnectGoogle}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-sm"
                      >
                        {language === 'tr' ? 'Yeniden Yetkilendir' : 'Re-authenticate'}
                      </button>
                    </div>
                  </div>

                  {/* Scopes Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { title: 'Google Drive', desc: language === 'tr' ? 'Dosya arama ve listeleme' : 'File search & list', icon: HardDrive, color: 'text-amber-400' },
                      { title: 'Google Takvim', desc: language === 'tr' ? 'Etkinlikleri görme & oluşturma' : 'View & create events', icon: Calendar, color: 'text-blue-400' },
                      { title: 'Google Görevler', desc: language === 'tr' ? 'Yapılacaklar listesi' : 'To-do management', icon: CheckSquare, color: 'text-emerald-400' },
                      { title: 'Google Kişiler', desc: language === 'tr' ? 'Rehber ve iletişim bilgileri' : 'Contacts & connections', icon: Users, color: 'text-purple-400' },
                      { title: 'Google Belgeler', desc: language === 'tr' ? 'Doküman metin okuma' : 'Read Docs content', icon: FileText, color: 'text-cyan-400' },
                      { title: 'Google E-Tablolar', desc: language === 'tr' ? 'Tablo verilerini okuma' : 'Read Sheets data', icon: Table, color: 'text-green-400' }
                    ].map((item, idx) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={idx}
                          className={`p-3.5 rounded-2xl border flex flex-col justify-between ${
                            theme === 'dark' ? 'bg-[#16171b] border-zinc-800/80' : 'bg-zinc-50 border-zinc-200'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <Icon size={20} className={item.color} />
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
                              {language === 'tr' ? 'Bağlı' : 'Linked'}
                            </span>
                          </div>
                          <div>
                            <p className="text-xs font-bold">{item.title}</p>
                            <p className={`text-[11px] ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-500'}`}>
                              {item.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Quick AI Prompts */}
                  <div
                    className={`p-4 rounded-2xl border ${
                      theme === 'dark' ? 'bg-[#141518] border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                    }`}
                  >
                    <h5 className="text-xs font-bold uppercase tracking-wider mb-2.5 text-blue-400">
                      {language === 'tr' ? 'Chat_CNR ile Deneyebileceğiniz Örnek Sorular' : 'Sample Prompts for Chat_CNR'}
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        language === 'tr' ? 'Bugün ve yarın için Google Takvimimde hangi etkinlikler var?' : 'What events do I have in my Google Calendar today and tomorrow?',
                        language === 'tr' ? 'Google Drive içindeki son belgelerimi listele' : 'List my recent documents in Google Drive',
                        language === 'tr' ? 'Google Görevlerime "Haftalık raporu tamamla" diye yeni görev ekle' : 'Add "Complete weekly report" to my Google Tasks',
                        language === 'tr' ? 'Google Rehberimdeki kişileri ve e-posta adreslerini göster' : 'Show contacts and emails from my Google Contacts'
                      ].map((prompt, pIdx) => (
                        <button
                          key={pIdx}
                          onClick={() => {
                            if (onInsertToChat) {
                              onInsertToChat(prompt);
                              onClose();
                            }
                          }}
                          className={`text-left p-2.5 rounded-xl text-xs transition-all flex items-center justify-between group ${
                            theme === 'dark'
                              ? 'bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300'
                              : 'bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200/80'
                          }`}
                        >
                          <span className="truncate pr-2">{prompt}</span>
                          <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-400 shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: GOOGLE DRIVE */}
              {activeTab === 'drive' && (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <div
                      className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-xl border ${
                        theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                      }`}
                    >
                      <Search size={16} className="text-zinc-400" />
                      <input
                        type="text"
                        value={driveSearch}
                        onChange={(e) => setDriveSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && checkAuthAndLoad()}
                        placeholder={language === 'tr' ? "Drive'da dosya ara..." : 'Search Drive files...'}
                        className="w-full bg-transparent text-xs sm:text-sm outline-none"
                      />
                    </div>
                    <button
                      onClick={checkAuthAndLoad}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all"
                    >
                      {language === 'tr' ? 'Ara' : 'Search'}
                    </button>
                  </div>

                  {isLoading ? (
                    <div className="py-12 flex justify-center">
                      <RefreshCw size={24} className="animate-spin text-blue-500" />
                    </div>
                  ) : driveFiles.length === 0 ? (
                    <div className="py-12 text-center text-xs text-zinc-500">
                      {language === 'tr' ? 'Dosya bulunamadı.' : 'No files found.'}
                    </div>
                  ) : (
                    <div className="divide-y divide-zinc-800/40">
                      {driveFiles.map((file) => (
                        <div
                          key={file.id}
                          className="py-3 flex items-center justify-between gap-3 hover:bg-blue-500/5 px-2 rounded-xl transition-colors"
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                              <FileText size={18} />
                            </div>
                            <div className="truncate">
                              <p className="text-xs sm:text-sm font-medium truncate">{file.name}</p>
                              <p className="text-[11px] text-zinc-500">{file.mimeType}</p>
                            </div>
                          </div>
                          {file.webViewLink && (
                            <a
                              href={file.webViewLink}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-all shrink-0"
                              title="Drive'da Aç"
                            >
                              <ExternalLink size={16} />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: CALENDAR */}
              {activeTab === 'calendar' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                      {language === 'tr' ? 'Yaklaşan Etkinlikler' : 'Upcoming Events'}
                    </h4>
                    <button
                      onClick={() => setShowEventForm(!showEventForm)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-sm"
                    >
                      <Plus size={14} />
                      <span>{language === 'tr' ? 'Etkinlik Ekle' : 'Add Event'}</span>
                    </button>
                  </div>

                  {showEventForm && (
                    <form
                      onSubmit={handleRequestCreateEvent}
                      className={`p-4 rounded-2xl border space-y-3 ${
                        theme === 'dark' ? 'bg-[#18191e] border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                      }`}
                    >
                      <h5 className="text-xs font-bold text-blue-400">
                        {language === 'tr' ? 'Yeni Takvim Etkinliği (Onaylı)' : 'New Calendar Event (Confirmed)'}
                      </h5>
                      <input
                        type="text"
                        required
                        value={newEventSummary}
                        onChange={(e) => setNewEventSummary(e.target.value)}
                        placeholder={language === 'tr' ? 'Etkinlik Başlığı (örn: Proje Toplantısı)' : 'Event Title'}
                        className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${
                          theme === 'dark' ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-zinc-300'
                        }`}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="date"
                          required
                          value={newEventDate}
                          onChange={(e) => setNewEventDate(e.target.value)}
                          className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${
                            theme === 'dark' ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-zinc-300'
                          }`}
                        />
                        <input
                          type="time"
                          value={newEventTime}
                          onChange={(e) => setNewEventTime(e.target.value)}
                          className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${
                            theme === 'dark' ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-zinc-300'
                          }`}
                        />
                      </div>
                      <input
                        type="text"
                        value={newEventLocation}
                        onChange={(e) => setNewEventLocation(e.target.value)}
                        placeholder={language === 'tr' ? 'Konum (Opsiyonel)' : 'Location (Optional)'}
                        className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${
                          theme === 'dark' ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-zinc-300'
                        }`}
                      />
                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowEventForm(false)}
                          className="px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-400 hover:text-white"
                        >
                          {language === 'tr' ? 'İptal' : 'Cancel'}
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white"
                        >
                          {language === 'tr' ? 'Kaydet & Onayla' : 'Save & Confirm'}
                        </button>
                      </div>
                    </form>
                  )}

                  {isLoading ? (
                    <div className="py-12 flex justify-center">
                      <RefreshCw size={24} className="animate-spin text-blue-500" />
                    </div>
                  ) : calendarEvents.length === 0 ? (
                    <div className="py-12 text-center text-xs text-zinc-500">
                      {language === 'tr' ? 'Yaklaşan etkinlik bulunamadı.' : 'No upcoming events found.'}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {calendarEvents.map((event) => (
                        <div
                          key={event.id}
                          className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                            theme === 'dark' ? 'bg-[#16171b] border-zinc-800/80' : 'bg-zinc-50 border-zinc-200'
                          }`}
                        >
                          <div className="space-y-1">
                            <p className="text-xs sm:text-sm font-semibold">{event.summary}</p>
                            <div className="flex items-center gap-3 text-[11px] text-zinc-400">
                              <span className="flex items-center gap-1">
                                <Clock size={12} />
                                {event.start.dateTime
                                  ? new Date(event.start.dateTime).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })
                                  : event.start.date || 'Tüm Gün'}
                              </span>
                              {event.location && (
                                <span className="flex items-center gap-1 truncate max-w-[150px]">
                                  <MapPin size={12} />
                                  {event.location}
                                </span>
                              )}
                            </div>
                          </div>
                          {event.htmlLink && (
                            <a
                              href={event.htmlLink}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-all shrink-0"
                            >
                              <ExternalLink size={16} />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: TASKS */}
              {activeTab === 'tasks' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                      {language === 'tr' ? 'Görev Listesi' : 'Task List'}
                    </h4>
                    <button
                      onClick={() => setShowTaskForm(!showTaskForm)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-sm"
                    >
                      <Plus size={14} />
                      <span>{language === 'tr' ? 'Görev Ekle' : 'Add Task'}</span>
                    </button>
                  </div>

                  {showTaskForm && (
                    <form
                      onSubmit={handleRequestCreateTask}
                      className={`p-4 rounded-2xl border space-y-3 ${
                        theme === 'dark' ? 'bg-[#18191e] border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                      }`}
                    >
                      <h5 className="text-xs font-bold text-emerald-400">
                        {language === 'tr' ? 'Yeni Görev Ekle (Onaylı)' : 'New Task (Confirmed)'}
                      </h5>
                      <input
                        type="text"
                        required
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder={language === 'tr' ? 'Görev başlığı' : 'Task title'}
                        className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${
                          theme === 'dark' ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-zinc-300'
                        }`}
                      />
                      <textarea
                        rows={2}
                        value={newTaskNotes}
                        onChange={(e) => setNewTaskNotes(e.target.value)}
                        placeholder={language === 'tr' ? 'Notlar (Opsiyonel)' : 'Notes (Optional)'}
                        className={`w-full px-3 py-2 rounded-xl text-xs border outline-none resize-none ${
                          theme === 'dark' ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-zinc-300'
                        }`}
                      />
                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowTaskForm(false)}
                          className="px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-400 hover:text-white"
                        >
                          {language === 'tr' ? 'İptal' : 'Cancel'}
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white"
                        >
                          {language === 'tr' ? 'Kaydet & Onayla' : 'Save & Confirm'}
                        </button>
                      </div>
                    </form>
                  )}

                  {isLoading ? (
                    <div className="py-12 flex justify-center">
                      <RefreshCw size={24} className="animate-spin text-emerald-500" />
                    </div>
                  ) : tasks.length === 0 ? (
                    <div className="py-12 text-center text-xs text-zinc-500">
                      {language === 'tr' ? 'Görev bulunamadı.' : 'No tasks found.'}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {tasks.map((task) => (
                        <div
                          key={task.id}
                          className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                            theme === 'dark' ? 'bg-[#16171b] border-zinc-800/80' : 'bg-zinc-50 border-zinc-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-5 h-5 rounded-lg border flex items-center justify-center ${
                                task.status === 'completed'
                                  ? 'bg-emerald-500 border-emerald-500 text-white'
                                  : 'border-zinc-500'
                              }`}
                            >
                              {task.status === 'completed' && <Check size={12} />}
                            </div>
                            <div>
                              <p
                                className={`text-xs sm:text-sm font-medium ${
                                  task.status === 'completed' ? 'line-through text-zinc-500' : ''
                                }`}
                              >
                                {task.title}
                              </p>
                              {task.notes && (
                                <p className="text-[11px] text-zinc-400 line-clamp-1">{task.notes}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: CONTACTS */}
              {activeTab === 'contacts' && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    {language === 'tr' ? 'Kayıtlı Kişiler' : 'Saved Contacts'}
                  </h4>

                  {isLoading ? (
                    <div className="py-12 flex justify-center">
                      <RefreshCw size={24} className="animate-spin text-purple-500" />
                    </div>
                  ) : contacts.length === 0 ? (
                    <div className="py-12 text-center text-xs text-zinc-500">
                      {language === 'tr' ? 'Kişi bulunamadı.' : 'No contacts found.'}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {contacts.map((contact, cIdx) => (
                        <div
                          key={cIdx}
                          className={`p-3 rounded-2xl border flex items-center gap-3 ${
                            theme === 'dark' ? 'bg-[#16171b] border-zinc-800/80' : 'bg-zinc-50 border-zinc-200'
                          }`}
                        >
                          {contact.photoUrl ? (
                            <img
                              src={contact.photoUrl}
                              alt={contact.displayName}
                              className="w-10 h-10 rounded-full object-cover border border-zinc-700 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold text-sm shrink-0">
                              {contact.displayName.charAt(0)}
                            </div>
                          )}
                          <div className="truncate">
                            <p className="text-xs sm:text-sm font-semibold truncate">{contact.displayName}</p>
                            {contact.email && (
                              <p className="text-[11px] text-zinc-400 flex items-center gap-1 truncate">
                                <Mail size={11} className="shrink-0" />
                                {contact.email}
                              </p>
                            )}
                            {contact.phone && (
                              <p className="text-[11px] text-zinc-500 flex items-center gap-1 truncate">
                                <Phone size={11} className="shrink-0" />
                                {contact.phone}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Confirmation Dialog for Destructive / Mutating operations (MANDATORY RULE) */}
        {pendingAction && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
            <div
              className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl space-y-4 ${
                theme === 'dark' ? 'bg-[#1a1b20] border-zinc-700 text-white' : 'bg-white border-zinc-200 text-zinc-900'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                <AlertCircle size={24} />
              </div>
              <div>
                <h4 className="text-base font-bold">{pendingAction.title}</h4>
                <p className={`text-xs mt-1 leading-relaxed ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600'}`}>
                  {language === 'tr'
                    ? 'Google hesabınızda aşağıdaki veriyi değiştirmek/eklemek üzeresiniz:'
                    : 'You are about to mutate data in your Google Account:'}
                </p>
                <div
                  className={`mt-2 p-3 rounded-xl border text-xs font-mono break-all ${
                    theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-300' : 'bg-zinc-100 border-zinc-200 text-zinc-800'
                  }`}
                >
                  {pendingAction.details}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPendingAction(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white"
                >
                  {language === 'tr' ? 'Vazgeç' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const act = pendingAction;
                    setPendingAction(null);
                    if (act) {
                      await act.onConfirm();
                    }
                  }}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md"
                >
                  {language === 'tr' ? 'Onayla ve Uygula' : 'Confirm & Apply'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
