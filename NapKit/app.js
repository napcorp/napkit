(function initTheme() {
  try {
    const saved = JSON.parse(localStorage.getItem('ecobite-settings') || '{}');
    if (saved.theme === 'halloween') {
      document.body.classList.add('theme-halloween');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.body.classList.remove('theme-halloween');
      document.documentElement.removeAttribute('data-theme');
    }
  } catch (e) {}
})();

function calculateOrderEco(packaging, vehicle) {
  const p = (packaging || '').toLowerCase();
  const v = (vehicle || '').toLowerCase();

  const isEcoPack = p.includes('biodegradable') || p.includes('paper');
  const isEV = v.includes('ev');

  let co2Grams = 0;
  let points = 0;
  let rating = 'Good';

  if (isEcoPack && isEV) {
    co2Grams = 180;
    points = 18;
    rating = 'Excellent';
  } else if (isEcoPack || isEV) {
    co2Grams = 90;
    points = 9;
    rating = 'Good';
  } else {
    co2Grams = 30;
    points = 3;
    rating = 'Fair';
  }

  return { co2Grams, points, rating };
}

function getEcoStats() {
  const saved = localStorage.getItem('ecobite-eco-stats');
  if (saved) {
    try { return JSON.parse(saved); } catch(e) {}
  }
  return {
    co2Grams: 2400,
    points: 120,
    score: 'Excellent',
    orders: 34
  };
}

function updateEcoStatsUI() {
  const stats = getEcoStats();
  const co2El = document.getElementById('ecoCo2Val');
  const pointsEl = document.getElementById('ecoPointsVal');
  const scoreEl = document.getElementById('ecoScoreVal');
  const ordersEl = document.getElementById('ecoOrdersVal');

  if (co2El) {
    const kg = (stats.co2Grams / 1000).toFixed(1);
    co2El.textContent = `${kg}kg`;
  }
  if (pointsEl) {
    pointsEl.textContent = stats.points;
  }
  if (scoreEl) {
    scoreEl.textContent = stats.score || 'Excellent';
    if (stats.score === 'Excellent') scoreEl.style.color = '#10b981';
    else if (stats.score === 'Good') scoreEl.style.color = '#0284c7';
    else scoreEl.style.color = '#f59e0b';
  }
  if (ordersEl) {
    ordersEl.textContent = stats.orders;
  }
}

function renderOrderHistory() {
  const listEl = document.getElementById('orderHistoryList');
  if (!listEl) return;
  let history = [];
  try {
    history = JSON.parse(localStorage.getItem('ecobite-order-history') || '[]');
  } catch(e) {}

  if (!history || history.length === 0) {
    history = [
      { id: '#EB-4821', items: 'LED Desk Lamp, Sticky Notes', status: 'Delivered' },
      { id: '#EB-4820', items: 'Organic Honey, Green Tea', status: 'Delivered' },
      { id: '#EB-4819', items: 'Kids Art Kit', status: 'Delivered' }
    ];
  }

  listEl.innerHTML = history.map(item => `
    <div class="order-history-item">
      <div><span class="order-id">${item.id}</span> · ${item.items}</div>
      <span class="order-status ${item.status === 'Delivered' ? 'delivered' : 'transit'}">${item.status}</span>
    </div>
  `).join('');
}

