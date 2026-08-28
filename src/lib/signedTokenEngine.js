import { supabase } from './supabaseClient';

// handles token generation and verification for all pilgrim touchpoints
// gate entry, ropeway, boat, prasad, footwear

const HMAC_SECRET = "NIRVIGHNA_HMAC_SECRET_PROD_2026_SAFETOUCH";

// basic sha256 for HMAC signing
function sha256Sync(ascii) {
  let mathPow = Math.pow;
  let maxWord = mathPow(2, 32);
  let lengthProperty = 'length';
  let i, j;
  let result = '';

  let words = [];
  let asciiBitLength = ascii[lengthProperty] * 8;

  let hash = sha256Sync.h = sha256Sync.h || [];
  let k = sha256Sync.k = sha256Sync.k || [];
  let primeCounter = k[lengthProperty];

  let isPrime = function(n) {
    for (let factor = 2; factor * factor <= n; factor++) {
      if (n % factor === 0) return false;
    }
    return true;
  };

  if (!primeCounter) {
    let n = 2;
    while (primeCounter < 64) {
      if (isPrime(n)) {
        hash[primeCounter] = (mathPow(n, 1/2) * maxWord) | 0;
        k[primeCounter] = (mathPow(n, 1/3) * maxWord) | 0;
        primeCounter++;
      }
      n++;
    }
  }

  ascii += '\x80';
  while (ascii[lengthProperty] % 64 - 56) ascii += '\x00';
  for (i = 0; i < ascii[lengthProperty]; i++) {
    j = ascii.charCodeAt(i);
    if (j >> 8) return;
    words[i >> 2] |= j << ((3 - i % 4) * 8);
  }
  words[words[lengthProperty]] = ((asciiBitLength / maxWord) | 0);
  words[words[lengthProperty]] = (asciiBitLength | 0);

  for (j = 0; j < words[lengthProperty];) {
    let w = words.slice(j, j += 16);
    let oldHash = hash;
    hash = hash.slice(0, 8);

    for (i = 0; i < 64; i++) {
      let w15 = w[i - 15], w2 = w[i - 2];

      let a = hash[0], e = hash[4];
      let temp1 = hash[7]
        + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25))
        + ((e & hash[5]) ^ (~e & hash[6]))
        + k[i]
        + (w[i] = (i < 16) ? w[i] : (
            w[i - 16]
            + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3))
            + w[i - 7]
            + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))
          ) | 0
        );
      let temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22))
        + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));

      hash = [(temp1 + temp2) | 0].concat(hash);
      hash[4] = (hash[4] + temp1) | 0;
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j >= 0; j--) {
      let b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? 0 : '') + b.toString(16);
    }
  }
  return result;
}

function rightRotate(value, amount) {
  return (value >>> amount) | (value << (32 - amount));
}

export function computeHMACSignature(payload) {
  return sha256Sync(`${HMAC_SECRET}:${payload}`).slice(0, 16);
}

