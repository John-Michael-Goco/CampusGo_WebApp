import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { Fragment, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'sileo';
import '../css/app.css';
import { initializeTheme } from './hooks/use-appearance';

const appName = import.meta.env.VITE_APP_NAME || 'CampusGo';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) =>
        resolvePageComponent(
            `./pages/${name}.tsx`,
            import.meta.glob('./pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <StrictMode>
                <Fragment>
                    <Toaster
                    position="top-right"
                    options={{
                        fill: 'var(--card)',
                        roundness: 16,
                        styles: {
                            title: 'font-semibold text-foreground',
                            description: 'text-muted-foreground',
                            badge: 'hidden',
                        },
                    }}
                />
                    <App {...props} />
                </Fragment>
            </StrictMode>,
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
