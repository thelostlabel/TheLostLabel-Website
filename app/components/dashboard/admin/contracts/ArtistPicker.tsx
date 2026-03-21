"use client";

import { useState, useEffect, useMemo, useRef } from 'react';

type Artist = {
  id: string;
  name: string;
  userId?: string;
  user?: {
    id?: string;
    email: string;
    stageName?: string;
    legalName?: string;
    fullName?: string;
    phoneNumber?: string;
    address?: string;
  };
};

type ArtistPickerProps = {
  artists: Artist[];
  value: string;
  onChange: (artist: Artist) => void;
  placeholder?: string;
  onClear?: () => void;
};

export default function ArtistPicker({
  artists,
  value,
  onChange,
  placeholder = "Select Artist...",
  onClear,
}: ArtistPickerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedArtist = artists.find((a) => a.id === value);
  const displayValue = searchTerm || (selectedArtist ? selectedArtist.name : '');

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredArtists = useMemo(() => {
    return artists.filter(
      (a) =>
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.user?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.user?.stageName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [artists, searchTerm]);

  return (
    <div ref={wrapperRef} className="relative">
      <input
        placeholder={placeholder}
        value={displayValue}
        onFocus={() => {
          setSearchTerm('');
          setShowDropdown(true);
        }}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setShowDropdown(true);
        }}
        className="dash-input"
        style={{ padding: '12px 20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '2px' }}
      />
      {value && !showDropdown && onClear && (
        <button
          type="button"
          onClick={() => {
            onClear();
            setSearchTerm('');
          }}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-transparent border-none text-[var(--status-error)] text-base cursor-pointer"
        >
          &times;
        </button>
      )}

      {showDropdown && (
        <div
          className="absolute top-full left-0 right-0 mt-1 z-[100] overflow-y-auto max-h-[200px] rounded-sm"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
          }}
        >
          {filteredArtists.length > 0 ? (
            filteredArtists.map((a) => (
              <div
                key={a.id}
                onClick={() => {
                  onChange(a);
                  setSearchTerm('');
                  setShowDropdown(false);
                }}
                className="p-2.5 border-b border-white/[0.08] cursor-pointer text-xs text-[#ccc] hover:bg-white/[0.06]"
              >
                <div className="font-bold">{a.name}</div>
                {a.user && (
                  <div className="text-[10px] text-[#666]">
                    {a.user.email} {a.user.stageName ? `(${a.user.stageName})` : ''}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="p-2.5 text-[#666] text-xs">No matches found</div>
          )}
          <div
            onClick={() => {
              if (onClear) onClear();
              setSearchTerm('');
              setShowDropdown(false);
            }}
            className="p-2.5 border-t border-white/[0.08] text-[var(--status-error)] cursor-pointer text-xs text-center"
          >
            CLEAR SELECTION
          </div>
        </div>
      )}
    </div>
  );
}