const SPA = {
  pages: ['home', 'reviews', 'settings', 'vendor', 'checkout'],
  
  navigate(page, subSection = null) {
    
    this.pages.forEach(p => {
      const el = document.getElementById('page-' + p);
      if (el) el.classList.remove('active');
    });

    const sidebarCart = document.getElementById('sidebar-cart');
    const cartOverlay = document.getElementById('cart-overlay');
    if (sidebarCart) sidebarCart.classList.remove('open');
    if (cartOverlay) cartOverlay.classList.remove('active');

    const homeContent = document.getElementById('page-home');
    const footer = document.querySelector('.site-footer');
    const cartToggle = document.getElementById('cart-toggle');
    const callFloat = document.querySelector('.call-float');
    const scrollTop = document.getElementById('scroll-to-top');

    if (page === 'home') {
      if (homeContent) {
        homeContent.style.display = 'block';
        homeContent.classList.add('active');
      }
      if (footer) footer.style.display = 'block';
      if (cartToggle) cartToggle.style.display = 'flex';
      if (callFloat) callFloat.style.display = 'flex';
      if (scrollTop) scrollTop.style.display = 'flex';
    } else {
      if (homeContent) homeContent.style.display = 'none';
      if (footer) footer.style.display = 'none';
      if (cartToggle) cartToggle.style.display = page === 'checkout' ? 'none' : 'flex';
      if (callFloat) callFloat.style.display = page === 'checkout' ? 'none' : 'flex';
      if (scrollTop) scrollTop.style.display = 'none';
      
      const pageEl = document.getElementById('page-' + page);
      if (pageEl) pageEl.classList.add('active');
    }

    document.querySelectorAll('#navbar a').forEach(a => a.classList.remove('active'));
    if (subSection) {
      const secLink = document.querySelector(`#navbar a[href="#${subSection}"]`) || 
                      document.querySelector(`#navbar a[data-page="#${subSection}"]`) ||
                      document.querySelector(`#navbar a[data-page="${subSection}"]`);
      if (secLink) {
        secLink.classList.add('active');
      } else {
        const homeLink = document.querySelector('#navbar a[href="#home"]') || document.querySelector('#navbar a[data-page="home"]');
        if (homeLink) homeLink.classList.add('active');
      }
    } else if (page === 'home') {
      const homeLink = document.querySelector('#navbar a[href="#home"]') || document.querySelector('#navbar a[data-page="home"]');
      if (homeLink) homeLink.classList.add('active');
    } else {
      const pageLink = document.querySelector(`#navbar a[data-page="${page}"]`) || document.querySelector(`#navbar a[href="#${page}"]`);
      if (pageLink) pageLink.classList.add('active');
    }

    if (!subSection) {
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    if (page === 'settings') this.initSettings();
    if (page === 'vendor') this.initVendor();
    if (page === 'reviews') this.initReviews();
    if (page === 'checkout') this.initCheckout();
    if (page === 'home') this.initMap();
  },

  handleHash() {
    const hash = window.location.hash.replace('#', '') || 'home';
    
    const subSections = ['menu', 'contact', 'map-section'];
    if (subSections.includes(hash)) {
      this.navigate('home', hash);
      setTimeout(() => {
        const el = document.getElementById(hash);
        if (el) {
          const headerOffset = 84;
          const elementPosition = el.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }, 100);
    } else if (this.pages.includes(hash)) {
      this.navigate(hash);
    } else {
      this.navigate('home');
    }
  },

  _mapInitialized: false,
  initMap() {
    if (this._mapInitialized) return;
    if (typeof L === 'undefined') return;
    const mapEl = document.getElementById('map');
    if (!mapEl) return;
    
    this._mapInitialized = true;
    
    const map = L.map('map').setView([28.5000, 77.1100], 11);
    L.tileLayer('https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png', {
      subdomains: 'abc',
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap France | &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    const baseLocalities = [
      
      { name: "Cyber Hub Pod 1", lat: 28.4950, lng: 77.0890, prefix: "GGM" },
      { name: "Cyber City Phase 2", lat: 28.4920, lng: 77.0850, prefix: "GGM" },
      { name: "DLF Phase 1", lat: 28.4795, lng: 77.1025, prefix: "GGM" },
      { name: "DLF Phase 3", lat: 28.4980, lng: 77.1050, prefix: "GGM" },
      { name: "DLF Phase 4", lat: 28.4720, lng: 77.0910, prefix: "GGM" },
      { name: "DLF Phase 5", lat: 28.4550, lng: 77.1050, prefix: "GGM" },
      { name: "Golf Course Rd 1", lat: 28.4680, lng: 77.1080, prefix: "GGM" },
      { name: "Golf Course Rd 2", lat: 28.4520, lng: 77.1020, prefix: "GGM" },
      { name: "Golf Course Ext Rd", lat: 28.4180, lng: 77.0850, prefix: "GGM" },
      { name: "Sector 29 Leisure Hub", lat: 28.4690, lng: 77.0620, prefix: "GGM" },
      { name: "Sector 14 Market Pod", lat: 28.4780, lng: 77.0450, prefix: "GGM" },
      { name: "Sector 31 Hub", lat: 28.4530, lng: 77.0580, prefix: "GGM" },
      { name: "Sector 43 Express", lat: 28.4610, lng: 77.0860, prefix: "GGM" },
      { name: "Sector 54 Rapid Pod", lat: 28.4380, lng: 77.1120, prefix: "GGM" },
      { name: "Sector 56 Huda Pod", lat: 28.4320, lng: 77.1050, prefix: "GGM" },
      { name: "Sector 57 Sushant", lat: 28.4280, lng: 77.0880, prefix: "GGM" },
      { name: "Sohna Road Central", lat: 28.4230, lng: 77.0420, prefix: "GGM" },
      { name: "Sohna Road South", lat: 28.3980, lng: 77.0390, prefix: "GGM" },
      { name: "Udyog Vihar Phase 1", lat: 28.5120, lng: 77.0820, prefix: "GGM" },
      { name: "Udyog Vihar Phase 4", lat: 28.5050, lng: 77.0750, prefix: "GGM" },
      { name: "MG Road Metro Hub", lat: 28.4810, lng: 77.0810, prefix: "GGM" },
      { name: "South City 1", lat: 28.4620, lng: 77.0680, prefix: "GGM" },
      { name: "South City 2", lat: 28.4310, lng: 77.0620, prefix: "GGM" },
      { name: "Palam Vihar Pod", lat: 28.5080, lng: 77.0350, prefix: "GGM" },
      { name: "Old Railway Road", lat: 28.4720, lng: 77.0250, prefix: "GGM" },
      { name: "Sector 82 Vatika Pod", lat: 28.3910, lng: 76.9680, prefix: "GGM" },
      { name: "Sector 83 DarkStore", lat: 28.3880, lng: 76.9790, prefix: "GGM" },
      { name: "Sector 90 New Gurgaon", lat: 28.4010, lng: 76.9450, prefix: "GGM" },
      { name: "Manesar IMT Gateway", lat: 28.3610, lng: 76.9250, prefix: "GGM" },
      { name: "Nirvana Country Hub", lat: 28.4250, lng: 77.0720, prefix: "GGM" },
      { name: "Ardee City Pod", lat: 28.4450, lng: 77.0810, prefix: "GGM" },
      { name: "Sector 46 Huda Hub", lat: 28.4410, lng: 77.0550, prefix: "GGM" },
      { name: "Sector 15 Part 2", lat: 28.4650, lng: 77.0420, prefix: "GGM" },
      { name: "Sector 23 A Palam Hub", lat: 28.5150, lng: 77.0510, prefix: "GGM" },
      { name: "Gwal Pahari Hub", lat: 28.4420, lng: 77.1450, prefix: "GGM" },

      { name: "Vasant Kunj Pod 1", lat: 28.5250, lng: 77.1550, prefix: "DEL" },
      { name: "Vasant Kunj Sector C", lat: 28.5350, lng: 77.1620, prefix: "DEL" },
      { name: "Saket Select City Hub", lat: 28.5280, lng: 77.2180, prefix: "DEL" },
      { name: "Hauz Khas Village", lat: 28.5490, lng: 77.2030, prefix: "DEL" },
      { name: "Green Park Main Hub", lat: 28.5580, lng: 77.2080, prefix: "DEL" },
      { name: "Greater Kailash 1", lat: 28.5510, lng: 77.2350, prefix: "DEL" },
      { name: "Greater Kailash 2", lat: 28.5360, lng: 77.2410, prefix: "DEL" },
      { name: "Malviya Nagar Pod", lat: 28.5370, lng: 77.2090, prefix: "DEL" },
      { name: "Nehru Place Hub", lat: 28.5480, lng: 77.2510, prefix: "DEL" },
      { name: "Okhla Industrial Phase 3", lat: 28.5380, lng: 77.2720, prefix: "DEL" },
      { name: "Lajpat Nagar 4", lat: 28.5680, lng: 77.2420, prefix: "DEL" },
      { name: "Defence Colony Hub", lat: 28.5740, lng: 77.2310, prefix: "DEL" },
      { name: "Chanakyapuri Pod", lat: 28.5910, lng: 77.1850, prefix: "DEL" },
      { name: "RK Puram Sector 5", lat: 28.5620, lng: 77.1750, prefix: "DEL" },
      { name: "Mehrauli Pod", lat: 28.5180, lng: 77.1850, prefix: "DEL" },
      { name: "Chattarpur Enclave", lat: 28.5020, lng: 77.1820, prefix: "DEL" },
      { name: "Sainik Farm Hub", lat: 28.5090, lng: 77.2150, prefix: "DEL" },
      { name: "Kalkaji Main Pod", lat: 28.5410, lng: 77.2610, prefix: "DEL" },
      { name: "Alaknanda Market", lat: 28.5320, lng: 77.2520, prefix: "DEL" },
      { name: "Vasant Vihar Basant Lok", lat: 28.5580, lng: 77.1590, prefix: "DEL" },
      { name: "Connaught Place Hub", lat: 28.6310, lng: 77.2190, prefix: "DEL" },
      { name: "Barakhamba Express", lat: 28.6280, lng: 77.2280, prefix: "DEL" },
      { name: "Karol Bagh Market", lat: 28.6480, lng: 77.1920, prefix: "DEL" },
      { name: "Rajendra Nagar Hub", lat: 28.6410, lng: 77.1810, prefix: "DEL" },
      { name: "Patel Nagar West", lat: 28.6530, lng: 77.1620, prefix: "DEL" },
      { name: "Paharganj Pod", lat: 28.6420, lng: 77.2120, prefix: "DEL" },
      { name: "Daryaganj Central", lat: 28.6450, lng: 77.2410, prefix: "DEL" },
      { name: "Chandni Chowk Hub", lat: 28.6560, lng: 77.2310, prefix: "DEL" },
      { name: "Civil Lines North", lat: 28.6780, lng: 77.2240, prefix: "DEL" },
      { name: "Model Town Hub", lat: 28.7010, lng: 77.1950, prefix: "DEL" },

      { name: "Dwarka Sector 6", lat: 28.5850, lng: 77.0650, prefix: "DEL" },
      { name: "Dwarka Sector 12", lat: 28.5920, lng: 77.0420, prefix: "DEL" },
      { name: "Dwarka Sector 21", lat: 28.5520, lng: 77.0580, prefix: "DEL" },
      { name: "Janakpuri District Centre", lat: 28.6290, lng: 77.0820, prefix: "DEL" },
      { name: "Janakpuri Block C", lat: 28.6210, lng: 77.0910, prefix: "DEL" },
      { name: "Rajouri Garden Pod", lat: 28.6480, lng: 77.1220, prefix: "DEL" },
      { name: "Punjabi Bagh Ring Rd", lat: 28.6650, lng: 77.1320, prefix: "DEL" },
      { name: "Paschim Vihar West", lat: 28.6710, lng: 77.0950, prefix: "DEL" },
      { name: "Tilak Nagar Hub", lat: 28.6380, lng: 77.1010, prefix: "DEL" },
      { name: "Vikaspuri Complex", lat: 28.6360, lng: 77.0720, prefix: "DEL" },
      { name: "Pitampura NSP Pod", lat: 28.6980, lng: 77.1510, prefix: "DEL" },
      { name: "Rohini Sector 7 Hub", lat: 28.7110, lng: 77.1210, prefix: "DEL" },
      { name: "Rohini Sector 14", lat: 28.7250, lng: 77.1350, prefix: "DEL" },
      { name: "Rohini Sector 24", lat: 28.7380, lng: 77.0980, prefix: "DEL" },
      { name: "Shalimar Bagh Pod", lat: 28.7150, lng: 77.1650, prefix: "DEL" },
      { name: "Ashok Vihar Phase 2", lat: 28.6880, lng: 77.1750, prefix: "DEL" },
      { name: "Mayur Vihar Phase 1", lat: 28.6050, lng: 77.2950, prefix: "DEL" },
      { name: "Laxmi Nagar Metro", lat: 28.6310, lng: 77.2780, prefix: "DEL" },
      { name: "Preet Vihar Main", lat: 28.6410, lng: 77.2950, prefix: "DEL" },
      { name: "Anand Vihar ISBT Hub", lat: 28.6510, lng: 77.3150, prefix: "DEL" },

      { name: "Noida Sector 18 Pod", lat: 28.5710, lng: 77.3210, prefix: "NOI" },
      { name: "Noida Sector 62 IT Park", lat: 28.6250, lng: 77.3680, prefix: "NOI" },
      { name: "Noida Sector 50 Central", lat: 28.5810, lng: 77.3620, prefix: "NOI" },
      { name: "Noida Sector 76 Metro", lat: 28.5680, lng: 77.3820, prefix: "NOI" },
      { name: "Noida Sector 137 Expressway", lat: 28.5120, lng: 77.4080, prefix: "NOI" },
      { name: "Noida Sector 128 Jaypee", lat: 28.5280, lng: 77.3690, prefix: "NOI" },
      { name: "Noida Sector 15 Golchakkar", lat: 28.5820, lng: 77.3110, prefix: "NOI" },
      { name: "Noida Sector 93 Grand", lat: 28.5290, lng: 77.3880, prefix: "NOI" },
      { name: "Greater Noida KP 3", lat: 28.4710, lng: 77.4950, prefix: "NOI" },
      { name: "Greater Noida Pari Chowk", lat: 28.4650, lng: 77.5120, prefix: "NOI" },

      { name: "Faridabad Sector 15 Market", lat: 28.4110, lng: 77.3180, prefix: "FBD" },
      { name: "Faridabad NIT 1 Central", lat: 28.3980, lng: 77.3020, prefix: "FBD" },
      { name: "Faridabad Green Field", lat: 28.4480, lng: 77.2950, prefix: "FBD" },
      { name: "Faridabad Sector 21 C", lat: 28.4210, lng: 77.2980, prefix: "FBD" },
      { name: "Faridabad Badarpur Border", lat: 28.4880, lng: 77.3010, prefix: "FBD" },
      { name: "Ghaziabad Indirapuram Shipra", lat: 28.6410, lng: 77.3750, prefix: "GZB" },
      { name: "Ghaziabad Vaishali Sector 4", lat: 28.6490, lng: 77.3410, prefix: "GZB" },
      { name: "Ghaziabad Kaushambi Metro", lat: 28.6450, lng: 77.3250, prefix: "GZB" },
      { name: "Ghaziabad Vasundhara Sec 10", lat: 28.6650, lng: 77.3620, prefix: "GZB" },
      { name: "Ghaziabad Raj Nagar Ext", lat: 28.6980, lng: 77.4280, prefix: "GZB" },

      { name: "BKC Financial District Hub", lat: 19.0657, lng: 72.8680, prefix: "BOM" },
      { name: "Andheri West Lokhandwala Pod", lat: 19.1363, lng: 72.8277, prefix: "BOM" },
      { name: "Lower Parel High Street Pod", lat: 18.9950, lng: 72.8250, prefix: "BOM" },
      { name: "Bandra West Linking Rd Pod", lat: 19.0596, lng: 72.8295, prefix: "BOM" },
      { name: "Powai Hiranandani Hub", lat: 19.1176, lng: 72.9060, prefix: "BOM" },

      { name: "Koramangala 4th Block Hub", lat: 12.9352, lng: 77.6245, prefix: "BLR" },
      { name: "Indiranagar 100ft Rd Pod", lat: 12.9784, lng: 77.6408, prefix: "BLR" },
      { name: "HSR Layout Sector 1 Pod", lat: 12.9116, lng: 77.6389, prefix: "BLR" },
      { name: "Whitefield ITPL Hub", lat: 12.9863, lng: 77.7340, prefix: "BLR" },
      { name: "Bellandur Outer Ring Rd Pod", lat: 12.9260, lng: 77.6762, prefix: "BLR" },

      { name: "Hitec City Cyber Towers Hub", lat: 17.4504, lng: 78.3808, prefix: "HYD" },
      { name: "Gachibowli Financial Hub", lat: 17.4401, lng: 78.3489, prefix: "HYD" },
      { name: "Jubilee Hills Checkpost Pod", lat: 17.4319, lng: 78.4073, prefix: "HYD" },
      { name: "Banjara Hills Road 12 Pod", lat: 17.4156, lng: 78.4350, prefix: "HYD" },
      { name: "Madhapur Metro Hub", lat: 17.4385, lng: 78.3890, prefix: "HYD" }
    ];

    const cityCenters = {
      delhi: { center: [28.5000, 77.1100], zoom: 11 },
      mumbai: { center: [19.0760, 72.8777], zoom: 12 },
      blr: { center: [12.9716, 77.5946], zoom: 12 },
      hyd: { center: [17.4399, 78.3800], zoom: 12 }
    };

    document.querySelectorAll('.map-city-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.map-city-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const c = cityCenters[btn.dataset.city];
        if (c) map.setView(c.center, c.zoom);
      });
    });

    baseLocalities.forEach((wh, index) => {
      const idNum = String(index + 1).padStart(2, '0');
      const whId = `WH-${wh.prefix}-${idNum}`;
      
      const load = 25 + ((index * 23) % 68);
      let status, color;
      if (load >= 75) {
        status = "High Demand";
        color = "#ef4444";
      } else if (load >= 45) {
        status = "Normal";
        color = "#10b981";
      } else {
        status = "Low Load";
        color = "#f59e0b";
      }

      const activeOrders = Math.round(40 + (load * 4.2));
      const dispatchTime = Math.round(9 + (load / 15));

      const marker = L.circleMarker([wh.lat, wh.lng], {
        color: color,
        fillColor: color,
        radius: 6.5,
        fillOpacity: 0.88,
        weight: 1.5
      }).addTo(map);

      marker.bindPopup(`
        <div style="font-family:'Plus Jakarta Sans',sans-serif; min-width:180px; padding:2px;">
          <div style="font-size:11px; font-weight:700; color:#0284c7; text-transform:uppercase;">NapKit Dark Store Pod</div>
          <strong style="font-size:13.5px; color:#0f172a; display:block; margin:2px 0 6px;">${whId} · ${wh.name}</strong>
          <div style="font-size:12px; color:#475569; line-height:1.6;">
            <div>Status: <span style="font-weight:700; color:${color};">${status}</span></div>
            <div>Current Load: <strong>${load}%</strong> (${activeOrders} pkgs in queue)</div>
            <div>Avg Dispatch ETA: <strong style="color:#059669;">${dispatchTime} mins</strong></div>
          </div>
        </div>
      `);
    });
  },

  _settingsInitialized: false,
  initSettings() {
    updateEcoStatsUI();
    renderOrderHistory();

    if (this._settingsInitialized) return;
    this._settingsInitialized = true;

    const saved = JSON.parse(localStorage.getItem('ecobite-settings') || '{}');
    if (saved.name) document.getElementById('set-name').value = saved.name;
    if (saved.phone) document.getElementById('set-phone').value = saved.phone;
    if (saved.email) document.getElementById('set-email').value = saved.email;
    if (saved.address) document.getElementById('set-address').value = saved.address;
    if (saved.city) document.getElementById('set-city').value = saved.city;
    if (saved.pin) document.getElementById('set-pin').value = saved.pin;
    if (saved.packaging) document.getElementById('set-packaging').value = saved.packaging;
    if (saved.speed) document.getElementById('set-speed').value = saved.speed;
    if (saved.handover) document.getElementById('set-handover').value = saved.handover;
    if (saved.vehicle) document.getElementById('set-vehicle').value = saved.vehicle;

    function updateSettingsEcoPreview() {
      const p = document.getElementById('set-packaging')?.value;
      const v = document.getElementById('set-vehicle')?.value;
      const eco = calculateOrderEco(p, v);
      const scoreEl = document.getElementById('ecoScoreVal');
      if (scoreEl) {
        scoreEl.textContent = eco.rating;
        if (eco.rating === 'Excellent') scoreEl.style.color = '#10b981';
        else if (eco.rating === 'Good') scoreEl.style.color = '#0284c7';
        else scoreEl.style.color = '#f59e0b';
      }
    }

    document.getElementById('set-packaging')?.addEventListener('change', updateSettingsEcoPreview);
    document.getElementById('set-vehicle')?.addEventListener('change', updateSettingsEcoPreview);
    updateSettingsEcoPreview();
    if (saved.theme === 'halloween') {
      document.querySelectorAll('.theme-option').forEach(b => b.classList.remove('active'));
      document.querySelector('.theme-option[data-theme="halloween"]')?.classList.add('active');
    } else {
      document.querySelectorAll('.theme-option').forEach(b => b.classList.remove('active'));
      document.querySelector('.theme-option[data-theme="default"]')?.classList.add('active');
    }

    document.querySelectorAll('.theme-option').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.theme-option').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const theme = btn.dataset.theme;
        if (theme === 'halloween') {
          document.body.classList.add('theme-halloween');
          document.documentElement.setAttribute('data-theme', 'dark');
        } else {
          document.body.classList.remove('theme-halloween');
          document.documentElement.removeAttribute('data-theme');
        }
        try {
          const s = JSON.parse(localStorage.getItem('ecobite-settings') || '{}');
          s.theme = theme;
          localStorage.setItem('ecobite-settings', JSON.stringify(s));
        } catch(e) {}
      });
    });

    document.getElementById('save-settings').addEventListener('click', () => {
      const settings = {
        name: document.getElementById('set-name').value,
        phone: document.getElementById('set-phone').value,
        email: document.getElementById('set-email').value,
        address: document.getElementById('set-address').value,
        city: document.getElementById('set-city').value,
        pin: document.getElementById('set-pin').value,
        packaging: document.getElementById('set-packaging').value,
        speed: document.getElementById('set-speed').value,
        handover: document.getElementById('set-handover').value,
        vehicle: document.getElementById('set-vehicle').value,
        theme: document.querySelector('.theme-option.active')?.dataset.theme || 'default'
      };
      localStorage.setItem('ecobite-settings', JSON.stringify(settings));
      showToast('Settings Saved', 'Your preferences have been saved.', 'success');
    });

    document.getElementById('reset-settings').addEventListener('click', () => {
      if (confirm('Reset all settings?')) {
        localStorage.removeItem('ecobite-settings');
        location.reload();
      }
    });
  },

  _vendorInitialized: false,
  initVendor() {
    if (this._vendorInitialized) return;
    this._vendorInitialized = true;

    document.getElementById('submit-item').addEventListener('click', () => {
      const name = document.getElementById('v-name').value;
      if (!name) { showToast('Error', 'Please enter a product name.', 'error'); return; }
      showToast('Submitted', `"${name}" has been submitted for review.`, 'success');
    });

    document.getElementById('save-draft').addEventListener('click', () => {
      showToast('Draft Saved', 'Draft saved successfully!', 'success');
    });

    document.getElementById('upload-zone').addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.click();
      input.addEventListener('change', () => {
        if (input.files.length) {
          document.getElementById('upload-zone').innerHTML = `
            <span class="upload-icon">✅</span>
            ${input.files[0].name}<br>
            <small>Click to change</small>
          `;
        }
      });
    });

    document.getElementById('generate-label').addEventListener('click', () => {
      const label = document.getElementById('shipping-label');
      const prod = document.getElementById('label-product').value;
      const dest = document.getElementById('label-warehouse').value;
      document.getElementById('label-dest').textContent = dest;
      document.getElementById('label-prod').textContent = prod.split('—')[0].trim();
      document.getElementById('label-qty').textContent = prod.split('—')[1]?.trim() || '50 units';
      label.style.display = 'block';
    });
  },

  _reviewsInitialized: false,
  initReviews() {
    if (this._reviewsInitialized) return;
    this._reviewsInitialized = true;

    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const f = btn.dataset.filter;
        document.querySelectorAll('.review-card').forEach(card => {
          if (f === 'all' || card.dataset.cat === f) {
            card.style.display = 'block';
          } else {
            card.style.display = 'none';
          }
        });
      });
    });

    document.getElementById('newReviewForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('revName').value.trim();
      const hub = document.getElementById('revHub').value;
      const text = document.getElementById('revText').value.trim();
      const rating = parseInt(document.getElementById('revStars')?.value || '5', 10);
      const starsDisplay = '★'.repeat(rating) + '☆'.repeat(5 - rating);

      const card = document.createElement('div');
      card.className = 'review-card';
      card.innerHTML = `
        <div class="review-header">
          <div class="reviewer-info">
            <div class="avatar">${name.substring(0, 2).toUpperCase()}</div>
            <div class="reviewer-meta">
              <h4>${name} <span class="verified-badge">✓ Verified Buyer</span></h4>
              <div class="review-time">Just now · ${hub}</div>
            </div>
          </div>
          <div class="review-stars">${starsDisplay}</div>
        </div>
        <p class="review-text">"${text}"</p>
        <div class="review-badges-row">
          <span class="badge-pill eco">Biodegradable Pack</span>
          <span class="badge-pill">15-Min Delivery</span>
        </div>
      `;

      document.getElementById('reviewsList').prepend(card);
      showToast('Review Published', `Thank you! Your ${rating}-star verified review has been published.`, 'success');
      e.target.reset();
    });
  },

  _checkoutInitialized: false,
  initCheckout() {
    
    const confirmScreen = document.getElementById('confirmScreen');
    const orbZone = document.getElementById('orbZone');
    const cardFormBox = document.getElementById('cardFormBox');
    const summaryBar = document.getElementById('summaryBar');
    const itemsDrawer = document.getElementById('itemsDrawer');

    if (confirmScreen) confirmScreen.classList.remove('active');
    if (cardFormBox) cardFormBox.classList.remove('active');
    if (orbZone) orbZone.style.display = 'block';
    if (summaryBar) summaryBar.style.display = 'flex';
    if (itemsDrawer) itemsDrawer.style.display = 'block';

    const savedOrder = JSON.parse(localStorage.getItem("orderData") || "{}");
    const savedSettings = JSON.parse(localStorage.getItem("ecobite-settings") || "{}");
    const checkoutCart = savedOrder.cart || JSON.parse(localStorage.getItem("ecobite-cart") || "[]");

    let total = savedOrder.total || 0;
    if (!total && checkoutCart.length > 0) {
      total = checkoutCart.reduce((sum, item) => sum + (item.price * (item.qty || 1)), 0);
    }
    if (!total) total = 320;

    const totalPriceVal = document.getElementById('totalPriceVal');
    const itemsCountBadge = document.getElementById('itemsCountBadge');
    if (totalPriceVal) totalPriceVal.textContent = `₹${total}`;
    if (itemsCountBadge) itemsCountBadge.textContent = `(${checkoutCart.length || 1})`;

    const recipientSummary = document.getElementById('orderRecipientSummary');
    const customerDisplayName = savedOrder.name || savedSettings.name || 'Friend';
    const customerDisplayAddr = savedOrder.address || savedSettings.address || 'Saved Address';
    if (recipientSummary) {
      recipientSummary.innerHTML = `Delivering to <strong>${customerDisplayName}</strong>`;
    }

    const drawerItems = document.getElementById('drawerItems');
    if (drawerItems) {
      if (checkoutCart.length > 0) {
        drawerItems.innerHTML = checkoutCart.map(i => `
          <div class="order-row">
            <span>${i.name} × ${i.qty || 1}</span>
            <strong>₹${i.price * (i.qty || 1)}</strong>
          </div>
        `).join('') + `
          <div class="order-row" style="margin-top:8px; padding-top:8px; border-top:1px dashed var(--border-color); font-size:12px; color:var(--text-muted);">
            <span>${customerDisplayAddr}</span>
          </div>
        `;
      } else {
        drawerItems.innerHTML = `<div class="order-row"><span>Essential Quick Pack</span><strong>₹${total}</strong></div>`;
      }
    }

    const drawerArrow = document.getElementById('drawerArrow');
    if (summaryBar && !summaryBar._hasClickListener) {
      summaryBar._hasClickListener = true;
      summaryBar.addEventListener('click', () => {
        if (itemsDrawer) {
          itemsDrawer.classList.toggle('open');
          if (drawerArrow) drawerArrow.textContent = itemsDrawer.classList.contains('open') ? '▲' : '▼';
        }
      });
    }

    const orbWrapper = document.getElementById('orbWrapper');
    const orbStatus = document.getElementById('orbStatus');
    const questionStepPill = document.getElementById('questionStepPill');
    const questionText = document.getElementById('questionText');
    const orbAnswerBox = document.getElementById('orbAnswerBox');
    const orbPillsGroup = document.getElementById('orbPillsGroup');
    const chatInput = document.getElementById('chatInput');
    const btnSend = document.getElementById('btnSend');
    const confirmDetailsGrid = document.getElementById('confirmDetailsGrid');

    const checkoutAnswers = {
      name: savedOrder.name || savedSettings.name || 'Friend',
      phone: savedOrder.phone || savedSettings.phone || '+91 98765 43210',
      address: savedOrder.address || savedSettings.address || 'Central Eco Hub',
      speed: 'Fast (15 Minute)',
      packaging: 'Biodegradable Plastic',
      handover: 'Leave at Door',
      vehicle: 'EV (Electric Vehicle)',
      warehouse: 'Nearest Hub (Auto)',
      payment: 'Instant UPI'
    };

    const checkoutQuestions = [
      {
        key: 'speed',
        stepTitle: 'Step 1 of 5 · Delivery Speed',
        text: `Hi ${checkoutAnswers.name.split(' ')[0]}! What delivery speed do you prefer?`,
        placeholder: 'Select delivery speed...',
        options: [
          { label: 'Fast (15 Minute)', value: 'Fast (15 Minute)' },
          { label: 'Standard (>30 Minutes)', value: 'Standard (>30 Minutes)' }
        ]
      },
      {
        key: 'packaging',
        stepTitle: 'Step 2 of 5 · Packaging Selection',
        text: `Which packaging type should our dark store pack your items in?`,
        placeholder: 'Select packaging type...',
        options: [
          { label: 'Biodegradable Plastic', value: 'Biodegradable Plastic' },
          { label: 'Paper Packaging', value: 'Paper Packaging' },
          { label: 'Standard Packaging', value: 'Standard Packaging' }
        ]
      },
      {
        key: 'handover',
        stepTitle: 'Step 3 of 5 · Delivery Handover',
        text: `How would you like our rider to hand over your order?`,
        placeholder: 'Select handover mode...',
        options: [
          { label: 'Leave at Door', value: 'Leave at Door' },
          { label: 'Give in Hand', value: 'Give in Hand' },
          { label: 'Leave at Gate', value: 'Leave at Gate' },
          { label: 'Custom Note', value: 'Custom Note' }
        ]
      },
      {
        key: 'vehicle',
        stepTitle: 'Step 4 of 5 · Delivery Fleet',
        text: `Which type of delivery vehicle would you like assigned?`,
        placeholder: 'Select vehicle type...',
        options: [
          { label: 'EV (Electric Vehicle)', value: 'EV (Electric Vehicle)' },
          { label: 'Gas Delivery', value: 'Gas Delivery' }
        ]
      },
      {
        key: 'payment',
        stepTitle: 'Step 5 of 5 · Payment Method',
        text: `Your total is ₹${total}. How would you like to complete payment?`,
        placeholder: 'Select payment method...',
        options: [
          { label: 'Instant UPI / QR', value: 'Instant UPI' },
          { label: 'Credit / Debit Card', value: 'Card Payment' },
          { label: 'Cash on Delivery', value: 'Cash on Delivery' }
        ]
      }
    ];

    let currentQuestionIdx = 0;
    let streamTimer = null;

    function askQuestion(idx) {
      if (idx >= checkoutQuestions.length) {
        finishOrder();
        return;
      }

      currentQuestionIdx = idx;
      const q = checkoutQuestions[idx];

      if (orbWrapper) {
        orbWrapper.className = 'orb-wrapper speaking';
      }
      if (orbStatus) {
        orbStatus.textContent = 'NapKit Voice Synthesizing...';
      }
      if (questionStepPill) {
        questionStepPill.textContent = q.stepTitle;
      }
      if (orbAnswerBox) {
        orbAnswerBox.classList.remove('ready');
      }
      if (questionText) {
        questionText.innerHTML = '';
      }

      const words = q.text.split(' ');
      let wordIdx = 0;

      if (streamTimer) clearInterval(streamTimer);

      streamTimer = setInterval(() => {
        if (wordIdx < words.length) {
          const span = document.createElement('span');
          span.className = 'orb-word';
          span.textContent = words[wordIdx] + ' ';
          if (questionText) questionText.appendChild(span);
          wordIdx++;
        } else {
          clearInterval(streamTimer);
          streamTimer = null;
          revealAnswerBox(q);
        }
      }, 22);
    }

    function revealAnswerBox(q) {
      
      if (orbWrapper) {
        orbWrapper.className = 'orb-wrapper listening';
      }
      if (orbStatus) {
        orbStatus.textContent = 'Listening for your response...';
      }

      if (orbPillsGroup) {
        orbPillsGroup.innerHTML = '';
        q.options.forEach(opt => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'choice-pill';
          btn.innerHTML = opt.label;
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            handleAnswer(opt.value || opt.label);
          });
          orbPillsGroup.appendChild(btn);
        });
      }

      if (chatInput) {
        chatInput.placeholder = q.placeholder;
        chatInput.value = '';
      }

      if (orbAnswerBox) {
        orbAnswerBox.classList.add('ready');
      }
      if (chatInput) {
        chatInput.focus();
      }
    }

    function handleAnswer(ans) {
      if (!ans) return;
      if (streamTimer) {
        clearInterval(streamTimer);
        streamTimer = null;
      }

      const currentQ = checkoutQuestions[currentQuestionIdx];
      checkoutAnswers[currentQ.key] = ans;

      if (orbStatus) {
        orbStatus.textContent = `✓ Recorded: ${ans}`;
      }

      if (currentQ.key === 'payment' && (ans === 'Card Payment' || ans.toLowerCase().includes('card'))) {
        if (orbZone) orbZone.style.display = 'none';
        if (cardFormBox) cardFormBox.classList.add('active');
        return;
      }

      setTimeout(() => {
        askQuestion(currentQuestionIdx + 1);
      }, 160);
    }

    function finishOrder() {
      if (cardFormBox) cardFormBox.classList.remove('active');
      if (orbZone) orbZone.style.display = 'none';
      if (summaryBar) summaryBar.style.display = 'none';
      if (itemsDrawer) itemsDrawer.style.display = 'none';

      const rocketOverlay = document.getElementById('rocketLaunchOverlay');
      const rocketVessel = document.getElementById('rocketVessel');
      const rocketTitle = document.getElementById('rocketTitle');
      const rocketDesc = document.getElementById('rocketDesc');

      const orderNum = '#NK-' + Math.floor(1000 + Math.random() * 9000);
      const orderTag = document.getElementById('orderTag');
      if (orderTag) orderTag.textContent = orderNum;

      window.finishOrder = finishOrder;

      const eco = calculateOrderEco(checkoutAnswers.packaging, checkoutAnswers.vehicle);

      const ecoStats = getEcoStats();
      ecoStats.co2Grams += eco.co2Grams;
      ecoStats.points += eco.points;
      ecoStats.score = eco.rating;
      ecoStats.orders += 1;
      localStorage.setItem('ecobite-eco-stats', JSON.stringify(ecoStats));
      updateEcoStatsUI();

      try {
        const history = JSON.parse(localStorage.getItem('ecobite-order-history') || '[]');
        const itemsSummary = (cart && cart.length > 0) ? cart.map(i => `${i.name} × ${i.qty || 1}`).join(', ') : 'Essentials Pack';
        history.unshift({
          id: orderNum,
          items: itemsSummary,
          status: 'In Transit'
        });
        localStorage.setItem('ecobite-order-history', JSON.stringify(history.slice(0, 10)));
        renderOrderHistory();
      } catch(e) {}

      if (confirmDetailsGrid) {
        confirmDetailsGrid.innerHTML = `
          <div class="confirm-col">
            <div class="confirm-cell">
              <span class="cell-label">Customer</span>
              <strong class="cell-value">${checkoutAnswers.name || 'Customer'} <span class="cell-sub">(${checkoutAnswers.phone || ''})</span></strong>
            </div>
            <div class="confirm-cell">
              <span class="cell-label">Warehouse Hub</span>
              <strong class="cell-value hub-val">Nearest Dark Store Hub (Auto Dispatched)</strong>
            </div>
            <div class="confirm-cell">
              <span class="cell-label">Packaging</span>
              <strong class="cell-value">${checkoutAnswers.packaging || 'Biodegradable Plastic'}</strong>
            </div>
            <div class="confirm-cell">
              <span class="cell-label">Delivery Fleet</span>
              <strong class="cell-value">${checkoutAnswers.vehicle || 'EV (Electric Vehicle)'}</strong>
            </div>
            <div class="confirm-cell">
              <span class="cell-label">Payment</span>
              <strong class="cell-value">${checkoutAnswers.payment || 'Cash on Delivery'} <span class="cell-sub">(₹${total})</span></strong>
            </div>
          </div>
          <div class="confirm-grid-divider"></div>
          <div class="confirm-col">
            <div class="confirm-cell">
              <span class="cell-label">Delivery To</span>
              <strong class="cell-value">${checkoutAnswers.address || 'Address'}</strong>
            </div>
            <div class="confirm-cell">
              <span class="cell-label">Delivery Speed</span>
              <strong class="cell-value">${checkoutAnswers.speed || 'Fast (15 Minute)'}</strong>
            </div>
            <div class="confirm-cell">
              <span class="cell-label">Handover Mode</span>
              <strong class="cell-value">${checkoutAnswers.handover || 'Leave at Door'}</strong>
            </div>
            <div class="confirm-cell">
              <span class="cell-label">Estimated Eco Savings</span>
              <strong class="cell-value eco-savings-val">${eco.co2Grams}g CO₂ Saved · +${eco.points} Eco Points (${eco.rating})</strong>
            </div>
          </div>
        `;
      }

      localStorage.removeItem('ecobite-cart');
      localStorage.removeItem('orderData');
      if (typeof updateCart === 'function') {
        cart = [];
        updateCart();
      }

      const is15Min = !checkoutAnswers.speed || !checkoutAnswers.speed.toLowerCase().includes('30 min');
      let sec = is15Min ? 15 * 60 : 35 * 60;
      const countEl = document.getElementById('countdownTimer');
      if (window._deliveryCountdownInterval) clearInterval(window._deliveryCountdownInterval);
      window._deliveryCountdownInterval = setInterval(() => {
        sec--;
        if (sec <= 0) {
          if (countEl) countEl.textContent = 'Arrived!';
          clearInterval(window._deliveryCountdownInterval);
          return;
        }
        const m = Math.floor(sec / 60).toString().padStart(2, '0');
        const s = (sec % 60).toString().padStart(2, '0');
        if (countEl) countEl.textContent = `${m}:${s}`;
      }, 1000);

      if (rocketOverlay && rocketVessel) {
        rocketOverlay.classList.add('active');
        rocketVessel.className = 'rocket-vessel launch-rumble';
        if (rocketTitle) rocketTitle.textContent = 'Preparing Ignition...';
        if (rocketDesc) rocketDesc.textContent = 'Calibrating optimal dispatch trajectory';

        setTimeout(() => {
          if (rocketVessel) rocketVessel.className = 'rocket-vessel launch-blast';
          const firstName = checkoutAnswers.name ? checkoutAnswers.name.split(' ')[0] : 'You';
          if (rocketTitle) rocketTitle.textContent = 'Order Dispatched!';
          if (rocketDesc) rocketDesc.textContent = `Rocketing to ${firstName} from nearest dark store hub`;
        }, 450);

        setTimeout(() => {
          rocketOverlay.classList.add('fade-out');
          setTimeout(() => {
            rocketOverlay.classList.remove('active', 'fade-out');
            if (confirmScreen) confirmScreen.classList.add('active');
          }, 350);
        }, 1800);
      } else {
        if (confirmScreen) confirmScreen.classList.add('active');
      }
    }

    function onInputSubmit() {
      if (!chatInput) return;
      const val = chatInput.value.trim();
      if (!val) return;
      chatInput.value = '';
      handleAnswer(val);
    }

    if (btnSend && !btnSend._hasSendListener) {
      btnSend._hasSendListener = true;
      btnSend.addEventListener('click', (e) => {
        e.preventDefault();
        onInputSubmit();
      });
    }

    if (chatInput && !chatInput._hasKeydownListener) {
      chatInput._hasKeydownListener = true;
      chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          onInputSubmit();
        }
      });
    }

    const payCardBtn = document.getElementById('payCardBtn');
    if (payCardBtn && !payCardBtn._hasPayListener) {
      payCardBtn._hasPayListener = true;
      payCardBtn.addEventListener('click', (e) => {
        e.preventDefault();
        checkoutAnswers.payment = 'Credit / Debit Card (Paid)';
        finishOrder();
      });
    }

    const cardNumberInput = document.getElementById('cardNumber');
    if (cardNumberInput && !cardNumberInput._hasInputListener) {
      cardNumberInput._hasInputListener = true;
      cardNumberInput.addEventListener('input', (e) => {
        let v = e.target.value.replace(/\D/g, '').substring(0, 16);
        e.target.value = v != '' ? v.match(/.{1,4}/g).join(' ') : '';
      });
    }

    window.finishOrder = finishOrder;

    askQuestion(0);
  }
};
window.SPA = SPA;

