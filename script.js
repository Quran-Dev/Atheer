// استهدف عناصر الواجهة الأساسية
const surahContainer = document.getElementById('surah-container');
const searchInput = document.getElementById('search-input');
const reciterDropdown = document.getElementById('reciter-dropdown');
const mainAudio = document.getElementById('main-audio');
const currentSurahTitle = document.getElementById('current-surah-title');
const currentReciterName = document.getElementById('current-reciter-name');
const globalLoading = document.getElementById('global-loading');

// عناصر الـ Modal
const quranModal = document.getElementById('quran-modal');
const modalSurahTitle = document.getElementById('modal-surah-title');
const basmalaContainer = document.getElementById('basmala-container');
const ayahsTextContainer = document.getElementById('ayahs-text-container');
const closeModalBtn = document.getElementById('close-modal');
const modalModeIndicator = document.getElementById('modal-mode-indicator');

// عناصر الميزات
const memorizationModeBtn = document.getElementById('memorization-mode-btn');
const autoPlayToggleBtn = document.getElementById('auto-play-toggle-btn');
const bookmarkSidebarToggle = document.getElementById('bookmark-sidebar-toggle');
const bookmarksSidebar = document.getElementById('bookmarks-sidebar');
const closeBookmarksSidebarBtn = document.getElementById('close-bookmarks-sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const bookmarksContainer = document.getElementById('bookmarks-container');
const bookmarkBadge = document.getElementById('bookmark-badge');

const floatingInfoBtn = document.getElementById('floating-info-btn');
const infoPopupModal = document.getElementById('info-popup-modal');
const closeInfoModalBtn = document.getElementById('close-info-modal');

const darkModeToggleBtn = document.getElementById('dark-mode-toggle-btn');
const darkModeIcon = document.getElementById('dark-mode-icon');

const loopSurahBtn = document.getElementById('loop-surah-btn');
const loopStatus = document.getElementById('loop-status');
const nextSurahBtn = document.getElementById('next-surah-btn');
const nextStatus = document.getElementById('next-status');
const stopAtEndBtn = document.getElementById('stop-at-end-btn');
const stopStatus = document.getElementById('stop-status');

const tafseerPopup = document.getElementById('tafseer-popup');
const tafseerPopupContent = document.getElementById('tafseer-popup-content');
const closeTafseerBtn = document.getElementById('close-tafseer-btn');

const audioProgressBar = document.getElementById('audio-progress-bar');
const currentTimeDisplay = document.getElementById('current-time-display');
const durationDisplay = document.getElementById('duration-display');

const splashScreen = document.getElementById('splash-screen');
const resumeModal = document.getElementById('resume-modal');
const lastSurahNameSpan = document.getElementById('last-surah-name');
const lastTimeTextSpan = document.getElementById('last-time-text');
const resumeYesBtn = document.getElementById('resume-yes-btn');
const resumeNoBtn = document.getElementById('resume-no-btn');

// ===== عناصر الإعدادات =====
const settingsModal = document.getElementById('settings-modal');
const settingsOverlay = document.getElementById('settings-overlay');
const settingsToggleBtn = document.getElementById('settings-toggle-btn');
const closeSettingsBtn = document.getElementById('close-settings-btn');
const settingsDarkModeToggle = document.getElementById('settings-dark-mode-toggle');
const themeOptions = document.querySelectorAll('.theme-option');
const resetPrivacyBtn = document.getElementById('reset-privacy-btn');

// ===== عناصر نافذة الخصوصية =====
const privacyModal = document.getElementById('privacy-modal');
const privacyOverlay = document.getElementById('privacy-overlay');
const privacyAcceptBtn = document.getElementById('privacy-accept');
const privacyRejectBtn = document.getElementById('privacy-reject');

// ===== أزرار الإعدادات =====
const clearBookmarksBtn = document.getElementById('clear-bookmarks-btn');
const clearCacheBtn = document.getElementById('clear-cache-btn');

// مستودعات البيانات
let allSurahs = [];
let fullQuranText = [];
let fullTafseerText = [];
let currentActiveSurahNum = null;
let currentSurahTotalAyahsCount = 0;
let currentActiveSurahName = "";

// حالات الوضعيات
let isMemorizationModeActive = false;
let isAutoPlayAudioActive = true;
let isLoopActive = false;
let isNextActive = true;
let isStopAtEnd = false;

// قائمة الآيات المثبتة
let difficultAyahsList = (() => { try { return JSON.parse(localStorage.getItem('difficultAyahsList')) || []; } catch { return []; } })();

let isTafseerOpen = false;
let currentPlaybackTime = 0;
let tafseerLoadAttempts = 0;
const MAX_TAFSEER_ATTEMPTS = 3;

// ===== تحميل التفسير =====
function loadCachedTafseer() {
    try {
        const cached = localStorage.getItem('cachedTafseer');
        if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed && parsed.length > 0) {
                fullTafseerText = parsed;
                console.log('🌷 تم تحميل التفسير من التخزين المحلي');
                return true;
            }
        }
    } catch (e) {
        console.warn('⚠️ فشل تحميل التفسير:', e);
    }
    return false;
}

function saveTafseerToCache(tafseerData) {
    try {
        localStorage.setItem('cachedTafseer', JSON.stringify(tafseerData));
        console.log('🌷 تم حفظ التفسير في التخزين المحلي');
    } catch (e) {
        console.warn('⚠️ فشل حفظ التفسير:', e);
    }
}

async function loadTafseerFromAPI() {
    try {
        console.log('🔄 محاولة تحميل التفسير من API (المحاولة ' + (tafseerLoadAttempts + 1) + ')...');
        const response = await fetch('https://api.alquran.cloud/v1/quran/ar.muyassar');
        if (response.ok) {
            const data = await response.json();
            if (data.data && data.data.surahs) {
                fullTafseerText = data.data.surahs;
                saveTafseerToCache(fullTafseerText);
                console.log('🌷 تم تحميل التفسير من API بنجاح');
                return true;
            }
        }
        throw new Error('فشل تحميل التفسير');
    } catch (error) {
        console.warn('⚠️ فشل تحميل التفسير من API:', error);
        return false;
    }
}

