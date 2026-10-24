import { useEffect, useState } from 'react';
import { Environment } from '@apps-in-toss/web-framework';
import { AdBanner } from './components/AdBanner';
import { LineCard, Thought } from './components/LineCard';
import { Sheet } from './components/Sheet';
import { LINES, type Line } from './data/lines';
import { useBackHandler } from './lib/back';
import { saveCard } from './lib/card';
import { formatDate, lineForDate, pastDays, streak, todayKey } from './lib/daily';
import { isUnlocked, markOpened, toggleSaved, useJournal } from './lib/journal';
import { rewardAdsEnabled, showRewardAd } from './lib/rewardAd';
import { parseSharedDay, shareLine } from './lib/share';

type Tab = 'today' | 'past' | 'saved';

/** 지난 한 줄 목록에 보여줄 날 수 */
const PAST_DAYS = 30;

export default function App() {
  const [today] = useState(() => todayKey());
  const { journal, update } = useJournal(today);
  const [tab, setTab] = useState<Tab>('today');
  // 친구가 공유한 링크로 들어왔으면 그날의 문장부터 보여줘요.
  const [sharedDay, setSharedDay] = useState(() => {
    const d = readSharedDay();
    return d && d !== today ? d : null;
  });
  /** 시트로 펼쳐 본 문장 */
  const [opened, setOpened] = useState<{ line: Line; day: string | null } | null>(null);
  const [busyDay, setBusyDay] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  // 뒤로가기: 시트 → 공유받은 문장 → 다른 탭 순서로 닫고, 오늘 화면에서는 앱을 나가요.
  useBackHandler(tab !== 'today', () => setTab('today'));
  useBackHandler(sharedDay !== null, () => setSharedDay(null));
  useBackHandler(opened !== null, () => setOpened(null));

  const day = sharedDay ?? today;
  const line = lineForDate(day);
  const days = journal ? streak(journal.visits, today) : 0;

  function toggleSave(l: Line) {
    const wasSaved = journal?.saved.includes(l.id);
    update((j) => toggleSaved(j, l.id));
    setToast(wasSaved ? '간직함에서 뺐어요' : '간직함에 담았어요 ❤️');
  }

  async function share(l: Line, d: string) {
    const r = await shareLine(l, d);
    if (r === 'copied') setToast('링크를 복사했어요');
    if (r === 'failed') setToast('공유하지 못했어요. 잠시 후 다시 해 주세요.');
  }

  async function save(l: Line, d: string) {
    setToast('카드를 만드는 중이에요…');
    const r = await saveCard(l, d);
    setToast(r === 'saved' ? '사진으로 저장했어요 🖼️' : '저장하지 못했어요. 토스 앱을 최신으로 업데이트해 주세요.');
  }

  async function unlock(d: string) {
    if (busyDay) return;
    setBusyDay(d);
    const r = await showRewardAd();
    setBusyDay(null);
    if (r === 'skipped') {
      setToast('광고를 끝까지 보면 열려요');
      return;
    }
    update((j) => markOpened(j, d));
    setOpened({ line: lineForDate(d), day: d });
  }

  function actions(l: Line, d: string) {
    const saved = journal?.saved.includes(l.id) ?? false;
    return (
      <div className="actions">
        <button type="button" className={saved ? 'is-on' : ''} aria-pressed={saved} onClick={() => toggleSave(l)}>
          <span aria-hidden>{saved ? '❤️' : '🤍'}</span>
          간직하기
        </button>
        <button type="button" onClick={() => share(l, d)}>
          <span aria-hidden>📤</span>
          공유하기
        </button>
        <button type="button" onClick={() => save(l, d)}>
          <span aria-hidden>🖼️</span>
          이미지 저장
        </button>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="top">
        <h1>
          <span aria-hidden>📖</span> 매일 한 줄
        </h1>
        {days > 0 && (
          <span className="streak" aria-label={`${days}일 연속으로 읽었어요`}>
            🔥 {days}일째
          </span>
        )}
      </header>

      <nav className="tabs" aria-label="화면">
        {(
          [
            ['today', '오늘'],
            ['past', '지난 한 줄'],
            ['saved', '간직함'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={tab === key ? 'is-active' : ''}
            aria-current={tab === key ? 'page' : undefined}
            onClick={() => {
              setTab(key);
              if (key === 'today') setSharedDay(null);
            }}
          >
            {label}
          </button>
        ))}
      </nav>

      <main>
        {tab === 'today' && (
          <section>
            <LineCard line={line} day={day} label={sharedDay ? '친구가 보낸 한 줄' : '오늘의 한 줄'} />
            <Thought line={line} />
            {actions(line, day)}
            {sharedDay && (
              <button type="button" className="primary wide" onClick={() => setSharedDay(null)}>
                내 오늘의 한 줄 보기
              </button>
            )}
            {!sharedDay && <StreakNote days={days} />}
          </section>
        )}

        {tab === 'past' && (
          <section>
            <p className="section-desc">
              놓친 날의 문장도 열어 볼 수 있어요.
              {journal && rewardAdsEnabled() ? ' 읽지 않은 날은 짧은 광고를 보면 열려요.' : ''}
            </p>
            <ul className="day-list">
              {pastDays(today, PAST_DAYS).map((d) => {
                const open = journal ? isUnlocked(journal, d) : false;
                const l = lineForDate(d);
                return (
                  <li key={d}>
                    {open ? (
                      <button type="button" className="day-row" onClick={() => setOpened({ line: l, day: d })}>
                        <span className="day-date">{formatDate(d)}</span>
                        <span className="day-preview">{l.text.split('\n')[0]}</span>
                        <span className="day-by">{l.author}</span>
                      </button>
                    ) : (
                      <button type="button" className="day-row is-locked" disabled={busyDay !== null} onClick={() => unlock(d)}>
                        <span className="day-date">{formatDate(d)}</span>
                        <span className="day-preview">
                          {busyDay === d ? '여는 중이에요…' : rewardAdsEnabled() ? '🔒 광고 보고 열기' : '🔒 눌러서 열기'}
                        </span>
                      </button>
                    )}
                  </li>
                );
              })}
              <AdBanner />
            </ul>
          </section>
        )}

        {tab === 'saved' && (
          <section>
            {journal && journal.saved.length === 0 && (
              <div className="empty">
                <p className="empty-icon" aria-hidden>
                  🤍
                </p>
                <p>마음에 남는 문장을 간직해 보세요.</p>
                <p className="muted">오늘의 한 줄에서 '간직하기'를 누르면 여기 모여요.</p>
              </div>
            )}
            <ul className="day-list">
              {journal?.saved
                .map((id) => LINES.find((l) => l.id === id))
                .filter((l): l is Line => !!l)
                .map((l) => (
                  <li key={l.id}>
                    <button type="button" className="day-row" onClick={() => setOpened({ line: l, day: null })}>
                      <span className="day-preview">{l.text.replace(/\n/g, ' ')}</span>
                      <span className="day-by">
                        {l.author}, 「{l.work}」
                      </span>
                    </button>
                  </li>
                ))}
            </ul>
          </section>
        )}
      </main>

      <footer className="footer">
        모든 문장은 저작권 보호기간이 끝난 작품에서 골랐어요.
        <br />
        외국 작품은 원문에서 새로 옮겼어요.
      </footer>

      {opened && (
        <Sheet title={opened.day ? formatDate(opened.day) : '간직한 문장'} onClose={() => setOpened(null)}>
          <div className="sheet-body">
            <blockquote className="line-text small">{opened.line.text}</blockquote>
            <p className="line-by">
              — {opened.line.author}, 「{opened.line.work}」
            </p>
            <Thought line={opened.line} />
            {actions(opened.line, opened.day ?? today)}
          </div>
        </Sheet>
      )}

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}

function StreakNote({ days }: { days: number }) {
  if (days <= 1) return <p className="streak-note">내일 다시 오면 새로운 한 줄이 기다리고 있어요.</p>;
  const next = [3, 7, 14, 30, 50, 100, 200, 365].find((n) => n > days);
  return (
    <p className="streak-note">
      {days}일 연속으로 읽고 있어요.
      {next ? ` ${next}일까지 ${next - days}일 남았어요!` : ' 정말 대단해요!'}
    </p>
  );
}

function readSharedDay(): string | null {
  const fromPage = parseSharedDay(window.location.search);
  if (fromPage) return fromPage;
  try {
    const initial = Environment.initialURL;
    const q = initial.indexOf('?');
    return q >= 0 ? parseSharedDay(initial.slice(q)) : null;
  } catch {
    return null;
  }
}
