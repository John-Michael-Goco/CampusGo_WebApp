import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const API_SIGNUP = '/api/auth/signup';

type ApiErrors = Record<string, string[]>;

export default function SimulationStudentRegister() {
    const [processing, setProcessing] = useState(false);
    const [success, setSuccess] = useState(false);
    const [errors, setErrors] = useState<ApiErrors>({});
    const [form, setForm] = useState({
        student_number: '',
        first_name: '',
        last_name: '',
        course: '',
        year_level: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});
        if (form.password !== form.password_confirmation) {
            setErrors((prev) => ({
                ...prev,
                password_confirmation: ['Passwords do not match.'],
            }));
            return;
        }
        setProcessing(true);
        try {
            const res = await fetch(API_SIGNUP, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    student_number: form.student_number,
                    first_name: form.first_name,
                    last_name: form.last_name,
                    course: form.course,
                    year_level: form.year_level ? parseInt(form.year_level, 10) : undefined,
                    email: form.email,
                    password: form.password,
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                if (res.status === 422 && data.errors) setErrors(data.errors as ApiErrors);
                else setErrors({ form: [data.message || 'Registration failed. Please try again.'] });
                setProcessing(false);
                return;
            }
            setSuccess(true);
        } catch {
            setErrors({ form: ['Network error. Please try again.'] });
        }
        setProcessing(false);
    };

    const firstError = errors.form?.[0];

    return (
        <>
            <Head title="Student sign up (simulation)" />
            <div className="min-h-svh bg-zinc-100 dark:bg-zinc-900 flex flex-col items-center justify-center p-4 safe-area-padding">
                {/* Mobile frame: narrow card */}
                <div className="w-full max-w-[400px] min-h-[560px] bg-white dark:bg-zinc-800 rounded-[2rem] shadow-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 flex flex-col">
                    {/* Status bar / notch area */}
                    <div className="h-10 shrink-0 bg-emerald-600 dark:bg-emerald-700 flex items-end justify-center pb-2">
                        <div className="w-24 h-1.5 rounded-full bg-black/20 dark:bg-white/20" />
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 pb-8">
                        <div className="flex flex-col items-center gap-1 mb-6">
                            <img
                                src="/images/logo.png"
                                alt="CampusGo"
                                className="h-14 w-auto"
                            />
                            <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                                Student sign up
                            </h1>
                            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                                Simulation only — for testing
                            </p>
                        </div>

                        {success ? (
                            <div className="flex flex-col gap-4 text-center py-4">
                                <p className="text-emerald-600 dark:text-emerald-400 font-medium">
                                    You&apos;re registered! You can log in with your email and password.
                                </p>
                                <Button asChild size="lg" className="mt-2 min-h-12">
                                    <Link href="/simulation/login">Go to log in</Link>
                                </Button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                                {firstError && (
                                    <div className="rounded-lg bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 text-sm p-3">
                                        {firstError}
                                    </div>
                                )}

                                <div className="grid gap-2">
                                    <Label htmlFor="student_number">Student number</Label>
                                    <Input
                                        id="student_number"
                                        name="student_number"
                                        type="text"
                                        required
                                        autoComplete="username"
                                        placeholder="e.g. 2024-001"
                                        value={form.student_number}
                                        onChange={handleChange}
                                        className="min-h-[44px] text-base"
                                    />
                                    <InputError message={errors.student_number?.[0]} />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="grid gap-2">
                                        <Label htmlFor="first_name">First name</Label>
                                        <Input
                                            id="first_name"
                                            name="first_name"
                                            type="text"
                                            required
                                            autoComplete="given-name"
                                            value={form.first_name}
                                            onChange={handleChange}
                                            className="min-h-[44px] text-base"
                                        />
                                        <InputError message={errors.first_name?.[0]} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="last_name">Last name</Label>
                                        <Input
                                            id="last_name"
                                            name="last_name"
                                            type="text"
                                            required
                                            autoComplete="family-name"
                                            value={form.last_name}
                                            onChange={handleChange}
                                            className="min-h-[44px] text-base"
                                        />
                                        <InputError message={errors.last_name?.[0]} />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="course">Course</Label>
                                    <Input
                                        id="course"
                                        name="course"
                                        type="text"
                                        required
                                        autoComplete="organization"
                                        placeholder="e.g. BS Computer Science"
                                        value={form.course}
                                        onChange={handleChange}
                                        className="min-h-[44px] text-base"
                                    />
                                    <InputError message={errors.course?.[0]} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="year_level">Year level</Label>
                                    <Input
                                        id="year_level"
                                        name="year_level"
                                        type="number"
                                        min={1}
                                        max={10}
                                        required
                                        placeholder="1–10"
                                        value={form.year_level}
                                        onChange={handleChange}
                                        className="min-h-[44px] text-base"
                                    />
                                    <InputError message={errors.year_level?.[0]} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        required
                                        autoComplete="email"
                                        placeholder="you@example.com"
                                        value={form.email}
                                        onChange={handleChange}
                                        className="min-h-[44px] text-base"
                                    />
                                    <InputError message={errors.email?.[0]} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="password">Password</Label>
                                    <Input
                                        id="password"
                                        name="password"
                                        type="password"
                                        required
                                        minLength={8}
                                        autoComplete="new-password"
                                        placeholder="Min 8 characters"
                                        value={form.password}
                                        onChange={handleChange}
                                        className="min-h-[44px] text-base"
                                    />
                                    <InputError message={errors.password?.[0]} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="password_confirmation">Confirm password</Label>
                                    <Input
                                        id="password_confirmation"
                                        name="password_confirmation"
                                        type="password"
                                        required
                                        autoComplete="new-password"
                                        value={form.password_confirmation}
                                        onChange={handleChange}
                                        className="min-h-[44px] text-base"
                                    />
                                    <InputError message={errors.password_confirmation?.[0]} />
                                </div>

                                <Button
                                    type="submit"
                                    size="lg"
                                    disabled={processing}
                                    className="mt-4 min-h-12 w-full text-base font-semibold bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700"
                                >
                                    {processing ? 'Creating account…' : 'Create account'}
                                </Button>
                            </form>
                        )}
                    </div>
                </div>

                <p className="mt-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
                    Already have an account?{' '}
                    <Link
                        href="/simulation/login"
                        className="font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                        Log in
                    </Link>
                    {' · '}
                    <Link
                        href="/simulation/store"
                        className="font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                        View store
                    </Link>
                </p>
            </div>
        </>
    );
}
