import { Head, Link, useForm } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

type Props = {
    status?: string;
};

export default function SimulationStudentLogin({ status }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/simulation/login');
    };

    return (
        <>
            <Head title="Student log in (simulation)" />
            <div className="min-h-svh bg-zinc-100 dark:bg-zinc-900 flex flex-col items-center justify-center p-4 safe-area-padding">
                <div className="w-full max-w-[400px] min-h-[400px] bg-white dark:bg-zinc-800 rounded-[2rem] shadow-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 flex flex-col">
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
                                Student log in
                            </h1>
                            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                                Simulation — students only
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            {status && (
                                <p className="text-sm text-emerald-600 dark:text-emerald-400">
                                    {status}
                                </p>
                            )}

                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    autoComplete="email"
                                    placeholder="you@example.com"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    className="min-h-[44px] text-base"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    autoComplete="current-password"
                                    placeholder="Password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    className="min-h-[44px] text-base"
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="remember"
                                    name="remember"
                                    checked={data.remember}
                                    onCheckedChange={(checked) =>
                                        setData('remember', checked === true)
                                    }
                                />
                                <Label htmlFor="remember" className="text-sm font-normal">
                                    Remember me
                                </Label>
                            </div>

                            <Button
                                type="submit"
                                size="lg"
                                disabled={processing}
                                className="mt-2 min-h-12 w-full text-base font-semibold bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700"
                            >
                                {processing && <Spinner />}
                                Log in
                            </Button>
                        </form>
                    </div>
                </div>

                <p className="mt-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
                    Don&apos;t have an account?{' '}
                    <Link
                        href="/simulation/student-register"
                        className="font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                        Sign up
                    </Link>
                    {' · '}
                    <Link
                        href="/login"
                        className="text-zinc-500 dark:text-zinc-400 hover:underline"
                    >
                        Staff login
                    </Link>
                </p>
            </div>
        </>
    );
}
