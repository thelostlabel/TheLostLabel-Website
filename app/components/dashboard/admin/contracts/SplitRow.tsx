"use client";

import React from 'react';
import { 
  Button, 
  Card, 
  Chip, 
  Input, 
  Label, 
  Select, 
  ListBox,
} from '@heroui/react';
import { Trash2, Star } from 'lucide-react';
import type { Split } from './contract-utils';
import ArtistPicker from './ArtistPicker';

type SplitRowProps = {
  split: Split;
  index: number;
  onUpdate: (updated: Split) => void;
  onRemove: () => void;
  onMakePrimary: () => void;
  artists: any[];
  effectiveShare: string;
  canRemove?: boolean;
};

export default function SplitRow({
  split,
  index,
  onUpdate,
  onRemove,
  onMakePrimary,
  artists,
  effectiveShare,
  canRemove = true,
}: SplitRowProps) {
  const isPrimary = split.role === 'primary';

  return (
    <Card
      variant="secondary"
      className={`overflow-hidden transition-all ${isPrimary ? 'border-primary/40 bg-primary/5' : ''}`}
    >
      {/* Header Bar */}
      <div className={`flex justify-between items-center px-4 py-3 border-b ${isPrimary ? 'border-primary/20 bg-primary/10' : 'bg-default-50'}`}>
        <div className="flex gap-3 items-center">
          <Chip 
            size="sm" 
            variant={isPrimary ? "soft" : "secondary"}
          >
            {isPrimary && <Star size={12} className="mr-1" />}
            {split.role || 'Featured'}
          </Chip>
          <span className="text-sm font-medium">
            Contributor #{index + 1}
          </span>
          {effectiveShare && (
            <Chip size="sm" variant="soft">
              {effectiveShare}% Net
            </Chip>
          )}
        </div>
        <div className="flex gap-2 items-center">
          {!isPrimary && (
            <Button 
              variant="secondary" 
              size="sm" 
              onPress={onMakePrimary}
            >
              Set Primary
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onPress={onRemove}
            isDisabled={!canRemove}
            isIconOnly
          >
            <Trash2 size={18} className={canRemove ? 'text-danger' : 'text-default-300'} />
          </Button>
        </div>
      </div>

      {/* Main Row */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-1">
          <Label className="mb-2 block">Stage Name</Label>
          <Input
            placeholder="Artist name"
            value={split.name}
            fullWidth
            onChange={(e) => {
              const newName = e.target.value;
              const match = artists.find(
                (a: any) => a.name.toLowerCase() === newName.toLowerCase()
              );
              const update: any = { ...split, name: newName };
              if (match) {
                update.artistId = match.id;
                update.userId = match.userId || '';
                update.legalName = match.user?.legalName || match.user?.fullName || split.legalName || '';
                update.phoneNumber = match.user?.phoneNumber || split.phoneNumber || '';
                update.address = match.user?.address || split.address || '';
                update.email = match.user?.email || split.email || '';
              }
              onUpdate(update);
            }}
          />
        </div>
        
        <div>
          <Label className="mb-2">SHARE %</Label>
          <div className="relative">
            <Input
              placeholder="100"
              value={split.percentage}
              fullWidth
              type="number"
              onChange={(e) => onUpdate({ ...split, percentage: parseFloat(e.target.value) || 0 })}
            />
          </div>
        </div>
        <div>
          <Label className="mb-2">ROLE</Label>
          <Select
            className="w-full"
            value={split.role || 'featured'}
            onChange={(val) => onUpdate({ ...split, role: String(val) })}
          >
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                <ListBox.Item id="primary">Primary</ListBox.Item>
                <ListBox.Item id="featured">Featured</ListBox.Item>
                <ListBox.Item id="producer">Producer</ListBox.Item>
                <ListBox.Item id="writer">Writer</ListBox.Item>
              </ListBox>
            </Select.Popover>
          </Select>
        </div>
        <div>
          <Label className="mb-2">PROFILE</Label>
          <ArtistPicker
            artists={artists}
            value={split.artistId}
            placeholder="Search..."
            onChange={(artist) => onUpdate({
              ...split,
              artistId: artist.id,
              userId: artist.userId || '',
              legalName: artist.user?.legalName || artist.user?.fullName || '',
              email: artist.user?.email || '',
              phoneNumber: artist.user?.phoneNumber || '',
              address: artist.user?.address || '',
            })}
            onClear={() => onUpdate({ ...split, artistId: '', userId: '' })}
          />
        </div>
      </div>

      <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-white/5">
        <div>
          <Label className="mb-2">LEGAL NAME</Label>
          <Input
            placeholder="Full legal name"
            value={split.legalName || ''}
            fullWidth
            onChange={(e) => onUpdate({ ...split, legalName: e.target.value })}
          />
        </div>
        <div>
          <Label className="mb-2">EMAIL</Label>
          <Input
            placeholder="artist@email.com"
            value={split.email || ''}
            fullWidth
            onChange={(e) => onUpdate({ ...split, email: e.target.value })}
          />
        </div>
        <div>
          <Label className="mb-2">PHONE</Label>
          <Input
            placeholder="+1 234 567 890"
            value={split.phoneNumber || ''}
            fullWidth
            onChange={(e) => onUpdate({ ...split, phoneNumber: e.target.value })}
          />
        </div>
        <div className="md:col-span-3">
          <Label className="mb-2">ADDRESS</Label>
          <Input
            placeholder="Full address"
            value={split.address || ''}
            fullWidth
            onChange={(e) => onUpdate({ ...split, address: e.target.value })}
          />
        </div>
      </div>
    </Card>
  );
}
