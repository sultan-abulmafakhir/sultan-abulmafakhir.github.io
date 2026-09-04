// Konfigurasi Tailwind JS (Dijalankan saat app diawali)
if (window.tailwind) {
  tailwind.config = {
    theme: {
      extend: {
        colors: {
          brand: {
            green: '#15803D',
            yellow: '#EAB308',
            dark: '#0F172A',
            light: '#F8FAFC'
          }
        },
        fontFamily: {
          sans: ['Plus Jakarta Sans', 'sans-serif'],
          arabic: ['Amiri', 'serif']
        }
      }
    }
  };
}

// Session Redirect Cleaner
(function() {
  var redirect = sessionStorage.redirect;
  delete sessionStorage.redirect;
  if (redirect && redirect !== location.href) {
    history.replaceState(null, null, redirect);
  }
})();

// Variables Global
const API_URL = "https://script.google.com/macros/s/AKfycby-L-HibJKIlJsM4-KPYk9Zg7eJVosg5YF8e6j8HzqaKtQ_13ot0eLOQsox_Qk3CI35WQ/exec"; 

let globalData = {};
let activeAdminSheet = 'Profil';
let currentEditingRowId = null;
let currentImageIndex = 0;

function slugify(text) {
  if (!text) return '';
  return text.toString().toLowerCase().trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

/* ==========================================
   INIT & ROUTER ENGINE
   ========================================== */

window.addEventListener('DOMContentLoaded', async () => {
  if (window.lucide) lucide.createIcons();
  
  setTimeout(() => {
    const splash = document.getElementById('splash-screen');
    if (splash) {
      splash.classList.add('opacity-0');
      setTimeout(() => splash.classList.add('hidden'), 1000);
    }
  }, 2500);

  await fetchWebsiteData();
  
  // Tangkap path dari URL Hash saat halaman di-load / di-refresh
  const initialPath = window.location.hash.replace('#', '') || '/';
  handleRouting(initialPath);

  // Tangkap event ketika user menekan tombol Back/Forward browser
  window.addEventListener('hashchange', () => {
    const currentHash = window.location.hash.replace('#', '') || '/';
    handleRouting(currentHash);
  });
});

async function fetchWebsiteData() {
  try {
    const res = await fetch(API_URL + "?action=getAllData");
    const json = await res.json();
    if (json.status === "success") {
      globalData = json.data;
      bindSettings();
      const adminCms = document.getElementById('admin-cms');
      if (adminCms && !adminCms.classList.contains('hidden')) {
        renderAdminDashboard();
      }
    }
  } catch (e) {
    console.error("Gagal mengambil data dari Apps Script:", e);
  }
}

function bindSettings() {
  const s = globalData.Setting || {};
  if(s.site_name) {
    document.getElementById('nav-title').innerText = s.site_name;
    document.getElementById('splash-title').innerText = s.site_name;
    document.getElementById('footer-title').innerText = s.site_name;
  }
  if(s.arabic_name) {
    document.getElementById('splash-arabic').innerText = s.arabic_name;
    document.getElementById('footer-arabic').innerText = s.arabic_name;
  }
  if(s.tagline) {
    document.getElementById('splash-tagline').innerText = s.tagline;
    document.getElementById('nav-tagline').innerText = s.tagline;
  }
  if(s.address) document.getElementById('footer-address').innerText = s.address;
  if(s.logo) {
    document.getElementById('nav-logo').src = s.logo;
    document.getElementById('splash-logo').src = s.logo;
  }
}

function navigate(path, pushToHistory = true) {
  const cleanPath = path.startsWith('/') ? path : '/' + path;
  
  if (pushToHistory) {
    window.location.hash = cleanPath;
  }
  
  const mobileMenu = document.getElementById('mobile-menu');
  if (mobileMenu) mobileMenu.classList.add('hidden');

  handleRouting(cleanPath);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function handleRouting(pathname) {
  const segments = pathname.split('/').filter(Boolean);
  const mainSection = segments[0] || 'beranda';
  const itemSlug = segments[1] || null;

  const container = document.getElementById('main-content');
  if (!container) return;

  if (itemSlug) {
    renderDetailPage(mainSection, itemSlug);
    if (window.lucide) lucide.createIcons();
    return;
  }

  switch (mainSection) {
    case 'beranda': renderBerandaView(); break;
    case 'profil': renderProfilView(); break;
    case 'struktur-akademik': renderStrukturAkademikView(); break; // <-- Ditambahkan di sini
    case 'informasi': renderInformasiView(); break;
    case 'prodi': renderProdiView(); break;
    case 'berita': renderBeritaView(); break;
    case 'galeri': renderGaleriView(); break;
    case 'download': renderDownloadView(); break;
    case 'pmb': container.innerHTML = renderPMBForm(); break;
    default: renderBerandaView(); break;
  }

  if (window.lucide) lucide.createIcons();
}

function toggleMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  if (menu) menu.classList.toggle('hidden');
}

/* ==========================================
   PUBLIC VIEWS RENDERING
   ========================================== */

function renderBerandaView() {
  const container = document.getElementById('main-content');
  if (!container) return;

  const formatDateIndo = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? dateStr : date.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const getImageUrl = (urlOrId) => {
    if (!urlOrId) return '';
    if (urlOrId.includes('http')) return urlOrId;
    return `https://lh3.googleusercontent.com/d/${urlOrId}`;
  };

  // Helper untuk membersihkan tag HTML dari teks database
  const stripHtml = (html) => {
    if (!html) return '';
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  // Helper untuk mengambil data terbaru (Reverse array tanpa mengubah array aslinya)
  const getLatestData = (arr = []) => {
    return [...arr].reverse();
  };

  const heroImageRaw = globalData.Setting?.hero_image || globalData.Setting?.gambar_hero || globalData.Setting?.banner || '';
  const heroImageUrl = getImageUrl(heroImageRaw);

  container.innerHTML = `
    <div class="space-y-12 max-w-7xl mx-auto px-1 sm:px-0">
      
      <!-- HERO BANNER -->
      <div class="relative bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-800 rounded-3xl p-8 md:p-12 text-white shadow-2xl overflow-hidden border border-emerald-700/30">
        <div class="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div class="space-y-5 max-w-2xl w-full">
            <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-semibold backdrop-blur-md shadow-inner">
              <i data-lucide="award" class="w-4 h-4 text-amber-400"></i> Perguruan Tinggi Berbasis Pesantren
            </div>
            <div class="space-y-2">
              <h6 class="text-emerald-200/90 text-sm md:text-base font-medium tracking-wide">Selamat Datang di</h6> 
              <h1 class="font-extrabold text-3xl md:text-5xl text-white tracking-tight leading-tight">
                ${globalData.Setting?.site_name || "Ma'had Aly Sultan Abul Mafakhir"}
              </h1>
            </div>
            <p class="text-xs md:text-sm text-emerald-100/80 leading-relaxed max-w-xl font-normal">
              Perguruan tinggi yang konsen dan responsif dalam kajian Ushul Fikih dan melahirkan ulama fikih dan produk hukum terbarukan berbasis kitab kuning yang berstandar nasional dan internasional.
            </p>
            <div class="pt-4 flex flex-wrap gap-4">
              <button onclick="navigate('/pmb')" class="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-extrabold px-7 py-3.5 rounded-xl shadow-lg shadow-amber-500/20 transition-all hover:scale-105 active:scale-95 text-xs md:text-sm flex items-center gap-2">
                <i data-lucide="user-plus" class="w-4 h-4"></i> Pendaftaran PMB Online
              </button>
              <button onclick="navigate('/profil')" class="bg-white/10 backdrop-blur-md border border-white/20 text-white font-semibold px-7 py-3.5 rounded-xl hover:bg-white/20 transition-all hover:scale-105 active:scale-95 text-xs md:text-sm flex items-center gap-2">
                <span>Pelajari Profil</span>
                <i data-lucide="arrow-right" class="w-4 h-4"></i>
              </button>
            </div>
          </div>

          <div class="w-full md:w-auto shrink-0 flex justify-center md:justify-end">
            <div class="relative group">
              <div class="absolute -inset-1 bg-gradient-to-r from-amber-400/40 to-emerald-500/40 rounded-[50%] blur-xl opacity-50 group-hover:opacity-80 transition duration-500"></div>
              <div class="relative w-64 md:w-72 h-80 md:h-96 rounded-[50%] p-1.5 bg-gradient-to-b from-amber-400/80 via-amber-300/40 to-emerald-600/60 shadow-2xl shadow-black/40 border border-white/20">
                <img src="${heroImageUrl}" alt="Ma'had Aly Hero Image" class="w-full h-full object-cover rounded-[50%] transition-transform duration-500 group-hover:scale-105" onerror="this.onerror=null; this.src='';" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- TENTANG INSTITUSI (Max 5 Baris) -->
      <div onclick="navigate('/profil')" class="group relative bg-amber-100/40 hover:bg-amber-100/70 rounded-3xl p-6 md:p-8 border border-amber-200/80 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden">
        <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-emerald-600 to-emerald-800"></div>
        <div class="flex justify-between items-center border-b border-amber-200/60 pb-4 mb-4">
          <h3 class="text-lg md:text-xl font-bold text-slate-800 flex items-center gap-2.5 group-hover:text-emerald-900 transition-colors">
            <div class="w-9 h-9 rounded-xl bg-amber-200/60 text-emerald-900 flex items-center justify-center border border-amber-300/60 group-hover:bg-emerald-700 group-hover:text-white transition-all">
              <i data-lucide="building-2" class="w-5 h-5"></i>
            </div>
            Tentang Ma'had Aly
          </h3>
          <div class="text-xs text-emerald-800 group-hover:text-emerald-950 font-bold flex items-center gap-1">
            <span>Selengkapnya</span>
            <i data-lucide="arrow-right" class="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform"></i>
          </div>
        </div>
        <p class="text-slate-700 text-xs md:text-sm leading-relaxed line-clamp-5">
          ${stripHtml(globalData.Setting?.sejarah_singkat || globalData.Setting?.tagline || "Ma'had Aly Sultan Abul Mafakhir merupakan perguruan tinggi keagamaan Islam berbasis pesantren yang berfokus pada pendalaman ilmu-ilmu keislaman (Tafaqquh Fiddin).")}
        </p>
      </div>

      <!-- PROGRAM STUDI (Max 5 Baris) -->
      <div class="space-y-5">
        <div class="flex justify-between items-end">
          <div>
            <span class="text-[10px] font-extrabold uppercase tracking-wider text-amber-700">Pilihan Program</span>
            <h3 class="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2">
              <i data-lucide="book-open" class="w-6 h-6 text-emerald-700"></i> Program Studi Pilihan
            </h3>
          </div>
          <button onclick="navigate('/prodi')" class="text-xs text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 group cursor-pointer">
            <span>Lihat Semua</span>
            <i data-lucide="arrow-right" class="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform"></i>
          </button>
        </div>

        <div class="grid md:grid-cols-3 gap-6">
          ${getLatestData(globalData.Prodi).slice(0, 3).map(p => `
            <div onclick="navigate('/prodi/${slugify(p.nama_prodi)}')" class="group bg-amber-100/40 rounded-3xl p-6 border border-amber-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between cursor-pointer relative overflow-hidden">
              <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-600 to-emerald-800 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div>
                <div class="flex justify-between items-start mb-3">
                  <span class="text-[10px] font-extrabold tracking-wider uppercase px-3 py-1 rounded-full bg-amber-200/70 text-emerald-950 border border-amber-300/60">Gelar: ${p.gelar || '-'}</span>
                  <div class="w-8 h-8 rounded-xl bg-amber-200/50 group-hover:bg-emerald-700 group-hover:text-white transition-colors flex items-center justify-center text-emerald-900">
                    <i data-lucide="graduation-cap" class="w-4 h-4"></i>
                  </div>
                </div>
                <h4 class="font-bold text-base md:text-lg text-slate-800 group-hover:text-emerald-800 transition-colors leading-snug mb-2">${p.nama_prodi}</h4>
                <p class="text-xs text-slate-700 line-clamp-5 leading-relaxed mb-4">${stripHtml(p.deskripsi || 'Program studi unggulan berbasis pendalaman kitab kuning dan hukum Islam.')}</p>
              </div>
              <div class="pt-3 border-t border-amber-200/60 flex items-center justify-between text-xs font-semibold text-emerald-800">
                <span>Pelajari Kurikulum</span>
                <i data-lucide="arrow-right" class="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform"></i>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- INFORMASI & PENGUMUMAN (Max 5 Baris) -->
      <div class="space-y-5">
        <div class="flex justify-between items-end">
          <div>
            <span class="text-[10px] font-extrabold uppercase tracking-wider text-amber-700">Update Akademik</span>
            <h3 class="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2">
              <i data-lucide="megaphone" class="w-6 h-6 text-emerald-700"></i> Informasi & Pengumuman
            </h3>
          </div>
          <button onclick="navigate('/informasi')" class="text-xs text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 group">
            <span>Lihat Semua</span>
            <i data-lucide="arrow-right" class="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform"></i>
          </button>
        </div>

        <div class="grid md:grid-cols-3 gap-6">
          ${getLatestData(globalData.Informasi).slice(0, 3).map(inf => `
            <div onclick="navigate('/informasi/${slugify(inf.judul)}')" class="group bg-amber-100/40 rounded-3xl p-6 border border-amber-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer flex flex-col justify-between relative overflow-hidden">
              <div class="space-y-3">
                <div class="flex justify-between items-center text-xs">
                  <span class="text-[10px] font-extrabold uppercase px-3 py-1 rounded-full bg-amber-200/70 text-amber-950 border border-amber-300/60">${inf.kategori || 'Umum'}</span>
                  <span class="text-slate-600 text-[11px] font-medium flex items-center gap-1">
                    <i data-lucide="calendar" class="w-3 h-3 text-amber-800"></i> ${formatDateIndo(inf.tanggal)}
                  </span>
                </div>
                <h4 class="font-bold text-slate-800 text-base leading-snug group-hover:text-emerald-800 transition-colors line-clamp-2">${inf.judul}</h4>
                <p class="text-xs text-slate-700 line-clamp-5 leading-relaxed">${stripHtml(inf.isi || inf.deskripsi || '')}</p>
              </div>
              <div class="pt-4 mt-4 border-t border-amber-200/60 flex items-center justify-between text-xs font-semibold text-emerald-800">
                <span>Baca Pengumuman</span>
                <i data-lucide="arrow-right" class="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform"></i>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- BERITA & ARTIKEL (Max 5 Baris) -->
      <div class="space-y-5">
        <div class="flex justify-between items-end">
          <div>
            <span class="text-[10px] font-extrabold uppercase tracking-wider text-amber-700">Kabar Kampus</span>
            <h3 class="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2">
              <i data-lucide="newspaper" class="w-6 h-6 text-emerald-700"></i> Berita & Artikel Terbaru
            </h3>
          </div>
          <button onclick="navigate('/berita')" class="text-xs text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 group">
            <span>Lihat Semua</span>
            <i data-lucide="arrow-right" class="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform"></i>
          </button>
        </div>

        <div class="grid md:grid-cols-3 gap-6">
          ${getLatestData(globalData.Berita).slice(0, 3).map(b => `
            <div onclick="navigate('/berita/${slugify(b.judul)}')" class="group bg-amber-100/40 rounded-3xl shadow-sm hover:shadow-xl overflow-hidden border border-amber-200/80 cursor-pointer hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between">
              <div>
                <div class="relative overflow-hidden h-48 bg-amber-200/40">
                  <img src="${b.gambar || 'https://via.placeholder.com/600x400'}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="${b.judul}">
                  <div class="absolute top-3 left-3 bg-slate-900/70 backdrop-blur-md text-white text-[10px] font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
                    <i data-lucide="calendar" class="w-3 h-3 text-amber-400"></i> ${formatDateIndo(b.tanggal)}
                  </div>
                </div>
                <div class="p-5 space-y-2">
                  <h4 class="font-bold text-slate-800 text-base leading-snug group-hover:text-emerald-800 transition-colors line-clamp-2">${b.judul}</h4>
                  <p class="text-xs text-slate-700 line-clamp-5 leading-relaxed">${stripHtml(b.konten || b.isi || b.deskripsi || '')}</p>
                </div>
              </div>
              <div class="px-5 pb-5 pt-0 flex items-center justify-between text-xs font-semibold text-emerald-800">
                <span>Baca Selengkapnya</span>
                <i data-lucide="arrow-right" class="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform"></i>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- GALERI FOTO & DOKUMEN -->
      <div class="grid lg:grid-cols-3 gap-8">
        <div class="lg:col-span-2 space-y-5">
          <div class="flex justify-between items-end">
            <div>
              <span class="text-[10px] font-extrabold uppercase tracking-wider text-amber-700">Dokumentasi</span>
              <h3 class="text-xl font-bold text-slate-800 flex items-center gap-2">
                <i data-lucide="image" class="w-5 h-5 text-emerald-700"></i> Galeri Kegiatan
              </h3>
            </div>
            <button onclick="navigate('/galeri')" class="text-xs text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 group">
              <span>Semua Galeri</span>
              <i data-lucide="arrow-right" class="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform"></i>
            </button>
          </div>

          <div class="grid sm:grid-cols-3 gap-4">
            ${getLatestData(globalData.Galeri).slice(0, 3).map(g => {
              const imgUrl = g.url || g.gambar || g.url_gambar || g.foto || g.link_gambar || '';
              const fallbackUrl = 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?q=80&w=600&auto=format&fit=crop';
              return `
                <div class="group bg-amber-100/40 rounded-2xl overflow-hidden shadow-sm border border-amber-200/80 hover:shadow-lg transition-all duration-300">
                  <div class="relative overflow-hidden h-40 bg-amber-200/40">
                    <img src="${imgUrl || fallbackUrl}" onerror="this.onerror=null; this.src='${fallbackUrl}';" class="w-full h-full object-cover group-hover:scale-110 transition duration-500" alt="${g.judul || g.keterangan || 'Galeri'}">
                  </div>
                  <div class="p-3 bg-amber-100/70">
                    <p class="font-bold text-slate-800 text-xs truncate">${g.judul || g.keterangan || 'Kegiatan Ma\'had'}</p>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- DOKUMEN / BERKAS TERBARU -->
        <div class="space-y-5">
          <div class="flex justify-between items-end">
            <div>
              <span class="text-[10px] font-extrabold uppercase tracking-wider text-amber-700">Layanan Layanan</span>
              <h3 class="text-xl font-bold text-slate-800 flex items-center gap-2">
                <i data-lucide="file-down" class="w-5 h-5 text-emerald-700"></i> Berkas & Dokumen
              </h3>
            </div>
            <button onclick="navigate('/download')" class="text-xs text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 group">
              <span>Semua</span>
              <i data-lucide="arrow-right" class="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform"></i>
            </button>
          </div>

          <div class="space-y-3">
            ${getLatestData(globalData.Download).slice(0, 3).map(d => `
              <div class="bg-amber-100/40 rounded-2xl p-4 border border-amber-200/80 shadow-sm hover:shadow-md transition flex items-center justify-between gap-3 group">
                <div class="min-w-0 space-y-0.5">
                  <h4 class="font-bold text-xs text-slate-800 truncate group-hover:text-emerald-800 transition-colors">${d.nama_file || 'Berkas Dokumen'}</h4>
                  <p class="text-[11px] text-slate-600 line-clamp-2">${stripHtml(d.deskripsi || 'Dokumen Resmi')}</p>
                </div>
                <a href="${d.url_file || '#'}" target="_blank" class="shrink-0 bg-amber-200/80 text-emerald-950 hover:bg-emerald-700 hover:text-white p-2.5 rounded-xl transition duration-200 text-xs font-semibold flex items-center justify-center border border-amber-300/50">
                  <i data-lucide="download" class="w-4 h-4"></i>
                </a>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

    </div>
  `;

  if (window.lucide) lucide.createIcons();
}

function renderProfilView() {
  const items = globalData.Profil || [];

  // Filter items: pisahkan Sejarah, Visi, dan Misi untuk digabung ke dalam 1 Card Premium
  const mainKeys = ['sejarah', 'visi', 'misi'];
  const mainItems = items.filter(p => {
    const text = ((p.judul || '') + ' ' + (p.tipe || '')).toLowerCase();
    return mainKeys.some(key => text.includes(key));
  });

  // Urutkan agar urutannya: Sejarah -> Visi -> Misi
  mainItems.sort((a, b) => {
    const textA = ((a.judul || '') + ' ' + (a.tipe || '')).toLowerCase();
    const textB = ((b.judul || '') + ' ' + (b.tipe || '')).toLowerCase();
    const getOrder = (t) => t.includes('sejarah') ? 1 : t.includes('visi') ? 2 : 3;
    return getOrder(textA) - getOrder(textB);
  });

  // Item profil lainnya (Struktur, Sambutan, dll)
  const otherItems = items.filter(p => !mainItems.includes(p));

  const getProfileIcon = (title = '', type = '') => {
    const text = (title + ' ' + type).toLowerCase();
    if (text.includes('sejarah')) return 'history';
    if (text.includes('visi')) return 'compass';
    if (text.includes('misi')) return 'target';
    if (text.includes('struktur')) return 'users';
    if (text.includes('sambutan')) return 'quote';
    return 'award';
  };

  document.getElementById('main-content').innerHTML = `
    <div class="space-y-8 max-w-7xl mx-auto px-1 sm:px-0">
      
      <!-- HERO BANNER -->
      <div class="relative bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-800 rounded-3xl p-6 md:p-10 text-white shadow-2xl overflow-hidden border border-emerald-700/30">
        <div class="relative z-10 space-y-3 max-w-2xl">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-semibold backdrop-blur-md">
            <i data-lucide="shield-check" class="w-3.5 h-3.5"></i> Profil Resmi Institusi
          </div>
          <h2 class="text-2xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Profil <span class="text-amber-400">Lembaga</span>
          </h2>
          <p class="text-xs md:text-sm text-emerald-100/80 leading-relaxed">
            Mengenal lebih dekat visi, misi, rekam jejak sejarah, serta tatanan struktur organisasi Ma'had Aly Sultan Abul Mafakhir.
          </p>
        </div>
      </div>

      ${items.length === 0 ? `
        <div class="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm text-slate-400">
          <i data-lucide="book-open" class="w-12 h-12 mx-auto mb-3 stroke-1 text-slate-300"></i>
          <p class="text-sm">Belum ada informasi profil yang tersedia saat ini.</p>
        </div>
      ` : `
        
        <!-- MAIN PREMIUM CARD: SEJARAH, VISI & MISI -->
        ${mainItems.length > 0 ? `
          <div class="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden relative">
            <div class="h-2 bg-gradient-to-r from-amber-400 via-emerald-600 to-emerald-800"></div>

            <div class="p-6 md:p-10 divide-y divide-slate-100 space-y-8 md:space-y-10">
              ${mainItems.map((item, idx) => {
                const title = item.judul || 'Informasi';
                const type = item.tipe || 'PROFIL';
                const content = item.isi || '';
                const iconName = getProfileIcon(title, type);
                const slug = slugify(title);

                return `
                  <div class="${idx !== 0 ? 'pt-8 md:pt-10' : ''} space-y-4">
                    <!-- Section Header dengan Judul yang dapat diklik -->
                    <div class="flex items-center justify-between flex-wrap gap-3">
                      <div class="flex items-center gap-3 group cursor-pointer" onclick="navigate('/profil/${slug}')">
                        <div class="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center shadow-sm shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                          <i data-lucide="${iconName}" class="w-5 h-5"></i>
                        </div>
                        <div>
                          <span class="text-[10px] font-extrabold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/60 inline-block mb-1">
                            ${type}
                          </span>
                          <h3 class="text-xl md:text-2xl font-bold text-slate-800 group-hover:text-emerald-700 transition-colors leading-snug">
                            ${title}
                          </h3>
                        </div>
                      </div>

                      <button onclick="navigate('/profil/${slug}')" class="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-900 transition-colors cursor-pointer bg-emerald-50 hover:bg-emerald-100/70 px-3.5 py-2 rounded-xl">
                        <span>Detail Lengkap</span>
                        <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
                      </button>
                    </div>

                    <!-- Section Content -->
                    <div class="text-xs md:text-sm text-slate-600 leading-relaxed whitespace-pre-line pl-0 md:pl-13">
                      ${content}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>

            <!-- Card Footer -->
            <div class="bg-slate-50/80 px-6 md:px-10 py-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
              <span class="flex items-center gap-1.5 font-medium">
                <i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-500"></i> Informasi Dokumen Resmi Lembaga
              </span>
              <span class="font-mono text-[11px]">Ma'had Aly Sultan Abul Mafakhir</span>
            </div>
          </div>
        ` : ''}

        <!-- OTHER PROFILE ITEMS GRID (Struktur Organisasi, Sambutan, dll) -->
        ${otherItems.length > 0 ? `
          <div class="pt-4 space-y-4">
            <h3 class="text-lg font-bold text-slate-800 flex items-center gap-2">
              <i data-lucide="layers" class="w-5 h-5 text-emerald-700"></i> Informasi Profil Lainnya
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              ${otherItems.map(p => {
                const title = p.judul || 'Profil Lembaga';
                const type = p.tipe || 'INFORMASI';
                const content = p.isi || '';
                const iconName = getProfileIcon(title, type);
                const slug = slugify(title);

                return `
                  <div class="group bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between relative overflow-hidden">
                    <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-emerald-600 to-emerald-800 opacity-80 group-hover:opacity-100 transition-opacity"></div>
                    <div>
                      <div class="flex items-center justify-between mb-5">
                        <span class="text-[10px] font-extrabold tracking-wider uppercase px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200/60">${type}</span>
                        <div class="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shadow-sm">
                          <i data-lucide="${iconName}" class="w-5 h-5"></i>
                        </div>
                      </div>
                      <!-- Judul yang dapat diklik -->
                      <h3 onclick="navigate('/profil/${slug}')" class="text-lg font-bold text-slate-800 hover:text-emerald-700 transition-colors leading-snug mb-3 cursor-pointer">
                        ${title}
                      </h3>
                      <div class="text-xs md:text-sm text-slate-500 leading-relaxed line-clamp-4 whitespace-pre-line mb-6">${content}</div>
                    </div>
                    <div class="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <span class="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                        <i data-lucide="check-circle-2" class="w-3.5 h-3.5 text-emerald-500"></i> Resmi
                      </span>
                      <button onclick="navigate('/profil/${slug}')" class="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-900 group-hover:translate-x-0.5 transition-all cursor-pointer">
                        <span>Baca Selengkapnya</span>
                        <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
                      </button>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        ` : ''}

      `}
    </div>
  `;

  if (typeof lucide !== 'undefined' && lucide.createIcons) {
    lucide.createIcons();
  }
}

function renderStrukturAkademikView() {
  const container = document.getElementById('main-content');
  if (!container) return;

  const rawData = globalData['Struktur Akademik'] || globalData['StrukturAkademik'] || [];

  if (!rawData || rawData.length === 0) {
    container.innerHTML = `
      <div class="max-w-4xl mx-auto my-8">
        <button onclick="navigate('/profil')" class="text-xs font-semibold text-emerald-700 flex items-center gap-1 hover:underline mb-4">
          <i data-lucide="arrow-left" class="w-4 h-4"></i> Kembali ke Profil
        </button>
        <div class="text-center py-16 bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
          <div class="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-200/50">
            <i data-lucide="network" class="w-8 h-8"></i>
          </div>
          <h3 class="text-lg font-bold text-slate-800">Data Struktur Akademik Belum Tersedia</h3>
          <p class="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Informasi mengenai susunan pimpinan dan civitas akademika sedang diperbarui oleh administrator.
          </p>
        </div>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  // Normalisasi data & urutkan berdasarkan kolom urutan
  const items = rawData.map(item => ({
    nama: item.nama || item.Nama || 'Pengurus Akademik',
    jabatan: item.jabatan || item.Jabatan || 'Staf / Pengampu',
    foto: item.foto || item.Foto || '',
    nidn: item.nidn || item.NIDN || item.nip || '',
    keterangan: item.keterangan || item.Keterangan || '',
    urutan: Number(item.urutan || item.Urutan || 99)
  })).sort((a, b) => a.urutan - b.urutan);

  const topLeader = items[0];
  const subordinates = items.slice(1);
  const fallbackAvatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80';

  // Card Generator untuk Bagan (Tambahkan atribut onclick & cursor-pointer)
  const createNodeCard = (person, isTop = false, index = 0) => {
    const jsonString = JSON.stringify(person).replace(/"/g, '&quot;');
    return `
      <div class="relative flex flex-col items-center group">
        <div 
          onclick="openProfileModal(${jsonString})"
          class="w-64 md:w-72 bg-white rounded-2xl border-2 ${isTop ? 'border-amber-400 shadow-xl' : 'border-emerald-700/30 shadow-md'} hover:shadow-2xl hover:border-amber-500 transition-all duration-300 overflow-hidden relative z-10 cursor-pointer transform hover:-translate-y-1"
        >
          <div class="h-2 ${isTop ? 'bg-gradient-to-r from-amber-400 via-emerald-600 to-amber-500' : 'bg-emerald-800'}"></div>
          <div class="p-5 text-center flex flex-col items-center">
            <div class="relative mb-3">
              <div class="w-20 h-20 rounded-full p-1 ${isTop ? 'bg-gradient-to-tr from-amber-400 to-emerald-700' : 'bg-emerald-100'} shadow-md">
                <img 
                  src="${person.foto || fallbackAvatar}" 
                  alt="${person.nama}" 
                  class="w-full h-full object-cover rounded-full bg-slate-100 border border-white"
                  onerror="this.onerror=null; this.src='${fallbackAvatar}';"
                />
              </div>
              ${isTop ? `
                <span class="absolute -bottom-1 -right-1 bg-amber-400 text-slate-900 p-1 rounded-full shadow border border-white">
                  <i data-lucide="crown" class="w-3.5 h-3.5"></i>
                </span>
              ` : ''}
            </div>

            <span class="inline-block px-3 py-0.5 rounded-full ${isTop ? 'bg-amber-100 text-amber-900 font-extrabold' : 'bg-emerald-50 text-emerald-800 font-bold'} text-[10px] tracking-wider uppercase mb-1 border border-amber-200">
              ${person.jabatan}
            </span>

            <h4 class="font-bold text-slate-800 text-sm md:text-base leading-snug group-hover:text-emerald-800 transition">
              ${person.nama}
            </h4>

            ${person.nidn ? `<p class="text-[10px] text-slate-400 font-mono mt-1">NIDN: ${person.nidn}</p>` : ''}
            
            <span class="text-[10px] font-semibold text-emerald-600 mt-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <i data-lucide="maximize-2" class="w-3 h-3"></i> Klik untuk detail
            </span>
          </div>
        </div>
      </div>
    `;
  };

  container.innerHTML = `
    <div class="max-w-6xl mx-auto space-y-8 pb-12">
      <!-- Header -->
      <div>
        <button onclick="navigate('/profil')" class="text-xs font-semibold text-emerald-700 flex items-center gap-1 hover:underline mb-3">
          <i data-lucide="arrow-left" class="w-4 h-4"></i> Kembali ke Profil Lembaga
        </button>
        <div class="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-200 pb-5 gap-4">
          <div>
            <span class="text-xs font-bold text-amber-600 uppercase tracking-widest">Bagan Organisasi</span>
            <h1 class="text-2xl md:text-4xl font-extrabold text-slate-900 tracking-tight mt-1">
              Struktur Akademik & Pengelola
            </h1>
          </div>
          <p class="text-xs text-slate-500 max-w-md">
            Klik pada salah satu kartu pengurus untuk melihat detail profil dan foto ukuran penuh.
          </p>
        </div>
      </div>

      <!-- Container Bagan Struktur -->
      <div class="bg-slate-50/60 border border-slate-200/80 rounded-3xl p-6 md:p-12 overflow-x-auto">
        <div class="min-w-[650px] flex flex-col items-center">
          
          <!-- LEVEL 1: Pimpinan Utama -->
          <div class="flex justify-center">
            ${createNodeCard(topLeader, true, 0)}
          </div>

          ${subordinates.length > 0 ? `
            <div class="w-0.5 h-8 bg-emerald-700/60"></div>

            <div class="relative w-full max-w-3xl flex items-center justify-center">
              <div class="w-full h-0.5 bg-emerald-700/60"></div>
            </div>

            <!-- LEVEL 2: Pengurus / Subordinat -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-0 w-full pt-4">
              ${subordinates.map((sub, idx) => `
                <div class="flex flex-col items-center relative">
                  <div class="w-0.5 h-4 bg-emerald-700/60 -mt-4 mb-2"></div>
                  ${createNodeCard(sub, false, idx + 1)}
                </div>
              `).join('')}
            </div>
          ` : ''}

        </div>
      </div>
    </div>

    <!-- Modal Lightbox Profil -->
    <div id="profile-modal" class="fixed inset-0 z-50 hidden bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100 transform transition-all relative">
        
        <!-- Tombol Tutup -->
        <button onclick="closeProfileModal()" class="absolute top-3 right-3 z-10 bg-slate-900/50 hover:bg-slate-900 text-white rounded-full p-2 transition">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>

        <!-- Container Foto Penuh -->
        <div class="w-full h-80 bg-slate-900 relative">
          <img id="modal-img" src="" alt="" class="w-full h-full object-contain" />
        </div>

        <!-- Detail Informasi -->
        <div class="p-6 text-center space-y-3">
          <span id="modal-jabatan" class="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-wider"></span>
          <h3 id="modal-nama" class="text-xl font-extrabold text-slate-900 leading-snug"></h3>
          <p id="modal-nidn" class="text-xs text-slate-400 font-mono"></p>
          <p id="modal-ket" class="text-xs text-slate-600 leading-relaxed pt-2 border-t border-slate-100 hidden"></p>
        </div>
      </div>
    </div>
  `;

  if (window.lucide) lucide.createIcons();
}

function openProfileModal(person) {
  const modal = document.getElementById('profile-modal');
  if (!modal) return;

  const fallbackAvatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80';
  
  const img = document.getElementById('modal-img');
  const nama = document.getElementById('modal-nama');
  const jabatan = document.getElementById('modal-jabatan');
  const nidn = document.getElementById('modal-nidn');
  const ket = document.getElementById('modal-ket');

  img.src = person.foto || fallbackAvatar;
  img.onerror = () => { img.src = fallbackAvatar; };
  nama.innerText = person.nama;
  jabatan.innerText = person.jabatan;
  
  if (person.nidn) {
    nidn.innerText = `NIDN / NIP: ${person.nidn}`;
    nidn.classList.remove('hidden');
  } else {
    nidn.classList.add('hidden');
  }

  if (person.keterangan) {
    ket.innerText = person.keterangan;
    ket.classList.remove('hidden');
  } else {
    ket.classList.add('hidden');
  }

  modal.classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

function closeProfileModal() {
  const modal = document.getElementById('profile-modal');
  if (modal) modal.classList.add('hidden');
}

function renderInformasiView() {
  const items = globalData.Informasi || [];

  document.getElementById('main-content').innerHTML = `
    <div class="space-y-8 max-w-7xl mx-auto px-1 sm:px-0">
      <!-- Hero Banner -->
      <div class="relative bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-800 rounded-3xl p-6 md:p-10 text-white shadow-2xl overflow-hidden border border-emerald-700/30">
        <div class="relative z-10 space-y-3 max-w-2xl">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-semibold backdrop-blur-md">
            <i data-lucide="megaphone" class="w-3.5 h-3.5"></i> Pusat Pengumuman
          </div>
          <h2 class="text-2xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Pengumuman & <span class="text-amber-400">Informasi</span>
          </h2>
          <p class="text-xs md:text-sm text-emerald-100/80 leading-relaxed">
            Dapatkan berita terkini, pengumuman akademik, serta edaran resmi lingkungan Ma'had Aly Sultan Abul Mafakhir.
          </p>
        </div>
      </div>

      <!-- Grid Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        ${items.length === 0 ? `
          <div class="col-span-full bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm text-slate-400">
            <i data-lucide="bell-off" class="w-12 h-12 mx-auto mb-3 stroke-1 text-slate-300"></i>
            <p class="text-sm">Belum ada informasi atau pengumuman saat ini.</p>
          </div>
        ` : items.map(inf => {
          const formattedDate = inf.tanggal ? new Date(inf.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Terbaru';
          
          return `
            <div onclick="navigate('/informasi/${slugify(inf.judul)}')" class="group bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between relative overflow-hidden cursor-pointer">
              <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-emerald-600 to-emerald-800 opacity-80 group-hover:opacity-100 transition-opacity"></div>
              <div>
                <div class="flex items-center justify-between mb-4">
                  <span class="text-[10px] font-extrabold tracking-wider uppercase px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200/60">
                    ${inf.kategori || 'Umum'}
                  </span>
                  <span class="text-xs font-medium text-slate-400 flex items-center gap-1">
                    <i data-lucide="calendar" class="w-3.5 h-3.5 text-emerald-600"></i> ${formattedDate}
                  </span>
                </div>
                <h3 class="text-lg font-bold text-slate-800 group-hover:text-emerald-700 transition-colors leading-snug mb-3">${inf.judul}</h3>
                <p class="text-xs md:text-sm text-slate-500 leading-relaxed line-clamp-3 mb-6">${inf.isi}</p>
              </div>
              <div class="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span class="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                  <i data-lucide="check-circle-2" class="w-3.5 h-3.5 text-emerald-500"></i> Terverifikasi
                </span>
                <span class="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 group-hover:text-emerald-900 group-hover:translate-x-0.5 transition-all">
                  <span>Lihat Detail</span>
                  <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
                </span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function renderProdiView() {
  const items = globalData.Prodi || [];

  document.getElementById('main-content').innerHTML = `
    <div class="space-y-8 max-w-7xl mx-auto px-1 sm:px-0">
      <!-- Hero Banner -->
      <div class="relative bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-800 rounded-3xl p-6 md:p-10 text-white shadow-2xl overflow-hidden border border-emerald-700/30">
        <div class="relative z-10 space-y-3 max-w-2xl">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-semibold backdrop-blur-md">
            <i data-lucide="graduation-cap" class="w-3.5 h-3.5"></i> Pendidikan Tinggi Keagamaan
          </div>
          <h2 class="text-2xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Program <span class="text-amber-400">Studi</span>
          </h2>
          <p class="text-xs md:text-sm text-emerald-100/80 leading-relaxed">
            Pilihan konsentrasi keilmuan Islam bertaraf keahlian tinggi (Tafaqquh Fiddin) yang dirancang untuk mencetak mutafaqqih fi ad-din.
          </p>
        </div>
      </div>

      <!-- Grid Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        ${items.length === 0 ? `
          <div class="col-span-full bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm text-slate-400">
            <i data-lucide="book-open" class="w-12 h-12 mx-auto mb-3 stroke-1 text-slate-300"></i>
            <p class="text-sm">Belum ada program studi yang ditampilkan.</p>
          </div>
        ` : items.map(p => `
          <div onclick="navigate('/prodi/${slugify(p.nama_prodi)}')" class="group bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between relative overflow-hidden cursor-pointer">
            <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-emerald-600 to-emerald-800 opacity-80 group-hover:opacity-100 transition-opacity"></div>
            <div>
              <div class="flex items-center justify-between mb-5">
                <span class="text-[10px] font-extrabold tracking-wider uppercase px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center gap-1">
                  <i data-lucide="award" class="w-3 h-3 text-emerald-600"></i> Akreditasi: ${p.akreditasi || 'Baik'}
                </span>
                <div class="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-all duration-300 shadow-sm">
                  <i data-lucide="book-marked" class="w-5 h-5"></i>
                </div>
              </div>
              <h3 class="text-xl font-extrabold text-slate-800 group-hover:text-emerald-700 transition-colors leading-snug mb-2">${p.nama_prodi}</h3>
              <div class="inline-block text-xs font-semibold text-emerald-800 bg-emerald-50/80 px-2.5 py-1 rounded-lg mb-4">
                Gelar: ${p.gelar || '-'}
              </div>
              <p class="text-xs md:text-sm text-slate-500 leading-relaxed line-clamp-3 mb-6">${p.deskripsi}</p>
            </div>
            <div class="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span class="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                <i data-lucide="check-circle-2" class="w-3.5 h-3.5 text-emerald-500"></i> Kurikulum Resmi
              </span>
              <span class="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 group-hover:text-emerald-900 group-hover:translate-x-0.5 transition-all">
                <span>Detail Program</span>
                <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
              </span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderBeritaView() {
  const items = globalData.Berita || [];

  document.getElementById('main-content').innerHTML = `
    <div class="space-y-8 max-w-7xl mx-auto px-1 sm:px-0">
      <!-- Hero Banner -->
      <div class="relative bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-800 rounded-3xl p-6 md:p-10 text-white shadow-2xl overflow-hidden border border-emerald-700/30">
        <div class="relative z-10 space-y-3 max-w-2xl">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-semibold backdrop-blur-md">
            <i data-lucide="newspaper" class="w-3.5 h-3.5"></i> Kabar & Artikel
          </div>
          <h2 class="text-2xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Berita <span class="text-amber-400">Terbaru</span>
          </h2>
          <p class="text-xs md:text-sm text-emerald-100/80 leading-relaxed">
            Ikuti wawasan keislaman, liputan kegiatan santri, dan berita perkembangan Ma'had Aly Sultan Abul Mafakhir.
          </p>
        </div>
      </div>

      <!-- Grid Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        ${items.length === 0 ? `
          <div class="col-span-full bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm text-slate-400">
            <i data-lucide="file-text" class="w-12 h-12 mx-auto mb-3 stroke-1 text-slate-300"></i>
            <p class="text-sm">Belum ada berita yang diterbitkan saat ini.</p>
          </div>
        ` : items.map(b => {
          const formattedDate = b.tanggal ? new Date(b.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '';
          
          return `
            <div onclick="navigate('/berita/${slugify(b.judul)}')" class="group bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between cursor-pointer">
              <div>
                <div class="relative h-48 overflow-hidden bg-slate-100">
                  <img src="${b.gambar || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?q=80&w=600&auto=format&fit=crop'}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="${b.judul}">
                  <div class="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
                  <span class="absolute bottom-3 left-3 text-[10px] font-semibold text-white/90 bg-slate-900/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20">
                    ${b.penulis || 'Admin'}
                  </span>
                </div>
                <div class="p-6">
                  <div class="text-[11px] font-medium text-slate-400 mb-2 flex items-center gap-1">
                    <i data-lucide="calendar" class="w-3 h-3 text-emerald-600"></i> ${formattedDate}
                  </div>
                  <h3 class="font-bold text-slate-800 text-base leading-snug group-hover:text-emerald-700 transition-colors line-clamp-2 mb-2">${b.judul}</h3>
                  <p class="text-xs text-slate-500 leading-relaxed line-clamp-3">${b.konten}</p>
                </div>
              </div>
              <div class="p-6 pt-0 border-t border-slate-100/50 mt-4 flex items-center justify-between">
                <span class="text-xs font-semibold text-emerald-700 group-hover:text-emerald-900 flex items-center gap-1">
                  <span>Baca Artikel</span>
                  <i data-lucide="arrow-right" class="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform"></i>
                </span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function renderGaleriView() {
  const items = globalData.Galeri || [];
  
  document.getElementById('main-content').innerHTML = `
    <div class="space-y-8 max-w-7xl mx-auto px-1 sm:px-0">
      <!-- Hero Banner Premium -->
      <div class="relative bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-800 rounded-3xl p-6 md:p-10 text-white shadow-2xl overflow-hidden border border-emerald-700/30">
        <div class="relative z-10 space-y-3 max-w-2xl">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-semibold backdrop-blur-md">
            <i data-lucide="camera" class="w-3.5 h-3.5"></i> Dokumentasi Visual
          </div>
          <h2 class="text-2xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Galeri <span class="text-amber-400">Kegiatan</span>
          </h2>
          <p class="text-xs md:text-sm text-emerald-100/80 leading-relaxed">
            Arsip foto dan momen kegiatan belajar-mengajar, fasilitas kampus, serta acara rutin di Ma'had Aly Sultan Abul Mafakhir.
          </p>
        </div>
      </div>

      <!-- Grid Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        ${items.length === 0 ? `
          <div class="col-span-full bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm text-slate-400">
            <i data-lucide="image-off" class="w-12 h-12 mx-auto mb-3 stroke-1 text-slate-300"></i>
            <p class="text-sm">Belum ada dokumentasi foto yang diunggah saat ini.</p>
          </div>
        ` : items.map((g, idx) => {
          const imgUrl = g.url || g.gambar || g.url_gambar || g.foto || g.link_gambar || '';
          const fallbackUrl = 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?q=80&w=600&auto=format&fit=crop';
          const kategori = g.kategori || g.tag || 'Kegiatan';

          return `
            <div onclick="openGalleryLightbox(${idx})" class="group bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between cursor-pointer relative">
              <div class="relative overflow-hidden h-56 bg-slate-100">
                <span class="absolute top-3 left-3 z-10 bg-emerald-950/80 backdrop-blur-md text-amber-300 text-[10px] font-bold px-3 py-1 rounded-full border border-emerald-700/50 shadow-md">
                  ${kategori}
                </span>
                <img src="${imgUrl || fallbackUrl}" onerror="this.onerror=null; this.src='${fallbackUrl}';" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="${g.judul || g.keterangan || 'Galeri'}">
                <div class="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <span class="bg-amber-400 text-slate-900 p-3 rounded-2xl shadow-xl transform scale-75 group-hover:scale-100 transition-transform duration-300">
                    <i data-lucide="zoom-in" class="w-5 h-5"></i>
                  </span>
                </div>
              </div>
              <div class="p-4 bg-white">
                <p class="font-bold text-slate-800 text-sm truncate group-hover:text-emerald-700 transition-colors">${g.judul || g.keterangan || 'Kegiatan Ma\'had'}</p>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <!-- MODAL LIGHTBOX FOTO -->
    <div id="gallery-lightbox" class="fixed inset-0 z-50 bg-black/95 hidden backdrop-blur-md flex flex-col justify-between p-4 md:p-6 select-none">
      <div class="flex justify-between items-center text-white z-10 gap-4">
        <div class="flex items-center gap-2 min-w-0">
          <span id="lightbox-category" class="bg-amber-500 text-slate-900 text-[11px] font-bold px-3 py-1 rounded-full shrink-0"></span>
          <p id="lightbox-title" class="text-sm md:text-base font-semibold truncate"></p>
        </div>
        <button onclick="closeGalleryLightbox()" class="bg-white/10 hover:bg-white/20 p-2 rounded-full text-white transition shrink-0 cursor-pointer">
          <i data-lucide="x" class="w-6 h-6"></i>
        </button>
      </div>

      <div class="relative flex-1 flex items-center justify-center my-4 overflow-hidden">
        <button onclick="changeGalleryImage(-1)" class="absolute left-2 md:left-6 z-10 bg-black/50 hover:bg-black/80 text-white p-3 rounded-full backdrop-blur border border-white/10 transition cursor-pointer">
          <i data-lucide="chevron-left" class="w-6 h-6"></i>
        </button>

        <img id="lightbox-img" class="max-h-full max-w-full object-contain rounded-lg shadow-2xl transition-transform duration-300 cursor-zoom-in" onclick="toggleZoomImage(this)" alt="Full View">

        <button onclick="changeGalleryImage(1)" class="absolute right-2 md:left-auto md:right-6 z-10 bg-black/50 hover:bg-black/80 text-white p-3 rounded-full backdrop-blur border border-white/10 transition cursor-pointer">
          <i data-lucide="chevron-right" class="w-6 h-6"></i>
        </button>
      </div>

      <div class="text-center text-white/70 text-xs font-mono z-10">
        <span id="lightbox-counter"></span> • Klik gambar untuk Perbesar / Perkecil
      </div>
    </div>
  `;
}

/* Lightbox Controls */
function openGalleryLightbox(index) {
  const items = globalData.Galeri || [];
  if (!items.length) return;
  
  currentImageIndex = index;
  updateLightboxContent();
  
  const lightbox = document.getElementById('gallery-lightbox');
  if (lightbox) {
    lightbox.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
}

function closeGalleryLightbox() {
  const lightbox = document.getElementById('gallery-lightbox');
  if (lightbox) {
    lightbox.classList.add('hidden');
    document.body.style.overflow = 'auto';
  }
  
  const img = document.getElementById('lightbox-img');
  if (img) {
    img.classList.remove('scale-150', 'cursor-zoom-out');
    img.classList.add('cursor-zoom-in');
  }
}

function changeGalleryImage(direction) {
  const items = globalData.Galeri || [];
  currentImageIndex += direction;

  if (currentImageIndex < 0) {
    currentImageIndex = items.length - 1;
  } else if (currentImageIndex >= items.length) {
    currentImageIndex = 0;
  }

  const img = document.getElementById('lightbox-img');
  if (img) {
    img.classList.remove('scale-150', 'cursor-zoom-out');
    img.classList.add('cursor-zoom-in');
  }

  updateLightboxContent();
}

function updateLightboxContent() {
  const items = globalData.Galeri || [];
  const item = items[currentImageIndex];
  if (!item) return;

  const imgUrl = item.url || item.gambar || item.url_gambar || item.foto || item.link_gambar || '';
  const fallbackUrl = 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?q=80&w=600&auto=format&fit=crop';
  const kategori = item.kategori || item.tag || 'Kegiatan';

  document.getElementById('lightbox-img').src = imgUrl || fallbackUrl;
  document.getElementById('lightbox-title').innerText = item.judul || item.keterangan || 'Dokumentasi Galeri';
  document.getElementById('lightbox-category').innerText = kategori;
  document.getElementById('lightbox-counter').innerText = `${currentImageIndex + 1} dari ${items.length}`;
}

function toggleZoomImage(img) {
  if (img.classList.contains('scale-150')) {
    img.classList.remove('scale-150', 'cursor-zoom-out');
    img.classList.add('cursor-zoom-in');
  } else {
    img.classList.add('scale-150', 'cursor-zoom-out');
    img.classList.remove('cursor-zoom-in');
  }
}

document.addEventListener('keydown', (e) => {
  const lightbox = document.getElementById('gallery-lightbox');
  if (lightbox && !lightbox.classList.contains('hidden')) {
    if (e.key === 'ArrowLeft') changeGalleryImage(-1);
    if (e.key === 'ArrowRight') changeGalleryImage(1);
    if (e.key === 'Escape') closeGalleryLightbox();
  }
});

function renderDownloadView() {
  const items = globalData.Download || [];

  document.getElementById('main-content').innerHTML = `
    <div class="space-y-6 max-w-7xl mx-auto px-1 sm:px-0">
      <div class="bg-gradient-to-r from-emerald-900 via-emerald-800 to-brand-green rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div class="relative z-10 space-y-2">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-700/50 backdrop-blur border border-emerald-500/30 text-emerald-200 text-xs font-semibold">
            <i data-lucide="folder-open" class="w-3.5 h-3.5"></i> Repository Akademis
          </div>
          <h2 class="text-2xl md:text-3xl font-extrabold tracking-tight">Pusat Unduhan Berkas</h2>
          <p class="text-xs md:text-sm text-emerald-100/90 max-w-xl leading-relaxed">
            Akses dan unduh dokumen resmi, panduan akademik, serta formulir pendaftaran Ma'had Aly secara langsung.
          </p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${items.length === 0 ? `
          <div class="col-span-full bg-white rounded-2xl p-12 text-center border border-slate-100 text-slate-400">
            <i data-lucide="folder-search" class="w-12 h-12 mx-auto mb-3 stroke-1"></i>
            <p class="text-sm">Belum ada dokumen yang tersedia saat ini.</p>
          </div>
        ` : items.map(d => {
          const fileUrl = d.url_file || d.url || d.link || '#';
          const fileName = d.nama_file || d.judul || 'Berkas Dokumen';
          const fileDesc = d.deskripsi || d.kategori || 'Dokumen Resmi';
          const fileSize = d.ukuran || d.size || '';

          return `
            <div class="bg-white rounded-2xl p-4 md:p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between gap-3 group">
              <div class="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
                <div class="w-11 h-11 md:w-12 md:h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shadow-sm">
                  <i data-lucide="file-down" class="w-5 h-5 md:w-6 md:h-6"></i>
                </div>
                <div class="min-w-0 flex-1">
                  <h3 class="font-bold text-slate-800 text-xs md:text-sm leading-snug break-words group-hover:text-emerald-700 transition-colors line-clamp-2">${fileName}</h3>
                  <div class="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mt-1">
                    <span class="truncate max-w-[140px]">${fileDesc}</span>
                    ${fileSize ? `<span class="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-mono text-[10px] font-semibold shrink-0">${fileSize}</span>` : ''}
                  </div>
                </div>
              </div>

              <a href="${fileUrl}" target="_blank" rel="noopener noreferrer" class="shrink-0 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-3.5 py-2.5 md:px-4 md:py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-emerald-700/20">
                <i data-lucide="download" class="w-4 h-4"></i>
                <span class="text-xs font-semibold">Unduh</span>
              </a>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function renderDetailPage(section, slug) {
  const container = document.getElementById('main-content');
  if (!container) return;

  if (section === 'berita') {
    const item = (globalData.Berita || []).find(b => slugify(b.judul) === slug);
    if (!item) { renderNotFound(); return; }

    container.innerHTML = `
      <div class="max-w-4xl mx-auto space-y-6">
        <button onclick="navigate('/berita')" class="text-xs font-semibold text-brand-green flex items-center gap-1 hover:underline mb-2">
          <i data-lucide="arrow-left" class="w-4 h-4"></i> Kembali ke Berita
        </button>
        <img src="${item.gambar || 'https://via.placeholder.com/800x400'}" class="w-full h-72 md:h-96 object-cover rounded-2xl shadow-lg" alt="${item.judul}">
        <div class="space-y-2">
          <div class="text-xs text-slate-400 font-medium">${item.tanggal ? new Date(item.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : ''} • Oleh ${item.penulis || 'Admin'}</div>
          <h1 class="text-2xl md:text-4xl font-extrabold text-slate-900 leading-tight">${item.judul}</h1>
        </div>
        <div class="prose max-w-none text-slate-700 leading-relaxed whitespace-pre-line text-sm md:text-base border-t pt-6">
          ${item.konten}
        </div>
      </div>
    `;
  }
  else if (section === 'prodi') {
    const item = (globalData.Prodi || []).find(p => slugify(p.nama_prodi) === slug);
    if (!item) { renderNotFound(); return; }

    container.innerHTML = `
      <div class="max-w-4xl mx-auto space-y-6 bg-white p-8 rounded-2xl shadow-md border border-slate-100">
        <button onclick="navigate('/prodi')" class="text-xs font-semibold text-brand-green flex items-center gap-1 hover:underline mb-2">
          <i data-lucide="arrow-left" class="w-4 h-4"></i> Kembali ke Program Studi
        </button>
        <div class="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
          <div>
            <h1 class="text-3xl font-extrabold text-brand-green">${item.nama_prodi}</h1>
            <p class="text-sm text-slate-500 mt-1">Gelar Lulusan: <b>${item.gelar}</b></p>
          </div>
          <span class="bg-brand-yellow text-slate-900 font-bold px-4 py-1.5 rounded-full text-xs">Akreditasi: ${item.akreditasi || 'Baik'}</span>
        </div>
        <div class="space-y-4 text-slate-700 leading-relaxed text-sm md:text-base">
          <h3 class="font-bold text-lg text-slate-800">Deskripsi & Kurikulum Program Studi</h3>
          <p class="whitespace-pre-line">${item.deskripsi}</p>
        </div>
        <div class="pt-6 border-t flex justify-end">
          <button onclick="navigate('/pmb')" class="bg-brand-green text-white font-bold px-6 py-2.5 rounded-lg shadow hover:bg-emerald-800 transition">Daftar Sekarang</button>
        </div>
      </div>
    `;
  }
  else if (section === 'informasi') {
    const item = (globalData.Informasi || []).find(inf => slugify(inf.judul) === slug);
    if (!item) { renderNotFound(); return; }

    container.innerHTML = `
      <div class="max-w-3xl mx-auto space-y-6 bg-white p-8 rounded-2xl shadow-md border border-slate-100">
        <button onclick="navigate('/informasi')" class="text-xs font-semibold text-brand-green flex items-center gap-1 hover:underline mb-2">
          <i data-lucide="arrow-left" class="w-4 h-4"></i> Kembali ke Pengumuman
        </button>
        <div class="flex justify-between items-center text-xs">
          <span class="bg-amber-100 text-amber-800 px-3 py-1 rounded-full font-bold">${item.kategori || 'Umum'}</span>
          <span class="text-slate-400">${item.tanggal ? new Date(item.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : ''}</span>
        </div>
        <h1 class="text-2xl md:text-3xl font-bold text-slate-900 leading-snug">${item.judul}</h1>
        <div class="text-slate-700 leading-relaxed whitespace-pre-line text-sm md:text-base border-t pt-4">
          ${item.isi}
        </div>
      </div>
    `;
  }
  else if (section === 'profil') {
    const item = (globalData.Profil || []).find(p => {
      const title = p.judul || p.kategori || p.nama || '';
      return slugify(title) === slug;
    });

    if (!item) { renderNotFound(); return; }

    const title = item.judul || item.kategori || item.nama || 'Profil Lembaga';
    const category = item.kategori || item.jenis || 'INFORMASI';
    const content = item.isi || item.deskripsi || item.keterangan || '';

    container.innerHTML = `
      <div class="max-w-4xl mx-auto space-y-6">
        <button onclick="navigate('/profil')" class="text-xs font-semibold text-emerald-700 flex items-center gap-1 hover:underline mb-2">
          <i data-lucide="arrow-left" class="w-4 h-4"></i> Kembali ke Profil Lembaga
        </button>

        <div class="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
          <div class="bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-800 p-8 md:p-10 text-white relative">
            <div class="relative z-10 space-y-3">
              <span class="text-[10px] font-extrabold tracking-wider uppercase px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 backdrop-blur-sm">
                ${category}
              </span>
              <h1 class="text-2xl md:text-4xl font-extrabold text-white leading-tight">${title}</h1>
              <p class="text-xs text-emerald-200/80 flex items-center gap-1.5 pt-1">
                <i data-lucide="shield-check" class="w-4 h-4 text-amber-400"></i> Dokumen Resmi Ma'had Aly Sultan Abul Mafakhir
              </p>
            </div>
          </div>

          <div class="p-6 md:p-10 text-slate-700 leading-relaxed whitespace-pre-line text-sm md:text-base border-t border-slate-100">
            ${content}
          </div>

          <div class="px-6 md:px-10 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>Ma'had Aly Sultan Abul Mafakhir</span>
            <button onclick="navigate('/profil')" class="font-bold text-emerald-700 hover:text-emerald-900">
              Lihat Profil Lainnya &rarr;
            </button>
          </div>
        </div>
      </div>
    `;
  } 
  else {
    renderNotFound();
  }
}

function renderNotFound() {
  document.getElementById('main-content').innerHTML = `
    <div class="text-center py-16 space-y-4">
      <h2 class="text-4xl font-extrabold text-slate-400">404</h2>
      <p class="text-slate-600">Halaman atau konten yang Anda cari tidak ditemukan.</p>
      <button onclick="navigate('/beranda')" class="bg-brand-green text-white px-5 py-2 rounded-lg font-bold text-xs">Kembali ke Beranda</button>
    </div>
  `;
}

/* ==========================================
   FORM REGISTRASI PMB & PROCESSOR
   ========================================== */

function renderPMBForm() {
  return `
    <div class="max-w-6xl mx-auto bg-white rounded-3xl shadow-2xl border border-slate-200/80 p-6 md:p-12 space-y-8 my-4">
      <div class="border-b border-slate-200 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span class="bg-emerald-100 text-brand-green font-bold text-xs px-3 py-1 rounded-full uppercase tracking-wider">PMB Tahun Akademik 2026/2027</span>
          <h2 class="text-3xl md:text-4xl font-black text-slate-800 mt-2">Formulir Registrasi Mahasantri Baru</h2>
          <p class="text-sm text-slate-500 mt-1">Lengkapi data diri secara akurat. Kartu Bukti Pendaftaran akan dicetak secara otomatis setelah data berhasil dikirim.</p>
        </div>
        <div class="w-16 h-16 bg-brand-green/10 text-brand-green rounded-2xl flex items-center justify-center flex-shrink-0">
          <i data-lucide="file-check-2" class="w-8 h-8"></i>
        </div>
      </div>

      <form onsubmit="handlePMBSubmit(event)" class="grid md:grid-cols-2 gap-6 text-xs font-semibold">
        <div class="md:col-span-2 space-y-2">
          <label class="text-slate-700 font-bold text-sm">Nama Lengkap (Sesuai Ijazah)*</label>
          <input type="text" id="pmb-nama" required class="w-full border border-slate-300 rounded-xl p-3 text-sm uppercase focus:ring-2 focus:ring-brand-green outline-none bg-slate-50/50">
        </div>

        <div class="space-y-2">
          <label class="text-slate-700 font-bold text-sm">Jenis Kelamin*</label>
          <select id="pmb-jk" required class="w-full border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-green outline-none bg-slate-50/50">
            <option value="Laki-laki">Laki-laki</option>
            <option value="Perempuan">Perempuan</option>
          </select>
        </div>

        <div class="space-y-2">
          <label class="text-slate-700 font-bold text-sm">NIK (Nomor Induk Kependudukan)*</label>
          <input type="number" id="pmb-nik" required class="w-full border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-green outline-none bg-slate-50/50" placeholder="16 Digit NIK">
        </div>

        <div class="space-y-2">
          <label class="text-slate-700 font-bold text-sm">NISN (10 Digit)*</label>
          <input type="text" id="pmb-nisn" maxlength="10" pattern="\\d{10}" required class="w-full border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-green outline-none bg-slate-50/50" placeholder="10 Digit NISN">
        </div>

        <div class="space-y-2">
          <label class="text-slate-700 font-bold text-sm">Tempat Lahir*</label>
          <input type="text" id="pmb-tmpt-lahir" required class="w-full border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-green outline-none bg-slate-50/50">
        </div>

        <div class="space-y-2">
          <label class="text-slate-700 font-bold text-sm">Tanggal Lahir*</label>
          <input type="date" id="pmb-tgl-lahir" required class="w-full border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-green outline-none bg-slate-50/50">
        </div>

        <div class="space-y-2">
          <label class="text-slate-700 font-bold text-sm">No. Handphone / WhatsApp (Diawali 0)*</label>
          <input type="tel" id="pmb-hp" pattern="0\\d+" required class="w-full border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-green outline-none bg-slate-50/50" placeholder="08123456789">
        </div>

        <div class="md:col-span-2 space-y-2">
          <label class="text-slate-700 font-bold text-sm">Alamat Lengkap (Kp, RT/RW, Desa, Kec, Kab, Prov)*</label>
          <textarea id="pmb-alamat" required class="w-full border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-green outline-none h-24 bg-slate-50/50"></textarea>
        </div>

        <div class="space-y-2">
          <label class="text-slate-700 font-bold text-sm">Asal Sekolah*</label>
          <input type="text" id="pmb-sekolah" placeholder="SMA / MA / SMK..." required class="w-full border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-green outline-none bg-slate-50/50">
        </div>

        <div class="space-y-2">
          <label class="text-slate-700 font-bold text-sm">Tahun Lulus*</label>
          <input type="number" id="pmb-thn-lulus" placeholder="2025" required class="w-full border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-green outline-none bg-slate-50/50">
        </div>

        <div class="space-y-2">
          <label class="text-slate-700 font-bold text-sm">Asal Pesantren*</label>
          <input type="text" id="pmb-pesantren" placeholder="Nama Pesantren..." required class="w-full border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-green outline-none bg-slate-50/50">
        </div>

        <div class="space-y-2">
          <label class="text-slate-700 font-bold text-sm">Tahun Masuk Pesantren*</label>
          <input type="number" id="pmb-thn-masuk-p" placeholder="2021" required class="w-full border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-green outline-none bg-slate-50/50">
        </div>

        <div class="space-y-2">
          <label class="text-slate-700 font-bold text-sm">Tahun Keluar Pesantren (Kosongkan jika masih)*</label>
          <input type="number" id="pmb-thn-keluar-p" placeholder="2025" class="w-full border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-green outline-none bg-slate-50/50">
        </div>

        <div class="space-y-2">
          <label class="text-slate-700 font-bold text-sm">Pilihan Program Studi*</label>
          <select id="pmb-prodi" required class="w-full border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-green outline-none bg-slate-50/50">
            <option value="Fikih dan Ushul Fikih">Fikih dan Ushul Fikih</option>
            <option value="Hadits dan Ilmu Hadits">Hadits dan Ilmu Hadits</option>
          </select>
        </div>

        <div class="md:col-span-2 border-t border-slate-200 pt-6 space-y-4">
          <h4 class="text-base font-extrabold text-slate-800">Unggah Berkas Persyaratan (JPG/PNG/PDF)</h4>
          <div class="grid md:grid-cols-2 gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <div class="space-y-1"><label class="text-slate-700">Pas Foto Profil*</label><input type="file" id="file-foto" accept="image/*" required class="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-brand-green file:text-white hover:file:bg-emerald-800 cursor-pointer"></div>
            <div class="space-y-1"><label class="text-slate-700">KTP / Kartu Identitas*</label><input type="file" id="file-ktp" required class="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-brand-green file:text-white hover:file:bg-emerald-800 cursor-pointer"></div>
            <div class="space-y-1"><label class="text-slate-700">Kartu Keluarga (KK)*</label><input type="file" id="file-kk" required class="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-brand-green file:text-white hover:file:bg-emerald-800 cursor-pointer"></div>
            <div class="space-y-1"><label class="text-slate-700">Ijazah Terakhir*</label><input type="file" id="file-ijazah" required class="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-brand-green file:text-white hover:file:bg-emerald-800 cursor-pointer"></div>
            <div class="md:col-span-2 space-y-1"><label class="text-slate-700">Transkrip Nilai / SKHUN*</label><input type="file" id="file-skhun" required class="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-brand-green file:text-white hover:file:bg-emerald-800 cursor-pointer"></div>
          </div>
        </div>

        <div class="md:col-span-2 pt-4">
          <button type="submit" id="btn-submit-pmb" class="w-full bg-brand-green text-white font-extrabold text-base py-4 rounded-xl hover:bg-emerald-800 transition shadow-xl flex items-center justify-center gap-2">
            <i data-lucide="send" class="w-5 h-5 text-brand-yellow"></i> Kirim Registrasi PMB & Dapatkan Kartu
          </button>
        </div>
      </form>
    </div>
  `;
}

// Fungsi Helper Pembaca Base64 Khusus PDF / Berkas Non-Gambar
function fileToBase64(file) {
  return new Promise((resolve) => {
    if (!file) return resolve("");
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
}

// Fungsi Kompresi Berkas (Otomatis memisahkan PDF dan Gambar)
function processFileBase64(file, maxWidth = 800, quality = 0.6) {
  return new Promise((resolve) => {
    if (!file) return resolve("");

    // JIKA BERKAS PDF: Lakukan pembacaan Base64 langsung tanpa kompresi Canvas
    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      fileToBase64(file).then((base64) => resolve(base64));
      return;
    }

    // JIKA BERKAS GAMBAR: Jalankan proses kompresi via Canvas
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve("");
    };
    reader.onerror = () => resolve("");
  });
} 

async function handlePMBSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-submit-pmb');
  
  const fotoFile = document.getElementById('file-foto')?.files[0];
  const ktpFile = document.getElementById('file-ktp')?.files[0];
  const kkFile = document.getElementById('file-kk')?.files[0];
  const ijazahFile = document.getElementById('file-ijazah')?.files[0];
  const skhunFile = document.getElementById('file-skhun')?.files[0];

  if (!fotoFile) {
    alert("Harap unggah pasfoto terlebih dahulu!");
    return;
  }

  btn.innerHTML = `<i data-lucide="loader-2" class="w-5 h-5 animate-spin inline mr-2"></i> Mengompresi File & Memproses...`;
  btn.disabled = true;
  if (window.lucide) lucide.createIcons();

  try {
    const [fotoBase64, ktpBase64, kkBase64, ijazahBase64, skhunBase64] = await Promise.all([
      processFileBase64(fotoFile, 600, 0.7),
      processFileBase64(ktpFile, 800, 0.6),
      processFileBase64(kkFile, 800, 0.6),
      processFileBase64(ijazahFile, 800, 0.6),
      processFileBase64(skhunFile, 800, 0.6)
    ]);

    btn.innerHTML = `<i data-lucide="loader-2" class="w-5 h-5 animate-spin inline mr-2"></i> Mengirim Data...`;
    if (window.lucide) lucide.createIcons();

    const formDataObj = {
      nama_lengkap: document.getElementById('pmb-nama').value,
      jenis_kelamin: document.getElementById('pmb-jk').value,
      nik: document.getElementById('pmb-nik').value,
      nisn: document.getElementById('pmb-nisn').value,
      tempat_lahir: document.getElementById('pmb-tmpt-lahir').value,
      tanggal_lahir: document.getElementById('pmb-tgl-lahir').value,
      no_hp: document.getElementById('pmb-hp').value,
      alamat: document.getElementById('pmb-alamat').value,
      asal_sekolah: document.getElementById('pmb-sekolah').value,
      tahun_lulus: document.getElementById('pmb-thn-lulus').value,
      asal_pesantren: document.getElementById('pmb-pesantren').value,
      tahun_masuk_pesantren: document.getElementById('pmb-thn-masuk-p').value,
      tahun_keluar_pesantren: document.getElementById('pmb-thn-keluar-p').value,
      prodi_pilihan: document.getElementById('pmb-prodi').value,
      foto_profil: fotoBase64,
      ktp: ktpBase64,
      kk: kkBase64,
      ijazah: ijazahBase64,
      skhun: skhunBase64
    };

    const payload = {
      action: "submitPMB",
      ...formDataObj
    };

    const res = await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    const json = await res.json();

    if (json.status === "success") {
      const noReg = json.noReg || ("PMB-" + Date.now().toString().slice(-6));
      renderSuccessAndRegistrationCard(noReg, formDataObj, fotoBase64);
    } else {
      alert("Gagal: " + json.message);
      btn.innerText = "Kirim Registrasi PMB & Dapatkan Kartu";
      btn.disabled = false;
    }
  } catch (err) {
    alert("Terjadi kesalahan koneksi atau saat pengolahan file.");
    console.error(err);
    btn.innerText = "Kirim Registrasi PMB & Dapatkan Kartu";
    btn.disabled = false;
  }
}

function renderSuccessAndRegistrationCard(noReg, data, fotoDataUrl) {
  const container = document.getElementById('main-content');
  const siteName = globalData.Setting?.site_name || "MA'HAD ALY SULTAN ABUL MAFAKHIR";
  const address = globalData.Setting?.address || "Kp. Cempaka Rt. 06 Rw. 01 Ds. Kresek, Tangerang - Banten";
  const logoUrl = globalData.Setting?.logo || "https://lh3.googleusercontent.com/d/1xnFvU-jN1X7t-PaJ3DcmUlRqoGYPEluj";
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(noReg)}`;

  container.innerHTML = `
    <div class="max-w-xl mx-auto space-y-5 my-6 px-3">
      <div class="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center space-y-2 shadow-sm">
        <div class="w-12 h-12 bg-[#006432] text-white rounded-full flex items-center justify-center mx-auto shadow">
          <i data-lucide="check-circle-2" class="w-6 h-6"></i>
        </div>
        <h2 class="text-xl font-bold text-emerald-900">Pendaftaran Berhasil!</h2>
        <p class="text-xs text-emerald-700">Kartu Bukti Pendaftaran Anda telah diterbitkan di bawah ini. Silahkan cetak atau unduh sebagai bukti pendaftaran resmi.</p>
      </div>

      <!-- KARTU PMB UTAMA -->
      <div id="pmb-card" class="bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-emerald-800 relative">
        <div class="bg-emerald-800 text-white p-4 flex items-center justify-between border-b-4 border-amber-400">
          <img src="${logoUrl}" class="w-12 h-12 bg-white rounded-full p-1" alt="Logo">
          <div class="text-center px-2">
            <h3 class="font-extrabold text-xs md:text-sm tracking-wide uppercase">${siteName}</h3>
            <p class="text-[10px] text-amber-300 font-semibold">KARTU BUKTI PENDAFTARAN PMB</p>
            <p class="text-[8px] text-emerald-100">${address}</p>
          </div>
          <img src="${qrCodeUrl}" class="w-12 h-12 bg-white p-1 rounded" alt="QR">
        </div>

        <div class="p-5 space-y-4 text-xs text-slate-800">
          <div class="flex justify-between items-center bg-slate-100 p-2.5 rounded-lg border border-slate-200">
            <div>
              <span class="text-[10px] text-slate-500 uppercase font-bold block">Nomor Registrasi</span>
              <span class="text-base font-extrabold text-emerald-800 tracking-wider">${noReg}</span>
            </div>
            <div class="text-right">
              <span class="text-[10px] text-slate-500 uppercase font-bold block">Program Studi</span>
              <span class="font-bold text-slate-800">${data.prodi_pilihan}</span>
            </div>
          </div>

          <div class="flex gap-4 items-start">
            <div class="w-28 h-36 rounded-lg border-2 border-slate-200 overflow-hidden shrink-0 bg-slate-100">
              <img src="${fotoDataUrl}" class="w-full h-full object-cover" alt="Foto Santri">
            </div>
            <div class="flex-1 space-y-1.5 text-[11px]">
              <div><span class="text-slate-400 block text-[9px]">NAMA LENGKAP</span><span class="font-bold text-slate-900 uppercase">${data.nama_lengkap}</span></div>
              <div><span class="text-slate-400 block text-[9px]">NIK / NISN</span><span class="font-semibold">${data.nik} / ${data.nisn}</span></div>
              <div><span class="text-slate-400 block text-[9px]">TTL</span><span class="font-semibold">${data.tempat_lahir}, ${data.tanggal_lahir}</span></div>
              <div><span class="text-slate-400 block text-[9px]">NO HP / WA</span><span class="font-semibold">${data.no_hp}</span></div>
              <div><span class="text-slate-400 block text-[9px]">ASAL SEKOLAH / PESANTREN</span><span class="font-semibold">${data.asal_sekolah} / ${data.asal_pesantren}</span></div>
            </div>
          </div>
        </div>

        <div class="bg-slate-50 px-5 py-2.5 border-t text-[9px] text-slate-500 flex justify-between items-center">
          <span>Dicetak Otomatis oleh Sistem PMB Online</span>
          <span>Status: <b class="text-emerald-700">Terverifikasi Sistem</b></span>
        </div>
      </div>

      <div class="flex gap-3">
        <button onclick="downloadCardPDF()" class="flex-1 bg-emerald-800 hover:bg-emerald-900 text-white py-3 rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2">
          <i data-lucide="download" class="w-4 h-4"></i> Unduh Kartu PDF
        </button>
        <button onclick="navigate('/beranda')" class="bg-slate-200 hover:bg-slate-300 text-slate-700 px-5 py-3 rounded-xl font-bold text-xs transition">
          Selesai
        </button>
      </div>
    </div>
  `;

  if (window.lucide) lucide.createIcons();
}

async function downloadCardPDF() {
  const cardElem = document.getElementById('pmb-card');
  if (!cardElem) return;

  try {
    // 1. Pastikan semua gambar/QR eksternal di dalam elemen terisi & selesai dimuat
    const images = cardElem.querySelectorAll('img');
    await Promise.all(
      Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve; // Tetap jalankan jika error agar tidak menggantung
        });
      })
    );

    // 2. Render ke canvas dengan penanganan CORS & Skala Tinggi
    const canvas = await html2canvas(cardElem, {
      scale: 3,             // Tingkatkan skala agar QR & teks tajam
      useCORS: true,        // Wajib: Mengizinkan rendering gambar dari URL eksternal/CDN
      allowTaint: false,     // Menghindari canvas tercemar CORS
      logging: false
    });

    const imgData = canvas.toDataURL('image/png');
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const imgProps = pdf.getImageProperties(imgData);
    const pdfHeight = (imgProps.height * (pdfWidth - 20)) / imgProps.width;

    pdf.addImage(imgData, 'PNG', 10, 10, pdfWidth - 20, pdfHeight);
    pdf.save(`Kartu_PMB_${Date.now()}.pdf`);
  } catch (err) {
    console.error("Gagal mendownload PDF:", err);
    alert("Gagal mengunduh kartu PDF.");
  }
}

/* ==========================================
ADMIN CMS LOGIC & TABEL SPREADSHEET (UPGRADED)
========================================== */

function openAdminModal() {
  document.getElementById('admin-modal').classList.remove('hidden');
}

function closeAdminModal() {
  document.getElementById('admin-modal').classList.add('hidden');
}

async function handleAdminAuth(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-login-admin');
  const pass = document.getElementById('admin-pass-input').value;
  
  btn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin inline mr-1"></i> Memverifikasi...`;
  btn.disabled = true;
  if (window.lucide) lucide.createIcons();

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({ action: "adminLogin", password: pass })
    });
    const json = await res.json();
    
    if (json.status === "success") {
      closeAdminModal();
      document.getElementById('app').classList.add('hidden');
      document.getElementById('admin-cms').classList.remove('hidden');
      renderAdminDashboard();
      
      Swal.fire({
        icon: 'success',
        title: 'Berhasil Masuk',
        text: 'Selamat datang di Control Panel Admin.',
        timer: 2000,
        showConfirmButton: false,
        customClass: { popup: 'rounded-3xl' }
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Akses Ditolak',
        text: json.message || "Password Admin Salah!",
        confirmButtonColor: '#e11d48',
        customClass: { popup: 'rounded-3xl' }
      });
    }
  } catch (err) {
    Swal.fire({
      icon: 'error',
      title: 'Kesalahan Sistem',
      text: 'Terjadi kesalahan autentikasi.',
      confirmButtonColor: '#e11d48',
      customClass: { popup: 'rounded-3xl' }
    });
  } finally {
    btn.innerHTML = `Masuk Ke Control Panel`;
    btn.disabled = false;
  }
}

function logoutAdmin() {
  Swal.fire({
    title: 'Keluar Admin?',
    text: 'Anda akan keluar dari sesi Control Panel.',
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#047857',
    cancelButtonColor: '#64748b',
    confirmButtonText: 'Ya, Keluar',
    cancelButtonText: 'Batal',
    customClass: { popup: 'rounded-3xl' }
  }).then((result) => {
    if (result.isConfirmed) {
      document.getElementById('admin-cms').classList.add('hidden');
      document.getElementById('app').classList.remove('hidden');
      navigate('/beranda');
    }
  });
}

function renderAdminDashboard() {
  renderAdminSidebarMenu();
  renderAdminStats();
  renderAdminTable(activeAdminSheet);
  if (window.lucide) lucide.createIcons();
}

function renderAdminSidebarMenu() {
  const sheets = ['Profil', 'Struktur Akademik', 'Informasi', 'Prodi', 'Berita', 'Galeri', 'Download', 'FormPMB', 'Setting'];
  const menu = document.getElementById('admin-sheet-menu');
  
  if (!menu) return;

  menu.innerHTML = sheets.map(sheet => {
    let actualKey = Object.keys(globalData || {}).find(k => k.toLowerCase() === sheet.toLowerCase());
    let count = 0;
    if (actualKey && globalData[actualKey]) {
      count = Array.isArray(globalData[actualKey]) ? globalData[actualKey].length : (sheet === 'Setting' ? Object.keys(globalData.Setting || {}).length : 0);
    }
    
    return `
      <button 
        onclick="handleAdminMenuClick('${sheet}')" 
        class="w-full text-left px-3.5 py-2.5 rounded-xl transition flex items-center justify-between ${activeAdminSheet === sheet ? 'bg-brand-green text-white font-bold shadow-md' : 'hover:bg-slate-700/60 text-slate-300'}"
      >
        <span class="flex items-center gap-2 text-xs">
          <i data-lucide="file-text" class="w-4 h-4 text-brand-yellow"></i> ${sheet}
        </span>
        <span class="text-[10px] bg-slate-900/60 px-2 py-0.5 rounded-full text-slate-300 font-mono">${count}</span>
      </button>
    `;
  }).join('');

  if (window.lucide) lucide.createIcons();
}

// 1. Function Toggle Bawaan Anda (Dipertahankan)
function toggleAdminSidebar() {
  const sidebar = document.getElementById('admin-sidebar');
  if (sidebar) sidebar.classList.toggle('hidden');
}

// 2. Function Tutup Sidebar Otomatis saat Menu Diklik
function closeAdminSidebar() {
  // Hanya tutup otomatis di layar HP/Mobile (lebar layar < 768px)
  if (window.innerWidth < 768) {
    const sidebar = document.getElementById('admin-sidebar');
    if (sidebar) sidebar.classList.add('hidden');
  }
}

// 3. Wrapper Handler saat Menu Diklik
function handleAdminMenuClick(sheet) {
  if (typeof switchAdminSheet === 'function') {
    switchAdminSheet(sheet);
  } else {
    activeAdminSheet = sheet;
    renderAdminSidebarMenu();
    if (typeof renderAdminSheetView === 'function') renderAdminSheetView(sheet);
  }

  // Panggil penutup sidebar
  closeAdminSidebar();
}

function renderAdminStats() {
  let pmbKey = Object.keys(globalData).find(k => k.toLowerCase() === 'formpmb') || 'FormPMB';
  const stats = [
    { title: 'Total Mahasantri (PMB)', count: (globalData[pmbKey] || []).length, icon: 'users', color: 'bg-blue-600' },
    { title: 'Program Studi', count: (globalData.Prodi || []).length, icon: 'book-open', color: 'bg-emerald-600' },
    { title: 'Pengumuman / Info', count: (globalData.Informasi || []).length, icon: 'bell', color: 'bg-amber-500' },
    { title: 'Berita Ditayangkan', count: (globalData.Berita || []).length, icon: 'newspaper', color: 'bg-purple-600' }
  ];

  document.getElementById('admin-stats-cards').innerHTML = stats.map(s => `
    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex items-center justify-between">
      <div>
        <p class="text-xs text-slate-500 font-semibold uppercase tracking-wider">${s.title}</p>
        <h3 class="text-2xl font-black text-slate-800 mt-1">${s.count}</h3>
      </div>
      <div class="${s.color} text-white p-3.5 rounded-2xl shadow-md">
        <i data-lucide="${s.icon}" class="w-6 h-6"></i>
      </div>
    </div>
  `).join('');
}

function switchAdminSheet(sheetName) {
  activeAdminSheet = sheetName;
  renderAdminSidebarMenu();
  renderAdminTable(sheetName);
}

async function reloadAdminData() {
  await fetchWebsiteData();
  renderAdminDashboard();
}

function renderAdminTable(sheetName) {
  document.getElementById('admin-table-title').innerText = `Data Sheet: "${sheetName}"`;
  const thead = document.querySelector('#admin-data-table thead');
  const tbody = document.getElementById('admin-data-tbody');

  let actualKey = Object.keys(globalData).find(k => k.toLowerCase() === sheetName.toLowerCase());
  let rows = [];
  if (actualKey && globalData[actualKey]) {
    rows = globalData[actualKey];
  }

  if (sheetName.toLowerCase() === 'setting' && globalData.Setting) {
    rows = Object.keys(globalData.Setting).map(k => ({ Key: k, Value: globalData.Setting[k] }));
  }

  if (!Array.isArray(rows)) {
    rows = rows ? [rows] : [];
  }

  if (rows.length === 0) {
    thead.innerHTML = '';
    tbody.innerHTML = `
      <tr>
        <td colspan="100%" class="p-10 text-center text-slate-400">
          <i data-lucide="folder-open" class="w-10 h-10 mx-auto mb-2 text-slate-300"></i>
          Belum ada data pada sheet <b>"${sheetName}"</b>.<br>
          <span class="text-xs text-slate-500 mt-1 inline-block">Klik tombol <b>"Tambah Data Baru"</b> untuk menambahkan entri.</span>
        </td>
      </tr>`;
    if (window.lucide) lucide.createIcons();
    return;
  }

  const headers = Object.keys(rows[0]);

  thead.innerHTML = `
    <tr>
      <th class="p-3.5 border-b bg-slate-50 text-slate-600 text-left">No</th>
      ${headers.map(h => `<th class="p-3.5 border-b uppercase text-[11px] font-bold tracking-wider text-slate-600 bg-slate-50 text-left">${h.replace(/_/g, ' ')}</th>`).join('')}
      <th class="p-3.5 border-b text-center bg-slate-50 text-slate-600">Aksi</th>
    </tr>
  `;

  tbody.innerHTML = rows.map((row, idx) => `
    <tr class="hover:bg-slate-50/80 border-b border-slate-100 transition">
      <td class="p-3.5 font-mono text-slate-400 font-semibold text-xs">${idx + 1}</td>
      ${headers.map(h => {
        let val = row[h] !== undefined && row[h] !== null ? row[h] : '';
        
        // Pembersihan otomatis tanggal jika memuat format ISO (huruf 'T')
        if (typeof val === 'string' && val.includes('T') && !isNaN(Date.parse(val))) {
          val = val.split('T')[0];
        }

        // Pemformatan tautan berkas/link
        if (typeof val === 'string' && (val.startsWith('http://') || val.startsWith('https://'))) {
          val = `<a href="${val}" target="_blank" class="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg border border-emerald-200 hover:bg-emerald-100 text-[11px] font-bold inline-flex items-center gap-1 transition"><i data-lucide="external-link" class="w-3 h-3"></i> Lihat Berkas</a>`;
        }
        
        return `<td class="p-3.5 max-w-xs truncate text-slate-700 font-medium text-xs">${val}</td>`;
      }).join('')}
      <td class="p-3.5 text-center whitespace-nowrap space-x-1.5">
        <button onclick="openEditDataModal(${idx})" class="bg-amber-50 text-amber-700 border border-amber-200 p-2 rounded-xl hover:bg-amber-100 transition shadow-sm" title="Edit Data"><i data-lucide="edit-3" class="w-4 h-4"></i></button>
        <button onclick="deleteDataRow('${row.id || row.Key || idx}')" class="bg-rose-50 text-rose-600 border border-rose-200 p-2 rounded-xl hover:bg-rose-100 transition shadow-sm" title="Hapus Data"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
      </td>
    </tr>
  `).join('');

  if (window.lucide) lucide.createIcons();
}

function openAddDataModal() {
  currentEditingRowId = null;
  const subtitle = document.getElementById('crud-modal-subtitle');
  document.getElementById('crud-modal-title').innerText = `Tambah Data Baru (${activeAdminSheet})`;
  if (subtitle) subtitle.innerText = `Lengkapi kolom di bawah untuk menambahkan data ke sheet ${activeAdminSheet}.`;
  
  buildCrudForm({});
  document.getElementById('crud-modal').classList.remove('hidden');
}

function openEditDataModal(rowIdx) {
  let actualKey = Object.keys(globalData).find(k => k.toLowerCase() === activeAdminSheet.toLowerCase());
  let rows = (actualKey && globalData[actualKey]) ? globalData[actualKey] : [];
  if (activeAdminSheet.toLowerCase() === 'setting') {
    rows = Object.keys(globalData.Setting || {}).map(k => ({ Key: k, Value: globalData.Setting[k] }));
  }
  const rowData = rows[rowIdx];
  currentEditingRowId = rowData.id || rowData.Key;
  
  const subtitle = document.getElementById('crud-modal-subtitle');
  document.getElementById('crud-modal-title').innerText = `Edit Data (${activeAdminSheet})`;
  if (subtitle) subtitle.innerText = `Perbarui rincian data di bawah ini lalu klik simpan.`;

  buildCrudForm(rowData);
  document.getElementById('crud-modal').classList.remove('hidden');
}

function closeCrudModal() {
  document.getElementById('crud-modal').classList.add('hidden');
}

// Helper Format Ukuran Berkas Otomatis
function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Fungsi pembantu untuk menerapkan format teks di dalam Textarea
function applyTextFormat(fieldKey, command, extraVal = null) {
  const textarea = document.getElementById(`field-${fieldKey}`);
  if (!textarea) return;

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selectedText = textarea.value.substring(start, end);
  let formattedText = '';

  switch (command) {
    case 'bold':
      formattedText = `<b>${selectedText || 'Teks Tebal'}</b>`;
      break;
    case 'italic':
      formattedText = `<i>${selectedText || 'Teks Miring'}</i>`;
      break;
    case 'underline':
      formattedText = `<u>${selectedText || 'Teks Garis Bawah'}</u>`;
      break;
    case 'color':
      const colorHex = extraVal || '#000000';
      formattedText = `<span style="color: ${colorHex};">${selectedText || 'Teks Berwarna'}</span>`;
      break;
    case 'rtl':
      formattedText = `<div dir="rtl" style="text-align: right;">${selectedText || 'Teks RTL / Arab'}</div>`;
      break;
    
    // Bullets dengan Indentasi Rapi (Gantung/Hanging Indent)
    case 'unordered-list':
      if (selectedText) {
        const lines = selectedText.split('\n').filter(l => l.trim() !== '');
        formattedText = lines.map(line => {
          const cleanLine = line.replace(/^[•\-\*]\s*/, '').trim();
          return `<p style="padding-left: 1.0em; text-indent: -1.0em; margin-bottom: 0.5em;">• ${cleanLine}</p>`;
        }).join('\n');
      } else {
        formattedText = '<p style="padding-left: 1.0em; text-indent: -1.0em; margin-bottom: 0.5em;">• Poin 1</p>\n<p style="padding-left: 1.0em; text-indent: -1.0em; margin-bottom: 0.5em;">• Poin 2</p>';
      }
      break;

    // Numbering dengan Indentasi Rapi (Gantung/Hanging Indent)
    case 'ordered-list':
      if (selectedText) {
        const lines = selectedText.split('\n').filter(l => l.trim() !== '');
        formattedText = lines.map((line, idx) => {
          const cleanLine = line.replace(/^\d+\.\s*/, '').trim();
          return `<p style="padding-left: 1.0em; text-indent: -1.0em; margin-bottom: 0.5em;">${idx + 1}. ${cleanLine}</p>`;
        }).join('\n');
      } else {
        formattedText = '<p style="padding-left: 1.0em; text-indent: -1.0em; margin-bottom: 0.5em;">1. Baris 1</p>\n<p style="padding-left: 1.0em; text-indent: -1.0em; margin-bottom: 0.5em;">2. Baris 2</p>';
      }
      break;

    case 'align-left':
      formattedText = `<p style="text-align: left;">${selectedText || 'Teks Rata Kiri'}</p>`;
      break;
    case 'align-center':
      formattedText = `<p style="text-align: center;">${selectedText || 'Teks Rata Tengah'}</p>`;
      break;
    case 'align-right':
      formattedText = `<p style="text-align: right;">${selectedText || 'Teks Rata Kanan'}</p>`;
      break;
    case 'align-justify':
      formattedText = `<p style="text-align: justify;">${selectedText || 'Teks Rata Kiri Kanan'}</p>`;
      break;
    default:
      return;
  }

  // Sisipkan teks ke textarea pada posisi kursor/seleksi
  textarea.value = textarea.value.substring(0, start) + formattedText + textarea.value.substring(end);
  
  // Kembalikan fokus dan sesuaikan posisi kursor
  textarea.focus();
  textarea.setSelectionRange(start, start + formattedText.length);
}

function buildCrudForm(dataObj = {}) {
  const container = document.getElementById('crud-form-fields');
  let actualKey = Object.keys(globalData).find(k => k.toLowerCase() === activeAdminSheet.toLowerCase());
  let sampleData = (actualKey && globalData[actualKey] && globalData[actualKey][0]) ? globalData[actualKey][0] : {};
  
  if (activeAdminSheet.toLowerCase() === 'setting') {
    sampleData = { Key: '', Value: '' };
  }

  let keys = Object.keys(sampleData);
  if (keys.length === 0) {
    if (activeAdminSheet === 'Profil') sampleData = { id: '', judul: '', tipe: '', isi: '' };
    else if (activeAdminSheet === 'Struktur Akademik') sampleData = { id: '', nama: '', jabatan: '', foto: '', urutan: '', nidn: '', keterangan: '' };
    else if (activeAdminSheet === 'Informasi') sampleData = { id: '', judul: '', kategori: '', tanggal: '', isi: '' };
    else if (activeAdminSheet === 'Prodi') sampleData = { id: '', nama_prodi: '', gelar: '', akreditasi: '', deskripsi: '' };
    else if (activeAdminSheet === 'Berita') sampleData = { id: '', judul: '', tanggal: '', penulis: '', gambar: '', konten: '' };
    else if (activeAdminSheet === 'Galeri') sampleData = { id: '', judul: '', kategori: '', gambar: '' };
    else if (activeAdminSheet === 'Download') sampleData = { id: '', nama_file: '', deskripsi: '', ukuran: '', url_file: '' };
    else sampleData = { id: '', judul: '', kategori: '', tanggal: '', isi: '', status: '' };
    
    keys = Object.keys(sampleData);
  }

  // --- FIX UTAMA: Pastikan field 'id' SELALU ada saat mode Edit ---
  const hasIdKey = keys.some(k => k.toLowerCase() === 'id');
  if (currentEditingRowId && !hasIdKey) {
    keys.unshift('id'); // Sisipkan kunci 'id' di paling awal array keys
  }

  container.innerHTML = keys.map(k => {
    let val = dataObj[k] !== undefined ? dataObj[k] : '';
    const keyLower = k.toLowerCase();
    
    // Jika sedang Edit dan ini adalah field ID, paksa nilai ID lama masuk ke hidden input
    if (keyLower === 'id' && currentEditingRowId) {
      val = val || currentEditingRowId;
      return `<input type="hidden" name="${k}" id="field-${k}" value="${val}">`;
    }

    const fieldLabel = k.replace(/_/g, ' ').toUpperCase();
    const isLongText = keyLower.includes('isi') || keyLower.includes('konten') || keyLower.includes('deskripsi') || keyLower.includes('alamat');
    const isImageField = keyLower.includes('gambar') || keyLower.includes('foto') || keyLower.includes('url_gambar') || keyLower.includes('logo') || keyLower.includes('banner');
    const isFileField = keyLower.includes('url_file') || keyLower.includes('file') || keyLower.includes('berkas') || keyLower.includes('dokumen') || keyLower === 'file_path';
    const isDateField = keyLower.includes('tanggal') || keyLower.includes('date') || keyLower.includes('tgl');
    const isReadOnly = (keyLower === 'id' && currentEditingRowId);

    const colSpanClass = (isLongText || isImageField || isFileField) ? 'md:col-span-2' : 'md:col-span-1';

    let inputHtml = '';

    if (isImageField) {
      inputHtml = `
        <div class="space-y-2 bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <input type="text" name="${k}" id="field-${k}" value="${val}" placeholder="https://... atau Data Base64 Gambar" class="flex-1 border border-slate-200 rounded-xl p-3 text-xs focus:ring-2 focus:ring-brand-green outline-none bg-white font-mono">
            <label class="cursor-pointer bg-brand-green text-white hover:bg-emerald-800 px-4 py-3 rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2 shrink-0">
              <i data-lucide="upload-cloud" class="w-4 h-4"></i>
              <span>Pilih Gambar</span>
              <!-- Mengirimkan 'image' ke handleFileSelect -->
              <input type="file" accept="image/*" class="hidden" onchange="handleFileSelect(event, '${k}', 'image')">
            </label>
          </div>
          ${val ? `<div class="text-[11px] text-slate-500 truncate mt-1">URL/Data Gambar: <a href="${val}" target="_blank" class="text-emerald-700 font-medium hover:underline">${val}</a></div>` : ''}
        </div>
      `;
    } else if (isFileField) {
      inputHtml = `
        <div class="space-y-2 bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <input type="text" name="${k}" id="field-${k}" value="${val}" placeholder="https://... atau Data Base64 Berkas" class="flex-1 border border-slate-200 rounded-xl p-3 text-xs focus:ring-2 focus:ring-brand-green outline-none bg-white font-mono">
            <label class="cursor-pointer bg-brand-green text-white hover:bg-emerald-800 px-4 py-3 rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2 shrink-0">
              <i data-lucide="upload-cloud" class="w-4 h-4"></i>
              <span>Pilih Berkas</span>
              <!-- Mengirimkan 'file' ke handleFileSelect dan membuka filter untuk PDF, DOCX, XLSX, ZIP, dll -->
              <input type="file" accept=".pdf,.docx,.doc,.xlsx,.xls,.zip,.rar,.jpg,.jpeg,.png" class="hidden" onchange="handleFileSelect(event, '${k}', 'file')">
            </label>
          </div>
          ${val ? `<div class="text-[11px] text-slate-500 truncate mt-1">URL/Data Berkas: <a href="${val}" target="_blank" class="text-emerald-700 font-medium hover:underline">${val}</a></div>` : ''}
        </div>
      `;  
    } else if (isLongText) {
      inputHtml = `
        <div class="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50 focus-within:ring-2 focus-within:ring-brand-green focus-within:bg-white transition duration-200">
          <div class="flex flex-wrap items-center gap-1 p-2 bg-slate-100 border-b border-slate-200 text-slate-700">
            <button type="button" onclick="applyTextFormat('${k}', 'bold')" title="Tebal (Bold)" class="p-1.5 hover:bg-slate-200 rounded-lg transition">
              <i data-lucide="bold" class="w-4 h-4"></i>
            </button>
            <button type="button" onclick="applyTextFormat('${k}', 'italic')" title="Miring (Italic)" class="p-1.5 hover:bg-slate-200 rounded-lg transition">
              <i data-lucide="italic" class="w-4 h-4"></i>
            </button>
            <button type="button" onclick="applyTextFormat('${k}', 'underline')" title="Garis Bawah (Underline)" class="p-1.5 hover:bg-slate-200 rounded-lg transition">
              <i data-lucide="underline" class="w-4 h-4"></i>
            </button>
            
            <label class="p-1.5 hover:bg-slate-200 rounded-lg transition cursor-pointer flex items-center gap-1" title="Pilih Warna Teks">
              <i data-lucide="palette" class="w-4 h-4"></i>
              <input type="color" onchange="applyTextFormat('${k}', 'color', this.value)" class="w-4 h-4 p-0 border-0 bg-transparent cursor-pointer">
            </label>

            <div class="h-4 w-px bg-slate-300 mx-1"></div>

            <button type="button" onclick="applyTextFormat('${k}', 'unordered-list')" title="Bullets" class="p-1.5 hover:bg-slate-200 rounded-lg transition">
              <i data-lucide="list" class="w-4 h-4"></i>
            </button>
            <button type="button" onclick="applyTextFormat('${k}', 'ordered-list')" title="Penomoran" class="p-1.5 hover:bg-slate-200 rounded-lg transition">
              <i data-lucide="list-ordered" class="w-4 h-4"></i>
            </button>

            <div class="h-4 w-px bg-slate-300 mx-1"></div>

            <button type="button" onclick="applyTextFormat('${k}', 'align-left')" title="Rata Kiri" class="p-1.5 hover:bg-slate-200 rounded-lg transition">
              <i data-lucide="align-left" class="w-4 h-4"></i>
            </button>
            <button type="button" onclick="applyTextFormat('${k}', 'align-center')" title="Rata Tengah" class="p-1.5 hover:bg-slate-200 rounded-lg transition">
              <i data-lucide="align-center" class="w-4 h-4"></i>
            </button>
            <button type="button" onclick="applyTextFormat('${k}', 'align-right')" title="Rata Kanan" class="p-1.5 hover:bg-slate-200 rounded-lg transition">
              <i data-lucide="align-right" class="w-4 h-4"></i>
            </button>
            <button type="button" onclick="applyTextFormat('${k}', 'align-justify')" title="Rata Kiri-Kanan (Justify)" class="p-1.5 hover:bg-slate-200 rounded-lg transition">
              <i data-lucide="align-justify" class="w-4 h-4"></i>
            </button>

            <div class="h-4 w-px bg-slate-300 mx-1"></div>

            <button type="button" onclick="applyTextFormat('${k}', 'rtl')" title="Teks RTL (Kanan ke Kiri / Arab)" class="p-1.5 hover:bg-slate-200 rounded-lg transition font-bold text-xs">
              RTL
            </button>
          </div>
          <textarea name="${k}" id="field-${k}" rows="5" placeholder="Masukkan ${fieldLabel.toLowerCase()}..." class="w-full p-3 text-xs outline-none bg-transparent leading-relaxed resize-y border-none">${val}</textarea>
        </div>
      `;
    } else if (isDateField) {
      let formattedDate = val;
      if (typeof val === 'string' && val.includes('T')) {
        formattedDate = val.split('T')[0];
      }
      inputHtml = `<input type="date" name="${k}" id="field-${k}" value="${formattedDate}" class="w-full border border-slate-200 rounded-xl p-3 text-xs focus:ring-2 focus:ring-brand-green outline-none bg-slate-50/50">`;
    } else {
      inputHtml = `<input type="text" name="${k}" id="field-${k}" value="${val}" placeholder="Masukkan ${fieldLabel.toLowerCase()}..." ${isReadOnly ? 'readonly class="w-full border border-slate-200 rounded-xl p-3 text-xs bg-slate-100 text-slate-400 font-mono cursor-not-allowed"' : 'class="w-full border border-slate-200 rounded-xl p-3 text-xs focus:ring-2 focus:ring-brand-green outline-none bg-slate-50/50"'}>`;
    }

    return `
      <div class="space-y-1.5 ${colSpanClass}">
        <label class="block text-xs font-bold text-slate-700 tracking-wide flex items-center justify-between">
          <span>${fieldLabel}</span>
          ${isReadOnly ? '<span class="text-[9px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-mono">LOCKED</span>' : ''}
        </label>
        ${inputHtml}
      </div>
    `;
  }).join('');

  if (window.lucide) lucide.createIcons();
}

// Handler Pembacaan Berkas (Bisa membedakan Gambar dan PDF/DOCX)
function handleFileSelect(event, fieldKey, type = 'image') {
  const file = event.target.files[0];
  if (!file) return;

  // Temukan elemen input berdasarkan id="field-${k}"
  const targetInput = document.getElementById(`field-${fieldKey}`);

  // Otomatis isi kolom 'ukuran' dan 'nama_file' jika ada di dalam form
  const ukuranInput = document.querySelector('input[name="ukuran"]');
  if (ukuranInput && typeof formatFileSize === 'function') {
    ukuranInput.value = formatFileSize(file.size);
  }

  const namaFileInput = document.querySelector('input[name="nama_file"]');
  if (namaFileInput && !namaFileInput.value) {
    namaFileInput.value = file.name;
  }

  // 1. JIKA FILE ADALAH GAMBAR & DIINGINKAN KOMPRESI (Type: image)
  if (type === 'image' && file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const img = new Image();
      img.src = e.target.result;
      img.onload = function() {
        // Kompresi Canvas
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxWidth = 800;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        if (targetInput) targetInput.value = compressedBase64;
      };
    };
    reader.readAsDataURL(file);
    return;
  }

  // 2. JIKA FILE ADALAH DOKUMEN (PDF, DOCX) ATAU BERKAS LAINNYA
  const reader = new FileReader();
  reader.onload = function(e) {
    const base64Data = e.target.result;
    if (targetInput) targetInput.value = base64Data;
  };
  reader.readAsDataURL(file);
}

async function handleCrudSubmit(e) {
  e.preventDefault();
  const form = document.getElementById('crud-form');
  const formData = new FormData(form);
  const dataPayload = {};
  formData.forEach((value, key) => dataPayload[key] = value);

  const btn = document.getElementById('btn-save-crud');
  btn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin inline mr-1"></i> Menyimpan...`;
  btn.disabled = true;
  if (window.lucide) lucide.createIcons();

  try {
    const payload = {
      action: "adminCRUD",
      operation: currentEditingRowId ? "UPDATE" : "CREATE",
      sheetName: activeAdminSheet,
      data: dataPayload,
      id: currentEditingRowId
    };

    const res = await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    const json = await res.json();

    if (json.status === "success") {
      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: 'Data dan file gambar telah tersimpan.',
        confirmButtonColor: '#047857',
        customClass: { popup: 'rounded-3xl' }
      });
      closeCrudModal();
      await reloadAdminData();
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Menyimpan',
        text: json.message || 'Terjadi kesalahan saat menyimpan data.',
        confirmButtonColor: '#e11d48',
        customClass: { popup: 'rounded-3xl' }
      });
    }
  } catch (err) {
    Swal.fire({
      icon: 'error',
      title: 'Kesalahan Sistem',
      text: 'Tidak dapat terhubung ke server.',
      confirmButtonColor: '#e11d48',
      customClass: { popup: 'rounded-3xl' }
    });
  } finally {
    btn.innerHTML = `<i data-lucide="check-circle-2" class="w-4 h-4 text-brand-yellow inline mr-1"></i> Simpan Data`;
    btn.disabled = false;
    if (window.lucide) lucide.createIcons();
  }
}

async function deleteDataRow(idVal) {
  const result = await Swal.fire({
    title: 'Hapus Data Ini?',
    text: `Apakah Anda yakin ingin menghapus data dengan ID "${idVal}" dari sheet ${activeAdminSheet}? Tindakan ini tidak dapat dibatalkan.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#64748b',
    confirmButtonText: 'Ya, Hapus Data',
    cancelButtonText: 'Batal',
    customClass: { popup: 'rounded-3xl' }
  });

  if (!result.isConfirmed) return;

  try {
    const payload = {
      action: "adminCRUD",
      operation: "DELETE",
      sheetName: activeAdminSheet,
      id: idVal
    };

    const res = await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    const json = await res.json();

    if (json.status === "success") {
      Swal.fire({
        icon: 'success',
        title: 'Terhapus!',
        text: 'Data berhasil dihapus dari Spreadsheet.',
        timer: 2000,
        showConfirmButton: false,
        customClass: { popup: 'rounded-3xl' }
      });
      await reloadAdminData();
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Menghapus',
        text: json.message || 'Terjadi kesalahan saat menghapus data.',
        confirmButtonColor: '#e11d48',
        customClass: { popup: 'rounded-3xl' }
      });
    }
  } catch (err) {
    Swal.fire({
      icon: 'error',
      title: 'Kesalahan Sistem',
      text: 'Tidak dapat terhubung ke server.',
      confirmButtonColor: '#e11d48',
      customClass: { popup: 'rounded-3xl' }
    });
  }
}

// Fungsi Helper: Mengubah Link Google Drive / Dropbox menjadi Direct Download Link
function getDirectDownloadUrl(url) {
  if (!url || url === '#') return '#';
  
  // Konversi link Google Drive (view/preview/edit) ke direct download
  if (url.includes('drive.google.com')) {
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://drive.google.com/uc?export=download&id=${match[1]}`;
    }
  }
  
  // Konversi link Dropbox
  if (url.includes('dropbox.com')) {
    return url.replace('dl=0', 'dl=1');
  }

  return url;
}

// Fungsi Helper Formatting Tanggal
function formatDate(dateString) {
  if (!dateString) return '';
  
  // Jika formatnya ISO String (memiliki huruf T), ambil 10 karakter pertama (YYYY-MM-DD)
  if (typeof dateString === 'string' && dateString.includes('T')) {
    return dateString.split('T')[0];
  }
  
  return dateString;
}

// Opsi Tambahan: Jika ingin format Indonesia Rapi (Contoh: 02 Agustus 2026)
function formatDateIndo(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString; // fallback jika bukan tanggal valid
  
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
}

// Variable global untuk menyimpan instance editor
let quillEditor = null;

function initRichTextEditor(selectorId, initialContent = '') {
  // Opsi Toolbar sesuai kebutuhan kamu
  const toolbarOptions = [
    ['bold', 'italic', 'underline'],        // Tebal, Miring, Garis Bawah
    [{ 'list': 'ordered'}, { 'list': 'bullet' }], // Penomoran (Ordered & Bullet)
    [{ 'align': [] }],                     // Rata Kiri, Tengah, Kanan, Justify
    ['clean']                              // Hapus Formatting
  ];

  quillEditor = new Quill(selectorId, {
    modules: {
      toolbar: toolbarOptions
    },
    theme: 'snow',
    placeholder: 'Tuliskan isi teks di sini...'
  });

  // Isi konten awal jika sedang dalam mode Edit Data
  if (initialContent) {
    quillEditor.root.innerHTML = initialContent;
  }
}

// Fungsi untuk mengambil isi HTML dari editor saat form disimpan
function getEditorContent() {
  return quillEditor ? quillEditor.root.innerHTML : '';
}