window.showToast = function(title, message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || '✓'}</span>
    <div class="toast-content">
      <span class="toast-title">${title}</span>
      <span class="toast-message">${message}</span>
    </div>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('toast-exit');
    setTimeout(() => toast.remove(), 300);
  }, 2500);
};

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });
document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale').forEach(el => {
  revealObserver.observe(el);
});

const scrollBtn = document.getElementById('scroll-to-top');
const progressCircle = document.querySelector('.scroll-progress-ring .progress');
if (scrollBtn && progressCircle) {
  const circumference = 2 * Math.PI * 21.5;
  progressCircle.style.strokeDasharray = circumference;
  progressCircle.style.strokeDashoffset = circumference;
  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = scrollTop / docHeight;
    progressCircle.style.strokeDashoffset = circumference - (circumference * scrollPercent);
    scrollBtn.classList.toggle('visible', scrollTop > 400);
  });
  scrollBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

document.addEventListener('DOMContentLoaded', function() {
  const cartToggle = document.getElementById('cart-toggle');
  const closeCart = document.getElementById('close-cart');
  const cartOverlay = document.getElementById('cart-overlay');
  const sidebarCart = document.getElementById('sidebar-cart');

  if (cartToggle) cartToggle.addEventListener('click', () => {
    sidebarCart.classList.add('open');
    cartOverlay.classList.add('active');
  });
  if (closeCart) closeCart.addEventListener('click', () => {
    sidebarCart.classList.remove('open');
    cartOverlay.classList.remove('active');
  });
  if (cartOverlay) cartOverlay.addEventListener('click', () => {
    sidebarCart.classList.remove('open');
    cartOverlay.classList.remove('active');
  });

  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
      if (sidebarCart) sidebarCart.classList.remove('open');
      if (cartOverlay) cartOverlay.classList.remove('active');
      const pmo = document.getElementById('product-modal-overlay');
      if (pmo) pmo.classList.remove('open');
      const smo = document.getElementById('schedule-modal-overlay');
      if (smo) smo.classList.remove('open');
    }
  });

  document.querySelectorAll('.ripple-effect').forEach(btn => {
    btn.addEventListener('click', function(e) {
      const circle = document.createElement('span');
      circle.className = 'ripple-circle';
      const rect = this.getBoundingClientRect();
      circle.style.left = (e.clientX - rect.left - 20) + 'px';
      circle.style.top = (e.clientY - rect.top - 20) + 'px';
      this.appendChild(circle);
      setTimeout(() => circle.remove(), 600);
    });
  });

  const newsletterBtn = document.getElementById('newsletter-btn');
  if (newsletterBtn) {
    newsletterBtn.addEventListener('click', () => {
      const email = document.getElementById('newsletter-email');
      if (email && email.value.trim() && email.value.includes('@')) {
        showToast('Subscribed!', 'You\'ll receive exclusive offers and product updates.', 'success');
        email.value = '';
      } else {
        showToast('Invalid Email', 'Please enter a valid email address.', 'error');
      }
    });
  }

  const applyPromo = document.getElementById('apply-promo');
  if (applyPromo) {
    applyPromo.addEventListener('click', () => {
      const code = document.getElementById('promo-code');
      if (!code) return;
      const val = code.value.trim().toUpperCase();
      if (val === 'NAPKIT10' || val === 'ECOBITE10' || val === 'WELCOME20') {
        applyPromo.textContent = '✓ Applied';
        applyPromo.classList.add('applied');
        showToast('Promo Applied!', `Code "${val}" activated.`, 'success');
        window.activePromo = val;
        if (typeof updateCart === 'function') updateCart();
      } else if (val) {
        applyPromo.textContent = 'Invalid';
        applyPromo.classList.add('error');
        showToast('Invalid Code', 'This promo code is not valid.', 'error');
        setTimeout(() => {
          applyPromo.textContent = 'Apply';
          applyPromo.classList.remove('error');
        }, 2000);
      }
    });
  }

  const applyEP = document.getElementById('apply-ecopoints');
  if (applyEP) {
    applyEP.addEventListener('click', () => {
      window.ecoPointsApplied = true;
      applyEP.textContent = '✓ Applied';
      showToast('Eco Points Redeemed', '120 points = ₹12 discount applied.', 'success');
      if (typeof updateCart === 'function') updateCart();
    });
  }

  const useSaved = document.getElementById('use-saved-settings');
  if (useSaved) {
    useSaved.addEventListener('click', () => {
      const saved = JSON.parse(localStorage.getItem('ecobite-settings') || '{}');
      if (saved.name) document.getElementById('customer-name').value = saved.name;
      if (saved.phone) document.getElementById('customer-phone').value = saved.phone;
      if (saved.address) document.getElementById('customer-address').value = saved.address;
      showToast('Settings Loaded', 'Your saved delivery details have been filled in.', 'info');
    });
  }

  document.querySelectorAll('.pref-options').forEach(group => {
    group.querySelectorAll('.pref-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        group.querySelectorAll('.pref-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        if (group.id === 'handover-options') {
          const ci = document.getElementById('custom-handover');
          ci.style.display = btn.dataset.val === 'custom' ? 'block' : 'none';
        }
        
        if (typeof updateEcoImpact === 'function') updateEcoImpact();
      });
    });
  });

  const openSchedule = document.getElementById('open-schedule');
  const cartScheduleTrigger = document.getElementById('cart-schedule-trigger');
  const scheduleOverlay = document.getElementById('schedule-modal-overlay');
  const scheduleClose = document.getElementById('schedule-modal-close');

  function triggerScheduleModal(e) {
    if (e) e.preventDefault();
    if (scheduleOverlay) scheduleOverlay.classList.add('open');
  }

  if (openSchedule) openSchedule.addEventListener('click', triggerScheduleModal);
  if (cartScheduleTrigger) cartScheduleTrigger.addEventListener('click', triggerScheduleModal);
  if (scheduleClose) scheduleClose.addEventListener('click', () => scheduleOverlay.classList.remove('open'));
  if (scheduleOverlay) scheduleOverlay.addEventListener('click', (e) => {
    if (e.target === scheduleOverlay) scheduleOverlay.classList.remove('open');
  });

  const confirmSchedule = document.getElementById('confirm-schedule');
  if (confirmSchedule) confirmSchedule.addEventListener('click', () => {
    showToast('Schedule Set!', 'Your recurring delivery has been configured.', 'success');
    scheduleOverlay.classList.remove('open');
  });

  const testimonialsTrack = document.getElementById('testimonials-track');
  if (testimonialsTrack) {
    const testimonials = [
      { name: 'Arjun M.', initials: 'AM', text: 'Got my office supplies in 12 minutes! The biodegradable packaging was a great touch. NapKit is my go-to for quick deliveries.', stars: 4, time: '2 days ago' },
      { name: 'Priya S.', initials: 'PS', text: 'Love the EV delivery option. Scheduled weekly grocery runs and never have to think about restocking. Absolutely seamless.', stars: 5, time: '1 week ago' },
      { name: 'Rahul K.', initials: 'RK', text: 'The warehouse map is so cool — I can see which hub has my items in stock. Delivery was 17 mins due to rain, but rider was polite!', stars: 3, time: '3 days ago' },
      { name: 'Sneha D.', initials: 'SD', text: 'Best quick commerce app. The smart search helped me find the right baby products instantly. Return was hassle-free too.', stars: 4, time: '5 days ago' },
      { name: 'Vikram T.', initials: 'VT', text: 'I use the "leave at door" option every time. Perfect for WFH days. The driver chat feature gives me real-time updates.', stars: 4, time: '1 week ago' },
      { name: 'Ananya P.', initials: 'AP', text: 'Switched from other delivery apps to NapKit for the eco-friendly approach. The CO2 savings tracker is a nice motivator!', stars: 5, time: '4 days ago' }
    ];
    testimonials.forEach(t => {
      const stars = Array(5).fill(0).map((_, i) =>
        `<span class="star ${i < t.stars ? 'filled' : ''}">★</span>`
      ).join('');
      testimonialsTrack.innerHTML += `
        <div class="testimonial-card">
          <div class="testimonial-header">
            <div class="testimonial-avatar">${t.initials}</div>
            <div class="testimonial-meta">
              <h4>${t.name}</h4>
              <span>${t.time}</span>
            </div>
          </div>
          <p>"${t.text}"</p>
          <div class="star-rating">${stars}</div>
        </div>
      `;
    });
  }

  SPA.handleHash();
  window.addEventListener('hashchange', () => SPA.handleHash());

  document.querySelectorAll('[data-page]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = link.getAttribute('data-page');
      if (page.startsWith('#')) {
        const sectionId = page.replace('#', '');

        if (link.closest('#navbar')) {
          document.querySelectorAll('#navbar a').forEach(a => a.classList.remove('active'));
          link.classList.add('active');
        }

        const homeView = document.getElementById('page-home');
        if (!homeView || !homeView.classList.contains('active')) {
          SPA.navigate('home', sectionId);
        }

        history.pushState(null, '', '#' + sectionId);

        const el = document.getElementById(sectionId);
        if (el) {
          const headerOffset = 84;
          const elementPosition = el.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }

        const catFilter = link.getAttribute('data-category');
        if (catFilter) {
          const catBtn = document.querySelector(`.menus-button[data-category="${catFilter}"]`);
          if (catBtn) catBtn.click();
        }
      } else {
        window.location.hash = page;
      }
      
      const nav = document.getElementById('navbar');
      const toggle = document.getElementById('menu-toggle');
      if (nav && nav.classList.contains('show-menu')) {
        nav.classList.remove('show-menu');
        if (toggle) toggle.textContent = '☰';
      }
    });
  });

  let isNavScrollThrottled = false;
  window.addEventListener('scroll', () => {
    if (isNavScrollThrottled) return;
    isNavScrollThrottled = true;
    setTimeout(() => { isNavScrollThrottled = false; }, 60);

    const homeView = document.getElementById('page-home');
    if (!homeView || !homeView.classList.contains('active') || homeView.style.display === 'none') return;

    const scrollPos = window.scrollY + 180;
    const sections = [
      { id: 'map-section', selector: '#navbar a[href="#map-section"], #navbar a[data-page="#map-section"]' },
      { id: 'contact', selector: '#navbar a[href="#contact"], #navbar a[data-page="#contact"]' },
      { id: 'menu', selector: '#navbar a[href="#menu"], #navbar a[data-page="#menu"]' },
      { id: 'home', selector: '#navbar a[href="#home"], #navbar a[data-page="home"]' }
    ];

    for (const sec of sections) {
      const el = document.getElementById(sec.id);
      if (el && scrollPos >= el.offsetTop) {
        const currentActive = document.querySelector('#navbar a.active');
        const targetLink = document.querySelector(sec.selector);
        if (targetLink && currentActive !== targetLink) {
          document.querySelectorAll('#navbar a').forEach(a => a.classList.remove('active'));
          targetLink.classList.add('active');
        }
        break;
      }
    }
  }, { passive: true });
});

