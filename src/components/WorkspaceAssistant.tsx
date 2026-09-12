import React, { useState } from 'react';
import { Bot, Send, Sparkles, X } from 'lucide-react';
import { TabType, NoteItem, UploadedImageItem, LinkItem } from '../types';

interface WorkspaceAssistantProps {
  notes: NoteItem[];
  images: UploadedImageItem[];
  links: LinkItem[];
  activeTab: TabType;
}

export const WorkspaceAssistant: React.FC<WorkspaceAssistantProps> = ({ notes, images, links, activeTab }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const askAssistant = async (event: React.FormEvent) => {
    event.preventDefault();
    const question = prompt.trim();
    if (!question || isLoading) return;
    setIsLoading(true);
    setAnswer('');

    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: question,
          context: {
            activeTab,
            notes: notes.map(({ id, title, content, category, isPinned }) => ({ id, title, content, category, isPinned })),
            images: images.map(({ id, name, source, notes: imageNotes }) => ({ id, name, source, notes: imageNotes })),
            links: links.map(({ id, title, url, linkHost, embedProvider }) => ({ id, title, url, linkHost, embedProvider })),
          },
        }),
      });
      const data = await response.json();
      setAnswer(data.answer || (response.status === 503
        ? 'Gemini is not configured on the server. Add GEMINI_API_KEY to the Render service Environment settings, then redeploy.'
        : data.error) || 'Gemini could not complete that request.');
    } catch {
      setAnswer('The assistant service is unavailable. Your workspace is still safe and usable.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="assistant-launcher"
        onClick={() => setIsOpen((open) => !open)}
        aria-label="Open Gemini assistant"
        aria-expanded={isOpen}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
        <span>Gemini</span>
      </button>

      {isOpen && (
        <aside className="assistant-panel" aria-label="Gemini assistant">
          <div className="assistant-panel__header">
            <div>
              <div className="assistant-panel__eyebrow"><Sparkles className="h-3.5 w-3.5" /> GEMINI</div>
              <h2>Gemini workspace help</h2>
              <p>Ask about notes, files, images, links, or the current screen.</p>
            </div>
            <button type="button" onClick={() => setIsOpen(false)} aria-label="Close assistant"><X className="h-4 w-4" /></button>
          </div>
          <div className="assistant-panel__answer" aria-live="polite">
            {isLoading ? 'Thinking through your workspace...' : answer || 'I can explain a problem, organize the information you have saved, or suggest the next action.'}
          </div>
          <form onSubmit={askAssistant} className="assistant-panel__form">
            <input value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Ask Gemini..." aria-label="Ask Gemini" />
            <button type="submit" disabled={isLoading || !prompt.trim()} aria-label="Send assistant request"><Send className="h-4 w-4" /></button>
          </form>
        </aside>
      )}
    </>
  );
};
