import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useI18n } from '../lib/i18n';
import { X, Check, ArrowRight, Shield, Search, Users, MessageCircle, Swords, UserPlus, Settings, Edit3, Send, MousePointerClick, Ghost, ClipboardList } from 'lucide-react';

const PROGRESS_KEY = 'tour_progress_v3';
const COMPLETED_KEY = 'tour_completed_v1';

interface StepDef {
  icon: typeof Shield;
  target?: string;
  titleKey: string;
  descKey: string;
  hintKey?: string;
  trigger?: 'click' | 'enter' | 'next' | 'input';
  minInput?: number;
  side?: 'top' | 'bottom' | 'left' | 'right';
  waitForTarget?: string;
  modalTarget?: string;
}

interface GroupDef {
  page: string;
  steps: StepDef[];
}

const groups: GroupDef[] = [
  {
    page: '*',
    steps: [
      { icon: Shield, titleKey: 'tour.welcome', descKey: 'tour.welcome_desc', trigger: 'next' },
    ],
  },
  {
    page: '/profile',
    steps: [
      { icon: Shield, target: '[data-tour="looking-toggle"]', side: 'right', titleKey: 'tour.step_looking', descKey: 'tour.step_looking_desc', hintKey: 'tour.step_looking_hint', trigger: 'click' },
      { icon: Settings, titleKey: 'tour.step_profile', descKey: 'tour.step_profile_desc', trigger: 'next' },
    ],
  },
  {
    page: '/search',
    steps: [
      { icon: Search, target: '[data-tour="search-filters"]', side: 'right', titleKey: 'tour.step_search_filters', descKey: 'tour.step_search_filters_desc', hintKey: 'tour.step_search_filters_hint', trigger: 'click' },
      { icon: Search, titleKey: 'tour.step_search_results', descKey: 'tour.step_search_results_desc', trigger: 'next' },
      { icon: MousePointerClick, titleKey: 'tour.step_player_card', descKey: 'tour.step_player_card_desc', trigger: 'next' },
    ],
  },
  {
    page: '/teams',
    steps: [
      { icon: Users, target: '[data-tour="create-team"]', side: 'bottom', titleKey: 'tour.step_create_btn', descKey: 'tour.step_create_btn_desc', hintKey: 'tour.step_create_btn_hint', trigger: 'click', modalTarget: '[data-tour="team-modal"]' },
      { icon: Edit3, target: '[data-tour="team-name-input"]', side: 'bottom', titleKey: 'tour.step_team_name', descKey: 'tour.step_team_name_desc', hintKey: 'tour.step_team_name_hint', trigger: 'input', minInput: 2, waitForTarget: '[data-tour="team-name-input"]', modalTarget: '[data-tour="team-modal"]' },
      { icon: Edit3, target: '[data-tour="team-tag-input"]', side: 'bottom', titleKey: 'tour.step_team_tag', descKey: 'tour.step_team_tag_desc', hintKey: 'tour.step_team_tag_hint', trigger: 'input', minInput: 2, waitForTarget: '[data-tour="team-tag-input"]', modalTarget: '[data-tour="team-modal"]' },
      { icon: Send, target: '[data-tour="team-submit-btn"]', side: 'bottom', titleKey: 'tour.step_team_submit', descKey: 'tour.step_team_submit_desc', hintKey: 'tour.step_team_submit_hint', trigger: 'click', modalTarget: '[data-tour="team-modal"]' },
      { icon: Users, target: '[data-tour="team-card-mine"]', side: 'bottom', titleKey: 'tour.step_team_click', descKey: 'tour.step_team_click_desc', hintKey: 'tour.step_team_click_hint', trigger: 'click' },
    ],
  },
  {
    page: '/team-detail',
    steps: [
      { icon: Users, titleKey: 'tour.step_team_done', descKey: 'tour.step_team_done_desc', trigger: 'next' },
      { icon: ClipboardList, titleKey: 'tour.step_team_requests', descKey: 'tour.step_team_requests_desc', trigger: 'next' },
      { icon: UserPlus, titleKey: 'tour.step_team_invite', descKey: 'tour.step_team_invite_desc', trigger: 'next' },
    ],
  },
  {
    page: '/chat',
    steps: [
      { icon: MessageCircle, target: '[data-tour="chat-sidebar"]', side: 'right', titleKey: 'tour.step_chat_sidebar', descKey: 'tour.step_chat_sidebar_desc', hintKey: 'tour.step_chat_sidebar_hint', trigger: 'click' },
      { icon: MessageCircle, target: '[data-tour="chat-input"]', side: 'top', titleKey: 'tour.step_chat_message', descKey: 'tour.step_chat_message_desc', hintKey: 'tour.step_chat_message_hint', trigger: 'enter' },
      { icon: MessageCircle, titleKey: 'tour.step_chat_done', descKey: 'tour.step_chat_done_desc', trigger: 'next' },
    ],
  },
  {
    page: '/clanwars',
    steps: [
      { icon: Swords, titleKey: 'tour.step_clanwars', descKey: 'tour.step_clanwars_desc', trigger: 'next' },
      { icon: Swords, titleKey: 'tour.step_clanwars_post', descKey: 'tour.step_clanwars_post_desc', trigger: 'next' },
    ],
  },
  {
    page: '/draft',
    steps: [
      { icon: Ghost, titleKey: 'tour.step_draft', descKey: 'tour.step_draft_desc', trigger: 'next' },
      { icon: Ghost, titleKey: 'tour.step_draft_use', descKey: 'tour.step_draft_use_desc', trigger: 'next' },
    ],
  },
];

