<?php
declare(strict_types=1);
header('Content-Type: application/javascript; charset=UTF-8');
header('Cache-Control: no-cache, no-store, max-age=0, must-revalidate');
readfile(__DIR__ . '/script.js');
echo "\n";
readfile(__DIR__ . '/site-tuning.js');
echo "\n";
readfile(__DIR__ . '/header-logo-fix.js');
echo "\n";
readfile(__DIR__ . '/shared-ui-final.js');
echo "\n";
readfile(__DIR__ . '/footer-regions-layout.js');
