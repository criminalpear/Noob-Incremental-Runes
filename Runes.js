const content = document.querySelector('#content');
const nav = document.querySelector('#pool-nav');
const search = document.querySelector('#search');
const note = document.querySelector('#result-note');

function parseData(text) {
  const pools = []; let pool = null;
  for (const raw of text.split(/\r?\n/)) {
    if (raw.startsWith('## ')) {
      const [, name, cost, realm] = raw.match(/^## (.+?) \| Cost: (.+?) \| Realm: (.+)$/) || [];
      pool = { name, cost, realm, runes: [] }; pools.push(pool);
    } else if (pool && raw.includes(' -> ')) {
      const [left, boostText] = raw.split(' -> ');
      const [, name, tier, chance, maxLevel] = left.match(/^(.+?) \[(.+?); (.+?); max (.+?)\]$/) || [];
      if (name) pool.runes.push({ name, tier, chance, maxLevel, boosts: boostText.split(', ') });
    }
  }
  return pools;
}
function idFor(name) { return `pool-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`; }
function runeCard(rune) {
  const tierClass = rune.tier === 'Noobinial' ? 'noobinial' : '';
  const boosts = rune.boosts.map(boost => {
    const match = boost.match(/^(.+?)([x+].*)$/); return `<span class="boost">${match ? `${match[1]}<b>${match[2]}</b>` : boost}</span>`;
  }).join('');
  return `<details class="rune"><summary><div class="rune-title">${rune.name}</div><div class="tier ${tierClass}">${rune.tier} · chance ${rune.chance}</div></summary><div class="detail"><dl><div><dt>Tier</dt><dd class="${tierClass}">${rune.tier}</dd></div><div><dt>Max level</dt><dd>${rune.maxLevel}</dd></div><div><dt>Roll chance</dt><dd>${rune.chance}</dd></div></dl><span class="boost-label">Possible boosts</span><div class="boosts">${boosts}</div></div></details>`;
}
function render(pools, query = '') {
  const q = query.trim().toLowerCase(); let shown = 0; let runes = 0;
  content.innerHTML = pools.map(pool => {
    const matches = pool.runes.filter(r => !q || `${pool.name} ${r.name} ${r.tier} ${r.boosts.join(' ')}`.toLowerCase().includes(q));
    if (!matches.length) return ''; shown++; runes += matches.length;
    return `<section class="pool" id="${idFor(pool.name)}"><header class="pool-header"><h2>${pool.name}</h2><p class="pool-meta">${matches.length} rune${matches.length === 1 ? '' : 's'} · Cost: ${pool.cost}<br>Realm: ${pool.realm}</p></header><div class="rune-grid">${matches.map(runeCard).join('')}</div></section>`;
  }).join('') || '<p class="empty">No runes match that search.</p>';
  note.textContent = q ? `${runes} rune${runes === 1 ? '' : 's'} across ${shown} pool${shown === 1 ? '' : 's'}` : 'Select a pool or search by name, tier, or boost.';
}
fetch('outputs/runes_reference.txt').then(r => { if (!r.ok) throw new Error(); return r.text(); }).then(text => {
  const pools = parseData(text); const allRunes = pools.reduce((n, p) => n + p.runes.length, 0);
  document.querySelector('#stats').innerHTML = `<div class="stat"><strong>${pools.length}</strong><span>Rune pools</span></div><div class="stat"><strong>${allRunes}</strong><span>Rollable runes</span></div><div class="stat"><strong>2</strong><span>Rarity tiers</span></div>`;
  nav.innerHTML = pools.map(p => `<a href="#${idFor(p.name)}">${p.name}</a>`).join(''); render(pools);
  search.addEventListener('input', () => render(pools, search.value));
}).catch(() => { content.innerHTML = '<p class="empty">Rune data could not be loaded. Make sure the outputs folder is included when publishing.</p>'; });
