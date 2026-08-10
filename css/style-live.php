<?php
declare(strict_types=1);
header('Content-Type: text/css; charset=UTF-8');
header('Cache-Control: no-cache, max-age=0, must-revalidate');
readfile(__DIR__ . '/style.css');
echo "\n";
readfile(__DIR__ . '/site-overrides.css');
