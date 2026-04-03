"use client";

import { Key } from 'react';
import { ComboBox, Input, ListBox } from '@heroui/react';

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
  const handleSelectionChange = (key: Key | null) => {
    if (!key) {
      onClear?.();
      return;
    }
    const artist = artists.find((a) => a.id === key);
    if (artist) onChange(artist);
  };

  return (
    <ComboBox
      className="w-full"
      selectedKey={value || null}
      onSelectionChange={handleSelectionChange}
      allowsCustomValue={false}
    >
      <ComboBox.InputGroup>
        <Input placeholder={placeholder} fullWidth />
        <ComboBox.Trigger />
      </ComboBox.InputGroup>
      <ComboBox.Popover>
        <ListBox>
          {artists.map((artist) => (
            <ListBox.Item key={artist.id} id={artist.id} textValue={artist.name}>
              <div className="flex flex-col py-0.5">
                <span className="font-medium text-sm">{artist.name}</span>
                {artist.user?.email && (
                  <span className="text-xs text-muted">
                    {artist.user.email}
                    {artist.user.stageName ? ` · ${artist.user.stageName}` : ''}
                  </span>
                )}
              </div>
            </ListBox.Item>
          ))}
        </ListBox>
      </ComboBox.Popover>
    </ComboBox>
  );
}
