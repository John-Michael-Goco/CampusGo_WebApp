import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, XCircle, Send, Trophy, Clock, LogOut } from 'lucide-react';
import { useState } from 'react';

type Choice = {
    id: number;
    choice_text: string;
};

type Question = {
    id: number;
    question_text: string;
    question_type: 'multiple_choice' | 'qr_scan';
    already_answered: boolean;
    choices: Choice[];
};

type Stage = {
    id: number;
    stage_number: number;
    location_hint: string;
    max_survivors: number;
    passing_score: number | null;
    stage_deadline: string | null;
    questions: Question[];
};

type Participant = {
    id: number;
    quest_id: number;
    quest_title: string;
    quest_description: string | null;
    quest_type: 'daily' | 'event' | 'custom' | 'enrollment';
    question_type: 'multiple_choice' | 'qr_scan';
    quest_reward_points: number;
    quest_reward_custom_prize: string | null;
    is_elimination: boolean;
    current_stage: number;
    status: 'active' | 'eliminated' | 'quit' | 'winner' | 'awaiting_ranking';
    total_stages: number;
    can_quit?: boolean;
    quit_guard_reason?: string | null;
};

type SubmissionEntry = {
    id: number;
    question_id: number;
    answer: string;
    is_correct: boolean;
    submitted_at: string;
};

type Props = {
    participant: Participant;
    stage: Stage | null;
    submissions: SubmissionEntry[];
    stage_locked?: boolean;
    next_stage_opens_at?: string | null;
    next_stage_number?: number | null;
};

