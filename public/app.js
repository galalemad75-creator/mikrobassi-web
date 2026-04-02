// ===== State =====
let currentUser = null;
let currentTrip = null;
let currentDriver = null;
let selectedCar = 'suzuki';
let passCount = 1;
let isDark = false;
let lang = 'ar';
let onboardPage = 0;
let otpCode = null;
let otpTimerInterval = null;
let homeMap = null;
let trackMap = null;
let homeMarker = null;

// Cairo coords
const CAIRO = [30.0444, 31.2357];

// ===== i18n =====
const I18N = {
  ar: {
    search_placeholder: 'إلى أين تريد الذهاب؟',
    where_to_go: 'إلى أين تريد الذهاب؟',
    request_van: 'طلب فان',
    nav_home: 'الرئيسية', nav_profile: 'حسابي', nav_settings: 'الإعدادات',
    book_trip: 'حجز رحلة',
    pickup_label: 'نقطة الانطلاق', dest_label: 'الوجهة',
    enter_pickup: 'أدخل نقطة الانطلاق', enter_dest: 'أدخل وجهتك',
    van_type: 'نوع الفان', passengers: 'عدد الركاب',
    confirm_request: 'تأكيد الطلب',
    end_trip: 'إنهاء الرحلة', cancel_trip: 'إلغاء الرحلة',
    trip_done: 'تم إنهاء الرحلة بنجاح!',
    van_type_label: 'نوع الفان', from_label: 'من', to_label: 'إلى',
    distance_label: 'المسافة', pass_label: 'الركاب',
    total_fare: 'إجمالي الأجرة', rate_trip: 'قيّم رحلتك', new_trip: 'رحلة جديدة',
    my_account: 'حسابي', trip_history: 'سجل الرحلات', no_trips: 'لا توجد رحلات سابقة',
    settings_title: 'الإعدادات', appearance: 'المظهر',
    dark_mode: 'الوضع الليلي', language: 'اللغة', lang_label: 'اللغة',
    app_section: 'التطبيق', notifications: 'الإشعارات', enabled: 'مفعّلة',
    location_svc: 'خدمات الموقع', support: 'الدعم',
    help: 'المساعدة والأسئلة الشائعة', contact: 'تواصل معنا',
    about: 'حول', about_app: 'عن التطبيق', logout: 'تسجيل الخروج',
    emergency_title: 'مشاركة حالة الطوارئ',
    emergency_desc: 'سيتم مشاركة موقعك الحالي مع جهات الاتصال الطارئة',
    cancel: 'إلغاء', share: 'مشاركة', edit_name: 'تعديل الاسم', save: 'حفظ',
    searching: 'جارٍ البحث عن سائق...',
    driver_found: 'تم العثور على سائق!',
    driver_arriving: 'السائق في الطريق إليك',
    trip_in_progress: 'الرحلة جارية',
    arriving_eta: 'وقت الوصول: ',
    dest_eta: 'وقت الوصول للوجهة: ',
    invalid_phone: 'رقم هاتف غير صحيح (يبدأ بـ 10 أو 11 أو 12 أو 15)',
    otp_sent: 'تم إرسال الرمز!',
    otp_wrong: 'رمز غير صحيح',
    trip_cancelled: 'تم إلغاء الرحلة',
    name_saved: 'تم حفظ الاسم',
    emergency_shared: 'تم مشاركة موقعك',
    logout_done: 'تم تسجيل الخروج',
  },
  en: {
    search_placeholder: 'Where do you want to go?',
    where_to_go: 'Where do you want to go?',
    request_van: 'Request Van',
    nav_home: 'Home', nav_profile: 'Profile', nav_settings: 'Settings',
    book_trip: 'Book Trip',
    pickup_label: 'Pickup Point', dest_label: 'Destination',
    enter_pickup: 'Enter pickup location', enter_dest: 'Enter destination',
    van_type: 'Van Type', passengers: 'Passengers',
    confirm_request: 'Confirm Request',
    end_trip: 'End Trip', cancel_trip: 'Cancel Trip',
    trip_done: 'Trip Completed Successfully!',
    van_type_label: 'Van Type', from_label: 'From', to_label: 'To',
    distance_label: 'Distance', pass_label: 'Passengers',
    total_fare: 'Total Fare', rate_trip: 'Rate Your Trip', new_trip: 'New Trip',
    my_account: 'My Account', trip_history: 'Trip History', no_trips: 'No previous trips',
    settings_title: 'Settings', appearance: 'Appearance',
    dark_mode: 'Dark Mode', language: 'Language', lang_label: 'Language',
    app_section: 'App', notifications: 'Notifications', enabled: 'Enabled',
    location_svc: 'Location Services', support: 'Support',
    help: 'Help & FAQ', contact: 'Contact Us',
    about: 'About', about_app: 'About App', logout: 'Log Out',
    emergency_title: 'Share Emergency',
    emergency_desc: 'Your current location will be shared with emergency contacts',
    cancel: 'Cancel', share: 'Share', edit_name: 'Edit Name', save: 'Save',
    searching: 'Searching for driver...',
    driver_found: 'Driver found!',
    driver_arriving: 'Driver is on the way',
    trip_in_progress: 'Trip in progress',
    arriving_eta: 'Arriving in: ',
    dest_eta: 'ETA to destination: ',
    invalid_phone: 'Invalid phone number',
    otp_sent: 'Code sent!',
    otp_wrong: 'Wrong code',
    trip_cancelled: 'Trip cancelled',
    name_saved: 'Name saved',
    emergency_shared: 'Location shared',
    logout_done: 'Logged out',
  }
};

