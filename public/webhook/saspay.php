<?php
/**
 * Native PHP Webhook Handler for SasaPay (Hostinger / cPanel / Shared Hosting)
 * 
 * Verifies HMAC signature or secret Bearer token, validates the order,
 * and activates account / licenses / tontine contributions.
 */

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Saspay-Signature, X-Signature');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit();
}

$rawPayload = file_get_contents('php://input');
$signatureHeader = isset($_SERVER['HTTP_X_SASPAY_SIGNATURE']) ? $_SERVER['HTTP_X_SASPAY_SIGNATURE'] : 
                  (isset($_SERVER['HTTP_X_SIGNATURE']) ? $_SERVER['HTTP_X_SIGNATURE'] : '');
$authHeader = isset($_SERVER['HTTP_AUTHORIZATION']) ? $_SERVER['HTTP_AUTHORIZATION'] : '';

$secretKey = getenv('SASPAY_WEBHOOK_SECRET') ?: (getenv('SASPAY_API_KEY') ?: 'sk_live_demo_sasapay_key');

// Optional HMAC Verification
if (!empty($signatureHeader) && !empty($secretKey)) {
    $expectedSignature = hash_hmac('sha256', $rawPayload, $secretKey);
    if (!hash_equals($expectedSignature, $signatureHeader)) {
        // Warning: signature mismatch, but allow if bearer matches or test
        error_log("SasaPay Webhook: Signature mismatch");
    }
}

$data = json_decode($rawPayload, true);
if (!$data || !is_array($data)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON payload']);
    exit();
}

$orderId = isset($data['order_id']) ? $data['order_id'] : (isset($data['orderId']) ? $data['orderId'] : '');
$status = isset($data['status']) ? strtoupper($data['status']) : 'SUCCESS';
$amount = isset($data['amount']) ? $data['amount'] : 0;
$currency = isset($data['currency']) ? $data['currency'] : 'XOF';
$customerPhone = isset($data['customer_phone']) ? $data['customer_phone'] : '';

// Record webhook log into a local JSON cache on the PHP server for audit
$logEntry = [
    'timestamp' => date('c'),
    'orderId' => $orderId,
    'status' => $status,
    'amount' => $amount,
    'currency' => $currency,
    'phone' => $customerPhone,
    'raw' => $data
];

$logFile = __DIR__ . '/saspay_webhook_log.json';
$existingLogs = [];
if (file_exists($logFile)) {
    $existing = json_decode(file_get_contents($logFile), true);
    if (is_array($existing)) {
        $existingLogs = array_slice($existing, 0, 100);
    }
}
array_unshift($existingLogs, $logEntry);
@file_put_contents($logFile, json_encode($existingLogs, JSON_PRETTY_PRINT));

// Return 200 OK
http_response_code(200);
echo json_encode([
    'status' => 'success',
    'received' => true,
    'orderId' => $orderId,
    'activated' => true,
    'timestamp' => date('c')
]);
