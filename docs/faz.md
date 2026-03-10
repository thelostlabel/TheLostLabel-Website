# Proje Hafıza Bankası & Yol Haritası (Fazlar)

Bu belge, botun gelişim sürecini, yapılan değişiklikleri ve gelecek planlarını takip etmek için oluşturulmuştur.

## 🚀 Mevcut Durum (Özet)
- **Modüler Yapı**: Tüm kodlar `src/` altına taşındı ve düzenlendi.
- **Spotify Servisi**: Arama ve aylık dinleyici çekme (Playwright) stabil çalışıyor.
- **Gemini Entegrasyonu**: 2.0 Flash modeli yapılandırıldı.

## 📅 Fazlar

### Faz 1: Temel Yapı ve Spotify (TAMAMLANDI)
- [x] Proje klasörlerinin oluşturulması (`src/core`, `src/services`, `src/ui`)
- [x] Monolitik `bot.py`'nin parçalanması
- [x] Spotify API ve Playwright entegrasyonu
- [x] Slash komutlarının (`/artist`) senkronizasyonu

### Faz 2: AI Entegrasyonu (GÜNCELLENİYOR)
- [x] `src/services/ai_service.py` oluşturulması (Gemini 2.0 Flash)
- [x] `/ask` komutunun eklenmesi
- [/] AI Grounding (Google Search) entegrasyonu (Güncel bilgi için)
- [ ] AI prompt optimizasyonu (Kısa ve öz cevaplar)
- [x] `google-genai` kütüphanesinin gereksinimlere eklenmesi

### Faz 3: Kişiselleştirme ve Hafıza
- [ ] Kullanıcı bazlı "Kişilik" ayarları (JSON veya MiniDB)
- [ ] Kullanıcının botun cevap stilini seçebilmesi
- [ ] AI için kısa süreli konuşma geçmişi (Context)

### Faz 4: Performans ve İnce Ayarlar
- [ ] Playwright browser yönetimi (Memory leak önleme)
- [ ] Hata yakalama sisteminin geliştirilmesi (Loglama)

### Faz 5: AI Yönetim Sistemi (/manage) (YENİ)
- [ ] `Action Registry` ve Güvenlik Protokolleri
- [ ] Oturum bazlı planlama ve revizyon sistemi
- [ ] Sunucu durumu özetleme (Context Collector)
- [ ] Admin onaylı otomasyon uygulaması

---
> [!TIP]
> **Not**: Botun zekası Gemini 2.0 Flash üzerine kuruludur. `/ask` komutu tüm kullanıcılar için açık olacaktır.