export default function QuestPlay({
    participant,
    stage,
    submissions,
    stage_locked: stageLocked = false,
    next_stage_opens_at: nextStageOpensAt = null,
    next_stage_number: nextStageNumber = null,
}: Props) {
    const page = usePage();
    const errors = (page.props as { errors?: Record<string, string> }).errors ?? {};
    const flash = (page.props as { flash?: { status?: string } }).flash;
    const status = flash?.status;

    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [quitting, setQuitting] = useState(false);

    const submittedQuestionIds = new Set(submissions.map((s) => s.question_id));

    const unansweredQuestions = stage?.questions.filter((q) => !q.already_answered && !submittedQuestionIds.has(q.id)) ?? [];
    const allAnswered = stage ? unansweredQuestions.length === 0 : true;

    const isFinished = participant.status === 'winner' || participant.status === 'eliminated' || participant.status === 'quit' || participant.status === 'awaiting_ranking' || stageLocked;

    const setAnswer = (questionId: number, value: string) => {
        setAnswers((prev) => ({ ...prev, [questionId]: value }));
    };

    const handleSubmit = () => {
        if (unansweredQuestions.length === 0) return;

        const payload = unansweredQuestions
            .filter((q) => answers[q.id] !== undefined && answers[q.id] !== '')
            .map((q) => ({
                question_id: q.id,
                answer: answers[q.id],
            }));

        if (payload.length === 0) return;

        setSubmitting(true);
        router.post(`/simulation/quests/${participant.id}/submit`, { answers: payload }, {
            preserveScroll: true,
            onFinish: () => {
                setSubmitting(false);
                setAnswers({});
            },
        });
    };

    const answeredCount = unansweredQuestions.filter((q) => answers[q.id] !== undefined && answers[q.id] !== '').length;

    return (
        <>
            <Head title={`${participant.quest_title} — Quest Play`} />
            <div className="min-h-svh bg-zinc-100 dark:bg-zinc-900 flex flex-col items-center justify-start p-4 safe-area-padding">
                <div className="w-full max-w-[400px] min-h-[500px] bg-white dark:bg-zinc-800 rounded-[2rem] shadow-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 flex flex-col">
                    {/* Status bar */}
                    <div className={`h-10 shrink-0 flex items-end justify-center pb-2 ${
                        isFinished
                            ? participant.status === 'winner'
                                ? 'bg-amber-500 dark:bg-amber-600'
                                : stageLocked
                                    ? 'bg-slate-500 dark:bg-slate-600'
                                    : participant.status === 'awaiting_ranking'
                                        ? 'bg-yellow-500 dark:bg-yellow-600'
                                        : 'bg-red-500 dark:bg-red-600'
                            : 'bg-indigo-600 dark:bg-indigo-700'
                    }`}>
                        <div className="w-24 h-1.5 rounded-full bg-black/20 dark:bg-white/20" />
                    </div>

                    <div className="flex-1 overflow-y-auto flex flex-col">
                        {/* Header */}
                        <div className="p-4 border-b border-zinc-200 dark:border-zinc-700">
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                <button
                                    type="button"
                                    onClick={() => router.get('/simulation/quests')}
                                    className="flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                                >
                                    <ArrowLeft className="size-4" />
                                    Back to quests
                                </button>
                                {(participant.status === 'active' || participant.status === 'awaiting_ranking') && (
                                    <button
                                        type="button"
                                        disabled={!participant.can_quit || quitting}
                                        onClick={() => {
                                            if (!participant.can_quit) return;
                                            setQuitting(true);
                                            router.post(`/simulation/quests/${participant.id}/quit`, {}, {
                                                onFinish: () => setQuitting(false),
                                            });
                                        }}
                                        title={participant.quit_guard_reason ?? undefined}
                                        className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400 hover:underline disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:no-underline"
                                    >
                                        <LogOut className="size-4" />
                                        {quitting ? 'Leaving…' : 'Quit quest'}
                                    </button>
                                )}
                            </div>
                            {participant.quit_guard_reason && (participant.status === 'active' || participant.status === 'awaiting_ranking') && (
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                                    {participant.quit_guard_reason}
                                </p>
                            )}
                            <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                                {participant.quest_title}
                            </h1>
                            {participant.quest_description && (
                                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                                    {participant.quest_description}
                                </p>
                            )}
                            <div className="mt-2 flex flex-wrap gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                                <span>Stage {participant.current_stage}/{participant.total_stages}</span>
                                <span>Reward: {participant.quest_reward_points} pts</span>
                                {participant.is_elimination && (
                                    <span className="text-red-500 dark:text-red-400 font-medium">Elimination mode</span>
                                )}
                            </div>
                        </div>

                        {/* Flash / errors */}
                        {status && (
                            <div className="mx-4 mt-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 px-3 py-2">
                                <p className="text-sm text-indigo-700 dark:text-indigo-300">{status}</p>
                            </div>
                        )}
                        {Object.keys(errors).length > 0 && (
                            <div className="mx-4 mt-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-3 py-2">
                                {Object.values(errors).map((err, i) => (
                                    <p key={i} className="text-sm text-red-700 dark:text-red-300">{String(err)}</p>
                                ))}
                            </div>
                        )}

                        {/* Finished states */}
                        {participant.status === 'winner' && (
                            <div className="m-4 rounded-xl border-2 border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-950/30 p-6 flex flex-col items-center gap-3">
                                <div className="flex size-16 items-center justify-center rounded-full bg-amber-500 text-white">
                                    <Trophy className="size-10" />
                                </div>
                                <h2 className="text-xl font-bold text-amber-700 dark:text-amber-300">
                                    Quest Completed!
                                </h2>
                                <p className="text-sm text-zinc-600 dark:text-zinc-400 text-center">
                                    You earned <strong>{participant.quest_reward_points} points</strong>
                                    {participant.quest_reward_custom_prize && (
                                        <> and <strong>{participant.quest_reward_custom_prize}</strong></>
                                    )}
                                    .
                                </p>
                                {participant.quest_type === 'enrollment' && (
                                    <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 text-center">
                                        You are now enrolled for this semester!
                                    </p>
                                )}
                            </div>
                        )}

                        {participant.status === 'eliminated' && (
                            <div className="m-4 rounded-xl border-2 border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-950/30 p-6 flex flex-col items-center gap-3">
                                <div className="flex size-16 items-center justify-center rounded-full bg-red-500 text-white">
                                    <XCircle className="size-10" />
                                </div>
                                <h2 className="text-xl font-bold text-red-700 dark:text-red-300">
                                    Eliminated
                                </h2>
                                <p className="text-sm text-zinc-600 dark:text-zinc-400 text-center">
                                    You didn't pass this stage. Better luck next time!
                                </p>
                            </div>
                        )}

                        {stageLocked && nextStageNumber != null && nextStageOpensAt && (
                            <div className="m-4 rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-950/30 p-6 flex flex-col items-center gap-3">
                                <div className="flex size-16 items-center justify-center rounded-full bg-slate-500 text-white">
                                    <Clock className="size-10" />
                                </div>
                                <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300">
                                    Stage {nextStageNumber} Not Yet Open
                                </h2>
                                <p className="text-sm text-zinc-600 dark:text-zinc-400 text-center">
                                    You&apos;ve advanced. Stage {nextStageNumber} opens at the time below. Come back then to continue.
                                </p>
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    {new Date(nextStageOpensAt).toLocaleString()}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => router.reload()}
                                    className="mt-2 px-4 py-2 rounded-lg text-sm font-medium bg-slate-500 text-white hover:bg-slate-600"
                                >
                                    Refresh
                                </button>
                            </div>
                        )}

                        {participant.status === 'awaiting_ranking' && !stageLocked && (
                            <div className="m-4 rounded-xl border-2 border-yellow-300 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-950/30 p-6 flex flex-col items-center gap-3">
                                <div className="flex size-16 items-center justify-center rounded-full bg-yellow-500 text-white">
                                    <Clock className="size-10" />
                                </div>
                                <h2 className="text-xl font-bold text-yellow-700 dark:text-yellow-300">
                                    Waiting for Results
                                </h2>
                                <p className="text-sm text-zinc-600 dark:text-zinc-400 text-center">
                                    Your answers have been submitted. Waiting for other participants to finish or the stage deadline to pass.
                                </p>
                                {stage?.stage_deadline && (
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                        Stage deadline: {new Date(stage.stage_deadline).toLocaleString()}
                                    </p>
                                )}
                                <button
                                    type="button"
                                    onClick={() => router.reload()}
                                    className="mt-2 px-4 py-2 rounded-lg text-sm font-medium bg-yellow-500 text-white hover:bg-yellow-600"
                                >
                                    Refresh
                                </button>
                            </div>
                        )}

                        {/* Active: show stage */}
                        {participant.status === 'active' && stage && !stageLocked && (
                            <div className="flex-1 p-4 space-y-4">
                                <div className="rounded-lg bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 p-3">
                                    <h2 className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                                        Stage {stage.stage_number} — {stage.location_hint}
                                    </h2>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                                        {stage.stage_deadline && (
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                                Deadline: {new Date(stage.stage_deadline).toLocaleString()}
                                            </p>
                                        )}
                                        {!participant.is_elimination && participant.question_type === 'multiple_choice' && stage.passing_score != null && (
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                                Passing score: {stage.passing_score}/{stage.questions.length}
                                            </p>
                                        )}
                                        {participant.is_elimination && stage.max_survivors > 0 && (
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                                Max survivors: {stage.max_survivors}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {allAnswered && !isFinished && (
                                    <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 px-3 py-2 flex items-center gap-2">
                                        <CheckCircle2 className="size-4 text-emerald-600" />
                                        <p className="text-sm text-emerald-700 dark:text-emerald-300">
                                            All questions answered for this stage!
                                        </p>
                                    </div>
                                )}

                                {/* Questions */}
                                <div className="space-y-4">
                                    {stage.questions.map((question, qIndex) => {
                                        const isAnswered = question.already_answered || submittedQuestionIds.has(question.id);
                                        const submission = submissions.find((s) => s.question_id === question.id);

                                        return (
                                            <div
                                                key={question.id}
                                                className={`rounded-xl border p-4 ${
                                                    isAnswered
                                                        ? question.question_type === 'qr_scan'
                                                            ? 'border-indigo-200 dark:border-indigo-700 bg-indigo-50/50 dark:bg-indigo-950/20'
                                                            : submission?.is_correct
                                                                ? 'border-emerald-200 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20'
                                                                : 'border-red-200 dark:border-red-700 bg-red-50/50 dark:bg-red-950/20'
                                                        : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50'
                                                }`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <span className="shrink-0 flex size-7 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                                                        {qIndex + 1}
                                                    </span>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-medium text-zinc-900 dark:text-zinc-100 text-sm">
                                                            {question.question_text}
                                                        </p>

                                                        {isAnswered && submission && (
                                                            <div className={`mt-2 flex items-center gap-1.5 text-xs font-medium ${
                                                                question.question_type === 'qr_scan'
                                                                    ? 'text-indigo-600 dark:text-indigo-400'
                                                                    : submission.is_correct
                                                                        ? 'text-emerald-600 dark:text-emerald-400'
                                                                        : 'text-red-600 dark:text-red-400'
                                                            }`}>
                                                                {question.question_type === 'qr_scan' ? (
                                                                    <>
                                                                        <CheckCircle2 className="size-4" />
                                                                        Submitted (Stage ID: {submission.answer})
                                                                    </>
                                                                ) : submission.is_correct ? (
                                                                    <>
                                                                        <CheckCircle2 className="size-4" />
                                                                        Correct!
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <XCircle className="size-4" />
                                                                        Incorrect
                                                                    </>
                                                                )}
                                                            </div>
                                                        )}

                                                        {!isAnswered && question.question_type === 'multiple_choice' && (
                                                            <div className="mt-3 space-y-2">
                                                                {question.choices.map((choice) => (
                                                                    <label
                                                                        key={choice.id}
                                                                        className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm cursor-pointer transition-colors ${
                                                                            answers[question.id] === String(choice.id)
                                                                                ? 'border-indigo-400 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300'
                                                                                : 'border-zinc-200 dark:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 text-zinc-700 dark:text-zinc-300'
                                                                        }`}
                                                                    >
                                                                        <input
                                                                            type="radio"
                                                                            name={`q-${question.id}`}
                                                                            value={choice.id}
                                                                            checked={answers[question.id] === String(choice.id)}
                                                                            onChange={() => setAnswer(question.id, String(choice.id))}
                                                                            className="accent-indigo-600"
                                                                        />
                                                                        {choice.choice_text}
                                                                    </label>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {!isAnswered && question.question_type === 'qr_scan' && (
                                                            <div className="mt-3">
                                                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1.5">
                                                                    Enter the stage ID to simulate scanning
                                                                </p>
                                                                <input
                                                                    type="number"
                                                                    value={answers[question.id] ?? ''}
                                                                    onChange={(e) => setAnswer(question.id, e.target.value)}
                                                                    placeholder="Stage ID"
                                                                    min={1}
                                                                    className="w-full rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Submit button */}
                                {unansweredQuestions.length > 0 && (
                                    <button
                                        type="button"
                                        disabled={submitting || answeredCount === 0}
                                        onClick={handleSubmit}
                                        className="w-full py-3 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                                    >
                                        <Send className="size-4" />
                                        {submitting
                                            ? 'Submitting…'
                                            : `Submit Answers (${answeredCount}/${unansweredQuestions.length})`
                                        }
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Submission history */}
                        {submissions.length > 0 && (
                            <div className="p-4 border-t border-zinc-200 dark:border-zinc-700">
                                <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                                    Submission History
                                </h3>
                                <div className="space-y-1.5">
                                    {submissions.map((s) => {
                                        const question = stage?.questions.find((q) => q.id === s.question_id);
                                        const isQrScan = question?.question_type === 'qr_scan';
                                        return (
                                            <div
                                                key={s.id}
                                                className={`flex items-center justify-between rounded-md px-3 py-1.5 text-xs ${
                                                    isQrScan
                                                        ? 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400'
                                                        : s.is_correct
                                                            ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400'
                                                            : 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400'
                                                }`}
                                            >
                                                <span>Question #{s.question_id}</span>
                                                <span className="font-medium">
                                                    {isQrScan ? 'Scanned' : s.is_correct ? 'Correct' : 'Wrong'}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Navigation */}
                <div className="mt-4 flex flex-col items-center gap-2 text-center">
                    <Link
                        href="/simulation/quests"
                        className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                        Back to my quests
                    </Link>
                    <Link
                        href="/simulation/store"
                        className="text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                        Store (simulation)
                    </Link>
                    <Link
                        href="/simulation/login"
                        className="text-sm text-zinc-500 dark:text-zinc-400 hover:underline"
                    >
                        Student log in
                    </Link>
                </div>
            </div>
        </>
    );
}