const sections = document.querySelectorAll("section");
const navLinks = document.querySelectorAll("nav ul li a");
const header = document.getElementById("header");

let lastScroll = 0;

window.addEventListener("scroll", () => {
  const scrollY = window.scrollY;

  if (header) {
    const isScrolled = scrollY > 40;
    if (header.classList.contains('scrolled') !== isScrolled) {
      header.classList.toggle('scrolled', isScrolled);
    }
  }

  const homeEl = document.getElementById('page-home');
  if (homeEl && homeEl.style.display !== 'none') {
    let current = "";
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 140;
      const sectionHeight = section.clientHeight;
      if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
        current = section.getAttribute("id");
      }
    });

    const homeLink = document.querySelector('#navbar a[data-page="home"]') || document.querySelector('#navbar a[href="#home"]');

    if (scrollY < 200 || !current) {
      if (homeLink && !homeLink.classList.contains('active')) {
        navLinks.forEach(l => l.classList.remove('active'));
        homeLink.classList.add('active');
      }
    } else {
      let targetLink = null;
      navLinks.forEach(link => {
        const href = (link.getAttribute("href") || "").replace('#', '');
        const page = (link.getAttribute("data-page") || "").replace('#', '');
        if (href === current || page === current) {
          targetLink = link;
        }
      });
      if (targetLink) {
        if (!targetLink.classList.contains('active')) {
          navLinks.forEach(l => l.classList.remove('active'));
          targetLink.classList.add('active');
        }
      } else if (scrollY < 400 && homeLink && !homeLink.classList.contains('active')) {
        navLinks.forEach(l => l.classList.remove('active'));
        homeLink.classList.add('active');
      }
    }
  }

  lastScroll = scrollY;
}, { passive: true });