async function loadTafseerInBackground() {
    if (loadCachedTafseer()) return true;
    while (tafseerLoadAttempts < MAX_TAFSEER_ATTEMPTS) {
        tafseerLoadAttempts++;
        const success = await loadTafseerFromAPI();
        if (success) return true;
        if (tafseerLoadAttempts < MAX_TAFSEER_ATTEMPTS) {
            const delay = tafseerLoadAttempts * 1000;
            console.log(`⏳ إعادة المحاولة بعد ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    console.warn('⚠️ فشل تحميل التفسير، استخدام التفسير الاحتياطي');
    fullTafseerText = generateFallbackTafseer();
    return false;
}

function generateFallbackTafseer() {
    const fallback = [];
    for (let i = 1; i <= 114; i++) {
        const surahObj = { number: i, ayahs: [] };
        const surahData = fullQuranText.find(s => s.number === i);
        if (surahData) {
            surahData.ayahs.forEach(ayah => {
                surahObj.ayahs.push({
                    numberInSurah: ayah.numberInSurah,
                    text: "تفسير هذه الآية غير متوفر حالياً. يُرجى الاتصال بالإنترنت لتحميل التفسير الكامل."
                });
            });
        }
        fallback.push(surahObj);
    }
    return fallback;
}

// ===== تحسين Auto-Resume =====
const LAST_SESSION_KEY = 'lastQuranSession';
let pendingResumeData = null;
let saveSessionTimeout = null;

function saveCurrentSessionImmediate() {
    if (currentActiveSurahNum && mainAudio && !isNaN(mainAudio.currentTime) && mainAudio.currentTime > 0) {
        const sessionData = {
            surahNumber: currentActiveSurahNum,
            surahName: currentActiveSurahName,
            currentTime: mainAudio.currentTime,
            reciterUrl: reciterDropdown.value,
            reciterName: reciterDropdown.options[reciterDropdown.selectedIndex]?.text || '',
            timestamp: Date.now()
        };
        localStorage.setItem(LAST_SESSION_KEY, JSON.stringify(sessionData));
    }
}

if (mainAudio) {
    mainAudio.addEventListener('timeupdate', () => {
        if (mainAudio.currentTime > 0 && currentActiveSurahNum) {
            if (saveSessionTimeout) clearTimeout(saveSessionTimeout);
            saveSessionTimeout = setTimeout(saveCurrentSessionImmediate, 500);
        }
    });
}

window.addEventListener('beforeunload', saveCurrentSessionImmediate);

function loadLastSession() {
    const saved = localStorage.getItem(LAST_SESSION_KEY);
    if (!saved) return null;
    try { return JSON.parse(saved); } catch { return null; }
}

function showResumeModal(session) {
    if (!session) return;
    pendingResumeData = session;
    const minutes = Math.floor(session.currentTime / 60);
    const seconds = Math.floor(session.currentTime % 60);
    lastSurahNameSpan.textContent = session.surahName;
    lastTimeTextSpan.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    resumeModal.classList.remove('style-hidden');
}

function resumeLastSession() {
    if (!pendingResumeData) return;
    const session = pendingResumeData;
    
    if (reciterDropdown.value !== session.reciterUrl) {
        showToast("⚠️ تغير القارئ عن آخر جلسة، سيتم بدء التلاوة من بداية السورة");
        session.currentTime = 0;
    }
    
    if (reciterDropdown.querySelector(`option[value="${session.reciterUrl}"]`)) {
        reciterDropdown.value = session.reciterUrl;
        localStorage.setItem('preferredReciter', session.reciterUrl);
    }
    
    currentActiveSurahName = session.surahName;
    openSurahReader(session.surahNumber, session.surahName);
    playSurahAudio(session.surahNumber, session.surahName, session.currentTime);
    
    pendingResumeData = null;
    resumeModal.classList.add('style-hidden');
}

function startNewSession() {
    if (pendingResumeData) {
        localStorage.removeItem(LAST_SESSION_KEY);
        pendingResumeData = null;
    }
    resumeModal.classList.add('style-hidden');
}

if (resumeYesBtn) resumeYesBtn.addEventListener('click', resumeLastSession);
if (resumeNoBtn) resumeNoBtn.addEventListener('click', startNewSession);

// ========== تحميل تدريجي للآيات ==========
let currentAyahsBatch = [];
let currentBatchIndex = 0;
const BATCH_SIZE = 50;
let isLoadingMore = false;
let scrollListenerAttached = false;

function removeBasmala(text) {
    return text.replace(/^بِسْمِ\s+اللَّهِ\s+الرَّحْمَٰنِ\s+الرَّحِيمِ\s*/i, '')
               .replace(/^بِسْمِ\s+اللّٰهِ\s+الرَّحْمَٰنِ\s+الرَّحِيمِ\s*/i, '')
               .replace(/^بِسْمِ\s+اللَّهِ\s+الرَّحْمٰنِ\s+الرَّحِيمِ\s*/i, '')
               .replace(/^بسم\s+الله\s+الرحمن\s+الرحيم\s*/i, '')
               .trim();
}

function appendAyahToContainer(ayah, surahNumber, surahName) {
    let text = ayah.text;
    
    if (surahNumber !== 9 && ayah.numberInSurah === 1) {
        text = removeBasmala(text);
    }
    if (surahNumber === 1 && ayah.numberInSurah === 1) {
        text = removeBasmala(text);
    }

    const ayahBlock = document.createElement('span');
    const uniqueKey = `${surahNumber}_${ayah.numberInSurah}`;
    const isAlreadyBookmarked = difficultAyahsList.some(item => item.id === uniqueKey);
    const bookmarkClass = isAlreadyBookmarked ? 'fa-solid fa-bookmark bookmarked' : 'fa-regular fa-bookmark';

    ayahBlock.classList.add('ayah-block');
    ayahBlock.setAttribute('data-ayah-index', ayah.numberInSurah);
    ayahBlock.setAttribute('data-ayah-number', ayah.numberInSurah);
    ayahBlock.setAttribute('data-surah-number', surahNumber);
    
    ayahBlock.innerHTML = `
        <span class="ayah-text-content">${text}</span>
        <span class="ayah-num">﴿${ayah.numberInSurah}﴾</span>
        <i class="${bookmarkClass} ayah-bookmark-btn" title="تحتاج تثبيت"></i>
    `;

    ayahBlock.addEventListener('click', (e) => {
        if (e.target.classList.contains('ayah-bookmark-btn')) return;
        if (isMemorizationModeActive) {
            if (!ayahBlock.classList.contains('revealed')) {
                ayahBlock.classList.add('revealed');
                e.stopPropagation();
                closeTafseerPopup();
            } else {
                showTafseerPopup(surahNumber, ayah.numberInSurah, e);
            }
        } else {
            showTafseerPopup(surahNumber, ayah.numberInSurah, e);
        }
    });

    const bookmarkBtn = ayahBlock.querySelector('.ayah-bookmark-btn');
    bookmarkBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleBookmarkAyah(surahNumber, surahName, ayah.numberInSurah, text, bookmarkBtn);
    });

    ayahsTextContainer.appendChild(ayahBlock);
}

function loadMoreAyahs() {
    if (isLoadingMore) return;
    if (!currentAyahsBatch.length || currentBatchIndex >= currentAyahsBatch.length) return;
    
    isLoadingMore = true;
    const endIndex = Math.min(currentBatchIndex + BATCH_SIZE, currentAyahsBatch.length);
    
    requestAnimationFrame(() => {
        for (let i = currentBatchIndex; i < endIndex; i++) {
            appendAyahToContainer(currentAyahsBatch[i], currentActiveSurahNum, currentActiveSurahName);
        }
        currentBatchIndex = endIndex;
        isLoadingMore = false;
        
        if (currentBatchIndex >= currentAyahsBatch.length) {
            const modalBody = document.querySelector('.modal-body');
            if (modalBody && scrollListenerAttached) {
                modalBody.removeEventListener('scroll', loadMoreAyahs);
                scrollListenerAttached = false;
            }
        }
    });
}

// ========== دوال عامة ==========
function showToast(message) {
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
}

function normalizeArabic(text) {
    if (!text) return '';
    return text.replace(/[\u064B-\u0652]/g, "").replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").trim();
}

// ===== دوال الثيمات =====
function applyColorTheme(theme) {
    document.documentElement.setAttribute('data-theme-color', theme);
    localStorage.setItem('colorTheme', theme);
    if (themeOptions && themeOptions.length) {
        themeOptions.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === theme);
        });
    }
}

function applyDarkMode(isDark) {
    if (isDark) {
        document.documentElement.setAttribute('data-theme', 'dark');
        if (darkModeIcon) darkModeIcon.className = 'fa-solid fa-moon';
        if (settingsDarkModeToggle) settingsDarkModeToggle.checked = true;
        localStorage.setItem('themeMode', 'dark');
    } else {
        document.documentElement.removeAttribute('data-theme');
        if (darkModeIcon) darkModeIcon.className = 'fa-solid fa-sun';
        if (settingsDarkModeToggle) settingsDarkModeToggle.checked = false;
        localStorage.setItem('themeMode', 'light');
    }
}

function loadThemePreferences() {
    const savedColorTheme = localStorage.getItem('colorTheme') || 'navy';
    applyColorTheme(savedColorTheme);
    
    const savedDarkMode = localStorage.getItem('themeMode');
    if (savedDarkMode === 'dark') {
        applyDarkMode(true);
    } else {
        applyDarkMode(false);
    }
}

// ===== دوال الخصوصية =====
function loadGoogleAnalytics() {
    const oldScript = document.querySelector('script[src*="googletagmanager"]');
    if (oldScript) oldScript.remove();
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=G-16S1FZX64M';
    document.head.appendChild(script);
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-16S1FZX64M');
}

function showPrivacyConsent() {
    const consent = localStorage.getItem('privacyConsent');
    if (consent !== null) return;
    
    if (!privacyModal || !privacyOverlay) return;
    
    privacyModal.classList.remove('style-hidden');
    privacyOverlay.classList.remove('style-hidden');
    
    setTimeout(() => {
        privacyModal.classList.add('active');
        privacyOverlay.classList.add('active');
    }, 50);
}

function hidePrivacyModal() {
    if (privacyModal) {
        privacyModal.classList.remove('active');
        setTimeout(() => {
            privacyModal.classList.add('style-hidden');
        }, 400);
    }
    if (privacyOverlay) {
        privacyOverlay.classList.remove('active');
        setTimeout(() => {
            privacyOverlay.classList.add('style-hidden');
        }, 400);
    }
}

function resetPrivacyConsent() {
    localStorage.removeItem('privacyConsent');
    localStorage.removeItem('analyticsConsent');
    setTimeout(showPrivacyConsent, 500);
}

if (privacyAcceptBtn) {
    privacyAcceptBtn.addEventListener('click', function() {
        localStorage.setItem('privacyConsent', 'accepted');
        localStorage.setItem('analyticsConsent', 'true');
        loadGoogleAnalytics();
        hidePrivacyModal();
    });
}

if (privacyRejectBtn) {
    privacyRejectBtn.addEventListener('click', function() {
        localStorage.setItem('privacyConsent', 'rejected');
        localStorage.setItem('analyticsConsent', 'false');
        hidePrivacyModal();
    });
}

// ===== أزرار الإعدادات =====
if (clearBookmarksBtn) {
    clearBookmarksBtn.addEventListener('click', () => {
        if (difficultAyahsList.length === 0) {
            showToast("📭 لا توجد إشارات مرجعية لحذفها.");
            return;
        }
        if (confirm("⚠️ هل أنت متأكد من حذف جميع الإشارات المرجعية؟")) {
            difficultAyahsList = [];
            localStorage.setItem('difficultAyahsList', JSON.stringify(difficultAyahsList));
            updateBookmarkBadge();
            renderBookmarksList();
            showToast("🗑️ تم حذف جميع الإشارات المرجعية.");
        }
    });
}

if (clearCacheBtn) {
    clearCacheBtn.addEventListener('click', () => {
        if (confirm("⚠️ هل أنت متأكد من مسح جميع بيانات التخزين المؤقت؟ سيتم إعادة تحميل التطبيق.")) {
            const keysToRemove = [
                'difficultAyahsList',
                'LAST_SESSION_KEY',
                'lastQuranSession',
                'colorTheme',
                'themeMode',
                'preferredReciter',
                'privacyConsent',
                'analyticsConsent',
                'cachedTafseer'
            ];
            
            keysToRemove.forEach(key => {
                localStorage.removeItem(key);
            });
            
            showToast("🗑️ تم مسح التخزين المؤقت، جاري إعادة التحميل...");
            
            setTimeout(() => {
                location.reload();
            }, 1000);
        }
    });
}

// ===== إعدادات نافذة الإعدادات =====
if (settingsToggleBtn) {
    settingsToggleBtn.addEventListener('click', () => {
        if (settingsModal) settingsModal.classList.remove('style-hidden');
        if (settingsOverlay) settingsOverlay.classList.remove('style-hidden');
        const isDark = document.documentElement.hasAttribute('data-theme');
        if (settingsDarkModeToggle) settingsDarkModeToggle.checked = isDark;
    });
}

function closeSettings() {
    if (settingsModal) settingsModal.classList.add('style-hidden');
    if (settingsOverlay) settingsOverlay.classList.add('style-hidden');
}

if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', closeSettings);
if (settingsOverlay) settingsOverlay.addEventListener('click', closeSettings);

if (settingsDarkModeToggle) {
    settingsDarkModeToggle.addEventListener('change', function() {
        applyDarkMode(this.checked);
        if (this.checked && darkModeIcon) darkModeIcon.className = 'fa-solid fa-moon';
        else if (darkModeIcon) darkModeIcon.className = 'fa-solid fa-sun';
    });
}

if (themeOptions && themeOptions.length) {
    themeOptions.forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.dataset.theme;
            applyColorTheme(theme);
            themeOptions.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}

if (resetPrivacyBtn) resetPrivacyBtn.addEventListener('click', resetPrivacyConsent);

// ===== تعبئة قائمة القراء =====
function populateReciters() {
    const reciters = [
        { value: 'https://server8.mp3quran.net/afs/', name: 'مشاري بن راشد العفاسي' },
        { value: 'https://server10.mp3quran.net/minsh/', name: 'محمد الصديق المنشاوي' },
        { value: 'https://server13.mp3quran.net/husr/', name: 'محمود خليل الحصري' },
        { value: 'https://server10.mp3quran.net/jleel/', name: 'خالد الجليل' },
        { value: 'https://server6.mp3quran.net/abkr/', name: 'إدريس أبكر' },
        { value: 'https://server8.mp3quran.net/frs_a/', name: 'فارس عباد' },
        { value: 'https://server12.mp3quran.net/maher/', name: 'ماهر المعيقلي' },
        { value: 'https://server11.mp3quran.net/sds/', name: 'عبد الرحمن السديس' },
        { value: 'https://server8.mp3quran.net/lhdan/', name: 'محمد اللحيدان' },
        { value: 'https://server11.mp3quran.net/yasser/', name: 'ياسر الدوسري' },
        { value: 'https://server6.mp3quran.net/qtm/', name: 'ناصر القطامي' },
        { value: 'https://server10.mp3quran.net/ajm/', name: 'أحمد بن علي العجمي' },
        { value: 'https://server7.mp3quran.net/s_gmd/', name: 'سعد الغامدي' },
        { value: 'https://server8.mp3quran.net/bu_khtr/', name: 'صلاح بو خاطر' },
        { value: 'https://server11.mp3quran.net/shatri/', name: 'أبو بكر الشاطري' },
        { value: 'https://server7.mp3quran.net/download/basit/', name: 'عبد الباسط عبد الصمد' }


    ];
    
    reciterDropdown.innerHTML = '';
    
    reciters.forEach(reciter => {
        const option = document.createElement('option');
        option.value = reciter.value;
        option.textContent = reciter.name;
        reciterDropdown.appendChild(option);
    });
}

// ============================================================
//  📥 تحميل القرآن
// ============================================================
async function loadQuranData() {
    if (globalLoading) {
        globalLoading.classList.remove('style-hidden');
        globalLoading.style.display = 'block';
        globalLoading.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> جاري تحميل المصحف الشريف...`;
    }

    try {
        console.log('🔄 تحميل القرآن من الملف المحلي quran-uthmani.json...');
        const localResponse = await fetch('./quran-uthmani.json');
        
        if (localResponse.ok) {
            const localData = await localResponse.json();
            
            if (localData.code === 200 && localData.data && localData.data.surahs) {
                const surahs = localData.data.surahs;
                
                allSurahs = surahs.map(s => ({
                    number: s.number,
                    name: s.name.replace(/^سُورَةُ\s+|['"]/g, '').trim(),
                    englishName: s.englishName || '',
                    revelationType: s.revelationType || 'Meccan',
                    numberOfAyahs: s.ayahs.length
                }));
                
                fullQuranText = surahs;
                
                console.log('🌷 تم تحميل القرآن من الملف المحلي بنجاح');
                
                if (globalLoading) globalLoading.style.display = 'none';
                if (surahContainer) surahContainer.classList.remove('style-hidden');
                displaySurahs(allSurahs);
                
                showToast('🌷 تم تحميل المصحف من الملف المحلي');
                
                loadTafseerInBackground();
                
                return true;
            } else {
                console.warn('⚠️ بنية الملف المحلي غير صحيحة، التبديل إلى API');
            }
        } else {
            console.warn('⚠️ فشل تحميل الملف المحلي، التبديل إلى API');
        }
    } catch (error) {
        console.warn('⚠️ فشل تحميل الملف المحلي:', error);
    }

    try {
        showToast('⏳ جاري التحميل من الخادم...');
        
        const [surahsResponse, quranTextResponse] = await Promise.all([
            fetch('https://api.alquran.cloud/v1/surah'),
            fetch('https://api.alquran.cloud/v1/quran/quran-uthmani')
        ]);
        
        if (!surahsResponse.ok || !quranTextResponse.ok) {
            throw new Error('فشل تحميل البيانات من API');
        }
        
        const surahsData = await surahsResponse.json();
        const quranTextData = await quranTextResponse.json();
        
        allSurahs = surahsData.data;
        fullQuranText = quranTextData.data.surahs;
        
        console.log('🌷 تم تحميل القرآن من API بنجاح (احتياطي)');
        
        if (globalLoading) globalLoading.style.display = 'none';
        if (surahContainer) surahContainer.classList.remove('style-hidden');
        displaySurahs(allSurahs);
        
        showToast('🌷 تم تحميل المصحف من الخادم');
        return true;
        
    } catch (error) {
        console.error('❌ فشل تحميل البيانات:', error);
        showToast('⚠️ فشل تحميل البيانات، يرجى التحقق من اتصالك بالإنترنت');
        
        if (globalLoading) {
            globalLoading.style.display = 'block';
            globalLoading.innerHTML = `
                <p style="color: #e74c3c; font-size: 1.2rem;">
                    <i class="fa-solid fa-circle-exclamation"></i> 
                    حدث خطأ أثناء تحميل المصحف. يرجى التحقق من اتصالك بالإنترنت.
                </p>
                <button onclick="location.reload()" style="margin-top:20px;padding:10px 30px;border-radius:30px;border:none;background:var(--accent-color);color:#fff;font-size:1rem;cursor:pointer;">
                    إعادة المحاولة
                </button>
            `;
        }
        return false;
    }
}

// ============================================================
//  🚀 تهيئة التطبيق
// ============================================================
async function initializeApp() {
    updateBookmarkBadge();
    renderBookmarksList();
    
    populateReciters();
    
    const savedReciter = localStorage.getItem('preferredReciter');
    if (savedReciter && reciterDropdown.querySelector(`option[value="${savedReciter}"]`)) {
        reciterDropdown.value = savedReciter;
    }
    
    loadThemePreferences();

    const success = await loadQuranData();

    if (splashScreen) {
        splashScreen.classList.add('slide-out');
        setTimeout(() => {
            splashScreen.style.display = 'none';
            setTimeout(showPrivacyConsent, 500);
        }, 800);
    }

    if (success) {
        const lastSession = loadLastSession();
        if (lastSession && lastSession.timestamp && (Date.now() - lastSession.timestamp) < 24 * 60 * 60 * 1000) {
            setTimeout(() => showResumeModal(lastSession), 1500);
        }
    }
    
    setTimeout(() => {
        if (splashScreen && splashScreen.style.display !== 'none') {
            splashScreen.classList.add('slide-out');
            setTimeout(() => {
                splashScreen.style.display = 'none';
                setTimeout(showPrivacyConsent, 500);
            }, 800);
        }
    }, 8000);
}

// ===== عرض السور =====
function displaySurahs(surahs) {
    surahContainer.innerHTML = '';
    if(surahs.length === 0) {
        surahContainer.innerHTML = `<div class="global-loading">لا توجد نتائج تطابق بحثك.</div>`;
        return;
    }
    surahs.forEach(surah => {
        const card = document.createElement('div');
        card.classList.add('surah-card');
        card.addEventListener('click', () => {
            currentActiveSurahName = surah.name;
            openSurahReader(surah.number, surah.name);
            if (isAutoPlayAudioActive) {
                playSurahAudio(surah.number, surah.name);
            } else {
                currentActiveSurahNum = surah.number;
            }
        });
        card.innerHTML = `
            <div class="surah-info">
                <div class="surah-number">${surah.number}</div>
                <div>
                    <div class="surah-name">${surah.name}</div>
                    <div class="surah-type">${surah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'} - آياتها ${surah.numberOfAyahs}</div>
                </div>
            </div>
            <div class="play-icon"><i class="fa-solid fa-circle-play"></i></div>
        `;
        surahContainer.appendChild(card);
    });
}

// ===== تشغيل الصوت =====
function playSurahAudio(surahNumber, surahName, startTime = 0) {
    const reciterUrlBase = reciterDropdown.value;
    const formattedNumber = String(surahNumber).padStart(3, '0');
    mainAudio.src = `${reciterUrlBase}${formattedNumber}.mp3`;
    mainAudio.crossOrigin = 'anonymous';
    if (startTime > 0 && mainAudio.readyState >= 1) mainAudio.currentTime = startTime;
    mainAudio.play().catch(err => console.log("Audio play error:", err));
    currentSurahTitle.innerText = `سورة ${surahName}`;
    currentReciterName.innerText = `(${reciterDropdown.options[reciterDropdown.selectedIndex].text})`;
}

if (mainAudio) {
    mainAudio.onerror = function() {
        showToast("⚠️ خطأ في تحميل التلاوة. تأكد من اتصالك بالإنترنت أو جرب قارئاً آخر.");
    };
}

reciterDropdown.addEventListener('change', async () => {
    localStorage.setItem('preferredReciter', reciterDropdown.value);
    if (currentActiveSurahNum && currentActiveSurahName) {
        const wasPlaying = !mainAudio.paused;
        const savedTime = mainAudio.currentTime;
        currentPlaybackTime = (savedTime > 0 && isFinite(savedTime)) ? savedTime : 0;
        const reciterUrlBase = reciterDropdown.value;
        const formattedNumber = String(currentActiveSurahNum).padStart(3, '0');
        mainAudio.src = `${reciterUrlBase}${formattedNumber}.mp3`;
        mainAudio.crossOrigin = 'anonymous';
        const setTimeAndPlay = () => {
            if (mainAudio.readyState >= 2) {
                if (currentPlaybackTime > 0 && currentPlaybackTime < mainAudio.duration) {
                    mainAudio.currentTime = currentPlaybackTime;
                }
                if (wasPlaying && isAutoPlayAudioActive) mainAudio.play().catch(e => console.log(e));
                mainAudio.removeEventListener('loadeddata', setTimeAndPlay);
                mainAudio.removeEventListener('canplay', setTimeAndPlay);
            }
        };
        mainAudio.addEventListener('loadeddata', setTimeAndPlay);
        mainAudio.addEventListener('canplay', setTimeAndPlay);
        currentReciterName.innerText = `(${reciterDropdown.options[reciterDropdown.selectedIndex].text})`;
    }
});

// ===== فتح السورة وعرض الآيات =====
async function openSurahReader(surahNumber, surahName) {
    currentActiveSurahNum = surahNumber;
    modalSurahTitle.innerText = `سورة ${surahName}`;
    ayahsTextContainer.innerHTML = '';
    closeTafseerPopup();
    
    const oldModalBody = document.querySelector('.modal-body');
    if (oldModalBody && scrollListenerAttached) {
        oldModalBody.removeEventListener('scroll', loadMoreAyahs);
        scrollListenerAttached = false;
    }
    
    const surahData = fullQuranText.find(s => s.number === surahNumber);
    if (!surahData) {
        showToast("❌ بيانات السورة غير متوفرة");
        return;
    }
    
    currentSurahTotalAyahsCount = surahData.ayahs.length;
    basmalaContainer.style.display = (surahNumber === 9) ? 'none' : 'block';
    
    if (isMemorizationModeActive) {
        ayahsTextContainer.classList.add('memorization-active');
        modalModeIndicator.classList.remove('style-hidden');
    } else {
        ayahsTextContainer.classList.remove('memorization-active');
        modalModeIndicator.classList.add('style-hidden');
    }
    
    currentAyahsBatch = surahData.ayahs;
    currentBatchIndex = 0;
    isLoadingMore = false;
    loadMoreAyahs();
    
    const modalBody = document.querySelector('.modal-body');
    if (modalBody) {
        modalBody.addEventListener('scroll', loadMoreAyahs);
        scrollListenerAttached = true;
    }
    
    quranModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// ===== التفسير =====
function showTafseerPopup(surahNum, ayahNumInSurah, clickEvent) {
    if (isTafseerOpen) return;
    
    if (fullTafseerText.length === 0) {
        tafseerPopupContent.innerText = "جاري تحميل التفسير... يرجى الانتظار";
        const popupWidth = tafseerPopup.offsetWidth || 340;
        const popupHeight = tafseerPopup.offsetHeight || 200;
        let leftPos = clickEvent.clientX - (popupWidth / 2);
        let topPos = clickEvent.clientY + 25;
        if (leftPos < 12) leftPos = 12;
        if (leftPos + popupWidth > window.innerWidth) leftPos = window.innerWidth - popupWidth - 12;
        if (topPos + popupHeight > window.innerHeight) {
            topPos = clickEvent.clientY - popupHeight - 10;
            if (topPos < 0) topPos = 10;
        }
        tafseerPopup.style.left = `${leftPos}px`;
        tafseerPopup.style.top = `${topPos}px`;
        tafseerPopup.classList.remove('style-hidden');
        isTafseerOpen = true;
        
        if (fullTafseerText.length === 0) {
            loadTafseerInBackground().then(() => {
                if (isTafseerOpen && fullTafseerText.length > 0) {
                    const surahData = fullTafseerText.find(s => s.number === surahNum);
                    if (surahData) {
                        const ayahData = surahData.ayahs.find(a => a.numberInSurah === ayahNumInSurah);
                        tafseerPopupContent.innerText = ayahData ? ayahData.text : "لم يتم العثور على تفسير.";
                    }
                }
            });
        }
        return;
    }
    
    const surahData = fullTafseerText.find(s => s.number === surahNum);
    if (surahData) {
        const ayahData = surahData.ayahs.find(a => a.numberInSurah === ayahNumInSurah);
        tafseerPopupContent.innerText = ayahData ? ayahData.text : "لم يتم العثور على تفسير.";
    } else {
        tafseerPopupContent.innerText = "تفسير هذه السورة غير متوفر.";
    }
    
    const popupWidth = tafseerPopup.offsetWidth || 340;
    const popupHeight = tafseerPopup.offsetHeight || 200;
    let leftPos = clickEvent.clientX - (popupWidth / 2);
    let topPos = clickEvent.clientY + 25;
    if (leftPos < 12) leftPos = 12;
    if (leftPos + popupWidth > window.innerWidth) leftPos = window.innerWidth - popupWidth - 12;
    if (topPos + popupHeight > window.innerHeight) {
        topPos = clickEvent.clientY - popupHeight - 10;
        if (topPos < 0) topPos = 10;
    }
    tafseerPopup.style.left = `${leftPos}px`;
    tafseerPopup.style.top = `${topPos}px`;
    tafseerPopup.classList.remove('style-hidden');
    isTafseerOpen = true;
}

function closeTafseerPopup() {
    if(tafseerPopup) {
        tafseerPopup.classList.add('style-hidden');
        isTafseerOpen = false;
    }
}
if (closeTafseerBtn) closeTafseerBtn.addEventListener('click', (e) => { e.stopPropagation(); closeTafseerPopup(); });

// ===== الإشارات المرجعية =====
function toggleBookmarkAyah(surahNum, surahName, ayahNum, ayahText, btnElement) {
    const uniqueKey = `${surahNum}_${ayahNum}`;
    const existingIndex = difficultAyahsList.findIndex(item => item.id === uniqueKey);
    if (existingIndex > -1) {
        difficultAyahsList.splice(existingIndex, 1);
        if(btnElement) btnElement.className = 'fa-regular fa-bookmark ayah-bookmark-btn';
    } else {
        difficultAyahsList.push({ id: uniqueKey, surahNum, surahName, ayahNum, text: ayahText });
        if(btnElement) btnElement.className = 'fa-solid fa-bookmark ayah-bookmark-btn bookmarked';
    }
    localStorage.setItem('difficultAyahsList', JSON.stringify(difficultAyahsList));
    updateBookmarkBadge();
    renderBookmarksList();
}

function updateBookmarkBadge() {
    if (bookmarkBadge) bookmarkBadge.innerText = difficultAyahsList.length;
}

function renderBookmarksList() {
    if (!bookmarksContainer) return;
    bookmarksContainer.innerHTML = '';
    if (difficultAyahsList.length === 0) {
        bookmarksContainer.innerHTML = `<p class="empty-msg">لا توجد آيات مضافة حالياً.</p>`;
        return;
    }
    difficultAyahsList.sort((a,b) => a.surahNum - b.surahNum || a.ayahNum - b.ayahNum);
    difficultAyahsList.forEach(item => {
        const itemCard = document.createElement('div');
        itemCard.classList.add('bookmarked-item');
        itemCard.innerHTML = `
            <div class="bookmark-item-title">سورة ${item.surahName} - آية (${item.ayahNum})</div>
            <div class="bookmark-item-text">${item.text}</div>
            <div class="bookmark-card-actions">
                <button class="btn-sidebar-circle copy-btn" title="نسخ"><i class="fa-regular fa-copy"></i></button>
                <button class="btn-sidebar-circle delete-btn" title="حذف"><i class="fa-solid fa-trash-can"></i></button>
            </div>
        `;
        const deleteBtn = itemCard.querySelector('.delete-btn');
        const copyBtn = itemCard.querySelector('.copy-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                toggleBookmarkAyah(item.surahNum, item.surahName, item.ayahNum, item.text, null);
            });
        }
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(`قال تعالى: { ${item.text} } [سورة ${item.surahName} - آية ${item.ayahNum}]`);
                showToast("تم النسخ 📋");
            });
        }
        bookmarksContainer.appendChild(itemCard);
    });
}

