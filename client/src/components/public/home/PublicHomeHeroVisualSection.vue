<template>
  <div class="home-hero-visual">
    <section class="hero-top-banner">
      <img src="/assets/images/banner1.png" alt="Y bác sĩ đang thao tác trong phòng mổ" loading="eager" />
    </section>

    <section class="hero-banner">
      <div class="hero-content">
        <p class="hero-tag">Chăm sóc sức khỏe toàn diện</p>
        <h1>Đặt lịch khám nhanh, đúng bác sĩ, đúng chuyên khoa</h1>
        <p>
          Hệ thống bệnh viện số giúp bạn tìm bác sĩ, xem chuyên khoa nổi bật
          và cập nhật thông báo mới nhất trong vài thao tác.
        </p>
        <div class="hero-content-actions">
          <RouterLink class="cta-primary" to="/patient/booking">Đặt lịch ngay</RouterLink>
          <RouterLink class="cta-secondary" to="/doctors">Xem danh sách bác sĩ</RouterLink>
        </div>
      </div>
    </section>

    <section class="section visual-row">
      <article class="visual-card">
        <img src="/assets/images/hospital.png" alt="Bác sĩ tư vấn bệnh nhân cao tuổi" loading="lazy" />
        <div>
          <h3>Tư vấn thân thiện</h3>
          <p>Đội ngũ bác sĩ luôn đồng hành và giải thích rõ ràng cho bệnh nhân.</p>
        </div>
      </article>

      <article class="visual-card">
        <img src="/assets/images/room.png" alt="Khu điều trị bệnh viện sạch sẽ" loading="lazy" />
        <div>
          <h3>Không gian hiện đại</h3>
          <p>Khu điều trị và cận lâm sàng được bố trí tối ưu cho quy trình khám nhanh.</p>
        </div>
      </article>

      <article class="visual-card">
        <img src="/assets/images/room2.png" alt="Phòng cấp cứu với đầy đủ giường bệnh" loading="lazy" />
        <div>
          <h3>Sẵn sàng 24/7</h3>
          <p>Năng lực tiếp nhận cấp cứu liên tục, đảm bảo phân tuyến và xử trí kịp thời.</p>
        </div>
      </article>
    </section>
  </div>
</template>

<style scoped>
.hero-top-banner {
  position: relative;
  width: 100vw;
  margin-left: calc(50% - 50vw);
  margin-right: calc(50% - 50vw);
  min-height: 580px;
  background: #0f172a;
  overflow: hidden;
}

.hero-top-banner img {
  width: 100%;
  height: 100%;
  min-height: 580px;
  object-fit: cover;
  display: block;
  filter: saturate(1.04) contrast(1.03);
}

.hero-banner {
  margin-top: 0;
  padding: 26px 34px 34px;
  border: 1px solid #93c5fd;
  background: linear-gradient(120deg, #eff6ff 0%, #f8fbff 100%);
}

.hero-content {
  display: grid;
  gap: 14px;
}

.hero-tag {
  margin: 0;
  text-transform: uppercase;
  font-size: 11px;
  letter-spacing: 0.08em;
  color: #1d4ed8;
}

.hero-content h1 {
  margin: 0;
  max-width: 760px;
  font-size: 34px;
  line-height: 1.2;
}

.hero-content p {
  margin: 0;
  max-width: 860px;
  color: #334155;
}

.hero-content-actions {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.cta-primary,
.cta-secondary {
  min-width: 172px;
  min-height: 44px;
  border: 1px solid rgba(255, 255, 255, 0.7);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  color: #0f172a;
  padding: 0 14px;
  box-sizing: border-box;
}

.cta-primary {
  background: #1d4ed8;
  border-color: #1d4ed8;
  color: #ffffff;
}

.cta-secondary {
  background: #ffffff;
  border-color: #cbd5e1;
}

.section {
  border: 1px solid #d1d5db;
  background: #ffffff;
  padding: 28px;
}

.visual-row {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.visual-card {
  border: 1px solid #dbe2ea;
  background: #f8fafc;
  display: grid;
  grid-template-rows: 170px auto;
}

.visual-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.visual-card div {
  padding: 14px;
}

.visual-card h3 {
  margin: 0 0 8px;
}

.visual-card p {
  margin: 0;
  color: #334155;
}

@media (max-width: 900px) {
  .hero-top-banner {
    min-height: 300px;
  }

  .hero-top-banner img {
    min-height: 300px;
  }

  .hero-banner {
    padding: 22px 18px;
  }

  .hero-content h1 {
    font-size: 28px;
  }

  .visual-row {
    grid-template-columns: 1fr;
  }
}
</style>
