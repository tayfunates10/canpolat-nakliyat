<?php
declare(strict_types=1);
header('Content-Type: application/javascript; charset=UTF-8');
header('Cache-Control: no-cache, max-age=0, must-revalidate');
readfile(__DIR__ . '/script.js');
echo "\n";
readfile(__DIR__ . '/site-tuning.js');