// ===== البحث =====
let searchTimeout;
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const query = normalizeArabic(e.target.value);
            const filtered = allSurahs.filter(surah => {
                return normalizeArabic(surah.name).includes(query) || String(surah.number).includes(query);
            });
            displaySurahs(filtered);
        }, 150);
    });
}

// ===== أزرار الوضعيات =====
if (memorizationModeBtn) {
    memorizationModeBtn.addEventListener('click', () => {
        isMemorizationModeActive = !isMemorizationModeActive;
        closeTafseerPopup();
        if (isMemorizationModeActive) {
            memorizationModeBtn.classList.add('active');
            memorizationModeBtn.querySelector('span').innerText = "وضع التسميع الذاتي: مفعّل";
            if (ayahsTextContainer) ayahsTextContainer.classList.add('memorization-active');
            if (modalModeIndicator) modalModeIndicator.classList.remove('style-hidden');
        } else {
            memorizationModeBtn.classList.remove('active');
            memorizationModeBtn.querySelector('span').innerText = "وضع التسميع الذاتي: معطّل";
            if (ayahsTextContainer) ayahsTextContainer.classList.remove('memorization-active');
            if (modalModeIndicator) modalModeIndicator.classList.add('style-hidden');
            document.querySelectorAll('.ayah-block').forEach(b => b.classList.remove('revealed'));
        }
    });
}