function t(key) { return (I18N[lang] || I18N.ar)[key] || key; }

function applyI18n() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
}

// ===== Navigation =====
function goTo(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(screenId);
  if (el) el.classList.add('active');

  // Init maps
  if (screenId === 'home' && !homeMap) initHomeMap();
  if (screenId === 'tracking') initTrackMap();
  if (screenId === 'profile') loadProfile();
}

// ===== Toast =====
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

// ===== Theme =====
function toggleTheme() {
  isDark = !isDark;
  document.body.classList.toggle('dark', isDark);
  localStorage.setItem('mikrobassi_dark', isDark);
  updateThemeUI();
}
function updateThemeUI() {
  const btn = document.getElementById('themeToggle');
  if (btn) btn.textContent = isDark ? '☀️' : '🌙';
  const icon = document.getElementById('themeIcon');
  if (icon) icon.textContent = isDark ? '☀️' : '🌙';
  const status = document.getElementById('themeStatus');
  if (status) status.textContent = isDark ? (lang === 'ar' ? 'مفعّل' : 'Enabled') : (lang === 'ar' ? 'معطّل' : 'Disabled');
  const sw = document.getElementById('themeSwitch');
  if (sw) sw.classList.toggle('on', isDark);
}

// ===== Language =====
function toggleLang() {
  lang = lang === 'ar' ? 'en' : 'ar';
  document.body.classList.toggle('en', lang === 'en');
  document.documentElement.dir = lang === 'en' ? 'ltr' : 'rtl';
  document.documentElement.lang = lang;
  localStorage.setItem('mikrobassi_lang', lang);
  applyI18n();
  updateThemeUI();
  const langSt = document.getElementById('langStatus');
  if (langSt) langSt.textContent = lang === 'ar' ? 'العربية' : 'English';
}

// ===== Onboarding =====
function nextOnboard() {
  if (onboardPage < 2) {
    onboardPage++;
    document.querySelectorAll('.onboard-page').forEach((p, i) => p.classList.toggle('active', i === onboardPage));
    document.querySelectorAll('.dot').forEach((d, i) => d.classList.toggle('active', i === onboardPage));
    if (onboardPage === 2) document.getElementById('onboardNext').textContent = lang === 'ar' ? 'ابدأ الآن' : 'Start';
  } else {
    localStorage.setItem('mikrobassi_onboarded', '1');
    goTo('login');
  }
}

// ===== OTP =====
function sendOtp() {
  const phone = document.getElementById('phoneInput').value.trim();
  if (!phone.match(/^(10|11|12|15)\d{8}$/)) {
    document.getElementById('phoneHint').textContent = t('invalid_phone');
    return;
  }
  document.getElementById('phoneHint').textContent = '';

  fetch('/api/send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone })
  })
  .then(r => r.json())
  .then(data => {
    if (data.success) {
      otpCode = data.dev_code;
      document.getElementById('otpDesc').textContent = (lang === 'ar' ? 'أرسلنا رمز إلى ' : 'Code sent to ') + '+20' + phone;
      document.getElementById('otpCodeDisplay').textContent = otpCode;
      document.getElementById('otpDisplay').style.display = 'block';
      document.querySelectorAll('#otpInputs input').forEach(i => i.value = '');
      document.querySelectorAll('#otpInputs input')[0].focus();
      startOtpTimer();
      goTo('otp');
      showToast(t('otp_sent'));
    }
  })
  .catch(() => showToast('Error'));
}

