<template>
  <footer class="public-footer">
    <div class="footer-inner">
      <div>
        <strong>Hospital Management</strong>
        <p>Address: 199 Nguyen Hoang, Ho Chi Minh City</p>
        <p>Hotline: 1900 3493</p>
      </div>
      <div class="footer-links">
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/public">Public Portal</RouterLink>
        <RouterLink to="/login">Login</RouterLink>
        <RouterLink to="/register">Register</RouterLink>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.public-footer {
  width: 100%;
  border-top: 1px solid #d1d5db;
  background: #f9fafb;
  margin-top: 24px;
}

.footer-inner {
  width: 100%;
  box-sizing: border-box;
  padding: 20px 28px;
  display: grid;
  gap: 14px;
  grid-template-columns: 2fr 1fr;
}

.footer-inner p {
  margin: 6px 0 0;
}

.footer-links {
  display: grid;
  gap: 8px;
}

.footer-links a {
  color: #1d4ed8;
  text-decoration: none;
}

@media (max-width: 900px) {
  .footer-inner {
    grid-template-columns: 1fr;
    padding: 18px 16px;
  }
}
</style>