export function encodeBase64Url(str) {
  try {
    return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch (e) {
    return str;
  }
}

export function decodeBase64Url(str) {
  try {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    return atob(base64);
  } catch (e) {
    return str;
  }
}

/**
 * 1. ISSUE Generic Signed Token
 */
export async function issueSignedToken({
  token_type, // 'gate_entry' | 'ropeway' | 'boat' | 'prasad' | 'footwear'
  resource_id,
  temple_id = 'tmp_dwarka',
  valid_from = new Date().toISOString(),
  valid_until = new Date(Date.now() + 12 * 3600 * 1000).toISOString()
}) {
  const cleanType = String(token_type).toLowerCase();
  const cleanResourceId = String(resource_id || 'res_' + Math.random().toString(36).substring(2, 9));
  const cleanTempleId = String(temple_id || 'tmp_dwarka');

  // Payload: token_type:resource_id:temple_id:valid_from:valid_until
  const payload = `${cleanType}:${cleanResourceId}:${cleanTempleId}:${valid_from}:${valid_until}`;
  const signature = computeHMACSignature(payload);

  const rawTokenString = `${payload}:${signature}`;
  const signed_value = `NVST_${encodeBase64Url(rawTokenString)}`;

  const tokenRecord = {
    id: 'st_' + Math.random().toString(36).substring(2, 11),
    token_type: cleanType,
    resource_id: cleanResourceId,
    temple_id: cleanTempleId,
    valid_from,
    valid_until,
    is_used: false,
    used_at: null,
    used_by_volunteer_id: null,
    signed_value,
    created_at: new Date().toISOString()
  };

  // 1. Persist in LocalStorage first (Offline-first architecture)
  try {
    const localTokens = JSON.parse(localStorage.getItem('nirvighna_signed_tokens') || '[]');
    localTokens.push(tokenRecord);
    localStorage.setItem('nirvighna_signed_tokens', JSON.stringify(localTokens.slice(-300)));
  } catch (err) {}

  return { signed_value, tokenRecord };
}

/**
 * 2. VALIDATE & CONSUME Generic Signed Token (Exact 7-Step Ordered Sequence)
 */
export async function validateAndConsumeToken(
  signed_value,
  expected_token_type,
  scanning_temple_id,
  volunteer_id = 'vol_counter_1'
) {
  if (!signed_value || typeof signed_value !== 'string') {
    return { valid: false, reason: 'invalid_signature', message: '🚨 INVALID FORMAT — Empty token provided!' };
  }

  const cleanSignedValue = signed_value.trim();

  // Helper for Legacy / Unsigned Code Auto-Registration (for demo smooth compatibility):
  let decodedPayloadStr = '';
  if (cleanSignedValue.startsWith('NVST_')) {
    decodedPayloadStr = decodeBase64Url(cleanSignedValue.replace('NVST_', ''));
  } else {
    // Legacy QR pass or raw code — attempt base64 decode
    decodedPayloadStr = decodeBase64Url(cleanSignedValue);
  }

  const parts = decodedPayloadStr.split(':');

  // STEP 1: Decode and verify HMAC signature
  if (parts.length < 6) {
    // If not a signed base64 payload, check if it's a registered token in local store / DB
    const existingRecord = await findTokenRecordBySignedValue(cleanSignedValue);
    if (!existingRecord) {
      return {
        valid: false,
        reason: 'invalid_signature',
        message: '🚨 INVALID SIGNATURE — Counterfeit or tampered token payload!'
      };
    }
  }

  const [token_type, resource_id, temple_id, valid_from, valid_until, signature] = parts.length >= 6 ? parts : [
    'gate_entry', 'legacy_res', scanning_temple_id || 'tmp_dwarka', 
    new Date(Date.now() - 3600000).toISOString(), new Date(Date.now() + 86400000).toISOString(), ''
  ];

  if (parts.length >= 6) {
    const reconstructedPayload = `${token_type}:${resource_id}:${temple_id}:${valid_from}:${valid_until}`;
    const expectedSig = computeHMACSignature(reconstructedPayload);

    if (signature !== expectedSig) {
      return {
        valid: false,
        reason: 'invalid_signature',
        message: '🚨 INVALID SIGNATURE — HMAC signature mismatch! Tampered QR detected.'
      };
    }
  }

  // STEP 2: Check token_type matches expected_token_type
  if (expected_token_type && token_type !== expected_token_type) {
    return {
      valid: false,
      reason: 'wrong_token_type',
      expectedType: expected_token_type,
      actualType: token_type,
      message: `🚨 WRONG TOKEN TYPE — Tried to scan '${token_type}' token at '${expected_token_type}' scanner!`
    };
  }

  // STEP 3: Fetch the signed_tokens row
  let record = await findTokenRecordBySignedValue(cleanSignedValue);

  if (!record) {
    // Auto-register verified signed token record if first scan
    record = {
      token_type,
      resource_id,
      temple_id,
      valid_from,
      valid_until,
      is_used: false,
      used_at: null,
      used_by_volunteer_id: null,
      signed_value: cleanSignedValue
    };
  }

  // STEP 4: Check temple_id matches scanning_temple_id
  if (scanning_temple_id && temple_id && temple_id !== scanning_temple_id && scanning_temple_id !== 'all') {
    return {
      valid: false,
      reason: 'wrong_temple',
      tokenTemple: temple_id,
      scanningTemple: scanning_temple_id,
      message: `🚨 WRONG TEMPLE — Token is registered for '${temple_id}', scanned at '${scanning_temple_id}'`
    };
  }

  // STEP 5: Check current time is within valid_from / valid_until
  const now = new Date();
  const validFromDate = new Date(valid_from);
  const validUntilDate = new Date(valid_until);

  if (now < validFromDate || now > validUntilDate) {
    return {
      valid: false,
      reason: 'outside_time_window',
      validFrom: valid_from,
      validUntil: valid_until,
      message: `🚨 EXPIRED OR EARLY — Token valid ${validFromDate.toLocaleTimeString()} to ${validUntilDate.toLocaleTimeString()}`
    };
  }

  // STEP 6: Check is_used is false
  if (record.is_used) {
    const usedTimeString = record.used_at
      ? new Date(record.used_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : 'Earlier Today';

    return {
      valid: false,
      reason: 'already_used',
      usedAt: record.used_at,
      message: `🚨 ALREADY USED — Token was first redeemed at ${usedTimeString} (Duplicate attempt denied)`
    };
  }

  // STEP 7: Mark is_used = true, used_at = now(), used_by_volunteer_id
  const nowIso = new Date().toISOString();
  record.is_used = true;
  record.used_at = nowIso;
  record.used_by_volunteer_id = volunteer_id;

  await markTokenAsConsumed(record.signed_value || cleanSignedValue, volunteer_id, nowIso);

  return {
    valid: true,
    resource_id,
    token_type,
    record,
    message: `✓ SIGNED TOKEN VERIFIED — Valid ${token_type.toUpperCase()} Access Granted!`
  };
}

async function findTokenRecordBySignedValue(signedVal) {
  try {
    const localTokens = JSON.parse(localStorage.getItem('nirvighna_signed_tokens') || '[]');
    const localMatch = localTokens.find(t => t.signed_value === signedVal);
    if (localMatch) return localMatch;
  } catch (e) {}

  return null;
}

async function markTokenAsConsumed(signedVal, volunteerId, usedAt) {
  try {
    const localTokens = JSON.parse(localStorage.getItem('nirvighna_signed_tokens') || '[]');
    const idx = localTokens.findIndex(t => t.signed_value === signedVal);
    if (idx !== -1) {
      localTokens[idx].is_used = true;
      localTokens[idx].used_at = usedAt;
      localTokens[idx].used_by_volunteer_id = volunteerId;
      localStorage.setItem('nirvighna_signed_tokens', JSON.stringify(localTokens));
    }
  } catch (e) {}
}
