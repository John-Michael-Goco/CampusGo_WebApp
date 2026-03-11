import { Head, Link, router } from '@inertiajs/react';
import { User } from 'lucide-react';
import { useRef, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export type SimulationUserDetails = {
    id: number;
    name: string;
    email: string;
    role: string;
    avatar?: string | null;
    points_balance: number;
    level: number;
    total_completed_quests: number;
    quests_won: number;
    total_xp_earned: number;
    school_id: string | null;
    first_name: string | null;
    last_name: string | null;
    course: string | null;
    year_level: number | null;
    section: string | null;
};

type Props = {
    user: SimulationUserDetails;
};

function DetailRow({
    label,
    value,
}: {
    label: string;
    value: string | number | null | undefined;
}) {
    const display = value ?? '—';
    return (
        <div className="flex justify-between gap-2 py-2 border-b border-zinc-200 dark:border-zinc-600 last:border-0">
            <span className="text-sm text-zinc-500 dark:text-zinc-400 shrink-0">
                {label}
            </span>
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 text-right break-all">
                {display}
            </span>
        </div>
    );
}

function getInitials(name: string | null | undefined): string {
    if (!name || !name.trim()) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase().slice(0, 2);
    }
    return name.slice(0, 2).toUpperCase();
}

export default function SimulationUserDetails({ user }: Props) {
    const initials = getInitials(user.name);
    const formRef = useRef<HTMLFormElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const displayAvatar = previewUrl ?? user.avatar ?? null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        if (file) setPreviewUrl(URL.createObjectURL(file));
        else setPreviewUrl(null);
    };

    const handlePhotoSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = formRef.current;
        if (!form) return;
        const formData = new FormData(form);
        formData.set('_method', 'PATCH');
        const fileInput = form.querySelector<HTMLInputElement>('input[name="profile_image"]');
        if (fileInput?.files?.[0]) formData.set('profile_image', fileInput.files[0]);
        if (!formData.has('remove_profile_image')) formData.set('remove_profile_image', '0');
        setSaving(true);
        router.post('/simulation/profile', formData, {
            forceFormData: true,
            preserveScroll: true,
            onFinish: () => setSaving(false),
        });
    };

    return (
        <>
            <Head title="My profile (simulation)" />
            <div className="min-h-svh bg-zinc-100 dark:bg-zinc-900 flex flex-col items-center justify-start p-4 safe-area-padding">
                <div className="w-full max-w-[400px] min-h-[500px] bg-white dark:bg-zinc-800 rounded-[2rem] shadow-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 flex flex-col">
                    <div className="h-10 shrink-0 bg-amber-500 dark:bg-amber-600 flex items-end justify-center pb-2">
                        <div className="w-24 h-1.5 rounded-full bg-black/20 dark:bg-white/20" />
                    </div>

                    <div className="flex-1 overflow-y-auto flex flex-col">
                        <div className="p-4 pb-2 flex flex-col items-center gap-1 border-b border-zinc-200 dark:border-zinc-700">
                            <div className="flex items-center justify-center gap-2">
                                <Avatar className="size-12 shrink-0 overflow-hidden rounded-full border-2 border-amber-500 dark:border-amber-400">
                                    <AvatarImage src={displayAvatar ?? undefined} alt={user.name} />
                                    <AvatarFallback className="rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 text-sm font-medium">
                                        {user.name ? initials : <User className="size-6" />}
                                    </AvatarFallback>
                                </Avatar>
                                <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                                    My profile
                                </h1>
                            </div>
                            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                                Simulation
                            </p>
                        </div>

                        <div className="p-4 flex-1 space-y-4">
                            <section>
                                <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-2">
                                    Profile photo
                                </h2>
                                <form
                                    ref={formRef}
                                    onSubmit={handlePhotoSubmit}
                                    className="rounded-xl bg-zinc-100 dark:bg-zinc-700/50 px-4 py-3 border border-zinc-200 dark:border-zinc-600 space-y-3"
                                >
                                    <div className="flex items-center gap-3">
                                        <Avatar className="size-14 shrink-0 overflow-hidden rounded-full border-2 border-amber-500 dark:border-amber-400">
                                            <AvatarImage src={displayAvatar ?? undefined} alt={user.name} />
                                            <AvatarFallback className="rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 text-sm font-medium">
                                                {user.name ? initials : <User className="size-7" />}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 space-y-2">
                                            <input
                                                ref={fileInputRef}
                                                id="sim_profile_image"
                                                name="profile_image"
                                                type="file"
                                                accept="image/jpeg,image/png,image/gif,image/webp"
                                                className="hidden"
                                                onChange={handleFileChange}
                                            />
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="border-amber-500/50 text-amber-700 dark:text-amber-300"
                                                    onClick={() => fileInputRef.current?.click()}
                                                >
                                                    Choose photo
                                                </Button>
                                                {(user.avatar || previewUrl) && (
                                                    <Label className="flex cursor-pointer items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400">
                                                        <input
                                                            type="checkbox"
                                                            name="remove_profile_image"
                                                            value="1"
                                                            className="rounded border-zinc-400"
                                                        />
                                                        Remove photo
                                                    </Label>
                                                )}
                                            </div>
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                                JPG, PNG, GIF or WebP. Max 2MB. Same photo on web and app.
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        type="submit"
                                        size="sm"
                                        disabled={saving}
                                        className="w-full bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700"
                                    >
                                        {saving ? 'Saving…' : 'Save photo'}
                                    </Button>
                                </form>
                            </section>

                            <section>
                                <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-2">
                                    Account
                                </h2>
                                <div className="rounded-xl bg-zinc-100 dark:bg-zinc-700/50 px-4 py-2 border border-zinc-200 dark:border-zinc-600">
                                    <DetailRow label="Name" value={user.name} />
                                    <DetailRow label="Email" value={user.email} />
                                    <DetailRow
                                        label="Role"
                                        value={user.role}
                                    />
                                </div>
                            </section>

                            <section>
                                <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-2">
                                    Stats
                                </h2>
                                <div className="rounded-xl bg-zinc-100 dark:bg-zinc-700/50 px-4 py-2 border border-zinc-200 dark:border-zinc-600">
                                    <DetailRow
                                        label="Points balance"
                                        value={user.points_balance}
                                    />
                                    <DetailRow label="Level" value={user.level} />
                                    <DetailRow
                                        label="Quests completed"
                                        value={user.total_completed_quests}
                                    />
                                    <DetailRow
                                        label="Quests won"
                                        value={user.quests_won}
                                    />
                                    <DetailRow
                                        label="Total XP earned"
                                        value={user.total_xp_earned}
                                    />
                                </div>
                            </section>

                            {(user.school_id ||
                                user.first_name ||
                                user.last_name ||
                                user.course != null ||
                                user.year_level != null ||
                                user.section) && (
                                <section>
                                    <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-2">
                                        School info
                                    </h2>
                                    <div className="rounded-xl bg-zinc-100 dark:bg-zinc-700/50 px-4 py-2 border border-zinc-200 dark:border-zinc-600">
                                        <DetailRow
                                            label="School ID"
                                            value={user.school_id}
                                        />
                                        <DetailRow
                                            label="First name"
                                            value={user.first_name}
                                        />
                                        <DetailRow
                                            label="Last name"
                                            value={user.last_name}
                                        />
                                        <DetailRow
                                            label="Course"
                                            value={user.course}
                                        />
                                        <DetailRow
                                            label="Year level"
                                            value={user.year_level}
                                        />
                                        <DetailRow
                                            label="Section"
                                            value={user.section}
                                        />
                                    </div>
                                </section>
                            )}
                        </div>
                    </div>

                    <div className="mt-4 flex flex-col items-center gap-2 text-center">
                        <Link
                            href="/simulation/transactions"
                            className="text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
                        >
                            My transactions (simulation)
                        </Link>
                        <Link
                            href="/simulation/store"
                            className="text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
                        >
                            Store (simulation)
                        </Link>
                        <Link
                            href="/simulation/leaderboard"
                            className="text-sm font-medium text-amber-600 dark:text-amber-400 hover:underline"
                        >
                            Leaderboard (simulation)
                        </Link>
                        <Link
                            href="/simulation/achievements"
                            className="text-sm font-medium text-amber-600 dark:text-amber-400 hover:underline"
                        >
                            Achievements (simulation)
                        </Link>
                        <Link
                            href="/simulation/login"
                            className="text-sm text-zinc-500 dark:text-zinc-400 hover:underline"
                        >
                            Student log in
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