if (autoPlayToggleBtn) {
    autoPlayToggleBtn.addEventListener('click', () => {
        isAutoPlayAudioActive = !isAutoPlayAudioActive;
        if(isAutoPlayAudioActive) {
            autoPlayToggleBtn.classList.remove('muted');
            autoPlayToggleBtn.classList.add('active');
            autoPlayToggleBtn.querySelector('span').innerText = "التلاوة التلقائية: مفعّلة";
        } else {
            autoPlayToggleBtn.classList.remove('active');
            autoPlayToggleBtn.classList.add('muted');
            autoPlayToggleBtn.querySelector('span').innerText = "التلاوة التلقائية: معطّلة";
        }
    });
}

if (loopSurahBtn) {
    loopSurahBtn.addEventListener('click', () => {
        isLoopActive = !isLoopActive;
        if (isLoopActive) {
            loopSurahBtn.classList.add('active');
            loopStatus.innerText = "مفعل";
            if (isNextActive) {
                isNextActive = false;
                nextSurahBtn.classList.remove('active');
                nextStatus.innerText = "معطل";
                showToast("🔄 تم تعطيل الانتقال التلقائي بسبب تفعيل تكرار السورة");
            }
        } else {
            loopSurahBtn.classList.remove('active');
            loopStatus.innerText = "معطل";
        }
    });
}