const menuToggleBtn = document.getElementById('menu-toggle');
if (menuToggleBtn) {
  menuToggleBtn.addEventListener('click', () => {
    const navGroup = document.querySelector('.nav-center-group');
    if (navGroup) {
      const isOpen = navGroup.classList.toggle('show-mobile');
      menuToggleBtn.textContent = isOpen ? '✕' : '☰';
    }
  });
}

navLinks.forEach(link => {
  link.addEventListener('click', () => {
    const navGroup = document.querySelector('.nav-center-group');
    if (navGroup && navGroup.classList.contains('show-mobile')) {
      navGroup.classList.remove('show-mobile');
      if (menuToggleBtn) menuToggleBtn.textContent = '☰';
    }
  });
});

const foodList = document.getElementById("food-list");

const foods = [
  {
    id: "1", category: "home", img: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500&auto=format&fit=crop&q=80",
    name: "LED Desk Lamp", desc: "Adjustable brightness, USB-powered, eye-care technology.",
    price: 890, link: "led-lamp", time: "12 min", rating: 4.4,
    reviews: 234, returnRate: "2.1%", allergy: "None",
    variants: [{ label: "Color", options: ["White", "Black", "Silver"] }],
    reviewList: [
      { user: "Amit R.", text: "Great build quality, very bright.", stars: 5 },
      { user: "Priya K.", text: "Good lamp, wish the power cord was slightly longer.", stars: 3 }
    ]
  },
  {
    id: "2", category: "home", img: "images/bamboo_tissue_box.jpg",
    name: "Bamboo Tissue Box", desc: "Eco-friendly bamboo cover, fits standard tissue packs.",
    price: 450, link: "tissue-box", time: "8 min", rating: 4.3,
    reviews: 127, returnRate: "1.5%", allergy: "None",
    variants: [{ label: "Finish", options: ["Natural", "Dark Walnut"] }],
    reviewList: [
      { user: "Sneha D.", text: "Looks great on my desk!", stars: 5 },
      { user: "Rahul T.", text: "Solid bamboo finish, fits standard tissue boxes well.", stars: 4 }
    ]
  },
  {
    id: "3", category: "office", img: "images/mousepad.jpg",
    name: "Ergonomic Mousepad", desc: "Memory foam wrist rest, non-slip base, smooth surface.",
    price: 599, link: "mousepad", time: "10 min", rating: 4.3,
    reviews: 312, returnRate: "1.8%", allergy: "None",
    variants: [{ label: "Size", options: ["Standard", "Extended"] }],
    reviewList: [
      { user: "Vikram S.", text: "My wrist pain is gone!", stars: 5 },
      { user: "Ananya P.", text: "Great mousepad, worth the price.", stars: 4 },
      { user: "Karan M.", text: "Solid wrist cushioning, takes a day to flatten out completely.", stars: 3 }
    ]
  },
  {
    id: "4", category: "office", img: "images/sticky_notes.jpg",
    name: "Sticky Notes Bundle", desc: "6 pads, neon colors, 100 sheets each, super adhesive.",
    price: 180, link: "sticky-notes", time: "7 min", rating: 4.1,
    reviews: 548, returnRate: "0.8%", allergy: "None",
    variants: [{ label: "Pack", options: ["6 Pads", "12 Pads"] }],
    reviewList: [
      { user: "Meera J.", text: "Super sticky, great neon colors.", stars: 4 },
      { user: "Dev K.", text: "Decent paper quality for office tasks and reminders.", stars: 3 }
    ]
  },
  {
    id: "5", category: "kids", img: "images/kids_art_kit.jpg",
    name: "Kids Art Kit", desc: "Crayons, sketch pens, color pencils — 64 piece set.",
    price: 650, link: "art-kit", time: "15 min", rating: 4.3,
    reviews: 421, returnRate: "1.2%", allergy: "None",
    variants: [{ label: "Set", options: ["64 Piece", "128 Piece"] }],
    reviewList: [
      { user: "Nisha G.", text: "Lots of vibrant colors, kept the kids busy for hours.", stars: 4 },
      { user: "Ravi M.", text: "Crayons and sketch pens are safe, sharpener could be sharper.", stars: 3 }
    ]
  },
  {
    id: "6", category: "kids", img: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=500&auto=format&fit=crop&q=80",
    name: "Building Blocks Set", desc: "150 interlocking pieces, BPA-free, STEM learning toy.",
    price: 1200, link: "blocks", time: "14 min", rating: 4.9,
    reviews: 673, returnRate: "0.5%", allergy: "None",
    variants: [{ label: "Pieces", options: ["150", "300"] }],
    reviewList: [
      { user: "Arjun P.", text: "Best toy purchase ever!", stars: 5 },
      { user: "Kavita S.", text: "My son plays with this daily.", stars: 5 }
    ]
  },
  {
    id: "7", category: "health", img: "images/multivitamin_gummies.jpg",
    name: "Multivitamin Gummies", desc: "30-day supply, 12 essential vitamins, natural flavors.",
    price: 480, link: "gummies", time: "9 min", rating: 4.3,
    reviews: 892, returnRate: "3.2%", allergy: "Gelatin",
    variants: [{ label: "Flavor", options: ["Mixed Fruit", "Berry"] }],
    reviewList: [
      { user: "Sanjay R.", text: "Taste great, easy to take daily.", stars: 4 },
      { user: "Pooja L.", text: "Kids enjoy the fruit flavors.", stars: 4 }
    ]
  },
  {
    id: "8", category: "health", img: "images/thermometer.jpg",
    name: "Digital Thermometer", desc: "Instant read, LCD display, medical grade accuracy.",
    price: 350, link: "thermometer", time: "8 min", rating: 4.2,
    reviews: 1023, returnRate: "1.1%", allergy: "None",
    variants: [],
    reviewList: [
      { user: "Dr. Gupta", text: "Accurate and reliable readings.", stars: 4 },
      { user: "Meena K.", text: "Fast reading, beep is slightly low but easy to read LCD.", stars: 3 }
    ]
  },
  {
    id: "9", category: "grocery", img: "images/organic_honey.jpg",
    name: "Organic Honey", desc: "500g, raw & unprocessed, sourced from Himalayan bees.",
    price: 420, link: "honey", time: "11 min", rating: 4.4,
    reviews: 756, returnRate: "0.9%", allergy: "None",
    variants: [{ label: "Size", options: ["250g", "500g", "1kg"] }],
    reviewList: [
      { user: "Kiran B.", text: "Thick consistency and natural wildflower aroma.", stars: 4 },
      { user: "Neha T.", text: "Authentic raw taste, crystallizes naturally in cold weather as real honey should.", stars: 3 }
    ]
  },
  {
    id: "10", category: "grocery", img: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop&q=80",
    name: "Basmati Rice 5kg", desc: "Premium aged basmati, extra-long grain, naturally aromatic.",
    price: 580, link: "rice", time: "13 min", rating: 4.5,
    reviews: 1340, returnRate: "0.4%", allergy: "None",
    variants: [{ label: "Weight", options: ["1kg", "5kg", "10kg"] }],
    reviewList: [
      { user: "Chef Sharma", text: "Restaurant quality grain.", stars: 5 },
      { user: "Asha M.", text: "Fragrant and fluffy every time.", stars: 4 }
    ]
  },
  {
    id: "11", category: "personal", img: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&auto=format&fit=crop&q=80",
    name: "Charcoal Face Wash", desc: "Deep pore cleansing, activated charcoal, 150ml.",
    price: 299, link: "facewash", time: "9 min", rating: 4.1,
    reviews: 445, returnRate: "2.8%", allergy: "None",
    variants: [{ label: "Size", options: ["100ml", "150ml"] }],
    reviewList: [
      { user: "Rohan D.", text: "Deep pore cleaning, slightly drying for winter.", stars: 3 },
      { user: "Diya N.", text: "Great for oily skin and daily cleansing.", stars: 4 }
    ]
  },
  {
    id: "12", category: "personal", img: "https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=500&auto=format&fit=crop&q=80",
    name: "Bamboo Toothbrush Set", desc: "Pack of 4, biodegradable, soft bristles.",
    price: 250, link: "toothbrush", time: "7 min", rating: 4.6,
    reviews: 678, returnRate: "0.6%", allergy: "None",
    variants: [{ label: "Pack", options: ["4 Pack", "8 Pack"] }],
    reviewList: [
      { user: "Eco Shruti", text: "Sustainable and effective!", stars: 5 },
      { user: "Kartik V.", text: "Great quality bristles.", stars: 4 }
    ]
  },
  {
    id: "13", category: "home", img: "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=500&auto=format&fit=crop&q=80",
    name: "Scented Candle Set", desc: "Set of 3, soy wax, lavender/vanilla/jasmine, 25hr burn.",
    price: 750, link: "candles", time: "10 min", rating: 4.8,
    reviews: 389, returnRate: "1.0%", allergy: "None",
    variants: [{ label: "Scent", options: ["Lavender", "Vanilla", "Jasmine", "Mixed Set"] }],
    reviewList: [
      { user: "Priti S.", text: "Amazing fragrance, fills the room!", stars: 5 },
      { user: "Anand R.", text: "Burns evenly, great quality.", stars: 5 }
    ]
  },
  {
    id: "14", category: "office", img: "images/cable_organizer.jpg",
    name: "Cable Organizer Kit", desc: "Silicone cable clips, desk mount, 12 piece set.",
    price: 320, link: "cables", time: "8 min", rating: 4.2,
    reviews: 567, returnRate: "1.3%", allergy: "None",
    variants: [{ label: "Color", options: ["Black", "White", "Gray"] }],
    reviewList: [
      { user: "Arun M.", text: "Finally, a clean desk with no tangled wires!", stars: 4 },
      { user: "Tanvi G.", text: "Good adhesive, holds thin charging cords firmly.", stars: 3 }
    ]
  },
  {
    id: "15", category: "health", img: "images/protein_bars.jpg",
    name: "Protein Bar Box", desc: "12 bars, 20g protein each, dark chocolate almond.",
    price: 960, link: "protein", time: "11 min", rating: 4.2,
    reviews: 1102, returnRate: "1.7%", allergy: "Nuts, Dairy, Soy",
    variants: [{ label: "Flavor", options: ["Choco Almond", "Peanut Butter", "Mixed"] }],
    reviewList: [
      { user: "Fitness Raj", text: "Crispy texture and good 20g protein punch.", stars: 4 },
      { user: "Kabir T.", text: "Rich chocolate flavor, a bit dense but filling.", stars: 3 }
    ]
  },
  {
    id: "16", category: "grocery", img: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&auto=format&fit=crop&q=80",
    name: "Cold Pressed Olive Oil", desc: "Extra virgin, 500ml, imported from Spain.",
    price: 720, link: "olive-oil", time: "12 min", rating: 4.7,
    reviews: 423, returnRate: "0.7%", allergy: "None",
    variants: [{ label: "Size", options: ["250ml", "500ml", "1L"] }],
    reviewList: [
      { user: "Chef Anita", text: "Restaurant quality oil.", stars: 5 },
      { user: "Pradeep V.", text: "Great for salads and cooking.", stars: 5 }
    ]
  },
  {
    id: "17", category: "kids", img: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&auto=format&fit=crop&q=80",
    name: "Kids Water Bottle", desc: "500ml, BPA-free, leak-proof, dinosaur design.",
    price: 380, link: "bottle", time: "8 min", rating: 4.2,
    reviews: 891, returnRate: "1.4%", allergy: "None",
    variants: [{ label: "Design", options: ["Dinosaur", "Space", "Unicorn"] }],
    reviewList: [
      { user: "Mom Kavitha", text: "Cute design! Cap takes a firm click to lock.", stars: 3 },
      { user: "Deepak S.", text: "Great quality, no leaks so far.", stars: 4 }
    ]
  },
  {
    id: "18", category: "home", img: "images/plant_mister.jpg",
    name: "Plant Mister Spray", desc: "300ml glass bottle, fine mist, brass nozzle.",
    price: 290, link: "mister", time: "9 min", rating: 4.1,
    reviews: 234, returnRate: "1.9%", allergy: "None",
    variants: [{ label: "Color", options: ["Clear", "Amber", "Green"] }],
    reviewList: [
      { user: "Plant Mom", text: "Beautiful amber glass and fine mist spray.", stars: 4 },
      { user: "Geeta P.", text: "Very fine mist, glass bottle is sturdy though nozzle needs occasional tightening.", stars: 3 }
    ]
  },
  {
    id: "19", category: "personal", img: "images/sunscreen.jpg",
    name: "Sunscreen SPF 50+", desc: "Matte finish, PA++++, 100ml, water resistant.",
    price: 550, link: "sunscreen", time: "10 min", rating: 4.3,
    reviews: 1567, returnRate: "2.3%", allergy: "None",
    variants: [{ label: "Size", options: ["50ml", "100ml"] }],
    reviewList: [
      { user: "Derma Priya", text: "No white cast, absorbs easily.", stars: 4 },
      { user: "Rohit B.", text: "Matte finish is good for humid weather.", stars: 3 }
    ]
  },
  {
    id: "20", category: "grocery", img: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=500&auto=format&fit=crop&q=80",
    name: "Green Tea Collection", desc: "50 tea bags, 5 flavors, antioxidant-rich blend.",
    price: 390, link: "green-tea", time: "8 min", rating: 4.6,
    reviews: 943, returnRate: "0.5%", allergy: "None",
    variants: [{ label: "Pack", options: ["25 Bags", "50 Bags", "100 Bags"] }],
    reviewList: [
      { user: "Tea Lover Anu", text: "Refreshing variety!", stars: 5 },
      { user: "Kiran S.", text: "Great everyday tea.", stars: 4 }
    ]
  }
];

