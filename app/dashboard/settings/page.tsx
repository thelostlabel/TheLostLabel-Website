"use client";
import React, { useState, FormEvent } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck, Settings } from 'lucide-react';
import { Card, TextField, Label, Input, Button, Alert, Separator } from '@heroui/react';

export default function SettingsPage() {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleChangePassword = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }

        if (newPassword.length < 8) {
            setError("Password must be at least 8 characters");
            setLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/user/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword })
            });
            const data = await res.json();
            if (res.ok) {
                setMessage("Password updated successfully");
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                setError(data.error || "Failed to update password");
            }
        } catch {
            setError("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-full p-8 sm:p-10">
            <div className="max-w-[680px] mx-auto flex flex-col gap-7">

                {/* Header */}
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-9 h-9 rounded-[10px] bg-default/5 border border-border/40 flex items-center justify-center">
                            <Settings size={16} className="ds-text-muted" />
                        </div>
                        <h1 className="text-xl font-black tracking-widest uppercase">Settings</h1>
                    </div>
                    <p className="ds-text-faint text-[13px] pl-12">Manage your account preferences</p>
                </div>

                {/* Password Card */}
                <Card>
                    <Card.Header>
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-default/5 border border-border/40 flex items-center justify-center">
                                <Lock size={13} className="ds-text-muted" />
                            </div>
                            <div>
                                <Card.Title className="text-[13px] tracking-widest">Change Password</Card.Title>
                                <Card.Description>Keep your account secure</Card.Description>
                            </div>
                        </div>
                    </Card.Header>

                    <Card.Content>
                        <form onSubmit={handleChangePassword} className="flex flex-col gap-5">

                            {/* Feedback */}
                            {message && (
                                <Alert color="success">
                                    <Alert.Description className="flex items-center gap-2">
                                        <ShieldCheck size={15} />
                                        {message}
                                    </Alert.Description>
                                </Alert>
                            )}
                            {error && (
                                <Alert color="danger">
                                    <Alert.Description>{error}</Alert.Description>
                                </Alert>
                            )}

                            <PasswordField
                                label="Current Password"
                                value={currentPassword}
                                onChange={setCurrentPassword}
                                show={showCurrent}
                                onToggle={() => setShowCurrent(v => !v)}
                            />
                            <PasswordField
                                label="New Password"
                                value={newPassword}
                                onChange={setNewPassword}
                                show={showNew}
                                onToggle={() => setShowNew(v => !v)}
                            />
                            <PasswordField
                                label="Confirm New Password"
                                value={confirmPassword}
                                onChange={setConfirmPassword}
                                show={showConfirm}
                                onToggle={() => setShowConfirm(v => !v)}
                            />

                            <Button
                                type="submit"
                                isDisabled={loading}
                                className="mt-2"
                            >
                                {loading ? 'Updating...' : 'Update Password'}
                            </Button>
                        </form>
                    </Card.Content>
                </Card>

                <Separator />

                {/* Placeholder */}
                <Card className="opacity-50">
                    <Card.Content className="flex items-center gap-3.5 py-5">
                        <ShieldCheck size={18} className="ds-text-faint" />
                        <div>
                            <p className="text-xs font-bold tracking-wider uppercase ds-text-muted">More settings coming soon</p>
                            <p className="text-[11px] ds-text-faint mt-0.5">Notifications, privacy, appearance</p>
                        </div>
                    </Card.Content>
                </Card>
            </div>
        </div>
    );
}

interface PasswordFieldProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    show: boolean;
    onToggle: () => void;
}

function PasswordField({ label, value, onChange, show, onToggle }: PasswordFieldProps) {
    return (
        <TextField>
            <Label>{label}</Label>
            <div className="relative">
                <Input
                    type={show ? 'text' : 'password'}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    required
                    className="pr-11"
                />
                <button
                    type="button"
                    onClick={onToggle}
                    aria-label={show ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer ds-text-faint hover:ds-text-muted transition-colors p-0 flex items-center"
                >
                    {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
            </div>
        </TextField>
    );
}