if (nextSurahBtn) {
    nextSurahBtn.addEventListener('click', () => {
        isNextActive = !isNextActive;
        if (isNextActive) {
            nextSurahBtn.classList.add('active');
            nextStatus.innerText = "مفعل";
            if (isLoopActive) {
                isLoopActive = false;
                loopSurahBtn.classList.remove('active');
                loopStatus.innerText = "معطل";
                showToast("🌷 تم تعطيل تكرار السورة تلقائياً");
            }
        } else {
            nextSurahBtn.classList.remove('active');
            nextStatus.innerText = "معطل";
        }
    });
}

if (stopAtEndBtn) {
    stopAtEndBtn.addEventListener('click', () => {
        isStopAtEnd = !isStopAtEnd;
        if (isStopAtEnd) {
            stopAtEndBtn.classList.add('active');
            stopStatus.innerText = "مفعل";
            showToast("⏹️ سيتم التوقف عند نهاية المصحف");
        } else {
            stopAtEndBtn.classList.remove('active');
            stopStatus.innerText = "معطل";
        }
    });
}

// ===== أحداث الصوت =====
if (mainAudio) {
    mainAudio.addEventListener('ended', () => {
        if (!currentActiveSurahNum) return;
        
        if (isLoopActive) {
            playSurahAudio(currentActiveSurahNum, currentActiveSurahName || "المختارة");
            return;
        }
        
        if (isStopAtEnd && currentActiveSurahNum === 114) {
            showToast("🌷 تم الانتهاء من تلاوة المصحف كاملاً. جزاك الله خيراً.");
            return;
        }
        
        if (isNextActive) {
            let nextSurahNumber = currentActiveSurahNum + 1;
            if (nextSurahNumber > 114) {
                if (isStopAtEnd) {
                    showToast("🌷 تم الانتهاء من تلاوة المصحف كاملاً. جزاك الله خيراً.");
                    return;
                }
                nextSurahNumber = 1;
            }
            const nextSurahObj = allSurahs.find(s => s.number === nextSurahNumber);
            if (nextSurahObj) {
                currentActiveSurahNum = nextSurahObj.number;
                currentActiveSurahName = nextSurahObj.name;
                if (quranModal.style.display === 'block') openSurahReader(nextSurahObj.number, nextSurahObj.name);
                playSurahAudio(nextSurahObj.number, nextSurahObj.name);
            }
        }
    });
}

