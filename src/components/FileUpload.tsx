import React, { useRef } from 'react';
import { UploadIcon, XIcon, FileTextIcon } from 'lucide-react';

const ACCEPT = '.pdf,.png,.jpeg,.jpg,application/pdf,image/png,image/jpeg';

interface FileUploadProps {
  files: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
  label?: string;
}

export function FileUpload({ files, onChange, disabled, label = 'Upload Evidence' }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (incoming: FileList | null) => {
    if (!incoming?.length) return;
    const valid = Array.from(incoming).filter((f) =>
      /\.(pdf|png|jpe?g)$/i.test(f.name) ||
      ['application/pdf', 'image/png', 'image/jpeg'].includes(f.type)
    );
    onChange([...files, ...valid]);
  };

  const remove = (idx: number) => {
    onChange(files.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <span className="text-xs text-gray-400">PDF, PNG, JPEG — optional, multiple allowed</span>
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 w-full justify-center"
      >
        <UploadIcon className="w-4 h-4" />
        Choose files
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="hidden"
        onChange={(e) => addFiles(e.target.files)}
      />
      {files.length > 0 && (
        <ul className="mt-3 space-y-2">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg text-sm">
              <FileTextIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="flex-1 truncate text-gray-800">{f.name}</span>
              <span className="text-xs text-gray-400">{(f.size / 1024).toFixed(0)} KB</span>
              {!disabled && (
                <button type="button" onClick={() => remove(i)} className="text-gray-400 hover:text-red-600">
                  <XIcon className="w-4 h-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
