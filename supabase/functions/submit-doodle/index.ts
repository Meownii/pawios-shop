import { createClient } from 'npm:@supabase/supabase-js@2';

const MAX_IMAGE_BYTES = 512 * 1024;
const MAX_BODY_BYTES = 720 * 1024;
const encoder = new TextEncoder();
const ALLOWED_ORIGINS = new Set(['https://meownii.github.io']);

Deno.serve(async (request: Request) => {
  const origin = request.headers.get('origin') ?? '';
  const corsOrigin = ALLOWED_ORIGINS.has(origin) ? origin : '';
  const headers = {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store'
  };
  const reply = (status: number, body: Record<string, unknown>) => new Response(JSON.stringify(body), { status, headers });
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (request.method !== 'POST') return reply(405, { error: 'Method not allowed' });
  if (!corsOrigin) return reply(403, { error: 'Origin not allowed' });

  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (contentLength > MAX_BODY_BYTES) return reply(413, { error: 'Submission too large' });
  let payload: { nickname?: unknown; image?: unknown; website?: unknown };
  try {
    const raw = await request.text();
    if (encoder.encode(raw).byteLength > MAX_BODY_BYTES) return reply(413, { error: 'Submission too large' });
    payload = JSON.parse(raw);
  } catch { return reply(400, { error: 'Invalid submission' }); }

  if (typeof payload.website === 'string' && payload.website.length > 0) return reply(200, { accepted: true });
  const nickname = typeof payload.nickname === 'string' ? payload.nickname.trim().slice(0, 24) : '';
  if (typeof payload.image !== 'string' || payload.image.length > Math.ceil(MAX_IMAGE_BYTES * 4 / 3) + 8) return reply(413, { error: 'Image too large' });

  let bytes: Uint8Array;
  try {
    const binary = atob(payload.image);
    bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
  } catch { return reply(400, { error: 'Invalid image' }); }
  if (bytes.byteLength < 8 || bytes.byteLength > MAX_IMAGE_BYTES || bytes[0] !== 0x89 || bytes[1] !== 0x50 || bytes[2] !== 0x4e || bytes[3] !== 0x47 || bytes[4] !== 0x0d || bytes[5] !== 0x0a || bytes[6] !== 0x1a || bytes[7] !== 0x0a) return reply(400, { error: 'Only PNG images up to 512 KiB are accepted' });
  if (bytes.byteLength < 24) return reply(400, { error: 'Invalid PNG image' });
  const width = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(16, false);
  const height = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(20, false);
  if (!width || !height || width > 2048 || height > 2048 || width * height > 4_194_304) return reply(400, { error: 'Image dimensions are too large' });

  const projectUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!projectUrl || !serviceKey) return reply(503, { error: 'Submission service is not configured' });

  const ip = request.headers.get('cf-connecting-ip') ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const hmacKey = await crypto.subtle.importKey('raw', encoder.encode(serviceKey), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const digest = await crypto.subtle.sign('HMAC', hmacKey, encoder.encode(ip));
  const ipHash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  const windowKey = `${ipHash}:${Math.floor(Date.now() / (15 * 60 * 1000))}`;
  const supabase = createClient(projectUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: allowedSubmission, error: limitError } = await supabase.rpc('consume_doodle_submission', { p_window_key: windowKey });
  if (limitError) return reply(503, { error: 'Submission service is not configured' });
  if (allowedSubmission !== true) return reply(429, { error: 'Please wait before sending another doodle' });

  const id = crypto.randomUUID();
  const imagePath = `${id}.png`;
  const { error: uploadError } = await supabase.storage.from('doodle-submissions').upload(imagePath, bytes, { contentType: 'image/png', cacheControl: '3600', upsert: false });
  if (uploadError) return reply(503, { error: 'Drawing could not be saved' });
  const { error: insertError } = await supabase.from('doodles').insert({ id, nickname: nickname || 'Anonymous', image_path: imagePath });
  if (insertError) {
    await supabase.storage.from('doodle-submissions').remove([imagePath]);
    return reply(503, { error: 'Drawing could not be saved' });
  }
  return reply(201, { accepted: true, status: 'pending' });
});