const categoryEmoji = {
  home: '', office: '', kids: '', health: '', grocery: '', personal: ''
};

const categoryLabel = {
  home: 'Home Essentials',
  office: 'Office Supplies',
  kids: 'Kids',
  health: 'Health & Wellness',
  grocery: 'Grocery',
  personal: 'Personal Care'
};

function getStarRating(rating) {
  const full = Math.floor(rating);
  let html = '<div class="star-rating">';
  for (let i = 0; i < 5; i++) {
    html += `<span class="star ${i < full ? 'filled' : ''}">★</span>`;
  }
  html += `<span style="font-size:12px; color:var(--text-muted); margin-left:6px; font-weight:600;">${rating}</span>`;
  html += '</div>';
  return html;
}

function getAllergyPills(allergyStr) {
  if (!allergyStr || allergyStr === 'None') return '';
  return allergyStr.split(',').map(a => {
    const allergen = a.trim().toLowerCase();
    const labels = {
      dairy: 'Dairy', gluten: 'Gluten', nuts: 'Nuts',
      eggs: 'Eggs', soy: 'Soy', fish: 'Fish',
      gelatin: 'Gelatin'
    };
    const label = labels[allergen] || a.trim();
    return `<span class="allergy-pill ${allergen}">${label}</span>`;
  }).join('');
}

function updateCategoryCounts() {
  const counts = { all: foods.length };
  foods.forEach(f => { counts[f.category] = (counts[f.category] || 0) + 1; });
  document.querySelectorAll('.menus-button').forEach(btn => {
    const cat = btn.getAttribute('data-category');
    const count = counts[cat] || 0;
    if (!btn.querySelector('.category-count')) {
      const badge = document.createElement('span');
      badge.className = 'category-count';
      badge.textContent = count;
      btn.appendChild(badge);
    }
  });
}

let displayedCount = 8;
let currentItems = [];

function displayFoods(items, resetCount = true) {
  if (resetCount) displayedCount = 8;
  currentItems = items;
  if (!foodList) return;
  foodList.innerHTML = "";

  if (items.length === 0) {
    foodList.innerHTML = `
      <div class="no-results" style="grid-column: 1 / -1;">
        <span class="no-results-emoji" style="display:none;"></span>
        <h3>No products found</h3>
        <p>Try a different search term or category</p>
      </div>
    `;
    const showMoreExists = document.getElementById("show-more");
    if (showMoreExists) showMoreExists.remove();
    return;
  }

  const itemsToShow = items.slice(0, displayedCount);

  itemsToShow.forEach((food, index) => {
    const card = document.createElement("div");
    card.classList.add("food-card", "card-enter");
    card.setAttribute("data-category", food.category);
    card.setAttribute("data-product-id", food.id);

    const allergyHtml = getAllergyPills(food.allergy);

    card.innerHTML = `
      <div class="img-container">
        <img src="${food.img}" alt="${food.name}" loading="lazy" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=80';">
        <div class="food-card-overlay">
          <button class="quick-view-btn" data-id="${food.id}">Quick View</button>
        </div>
      </div>
      <span class="category-tag ${food.category}">${categoryEmoji[food.category] || ''} ${categoryLabel[food.category] || food.category}</span>
      ${getStarRating(food.rating || 4.5)}
      <h3>${food.name}</h3>
      <p>${food.desc}</p>
      <div class="product-review-badge">
        <span class="review-count">${food.reviews || 0} reviews</span>
        <span class="return-rate">${food.returnRate || '0%'} returns</span>
      </div>
      <div class="order-price">
        <span>₹${food.price}</span>
        <span class="time-badge">${food.time}</span>
        <button>Add to Cart</button>
        ${allergyHtml ? `<div class="allergy-info">${allergyHtml}</div>` : ''}
      </div>
    `;

    foodList.appendChild(card);
  });

  const showMoreExists = document.getElementById("show-more");
  if (!showMoreExists && items.length > displayedCount) {
    const btn = document.createElement("button");
    btn.id = "show-more";
    btn.textContent = `Show More (${items.length - displayedCount} remaining) ↓`;
    btn.addEventListener("click", () => {
      displayedCount += 8;
      displayFoods(currentItems, false);
    });
    if (foodList.parentElement) {
      foodList.parentElement.appendChild(btn);
    }
  } else if (items.length <= displayedCount && showMoreExists) {
    showMoreExists.remove();
  } else if (showMoreExists && items.length > displayedCount) {
    showMoreExists.textContent = `Show More (${items.length - displayedCount} remaining) ↓`;
  }
}

