export class JsonPresenter {
  success(res, data, status = 200) {
    if (res && typeof res.status === 'function') {
      res.status(status).json({ data });
    }
  }

  error(res, message, status = 400) {
    if (res && typeof res.status === 'function') {
      res.status(status).json({ error: message });
    }
  }
}