function getPageGroup(path: string): string {
  if (/^\/teams\/[^/]+$/.test(path)) return '/team-detail';
  return path;
}

function loadAllProgress(): Record<string, boolean[]> {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch { return {}; }
}

function saveAllProgress(p: Record<string, boolean[]>) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
}

function getGroupIds(): string[] {
  return groups.map((g) => g.page);
}

export default function Tour() {
  const { t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();

  const pageGroup = getPageGroup(location.pathname);
  const [allProgress, setAllProgress] = useState<Record<string, boolean[]>>(() => {
    if (localStorage.getItem(COMPLETED_KEY) === 'true') return {};
    const saved = loadAllProgress();
    getGroupIds().forEach((gid) => { if (!saved[gid]) saved[gid] = groups.find((g) => g.page === gid)!.steps.map(() => false); });
    return saved;
  });
  const [completed, setCompleted] = useState(() => localStorage.getItem(COMPLETED_KEY) === 'true');

  const welcomeIncomplete = !allProgress['*']?.every(Boolean);
  const groupIdx = welcomeIncomplete ? 0 : groups.findIndex((g) => g.page === pageGroup);
  const group = groupIdx >= 0 ? groups[groupIdx] : null;
  const groupSteps = group?.steps || [];
  const groupProgress = group ? (allProgress[group.page] || groupSteps.map(() => false)) : [];
  const pendingIdx = groupProgress.findIndex((p) => !p);
  const allDone = group ? groupProgress.every(Boolean) : true;

  const [er, setEr] = useState<DOMRect | null>(null);
  const [done, setDone] = useState(false);

  const step = pendingIdx >= 0 && group ? groupSteps[pendingIdx] : null;
  const hasTarget = step && !!step.target;
  const ready = !hasTarget || !!er;

  const isNextTrigger = step?.trigger === 'next';

  const hasChats = pageGroup === '/chat' &&
    document.querySelectorAll('[data-tour="chat-sidebar"] button[title]').length > 0;

  function updateProgress(gid: string, idx: number) {
    const p = loadAllProgress();
    getGroupIds().forEach((gid2) => { if (!p[gid2]) p[gid2] = groups.find((g) => g.page === gid2)!.steps.map(() => false); });
    if (p[gid]) p[gid][idx] = true;
    saveAllProgress(p);
    setAllProgress(p);
    checkAllDone(p);
  }

  function checkAllDone(p: Record<string, boolean[]>) {
    const allDone = groups.every((g) => {
      const prog = p[g.page];
      return prog && prog.every(Boolean);
    });
    if (allDone) {
      localStorage.setItem(COMPLETED_KEY, 'true');
      setCompleted(true);
    }
  }

  function skipFrom(gid: string, fromIdx: number) {
    const p = loadAllProgress();
    getGroupIds().forEach((gid2) => { if (!p[gid2]) p[gid2] = groups.find((g) => g.page === gid2)!.steps.map(() => false); });
    if (p[gid]) for (let i = fromIdx; i < p[gid].length; i++) p[gid][i] = true;
    saveAllProgress(p);
    setAllProgress(p);
    checkAllDone(p);
  }

  const advance = useCallback(() => {
    if (!group) return;
    const idx = pendingIdx;
    updateProgress(group.page, idx);
    setDone(false);
    setEr(null);
  }, [group, pendingIdx]);

  function closeGroup() {
    if (!group) return;
    skipFrom(group.page, pendingIdx);
    setDone(false);
    setEr(null);
    localStorage.setItem(COMPLETED_KEY, 'true');
    setCompleted(true);
  }

  function skipStep() {
    if (!group) return;
    updateProgress(group.page, pendingIdx);
    setDone(false);
    setEr(null);
  }

  const measure = useCallback(() => {
    if (!step?.target) { setEr(null); return; }
    const el = document.querySelector(step.target) as HTMLElement;
    if (el && (el.offsetParent !== null || step.trigger === 'input' || step.trigger === 'next')) {
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      requestAnimationFrame(() => setEr(el.getBoundingClientRect()));
    } else { setEr(null); }
  }, [step?.target, step?.trigger]);

  useEffect(() => { setDone(false); setEr(null); }, [pendingIdx, pageGroup]);

  useEffect(() => {
    if (!step || !step.target) return;
    const to = setTimeout(() => measure(), 300);
    return () => clearTimeout(to);
  }, [step?.target, step?.titleKey, measure]);

  useEffect(() => {
    if (!step?.waitForTarget) return;
    const interval = setInterval(() => {
      const el = document.querySelector(step.waitForTarget!);
      if (el) {
        clearInterval(interval);
        setTimeout(() => measure(), 200);
      }
    }, 200);
    return () => clearInterval(interval);
  }, [step?.waitForTarget, step?.target, measure]);

  useEffect(() => {
    if (!step?.target) return;
    window.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure, { passive: true });
    return () => { window.removeEventListener('scroll', measure); window.removeEventListener('resize', measure); };
  }, [measure, !!step?.target]);

  // Auto-skip modal-dependent steps when modal closes
  useEffect(() => {
    if (!step?.modalTarget || !step.target) return;
    if (step.trigger === 'click' && done) return;
    const interval = setInterval(() => {
      const modal = document.querySelector(step.modalTarget!);
      if (!modal) {
        clearInterval(interval);
        if (group) skipFrom(group.page, pendingIdx);
      }
    }, 300);
    return () => clearInterval(interval);
  }, [step?.modalTarget, step?.target, step?.trigger, done, pendingIdx, group]);

  useEffect(() => {
    if (!step || !step.trigger || done) return;
    if (step.trigger === 'next') return;
    const st = step!;
    const idx = pendingIdx;

    function onClick(e: MouseEvent) {
      if (st.trigger !== 'click') return;
      const el = st.target ? document.querySelector(st.target) : null;
      if (!el || !el.contains(e.target as Node)) return;
      setDone(true);
      setTimeout(() => { advance(); }, 500);
    }

    function onKeyDown(e: KeyboardEvent) {
      if (st.trigger !== 'enter') return;
      if (e.key !== 'Enter') return;
      const el = st.target ? document.querySelector(st.target) as HTMLInputElement | null : null;
      if (!el || !el.contains(e.target as Node)) return;
      if (!el.value.trim()) return;
      setDone(true);
      setTimeout(() => { advance(); }, 500);
    }

    function onInput(e: Event) {
      if (st.trigger !== 'input') return;
      const el = e.target as HTMLInputElement;
      if (!el.matches(st.target || '')) return;
      const min = st.minInput || 1;
      if (el.value.trim().length < min) return;
      setDone(true);
      setTimeout(() => { advance(); }, 500);
    }

    document.addEventListener('click', onClick, { capture: true });
    document.addEventListener('keydown', onKeyDown, { capture: true });
    document.addEventListener('input', onInput, { capture: true });
    return () => {
      document.removeEventListener('click', onClick, { capture: true });
      document.removeEventListener('keydown', onKeyDown, { capture: true });
      document.removeEventListener('input', onInput, { capture: true });
    };
  }, [step, done, pendingIdx, advance]);

  if (completed || allDone || !step || !group) return null;

  const chatNoContacts = pageGroup === '/chat' && pendingIdx === 0 && !hasChats;

  const totalDone = groupProgress.filter(Boolean).length;
  const total = groupSteps.length;

  const CARD_W = 300;
  const CARD_H = 210;
  const GAP = 14;
  let cardLeft: number | null = null;
  let cardTop: number | null = null;

  if (er && step?.side) {
    const s = step.side;
    const spaceTop = er.top;
    const spaceBottom = window.innerHeight - er.bottom;
    const spaceLeft = er.left;
    const spaceRight = window.innerWidth - er.right;
    let actualSide = s;

    // Auto-adjust if not enough space
    if (s === 'right' && spaceRight < CARD_W + GAP + 20 && spaceLeft >= spaceRight) actualSide = 'left';
    else if (s === 'left' && spaceLeft < CARD_W + GAP + 20 && spaceRight >= spaceLeft) actualSide = 'right';
    else if (s === 'bottom' && spaceBottom < CARD_H + GAP + 20 && spaceTop >= spaceBottom) actualSide = 'top';
    else if (s === 'top' && spaceTop < CARD_H + GAP + 20 && spaceBottom >= spaceTop) actualSide = 'bottom';

    switch (actualSide) {
      case 'bottom':
        cardLeft = er.left + er.width / 2 - CARD_W / 2;
        cardTop = er.bottom + GAP;
        break;
      case 'top':
        cardLeft = er.left + er.width / 2 - CARD_W / 2;
        cardTop = er.top - GAP - CARD_H;
        break;
      case 'left':
        cardLeft = er.left - GAP - CARD_W;
        cardTop = er.top + er.height / 2 - CARD_H / 2;
        break;
      case 'right':
        cardLeft = er.right + GAP;
        cardTop = er.top + er.height / 2 - CARD_H / 2;
        break;
    }
    if (cardLeft !== null) {
      cardLeft = Math.max(12, Math.min(cardLeft, window.innerWidth - CARD_W - 12));
      cardTop = Math.max(12, Math.min(cardTop, window.innerHeight - CARD_H - 12));
    }
  }

  const positioned = cardLeft !== null;

  return (
    <>
      <div className="fixed inset-0 z-[9998]" style={{ pointerEvents: 'none' }}>
        {er && step.target && (
          <div
            className="absolute rounded-xl"
            style={{
              left: er.left - 10, top: er.top - 10,
              width: er.width + 20, height: er.height + 20,
              borderRadius: 14,
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.7), 0 0 0 2px rgba(99,102,241,0.5), 0 0 20px rgba(99,102,241,0.3)',
              pointerEvents: 'none',
            }}
          />
        )}
      </div>

      {positioned ? (
        <div className="fixed z-[9999]"
          style={{ left: cardLeft!, top: cardTop!, width: CARD_W, pointerEvents: 'auto', transition: 'left 0.3s ease, top 0.3s ease' }}>
          <div className="glass-strong rounded-2xl p-5 border border-white/5 shadow-2xl animate-slide-up">
            {renderCardContent()}
          </div>
        </div>
      ) : (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none p-4">
          <div className="w-full max-w-sm pointer-events-auto animate-slide-up">
            <div className="glass-strong rounded-2xl p-6 border border-white/5 shadow-2xl">
              {renderCardContent()}
            </div>
          </div>
        </div>
      )}
    </>
  );

  function renderCardContent() {
    const st = step!;
    return (
      <>
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-accent-dim flex items-center justify-center shrink-0">
            <st.icon size={20} className="text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white/30 text-[10px] font-medium mb-0.5">
              {totalDone + (done ? 1 : 0)}/{total}
            </p>
            <p className="text-text font-bold text-sm leading-tight">{t(st.titleKey)}</p>
          </div>
          <button onClick={closeGroup} className="text-white/30 hover:text-white p-0.5 -mt-1 -mr-1 shrink-0"><X size={16} /></button>
        </div>
        <p className="text-text/70 text-xs leading-relaxed mb-3 whitespace-pre-line">
          {done
            ? <span className="text-green font-medium flex items-center gap-1"><Check size={16} className="shrink-0" /> {t('common.great')}</span>
            : chatNoContacts
              ? t('tour.chat_no_contacts')
              : t(st.descKey)}
        </p>
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-accent rounded-full transition-all duration-500"
              style={{ width: `${((totalDone + (done ? 1 : 0)) / total) * 100}%` }} />
          </div>
          <span className="text-white/30 text-[9px] font-medium tabular-nums">{totalDone + (done ? 1 : 0)}/{total}</span>
        </div>
        {done ? (
          <button onClick={advance}
            className="btn-primary w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5">
            {t('common.continue')} <ArrowRight size={14} />
          </button>
        ) : chatNoContacts ? (
          <div className="flex gap-2">
            <button onClick={() => { skipStep(); advance(); }}
              className="btn-ghost flex-1 py-2 rounded-xl text-xs">{t('common.skip')}</button>
            <button onClick={() => navigate('/search')}
              className="btn-primary flex-1 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5">
              {t('tour.search_btn')} <ArrowRight size={14} />
            </button>
          </div>
        ) : isNextTrigger ? (
          <button onClick={advance}
            className="btn-primary w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5">
            {t('common.next')} <ArrowRight size={14} />
          </button>
        ) : (
          <div className="bg-white/[0.03] border border-white/5 rounded-xl p-2.5">
            {(!ready && st.trigger !== 'input') ? (
              <p className="text-white/30 text-[11px] text-center">{t('common.loading')}</p>
            ) : st.hintKey ? (
              <p className="text-accent text-[11px] text-center font-medium">👆 {t(st.hintKey)}</p>
            ) : (
              <p className="text-white/30 text-[11px] text-center">{t('tour.do_action')}</p>
            )}
          </div>
        )}
      </>
    );
  }
}
