export class JsonPresenter {
  success(res, data, status = 200, code = 'success', message = 'OK') {
    if (res && typeof res.status === 'function') {
      res.status(status).json({ data, code, message });
    }
  }

  error(res, message, status = 400, code = 'error') {
    if (res && typeof res.status === 'function') {
      res.status(status).json({ data: null, code, message });
    }
  }
}
