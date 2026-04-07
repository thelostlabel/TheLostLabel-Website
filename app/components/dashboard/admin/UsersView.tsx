"use client";
import { useState, useEffect, useMemo, useCallback, useTransition } from 'react';
import { useDebouncedSearch } from "@/app/components/dashboard/hooks/useDebouncedSearch";
import { CheckCircle, AlertCircle, Edit, Trash2, Check } from 'lucide-react';
import { useToast } from '@/app/components/ToastContext';
import { useDashboardAuth } from '@/app/components/dashboard/context/DashboardAuthProvider';
import { useDashboardRoute } from '@/app/components/dashboard/hooks/useDashboardRoute';
import { dashboardRequestJson, getDashboardErrorMessage } from '@/app/components/dashboard/lib/dashboard-request';
import {
    canDeleteUsers,
    canEditUsers,
    canManageUserPermissions,
    canManageUserRoles,
    canManageUserStatus,
    DEMO_PERMISSION_OPTIONS,
    MANAGEMENT_VIEW_PERMISSION_OPTIONS,
    parsePermissions,
    PORTAL_PERMISSION_OPTIONS,
    USER_PERMISSION_OPTIONS,
    type PermissionMap,
} from '@/lib/permissions';
import { Button, Input, Label, TextField, Table, Chip, Modal, Pagination, Tabs, Tooltip, Select, ListBox, Checkbox, Surface } from '@heroui/react';
import AdvancedFilter, { type FilterField } from '@/app/components/dashboard/primitives/AdvancedFilter';
import { applyFilters, countActiveFilters, type FilterFieldConfig } from '@/app/components/dashboard/lib/filter-utils';

const PAGE_SIZE = 15;
import { ACTION_BUTTON } from '@/app/components/dashboard/lib/action-styles';

// ---------------------------------------------------------------------------
// Local types
// ---------------------------------------------------------------------------

/** A user record as returned by the admin users API. */
interface AdminUser {
    id: string;
    email?: string | null;
    fullName?: string | null;
    stageName?: string | null;
    spotifyUrl?: string | null;
    role?: string | null;
    status?: string | null;
    emailVerified?: string | Date | null;
    permissions?: unknown;
}

/** The editable fields held in local state while the modal is open. */
interface EditForm {
    email: string;
    fullName: string;
    stageName: string;
    spotifyUrl: string;
    role: string;
    status: string;
    permissions: PermissionMap;
}

/** A single permission option item (key + display label). */
interface PermissionOption {
    key: string;
    label: string;
}

/** A section grouping related permission options shown in the modal. */
interface PermissionSection {
    title: string;
    options: readonly PermissionOption[];
    enabledByDefault: boolean;
}

/** A column descriptor used by the HeroUI Table. */
interface TableColumn {
    id: string;
    name: string;
}

/** Payload sent to PATCH /api/admin/users for a quick approve/status change. */
interface QuickSavePayload {
    userId: string;
    status?: string;
    role?: string;
}

/** Props for UsersView. */
interface UsersViewProps {
    users: AdminUser[];
    onRefresh?: () => Promise<void> | void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type PageItem = number | 'ellipsis-left' | 'ellipsis-right';

const getVisiblePageNumbers = (page: number, totalPages: number): PageItem[] => {
    if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const pages: PageItem[] = [1];
    if (page > 3) pages.push('ellipsis-left');

    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);

    for (let current = start; current <= end; current += 1) {
        pages.push(current);
    }

    if (page < totalPages - 2) pages.push('ellipsis-right');
    pages.push(totalPages);

    return pages;
};

// ---------------------------------------------------------------------------
// Advanced filter configuration
// ---------------------------------------------------------------------------

const USERS_ROLE_OPTIONS: { id: string; label: string }[] = [
    { id: 'artist', label: 'ARTIST' },
    { id: 'a&r',    label: 'A&R' },
    { id: 'admin',  label: 'ADMIN' },
];

const USERS_STATUS_OPTIONS: { id: string; label: string }[] = [
    { id: 'pending',  label: 'PENDING' },
    { id: 'approved', label: 'APPROVED' },
    { id: 'rejected', label: 'REJECTED' },
];

