/* Hub.sound: âm thanh làng quê tổng hợp bằng Web Audio, không cần file mp3.
 *   - ambience: tiếng ve kêu (mùa hè) + gió nhẹ, thỉnh thoảng tiếng sáo diều
 *   - sfx: tiếng sỏi, trống, chiêng nhỏ cho các trò
 * Mặc định TẮT; chỉ bật khi người dùng bấm nút 🔈 (trình duyệt cũng bắt buộc như vậy).
 */
(function () {
  'use strict';

  let ac = null, master = null, amb = null;
  let on = Hub.store.get('sound', false);
  const listeners = [];

  function ctx() {
    if (!ac) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ac = new AC();
      master = ac.createGain();
      master.gain.value = 0.6;
      master.connect(ac.destination);
    }
    if (ac.state === 'suspended') ac.resume();
    return ac;
  }

  function noiseBuffer(sec) {
    const len = Math.floor(ac.sampleRate * sec);
    const b = ac.createBuffer(1, len, ac.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }

  // ---------- Không khí nền ----------
  function startAmbience() {
    if (!ctx() || amb) return;
    const nodes = [];
    const out = ac.createGain();
    out.gain.value = 0;
    out.gain.linearRampToValueAtTime(0.5, ac.currentTime + 2);
    out.connect(master);

    // Gió: tiếng ồn trắng lọc thông thấp, cường độ lên xuống chậm
    const wind = ac.createBufferSource();
    wind.buffer = noiseBuffer(4); wind.loop = true;
    const wf = ac.createBiquadFilter(); wf.type = 'lowpass'; wf.frequency.value = 420;
    const wg = ac.createGain(); wg.gain.value = 0.05;
    const lfo = ac.createOscillator(); lfo.frequency.value = 0.08;
    const lfoG = ac.createGain(); lfoG.gain.value = 0.035;
    lfo.connect(lfoG).connect(wg.gain);
    wind.connect(wf).connect(wg).connect(out);
    wind.start(); lfo.start();
    nodes.push(wind, lfo);

    // Ve sầu: sóng răng cưa ~4.5 kHz bị điều biên nhanh, từng đợt dài ngắn khác nhau
    const cic = ac.createOscillator(); cic.type = 'sawtooth'; cic.frequency.value = 4400;
    const cf = ac.createBiquadFilter(); cf.type = 'bandpass'; cf.frequency.value = 4600; cf.Q.value = 6;
    const trem = ac.createGain(); trem.gain.value = 0;
    const am = ac.createOscillator(); am.type = 'square'; am.frequency.value = 38;
    const amG = ac.createGain(); amG.gain.value = 0.5;
    am.connect(amG).connect(trem.gain);
    const env = ac.createGain(); env.gain.value = 0;
    cic.connect(cf).connect(trem).connect(env).connect(out);
    cic.start(); am.start();
    nodes.push(cic, am);

    let timer = 0;
    function cicadaBurst() {
      const t = ac.currentTime, len = 2 + Math.random() * 5;
      env.gain.cancelScheduledValues(t);
      env.gain.setValueAtTime(env.gain.value, t);
      env.gain.linearRampToValueAtTime(0.05 + Math.random() * 0.04, t + 0.8);
      env.gain.setValueAtTime(0.06, t + len);
      env.gain.linearRampToValueAtTime(0, t + len + 1.2);
      if (Math.random() < 0.3) flute(t + len + 1.5);
      timer = setTimeout(cicadaBurst, (len + 2 + Math.random() * 6) * 1000);
    }
    timer = setTimeout(cicadaBurst, 600);

    // Sáo diều: vài nốt ngũ cung dài, ngân, rất nhỏ
    function flute(at) {
      const scale = [587.3, 659.3, 784, 880, 987.8]; // D E G A B
      let t = at;
      for (let k = 0; k < 3; k++) {
        const o = ac.createOscillator(); o.type = 'sine';
        o.frequency.value = Hub.pick(scale);
        const vib = ac.createOscillator(); vib.frequency.value = 5;
        const vg = ac.createGain(); vg.gain.value = 6; vib.connect(vg).connect(o.frequency);
        const g = ac.createGain(); g.gain.value = 0;
        const d = 1.2 + Math.random();
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.03, t + 0.3); g.gain.linearRampToValueAtTime(0, t + d);
        o.connect(g).connect(out);
        o.start(t); vib.start(t); o.stop(t + d + 0.1); vib.stop(t + d + 0.1);
        t += d * 0.8;
      }
    }

    amb = { stop() {
      clearTimeout(timer);
      const t = ac.currentTime;
      out.gain.cancelScheduledValues(t); out.gain.setValueAtTime(out.gain.value, t); out.gain.linearRampToValueAtTime(0, t + 0.6);
      setTimeout(() => { nodes.forEach((n) => { try { n.stop(); } catch (e) { /* đã dừng */ } }); out.disconnect(); }, 800);
    } };
  }
  function stopAmbience() { if (amb) { amb.stop(); amb = null; } }

  // ---------- Hiệu ứng ----------
  const sfx = {
    // tiếng sỏi rơi: tiếng gõ ngắn, cao độ ngẫu nhiên
    stone() {
      if (!on || !ctx()) return;
      const t = ac.currentTime;
      const o = ac.createOscillator(); o.type = 'triangle'; o.frequency.value = 1400 + Math.random() * 900;
      const g = ac.createGain(); g.gain.setValueAtTime(0.18, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
      o.connect(g).connect(master); o.start(t); o.stop(t + 0.08);
    },
    // trống: sóng sin trượt tần số xuống
    drum() {
      if (!on || !ctx()) return;
      const t = ac.currentTime;
      const o = ac.createOscillator(); o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(50, t + 0.3);
      const g = ac.createGain(); g.gain.setValueAtTime(0.6, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      o.connect(g).connect(master); o.start(t); o.stop(t + 0.42);
    },
    // chiêng nhỏ khi thắng
    gong() {
      if (!on || !ctx()) return;
      const t = ac.currentTime;
      [220, 331, 467].forEach((f, k) => {
        const o = ac.createOscillator(); o.frequency.value = f;
        const g = ac.createGain(); g.gain.setValueAtTime(0.18 / (k + 1), t); g.gain.exponentialRampToValueAtTime(0.001, t + 2.5);
        o.connect(g).connect(master); o.start(t); o.stop(t + 2.6);
      });
    },
    // tiếng "tạch" khi chọn
    tap() {
      if (!on || !ctx()) return;
      const t = ac.currentTime;
      const o = ac.createOscillator(); o.type = 'square'; o.frequency.value = 900;
      const g = ac.createGain(); g.gain.setValueAtTime(0.05, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
      o.connect(g).connect(master); o.start(t); o.stop(t + 0.04);
    },
  };

  Hub.sound = Object.assign(sfx, {
    get on() { return on; },
    supported: !!(window.AudioContext || window.webkitAudioContext),
    toggle() {
      on = !on; Hub.store.set('sound', on);
      if (on) startAmbience(); else stopAmbience();
      listeners.forEach((fn) => fn(on));
      return on;
    },
    onChange(fn) { listeners.push(fn); },
    // trình duyệt chỉ cho phát âm thanh sau một thao tác của người dùng
    resumeOnGesture() {
      if (!on) return;
      const go = () => { startAmbience(); window.removeEventListener('pointerdown', go); window.removeEventListener('keydown', go); };
      window.addEventListener('pointerdown', go); window.addEventListener('keydown', go);
    },
  });

  // Thắng một ván → chiêng
  document.addEventListener('hub:result', (e) => { if (e.detail.result === 'win') sfx.gong(); });
})();
