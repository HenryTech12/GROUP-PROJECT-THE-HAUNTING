import { useState } from 'react';
import { FileText, MessageSquare, Swords } from 'lucide-react';
import type { ActionId, BossMoveId, GameState } from '../game/types';
import { ActionPanel } from './ActionPanel';
import { ChatPanel } from './ChatPanel';
import { DocPanel } from './DocPanel';
import { EventModal } from './EventModal';
import { Hud } from './Hud';

type Tab = 'doc' | 'actions' | 'chat';

export function Workspace({
  state, realLeft, paused, onPause, onAct, onBoss, onEvent,
}: {
  state: GameState; realLeft: number; paused: boolean; onPause: () => void;
  onAct: (id: ActionId) => void; onBoss: (id: BossMoveId) => void; onEvent: (i: number) => void;
}) {
  const [tab, setTab] = useState<Tab>('actions');
  const unread = state.log.length;
  return (
    <div className={`workspace ${state.phase === 'boss' ? 'workspace-boss' : ''}`} data-tab={tab}>
      <Hud state={state} realLeft={realLeft} onPause={onPause} />
      <div className="ws-grid">
        <section className="panel doc-panel" aria-label="Report">
          <DocPanel state={state} />
        </section>
        <section className="panel action-panel" aria-label="Actions">
          <ActionPanel state={state} paused={paused} onAct={onAct} onBoss={onBoss} />
        </section>
        <section className="panel chat-panel" aria-label="Group chat">
          <ChatPanel state={state} />
        </section>
      </div>
      <nav className="tabs" aria-label="Panels">
        <button className={tab === 'doc' ? 'on' : ''} aria-pressed={tab === 'doc'} onClick={() => setTab('doc')}><FileText size={18} />Report</button>
        <button className={tab === 'actions' ? 'on' : ''} aria-pressed={tab === 'actions'} onClick={() => setTab('actions')}><Swords size={18} />Actions</button>
        <button className={tab === 'chat' ? 'on' : ''} aria-pressed={tab === 'chat'} onClick={() => setTab('chat')}><MessageSquare size={18} />Chat <small>{unread}</small></button>
      </nav>
      {state.pendingEvent && <EventModal eventId={state.pendingEvent} paused={paused} onChoose={onEvent} />}
    </div>
  );
}