const USERS_FILTER_FIELDS: FilterField[] = [
    {
        key: 'search',
        label: 'SEARCH',
        type: 'text',
        placeholder: 'Search by name or email...',
    },
    {
        key: 'role',
        label: 'ROLE',
        type: 'select',
        options: USERS_ROLE_OPTIONS,
    },
    {
        key: 'status',
        label: 'STATUS',
        type: 'select',
        options: USERS_STATUS_OPTIONS,
    },
];

const USERS_FILTER_CONFIGS: FilterFieldConfig[] = [
    {
        key: 'search',
        type: 'text',
        searchFields: ['email', 'stageName', 'fullName'],
    },
    { key: 'role', type: 'select' },
    { key: 'status', type: 'select' },
];

const DEFAULT_USERS_FILTERS: Record<string, any> = {
    search: '',
    role: '',
    status: '',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function UsersView({ users, onRefresh }: UsersViewProps) {
    const { currentUser } = useDashboardAuth();
    const { recordId, setRecordId, clearRecordId } = useDashboardRoute();
    const { showToast, showConfirm } = useToast();
    const roles: string[] = ['artist', 'a&r', 'admin'];
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
    const [editForm, setEditForm] = useState<Partial<EditForm>>({});
    const [saving, setSaving] = useState<boolean>(false);
    const [searchTerm, setSearchTerm, debouncedSearch] = useDebouncedSearch();
    const [page, setPage] = useState<number>(1);
    const [registrationFilter, setRegistrationFilter] = useState<string>('all');
    const [isPending, startTransition] = useTransition();
    const [advancedFilters, setAdvancedFilters] = useState<Record<string, any>>(DEFAULT_USERS_FILTERS);
    const canEditProfile = canEditUsers(currentUser);
    const canManageStatus = canManageUserStatus(currentUser);
    const canManageRoles = canManageUserRoles(currentUser);
    const canManagePermissions = canManageUserPermissions(currentUser);
    const canDeleteUser = canDeleteUsers(currentUser);
    const canOpenEditor = canEditProfile || canManageStatus || canManageRoles || canManagePermissions;
    const permissionSections: PermissionSection[] = [
        { title: 'PORTAL_PERMISSIONS', options: PORTAL_PERMISSION_OPTIONS, enabledByDefault: true },
        { title: 'MANAGEMENT_VIEWS', options: MANAGEMENT_VIEW_PERMISSION_OPTIONS, enabledByDefault: false },
        { title: 'DEMO_WORKFLOW', options: DEMO_PERMISSION_OPTIONS, enabledByDefault: false },
        { title: 'USER_MANAGEMENT', options: USER_PERMISSION_OPTIONS, enabledByDefault: false }
    ];

    useEffect(() => {
        if (!canOpenEditor || users.length === 0) return;
        if (!recordId) {
            setEditingUser(null);
            return;
        }
        const user = users.find(u => u.id === recordId);
        if (user && user.id !== editingUser?.id) {
            setEditingUser(user);
            const perms = parsePermissions(user.permissions);
            setEditForm({
                email: user.email || '',
                fullName: user.fullName || '',
                stageName: user.stageName || '',
                spotifyUrl: user.spotifyUrl || '',
                role: user.role || 'artist',
                status: user.status || 'pending',
                permissions: perms
            });
        }
    }, [users, recordId, editingUser?.id, canOpenEditor]);

    const openEdit = useCallback((user: AdminUser, updateRoute = true) => {
        setEditingUser(user);
        const perms = parsePermissions(user.permissions);
        if (updateRoute) setRecordId(user.id);
        setEditForm({
            email: user.email || '',
            fullName: user.fullName || '',
            stageName: user.stageName || '',
            spotifyUrl: user.spotifyUrl || '',
            role: user.role || 'artist',
            status: user.status || 'pending',
            permissions: perms
        });
    }, [setRecordId]);

    const registeredUsersCount = useMemo(
        () => users.filter((user) => Boolean(user.emailVerified)).length,
        [users],
    );

    const pendingUsersCount = useMemo(
        () => users.filter((user) => user.status === 'pending').length,
        [users],
    );

    const activeFilterCount = useMemo(() => countActiveFilters(advancedFilters), [advancedFilters]);

    const filteredUsers = useMemo(() => {
        // Start with registration tab filter
        let result = users.filter((user) => {
            const matchesRegistration =
                registrationFilter !== 'registered' || Boolean(user.emailVerified);
            return matchesRegistration;
        });
        // Quick search bar
        if (debouncedSearch) {
            const normalizedSearch = debouncedSearch.toLowerCase();
            result = result.filter((user) =>
                user.email?.toLowerCase().includes(normalizedSearch) ||
                user.stageName?.toLowerCase().includes(normalizedSearch) ||
                user.fullName?.toLowerCase().includes(normalizedSearch)
            );
        }
        // Advanced filters
        return applyFilters(result, advancedFilters, USERS_FILTER_CONFIGS);
    }, [users, debouncedSearch, registrationFilter, advancedFilters]);

    // Reset to page 1 when search changes
    useEffect(() => { setPage(1); }, [debouncedSearch, registrationFilter, advancedFilters]);

    const columns = useMemo((): TableColumn[] => ([
        { id: 'name', name: 'NAME' },
        { id: 'role', name: 'ROLE' },
        { id: 'status', name: 'STATUS' },
        { id: 'email', name: 'EMAIL' },
        { id: 'actions', name: 'ACTIONS' }
    ]), []);

    const totalUserCount = filteredUsers.length;
    const totalPages = Math.max(1, Math.ceil(totalUserCount / PAGE_SIZE));
    const paginatedUsers = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;

        return filteredUsers.slice(start, start + PAGE_SIZE);
    }, [filteredUsers, page]);
    const pageStart = totalUserCount === 0 ? 0 : ((page - 1) * PAGE_SIZE) + 1;
    const pageEnd = Math.min(page * PAGE_SIZE, totalUserCount);

    const handlePageChange = (newPage: number): void => {
        startTransition(() => setPage(newPage));
    };

    useEffect(() => {
        if (page > totalPages) {
            setPage(totalPages);
        }
    }, [page, totalPages]);

    const handleSave = async (overrideData: QuickSavePayload | null = null): Promise<void> => {
        if (!overrideData && !canOpenEditor) {
            showToast('You do not have permission to edit users.', "error");
            return;
        }
        setSaving(true);
        try {
            const data = overrideData || {
                userId: editingUser!.id,
                ...(canEditProfile ? {
                    email: editForm.email,
                    fullName: editForm.fullName,
                    stageName: editForm.stageName,
                    spotifyUrl: editForm.spotifyUrl
                } : {}),
                ...(canManageRoles ? { role: editForm.role } : {}),
                ...(canManageStatus ? { status: editForm.status } : {}),
                ...(canManagePermissions ? { permissions: JSON.stringify(editForm.permissions) } : {})
            };
            await dashboardRequestJson('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
                context: 'update user',
                retry: false
            });
            if (!overrideData) {
                clearRecordId({ replace: true });
                showToast("User updated successfully", "success");
            }
            await onRefresh?.();
        } catch (e) {
            showToast(getDashboardErrorMessage(e, 'Save failed'), "error");
        } finally {
            setSaving(false);
        }
    };

    const handleApprove = (userId: string): void => {
        if (!canManageStatus) {
            showToast('You do not have permission to approve users.', "error");
            return;
        }
        showConfirm(
            "APPROVE USER?",
            "Are you sure you want to approve this artist request? They will gain access to the dashboard.",
            async () => {
                await handleSave({ userId, status: 'approved' });
                showToast("User approved", "success");
            }
        );
    };

    const handleDelete = (userId: string): void => {
        if (!canDeleteUser) {
            showToast('You do not have permission to delete users.', "error");
            return;
        }
        showConfirm(
            "DELETE USER?",
            "Are you sure you want to PERMANENTLY delete this user? This cannot be undone.",
            async () => {
                try {
                    await dashboardRequestJson(`/api/admin/users?id=${userId}`, {
                        method: 'DELETE',
                        context: 'delete user',
                        retry: false
                    });
                    showToast("User deleted", "success");
                    clearRecordId({ replace: true });
                    await onRefresh?.();
                } catch (e) {
                    showToast(getDashboardErrorMessage(e, 'Delete failed'), "error");
                }
            }
        );
    };

    const statusColor = (status: string | null | undefined): 'success' | 'danger' | 'default' => {
        if (status === 'approved') return 'success';
        if (status === 'rejected') return 'danger';
        return 'default';
    };

    const renderCell = useCallback((user: AdminUser, columnId: string): React.ReactNode => {
        switch (columnId) {
            case 'email':
                return (
                    <div className="flex items-center gap-2">
                        <span className="text-sm">{user.email}</span>
                        {user.emailVerified ? (
                            <span title={`Verified: ${new Date(user.emailVerified as string | Date).toLocaleDateString()}`} className="text-success flex">
                                <CheckCircle size={12} />
                            </span>
                        ) : (
                            <span title="Not Verified" className="text-warning flex">
                                <AlertCircle size={12} />
                            </span>
                        )}
                    </div>
                );
            case 'name':
                return <span className="font-black text-sm">{user.stageName || user.fullName || '---'}</span>;
            case 'role':
                return (
                    <Chip size="sm" variant="soft" color={user.role === 'admin' ? 'accent' : 'default'}>
                        <Chip.Label>{user.role?.toUpperCase()}</Chip.Label>
                    </Chip>
                );
            case 'status':
                return (
                    <Chip size="sm" variant="soft" color={statusColor(user.status)}>
                        <Chip.Label>{user.status?.toUpperCase() || 'PENDING'}</Chip.Label>
                    </Chip>
                );
            case 'actions':
                return (
                    <div className="flex items-center justify-end gap-1">
                        {user.status === 'pending' && canManageStatus && (
                            <Tooltip delay={0}>
                                <Button {...ACTION_BUTTON.approve} isIconOnly onPress={() => handleApprove(user.id)}><Check size={14} /></Button>
                                <Tooltip.Content>Approve</Tooltip.Content>
                            </Tooltip>
                        )}
                        {canOpenEditor && (
                            <Tooltip delay={0}>
                                <Button size="sm" variant="ghost" isIconOnly onPress={() => openEdit(user)}><Edit size={14} /></Button>
                                <Tooltip.Content>Edit</Tooltip.Content>
                            </Tooltip>
                        )}
                        {canDeleteUser && (
                            <Tooltip delay={0}>
                                <Button size="sm" variant="ghost" isIconOnly className="text-danger hover:bg-danger/10" onPress={() => handleDelete(user.id)}><Trash2 size={14} /></Button>
                                <Tooltip.Content>Delete</Tooltip.Content>
                            </Tooltip>
                        )}
                        {!canManageStatus && !canOpenEditor && !canDeleteUser && (
                            <span className="text-[9px] text-muted font-black tracking-widest">READ_ONLY</span>
                        )}
                    </div>
                );
            default:
                return null;
        }
    }, [canDeleteUser, canManageStatus, canOpenEditor, openEdit]);

    return (
        <div className="flex flex-col gap-4">
            <Modal.Backdrop isOpen={!!editingUser} onOpenChange={(open: boolean) => { if (!open) clearRecordId({ replace: true }); }}>
                <Modal.Container size="lg" scroll="inside">
                    <Modal.Dialog className="sm:max-w-[850px]">
                        <Modal.CloseTrigger />
                        <Modal.Header>
                            <Modal.Heading className="text-[11px] tracking-widest font-black">USER_ACCESS_CONTROL</Modal.Heading>
                        </Modal.Header>
                        <Modal.Body>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="flex flex-col gap-5">
                                    <TextField
                                        type="email"
                                        value={editForm.email || ''}
                                        onChange={(v: string) => setEditForm({ ...editForm, email: v })}
                                        isDisabled={!canEditProfile}
                                    >
                                        <Label className="text-[9px] text-muted font-black tracking-widest">EMAIL_ADDRESS</Label>
                                        <Input />
                                    </TextField>
                                    <div className="grid grid-cols-2 gap-4">
                                        <TextField
                                            value={editForm.fullName || ''}
                                            onChange={(v: string) => setEditForm({ ...editForm, fullName: v })}
                                            isDisabled={!canEditProfile}
                                        >
                                            <Label className="text-[9px] text-muted font-black tracking-widest">FULL_NAME</Label>
                                            <Input />
                                        </TextField>
                                        <TextField
                                            value={editForm.stageName || ''}
                                            onChange={(v: string) => setEditForm({ ...editForm, stageName: v })}
                                            isDisabled={!canEditProfile}
                                        >
                                            <Label className="text-[9px] text-muted font-black tracking-widest">STAGE_NAME</Label>
                                            <Input />
                                        </TextField>
                                    </div>
                                    <Select
                                        selectedKey={editForm.role || 'artist'}
                                        onSelectionChange={(key) => setEditForm({ ...editForm, role: String(key) })}
                                        isDisabled={!canManageRoles}
                                        className="w-full"
                                    >
                                        <Label className="text-[9px] text-muted font-black tracking-widest">SYSTEM_ROLE</Label>
                                        <Select.Trigger>
                                            <Select.Value />
                                            <Select.Indicator />
                                        </Select.Trigger>
                                        <Select.Popover>
                                            <ListBox>
                                                {roles.map(r => (
                                                    <ListBox.Item key={r} id={r} textValue={r.toUpperCase()}>
                                                        {r.toUpperCase()}
                                                        <ListBox.ItemIndicator />
                                                    </ListBox.Item>
                                                ))}
                                            </ListBox>
                                        </Select.Popover>
                                    </Select>
                                    <Select
                                        selectedKey={editForm.status || 'pending'}
                                        onSelectionChange={(key) => setEditForm({ ...editForm, status: String(key) })}
                                        isDisabled={!canManageStatus}
                                        className="w-full"
                                    >
                                        <Label className="text-[9px] text-muted font-black tracking-widest">ACCOUNT_STATUS</Label>
                                        <Select.Trigger>
                                            <Select.Value />
                                            <Select.Indicator />
                                        </Select.Trigger>
                                        <Select.Popover>
                                            <ListBox>
                                                <ListBox.Item id="pending" textValue="PENDING APPROVAL">
                                                    PENDING APPROVAL
                                                    <ListBox.ItemIndicator />
                                                </ListBox.Item>
                                                <ListBox.Item id="approved" textValue="APPROVED">
                                                    APPROVED
                                                    <ListBox.ItemIndicator />
                                                </ListBox.Item>
                                                <ListBox.Item id="rejected" textValue="REJECTED">
                                                    REJECTED
                                                    <ListBox.ItemIndicator />
                                                </ListBox.Item>
                                            </ListBox>
                                        </Select.Popover>
                                    </Select>
                                </div>

                                <div className="flex flex-col gap-7">
                                    {!canManagePermissions && (
                                        <Surface variant="default" className="rounded-xl p-4 text-[10px] text-muted leading-relaxed">
                                            Some controls are read-only for your account. Advanced access toggles unlock only if your own user grants permission management rights.
                                        </Surface>
                                    )}
                                    {permissionSections.map((section) => (
                                        <div key={section.title}>
                                            <p className="text-[10px] text-muted mb-3 font-black tracking-widest">{section.title}</p>
                                            <Surface variant="default" className="grid grid-cols-2 gap-3 rounded-xl p-5">
                                                {section.options.map((p) => {
                                                    const isEnabled = section.enabledByDefault
                                                        ? editForm.permissions?.[p.key] !== false
                                                        : editForm.permissions?.[p.key] === true;
                                                    return (
                                                        <Checkbox
                                                            key={p.key}
                                                            isSelected={isEnabled}
                                                            onChange={(checked: boolean) => setEditForm({
                                                                ...editForm,
                                                                permissions: { ...editForm.permissions, [p.key]: checked }
                                                            })}
                                                            isDisabled={!canManagePermissions}
                                                            variant="secondary"
                                                        >
                                                            <Checkbox.Control>
                                                                <Checkbox.Indicator />
                                                            </Checkbox.Control>
                                                            <Checkbox.Content>
                                                                <Label className="text-[9px] font-black">{p.label}</Label>
                                                            </Checkbox.Content>
                                                        </Checkbox>
                                                    );
                                                })}
                                            </Surface>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button
                                variant="secondary"
                                slot="close"
                            >
                                CANCEL
                            </Button>
                            <Button
                                variant="primary"
                                onPress={() => handleSave()}
                                isDisabled={saving || !canOpenEditor}
                            >
                                {saving ? 'APPLYING_CHANGES...' : 'SAVE_USER_PERMISSIONS'}
                            </Button>
                        </Modal.Footer>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>

            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex w-full flex-col gap-3 xl:max-w-3xl">
                    <Tabs
                        selectedKey={registrationFilter}
                        onSelectionChange={(key) => setRegistrationFilter(String(key))}
                        variant="secondary"
                    >
                        <Tabs.ListContainer>
                            <Tabs.List aria-label="User registration filters">
                                <Tabs.Tab id="all">
                                    ALL USERS
                                    <Tabs.Indicator />
                                </Tabs.Tab>
                                <Tabs.Tab id="registered">
                                    REGISTERED ONLY
                                    <Tabs.Indicator />
                                </Tabs.Tab>
                            </Tabs.List>
                        </Tabs.ListContainer>
                    </Tabs>
                    <Input
                        aria-label="Search users"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                        className="w-full max-w-xl"
                    />
                    <AdvancedFilter
                        fields={USERS_FILTER_FIELDS}
                        values={advancedFilters}
                        onChange={setAdvancedFilters}
                        onReset={() => setAdvancedFilters(DEFAULT_USERS_FILTERS)}
                        activeFilterCount={activeFilterCount}
                    />
                </div>
                <div className="flex items-center gap-3 self-start xl:self-auto">
                    <span className="text-[10px] text-muted font-black whitespace-nowrap">
                        {registeredUsersCount} VERIFIED USERS
                    </span>
                    <span className="text-[10px] text-muted font-black whitespace-nowrap">
                        {pendingUsersCount} PENDING REGISTRATIONS
                    </span>
                </div>
            </div>

            <div className={isPending ? 'opacity-50 pointer-events-none transition-opacity duration-150' : 'transition-opacity duration-150'}>
            <Table aria-label="Users Table">
                <Table.ScrollContainer>
                    <Table.Content aria-label="Table with pagination" className="min-w-[760px]" selectionMode="none">
                        <Table.Header columns={columns}>
                            {(column: TableColumn) => (
                                <Table.Column
                                    isRowHeader={column.id === 'name'}
                                    className={column.id === 'actions' ? 'text-end' : undefined}
                                >
                                    {column.name}
                                </Table.Column>
                            )}
                        </Table.Header>
                        <Table.Body
                            items={paginatedUsers}
                            renderEmptyState={() => (
                                <div className="py-16 flex flex-col items-center gap-3">
                                    <p className="text-muted text-xs font-bold tracking-widest uppercase">
                                        {registrationFilter === 'registered'
                                            ? 'NO REGISTERED USERS MATCHING FILTER'
                                            : 'NO USERS MATCHING SEARCH'}
                                    </p>
                                </div>
                            )}
                        >
                            {(user: AdminUser) => (
                                <Table.Row key={user.id}>
                                    <Table.Collection items={columns}>
                                        {(column: TableColumn) => (
                                            <Table.Cell>
                                                {renderCell(user, column.id)}
                                            </Table.Cell>
                                        )}
                                    </Table.Collection>
                                </Table.Row>
                            )}
                        </Table.Body>
                    </Table.Content>
                </Table.ScrollContainer>
                {totalUserCount > 0 && (
                    <Table.Footer>
                        <Pagination className="w-full" size="sm">
                            <Pagination.Summary>
                                Showing {pageStart}-{pageEnd} of {totalUserCount} users
                            </Pagination.Summary>
                            <Pagination.Content>
                                <Pagination.Item>
                                    <Pagination.Previous
                                        isDisabled={page === 1}
                                        onPress={() => handlePageChange(Math.max(1, page - 1))}
                                    >
                                        <Pagination.PreviousIcon />
                                        Prev
                                    </Pagination.Previous>
                                </Pagination.Item>
                                {getVisiblePageNumbers(page, totalPages).map((paginationPage) => (
                                    paginationPage === 'ellipsis-left' || paginationPage === 'ellipsis-right' ? (
                                        <Pagination.Item key={paginationPage}>
                                            <Pagination.Ellipsis />
                                        </Pagination.Item>
                                    ) : (
                                        <Pagination.Item key={paginationPage}>
                                            <Pagination.Link
                                                isActive={paginationPage === page}
                                                onPress={() => handlePageChange(paginationPage as number)}
                                            >
                                                {paginationPage}
                                            </Pagination.Link>
                                        </Pagination.Item>
                                    )
                                ))}
                                <Pagination.Item>
                                    <Pagination.Next
                                        isDisabled={page === totalPages}
                                        onPress={() => handlePageChange(Math.min(totalPages, page + 1))}
                                    >
                                        Next
                                        <Pagination.NextIcon />
                                    </Pagination.Next>
                                </Pagination.Item>
                            </Pagination.Content>
                        </Pagination>
                    </Table.Footer>
                )}
            </Table>
            </div>
        </div>
    );
}