if (typeof foods !== 'undefined' && foodList) {
  displayFoods(foods);
  updateCategoryCounts();
}

const buttons = document.querySelectorAll(".menus-button");
buttons.forEach(btn => {
  btn.addEventListener("click", () => {
    buttons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const category = btn.getAttribute("data-category");
    displayFoods(category === "all" ? foods : foods.filter(f => f.category === category));
  });
});

function safeEscapeHtml(str) {
  return String(str || '').replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

function safeEscapeRegex(str) {
  return String(str || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const searchInput = document.getElementById('menu-search');
if (searchInput) {
  let searchTimeout;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      const query = searchInput.value.trim().toLowerCase();
      buttons.forEach(b => b.classList.remove('active'));
      document.querySelector('.menus-button[data-category="all"]')?.classList.add('active');
      if (!query) { displayFoods(foods); return; }
      const filtered = foods.filter(f =>
        f.name.toLowerCase().includes(query) ||
        f.desc.toLowerCase().includes(query) ||
        f.category.toLowerCase().includes(query)
      );
      displayFoods(filtered);
    }, 200);
  });
}

(function initTopBarSearch() {
  const navSearchInput = document.getElementById('nav-search-input');
  const navSearchDropdown = document.getElementById('navSearchDropdown');
  const navSearchClear = document.getElementById('navSearchClear');
  const navSearchWrapper = document.getElementById('navSearchWrapper');
  const menuSearch = document.getElementById('menu-search');
  const navLangPill = document.getElementById('navLangPill');

  if (navLangPill) {
    navLangPill.addEventListener('click', () => {
      if (typeof showToast === 'function') {
        showToast('Language & Region', 'Delhi-NCR · English (IN) · 15-Minute Fleet Active', 'info');
      }
    });
  }

  if (!navSearchInput || !navSearchDropdown) return;

  function renderDropdown(query) {
    const q = query.trim().toLowerCase();
    if (!q) {
      navSearchDropdown.classList.remove('open');
      navSearchDropdown.innerHTML = '';
      if (navSearchClear) navSearchClear.classList.remove('visible');
      return;
    }

    if (navSearchClear) navSearchClear.classList.add('visible');

    const matches = foods.filter(f =>
      f.name.toLowerCase().includes(q) ||
      f.desc.toLowerCase().includes(q) ||
      (f.category && f.category.toLowerCase().includes(q)) ||
      (categoryLabel[f.category] && categoryLabel[f.category].toLowerCase().includes(q)) ||
      (f.allergy && f.allergy.toLowerCase().includes(q))
    );

    if (matches.length === 0) {
      navSearchDropdown.innerHTML = `
        <div class="search-drop-empty">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity:0.6; margin-bottom:8px;"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <p>No products matching "<strong>${safeEscapeHtml(query)}</strong>"</p>
          <span class="empty-hint">Try searching for coffee, tea, bottle, oil, spray, desk...</span>
        </div>
      `;
      navSearchDropdown.classList.add('open');
      return;
    }

    const itemsHtml = matches.slice(0, 6).map(f => {
      const reg = new RegExp(`(${safeEscapeRegex(query.trim())})`, 'gi');
      const highlightedName = safeEscapeHtml(f.name).replace(reg, '<mark>$1</mark>');
      return `
        <div class="search-drop-item" data-id="${f.id}">
          <img src="${f.img}" alt="${safeEscapeHtml(f.name)}" class="search-item-thumb" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=80';">
          <div class="search-item-details">
            <div class="search-item-title">${highlightedName}</div>
            <div class="search-item-meta">
              <span class="search-item-category">${categoryLabel[f.category] || f.category}</span>
              <span>${f.time || '15 min'}</span>
              <span>★ ${f.rating || 4.5}</span>
            </div>
          </div>
          <div class="search-item-price-col">
            <span class="search-item-price">₹${f.price}</span>
            <button type="button" class="search-quick-add" data-id="${f.id}" title="Quick Add to Cart">+ Add</button>
          </div>
        </div>
      `;
    }).join('');

    navSearchDropdown.innerHTML = `
      <div class="search-drop-header">
        <span>Matching Products</span>
        <span class="match-count">${matches.length} found</span>
      </div>
      <div class="search-drop-list">
        ${itemsHtml}
      </div>
      <div class="search-drop-footer" id="searchDropFooter" data-query="${safeEscapeHtml(query)}">
        <span>View all ${matches.length} results in Shop</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
      </div>
    `;
    navSearchDropdown.classList.add('open');
  }

  let navSearchTimer;
  navSearchInput.addEventListener('input', () => {
    clearTimeout(navSearchTimer);
    navSearchTimer = setTimeout(() => {
      renderDropdown(navSearchInput.value);
    }, 120);
  });

  navSearchInput.addEventListener('focus', () => {
    if (navSearchInput.value.trim()) {
      renderDropdown(navSearchInput.value);
    }
  });

  function executeSearchInShop(q) {
    navSearchDropdown.classList.remove('open');
    if (typeof SPA !== 'undefined' && SPA.navigate) {
      SPA.navigate('home');
    }
    window.location.hash = 'menu';
    if (menuSearch) {
      menuSearch.value = q;
      menuSearch.dispatchEvent(new Event('input'));
    }
    setTimeout(() => {
      const menuSection = document.getElementById('menu');
      if (menuSection) {
        menuSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 120);
    if (q && typeof showToast === 'function') {
      showToast('Searching Shop', `Filtering for "${q}"...`, 'info');
    }
  }

  navSearchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      executeSearchInShop(navSearchInput.value.trim());
    } else if (e.key === 'Escape') {
      navSearchDropdown.classList.remove('open');
    }
  });

  if (navSearchClear) {
    navSearchClear.addEventListener('click', () => {
      navSearchInput.value = '';
      navSearchClear.classList.remove('visible');
      navSearchDropdown.classList.remove('open');
      navSearchDropdown.innerHTML = '';
      if (menuSearch && menuSearch.value) {
        menuSearch.value = '';
        menuSearch.dispatchEvent(new Event('input'));
      }
      navSearchInput.focus();
    });
  }

  navSearchDropdown.addEventListener('click', (e) => {
    const quickAddBtn = e.target.closest('.search-quick-add');
    if (quickAddBtn) {
      e.stopPropagation();
      const id = quickAddBtn.dataset.id;
      const product = foods.find(f => f.id === id);
      if (product && window.addItemToCart) {
        window.addItemToCart(product, 1);
        quickAddBtn.textContent = '✓';
        quickAddBtn.style.background = '#10b981';
        setTimeout(() => {
          quickAddBtn.textContent = '+ Add';
          quickAddBtn.style.background = '';
        }, 1200);
      }
      return;
    }

    const footer = e.target.closest('#searchDropFooter');
    if (footer) {
      const q = footer.dataset.query || navSearchInput.value.trim();
      executeSearchInShop(q);
      return;
    }

    const item = e.target.closest('.search-drop-item');
    if (item) {
      const id = item.dataset.id;
      if (window.openProductModal) {
        window.openProductModal(id);
      }
      navSearchDropdown.classList.remove('open');
    }
  });

  document.addEventListener('click', (e) => {
    if (navSearchWrapper && !navSearchWrapper.contains(e.target)) {
      navSearchDropdown.classList.remove('open');
    }
  });
})();

(function() {
  const overlay = document.getElementById('product-modal-overlay');
  const modal = document.getElementById('product-modal');
  let currentProduct = null;
  let currentQty = 1;

  window.openProductModal = function(id) { openModal(id); };

  function openModal(productId) {
    const product = foods.find(f => f.id === productId);
    if (!product) return;
    currentProduct = product;
    currentQty = 1;

    const imgEl = document.getElementById('modal-img');
    if (imgEl) imgEl.src = product.img;

    const titleEl = document.getElementById('modal-title') || document.getElementById('modal-name');
    if (titleEl) titleEl.textContent = product.name;

    const catEl = document.getElementById('modal-category');
    if (catEl) catEl.textContent = categoryLabel[product.category] || product.category;

    const descEl = document.getElementById('modal-desc');
    if (descEl) descEl.textContent = product.desc;

    const priceEl = document.getElementById('modal-price');
    if (priceEl) priceEl.textContent = `₹${product.price}`;

    const ratingEl = document.getElementById('modal-rating');
    if (ratingEl) ratingEl.textContent = `★ ${product.rating} · ${product.reviews} reviews · ${product.returnRate} return rate`;

    const qtyValEl = document.getElementById('modal-qty-val') || document.getElementById('modal-qty');
    if (qtyValEl) qtyValEl.textContent = '1';

    const reviewsEl = document.getElementById('modal-reviews');
    if (reviewsEl) {
      if (product.reviewList && product.reviewList.length) {
        reviewsEl.innerHTML = product.reviewList.map(r =>
          `<div class="modal-review-item"><strong>${r.user}</strong> ${'★'.repeat(r.stars)}${'☆'.repeat(5 - r.stars)}<br>${r.text}</div>`
        ).join('');
      } else {
        reviewsEl.innerHTML = '<p style="font-size:13px;color:var(--text-muted);">No reviews yet.</p>';
      }
    }

    const variantsArea = document.getElementById('modal-variants') || document.getElementById('modal-variants-area');
    if (variantsArea) {
      if (product.variants && product.variants.length) {
        variantsArea.innerHTML = product.variants.map(v =>
          `<label class="pref-label" style="font-weight:700; margin-bottom:4px; display:block;">${v.label}</label>
          <div class="pref-options" style="margin-bottom:8px;">
            ${v.options.map((opt, i) =>
              `<button type="button" class="pref-btn variant-btn ${i === 0 ? 'active' : ''}" data-variant="${v.label}" data-val="${opt}">${opt}</button>`
            ).join('')}
          </div>`
        ).join('');

        variantsArea.querySelectorAll('.variant-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            const group = btn.dataset.variant;
            variantsArea.querySelectorAll(`.variant-btn[data-variant="${group}"]`).forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
          });
        });
      } else {
        variantsArea.innerHTML = '';
      }
    }

    if (overlay) overlay.classList.add('open');
  }

  const minusBtn = document.getElementById('modal-qty-minus');
  const plusBtn = document.getElementById('modal-qty-plus');
  const qtyDisplay = document.getElementById('modal-qty-val') || document.getElementById('modal-qty');

  if (minusBtn && !minusBtn._bound) {
    minusBtn._bound = true;
    minusBtn.addEventListener('click', () => {
      if (currentQty > 1) {
        currentQty--;
        if (qtyDisplay) qtyDisplay.textContent = currentQty;
      }
    });
  }

  if (plusBtn && !plusBtn._bound) {
    plusBtn._bound = true;
    plusBtn.addEventListener('click', () => {
      currentQty++;
      if (qtyDisplay) qtyDisplay.textContent = currentQty;
    });
  }

  const addCartBtn = document.getElementById('modal-add-cart');
  if (addCartBtn && !addCartBtn._bound) {
    addCartBtn._bound = true;
    addCartBtn.addEventListener('click', () => {
      if (!currentProduct) return;

      const selectedVariants = {};
      document.querySelectorAll('#modal-variants .variant-btn.active, #modal-variants-area .variant-btn.active').forEach(btn => {
        selectedVariants[btn.dataset.variant] = btn.dataset.val;
      });

      const event = new CustomEvent('addToCartFromModal', {
        detail: {
          name: currentProduct.name,
          price: currentProduct.price,
          qty: currentQty,
          variants: selectedVariants
        }
      });
      document.dispatchEvent(event);

      if (overlay) overlay.classList.remove('open');
      if (typeof showToast === 'function') {
        showToast('Added to Cart', `${currentProduct.name} × ${currentQty}`, 'success');
      }
    });
  }

  document.querySelectorAll('#product-modal-close, #modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      if (overlay) overlay.classList.remove('open');
    });
  });

  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.remove('open');
    });
  }

  document.body.addEventListener('click', (e) => {
    const qvBtn = e.target.closest('.quick-view-btn');
    if (qvBtn) {
      e.stopPropagation();
      openModal(qvBtn.dataset.id);
      return;
    }

    const card = e.target.closest('.food-card');
    if (card && !e.target.closest('button')) {
      const id = card.dataset.productId;
      if (id) openModal(id);
    }
  });
})();

const cartItemsContainer = document.getElementById("cart-items");
const totalPriceContainer = document.getElementById("total-price-container");
const totalPriceEl = document.getElementById("total-price");
const emptyCartMessage = document.getElementById("empty-cart-message");
const whatsappOrderBtn = document.getElementById("whatsapp-order");

const customerName = document.getElementById("customer-name");
const customerPhone = document.getElementById("customer-phone");
const customerAddress = document.getElementById("customer-address");

