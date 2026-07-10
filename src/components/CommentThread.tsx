import React, { useState } from 'react';
import { MessageSquareIcon, Loader2Icon } from 'lucide-react';
import type { CommentEntry } from '../pages/services/auditApi';

interface CommentThreadProps {
  comments: CommentEntry[];
  onAdd: (text: string) => Promise<void>;
  disabled?: boolean;
}

export function CommentThread({ comments, onAdd, disabled }: CommentThreadProps) {
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!text.trim()) return;
    setSaving(true);
    try {
      await onAdd(text.trim());
      setText('');
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <MessageSquareIcon className="w-4 h-4" /> Comments ({comments.length})
        </h3>
        {!disabled && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="text-sm text-blue-600 hover:underline"
          >
            {open ? 'Cancel' : 'Add comment'}
          </button>
        )}
      </div>

      {open && (
        <div className="mb-4">
          <textarea
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            placeholder="Enter your comment..."
          />
          <button
            type="button"
            onClick={submit}
            disabled={!text.trim() || saving}
            className="mt-2 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50"
          >
            {saving && <Loader2Icon className="w-4 h-4 animate-spin" />}
            Post comment
          </button>
        </div>
      )}

      {comments.length === 0 ? (
        <p className="text-sm text-gray-400">No comments yet.</p>
      ) : (
        <ul className="space-y-3 max-h-60 overflow-y-auto">
          {[...comments].reverse().map((c, i) => (
            <li key={i} className="p-3 bg-gray-50 rounded-lg text-sm">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-gray-800">{c.authorName || c.authorId}</span>
                {c.role && (
                  <span className="text-[10px] uppercase tracking-wide text-gray-400">{c.role}</span>
                )}
                <span className="text-xs text-gray-400 ml-auto">
                  {c.timestamp ? new Date(c.timestamp).toLocaleString() : ''}
                </span>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap">{c.text}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
