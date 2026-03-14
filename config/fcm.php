<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Firebase credentials
    |--------------------------------------------------------------------------
    | Path to the Firebase service account JSON file (from Firebase Console >
    | Project Settings > Service Accounts > Generate new private key).
    | Used for FCM HTTP v1 API authentication.
    */
    'credentials' => (function () {
        $path = env('FIREBASE_CREDENTIALS');
        if ($path === null || $path === '') {
            return storage_path('app/firebase-credentials.json');
        }
        // Resolve relative paths (e.g. storage/app/xxx.json) against project root
        if ($path[0] === '/' || (strlen($path) >= 2 && $path[1] === ':')) {
            return $path;
        }
        return base_path($path);
    })(),

    /*
    |--------------------------------------------------------------------------
    | FCM project ID (optional)
    |--------------------------------------------------------------------------
    | If not set, read from the credentials JSON "project_id".
    */
    'project_id' => env('FCM_PROJECT_ID'),
];
