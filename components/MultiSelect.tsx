'use client';

import { useState, useRef, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';

interface MultiSelectProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  label?: string;
}

export function MultiSelect({ options, selected, onChange, placeholder, label }: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt =>
    opt.toLowerCase().includes(search.toLowerCase()) &&
    !selected.includes(opt)
  );

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter(s => s !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  const removeOption = (option: string) => {
    onChange(selected.filter(s => s !== option));
  };

  return (
    <div ref={wrapperRef} className="relative">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}

      <div
        onClick={() => setIsOpen(!isOpen)}
        className="min-h-[42px] w-full px-3 py-2 border border-gray-300 rounded-md bg-white cursor-pointer hover:border-gray-400 flex flex-wrap gap-1 items-center"
      >
        {selected.length === 0 ? (
          <span className="text-gray-400">{placeholder || '선택하세요'}</span>
        ) : (
          selected.map(item => (
            <span
              key={item}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-sm"
              onClick={(e) => {
                e.stopPropagation();
                removeOption(item);
              }}
            >
              {item}
              <X className="h-3 w-3 cursor-pointer hover:text-blue-900" />
            </span>
          ))
        )}
        <ChevronDown className="h-4 w-4 text-gray-400 ml-auto" />
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden">
          <div className="p-2 border-b border-gray-200">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="검색..."
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="p-2 text-sm text-gray-500 text-center">
                {search ? '검색 결과 없음' : '모두 선택됨'}
              </div>
            ) : (
              filteredOptions.map(option => (
                <div
                  key={option}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleOption(option);
                    setSearch('');
                  }}
                  className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                >
                  {option}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