function startOtpTimer() {
  let sec = 60;
  const timerEl = document.getElementById('otpTimer');
  const resendBtn = document.getElementById('resendBtn');
  resendBtn.disabled = true;
  clearInterval(otpTimerInterval);
  otpTimerInterval = setInterval(() => {
    sec--;
    timerEl.textContent = (lang === 'ar' ? 'إعادة الإرسال بعد ' : 'Resend in ') + sec + (lang === 'ar' ? ' ثانية' : 's');
    if (sec <= 0) {
      clearInterval(otpTimerInterval);
      resendBtn.disabled = false;
      timerEl.textContent = '';
    }
  }, 1000);
}

function verifyOtp() {
  const code = [...document.querySelectorAll('#otpInputs input')].map(i => i.value).join('');
  if (code.length < 4) return;
  const phone = document.getElementById('phoneInput').value.trim();

  fetch('/api/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, code })
  })
  .then(r => r.json())
  .then(data => {
    if (data.success) {
      currentUser = data.user;
      localStorage.setItem('mikrobassi_user', JSON.stringify(currentUser));
      clearInterval(otpTimerInterval);
      goTo('home');
    } else {
      showToast(data.error || t('otp_wrong'));
      document.querySelectorAll('#otpInputs input').forEach(i => i.value = '');
      document.querySelectorAll('#otpInputs input')[0].focus();
    }
  });
}

// ===== Car Selection =====
function selectCar(type) {
  selectedCar = type;
  document.querySelectorAll('.car-card').forEach(c => c.classList.toggle('selected', c.dataset.type === type));
  updateFare();
}

// ===== Passenger Counter =====
function changePass(delta) {
  passCount = Math.max(1, Math.min(6, passCount + delta));
  document.getElementById('passCount').textContent = passCount;
}

// ===== Fare Calculation =====
function updateFare() {
  const pickup = document.getElementById('pickupInput').value;
  const dest = document.getElementById('destInput').value;
  if (!pickup || !dest) return;

  // Simulated coords based on locations
  const locations = {
    'ميدان التحرير': [30.0444, 31.2357],
    'مدينة نصر': [30.0626, 31.3245],
    'الهرم': [29.9773, 31.1325],
    'المعادي': [29.9602, 31.2569],
    'الزمالك': [30.0605, 31.2186],
    'مصر الجديدة': [30.0876, 31.3292],
  };

  let pickupCoords = [30.0444, 31.2357];
  let destCoords = [30.0626, 31.3245];

  for (const [name, coords] of Object.entries(locations)) {
    if (pickup.includes(name)) pickupCoords = coords;
    if (dest.includes(name)) destCoords = coords;
  }

  fetch('/api/estimate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      carType: selectedCar,
      pickupLat: pickupCoords[0], pickupLng: pickupCoords[1],
      destLat: destCoords[0], destLng: destCoords[1]
    })
  })
  .then(r => r.json())
  .then(data => {
    document.getElementById('fareAmount').textContent = data.fare + ' ج.م';
    document.getElementById('fareDist').textContent = data.distance + ' كم';
    document.getElementById('fareTime').textContent = data.duration + ' دقيقة';
    document.getElementById('fareComm').textContent = 'عمولة ' + data.commission + ' ج.م';
    document.querySelector('.fare-car-name').textContent = selectedCar === 'suzuki' ? 'سوزوكي' : 'شيفروليه';
  });
}

// ===== Confirm Trip =====
function confirmTrip() {
  if (!currentUser) { goTo('login'); return; }

  const pickup = document.getElementById('pickupInput').value;
  const dest = document.getElementById('destInput').value;
  if (!dest) { showToast(lang === 'ar' ? 'أدخل الوجهة' : 'Enter destination'); return; }

  const locations = {
    'ميدان التحرير': [30.0444, 31.2357],
    'مدينة نصر': [30.0626, 31.3245],
    'الهرم': [29.9773, 31.1325],
    'المعادي': [29.9602, 31.2569],
    'الزمالك': [30.0605, 31.2186],
    'مصر الجديدة': [30.0876, 31.3292],
  };

  let pickupCoords = [30.0444, 31.2357];
  let destCoords = [30.0626, 31.3245];
  for (const [name, coords] of Object.entries(locations)) {
    if (pickup.includes(name)) pickupCoords = coords;
    if (dest.includes(name)) destCoords = coords;
  }

  fetch('/api/trip', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: currentUser.id,
      carType: selectedCar,
      passengerCount: passCount,
      pickup, pickupLat: pickupCoords[0], pickupLng: pickupCoords[1],
      destination: dest, destLat: destCoords[0], destLng: destCoords[1]
    })
  })
  .then(r => r.json())
  .then(data => {
    currentTrip = data.trip;
    goTo('tracking');
    simulateTripFlow();
  });
}

