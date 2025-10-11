# ⚡ Quick Setup Guide - 5 Minute Integration

## 🎯 Setup Rapid (Cei mai importanți pași)

### 1️⃣ Creează Proiectul Flutter
```bash
flutter create japanese_tutor
cd japanese_tutor
```

### 2️⃣ Copiază Fișierele
```bash
# Copiază tot din flutter_integration/lib în proiectul tău
cp -r flutter_integration/lib/* japanese_tutor/lib/

# Copiază pubspec.yaml
cp flutter_integration/pubspec.yaml japanese_tutor/pubspec.yaml
```

### 3️⃣ Instalează Dependencies
```bash
cd japanese_tutor
flutter pub get
```

### 4️⃣ Configurează Backend URL

**Deschide:** `lib/config/api_config.dart`

**Alege configurația potrivită:**

```dart
// 🖥️ Pentru development local (iOS Simulator)
static const String baseUrl = 'http://localhost:3000/api';

// 📱 Pentru Android Emulator
static const String baseUrl = 'http://10.0.2.2:3000/api';

// 📲 Pentru Device Fizic (înlocuiește X cu IP-ul tău)
static const String baseUrl = 'http://192.168.1.X:3000/api';
```

**💡 Cum găsești IP-ul computerului:**
- **Windows:** `ipconfig` în CMD
- **Mac/Linux:** `ifconfig` sau `ip addr` în Terminal

### 5️⃣ Asigură-te că Backend-ul Rulează
```bash
cd backend
npm start
# Verifică: http://localhost:3000/api/health
```

### 6️⃣ Rulează Flutter App
```bash
flutter run
```

---

## 🎨 Customizare Demo UI

Demo-ul este în `lib/screens/home_screen.dart`

**Pentru a integra cu Provider (recomandat):**

1. **Instalează Provider** (deja în pubspec.yaml)
2. **Înlocuiește setState cu Provider calls**
3. **Vezi exemplu complet în:** `FLUTTER_INTEGRATION_GUIDE.md`

---

## ✅ Verificare Rapidă

### Test 1: Backend Health Check
```bash
curl http://localhost:3000/api/health
# Ar trebui să returneze: {"status":"healthy"}
```

### Test 2: Flutter Connection
În aplicație, trimite un mesaj de test: "Hello"
- Dacă primești răspuns → ✅ Funcționează!
- Dacă eroare → Vezi Troubleshooting mai jos

---

## 🔧 Troubleshooting Express

### ❌ "Connection refused"
**Cauză:** Flutter nu poate ajunge la backend

**Soluție:**
1. Verifică că backend rulează: `http://localhost:3000/api/health`
2. Pentru **Android emulator**: Folosește `10.0.2.2` în loc de `localhost`
3. Pentru **device fizic**: Folosește IP-ul computerului (nu localhost)

### ❌ "CORS error"
**Cauză:** Backend blochează requests de la Flutter

**Soluție:**
În `backend/server.js`, verifică:
```javascript
app.use(cors({
  origin: '*', // Permite toate origin-urile în development
  credentials: true
}));
```

### ❌ "Timeout"
**Cauză:** Request-ul durează prea mult

**Soluție:**
În `lib/config/api_config.dart`, crește timeout:
```dart
static const Duration receiveTimeout = Duration(seconds: 120);
```

---

## 📱 Device-Specific Setup

### Pentru Android:
1. USB Debugging activat
2. Device conectat via USB
3. Modifică `api_config.dart` cu IP-ul computerului
4. `flutter run`

### Pentru iOS:
1. Device conectat
2. Certificat de developer configurat
3. Trust computer pe device
4. `flutter run`

---

## 🎉 Succes!

După ce merge, explorează:
- 📚 **FLUTTER_INTEGRATION_GUIDE.md** - Setup detaliat
- 🔧 **lib/services/api_service.dart** - Toate API calls
- 🎨 **lib/screens/home_screen.dart** - UI demo

**Happy coding! 💙**