// ===== عناصر التحكم في التقدم =====
function updateAudioProgressBar() {
    if (mainAudio.duration && !isNaN(mainAudio.duration)) {
        const percent = (mainAudio.currentTime / mainAudio.duration) * 100;
        if (audioProgressBar) audioProgressBar.value = percent;
        const minutes = Math.floor(mainAudio.currentTime / 60);
        const seconds = Math.floor(mainAudio.currentTime % 60);
        if (currentTimeDisplay) currentTimeDisplay.textContent = `${minutes.toString().padStart(2,'0')}:${seconds.toString().padStart(2,'0')}`;
    }
}
function setAudioDuration() {
    if (mainAudio.duration && !isNaN(mainAudio.duration)) {
        const minutes = Math.floor(mainAudio.duration / 60);
        const seconds = Math.floor(mainAudio.duration % 60);
        if (durationDisplay) durationDisplay.textContent = `${minutes.toString().padStart(2,'0')}:${seconds.toString().padStart(2,'0')}`;
    }
}
function seekAudio(event) {
    if (audioProgressBar && mainAudio.duration) {
        const seekTime = (event.target.value / 100) * mainAudio.duration;
        mainAudio.currentTime = seekTime;
    }
}
if (mainAudio) {
    mainAudio.addEventListener('timeupdate', updateAudioProgressBar);
    mainAudio.addEventListener('loadedmetadata', setAudioDuration);
}
if (audioProgressBar) audioProgressBar.addEventListener('input', seekAudio);

