<?php

return [
    'paths' => ['api/*', 'login', 'register', 'logout', 'refresh', 'me'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
    'http://localhost:3000',
    'https://finance-ashen-psi.vercel.app', // tambahkan ini
],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,
];