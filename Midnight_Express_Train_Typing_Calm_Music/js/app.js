document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("btnStart"), overlay = document.getElementById("startOverlay"), status = document.getElementById("stationLoadStatus");
  const game = document.getElementById("typingGame"), nameEl = document.getElementById("stationName"), regionEl = document.getElementById("stationRegion"), input = document.getElementById("typingInput"), result = document.getElementById("typingResult"), comboEl = document.getElementById("comboText"), progressEl = document.getElementById("progressText"), comboCount = document.getElementById("comboCount"), comboDisplay = document.getElementById("comboDisplay"), judgement = document.getElementById("judgementText");
  const fallback = ["서울", "시청", "종각", "종로3가", "종로5가", "동대문", "신설동", "청량리", "제기동", "신림", "홍대입구", "강남", "역삼", "선릉", "삼성", "잠실", "건대입구", "성수", "신촌", "이대", "합정", "당산", "여의도", "사당", "고속터미널", "교대", "신도림", "구로", "인천", "부평", "수원", "안양", "판교", "정자", "광교", "부산역", "서면", "해운대", "대구역", "동대구", "대전역", "광주송정", "김포공항", "마곡나루", "청라국제도시", "춘천", "용문", "문산", "파주운정", "오산", "평택", "천안", "신창", "송도", "인하대", "원인재", "소래포구", "제주역"];
  let stations = [], queue = [], idx = 0, combo = 0, started = false;
  const source = "https://gist.githubusercontent.com/jhj0517/9bd253175c4410493af024d5e0a1c01f/raw/korean-subway-station-list.json5";
  async function loadStations() {
    try { const t = await (await fetch(source, { cache: "no-store" })).text(); const names = [...t.matchAll(/['\"]name['\"]\s*:\s*['\"]([^'\"]+)['\"]/g)].map(m => m[1].replace(/역$/, "")); const cities = [...t.matchAll(/['\"]city['\"]\s*:\s*['\"]([^'\"]+)['\"]/g)].map(m => m[1]); const unique = []; const seen = new Set(); names.forEach((n, i) => { if (n && !seen.has(n)) { seen.add(n); unique.push({ name: n, city: cities[i] || "대한민국" }) } }); if (unique.length < 50) throw Error(); stations = unique; status.textContent = `✓ 전국 지하철역 ${stations.length}개 로드 완료`; }
    catch (e) { stations = fallback.map(name => ({ name, city: "대한민국" })); status.textContent = `오프라인 목록 ${stations.length}개 준비 완료`; }
    btn.disabled = false; btn.querySelector('.btn-text').textContent = '지하철역 여행 시작하기'; btn.querySelector('.btn-subtext').textContent = '랜덤 역 이름 타자 연습';
  }
  // MP3 폴더(index.html과 같은 위치의 "MP3" 폴더)에 파일만 넣으면 자동으로 인식해서 재생합니다.
  // 서버가 디렉토리 목록(autoindex)을 지원하지 않는 환경(GitHub Pages 등 정적 호스팅)이라면
  // 아래 musicFiles 배열에 파일명을 직접 적어주세요 (그 경우 폴더명은 "music"으로 사용됩니다).
  const MP3_FOLDER = 'MP3';
  const musicFiles = [
    'song1.mp3',
    'song2.mp3',
    'song3.mp3'
  ];

  async function loadMP3Folder(folderPath) {
    try {
      const res = await fetch(folderPath, { cache: "no-store" });
      if (!res.ok) throw new Error('디렉토리 목록을 불러올 수 없음');
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const links = [...doc.querySelectorAll('a')]
        .map(a => a.getAttribute('href'))
        .filter(href => href && href.toLowerCase().endsWith('.mp3'));
      const files = [...new Set(links.map(href => decodeURIComponent(href.split('/').pop())))];
      return files;
    } catch (e) {
      return [];
    }
  }

  function shuffle(a) { return [...a].sort(() => Math.random() - .5) }
  function next() { if (idx >= queue.length) queue = shuffle(stations), idx = 0; const s = queue[idx++]; nameEl.textContent = s.name + "역"; nameEl.dataset.answer = s.name; regionEl.textContent = s.city + " 도시철도"; input.value = ""; progressEl.textContent = `${idx} / ${stations.length}`; input.focus(); }
  function submit() { const answer = nameEl.dataset.answer; const v = input.value.trim().replace(/역$/, ''); if (!v) return; if (v === answer) { combo++; result.textContent = 'PERFECT!'; result.className = 'typing-result correct'; judgement.textContent = 'PERFECT'; comboCount.textContent = combo; comboDisplay.classList.remove('hidden'); setTimeout(() => judgement.textContent = '', 500); setTimeout(next, 280); } else { combo = 0; result.textContent = '다시 한번!'; result.className = 'typing-result wrong'; input.select(); } comboEl.textContent = `${combo} COMBO`; }
  btn.onclick = async () => {
    started = true; overlay.style.display = 'none'; game.classList.remove('hidden'); queue = shuffle(stations); idx = 0; next();
    if (typeof audioEngine !== 'undefined') {
      audioEngine.init(); audioEngine.resume();
      const autoFiles = await loadMP3Folder(MP3_FOLDER);
      const filesToUse = autoFiles.length ? autoFiles : musicFiles;
      const folderToUse = autoFiles.length ? MP3_FOLDER : 'music';
      const hasPlaylist = audioEngine.initPlaylist(filesToUse, folderToUse);
      const playing = hasPlaylist && audioEngine.startPlaylist();
      if (!playing && audioEngine.startCalmJourneyMusic) audioEngine.startCalmJourneyMusic();
    }
  };
  input.addEventListener('keydown', e => { if (e.key === 'Enter') submit() });
  const canvas = document.getElementById('gameCanvas');
  const renderer = new VisualRenderer(canvas);
  let lastTime = performance.now();
  function animate(now) {
    const deltaTime = now - lastTime; lastTime = now;
    renderer.update(deltaTime);
    renderer.render([], 'F', 'J');
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
  loadStations();
});