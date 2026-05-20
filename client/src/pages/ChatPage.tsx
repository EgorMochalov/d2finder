import { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import AvatarImg from '../components/AvatarImg';
import { useAuth } from '../lib/auth';
import { useI18n } from '../lib/i18n';
import { useToast } from '../components/Toast';
import { getSocket } from '../lib/socket';
import { useUnread } from '../lib/unread';
import { MessageCircle, Send, Info, X, Ban, Unlock, ChevronRight, Menu } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import Modal from '../components/Modal';

export default function ChatPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();
  const { unread, markRead, setActiveChatId } = useUnread();
  const [searchParams, setSearchParams] = useSearchParams();
  const [contacts, setContacts] = useState<any[]>([]);
  const [teamChats, setTeamChats] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<{ id: string; type: 'PRIVATE' | 'TEAM'; name: string } | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [showList, setShowList] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const [chatInfo, setChatInfo] = useState<any>(null);
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [showBlock, setShowBlock] = useState<string | null>(null);
  const msgsRef = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (!user) return;
    loadContacts(); loadBlocked();
    loaded.current = true;
    return () => setActiveChatId(null);
  }, [user]);

  useEffect(() => {
    if (!user || !loaded.current) return;
    const uid = searchParams.get('user');
    if (uid) { openPrivateChat(uid); setSearchParams({}, { replace: true }); }
  }, [searchParams, user]);

  useEffect(() => { msgsRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !user) return;
    const handler = (msg: any) => {
      if (activeChat && msg.chatId === activeChat.id) setMessages((prev) => [...prev, msg]);
      if (msg.chatType === 'PRIVATE' && msg.senderId !== user.id) {
        setContacts((prev) => prev.some((c) => c.userId === msg.senderId) ? prev : [{ userId: msg.senderId, username: msg.sender?.username || 'User', lastMessage: msg.content }, ...prev]);
      }
    };
    socket.on('message:new', handler);
    return () => { socket.off('message:new', handler); };
  }, [activeChat, user]);

  async function loadContacts() {
    try {
      const [cc, all] = await Promise.all([api.chats.contacts(), api.teams.list()]);
      setContacts(cc);
      setTeamChats(all.filter((t: any) => t.members?.some((m: any) => m.userId === user!.id)));
    } catch (err: any) { toast('error', err.message); }
  }
  async function loadBlocked() { try { const b = await api.blocks.list(); setBlockedUsers(b.map((x: any) => x.blocked)); } catch {} }

  async function openPrivateChat(uid: string) {
    try {
      const [data, info] = await Promise.all([api.chats.private(uid), api.users.get(uid)]);
      const socket = getSocket();
      if (activeChat) socket?.emit('leave:chat', activeChat.id);
      socket?.emit('join:chat', data.chatId);
      const name = info?.username || data.otherUserId;
      setActiveChat({ id: data.chatId, type: 'PRIVATE', name });
      setMessages(data.messages); setShowList(false); setShowInfo(false);
      setChatInfo({ type: 'PRIVATE', otherUserId: data.otherUserId, username: name, avatarUrl: info?.avatarUrl });
      markRead(data.otherUserId);
      setActiveChatId(data.otherUserId);
      setContacts((prev) => {
        if (prev.some((c) => c.userId === uid)) return prev;
        const last = data.messages?.[data.messages.length - 1];
        return [{ userId: uid, username: name, lastMessage: last?.content || '' }, ...prev];
      });
    } catch (err: any) { toast('error', err.message); }
  }

  async function openTeamChat(tid: string, tname: string) {
    const cid = `team:${tid}`;
    const socket = getSocket();
    if (activeChat) socket?.emit('leave:chat', activeChat.id);
    socket?.emit('join:chat', cid);
    setActiveChat({ id: cid, type: 'TEAM', name: tname });
    markRead(cid);
    setActiveChatId(cid);
    try {
      const [team, chat] = await Promise.all([api.teams.get(tid), api.chats.team(tid)]);
      setChatInfo({ type: 'TEAM', team }); setMessages(chat.messages); setShowList(false); setShowInfo(false);
    } catch (err: any) {
      toast('error', err.message);
      setActiveChat(null);
      setActiveChatId(null);
    }
  }

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !activeChat) return;
    getSocket()?.emit('message:send', { chatType: activeChat.type, chatId: activeChat.id, content: input.trim() });
    if (activeChat.type === 'PRIVATE' && chatInfo?.otherUserId) {
      setContacts((prev) => prev.some((c) => c.userId === chatInfo.otherUserId) ? prev : [{ userId: chatInfo.otherUserId, username: chatInfo.username, lastMessage: input.trim() }, ...prev]);
    }
    setInput('');
  }

  async function handleBlock(uid: string) { try { await api.blocks.block(uid); loadBlocked(); setShowBlock(null); toast('success', t('chat.blocked')); } catch (err: any) { toast('error', err.message); } }
  async function handleUnblock(uid: string) { try { await api.blocks.unblock(uid); loadBlocked(); toast('success', t('chat.unblocked')); } catch (err: any) { toast('error', err.message); } }

  const oid = chatInfo?.type === 'PRIVATE' ? chatInfo.otherUserId : null;
  const isBlocked = oid ? blockedUsers.some((b: any) => b.id === oid) : false;

  if (!user) return <div className="max-w-sm mx-auto px-4 py-24 text-center"><MessageCircle size={40} className="mx-auto mb-4 opacity-30" /><p className="text-muted text-sm mb-4">{t('chat.signin')}</p><Link to="/login" className="btn-primary px-6 py-2 rounded-xl text-sm">{t('nav.signin')}</Link></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <Helmet>
        <title>Chat — Dota 2 Finder</title>
        <meta property="og:title" content="Chat — Dota 2 Finder" />
      </Helmet>
      <div className="glass rounded-2xl overflow-hidden" style={{ height: 'calc(100vh - 120px)' }}>
        <div className="flex h-full relative">
          {/* Drawer backdrop */}
          {showList && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-10" onClick={() => setShowList(false)} />}

          {/* Full contact list drawer - slides from left */}
          <div data-tour="chat-sidebar" className={`fixed left-0 top-0 bottom-0 z-20 w-72 shrink-0 border-r border-white/5 flex flex-col bg-surface transition-transform duration-300 ${
            showList ? 'translate-x-0' : '-translate-x-full'
          }`}>
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-text font-semibold text-sm flex items-center gap-2"><MessageCircle size={16} /> {t('chat.title')}</h2>
              <button onClick={() => setShowList(false)} className="text-muted hover:text-text p-1"><X size={16} /></button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {teamChats.length > 0 && <div className="px-3 pt-3 pb-1"><p className="text-muted text-[10px] uppercase tracking-wider font-semibold px-2">{t('chat.team')}</p></div>}
              {teamChats.map((chat: any) => (
                  <button key={chat.id} onClick={() => openTeamChat(chat.id, chat.name)} className={`w-full flex items-center gap-3 px-4 py-3 transition glass-hover relative ${activeChat?.id === `team:${chat.id}` ? 'bg-surface-hover before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[3px] before:rounded-full before:bg-accent' : ''}`}>
                  <AvatarImg src={chat.logoUrl} alt={chat.tag} className="w-9 h-9 text-xs font-bold shrink-0" square />
                  <div className="min-w-0 flex-1 text-left"><p className="text-text text-sm font-medium truncate">{chat.name}</p><p className="text-muted text-xs">{chat._count?.members || chat.members?.length || 0} {t('common.members')}</p></div>
                  <ChevronRight size={14} className="text-muted shrink-0" />
                  {unread[`team:${chat.id}`] > 0 && <span className="w-5 h-5 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center shrink-0">{unread[`team:${chat.id}`]}</span>}
                </button>
              ))}
              {contacts.length > 0 && <div className="px-3 pt-4 pb-1"><p className="text-muted text-[10px] uppercase tracking-wider font-semibold px-2">{t('chat.direct')}</p></div>}
              {contacts.map((c: any) => (
                <button key={c.userId} onClick={() => openPrivateChat(c.userId)} className={`w-full flex items-center gap-3 px-4 py-3 transition glass-hover relative ${activeChat?.name === c.username ? 'bg-surface-hover before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[3px] before:rounded-full before:bg-accent' : ''}`}>
                  <AvatarImg src={c.avatarUrl} alt={c.username || ''} className="w-9 h-9 text-sm shrink-0" />
                  <div className="min-w-0 flex-1 text-left"><p className="text-text text-sm font-medium truncate">{c.username}</p><p className="text-muted text-xs truncate">{c.lastMessage}</p></div>
                  <ChevronRight size={14} className="text-muted shrink-0" />
                  {unread[c.userId] > 0 && <span className="w-5 h-5 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center shrink-0">{unread[c.userId]}</span>}
                </button>
              ))}
              {teamChats.length === 0 && contacts.length === 0 && <div className="text-center py-12 text-muted text-sm px-4">{t('chat.no_contacts')}</div>}
            </div>
          </div>

          {/* Compact strip - always visible when drawer closed */}
          {!showList && (teamChats.length > 0 || contacts.length > 0) && (
            <div data-tour="chat-sidebar" className="flex flex-col shrink-0 border-r border-white/5 overflow-y-auto py-2 w-14 items-center">
              <button onClick={() => setShowList(true)} className="w-9 h-9 rounded-xl glass-strong flex items-center justify-center text-muted hover:text-text transition mb-2 shrink-0">
                <Menu size={16} />
              </button>
              {teamChats.map((chat: any) => (
                <button key={chat.id} onClick={() => openTeamChat(chat.id, chat.name)} className={`relative mb-1.5 shrink-0 ${activeChat?.id === `team:${chat.id}` ? 'ring-2 ring-accent' : ''}`}
                  title={chat.name}><AvatarImg src={chat.logoUrl} alt={chat.name} className="w-9 h-9 text-[10px] font-bold" square />{unread[`team:${chat.id}`] > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent text-white text-[9px] font-bold flex items-center justify-center shadow-glow">{unread[`team:${chat.id}`]}</span>}</button>
              ))}
              {teamChats.length > 0 && contacts.length > 0 && <div className="w-6 h-px bg-white/10 my-1 shrink-0" />}
              {contacts.map((c: any) => (
                <button key={c.userId} onClick={() => openPrivateChat(c.userId)} className={`relative mb-1.5 shrink-0 ${activeChat?.name === c.username ? 'ring-2 ring-accent' : ''}`}
                  title={c.username}><AvatarImg src={c.avatarUrl} alt={c.username || ''} className="w-9 h-9 text-[10px]" />{unread[c.userId] > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent text-white text-[9px] font-bold flex items-center justify-center shadow-glow">{unread[c.userId]}</span>}</button>
              ))}
            </div>
          )}

          {/* Chat area */}
          {activeChat ? (
            <div className="flex-1 flex flex-col min-w-0 relative">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="min-w-0"><p className="text-text font-semibold text-sm truncate">{activeChat.name}</p><p className="text-muted text-xs">{activeChat.type === 'TEAM' ? t('chat.team') : t('chat.direct')}</p></div>
                </div>
                <button onClick={() => setShowInfo((v) => !v)} className="w-8 h-8 rounded-full glass-strong flex items-center justify-center text-muted hover:text-accent transition hover:scale-105 shrink-0"><Info size={16} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && <div className="text-center py-12 text-muted text-sm">{t('chat.empty')}</div>}
                {messages.map((msg: any) => (
                  <div key={msg.id} className={`flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${msg.senderId === user.id ? 'bg-accent-dim border border-accent/20' : 'glass-strong'}`}>
                      {msg.senderId !== user.id && <Link to={`/profile/${msg.senderId}`} className="text-[11px] text-muted mb-0.5 font-medium block hover:text-accent transition">{msg.sender?.username || 'Unknown'}</Link>}
                      <p className="text-text text-sm">{msg.content}</p>
                      <p className="text-[10px] text-muted/50 mt-1 text-right">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                ))}
                <div ref={msgsRef} />
              </div>
              <form onSubmit={handleSend} className="p-4 border-t border-white/5 flex gap-2">
                <input data-tour="chat-input" type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder={isBlocked ? t('chat.blocked_placeholder') : t('chat.placeholder')} disabled={isBlocked} className="glass-input flex-1 rounded-xl px-4 py-2.5 text-sm" />
                <button type="submit" disabled={isBlocked || !input.trim()} className="btn-primary p-2.5 rounded-xl disabled:opacity-30"><Send size={18} /></button>
              </form>
            </div>
          ) : (
            <div className="flex-1 items-center justify-center text-muted flex">
              <div className="text-center"><MessageCircle size={40} className="mx-auto mb-3 opacity-30" /><p className="text-sm">{t('chat.none')}</p></div>
            </div>
          )}

          {/* Info panel - overlay on top of chat */}
          {showInfo && chatInfo && <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden" onClick={() => setShowInfo(false)} />
            <div className="absolute right-0 top-0 bottom-0 z-20 w-full md:w-72 border-l border-white/5 glass-strong overflow-y-auto p-5">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-text font-semibold flex items-center gap-2 text-sm"><Info size={15} /> {t('chat.info')}</h3>
                <button onClick={() => setShowInfo(false)} className="w-7 h-7 rounded-full glass-strong flex items-center justify-center text-muted hover:text-text transition shrink-0"><X size={14} /></button>
              </div>
              {chatInfo.type === 'TEAM' && chatInfo.team && (
                <div className="space-y-5">
                  <div className="flex items-center gap-3"><AvatarImg src={chatInfo.team.logoUrl} alt={chatInfo.team.tag} className="w-12 h-12 text-lg" square /><div className="min-w-0"><p className="text-text font-medium text-sm truncate">{chatInfo.team.name}</p><p className="text-muted text-xs">{t('teams.captain')}: {chatInfo.team.captain?.username}</p></div></div>
                  <div className="border-t border-white/5 pt-4"><p className="text-muted text-xs font-semibold uppercase tracking-wider mb-3">{t('teams.members')} ({chatInfo.team.members?.length || 0})</p><div className="space-y-1">{chatInfo.team.members?.map((m: any) => <Link key={m.id} to={`/profile/${m.userId}`} onClick={() => setShowInfo(false)} className="flex items-center gap-2 p-2 rounded-lg glass-hover"><AvatarImg src={m.user?.avatarUrl} alt={m.user?.username || ''} className="w-8 h-8 text-xs" /><span className="text-text text-sm">{m.user?.username}</span></Link>)}</div></div>
                </div>
              )}
              {chatInfo.type === 'PRIVATE' && (
                <div className="space-y-5">
                  <Link to={`/profile/${oid}`} onClick={() => setShowInfo(false)} className="flex items-center gap-3 glass-hover p-2 rounded-xl -mx-2">
                    <AvatarImg src={chatInfo.avatarUrl} alt={chatInfo.username || ''} className="w-12 h-12 text-lg shrink-0" />
                    <p className="text-text font-medium text-sm">{chatInfo.username}</p>
                  </Link>
                  <div className="border-t border-white/5 pt-4 space-y-2">
                    {isBlocked ? <button onClick={() => handleUnblock(oid!)} className="btn-ghost w-full py-2 rounded-xl text-sm flex items-center justify-center gap-2 text-green border-green/20 hover:bg-green-dim"><Unlock size={15} /> {t('chat.unblock')}</button>
                    : <button onClick={() => setShowBlock(oid!)} className="btn-ghost w-full py-2 rounded-xl text-sm flex items-center justify-center gap-2 text-accent border-accent/20 hover:bg-accent-dim"><Ban size={15} /> {t('chat.block')}</button>}
                  </div>
                </div>
              )}
            </div>
          </>}
        </div>
      </div>
      <Modal open={!!showBlock} onClose={() => setShowBlock(null)} title={t('chat.block')}>
        <p className="text-muted text-sm mb-5">{t('chat.block_confirm')}</p>
        <div className="flex gap-3"><button onClick={() => { if (showBlock) handleBlock(showBlock); }} className="btn-primary flex-1 py-2.5 rounded-xl text-sm">{t('chat.block')}</button><button onClick={() => setShowBlock(null)} className="btn-ghost px-4 py-2.5 rounded-xl text-sm">{t('common.cancel')}</button></div>
      </Modal>
    </div>
  );
}
