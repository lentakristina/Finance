<?php

return [

        'paths' => ['api/*', 'login', 'register', 'logout', 'refresh', 'me'],

        'allowed_methods' => ['*'],

        'allowed_origins' => [
            'http://localhost:3000', // ✅ izinkan React dev server
        ],

        'allowed_origins_patterns' => [],

        'allowed_headers' => ['*'],

        'exposed_headers' => [],

        'max_age' => 0,

        'supports_credentials' => false,

];