let cart = JSON.parse(localStorage.getItem('ecobite-cart') || '[]');

function saveCart() {
  localStorage.setItem('ecobite-cart', JSON.stringify(cart));
}

function updateBadge() {
  const badge = document.getElementById('cart-badge');
  if (!badge) return;
  const totalItems = cart.reduce((sum, item) => sum + (item.qty || 1), 0);
  badge.textContent = totalItems;
  if (totalItems > 0) {
    badge.classList.add('visible');
    badge.classList.add('bounce');
    setTimeout(() => badge.classList.remove('bounce'), 400);
  } else {
    badge.classList.remove('visible');
  }
}

window.updateEcoImpact = function() {
  if (cart.length === 0) return;

  const vehicleBtn = document.querySelector('#vehicle-options .pref-btn.active');
  const packagingBtn = document.querySelector('#packaging-options .pref-btn.active');
  const vehicle = vehicleBtn ? vehicleBtn.dataset.val : 'ev';
  const packaging = packagingBtn ? packagingBtn.dataset.val : 'biodegradable';

  let co2Base = cart.reduce((sum, item) => sum + (item.qty || 1) * 50, 0);
  let co2Saved = 0;
  if (vehicle === 'ev') co2Saved += co2Base * 0.6;
  if (packaging === 'biodegradable') co2Saved += 30;
  else if (packaging === 'paper') co2Saved += 20;

  let score = 'Fair';
  if (vehicle === 'ev' && (packaging === 'biodegradable' || packaging === 'paper')) score = 'Excellent';
  else if (vehicle === 'ev' || packaging === 'biodegradable' || packaging === 'paper') score = 'Good';
  else score = 'Fair';

  const points = Math.round(co2Saved / 10);

  const co2El = document.getElementById('co2-saved');
  const scoreEl = document.getElementById('eco-score');
  const pointsEl = document.getElementById('eco-points-earned');

  if (co2El) co2El.textContent = `${Math.round(co2Saved)}g`;
  if (scoreEl) scoreEl.textContent = score;
  if (pointsEl) pointsEl.textContent = `+${points}`;
};

function updateCart() {
  if (!cartItemsContainer) return;
  cartItemsContainer.innerHTML = "";

  const prefsSection = document.getElementById('delivery-prefs-section');
  const ecoSection = document.getElementById('eco-impact-section');

  if (cart.length === 0) {
    if (emptyCartMessage) emptyCartMessage.style.display = "block";
    if (totalPriceContainer) totalPriceContainer.style.display = "none";
    if (prefsSection) prefsSection.style.display = "none";
    if (ecoSection) ecoSection.style.display = "none";
    updateBadge();
    saveCart();
    return;
  }

  if (emptyCartMessage) emptyCartMessage.style.display = "none";
  if (totalPriceContainer) totalPriceContainer.style.display = "block";
  if (prefsSection) prefsSection.style.display = "block";
  if (ecoSection) ecoSection.style.display = "block";

  let total = 0;
  cart.forEach((item, index) => {
    const qty = item.qty || 1;
    const itemTotal = item.price * qty;
    total += itemTotal;

    const variantText = item.variants ? Object.values(item.variants).join(', ') : '';

    const li = document.createElement("li");
    li.innerHTML = `
      <div class="cart-item-info">
        <span class="cart-item-name">${item.name}</span>
        ${variantText ? `<span class="cart-item-variant">${variantText}</span>` : ''}
        <span class="cart-item-price">₹${item.price} × ${qty} = ₹${itemTotal}</span>
      </div>
      <div class="cart-item-actions">
        <div class="qty-controls">
          <button class="qty-btn qty-minus" data-index="${index}">−</button>
          <span class="qty-value">${qty}</span>
          <button class="qty-btn qty-plus" data-index="${index}">+</button>
        </div>
        <button class="remove-btn" data-index="${index}" title="Remove item">✕</button>
      </div>
    `;
    cartItemsContainer.appendChild(li);
  });

  let discount = 0;
  const discountRow = document.getElementById('discount-row');
  const discountAmount = document.getElementById('discount-amount');

  if (window.activePromo) {
    if (window.activePromo === 'ECOBITE10') discount = Math.round(total * 0.1);
    else if (window.activePromo === 'WELCOME20') discount = Math.round(total * 0.2);
    if (discountRow) {
      discountRow.style.display = 'flex';
      discountRow.querySelector('span:first-child').textContent = `Discount (${window.activePromo}):`;
    }
    if (discountAmount) discountAmount.textContent = `-₹${discount}`;
  } else {
    if (discountRow) discountRow.style.display = 'none';
  }

  let epDiscount = 0;
  const epRow = document.getElementById('ecopoints-row');
  if (window.ecoPointsApplied) {
    epDiscount = 12;
    if (epRow) {
      epRow.style.display = 'flex';
      document.getElementById('ep-value').textContent = '12';
      document.getElementById('ep-discount').textContent = `-₹12`;
    }
  } else {
    if (epRow) epRow.style.display = 'none';
  }

  const finalTotal = Math.max(0, total - discount - epDiscount);

  if (totalPriceEl) {
    totalPriceEl.textContent = `₹${finalTotal}`;
    totalPriceEl.classList.add('count-animate');
    setTimeout(() => totalPriceEl.classList.remove('count-animate'), 300);
  }

  updateBadge();
  saveCart();
  updateEcoImpact();

  updateScheduleItems();
}

function updateScheduleItems() {
  const list = document.getElementById('schedule-items-list');
  if (!list) return;
  if (cart.length === 0) {
    list.innerHTML = '<p class="text-muted" style="font-size:13px;color:var(--text-muted);">Add items to your cart first.</p>';
    return;
  }
  list.innerHTML = cart.map((item, i) => `
    <div class="schedule-item">
      <label><input type="checkbox" checked data-index="${i}"> ${item.name}</label>
      <span>₹${item.price} × ${item.qty || 1}</span>
    </div>
  `).join('');
}

updateCart();

window.addItemToCart = function(product, qty = 1) {
  if (!product) return;
  const existingIndex = cart.findIndex(item => item.name === product.name);
  if (existingIndex >= 0) {
    cart[existingIndex].qty = (cart[existingIndex].qty || 1) + qty;
  } else {
    cart.push({ name: product.name, price: product.price, qty });
  }
  updateCart();
  if (typeof showToast === 'function') {
    showToast('Added to Cart', `${product.name} (₹${product.price})`, 'success');
  }
};

document.body.addEventListener("click", (e) => {
  
  if (e.target.tagName === "BUTTON" && e.target.textContent.trim() === "Add to Cart") {
    const card = e.target.closest(".food-card") || e.target.closest("#dishes");
    if (!card) return;

    const name = card.querySelector("h3").textContent;
    const priceText = card.querySelector(".order-price span")?.textContent || '';
    const price = parseInt(priceText.replace("₹", "").trim());

    const existingIndex = cart.findIndex(item => item.name === name);
    if (existingIndex >= 0) {
      cart[existingIndex].qty = (cart[existingIndex].qty || 1) + 1;
    } else {
      cart.push({ name, price, qty: 1 });
    }

    updateCart();

    e.target.textContent = '✓ Added!';
    e.target.classList.add('added');
    setTimeout(() => {
      e.target.textContent = 'Add to Cart';
      e.target.classList.remove('added');
    }, 1200);

    if (typeof showToast === 'function') showToast('Added to Cart', `${name} — ₹${price}`, 'success');
  }

  if (e.target.classList.contains('qty-plus')) {
    const index = parseInt(e.target.dataset.index);
    if (cart[index]) { cart[index].qty = (cart[index].qty || 1) + 1; updateCart(); }
  }
  if (e.target.classList.contains('qty-minus')) {
    const index = parseInt(e.target.dataset.index);
    if (cart[index]) {
      cart[index].qty = (cart[index].qty || 1) - 1;
      if (cart[index].qty <= 0) cart.splice(index, 1);
      updateCart();
    }
  }

  if (e.target.classList.contains("remove-btn")) {
    const index = parseInt(e.target.dataset.index);
    const li = e.target.closest('li');
    if (li) {
      li.classList.add('removing');
      setTimeout(() => { cart.splice(index, 1); updateCart(); }, 300);
    } else {
      cart.splice(index, 1); updateCart();
    }
  }
});

document.addEventListener('addToCartFromModal', (e) => {
  const { name, price, qty, variants } = e.detail;
  const existingIndex = cart.findIndex(item => item.name === name);
  if (existingIndex >= 0) {
    cart[existingIndex].qty = (cart[existingIndex].qty || 1) + qty;
  } else {
    cart.push({ name, price, qty, variants });
  }
  updateCart();
});

const useSavedSettingsBtn = document.getElementById('use-saved-settings');
if (useSavedSettingsBtn) {
  useSavedSettingsBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const settings = JSON.parse(localStorage.getItem('ecobite-settings') || '{}');
    let filled = false;
    if (settings.name && customerName) { customerName.value = settings.name; filled = true; }
    if (settings.address && customerAddress) { customerAddress.value = settings.address; filled = true; }
    if (settings.phone && customerPhone) { customerPhone.value = settings.phone; filled = true; }

    if (!filled) {
      if (customerName) customerName.value = 'Rahul Sharma';
      if (customerAddress) customerAddress.value = 'Flat 402, Green Valley Apartments, Sector 14';
      if (customerPhone) customerPhone.value = '+91 98765 43210';
      localStorage.setItem('ecobite-settings', JSON.stringify({
        name: 'Rahul Sharma',
        address: 'Flat 402, Green Valley Apartments, Sector 14',
        phone: '+91 98765 43210'
      }));
      if (typeof showToast === 'function') showToast('Default Loaded', 'Loaded saved address into cart details.', 'success');
    } else {
      if (typeof showToast === 'function') showToast('Saved Address Loaded', 'Auto-filled your details from browser cache.', 'success');
    }
  });
}

(function prefillCartDetails() {
  const settings = JSON.parse(localStorage.getItem('ecobite-settings') || '{}');
  if (customerName && !customerName.value && settings.name) customerName.value = settings.name;
  if (customerAddress && !customerAddress.value && settings.address) customerAddress.value = settings.address;
  if (customerPhone && !customerPhone.value && settings.phone) customerPhone.value = settings.phone;
})();

if (whatsappOrderBtn) {
  whatsappOrderBtn.addEventListener("click", (e) => {
    e.preventDefault();

    if (cart.length === 0) {
      if (typeof showToast === 'function') showToast('Cart Empty', 'Add some items first!', 'error');
      return;
    }

    const name = customerName ? customerName.value.trim() : '';
    const phone = customerPhone ? customerPhone.value.trim() : '';
    const address = customerAddress ? customerAddress.value.trim() : '';

    if (!name || !phone || !address) {
      if (typeof showToast === 'function') showToast('Missing Details', 'Please fill in your name, delivery address, and phone number.', 'error');
      return;
    }

    const existingSettings = JSON.parse(localStorage.getItem('ecobite-settings') || '{}');
    existingSettings.name = name;
    existingSettings.address = address;
    existingSettings.phone = phone;
    localStorage.setItem('ecobite-settings', JSON.stringify(existingSettings));

    let total = cart.reduce((sum, item) => sum + item.price * (item.qty || 1), 0);
    let discount = 0;
    if (window.activePromo === 'ECOBITE10') discount = Math.round(total * 0.1);
    if (window.activePromo === 'WELCOME20') discount = Math.round(total * 0.2);
    if (window.ecoPointsApplied) discount += 12;

    const orderData = {
      name, phone, address, cart: [...cart],
      total: Math.max(0, total - discount),
      subtotal: total,
      discount,
      promo: window.activePromo || null
    };
    localStorage.setItem("orderData", JSON.stringify(orderData));

    const sidebarCart = document.getElementById('sidebar-cart');
    const cartOverlay = document.getElementById('cart-overlay');
    if (sidebarCart) sidebarCart.classList.remove('open');
    if (cartOverlay) cartOverlay.classList.remove('active');
    document.body.style.overflow = '';

    SPA._checkoutInitialized = false;

    window.location.hash = 'checkout';
  });
}

const menuToggle = document.getElementById("menu-toggle");
const navbar = document.getElementById("navbar");

if (menuToggle && navbar) {
  menuToggle.addEventListener("click", () => {
    navbar.classList.toggle("show-menu");
    menuToggle.textContent = navbar.classList.contains("show-menu") ? '✕' : '☰';
  });
}

(function() {
  const heroTitle = document.getElementById('hero-title');
  if (heroTitle) {
    heroTitle.innerHTML = 'Everything <span class="hero-gradient-text">Delivered.</span><br>In <span class="hero-gradient-speed">15 Minutes.</span>';
  }
})();

setTimeout(() => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

  document.querySelectorAll('.reveal').forEach(el => {
    observer.observe(el);
  });
}, 100);
