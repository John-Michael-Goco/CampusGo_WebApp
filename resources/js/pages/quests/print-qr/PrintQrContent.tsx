import { QRCodeSVG } from 'qrcode.react';
import { useMemo } from 'react';

type Stage = { id: number; stage_number: number };

function chunk<T>(arr: T[], size: number): T[][] {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
        out.push(arr.slice(i, i + size));
    }
    return out;
}

type Props = {
    quest: { id: number; title: string };
    stages: Stage[];
    origin?: string;
};

const QR_SIZE_SCREEN = 220;
const QR_SIZE_PRINT = 330;

export default function PrintQrContent({ quest, stages, origin = '' }: Props) {
    const baseOrigin = origin || (typeof window !== 'undefined' ? window.location.origin : '');
    const screenRows = useMemo(() => chunk(stages, 2), [stages]);
    const printPages = useMemo(() => chunk(stages, 4), [stages]);
    const hasStages = stages.length > 0;

    return (
        <>
            <style>{`
                @media print {
                    @page { margin: 0; }

                    /* Hide sidebar, header, and screen-only elements */
                    [data-slot="sidebar"] { display: none !important; }
                    [data-slot="sidebar-inset"] > header { display: none !important; }
                    .print-qr-screen { display: none !important; }
                    .print-qr-toolbar { display: none !important; }

                    /* Show the print-only layout */
                    .print-qr-pdf { display: block !important; }

                    /* Remove all overflow restrictions so page breaks work */
                    [data-slot="sidebar-wrapper"],
                    [data-slot="sidebar-inset"],
                    .print-qr-wrapper {
                        overflow: visible !important;
                        max-height: none !important;
                        height: auto !important;
                    }

                    /* Force each page to start on a new sheet */
                    .print-qr-sheet {
                        display: block !important;
                        page-break-before: always;
                        break-before: page;
                        page-break-inside: avoid;
                        break-inside: avoid;
                    }
                    .print-qr-sheet:first-child {
                        page-break-before: auto;
                        break-before: auto;
                    }
                }
            `}</style>

            {/* === SCREEN LAYOUT: 2 per row === */}
            <div className="print-qr-screen w-full space-y-8">
                {!hasStages && (
                    <p className="text-muted-foreground py-8 text-center text-sm">
                        No stages to show. Add stages to this quest to print QR codes.
                    </p>
                )}
                {hasStages && screenRows.map((row, rowIdx) => (
                    <div key={rowIdx} className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                        {row.map((stage) => (
                            <div
                                key={stage.id}
                                className="flex flex-col items-center justify-center rounded-lg border bg-card p-6"
                            >
                                <p className="mb-3 text-lg font-medium">
                                    {quest.title} – Stage {stage.stage_number}
                                </p>
                                <QRCodeSVG
                                    value={`${baseOrigin}/quests/${quest.id}/stages/${stage.id}`}
                                    size={QR_SIZE_SCREEN}
                                    level="M"
                                    includeMargin
                                    className="rounded"
                                />
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            {/* === PRINT LAYOUT: 4 per page (2×2), hidden on screen === */}
            <div className="print-qr-pdf" style={{ display: 'none' }}>
                {printPages.map((pageStages, pageIdx) => (
                    <div key={pageIdx} className="print-qr-sheet" style={{ padding: '12px 16px' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, textAlign: 'center', marginBottom: '8px', color: '#000' }}>
                            Quest: {quest.title}
                        </h2>
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: pageStages.length === 1 ? '1fr' : '1fr 1fr',
                                gap: '8px',
                                justifyItems: 'center',
                                alignItems: 'center',
                            }}
                        >
                            {pageStages.map((stage) => (
                                <div
                                    key={stage.id}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: '2px solid rgb(200, 210, 231)',
                                        borderRadius: '8px',
                                        padding: '8px',
                                    }}
                                >
                                    <p style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '4px', color: '#000' }}>
                                        {quest.title} – Stage {stage.stage_number}
                                    </p>
                                    <QRCodeSVG
                                        value={`${baseOrigin}/quests/${quest.id}/stages/${stage.id}`}
                                        size={QR_SIZE_PRINT}
                                        level="M"
                                        includeMargin
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}