// ===== إغلاق المودال =====
if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
        quranModal.style.display = 'none';
        document.body.style.overflow = 'auto';
        closeTafseerPopup();
        const modalBody = document.querySelector('.modal-body');
        if (modalBody && scrollListenerAttached) {
            modalBody.removeEventListener('scroll', loadMoreAyahs);
            scrollListenerAttached = false;
        }
    });
}

// ===== القائمة الجانبية =====
if (bookmarkSidebarToggle) {
    bookmarkSidebarToggle.addEventListener('click', () => {
        if (bookmarksSidebar) bookmarksSidebar.classList.add('open');
        if (sidebarOverlay) sidebarOverlay.classList.add('open');
    });
}
if (closeBookmarksSidebarBtn) {
    closeBookmarksSidebarBtn.addEventListener('click', () => {
        if (bookmarksSidebar) bookmarksSidebar.classList.remove('open');
        if (sidebarOverlay) sidebarOverlay.classList.remove('open');
    });
}
if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', () => {
        if (bookmarksSidebar) bookmarksSidebar.classList.remove('open');
        if (sidebarOverlay) sidebarOverlay.classList.remove('open');
    });
}

// ===== نافذة المعلومات =====
if (floatingInfoBtn) {
    floatingInfoBtn.addEventListener('click', () => {
        if (infoPopupModal) infoPopupModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    });
}
if (closeInfoModalBtn) {
    closeInfoModalBtn.addEventListener('click', () => {
        if (infoPopupModal) infoPopupModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    });
}
window.addEventListener('click', (e) => {
    if (e.target === infoPopupModal) {
        if (infoPopupModal) infoPopupModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
});

// ===== تبديل الوضع الليلي =====
if (darkModeToggleBtn) {
    darkModeToggleBtn.addEventListener('click', () => {
        const isDark = document.documentElement.hasAttribute('data-theme');
        applyDarkMode(!isDark);
        if (settingsDarkModeToggle) settingsDarkModeToggle.checked = !isDark;
    });
}

// بدء تشغيل التطبيق
initializeApp();