// ===== Trip Simulation =====
function simulateTripFlow() {
  const statusBadge = document.getElementById('statusBadge');
  const statusText = document.getElementById('statusText');
  const driverCard = document.getElementById('driverCard');
  const finishBtn = document.getElementById('finishBtn');
  const cancelBtn = document.getElementById('cancelBtn');
  const trackEta = document.getElementById('trackEta');
  const etaText = document.getElementById('etaText');

  // Phase 1: Searching
  statusBadge.className = 'status-badge';
  statusText.textContent = t('searching');
  driverCard.style.display = 'none';
  finishBtn.style.display = 'none';
  cancelBtn.style.display = 'block';
  trackEta.style.display = 'none';

  // Phase 2: Find driver
  setTimeout(() => {
    fetch('/api/find-driver', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tripId: currentTrip.id, carType: selectedCar })
    })
    .then(r => r.json())
    .then(data => {
      if (!data.success) { showToast(data.message); return; }
      currentDriver = data.driver;

      statusBadge.className = 'status-badge assigned';
      statusText.textContent = t('driver_found');

      document.getElementById('driverAvatar').textContent = currentDriver.name[0];
      document.getElementById('driverName').textContent = currentDriver.name;
      document.getElementById('driverDetails').textContent =
        (selectedCar === 'suzuki' ? 'سوزوكي' : 'شيفروليه') + ' - ' + currentDriver.plateNumber;
      document.getElementById('driverRating').textContent = currentDriver.rating.toFixed(1);
      driverCard.style.display = 'flex';

      // Phase 3: Arriving
      setTimeout(() => {
        statusText.textContent = t('driver_arriving');
        trackEta.style.display = 'block';
        etaText.textContent = t('arriving_eta') + '5 ' + (lang === 'ar' ? 'دقائق' : 'min');

        // Phase 4: In progress
        setTimeout(() => {
          statusText.textContent = t('trip_in_progress');
          etaText.textContent = t('dest_eta') + '12 ' + (lang === 'ar' ? 'دقيقة' : 'min');
          finishBtn.style.display = 'block';
          cancelBtn.style.display = 'none';
        }, 3000);
      }, 2000);
    });
  }, 2000);
}

// ===== Finish Trip =====
function finishTrip() {
  if (!currentTrip) return;

  fetch('/api/trip/' + currentTrip.id + '/status', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'completed' })
  })
  .then(() => {
    // Fill summary
    document.getElementById('sumCarType').textContent = selectedCar === 'suzuki' ? 'سوزوكي' : 'شيفروليه';
    document.getElementById('sumFrom').textContent = currentTrip.pickup;
    document.getElementById('sumTo').textContent = currentTrip.destination;
    document.getElementById('sumDist').textContent = currentTrip.distance + ' كم';
    document.getElementById('sumPass').textContent = currentTrip.passengerCount;
    document.getElementById('sumFare').textContent = currentTrip.fare + ' ج.م';
    goTo('tripSummary');
  });
}

// ===== Cancel Trip =====
function cancelTrip() {
  currentTrip = null;
  currentDriver = null;
  showToast(t('trip_cancelled'));
  goTo('home');
}

// ===== Rating =====
document.getElementById('starRating')?.addEventListener('click', (e) => {
  const star = e.target.closest('.star');
  if (!star) return;
  const val = +star.dataset.v;
  document.querySelectorAll('.star').forEach((s, i) => s.classList.toggle('active', i < val));
  if (currentTrip) {
    fetch('/api/trip/' + currentTrip.id + '/rate', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating: val })
    });
  }
});

// ===== Emergency =====
function showEmergency() { document.getElementById('emergencyModal').classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }
function shareEmergency() {
  closeModal('emergencyModal');
  showToast(t('emergency_shared'));
}

