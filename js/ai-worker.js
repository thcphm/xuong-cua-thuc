/* Chạy mô hình AI trong luồng riêng để trang không bị đơ. Dữ liệu người dùng ở lại trong máy. */
import { pipeline, env, TextStreamer } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.2';

env.allowLocalModels = false;
const pipes = new Map();

function load(task, model, options) {
  const key = task + '|' + model + '|' + JSON.stringify(options || {});
  if (!pipes.has(key)) {
    pipes.set(key, pipeline(task, model, Object.assign({}, options, {
      progress_callback: (p) => postMessage({ type: 'progress', model, data: { status: p.status, file: p.file, loaded: p.loaded, total: p.total } })
    })).catch((e) => { pipes.delete(key); throw e; }));
  }
  return pipes.get(key);
}

const JOBS = {
  async translate({ model, text, id }) {
    const run = await load('translation', model, { dtype: 'q8' });
    postMessage({ type: 'ready', id });
    const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
    const out = [];
    for (const line of lines) {
      const parts = line.match(/[^.!?]+[.!?]*\s*/g) || [line];
      const done = [];
      for (const part of parts) {
        const r = await run(part.trim(), { max_new_tokens: 200 });
        done.push(r[0].translation_text);
        postMessage({ type: 'partial', id, text: out.concat(done.join(' ')).join('\n') });
      }
      out.push(done.join(' '));
    }
    return out.join('\n');
  },
  async speech({ model, audio, language, id }) {
    const run = await load('automatic-speech-recognition', model, { dtype: { encoder_model: 'q8', decoder_model_merged: 'q8' } });
    postMessage({ type: 'ready', id });
    const opts = { task: 'transcribe', chunk_length_s: 30, stride_length_s: 5 };
    if (language !== 'auto') opts.language = language;
    const r = await run(audio, opts);
    return r.text.trim();
  },
  async detect({ model, url, id }) {
    const run = await load('object-detection', model, { dtype: 'q8' });
    postMessage({ type: 'ready', id });
    return run(url, { threshold: 0.6 });
  },
  async cutout({ model, url, id }) {
    const run = await load('image-segmentation', model, { dtype: 'q8' });
    postMessage({ type: 'ready', id });
    const r = await run(url);
    const mask = r[0].mask;
    return { data: mask.data, width: mask.width, height: mask.height, channels: mask.channels };
  },
  async chat({ model, messages, device, dtype, id }) {
    const run = await load('text-generation', model, { device, dtype });
    postMessage({ type: 'ready', id });
    let text = '';
    const streamer = new TextStreamer(run.tokenizer, {
      skip_prompt: true, skip_special_tokens: true,
      callback_function: (t) => { text += t; postMessage({ type: 'partial', id, text }); }
    });
    await run(messages, { max_new_tokens: 256, do_sample: true, temperature: 0.6, top_p: 0.9, repetition_penalty: 1.15, streamer });
    return text;
  }
};

onmessage = async (e) => {
  const { id, job } = e.data;
  try {
    const result = await JOBS[job](e.data);
    postMessage({ type: 'done', id, result });
  } catch (err) {
    postMessage({ type: 'error', id, message: String((err && err.message) || err) });
  }
};
postMessage({ type: 'boot' });