// ===== Profile =====
function loadProfile() {
  if (!currentUser) return;
  document.getElementById('profileAvatar').textContent = currentUser.name[0];
  document.getElementById('profileName').textContent = currentUser.name;
  document.getElementById('profilePhone').textContent = currentUser.phone;

  fetch('/api/trips/' + currentUser.id)
    .then(r => r.json())
    .then(data => {
      const trips = data.trips || [];
      document.getElementById('statTrips').textContent = trips.length;
      document.getElementById('statTotal').textContent = trips.reduce((s, t) => s + t.fare, 0) + ' ج.م';

      const list = document.getElementById('tripHistory');
      if (trips.length === 0) {
        list.innerHTML = `<p class="empty-msg">${t('no_trips')}</p>`;
      } else {
        list.innerHTML = trips.map(tr => `
          <div class="trip-item">
            <div class="trip-item-icon">🚐</div>
            <div class="trip-item-info">
              <strong>${tr.carType === 'suzuki' ? 'سوزوكي' : 'شيفروليه'}</strong>
              <span>${tr.pickup} → ${tr.destination}</span>
            </div>
            <div class="trip-item-fare">
              <strong>${tr.fare} ج.م</strong>
              <small>⭐ ${tr.rating || '-'}</small>
            </div>
          </div>
        `).join('');
      }
    });
}

// ===== Edit Name =====
function editName() {
  if (currentUser) document.getElementById('editNameInput').value = currentUser.name;
  document.getElementById('editNameModal').classList.add('active');
}
function saveName() {
  const name = document.getElementById('editNameInput').value.trim();
  if (!name || !currentUser) return;
  fetch('/api/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: currentUser.id, name })
  })
  .then(r => r.json())
  .then(data => {
    if (data.success) {
      currentUser = data.user;
      localStorage.setItem('mikrobassi_user', JSON.stringify(currentUser));
      loadProfile();
      closeModal('editNameModal');
      showToast(t('name_saved'));
    }
  });
}

// ===== Logout =====
function logout() {
  currentUser = null;
  localStorage.removeItem('mikrobassi_user');
  showToast(t('logout_done'));
  goTo('login');
}

// ===== Maps =====
function initHomeMap() {
  try {
    homeMap = L.map('homeMap', { zoomControl: false }).setView(CAIRO, 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(homeMap);
    homeMarker = L.marker(CAIRO).addTo(homeMap).bindPopup('📍 موقعك');
  } catch(e) { console.log('Map error:', e); }
}

function initTrackMap() {
  try {
    if (trackMap) { trackMap.invalidateSize(); return; }
    setTimeout(() => {
      trackMap = L.map('trackMap', { zoomControl: false }).setView(CAIRO, 14);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
      }).addTo(trackMap);
      L.marker(CAIRO).addTo(trackMap).bindPopup('📍 موقعك');
    }, 100);
  } catch(e) { console.log('Track map error:', e); }
}

// ===== OTP Input Auto-advance =====
document.querySelectorAll('#otpInputs input').forEach((input, idx, inputs) => {
  input.addEventListener('input', () => {
    if (input.value && idx < 3) inputs[idx + 1].focus();
    if (input.value && idx === 3) verifyOtp();
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace' && !input.value && idx > 0) inputs[idx - 1].focus();
  });
});

// ===== Booking input change =====
document.getElementById('destInput')?.addEventListener('change', updateFare);
document.getElementById('pickupInput')?.addEventListener('change', updateFare);

// ===== Init =====
(function init() {
  // Load saved preferences
  isDark = localStorage.getItem('mikrobassi_dark') === 'true';
  lang = localStorage.getItem('mikrobassi_lang') || 'ar';
  document.body.classList.toggle('dark', isDark);
  document.body.classList.toggle('en', lang === 'en');
  document.documentElement.dir = lang === 'en' ? 'ltr' : 'rtl';
  document.documentElement.lang = lang;
  applyI18n();
  updateThemeUI();

  // Check saved user
  const savedUser = localStorage.getItem('mikrobassi_user');
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
  }

  // Check if onboarding done
  const onboarded = localStorage.getItem('mikrobassi_onboarded');

  // Splash delay then navigate
  setTimeout(() => {
    if (currentUser) {
      goTo('home');
    } else if (onboarded) {
      goTo('login');
    } else {
      goTo('onboarding');
    }
  }, 2000);
})();
